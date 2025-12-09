from pathlib import Path
from typing import Any, Dict, List

from ...models.command_model import command_history
from ...utils.config import get_settings


class SandboxExecutor:
    def __init__(self, allowed_paths: List[str]) -> None:
        self.allowed_paths = [Path(path).resolve() for path in allowed_paths]

    def _is_path_allowed(self, target: Path) -> bool:
        resolved = target.resolve()
        return any(str(resolved).startswith(str(base)) for base in self.allowed_paths)

    def _list_files(self, path_value: str) -> Dict[str, Any]:
        target = Path(path_value)
        if not self._is_path_allowed(target):
            return {"error": "Path not allowed"}
        if not target.exists():
            return {"error": "Path does not exist"}
        files = [p.name for p in target.iterdir() if not p.name.startswith(".")]
        return {"files": files}

    def _system_status(self) -> Dict[str, Any]:
        return {"status": "ok", "services": {"asr": "stub", "nlu": "rule"}}

    def _show_history(self, user_id: str) -> Dict[str, Any]:
        entries = command_history.get_entries_for_user(user_id)
        return {"history": [entry.dict() for entry in entries]}

    def execute(
        self, intent: str, slots: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        if intent == "list_logs":
            path_value = slots.get("path", "./logs")
            return self._list_files(path_value)
        if intent == "system_status":
            return self._system_status()
        if intent == "show_history":
            return self._show_history(user_id)
        return {"error": "Unsupported intent"}


executor = SandboxExecutor(get_settings().allowed_paths)
