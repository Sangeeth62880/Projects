"""
Adaptive Difficulty State Machine for Dyscalculia Screening

Implements a data-driven state machine with:
- States: EASY, MEDIUM, HARD
- Automatic transitions based on rolling performance
- Dynamic parameter adjustment per difficulty level

All transitions are computed in real-time, no hardcoded rules.
"""

from enum import Enum
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime


class DifficultyState(Enum):
    """Difficulty states aligned with dyscalculia screening standards."""
    EASY = 1
    MEDIUM = 2  
    HARD = 3


@dataclass
class PerformanceWindow:
    """Rolling window of recent performance data."""
    responses: List[Dict] = field(default_factory=list)
    window_size: int = 3
    
    def add_response(
        self, 
        is_correct: bool, 
        response_time_ms: int, 
        answer_changes: int,
        hesitation_ms: int = 0
    ):
        self.responses.append({
            "is_correct": is_correct,
            "response_time_ms": response_time_ms,
            "answer_changes": answer_changes,
            "hesitation_ms": hesitation_ms,
            "timestamp": datetime.now(),
        })
        # Keep only the last N responses
        if len(self.responses) > self.window_size:
            self.responses = self.responses[-self.window_size:]
    
    @property
    def accuracy(self) -> float:
        if not self.responses:
            return 0.0
        return sum(1 for r in self.responses if r["is_correct"]) / len(self.responses)
    
    @property
    def avg_response_time(self) -> float:
        if not self.responses:
            return 0.0
        return sum(r["response_time_ms"] for r in self.responses) / len(self.responses)
    
    @property
    def avg_hesitation(self) -> float:
        """Average hesitation duration (time before first interaction)."""
        if not self.responses:
            return 0.0
        return sum(r.get("hesitation_ms", 0) for r in self.responses) / len(self.responses)
    
    @property
    def hesitation_trend(self) -> str:
        """Detect if hesitation is increasing, decreasing, or stable."""
        if len(self.responses) < 2:
            return "stable"
        
        times = [r.get("hesitation_ms", 0) for r in self.responses]
        increases = sum(1 for i in range(1, len(times)) if times[i] > times[i-1])
        decreases = sum(1 for i in range(1, len(times)) if times[i] < times[i-1])
        
        if increases > decreases:
            return "increasing"  # More confusion
        elif decreases > increases:
            return "decreasing"  # Building confidence
        return "stable"
    
    @property
    def response_time_trend(self) -> str:
        """Detect if response times are increasing, decreasing, or stable."""
        if len(self.responses) < 2:
            return "stable"
        
        times = [r["response_time_ms"] for r in self.responses]
        increases = sum(1 for i in range(1, len(times)) if times[i] > times[i-1])
        decreases = sum(1 for i in range(1, len(times)) if times[i] < times[i-1])
        
        if increases > decreases:
            return "increasing"  # Slowing down
        elif decreases > increases:
            return "decreasing"  # Speeding up
        return "stable"
    
    @property
    def error_pattern(self) -> str:
        """Detect error patterns: consecutive, alternating, or random."""
        if len(self.responses) < 3:
            return "insufficient_data"
        
        results = [r["is_correct"] for r in self.responses]
        
        # Check for consecutive errors
        if all(not r for r in results):
            return "consecutive_errors"
        
        # Check for consecutive correct
        if all(r for r in results):
            return "consecutive_correct"
        
        # Check for alternating pattern
        alternating = all(results[i] != results[i+1] for i in range(len(results)-1))
        if alternating:
            return "alternating"
        
        return "mixed"
    
    @property
    def total_answer_changes(self) -> int:
        """Total number of answer changes (indecision indicator)."""
        return sum(r.get("answer_changes", 0) for r in self.responses)


