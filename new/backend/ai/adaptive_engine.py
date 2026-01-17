"""
Adaptive Difficulty Engine for Dyscalculia Screening

This module manages difficulty levels based on child performance:
- If performing well (>70% accuracy, fast responses): Increase difficulty
- If struggling (<40% accuracy, slow responses): Decrease difficulty  
- If unstable (mixed results): Maintain level

Based on dyscalculia screening research and adaptive testing principles.
"""

from enum import Enum
from typing import Dict, Optional, List
from dataclasses import dataclass, field
from datetime import datetime


class DifficultyLevel(Enum):
    """Difficulty levels aligned with dyscalculia screening standards."""
    VERY_EASY = 1    # For struggling children - build confidence
    EASY = 2         # Below age level
    NORMAL = 3       # Age appropriate
    CHALLENGING = 4  # Above age level
    ADVANCED = 5     # Significantly above age level


@dataclass
class PerformanceMetrics:
    """Track performance for adaptive difficulty decisions."""
    questions_answered: int = 0
    correct_answers: int = 0
    total_response_time_ms: int = 0
    answer_changes: int = 0
    consecutive_correct: int = 0
    consecutive_wrong: int = 0
    last_answers: List[bool] = field(default_factory=list)  # Last 5 answers
    
    @property
    def accuracy(self) -> float:
        if self.questions_answered == 0:
            return 0.0
        return (self.correct_answers / self.questions_answered) * 100
    
    @property
    def avg_response_time_ms(self) -> float:
        if self.questions_answered == 0:
            return 0.0
        return self.total_response_time_ms / self.questions_answered
    
    @property
    def is_performing_well(self) -> bool:
        """Child is performing well - consider increasing difficulty."""
        return (
            self.accuracy >= 70 and
            self.consecutive_correct >= 2 and
            self.questions_answered >= 3
        )
    
    @property
    def is_struggling(self) -> bool:
        """Child is struggling - consider decreasing difficulty."""
        return (
            self.accuracy < 40 or
            self.consecutive_wrong >= 2
        )
    
    @property
    def is_unstable(self) -> bool:
        """Performance is mixed - maintain current level."""
        if len(self.last_answers) < 3:
            return False
        # Check if answers alternate correct/wrong
        changes = sum(1 for i in range(1, len(self.last_answers)) 
                     if self.last_answers[i] != self.last_answers[i-1])
        return changes >= 2


