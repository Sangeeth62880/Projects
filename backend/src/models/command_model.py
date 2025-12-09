from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel


class CommandEntry(BaseModel):
    session_id: str
    intent: str
    slots: Dict[str, Any]
    result: Dict[str, Any]
    timestamp: datetime
    user_id: str
    logs: List[str] = []


class CommandHistory:
    def __init__(self) -> None:
        self._entries: List[CommandEntry] = []

    def add_entry(self, entry: CommandEntry) -> None:
        self._entries.append(entry)

    def get_entries_for_user(self, user_id: str) -> List[CommandEntry]:
        return [entry for entry in self._entries if entry.user_id == user_id]


command_history = CommandHistory()