@dataclass
class DifficultySession:
    """Session-specific difficulty state tracking."""
    session_id: str
    age_group: str
    current_state: DifficultyState = DifficultyState.MEDIUM
    performance_window: PerformanceWindow = field(default_factory=PerformanceWindow)
    transition_history: List[Dict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


class DifficultyStateMachine:
    """
    Data-driven adaptive difficulty state machine.
    
    States: EASY, MEDIUM, HARD
    
    Transitions are automatic based on:
    - Rolling accuracy (last 3 responses)
    - Response time trend
    - Error pattern frequency
    
    If child performs well → Increase difficulty
    If child struggles → Decrease difficulty
    If performance is unstable → Maintain level
    """
    
    # Session storage
    _sessions: Dict[str, DifficultySession] = {}
    
    # Age-specific difficulty parameters
    DIFFICULTY_PARAMS = {
        "5-6": {
            DifficultyState.EASY: {
                "number_range": (1, 5),
                "operations": ["count"],
                "sequence_length": 2,
                "visual_complexity": "simple",
            },
            DifficultyState.MEDIUM: {
                "number_range": (1, 10),
                "operations": ["count", "compare", "add"],
                "sequence_length": 3,
                "visual_complexity": "moderate",
            },
            DifficultyState.HARD: {
                "number_range": (1, 15),
                "operations": ["add", "subtract", "compare"],
                "sequence_length": 4,
                "visual_complexity": "detailed",
            },
        },
        "7-8": {
            DifficultyState.EASY: {
                "number_range": (1, 10),
                "operations": ["count", "compare"],
                "sequence_length": 3,
                "visual_complexity": "simple",
            },
            DifficultyState.MEDIUM: {
                "number_range": (1, 20),
                "operations": ["add", "subtract", "compare"],
                "sequence_length": 4,
                "visual_complexity": "moderate",
            },
            DifficultyState.HARD: {
                "number_range": (1, 50),
                "operations": ["add", "subtract", "multiply"],
                "sequence_length": 5,
                "visual_complexity": "detailed",
            },
        },
        "9-10": {
            DifficultyState.EASY: {
                "number_range": (1, 20),
                "operations": ["add", "subtract"],
                "sequence_length": 4,
                "visual_complexity": "simple",
            },
            DifficultyState.MEDIUM: {
                "number_range": (1, 50),
                "operations": ["add", "subtract", "multiply"],
                "sequence_length": 5,
                "visual_complexity": "moderate",
            },
            DifficultyState.HARD: {
                "number_range": (1, 100),
                "operations": ["add", "subtract", "multiply", "divide"],
                "sequence_length": 6,
                "visual_complexity": "detailed",
            },
        },
    }
    
    # Transition thresholds
    TRANSITION_RULES = {
        "increase_difficulty": {
            "min_accuracy": 0.8,  # 80%+ accuracy
            "max_avg_response_factor": 0.7,  # Responding faster than expected
            "required_consecutive_correct": 2,
        },
        "decrease_difficulty": {
            "max_accuracy": 0.4,  # Below 40% accuracy
            "error_patterns": ["consecutive_errors"],
        },
        "maintain_level": {
            "patterns": ["alternating", "mixed"],
        },
    }
    
    def get_or_create_session(self, session_id: str, age_group: str) -> DifficultySession:
        """Get existing session or create new one."""
        if session_id not in self._sessions:
            self._sessions[session_id] = DifficultySession(
                session_id=session_id,
                age_group=age_group,
                current_state=DifficultyState.MEDIUM  # Start at medium
            )
        return self._sessions[session_id]
    
    def record_response(
        self,
        session_id: str,
        is_correct: bool,
        response_time_ms: int,
        answer_changes: int,
        age_group: str = "7-8"
    ) -> Tuple[DifficultyState, Optional[str]]:
        """
        Record a response and potentially transition difficulty state.
        
        Returns:
            Tuple of (new_state, transition_reason or None)
        """
        session = self.get_or_create_session(session_id, age_group)
        session.performance_window.add_response(is_correct, response_time_ms, answer_changes)
        
        # Check for state transition
        new_state, reason = self._evaluate_transition(session)
        
        if new_state != session.current_state:
            session.transition_history.append({
                "from": session.current_state.name,
                "to": new_state.name,
                "reason": reason,
                "timestamp": datetime.now().isoformat(),
            })
            session.current_state = new_state
        
        return session.current_state, reason
    
    def _evaluate_transition(self, session: DifficultySession) -> Tuple[DifficultyState, Optional[str]]:
        """
        Evaluate whether a state transition should occur.
        
        Decision factors:
        - Rolling accuracy (last 3 responses)
        - Response time trend
        - Hesitation duration trend
        - Error pattern frequency
        - Answer changes (indecision)
        """
        window = session.performance_window
        current = session.current_state
        
        # Need at least 2 responses before considering transition
        if len(window.responses) < 2:
            return current, None
        
        accuracy = window.accuracy
        error_pattern = window.error_pattern
        time_trend = window.response_time_trend
        hesitation_trend = window.hesitation_trend
        answer_changes = window.total_answer_changes
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # INCREASE DIFFICULTY: Child is performing well
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if accuracy >= self.TRANSITION_RULES["increase_difficulty"]["min_accuracy"]:
            # Confident and fast: increase difficulty
            if error_pattern == "consecutive_correct" and hesitation_trend != "increasing":
                if current.value < DifficultyState.HARD.value:
                    return DifficultyState(current.value + 1), f"High accuracy ({accuracy*100:.0f}%), confident responses"
        
        # Fast responses + high accuracy = ready for harder
        if accuracy >= 0.7 and time_trend == "decreasing" and answer_changes == 0:
            if current.value < DifficultyState.HARD.value:
                return DifficultyState(current.value + 1), "Fast confident responses, increasing challenge"
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # DECREASE DIFFICULTY: Child is struggling
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # Low accuracy: reduce difficulty
        if accuracy <= self.TRANSITION_RULES["decrease_difficulty"]["max_accuracy"]:
            if current.value > DifficultyState.EASY.value:
                return DifficultyState(current.value - 1), f"Low accuracy ({accuracy*100:.0f}%), simplifying questions"
        
        # Consecutive errors: definite sign of struggle
        if error_pattern in self.TRANSITION_RULES["decrease_difficulty"]["error_patterns"]:
            if current.value > DifficultyState.EASY.value:
                return DifficultyState(current.value - 1), "Consecutive errors, switching to easier visual questions"
        
        # Increasing hesitation: confusion building
        if hesitation_trend == "increasing" and accuracy < 0.7:
            if current.value > DifficultyState.EASY.value:
                return DifficultyState(current.value - 1), "Increasing hesitation, reducing cognitive load"
        
        # Many answer changes: indecision/uncertainty
        if answer_changes >= 3 and accuracy < 0.6:
            if current.value > DifficultyState.EASY.value:
                return DifficultyState(current.value - 1), "High indecision detected, simplifying"
        
        # Response times increasing + struggling
        if time_trend == "increasing" and accuracy < 0.6:
            if current.value > DifficultyState.EASY.value:
                return DifficultyState(current.value - 1), "Response times increasing, reducing difficulty"
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # MAINTAIN: Performance is unstable/mixed
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        return current, None
    
    def get_difficulty_params(self, session_id: str, age_group: str) -> Dict:
        """Get current difficulty parameters for question generation."""
        session = self.get_or_create_session(session_id, age_group)
        
        age_params = self.DIFFICULTY_PARAMS.get(age_group, self.DIFFICULTY_PARAMS["7-8"])
        state_params = age_params.get(session.current_state, age_params[DifficultyState.MEDIUM])
        
        return {
            "difficulty_state": session.current_state.name,
            "difficulty_value": session.current_state.value,
            "number_range": state_params["number_range"],
            "operations": state_params["operations"],
            "sequence_length": state_params["sequence_length"],
            "visual_complexity": state_params["visual_complexity"],
            "questions_answered": len(session.performance_window.responses),
            "current_accuracy": session.performance_window.accuracy,
        }
    
    def get_session_summary(self, session_id: str) -> Optional[Dict]:
        """Get summary of difficulty transitions for a session."""
        if session_id not in self._sessions:
            return None
        
        session = self._sessions[session_id]
        return {
            "session_id": session_id,
            "age_group": session.age_group,
            "current_state": session.current_state.name,
            "transitions": session.transition_history,
            "performance": {
                "accuracy": session.performance_window.accuracy,
                "error_pattern": session.performance_window.error_pattern,
                "time_trend": session.performance_window.response_time_trend,
            },
        }
    
    def get_ai_context(self, session_id: str, age_group: str) -> str:
        """Generate context string for AI question generation."""
        params = self.get_difficulty_params(session_id, age_group)
        
        return f"""
ADAPTIVE DIFFICULTY CONTEXT:

Current State: {params['difficulty_state']}
Age Group: {age_group}
Number Range: {params['number_range'][0]} to {params['number_range'][1]}
Allowed Operations: {', '.join(params['operations'])}
Memory Sequence Length: {params['sequence_length']}
Visual Complexity: {params['visual_complexity']}
Questions Answered: {params['questions_answered']}
Current Accuracy: {params['current_accuracy'] * 100:.1f}%

Adjust question complexity accordingly:
- EASY: Simple, concrete, visual-heavy
- MEDIUM: Age-appropriate challenge
- HARD: Requires deeper reasoning
"""


# Global instance
difficulty_machine = DifficultyStateMachine()
