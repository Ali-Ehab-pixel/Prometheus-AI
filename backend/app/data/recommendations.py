def generate_recommendations(profile: dict, health_score: dict) -> list:
    recs = []
    
    score = health_score.get("overall_score", 100)
    columns = profile.get("columns", [])
    row_count = profile.get("row_count", 0)
    
    # 1. Clean if health < 60
    if score < 60:
        recs.append({
            "action": "clean",
            "title": "Clean Data Issues",
            "reason": f"Overall dataset health is poor ({score:.1f}%). Cleaning is highly recommended before analysis.",
            "priority": 1,
            "confidence": 0.95
        })
    else:
        # Check for specific high nulls
        has_high_nulls = any(col.get("null_percentage", 0) > 0.3 for col in columns)
        if has_high_nulls:
            recs.append({
                "action": "clean",
                "title": "Handle Missing Values",
                "reason": "Some columns have >30% missing values which might affect analysis.",
                "priority": 2,
                "confidence": 0.85
            })

    # 2. Classify / Predict
    targets = profile.get("target_suggestions", [])
    if targets:
        for t in targets:
            col_info = next((c for c in columns if c["name"] == t), None)
            if col_info:
                if col_info.get("unique_count", 0) == 2:
                    recs.append({
                        "action": "classify",
                        "title": f"Classification on '{t}'",
                        "reason": f"Column '{t}' appears to be a binary target variable.",
                        "priority": 2,
                        "confidence": 0.90
                    })
                elif "float" in col_info.get("dtype", "").lower() or "int" in col_info.get("dtype", "").lower():
                    recs.append({
                        "action": "predict",
                        "title": f"Predict '{t}'",
                        "reason": f"Column '{t}' appears to be a numeric target variable.",
                        "priority": 2,
                        "confidence": 0.80
                    })
    
    # 3. Visualize
    numeric_cols = [c for c in columns if "float" in c.get("dtype", "").lower() or "int" in c.get("dtype", "").lower()]
    if len(numeric_cols) > 3:
        recs.append({
            "action": "visualize",
            "title": "Explore Numeric Correlations",
            "reason": "Dataset has multiple numeric columns. Visualization can help find correlations.",
            "priority": 3,
            "confidence": 0.75
        })
        
    # 4. Insights
    if row_count > 1000:
        recs.append({
            "action": "insights",
            "title": "Extract Data Insights",
            "reason": f"Dataset is large enough ({row_count} rows) to contain statistical patterns.",
            "priority": 3,
            "confidence": 0.85
        })
        
    # 5. Analyze All
    recs.append({
        "action": "analyze_all",
        "title": "Comprehensive Analysis",
        "reason": "Run a full automated exploratory data analysis.",
        "priority": 5,
        "confidence": 0.99
    })
    
    return recs
