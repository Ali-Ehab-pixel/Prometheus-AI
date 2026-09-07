def calculate_health_score(profile: dict) -> dict:
    row_count = profile.get("row_count", 0)
    col_count = profile.get("col_count", 0)
    
    if row_count == 0 or col_count == 0:
        return {
            "overall_score": 0.0,
            "completeness": 0.0,
            "consistency": 0.0,
            "uniqueness": 0.0,
            "validity": 0.0,
            "shape": 0.0,
            "grade": "F",
            "issues": []
        }
        
    issues = []
    
    # 1. Completeness (30%)
    total_cells = row_count * col_count
    total_nulls = sum([col.get("null_count", 0) for col in profile.get("columns", [])])
    completeness = max(0.0, 100.0 * (1 - (total_nulls / total_cells)))
    
    # 2. Consistency (20%)
    mixed_type_issues = [iss for iss in profile.get("quality_issues", []) if iss.get("issue") == "mixed_types"]
    consistency = 100.0
    if len(mixed_type_issues) > 0:
        consistency = max(0.0, 100.0 - (len(mixed_type_issues) * 10))
        for iss in mixed_type_issues:
            issues.append({
                "issue_type": "Mixed Data Types",
                "column": iss.get("column"),
                "severity": "medium",
                "description": f"Column '{iss.get('column')}' contains mixed data types.",
                "suggested_fix": "Standardize data types in the column."
            })
            
    # 3. Uniqueness (15%)
    constant_issues = [iss for iss in profile.get("quality_issues", []) if iss.get("issue") == "constant_column"]
    id_issues = [iss for iss in profile.get("quality_issues", []) if iss.get("issue") == "potential_id"]
    uniqueness = 100.0
    
    if constant_issues:
        uniqueness = max(0.0, uniqueness - len(constant_issues) * 5)
        for iss in constant_issues:
            issues.append({
                "issue_type": "Constant Column",
                "column": iss.get("column"),
                "severity": "low",
                "description": f"Column '{iss.get('column')}' has only one unique value.",
                "suggested_fix": "Consider removing if not needed for analysis."
            })
            
    if id_issues:
        uniqueness = max(0.0, uniqueness - len(id_issues) * 2)
        
    dupe_rows = profile.get("duplicate_rows", 0)
    if dupe_rows > 0:
        uniqueness = max(0.0, uniqueness - (dupe_rows / row_count * 100))
        issues.append({
            "issue_type": "Duplicate Rows",
            "column": None,
            "severity": "medium",
            "description": f"Dataset contains {dupe_rows} duplicate rows.",
            "suggested_fix": "Remove duplicate rows."
        })

    # 4. Validity (20%)
    outlier_issues = [iss for iss in profile.get("quality_issues", []) if iss.get("issue") == "has_outliers"]
    validity = 100.0
    if outlier_issues:
        validity = max(0.0, validity - len(outlier_issues) * 5)
        for iss in outlier_issues:
            issues.append({
                "issue_type": "Outliers Detected",
                "column": iss.get("column"),
                "severity": "low",
                "description": f"Column '{iss.get('column')}' contains statistical outliers.",
                "suggested_fix": "Inspect and optionally clip or remove outliers."
            })

    # 5. Shape (15%)
    shape_score = 100.0
    ratio = row_count / col_count
    if ratio < 10:
        shape_score = max(0.0, shape_score - 20)
        issues.append({
            "issue_type": "Low Row-to-Column Ratio",
            "column": None,
            "severity": "medium",
            "description": "Dataset has very few rows relative to columns, risking overfitting.",
            "suggested_fix": "Collect more data if possible."
        })

    overall_score = (completeness * 0.3) + (consistency * 0.2) + (uniqueness * 0.15) + (validity * 0.2) + (shape_score * 0.15)
    
    if overall_score >= 90:
        grade = "A"
    elif overall_score >= 80:
        grade = "B"
    elif overall_score >= 70:
        grade = "C"
    elif overall_score >= 60:
        grade = "D"
    else:
        grade = "F"
        
    return {
        "overall_score": float(overall_score),
        "completeness": float(completeness),
        "consistency": float(consistency),
        "uniqueness": float(uniqueness),
        "validity": float(validity),
        "shape": float(shape_score),
        "grade": grade,
        "issues": issues
    }
