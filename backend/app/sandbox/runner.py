import asyncio
import io
import logging
import os
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ExecutionResult:
    success: bool
    stdout: str
    stderr: str
    artifact_filename: Optional[str] = None
    artifact_bytes: Optional[bytes] = None
    artifact_type: Optional[str] = None
    execution_time_seconds: float = 0.0
    error: Optional[str] = None


def get_mime_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext == ".csv":
        return "text/csv"
    elif ext in [".xlsx", ".xls"]:
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif ext == ".html":
        return "text/html"
    elif ext == ".json":
        return "application/json"
    return "application/octet-stream"


def run_code_in_e2b(
    code: str,
    dataset_path: str,
    dataset_filename: str,
    expected_artifact_name: str,
    timeout: int = 120,
) -> ExecutionResult:
    """
    Executes Python script securely inside an ephemeral E2B Code Interpreter sandbox.
    """
    start_time = time.time()
    try:
        from e2b_code_interpreter import Sandbox

        # Read local dataset
        with open(dataset_path, "rb") as f:
            dataset_bytes = f.read()

        logger.info(f"Initializing E2B Sandbox with API key...")
        with Sandbox(api_key=settings.E2B_API_KEY) as sandbox:
            # 1. Upload dataset into sandbox workspace
            sandbox.files.write(dataset_filename, dataset_bytes)
            # Also write alias 'dataset.csv' if the script uses standard alias
            sandbox.files.write("dataset.csv", dataset_bytes)

            # 2. Run the generated Python code
            logger.info("Running code inside E2B sandbox...")
            execution = sandbox.run_code(code)

            stdout = "\n".join(execution.logs.stdout) if execution.logs.stdout else ""
            stderr = "\n".join(execution.logs.stderr) if execution.logs.stderr else ""

            if execution.error:
                error_msg = f"{execution.error.name}: {execution.error.value}\n{execution.error.traceback}"
                return ExecutionResult(
                    success=False,
                    stdout=stdout,
                    stderr=stderr,
                    error=error_msg,
                    execution_time_seconds=round(time.time() - start_time, 2),
                )

            # 3. Read back the artifact
            artifact_bytes = None
            artifact_filename = None
            artifact_type = None

            # Check if expected artifact exists in sandbox
            try:
                artifact_bytes = sandbox.files.read(expected_artifact_name, format="bytes")
                artifact_filename = expected_artifact_name
                artifact_type = Path(expected_artifact_name).suffix.lstrip(".").lower()
            except Exception as e:
                logger.warning(f"Could not find {expected_artifact_name} in sandbox: {e}")
                # Try finding alternative files
                for alt_name in ["output_cleaned.csv", "output_cleaned.xlsx", "output_plot.html", "output_predictions.csv"]:
                    try:
                        artifact_bytes = sandbox.files.read(alt_name, format="bytes")
                        artifact_filename = alt_name
                        artifact_type = Path(alt_name).suffix.lstrip(".").lower()
                        break
                    except Exception:
                        continue

            return ExecutionResult(
                success=True,
                stdout=stdout,
                stderr=stderr,
                artifact_filename=artifact_filename,
                artifact_bytes=artifact_bytes,
                artifact_type=artifact_type,
                execution_time_seconds=round(time.time() - start_time, 2),
            )

    except Exception as e:
        logger.error(f"E2B execution error: {e}", exc_info=True)
        return ExecutionResult(
            success=False,
            stdout="",
            stderr=str(e),
            error=str(e),
            execution_time_seconds=round(time.time() - start_time, 2),
        )


