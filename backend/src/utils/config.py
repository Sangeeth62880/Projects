import functools
import secrets
from typing import List, Optional

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    jwt_secret: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32), env="JWT_SECRET"
    )
    jwt_algorithm: str = Field("HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    whisper_mode: str = Field("api", env="WHISPER_MODE")
    mongo_uri: Optional[str] = Field(None, env="MONGO_URI")
    use_mongo: bool = Field(False, env="USE_MONGO")
    whitelist_seed_path: str = Field(default="backend/src/data/whitelist_seed.json")
    users_seed_path: str = Field(default="backend/src/data/users_seed.json")
    allowed_paths: List[str] = Field(default=["./logs", "."])
    allowed_origins: List[str] = Field(
        default=["http://localhost", "http://127.0.0.1"]
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@functools.lru_cache()
def get_settings() -> Settings:
    return Settings()
