from typing import Any, Dict

from ..services.nlu.rule_engine import rule_engine


def interpret_text(text: str) -> Dict[str, Any]:
    return rule_engine.interpret(text)
