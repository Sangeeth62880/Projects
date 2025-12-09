import json
from pathlib import Path
from typing import Dict, List, Optional

from pydantic import BaseModel

from ..utils.config import get_settings
from ..utils.logger import get_logger

logger = get_logger(__name__)


class WhitelistEntry(BaseModel):
    intent: str
    description: Optional[str] = None
    allowed_slots: List[str] = []


class CommandWhitelist:
    def __init__(self, seed_path: Optional[str] = None) -> None:
        settings = get_settings()
        self.seed_path = seed_path or settings.whitelist_seed_path
        self._entries: Dict[str, WhitelistEntry] = {}
        self._load_seed()

    def _load_seed(self) -> None:
        try:
            seed_file = Path(self.seed_path)
            if not seed_file.exists():
                logger.warning("Whitelist seed file not found: %s", self.seed_path)
                return
            with seed_file.open("r", encoding="utf-8") as handle:
                raw_entries = json.load(handle)
                for raw in raw_entries:
                    entry = WhitelistEntry(**raw)
                    self._entries[entry.intent] = entry
        except Exception as exc:
            logger.error("Failed to load whitelist seed: %s", exc)

    def is_allowed(self, intent: str, slots: Optional[Dict[str, str]] = None) -> bool:
        entry = self._entries.get(intent)
        if not entry:
            return False
        if slots:
            invalid = set(slots.keys()) - set(entry.allowed_slots)
            if invalid:
                return False
        return True

    def get_entry(self, intent: str) -> Optional[WhitelistEntry]:
        return self._entries.get(intent)

    def list_entries(self) -> List[WhitelistEntry]:
        return list(self._entries.values())


command_whitelist = CommandWhitelist()
