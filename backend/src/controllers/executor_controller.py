import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import HTTPException, status

from ..models.command_model import CommandEntry, command_history
from ..models.user_model import User
from ..models.whitelist_model import command_whitelist
from ..services.executor.sandbox_executor import executor
from ..utils.logger import get_logger

logger = get_logger(__name__)


def execute_command(intent: str, slots: Dict[str, Any], user: User) -> CommandEntry:
    if not command_whitelist.is_allowed(intent, slots):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Intent not allowed"
        )
    execution_result = executor.execute(intent, slots, user.id)
    entry = CommandEntry(
        session_id=str(uuid.uuid4()),
        intent=intent,
        slots=slots,
        result={"executionResult": execution_result},
        timestamp=datetime.now(timezone.utc),
        user_id=user.id,
        logs=[],
    )
    command_history.add_entry(entry)
    logger.info("Executed intent %s for user %s", intent, user.username)
    return entry