@dataclass 
class SessionDifficulty:
    """Session-specific difficulty tracking."""
    session_id: str
    age_group: str
    current_level: DifficultyLevel = DifficultyLevel.NORMAL
    metrics: PerformanceMetrics = field(default_factory=PerformanceMetrics)
    difficulty_changes: List[Dict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


class AdaptiveDifficultyEngine:
    """
    Manages adaptive difficulty for dyscalculia screening tests.
    
    Adjusts question difficulty based on:
    - Accuracy rate
    - Response time
    - Answer stability (changes)
    - Consecutive correct/wrong patterns
    """
    
    # Session storage (use Redis in production)
    _sessions: Dict[str, SessionDifficulty] = {}
    
    # Age-specific difficulty boundaries
    AGE_DIFFICULTY_MAP = {
        "5-6": {
            DifficultyLevel.VERY_EASY: {"numbers": (1, 5), "operations": ["count"]},
            DifficultyLevel.EASY: {"numbers": (1, 7), "operations": ["count", "compare"]},
            DifficultyLevel.NORMAL: {"numbers": (1, 10), "operations": ["compare", "add"]},
            DifficultyLevel.CHALLENGING: {"numbers": (1, 15), "operations": ["add", "subtract"]},
            DifficultyLevel.ADVANCED: {"numbers": (1, 20), "operations": ["add", "subtract"]},
        },
        "7-8": {
            DifficultyLevel.VERY_EASY: {"numbers": (1, 10), "operations": ["count", "compare"]},
            DifficultyLevel.EASY: {"numbers": (1, 15), "operations": ["compare", "add"]},
            DifficultyLevel.NORMAL: {"numbers": (1, 20), "operations": ["add", "subtract"]},
            DifficultyLevel.CHALLENGING: {"numbers": (1, 30), "operations": ["add", "subtract", "multiply"]},
            DifficultyLevel.ADVANCED: {"numbers": (1, 50), "operations": ["add", "subtract", "multiply"]},
        },
        "9-10": {
            DifficultyLevel.VERY_EASY: {"numbers": (1, 20), "operations": ["compare", "add"]},
            DifficultyLevel.EASY: {"numbers": (1, 30), "operations": ["add", "subtract"]},
            DifficultyLevel.NORMAL: {"numbers": (1, 50), "operations": ["add", "subtract", "multiply"]},
            DifficultyLevel.CHALLENGING: {"numbers": (1, 75), "operations": ["add", "subtract", "multiply", "divide"]},
            DifficultyLevel.ADVANCED: {"numbers": (1, 100), "operations": ["add", "subtract", "multiply", "divide"]},
        },
    }
    
    # Response time thresholds (ms) by age
    RESPONSE_TIME_THRESHOLDS = {
        "5-6": {"slow": 15000, "normal": 10000, "fast": 5000},
        "7-8": {"slow": 12000, "normal": 8000, "fast": 4000},
        "9-10": {"slow": 10000, "normal": 6000, "fast": 3000},
    }
    
    def get_or_create_session(self, session_id: str, age_group: str) -> SessionDifficulty:
        """Get existing session or create new one."""
        if session_id not in self._sessions:
            self._sessions[session_id] = SessionDifficulty(
                session_id=session_id,
                age_group=age_group,
                current_level=DifficultyLevel.NORMAL
            )
        return self._sessions[session_id]
    
    def record_answer(
        self, 
        session_id: str, 
        is_correct: bool, 
        response_time_ms: int,
        answer_changes: int = 0
    ) -> DifficultyLevel:
        """
        Record an answer and adjust difficulty if needed.
        
        Returns the new difficulty level.
        """
        if session_id not in self._sessions:
            return DifficultyLevel.NORMAL
        
        session = self._sessions[session_id]
        metrics = session.metrics
        
        # Update metrics
        metrics.questions_answered += 1
        metrics.total_response_time_ms += response_time_ms
        metrics.answer_changes += answer_changes
        
        if is_correct:
            metrics.correct_answers += 1
            metrics.consecutive_correct += 1
            metrics.consecutive_wrong = 0
        else:
            metrics.consecutive_wrong += 1
            metrics.consecutive_correct = 0
        
        # Track last 5 answers for stability check
        metrics.last_answers.append(is_correct)
        if len(metrics.last_answers) > 5:
            metrics.last_answers.pop(0)
        
        # Adjust difficulty based on performance
        new_level = self._calculate_new_difficulty(session)
        
        if new_level != session.current_level:
            session.difficulty_changes.append({
                "from": session.current_level.name,
                "to": new_level.name,
                "reason": self._get_adjustment_reason(session),
                "timestamp": datetime.now().isoformat()
            })
            session.current_level = new_level
        
        return session.current_level
    
    def _calculate_new_difficulty(self, session: SessionDifficulty) -> DifficultyLevel:
        """Calculate new difficulty based on performance metrics."""
        metrics = session.metrics
        current = session.current_level
        
        # Need at least 2 questions before adjusting
        if metrics.questions_answered < 2:
            return current
        
        # Check if unstable - maintain level
        if metrics.is_unstable:
            return current
        
        # Check if struggling - decrease difficulty
        if metrics.is_struggling:
            if current.value > DifficultyLevel.VERY_EASY.value:
                return DifficultyLevel(current.value - 1)
            return current
        
        # Check if performing well - increase difficulty
        if metrics.is_performing_well:
            if current.value < DifficultyLevel.ADVANCED.value:
                return DifficultyLevel(current.value + 1)
            return current
        
        return current
    
    def _get_adjustment_reason(self, session: SessionDifficulty) -> str:
        """Get human-readable reason for difficulty adjustment."""
        metrics = session.metrics
        
        if metrics.is_struggling:
            return f"Struggling: {metrics.accuracy:.0f}% accuracy, {metrics.consecutive_wrong} consecutive wrong"
        elif metrics.is_performing_well:
            return f"Performing well: {metrics.accuracy:.0f}% accuracy, {metrics.consecutive_correct} consecutive correct"
        else:
            return "Performance stabilizing"
    
    def get_difficulty_params(self, session_id: str, age_group: str) -> Dict:
        """
        Get parameters for question generation based on current difficulty.
        
        Returns dict with number ranges, allowed operations, sequence lengths, etc.
        """
        session = self.get_or_create_session(session_id, age_group)
        
        age_config = self.AGE_DIFFICULTY_MAP.get(age_group, self.AGE_DIFFICULTY_MAP["7-8"])
        level_config = age_config.get(session.current_level, age_config[DifficultyLevel.NORMAL])
        
        return {
            "difficulty_level": session.current_level.name,
            "difficulty_value": session.current_level.value,
            "number_range": level_config["numbers"],
            "operations": level_config["operations"],
            "sequence_length": self._get_sequence_length(age_group, session.current_level),
            "accuracy_so_far": session.metrics.accuracy,
            "questions_answered": session.metrics.questions_answered,
        }
    
    def _get_sequence_length(self, age_group: str, level: DifficultyLevel) -> int:
        """Get memory sequence length based on age and difficulty."""
        base_lengths = {"5-6": 3, "7-8": 4, "9-10": 5}
        base = base_lengths.get(age_group, 4)
        
        # Adjust based on difficulty
        adjustment = level.value - 3  # -2 to +2
        return max(2, min(7, base + adjustment))
    
    def get_session_summary(self, session_id: str) -> Optional[Dict]:
        """Get summary of session's adaptive difficulty journey."""
        if session_id not in self._sessions:
            return None
        
        session = self._sessions[session_id]
        return {
            "session_id": session_id,
            "age_group": session.age_group,
            "current_difficulty": session.current_level.name,
            "questions_answered": session.metrics.questions_answered,
            "accuracy": session.metrics.accuracy,
            "avg_response_time_ms": session.metrics.avg_response_time_ms,
            "difficulty_changes": session.difficulty_changes,
        }


# Global instance
adaptive_engine = AdaptiveDifficultyEngine()
