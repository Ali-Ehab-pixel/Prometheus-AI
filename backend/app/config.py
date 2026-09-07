import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # LLM Settings (OpenRouter by default)
    OPENROUTER_API_KEY: Optional[str] = Field(default=None)
    OPENROUTER_BASE_URL: str = Field(default="https://openrouter.ai/api/v1")
    PRIMARY_MODEL: str = Field(default="nvidia/nemotron-3-super-120b-a12b:free")
    FALLBACK_MODEL: str = Field(default="nvidia/nemotron-3.5-lightning:free")
    MAX_UPLOAD_SIZE_MB: int = Field(default=500)
    VERSION_DIR: str = Field(default="./data/versions")

    # Optional Direct Provider Keys
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    GOOGLE_API_KEY: Optional[str] = Field(default=None)

    # E2B Sandbox API Key
    E2B_API_KEY: Optional[str] = Field(default=None)

    # Server Configuration
    BACKEND_HOST: str = Field(default="0.0.0.0")
    BACKEND_PORT: int = Field(default=8000)
    ENVIRONMENT: str = Field(default="development")
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000,http://127.0.0.1:3000")

    # File Storage Paths
    UPLOAD_DIR: str = Field(default="./uploads")
    ARTIFACT_DIR: str = Field(default="./artifacts")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = {
        "env_file": [
            os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
            ".env",
            "backend/.env",
        ],
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()

# Ensure runtime directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.ARTIFACT_DIR, exist_ok=True)
os.makedirs(settings.VERSION_DIR, exist_ok=True)
