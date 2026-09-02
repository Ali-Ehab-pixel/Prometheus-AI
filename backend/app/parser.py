import csv
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd

from app.models.schemas import ColumnInfo, DatasetMetadata


def _sanitize_value_for_json(val: Any) -> Any:
    """Helper to ensure all Python/NumPy values can be JSON-serialized."""
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        if np.isnan(val) or np.isinf(val):
            return None
        return float(val)
    if isinstance(val, (np.bool_, bool)):
        return bool(val)
    if isinstance(val, (pd.Timestamp, np.datetime64)):
        return str(val)
    return str(val)


def read_dataset_into_df(file_path: str) -> pd.DataFrame:
    """
    Reads a tabular file (.csv, .xlsx, .xls, .txt, .json) into a pandas DataFrame.
    Includes robust fallback delimiter detection for .txt/.csv files.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = path.suffix.lower()

    if ext in [".csv", ".txt"]:
        try:
            # First check first few lines to detect delimiter
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                sample = f.read(8192)
            
            # Detect separator
            sep = ","
            if "\t" in sample and sample.count("\t") > sample.count(","):
                sep = "\t"
            elif ";" in sample and sample.count(";") > sample.count(","):
                sep = ";"
            elif "|" in sample and sample.count("|") > sample.count(","):
                sep = "|"
            else:
                try:
                    dialect = csv.Sniffer().sniff(sample)
                    sep = dialect.delimiter
                except Exception:
                    sep = ","

            df = pd.read_csv(file_path, sep=sep, engine="python", on_bad_lines="skip", encoding="utf-8")
        except Exception:
            try:
                # Fallback to standard read_csv
                df = pd.read_csv(file_path, sep=None, engine="python", on_bad_lines="skip")
            except Exception as e:
                raise ValueError(f"Failed to read CSV/TXT file: {str(e)}")

    elif ext in [".xlsx", ".xls"]:
        try:
            df = pd.read_excel(file_path, engine="openpyxl")
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {str(e)}")

    elif ext == ".json":
        try:
            # Try reading directly (records or orient)
            df = pd.read_json(file_path)
        except Exception:
            # Try JSON Lines or nested json loading
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                df = pd.json_normalize(data)
            elif isinstance(data, dict):
                # Check for standard 'data' or 'records' key
                for key in ["data", "records", "items", "results"]:
                    if key in data and isinstance(data[key], list):
                        df = pd.json_normalize(data[key])
                        break
                else:
                    df = pd.DataFrame([data])
            else:
                raise ValueError("JSON structure must be an object or array of objects.")
    else:
        raise ValueError(f"Unsupported file format: {ext}. Supported formats: .csv, .xlsx, .xls, .txt, .json")

    # Clean column names (strip leading/trailing whitespaces)
    df.columns = [str(col).strip() for col in df.columns]
    return df


def extract_metadata(df: pd.DataFrame, filename: str) -> DatasetMetadata:
    """
    Extracts high-fidelity dataset footprint: schema, data types, missing counts,
    sample values, first 5 rows (df.head()), and descriptive stats.
    """
    file_ext = Path(filename).suffix.lstrip(".").lower() or "csv"
    row_count = int(len(df))
    col_count = int(len(df.columns))

    columns_info: List[ColumnInfo] = []
    for col in df.columns:
        series = df[col]
        dtype_str = str(series.dtype)
        null_count = int(series.isna().sum())
        unique_count = int(series.nunique(dropna=True))

        # Grab up to 3 non-null sample values
        non_null_samples = series.dropna().head(3).tolist()
        sample_values = [_sanitize_value_for_json(v) for v in non_null_samples]

        columns_info.append(
            ColumnInfo(
                name=str(col),
                dtype=dtype_str,
                null_count=null_count,
                unique_count=unique_count,
                sample_values=sample_values,
            )
        )

    # First 5 rows for preview
    head_df = df.head(5)
    head_rows = []
    for _, row in head_df.iterrows():
        row_dict = {}
        for col in df.columns:
            row_dict[str(col)] = _sanitize_value_for_json(row[col])
        head_rows.append(row_dict)

    # Numerical Summary Statistics
    summary_stats: Dict[str, Any] = {}
    try:
        num_df = df.select_dtypes(include=[np.number])
        if not num_df.empty:
            describe_dict = num_df.describe().to_dict()
            clean_describe = {}
            for col_name, stats in describe_dict.items():
                clean_describe[col_name] = {k: _sanitize_value_for_json(v) for k, v in stats.items()}
            summary_stats["numeric_summary"] = clean_describe
    except Exception:
        summary_stats["numeric_summary"] = {}

    # Memory usage in MB
    memory_usage_mb = float(df.memory_usage(deep=True).sum() / (1024 * 1024))

    return DatasetMetadata(
        filename=filename,
        file_type=file_ext,
        row_count=row_count,
        col_count=col_count,
        columns=columns_info,
        head_rows=head_rows,
        summary_stats=summary_stats,
        memory_usage_mb=round(memory_usage_mb, 3),
    )


def parse_file(file_path: str, original_filename: str) -> Tuple[pd.DataFrame, DatasetMetadata]:
    """Parse file from disk and return both pandas DataFrame and DatasetMetadata."""
    df = read_dataset_into_df(file_path)
    metadata = extract_metadata(df, original_filename)
    return df, metadata


def format_schema_for_llm(metadata: DatasetMetadata) -> str:
    """
    Formats the schema and df.head() into a dense, structured string
    that gives the LLM precise context on columns, types, nulls, and preview rows.
    """
    col_lines = []
    for c in metadata.columns:
        samples_str = ", ".join([str(s) for s in c.sample_values])
        col_lines.append(
            f"- `{c.name}` ({c.dtype}): {c.null_count} nulls, {c.unique_count} unique values. Examples: [{samples_str}]"
        )
    cols_text = "\n".join(col_lines)

    head_json = json.dumps(metadata.head_rows, indent=2)

    return f"""### Dataset Overview:
- File Name: `{metadata.filename}`
- Total Rows: {metadata.row_count}
- Total Columns: {metadata.col_count}
- Memory Footprint: {metadata.memory_usage_mb} MB

### Column Footprint & Types:
{cols_text}

### First 5 Rows (df.head()):
```json
{head_json}
```
"""
