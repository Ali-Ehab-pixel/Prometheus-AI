import logging
from langgraph.graph import StateGraph, START, END

from app.graph.nodes import (
    code_extractor_node,
    data_engineer_node,
    ml_forecaster_node,
    visualization_node,
    insights_node,
    classifier_node,
    automl_node,
)
from app.graph.router import route_action
from app.graph.state import AgentState

logger = logging.getLogger(__name__)


def build_analysis_graph():
    """
    Constructs and compiles the multi-agent LangGraph workflow.
    """
    workflow = StateGraph(AgentState)

    # 1. Register Nodes
    workflow.add_node("data_engineer", data_engineer_node)
    workflow.add_node("visualization", visualization_node)
    workflow.add_node("ml_forecaster", ml_forecaster_node)
    workflow.add_node("insights", insights_node)
    workflow.add_node("classifier", classifier_node)
    workflow.add_node("automl", automl_node)
    workflow.add_node("code_extractor", code_extractor_node)

    # 2. Add Conditional Router from START
    workflow.add_conditional_edges(
        START,
        route_action,
        {
            "data_engineer": "data_engineer",
            "visualization": "visualization",
            "ml_forecaster": "ml_forecaster",
            "insights": "insights",
            "classifier": "classifier",
            "automl": "automl",
        },
    )

    # 3. Connect all Agent Nodes to Code Extractor
    workflow.add_edge("data_engineer", "code_extractor")
    workflow.add_edge("visualization", "code_extractor")
    workflow.add_edge("ml_forecaster", "code_extractor")
    workflow.add_edge("insights", "code_extractor")
    workflow.add_edge("classifier", "code_extractor")
    workflow.add_edge("automl", "code_extractor")

    # 4. Connect Code Extractor to END
    workflow.add_edge("code_extractor", END)

    # Compile the graph
    app = workflow.compile()
    return app


# Singleton compiled graph instance
analysis_graph = build_analysis_graph()
