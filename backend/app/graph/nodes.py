import ast
import re
import textwrap
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


def _clean_code_candidate(raw: str) -> str:
    if not raw:
        return ""
    lines = raw.splitlines()
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    if not lines:
        return ""

    code_v1 = textwrap.dedent("\n".join(lines)).strip()
    try:
        ast.parse(code_v1)
        return code_v1
    except SyntaxError:
        pass

    if len(lines) > 1:
        non_empty_rest = [l for l in lines[1:] if l.strip()]
        if non_empty_rest:
            common_rest_indent = min(len(l) - len(l.lstrip()) for l in non_empty_rest)
            if common_rest_indent > 0:
                fixed_lines = [lines[0].strip()] + [
                    l[common_rest_indent:] if l.startswith(" " * common_rest_indent) else l.lstrip()
                    for l in lines[1:]
                ]
                code_v2 = "\n".join(fixed_lines).strip()
                try:
                    ast.parse(code_v2)
                    return code_v2
                except SyntaxError:
                    pass

    return code_v1


def extract_python_code(text: str) -> str:
    """
    Extracts pure Python code from a markdown-formatted LLM response.
    Handles thinking preambles, multiple code blocks, stripping non-code wrappers,
    and returns the best valid Python script.
    """
    if not text:
        return ""

    pattern_python = r"```(?:python|py)?\s*([\s\S]*?)```"
    matches = re.findall(pattern_python, text, re.IGNORECASE)

    candidates = []
    if matches:
        # Check from last match to first match (final code block first)
        for m in reversed(matches):
            c = _clean_code_candidate(m)
            if c:
                candidates.append(c)

    # Fallback to full text cleaned
    full_cleaned = _clean_code_candidate(text)
    if full_cleaned:
        candidates.append(full_cleaned)

    # Pick first candidate that parses cleanly with ast.parse
    for candidate in candidates:
        try:
            ast.parse(candidate)
            return candidate
        except SyntaxError:
            continue

    return candidates[0] if candidates else ""


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
