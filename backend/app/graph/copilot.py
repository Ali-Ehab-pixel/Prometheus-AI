import json
import logging
from typing import Any, Dict, List, Optional
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.graph.llm import get_llm
from app.models.schemas import ChatMessage, CopilotChatResponse

logger = logging.getLogger(__name__)

COPILOT_SYSTEM_PROMPT = """You are an elite Senior AI Data Scientist and Machine Learning Principal working as an interactive copilot for the user's dataset.

DATASET INFORMATION:
Filename: {filename}
Rows: {row_count} | Columns: {col_count}
Health Score: {health_score} (Grade: {grade})

SCHEMA & STATS:
{schema_summary}

DATA QUALITY ISSUES DETECTED:
{quality_issues}

TOP CORRELATIONS:
{correlations}

TARGET SUGGESTIONS:
{target_suggestions}

YOUR CAPABILITIES:
1. Provide deep, accurate answers with specific statistics, percentages, and data observations.
2. Explain data anomalies, distribution skews, multicollinearity, and missing value patterns.
3. Recommend optimal machine learning strategies (RandomForest, GradientBoosting, Ridge, LogisticRegression, cross-validation, feature scaling, encoding).
4. Guide the user through the platform's action capabilities:
   - "clean": Handle missing data, drop duplicates, clip outliers, normalize types.
   - "visualize": Multi-chart interactive Plotly exploratory dashboards.
   - "predict": AutoML regression modeling.
   - "classify": Stratified classification and confusion matrix.
   - "insights": Automated statistical discoveries and anomaly reports.
   - "automl": Multi-model leaderboard comparing 5 algorithms with trained model download.

RESPONSE FORMAT:
You must provide a helpful, natural Markdown response.
At the very end of your response, output a structured JSON block on a new line enclosed in `<copilot_meta>...</copilot_meta>` with the following schema:
<copilot_meta>
{{
  "suggested_actions": ["clean", "visualize", "predict", "classify", "insights", "automl"],
  "suggested_follow_ups": [
    "Question 1 tailored to dataset?",
    "Question 2 tailored to dataset?",
    "Question 3 tailored to dataset?"
  ]
}}
</copilot_meta>
"""


def chat_with_copilot(
    session_data: Dict[str, Any],
    message: str,
    history: List[ChatMessage],
) -> CopilotChatResponse:
    llm = get_llm()

    metadata = session_data.get("metadata")
    profile = session_data.get("profile") or {}
    health = session_data.get("health_score") or {}

    filename = session_data.get("original_filename", "Dataset")
    row_count = metadata.row_count if metadata else profile.get("row_count", 0)
    col_count = metadata.col_count if metadata else profile.get("col_count", 0)
    overall_score = health.get("overall_score", "N/A")
    grade = health.get("grade", "N/A")

    # Format schema summary
    columns_str = ""
    if metadata and hasattr(metadata, "columns"):
        columns_str = ", ".join([f"{c.name} ({c.dtype})" for c in metadata.columns[:25]])
    elif "columns" in profile:
        columns_str = ", ".join([f"{c['name']} ({c.get('dtype', 'unknown')})" for c in profile["columns"][:25]])

    quality_issues_list = profile.get("quality_issues", [])
    quality_issues_str = json.dumps(quality_issues_list[:10], indent=2) if quality_issues_list else "None detected"

    corr_matrix = profile.get("correlation_matrix", {})
    corr_str = "Available" if corr_matrix else "Insufficient numeric columns"

    targets = profile.get("target_suggestions", [])
    targets_str = ", ".join(targets) if targets else "None specific"

    sys_prompt = COPILOT_SYSTEM_PROMPT.format(
        filename=filename,
        row_count=row_count,
        col_count=col_count,
        health_score=overall_score,
        grade=grade,
        schema_summary=columns_str,
        quality_issues=quality_issues_str,
        correlations=corr_str,
        target_suggestions=targets_str,
    )

    messages = [SystemMessage(content=sys_prompt)]

    # Add historical messages (limit to last 6 for context length)
    for msg in history[-6:]:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            messages.append(AIMessage(content=msg.content))

    messages.append(HumanMessage(content=message))

    try:
        response = llm.invoke(messages)
        raw_content = response.content if hasattr(response, "content") else str(response)

        # Parse <copilot_meta> block if present
        suggested_actions: List[str] = []
        suggested_follow_ups: List[str] = []
        reply = raw_content

        if "<copilot_meta>" in raw_content and "</copilot_meta>" in raw_content:
            parts = raw_content.split("<copilot_meta>")
            reply = parts[0].strip()
            meta_json = parts[1].split("</copilot_meta>")[0].strip()
            try:
                meta = json.loads(meta_json)
                suggested_actions = meta.get("suggested_actions", [])[:3]
                suggested_follow_ups = meta.get("suggested_follow_ups", [])[:3]
            except Exception:
                pass

        if not suggested_follow_ups:
            suggested_follow_ups = [
                f"How should I preprocess the {filename} dataset?",
                "Which features correlate most strongly with the target?",
                "Can we run an AutoML model comparison on this data?",
            ]

        return CopilotChatResponse(
            reply=reply,
            suggested_actions=suggested_actions,
            suggested_follow_ups=suggested_follow_ups,
        )

    except Exception as e:
        logger.error(f"Copilot inference error: {e}", exc_info=True)
        return CopilotChatResponse(
            reply=f"I encountered an issue connecting to the AI model: {str(e)}. Please try again or rephrase your inquiry.",
            suggested_actions=[],
            suggested_follow_ups=[
                "Can you summarize this dataset?",
                "What data quality issues exist?",
            ],
        )
