import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.graph.state import AgentState
from app.graph.workflow import analysis_graph
from app.models.schemas import (
    ActionRequest,
    ActionResponse,
    ActionType,
    ArtifactInfo,
    DatasetMetadata,
    UploadResponse,
)
from app.parser import format_schema_for_llm, parse_file
from app.sandbox.runner import execute_script_in_sandbox, get_mime_type

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_data_analyst")

app = FastAPI(
    title="AI Data Analyst Platform API",
    description="Backend orchestration with LangGraph, OpenRouter, and E2B Sandbox Execution",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if settings.cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for active file sessions: file_id -> { "file_path", "filename", "metadata" }
FILE_REGISTRY: Dict[str, Dict] = {}
ARTIFACT_REGISTRY: Dict[str, Dict] = {}


@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "llm_provider": "openrouter" if settings.OPENROUTER_API_KEY else "openai/other",
        "primary_model": settings.PRIMARY_MODEL,
        "fallback_model": settings.FALLBACK_MODEL,
        "e2b_configured": bool(settings.E2B_API_KEY and settings.E2B_API_KEY.strip()),
        "environment": settings.ENVIRONMENT,
    }


@app.post("/api/upload", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """
    Accepts tabular dataset upload (.csv, .xlsx, .xls, .txt, .json),
    saves to disk, parses schema & df.head(), and returns lightweight footprint.
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

    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}_{Path(file.filename).name}"
    save_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    try:
        # Save file to disk
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Parse file and extract metadata
        df, metadata = parse_file(save_path, file.filename)

        # Register file session
        FILE_REGISTRY[file_id] = {
            "file_id": file_id,
            "original_filename": file.filename,
            "file_path": save_path,
            "metadata": metadata,
        }

        return UploadResponse(
            success=True,
            file_id=file_id,
            original_filename=file.filename,
            file_path=save_path,
            metadata=metadata,
            message="File uploaded and parsed successfully",
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


@app.post("/api/action", response_model=ActionResponse)
async def run_data_action(request: ActionRequest):
    """
    Trigger an AI data analysis action:
    1. Look up dataset footprint.
    2. Route to specialized agent in LangGraph state machine.
    3. Generate pure Python code.
    4. Execute inside E2B Sandbox or isolated environment.
    5. Return generated code, execution logs, and downloadable/renderable artifacts.
    """
    file_id = request.file_id
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Dataset not found. Please re-upload the file.")

    session_data = FILE_REGISTRY[file_id]
    metadata: DatasetMetadata = session_data["metadata"]
    dataset_path = session_data["file_path"]
    dataset_filename = session_data["original_filename"]

    # Target format determination
    target_format = "csv"
    if request.action == ActionType.VISUALIZE:
        target_format = "html"
    elif request.output_format:
        target_format = request.output_format.value

    # Format schema for LLM
    schema_str = format_schema_for_llm(metadata)

    # Prepare LangGraph state
    initial_state: AgentState = {
        "user_action": request.action.value,
        "dataset_metadata": metadata.model_dump(),
        "dataset_schema_str": schema_str,
        "dataset_filename": dataset_filename,
        "dataset_path": dataset_filename,  # In sandbox, dataset is copied as original filename or dataset.csv
        "user_instructions": request.custom_prompt,
        "target_column": request.target_column,
        "target_format": target_format,
        "raw_llm_response": None,
        "generated_code": None,
        "expected_artifact_path": None,
        "error": None,
    }

    try:
        # 1. Run LangGraph workflow
        logger.info(f"Invoking LangGraph for action='{request.action.value}', file='{dataset_filename}'")
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
        if exec_result.artifact_bytes and exec_result.artifact_filename:
            # Save artifact to artifacts directory
            artifact_id = str(uuid.uuid4())
            saved_artifact_name = f"{artifact_id}_{exec_result.artifact_filename}"
            saved_artifact_path = os.path.join(settings.ARTIFACT_DIR, saved_artifact_name)

            with open(saved_artifact_path, "wb") as f:
                f.write(exec_result.artifact_bytes)

            mime_type = get_mime_type(exec_result.artifact_filename)

            # Store in registry
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

            artifact_info = ArtifactInfo(
                filename=exec_result.artifact_filename,
                file_type=exec_result.artifact_type or "file",
                mime_type=mime_type,
                size_bytes=len(exec_result.artifact_bytes),
                download_url=f"/api/artifacts/{artifact_id}",
                html_content=html_content,
            )

        return ActionResponse(
            success=exec_result.success,
            action=request.action,
            generated_code=generated_code,
            stdout=exec_result.stdout,
            stderr=exec_result.stderr,
            artifact=artifact_info,
            execution_time_seconds=exec_result.execution_time_seconds,
            error=exec_result.error,
        )

    except Exception as e:
        logger.error(f"Error during action execution: {e}", exc_info=True)
        return ActionResponse(
            success=False,
            action=request.action,
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
    if artifact_id not in ARTIFACT_REGISTRY:
        raise HTTPException(status_code=404, detail="Artifact not found or expired")

    art = ARTIFACT_REGISTRY[artifact_id]
    file_path = art["file_path"]
    filename = art["filename"]
    mime_type = art["mime_type"]

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Artifact file missing on disk")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=mime_type,
    )
