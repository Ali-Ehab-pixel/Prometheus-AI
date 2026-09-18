from app.graph.state import AgentState


def route_action(state: AgentState) -> str:
    action = (state.get("user_action") or "").lower().strip()
    if action in ["clean", "transform", "clean_and_transform"]:
        return "data_engineer"
    elif action in ["visualize", "graphs", "generate_graphs"]:
        return "visualization"
    elif action in ["insights", "find_insights"]:
        return "insights"
    else:
        return "data_engineer"
