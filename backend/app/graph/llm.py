import logging
from typing import Any
from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI

from app.config import settings

logger = logging.getLogger(__name__)


def get_llm() -> BaseChatModel:
    """
    Constructs and returns the configured LLM with automatic fallback support.
    Defaults to OpenRouter with primary model nvidia/nemotron-3.5-lightning:free
    and fallback model google/gemma-4-31b-it:free.
    """
    # 1. Check OpenRouter Configuration
    if settings.OPENROUTER_API_KEY:
        primary_llm = ChatOpenAI(
            model=settings.PRIMARY_MODEL,
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            temperature=0.1,
            max_tokens=4096,
            default_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Data Analyst Platform",
            },
        )

        fallback_llm = ChatOpenAI(
            model=settings.FALLBACK_MODEL,
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            temperature=0.1,
            max_tokens=4096,
            default_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Data Analyst Platform",
            },
        )

        # Attach fallback model
        llm_with_fallback = primary_llm.with_fallbacks([fallback_llm])
        return llm_with_fallback

    # 2. Check OpenAI Direct Key
    if settings.OPENAI_API_KEY:
        return ChatOpenAI(
            model="gpt-4o",
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0.1,
            max_tokens=4096,
        )

    # 3. Check Anthropic Key
    if settings.ANTHROPIC_API_KEY:
        try:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model="claude-3-5-sonnet-20241022",
                anthropic_api_key=settings.ANTHROPIC_API_KEY,
                temperature=0.1,
                max_tokens=4096,
            )
        except ImportError:
            pass

    # 4. Fallback Default ChatOpenAI placeholder
    return ChatOpenAI(
        model="gpt-4o",
        temperature=0.1,
        max_tokens=4096,
    )