def run_code_locally_isolated(
    code: str,
    dataset_path: str,
    dataset_filename: str,
    expected_artifact_name: str,
    timeout: int = 60,
) -> ExecutionResult:
    """
    Executes Python script in an isolated temporary directory using subprocess with timeout.
    Serves as a robust development/offline fallback when E2B is not configured.
    """
    start_time = time.time()
    temp_dir = tempfile.mkdtemp(prefix="data_analyst_sandbox_")

    try:
        # Copy dataset into isolated temporary sandbox directory
        target_dataset_path = os.path.join(temp_dir, dataset_filename)
        shutil.copyfile(dataset_path, target_dataset_path)

        # Also create standard alias 'dataset.csv' if filename differs
        standard_alias_path = os.path.join(temp_dir, "dataset.csv")
        if not os.path.exists(standard_alias_path):
            shutil.copyfile(dataset_path, standard_alias_path)

        # Write script to run
        script_path = os.path.join(temp_dir, "sandbox_runner.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)

        # Execute script in isolated temp directory
        result = subprocess.run(
            [sys.executable, script_path],
            cwd=temp_dir,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )

        stdout = result.stdout or ""
        stderr = result.stderr or ""
        success = result.returncode == 0

        # Read back the artifact
        artifact_bytes = None
        artifact_filename = None
        artifact_type = None

        expected_path = os.path.join(temp_dir, expected_artifact_name)
        if os.path.exists(expected_path):
            with open(expected_path, "rb") as f:
                artifact_bytes = f.read()
            artifact_filename = expected_artifact_name
            artifact_type = Path(expected_artifact_name).suffix.lstrip(".").lower()
        else:
            # Check standard known alternatives
            for alt_name in [
                "output_cleaned.csv",
                "output_cleaned.xlsx",
                "output_plot.html",
                "output_predictions.csv",
                "output_predictions.xlsx",
                "predictions.csv",
                "cleaned_data.csv",
                "plot.html",
            ]:
                alt_path = os.path.join(temp_dir, alt_name)
                if os.path.exists(alt_path):
                    with open(alt_path, "rb") as f:
                        artifact_bytes = f.read()
                    artifact_filename = alt_name
                    artifact_type = Path(alt_name).suffix.lstrip(".").lower()
                    break
            else:
                # Scan directory for any generated output file (ignoring script & input dataset)
                ignored_names = {"sandbox_runner.py", dataset_filename, "dataset.csv"}
                for fname in os.listdir(temp_dir):
                    if fname not in ignored_names and fname.endswith((".csv", ".xlsx", ".html", ".json")):
                        fpath = os.path.join(temp_dir, fname)
                        with open(fpath, "rb") as f:
                            artifact_bytes = f.read()
                        artifact_filename = fname
                        artifact_type = Path(fname).suffix.lstrip(".").lower()
                        break

        error_msg = stderr if not success else None

        return ExecutionResult(
            success=success,
            stdout=stdout,
            stderr=stderr,
            artifact_filename=artifact_filename,
            artifact_bytes=artifact_bytes,
            artifact_type=artifact_type,
            execution_time_seconds=round(time.time() - start_time, 2),
            error=error_msg,
        )

    except subprocess.TimeoutExpired:
        return ExecutionResult(
            success=False,
            stdout="",
            stderr=f"Execution timed out after {timeout} seconds.",
            error="Execution timeout",
            execution_time_seconds=round(time.time() - start_time, 2),
        )
    except Exception as e:
        return ExecutionResult(
            success=False,
            stdout="",
            stderr=str(e),
            error=str(e),
            execution_time_seconds=round(time.time() - start_time, 2),
        )
    finally:
        # Clean up temporary sandbox directory
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass


def execute_script_in_sandbox(
    code: str,
    dataset_path: str,
    dataset_filename: str,
    expected_artifact_name: str,
) -> ExecutionResult:
    """
    Top-level execution entry point.
    Routes to E2B Code Interpreter if E2B_API_KEY is configured;
    otherwise gracefully executes in an isolated environment.
    """
    if settings.E2B_API_KEY and settings.E2B_API_KEY.strip():
        logger.info("Executing in E2B Cloud Sandbox...")
        return run_code_in_e2b(code, dataset_path, dataset_filename, expected_artifact_name)
    else:
        logger.info("Executing in local isolated sandbox...")
        return run_code_locally_isolated(code, dataset_path, dataset_filename, expected_artifact_name)
