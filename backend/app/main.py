import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.auth import router as auth_router, get_current_user, require_subscription, decrement_free_uses, get_optional_user
from app.admin import router as admin_router
from app.contact import router as contact_router
from app.subscription import router as subscription_router
from app.config import settings
from app.graph.state import AgentState
from app.graph.workflow import analysis_graph
from app.graph.copilot import chat_with_copilot
from app.middleware import setup_rate_limiter, limiter, SecurityHeadersMiddleware, RequestLoggingMiddleware
from app.models.auth import UserProfileResponse
from app.models.schemas import (
    ActionRequest,
    ActionResponse,
    ActionType,
    ArtifactInfo,
    ChatMessage,
    CopilotChatRequest,
    CopilotChatResponse,
    DatasetMetadata,
    UploadResponse,
    ReportGenerateRequest,
    ReportGenerateResponse,
    AnalysisHistoryItem,
    AnalysisHistoryResponse,
)
from app.parser import format_schema_for_llm, parse_file, read_dataset_into_df
from app.sandbox.runner import execute_script_in_sandbox, get_mime_type
from app.data.profiler import profile_dataset
from app.data.health_score import calculate_health_score
from app.data.recommendations import generate_recommendations
from app.data.versioning import DatasetVersionManager
from app.reports.generator import build_executive_html_report, build_multisheet_excel_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_data_analyst")

app = FastAPI(
    title="AI Data Scientist Platform API",
    description="Backend orchestration with LangGraph, OpenRouter, and E2B Sandbox Execution",
    version="2.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT == "development" else None,
)

# ==================== Middleware Stack ====================

# Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# Request Logging
app.add_middleware(RequestLoggingMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if settings.cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting
setup_rate_limiter(app)

# ==================== Routers ====================

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(contact_router)
app.include_router(subscription_router)

# ==================== In-memory storage ====================

FILE_REGISTRY: Dict[str, Dict] = {}
ARTIFACT_REGISTRY: Dict[str, Dict] = {}
version_manager = DatasetVersionManager(base_dir=settings.VERSION_DIR)


# ==================== Health Check ====================

@app.get("/api/health")
@limiter.limit(settings.RATE_LIMIT_GENERAL)
async def health_check(request: Request):
    return {
        "status": "online",
        "llm_provider": "openrouter" if settings.OPENROUTER_API_KEY else "openai/other",
        "primary_model": settings.PRIMARY_MODEL,
        "fallback_model": settings.FALLBACK_MODEL,
        "e2b_configured": bool(settings.E2B_API_KEY and settings.E2B_API_KEY.strip()),
        "environment": settings.ENVIRONMENT,
    }


# ==================== File Upload (requires auth + subscription) ====================

@app.post("/api/upload", response_model=UploadResponse)
@limiter.limit(settings.RATE_LIMIT_ACTION)
async def upload_dataset(
    request: Request,
    file: UploadFile = File(...),
    current_user: UserProfileResponse = Depends(require_subscription),
):
    """
    Accepts tabular dataset upload (.csv, .xlsx, .xls, .txt, .json),
    saves to disk, parses schema & df.head(), and returns lightweight footprint.
    Requires authentication and active subscription (or free uses remaining).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_ext = Path(file.filename).suffix.lower()
    allowed_exts = [".csv", ".xlsx", ".xls", ".txt", ".json"]
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: {', '.join(allowed_exts)}",
        )

    # Check file size limit
    file.file.seek(0, 2)  # seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # seek back to start
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum allowed size ({settings.MAX_UPLOAD_SIZE_MB} MB)",
        )

    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}_{Path(file.filename).name}"
    save_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    try:
        # Save file to disk
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Parse file and extract metadata
        df, metadata = parse_file(save_path, file.filename)

        # Auto-profile dataset
        try:
            df_for_profile = read_dataset_into_df(save_path)
            dataset_profile = profile_dataset(df_for_profile, file.filename)
            health = calculate_health_score(dataset_profile)
            recommendations = generate_recommendations(dataset_profile, health)
            
            # Save original version
            version_manager.save_version(file_id, df_for_profile, "Original Upload")
        except Exception as e:
            logger.warning(f"Profiling failed (non-blocking): {e}")
            dataset_profile = None
            health = None
            recommendations = None

        # Register file session
        FILE_REGISTRY[file_id] = {
            "file_id": file_id,
            "original_filename": file.filename,
            "file_path": save_path,
            "metadata": metadata,
            "profile": dataset_profile,
            "health_score": health,
            "recommendations": recommendations,
            "user_id": current_user.id,
        }

        # Update user stats
        try:
            from app.auth import get_db
            with get_db() as conn:
                conn.execute(
                    "UPDATE users SET datasets_uploaded = datasets_uploaded + 1 WHERE id = ?",
                    (current_user.id,),
                )
                conn.commit()
        except Exception:
            pass

        return UploadResponse(
            success=True,
            file_id=file_id,
            original_filename=file.filename,
            file_path=save_path,
            metadata=metadata,
            message="File uploaded and parsed successfully",
            profile=dataset_profile,
            health_score=health,
            recommendations=recommendations,
        )

    except Exception as e:
        logger.error(f"Error processing uploaded file {file.filename}: {e}", exc_info=True)
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=422, detail=f"Failed to parse dataset: {str(e)}")


@app.get("/api/datasets/{file_id}/preview", response_model=DatasetMetadata)
async def get_dataset_preview(file_id: str):
    """Retrieve metadata and df.head() preview for an uploaded dataset."""
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Dataset not found or session expired")
    return FILE_REGISTRY[file_id]["metadata"]


@app.get("/api/datasets/{file_id}/profile")
async def get_dataset_profile(file_id: str):
    """Get full dataset profile, health score, and recommendations."""
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Dataset not found")
    session = FILE_REGISTRY[file_id]
    return {
        "profile": session.get("profile"),
        "health_score": session.get("health_score"),
        "recommendations": session.get("recommendations"),
    }

@app.get("/api/datasets/{file_id}/versions")
async def list_dataset_versions(file_id: str):
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Dataset not found")
    versions = version_manager.list_versions(file_id)
    return {"versions": versions}

@app.post("/api/datasets/{file_id}/versions/{version_id}/restore")
async def restore_dataset_version(file_id: str, version_id: str):
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Dataset not found")
    try:
        df = version_manager.get_version(file_id, version_id)
        # Overwrite the current file
        session = FILE_REGISTRY[file_id]
        df.to_csv(session["file_path"], index=False)
        # Re-profile
        metadata = parse_file(session["file_path"], session["original_filename"])[1]
        session["metadata"] = metadata
        
        # Profile again
        dataset_profile = profile_dataset(df, session["original_filename"])
        health = calculate_health_score(dataset_profile)
        recommendations = generate_recommendations(dataset_profile, health)
        
        session["profile"] = dataset_profile
        session["health_score"] = health
        session["recommendations"] = recommendations
        
        return {"success": True, "message": f"Restored to version {version_id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/copilot/chat", response_model=CopilotChatResponse)
async def copilot_chat_endpoint(req: CopilotChatRequest):
    """
    Interactive conversational AI data scientist copilot.
    Answers natural language questions with dataset context, suggesting next actions and smart follow-ups.
    """
    if req.file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Dataset session not found. Please re-upload.")
    session_data = FILE_REGISTRY[req.file_id]
    return chat_with_copilot(session_data, req.message, req.history)


@app.post("/api/action", response_model=ActionResponse)
@limiter.limit(settings.RATE_LIMIT_ACTION)
async def run_data_action(
    request: Request,
    action_request: ActionRequest,
    current_user: UserProfileResponse = Depends(require_subscription),
):
    """
    Trigger an AI data analysis action.
    Requires authentication and active subscription (or free uses remaining).
    """
    file_id = action_request.file_id
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Dataset not found. Please re-upload the file.")

    session_data = FILE_REGISTRY[file_id]
    metadata: DatasetMetadata = session_data["metadata"]
    dataset_path = session_data["file_path"]
    dataset_filename = session_data["original_filename"]

    # Target format determination
    target_format = "csv"
    if action_request.action == ActionType.VISUALIZE:
        target_format = "html"
    elif action_request.action == ActionType.INSIGHTS:
        target_format = "json"
    elif action_request.output_format:
        target_format = action_request.output_format.value

    # Format schema for LLM
    schema_str = format_schema_for_llm(metadata)

    # Prepare LangGraph state
    initial_state: AgentState = {
        "user_action": action_request.action.value,
        "dataset_metadata": metadata.model_dump(),
        "dataset_schema_str": schema_str,
        "dataset_filename": dataset_filename,
        "dataset_path": dataset_filename,
        "user_instructions": None,
        "target_column": action_request.target_column,
        "target_format": target_format,
        "raw_llm_response": None,
        "generated_code": None,
        "expected_artifact_path": None,
        "error": None,
    }

    try:
        # 1. Run LangGraph workflow
        logger.info(f"Invoking LangGraph for action='{action_request.action.value}', file='{dataset_filename}'")
        final_state = analysis_graph.invoke(initial_state)

        generated_code = final_state.get("generated_code")
        if not generated_code:
            raise ValueError("LLM did not generate executable Python code.")

        expected_artifact = final_state.get("expected_artifact_path") or f"output.{target_format}"

        # 2. Execute script in Sandbox
        logger.info(f"Executing script in sandbox for {expected_artifact}...")
        exec_result = execute_script_in_sandbox(
            code=generated_code,
            dataset_path=dataset_path,
            dataset_filename=dataset_filename,
            expected_artifact_name=expected_artifact,
        )

        artifact_info = None
        insights_data = None
        version_saved = None

        artifacts_list = []

        if exec_result.additional_artifacts:
            for item in exec_result.additional_artifacts:
                art_id = str(uuid.uuid4())
                art_name = f"{art_id}_{item['filename']}"
                art_path = os.path.join(settings.ARTIFACT_DIR, art_name)

                with open(art_path, "wb") as f:
                    f.write(item["bytes"])

                m_type = get_mime_type(item["filename"])
                ARTIFACT_REGISTRY[art_id] = {
                    "file_path": art_path,
                    "filename": item["filename"],
                    "mime_type": m_type,
                }

                h_content = None
                if item["type"] == "html":
                    try:
                        h_content = item["bytes"].decode("utf-8")
                    except Exception:
                        pass

                # Parse JSON if insights
                if item["filename"].endswith(".json"):
                    try:
                        import json
                        parsed_json = json.loads(item["bytes"].decode("utf-8"))
                        if action_request.action == ActionType.INSIGHTS or "insights" in parsed_json:
                            insights_data = parsed_json
                    except Exception:
                        pass



                a_info = ArtifactInfo(
                    filename=item["filename"],
                    file_type=item["type"],
                    mime_type=m_type,
                    size_bytes=len(item["bytes"]),
                    download_url=f"/api/artifacts/{art_id}",
                    html_content=h_content,
                )
                artifacts_list.append(a_info)

                if item["filename"] == exec_result.artifact_filename or artifact_info is None:
                    artifact_info = a_info
        elif exec_result.artifact_bytes and exec_result.artifact_filename:
            artifact_id = str(uuid.uuid4())
            saved_artifact_name = f"{artifact_id}_{exec_result.artifact_filename}"
            saved_artifact_path = os.path.join(settings.ARTIFACT_DIR, saved_artifact_name)

            with open(saved_artifact_path, "wb") as f:
                f.write(exec_result.artifact_bytes)

            mime_type = get_mime_type(exec_result.artifact_filename)

            ARTIFACT_REGISTRY[artifact_id] = {
                "file_path": saved_artifact_path,
                "filename": exec_result.artifact_filename,
                "mime_type": mime_type,
            }

            html_content = None
            if exec_result.artifact_type == "html":
                try:
                    html_content = exec_result.artifact_bytes.decode("utf-8")
                except Exception:
                    html_content = None

            if exec_result.artifact_filename.endswith(".json"):
                try:
                    import json
                    parsed_json = json.loads(exec_result.artifact_bytes.decode("utf-8"))
                    if action_request.action == ActionType.INSIGHTS or "insights" in parsed_json:
                        insights_data = parsed_json
                except Exception:
                    insights_data = None



            artifact_info = ArtifactInfo(
                filename=exec_result.artifact_filename,
                file_type=exec_result.artifact_type or "file",
                mime_type=mime_type,
                size_bytes=len(exec_result.artifact_bytes),
                download_url=f"/api/artifacts/{artifact_id}",
                html_content=html_content,
            )
            artifacts_list.append(artifact_info)

        # 3. Post-clean Auto-Versioning & Profile Refresh
        if exec_result.success and action_request.action == ActionType.CLEAN and exec_result.artifact_bytes:
            try:
                import io
                import pandas as pd
                if exec_result.artifact_filename.endswith(".csv"):
                    cleaned_df = pd.read_csv(io.BytesIO(exec_result.artifact_bytes))
                elif exec_result.artifact_filename.endswith((".xlsx", ".xls")):
                    cleaned_df = pd.read_excel(io.BytesIO(exec_result.artifact_bytes))
                else:
                    cleaned_df = None

                if cleaned_df is not None:
                    # Save version snapshot
                    label = f"Cleaned ({action_request.custom_prompt[:25]}...)" if action_request.custom_prompt else "Cleaned & Transformed"
                    v_meta = version_manager.save_version(file_id, cleaned_df, label)
                    version_saved = v_meta["version_id"]

                    # Update dataset file on disk
                    cleaned_df.to_csv(dataset_path, index=False)

                    # Refresh metadata and intelligence profile
                    new_metadata = parse_file(dataset_path, dataset_filename)[1]
                    new_profile = profile_dataset(cleaned_df, dataset_filename)
                    new_health = calculate_health_score(new_profile)
                    new_recs = generate_recommendations(new_profile, new_health)

                    session_data["metadata"] = new_metadata
                    session_data["profile"] = new_profile
                    session_data["health_score"] = new_health
                    session_data["recommendations"] = new_recs
                    logger.info(f"Auto-saved version {v_meta['version_id']} for file_id={file_id}")
            except Exception as ve:
                logger.warning(f"Failed to auto-version cleaned dataset: {ve}")

        # 4. Log analysis history to SQLite + decrement free uses
        try:
            from app.auth import get_db
            import datetime
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO analyses (id, file_id, user_id, action, custom_prompt, target_column, success, execution_time_seconds, artifact_filename, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()),
                        file_id,
                        current_user.id,
                        action_request.action.value,
                        action_request.custom_prompt,
                        action_request.target_column,
                        1 if exec_result.success else 0,
                        exec_result.execution_time_seconds,
                        exec_result.artifact_filename,
                        datetime.datetime.now().isoformat(),
                    ),
                )
                # Update user analyses count
                conn.execute(
                    "UPDATE users SET analyses_performed = analyses_performed + 1 WHERE id = ?",
                    (current_user.id,),
                )
                conn.commit()

            # Decrement free uses after successful action
            if exec_result.success:
                decrement_free_uses(current_user.id)

        except Exception as le:
            logger.warning(f"Failed to log analysis record: {le}")

        return ActionResponse(
            success=exec_result.success,
            action=action_request.action,
            generated_code=generated_code,
            stdout=exec_result.stdout,
            stderr=exec_result.stderr,
            artifact=artifact_info,
            artifacts=artifacts_list,
            execution_time_seconds=exec_result.execution_time_seconds,
            insights_data=insights_data,
            version_saved=version_saved,
            error=exec_result.error,
        )

    except Exception as e:
        logger.error(f"Error during action execution: {e}", exc_info=True)
        return ActionResponse(
            success=False,
            action=action_request.action,
            generated_code=initial_state.get("generated_code") or "",
            stdout="",
            stderr=str(e),
            artifact=None,
            execution_time_seconds=0.0,
            error=str(e),
        )


@app.get("/api/artifacts/{artifact_id}")
async def download_artifact(artifact_id: str):
    """Serve or download a generated output artifact."""
    if artifact_id in ARTIFACT_REGISTRY:
        art = ARTIFACT_REGISTRY[artifact_id]
        file_path = art["file_path"]
        filename = art["filename"]
        mime_type = art["mime_type"]
    else:
        # Check if matching artifact file exists on disk in ARTIFACT_DIR
        found_path = None
        found_name = None
        if os.path.exists(settings.ARTIFACT_DIR):
            for fname in os.listdir(settings.ARTIFACT_DIR):
                if fname == artifact_id or fname.endswith(f"_{artifact_id}") or fname.startswith(f"{artifact_id}_"):
                    found_path = os.path.join(settings.ARTIFACT_DIR, fname)
                    found_name = fname.split("_", 1)[1] if "_" in fname else fname
                    break
        if not found_path:
            raise HTTPException(status_code=404, detail="Artifact not found or expired")
        file_path = found_path
        filename = found_name or artifact_id
        mime_type = get_mime_type(filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Artifact file missing on disk")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=mime_type,
    )


@app.post("/api/datasets/{file_id}/report", response_model=ReportGenerateResponse)
async def generate_dataset_report(file_id: str, req: ReportGenerateRequest):
    """
    Generate an Executive Data Science Report in HTML or Excel format.
    """
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Dataset session not found")

    session_data = FILE_REGISTRY[file_id]

    # Query analysis history from SQLite
    history_items = []
    try:
        from app.auth import get_db
        with get_db() as conn:
            cursor = conn.execute(
                "SELECT action, success, target_column, execution_time_seconds, created_at FROM analyses WHERE file_id = ? ORDER BY created_at DESC",
                (file_id,),
            )
            for row in cursor.fetchall():
                history_items.append({
                    "action": row["action"],
                    "success": bool(row["success"]),
                    "target_column": row["target_column"],
                    "execution_time_seconds": row["execution_time_seconds"],
                    "created_at": row["created_at"],
                })
    except Exception as e:
        logger.warning(f"Failed to fetch analyses history for report: {e}")

    # Read dataframe if needed
    df = None
    try:
        df = read_dataset_into_df(session_data["file_path"])
    except Exception:
        pass

    art_id = str(uuid.uuid4())
    fmt = req.format.lower()

    if fmt in ["xlsx", "excel"]:
        content_bytes = build_multisheet_excel_report(session_data, history_items, df)
        filename = f"executive_report_{session_data.get('original_filename', 'data')}.xlsx"
        mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        fmt = "html"
        html_str = build_executive_html_report(session_data, history_items, df)
        content_bytes = html_str.encode("utf-8")
        filename = f"executive_report_{session_data.get('original_filename', 'data')}.html"
        mime_type = "text/html"

    art_path = os.path.join(settings.ARTIFACT_DIR, f"{art_id}_{filename}")
    with open(art_path, "wb") as f:
        f.write(content_bytes)

    ARTIFACT_REGISTRY[art_id] = {
        "file_path": art_path,
        "filename": filename,
        "mime_type": mime_type,
    }

    return ReportGenerateResponse(
        success=True,
        format=fmt,
        filename=filename,
        download_url=f"/api/artifacts/{art_id}",
        message=f"Executive {fmt.upper()} report generated successfully.",
    )


@app.post("/api/models/{file_id}/predict")
async def predict_what_if(file_id: str):
    """
    Real-time What-If model inference simulator.
    Loads the trained pipeline model and evaluates prediction on custom feature values.
    """
    raise HTTPException(status_code=501, detail="Prediction feature is temporarily disabled.")


@app.get("/api/analyses/history", response_model=AnalysisHistoryResponse)
async def get_analyses_history(file_id: Optional[str] = None):
    """
    Retrieve audit history of analyses and experiment runs from SQLite.
    """
    history_items = []
    try:
        from app.auth import get_db
        with get_db() as conn:
            if file_id:
                cursor = conn.execute(
                    "SELECT id, file_id, action, custom_prompt, target_column, success, execution_time_seconds, artifact_filename, created_at FROM analyses WHERE file_id = ? ORDER BY created_at DESC",
                    (file_id,),
                )
            else:
                cursor = conn.execute(
                    "SELECT id, file_id, action, custom_prompt, target_column, success, execution_time_seconds, artifact_filename, created_at FROM analyses ORDER BY created_at DESC LIMIT 50"
                )

            for row in cursor.fetchall():
                history_items.append(
                    AnalysisHistoryItem(
                        id=row["id"],
                        file_id=row["file_id"],
                        action=row["action"],
                        custom_prompt=row["custom_prompt"],
                        target_column=row["target_column"],
                        success=bool(row["success"]),
                        execution_time_seconds=float(row["execution_time_seconds"] or 0.0),
                        artifact_filename=row["artifact_filename"],
                        created_at=row["created_at"],
                    )
                )
    except Exception as e:
        logger.warning(f"Failed to fetch analyses history: {e}")

    return AnalysisHistoryResponse(history=history_items)
