import ast
import re
import logging
from typing import Optional
from langchain_core.messages import HumanMessage, SystemMessage

from app.graph.llm import get_llm
from app.graph.prompts import (
    DATA_ENGINEER_SYSTEM_PROMPT,
    VISUALIZATION_SYSTEM_PROMPT,
    ML_FORECASTER_SYSTEM_PROMPT,
)
from app.graph.state import AgentState

logger = logging.getLogger(__name__)


def extract_python_code(text: str) -> str:
    """
    Extracts pure Python code from a markdown-formatted LLM response.
    Handles ```python ... ```, ``` ... ```, or plain python scripts.
    """
    if not text:
        return ""

    # Look for ```python ... ``` block
    pattern_python = r"```(?:python|py)?\s*([\s\S]*?)```"
    matches = re.findall(pattern_python, text, re.IGNORECASE)
    if matches:
        # Return the longest code block (usually the main script)
        longest_match = max(matches, key=len).strip()
        return longest_match

    # If no markdown block found, strip leading/trailing whitespace
    return text.strip()


def validate_python_syntax(code: str) -> Optional[str]:
    """
    Validates Python syntax using AST parser.
    Returns None if valid, or error message string if invalid.
    """
    try:
        ast.parse(code)
        return None
    except SyntaxError as e:
        return f"Python Syntax Error at line {e.lineno}: {e.msg}"


def data_engineer_node(state: AgentState) -> AgentState:
    """
    Agent node for Clean & Transform actions using Pandas and Scikit-Learn.
    """
    llm = get_llm()
    target_format = state.get("target_format", "csv") or "csv"
    output_filename = f"output_cleaned.{target_format}"
    dataset_path = state.get("dataset_path", "dataset.csv")

    system_prompt = DATA_ENGINEER_SYSTEM_PROMPT.format(
        dataset_path=dataset_path,
        output_filename=output_filename,
    )

    user_instructions = state.get("user_instructions") or "Perform comprehensive data cleaning, handle missing values, and standardize column names."
    user_prompt = f"""Please generate the Python script to clean and transform this dataset:

{state.get('dataset_schema_str', '')}

User Request/Instructions:
{user_instructions}

Target Output File:
{output_filename}
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    response = llm.invoke(messages)
    raw_content = response.content if hasattr(response, "content") else str(response)

    return {
        **state,
        "raw_llm_response": raw_content,
        "expected_artifact_path": output_filename,
    }


def visualization_node(state: AgentState) -> AgentState:
    """
    Agent node for Generate Graphs actions using Plotly Express.
    """
    llm = get_llm()
    output_filename = "output_plot.html"
    dataset_path = state.get("dataset_path", "dataset.csv")

    system_prompt = VISUALIZATION_SYSTEM_PROMPT.format(
        dataset_path=dataset_path,
        output_filename=output_filename,
    )

    user_instructions = state.get("user_instructions") or "Generate the most insightful, visually appealing interactive chart(s) to explore patterns and distributions in this dataset."
    user_prompt = f"""Please generate the Python script with Plotly Express to visualize this dataset:

{state.get('dataset_schema_str', '')}

User Request/Instructions:
{user_instructions}

Target Output File (HTML with CDN):
{output_filename}
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    response = llm.invoke(messages)
    raw_content = response.content if hasattr(response, "content") else str(response)

    return {
        **state,
        "raw_llm_response": raw_content,
        "expected_artifact_path": output_filename,
    }


def ml_forecaster_node(state: AgentState) -> AgentState:
    """
    Agent node for Predict & Forecast actions using Scikit-Learn.
    """
    llm = get_llm()
    target_format = state.get("target_format", "csv") or "csv"
    output_filename = f"output_predictions.{target_format}"
    dataset_path = state.get("dataset_path", "dataset.csv")
    target_column = state.get("target_column") or "Auto-detect"

    system_prompt = ML_FORECASTER_SYSTEM_PROMPT.format(
        dataset_path=dataset_path,
        output_filename=output_filename,
        target_column=target_column,
    )

    user_instructions = state.get("user_instructions") or "Train a baseline machine learning model, evaluate performance, and append predictions column."
    user_prompt = f"""Please generate the Python script with Scikit-Learn to build the ML/Forecasting model:

{state.get('dataset_schema_str', '')}

Target Variable:
{target_column}

User Request/Instructions:
{user_instructions}

Target Output File:
{output_filename}
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    response = llm.invoke(messages)
    raw_content = response.content if hasattr(response, "content") else str(response)

    return {
        **state,
        "raw_llm_response": raw_content,
        "expected_artifact_path": output_filename,
    }


def code_extractor_node(state: AgentState) -> AgentState:
    """
    Extracts executable Python code from the LLM output and validates its syntax.
    """
    raw_response = state.get("raw_llm_response", "")
    code = extract_python_code(raw_response)

    syntax_error = validate_python_syntax(code)
    if syntax_error:
        logger.warning(f"Syntax validation issue: {syntax_error}")
        return {
            **state,
            "generated_code": code,
            "error": syntax_error,
        }

    return {
        **state,
        "generated_code": code,
        "error": None,
    }
