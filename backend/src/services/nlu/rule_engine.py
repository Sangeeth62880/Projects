from typing import Any, Dict


class RuleEngine:
    def interpret(self, text: str) -> Dict[str, Any]:
        lowered = text.lower()
        if "status" in lowered:
            return {"intent": "system_status", "slots": {}, "confidence": 0.9}
        if "log" in lowered or "logs" in lowered:
            path = "./logs"
            return {
                "intent": "list_logs",
                "slots": {"path": path},
                "confidence": 0.85,
            }
        if "history" in lowered:
            return {"intent": "show_history", "slots": {}, "confidence": 0.8}
        return {"intent": "unknown", "slots": {}, "confidence": 0.2}


rule_engine = RuleEngine()
