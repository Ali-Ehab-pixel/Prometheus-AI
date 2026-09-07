from app.graph.state import AgentState


def route_action(state: AgentState) -> str:
    """
    Conditional routing function that inspects state["user_action"]
    and maps it to the appropriate specialized agent node.
    """
    action = (state.get("user_action") or "").lower().strip()

    if action in ["clean", "transform", "clean_and_transform"]:
        return "data_engineer"
    elif action in ["visualize", "graphs", "generate_graphs"]:
        return "visualization"
    elif action in ["predict", "forecast", "predict_and_forecast"]:
        return "ml_forecaster"
    elif action in ["insights", "find_insights"]:
        return "insights"
    elif action in ["classify", "classification"]:
        return "classifier"
    elif action in ["automl", "auto_ml", "benchmark", "leaderboard"]:
        return "automl"
    elif action in ["analyze_all", "analyze_everything"]:
        return "data_engineer"  # Multi-phase starts with cleaning
    else:
        # Default fallback
        return "data_engineer"

