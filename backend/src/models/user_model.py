import json
from pathlib import Path
from typing import Dict, Optional

from passlib.context import CryptContext
from pydantic import BaseModel

from ..utils.config import get_settings
from ..utils.logger import get_logger

logger = get_logger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(BaseModel):
    id: str
    username: str
    hashed_password: str
    full_name: Optional[str] = None
    disabled: bool = False


class UserStore:
    def __init__(self, seed_path: Optional[str] = None) -> None:
        settings = get_settings()
        self.seed_path = seed_path or settings.users_seed_path
        self.users: Dict[str, User] = {}
        self._load_seed()

    def _load_seed(self) -> None:
        try:
            seed_file = Path(self.seed_path)
            if not seed_file.exists():
                logger.warning("User seed file not found: %s", self.seed_path)
                return
            with seed_file.open("r", encoding="utf-8") as handle:
                raw_users = json.load(handle)
                for raw in raw_users:
                    hashed_password = raw.get("hashed_password")
                    password = raw.get("password")
                    if not hashed_password and password:
                        hashed_password = pwd_context.hash(password)
                    if not hashed_password:
                        logger.warning("User entry missing password fields: %s", raw)
                        continue
                    user = User(
                        id=str(raw.get("id")),
                        username=raw["username"],
                        hashed_password=hashed_password,
                        full_name=raw.get("full_name"),
                        disabled=raw.get("disabled", False),
                    )
                    self.users[user.username] = user
        except Exception as exc:
            logger.error("Failed to load user seed: %s", exc)

    def get_user(self, username: str) -> Optional[User]:
        return self.users.get(username)

    def list_users(self) -> Dict[str, User]:
        return self.users


_user_store: Optional[UserStore] = None


def get_user_store() -> UserStore:
    global _user_store
    if _user_store is None:
        _user_store = UserStore()
    return _user_store
