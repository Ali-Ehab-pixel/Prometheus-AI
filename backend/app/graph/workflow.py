import logging
from langgraph.graph import StateGraph, START, END

from app.graph.nodes import (
    code_extractor_node,
    data_engineer_node,
    visualization_node,
    insights_node,
)
from app.graph.router import route_action
from app.graph.state import AgentState

logger = logging.getLogger(__name__)


def build_analysis_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("data_engineer", data_engineer_node)
    workflow.add_node("visualization", visualization_node)
    workflow.add_node("insights", insights_node)
    workflow.add_node("code_extractor", code_extractor_node)

    workflow.add_conditional_edges(
        START,
        route_action,
        {
            "data_engineer": "data_engineer",
            "visualization": "visualization",
            "insights": "insights",
        },
    )

    workflow.add_edge("data_engineer", "code_extractor")
    workflow.add_edge("visualization", "code_extractor")
    workflow.add_edge("insights", "code_extractor")
    workflow.add_edge("code_extractor", END)

    app = workflow.compile()
    return app


analysis_graph = build_analysis_graph()
