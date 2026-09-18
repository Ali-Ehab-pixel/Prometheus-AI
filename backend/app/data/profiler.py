import pandas as pd
import numpy as np

def profile_dataset(df: pd.DataFrame, filename: str) -> dict:
    row_count, col_count = df.shape
    memory_usage = df.memory_usage(deep=True).sum() / (1024 * 1024) # MB
    
    profile = {
        "filename": filename,
        "row_count": row_count,
        "col_count": col_count,
        "memory_usage_mb": float(memory_usage),
        "file_type": filename.split('.')[-1] if '.' in filename else "unknown",
        "columns": [],
        "quality_issues": [],
        "target_suggestions": [],
        "correlation_matrix": {}
    }

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    # Correlation matrix
    if len(numeric_cols) > 1:
        try:
            corr = df[numeric_cols].corr(method='pearson')
            profile["correlation_matrix"] = corr.where(pd.notnull(corr), None).to_dict()
        except Exception:
            profile["correlation_matrix"] = {}

    target_suggestions = []
    
    for i, col in enumerate(df.columns):
        col_series = df[col]
        dtype = str(col_series.dtype)
        null_count = int(col_series.isnull().sum())
        null_percentage = float(null_count / row_count) if row_count > 0 else 0.0
        unique_count = int(col_series.nunique(dropna=True))
        cardinality_ratio = float(unique_count / row_count) if row_count > 0 else 0.0
        
        col_profile = {
            "name": col,
            "dtype": dtype,
            "null_count": null_count,
            "null_percentage": null_percentage,
            "unique_count": unique_count,
            "cardinality_ratio": cardinality_ratio,
            "quality_issues": [],
            "stats": None,
            "top_values": None
        }

        # Quality Issues
        if null_percentage > 0.5:
            col_profile["quality_issues"].append("high_missing")
            profile["quality_issues"].append({"column": col, "issue": "high_missing"})
            
        if unique_count == 1:
            col_profile["quality_issues"].append("constant_column")
            profile["quality_issues"].append({"column": col, "issue": "constant_column"})
            
        if unique_count == row_count and row_count > 1 and unique_count > 1:
            col_profile["quality_issues"].append("potential_id")
            profile["quality_issues"].append({"column": col, "issue": "potential_id"})
            
        # Mixed types roughly estimated by object dtype not being string
        if dtype == 'object':
            # Not fully perfect, but simple check
            types = col_series.dropna().map(type).nunique()
            if types > 1:
                col_profile["quality_issues"].append("mixed_types")
                profile["quality_issues"].append({"column": col, "issue": "mixed_types"})

        if pd.api.types.is_numeric_dtype(col_series):
            stats = col_series.describe()
            col_profile["stats"] = {
                "min": float(stats.get('min', 0)),
                "max": float(stats.get('max', 0)),
                "mean": float(stats.get('mean', 0)),
                "median": float(col_series.median()),
                "std": float(stats.get('std', 0)),
                "q25": float(stats.get('25%', 0)),
                "q75": float(stats.get('75%', 0))
            }
            
            # Outliers (IQR)
            q1 = col_profile["stats"]["q25"]
            q3 = col_profile["stats"]["q75"]
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            outliers = col_series[(col_series < lower_bound) | (col_series > upper_bound)]
            if len(outliers) > 0:
                col_profile["quality_issues"].append("has_outliers")
                profile["quality_issues"].append({"column": col, "issue": "has_outliers"})

        elif pd.api.types.is_datetime64_any_dtype(col_series):
            col_profile["stats"] = {
                "min": str(col_series.min()),
                "max": str(col_series.max())
            }
        else:
            # Categorical / Object
            val_counts = col_series.value_counts().head(5)
            col_profile["top_values"] = [{"value": str(k), "count": int(v)} for k, v in val_counts.items()]

        # Target detection rules
        col_lower = col.lower()
        if col_lower in ['target', 'label', 'class', 'y', 'outcome', 'status', 'churn']:
            target_suggestions.append(col)
        elif unique_count == 2 and null_percentage < 0.2:
            target_suggestions.append(col)
        elif i == len(df.columns) - 1 and unique_count < 20 and null_percentage < 0.2:
            # Last column and seems categorical
            target_suggestions.append(col)
            
        profile["columns"].append(col_profile)
        
    # Duplicate rows and global null metrics
    duplicate_rows = int(df.duplicated().sum())
    total_null_count = int(df.isnull().sum().sum())
    total_cells = row_count * col_count
    total_null_percentage = float((total_null_count / total_cells) * 100.0) if total_cells > 0 else 0.0

    profile["duplicate_rows"] = duplicate_rows
    profile["duplicate_row_count"] = duplicate_rows
    profile["total_null_count"] = total_null_count
    profile["total_null_percentage"] = total_null_percentage

    if duplicate_rows > 0:
        profile["quality_issues"].append({"column": None, "issue": "duplicate_rows"})

    profile["target_suggestions"] = list(set(target_suggestions))
    return profile
