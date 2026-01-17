from typing import List, Dict, Any
import numpy as np


class FeatureExtractor:
    """
    Extract features from test responses for ML classification.
    
    Features extracted:
    - Accuracy metrics
    - Response time patterns
    - Behavioral signals (hesitation, confidence, etc.)
    - Error patterns
    
    These features are used by the risk classifier for dyscalculia screening.
    """
    
    # Feature names for classification
    FEATURE_NAMES = [
        "accuracy_percent",
        "avg_response_time",
        "max_delay",
        "min_response_time",
        "error_rate",
        "skipped_questions",
        "answer_changes_total",
        "response_time_variance",
        "consecutive_errors",
        "rapid_response_count",
        "slow_response_count",
        "hesitation_index",
        "confidence_index",
    ]
    
    # Age-specific thresholds (ms)
    AGE_THRESHOLDS = {
        "5-6": {"min_thinking": 2000, "normal": 8000, "slow": 15000},
        "7-8": {"min_thinking": 1500, "normal": 6000, "slow": 12000},
        "9-10": {"min_thinking": 1000, "normal": 5000, "slow": 10000},
    }
    
    @classmethod
    def extract(cls, answers: List[Dict[str, Any]], age_group: str = "7-8") -> Dict[str, float]:
        """
        Extract features from a list of answer submissions.
        
        Args:
            answers: List of answer dictionaries from test session
            age_group: Age group for threshold calibration
        
        Returns:
            Dictionary with extracted features for ML model
        """
        if not answers:
            return {name: 0.0 for name in cls.FEATURE_NAMES}
        
        thresholds = cls.AGE_THRESHOLDS.get(age_group, cls.AGE_THRESHOLDS["7-8"])
        
        total = len(answers)
        correct_count = sum(1 for a in answers if a.get("correct", False))
        response_times = [a.get("response_time_ms", 0) for a in answers]
        answer_changes = sum(a.get("answer_changes", 0) for a in answers)
        skipped = sum(1 for a in answers if a.get("skipped", False))
        
        # Calculate consecutive errors (pattern detection for dyscalculia)
        consecutive_errors = 0
        max_consecutive = 0
        for a in answers:
            if not a.get("correct", True):
                consecutive_errors += 1
                max_consecutive = max(max_consecutive, consecutive_errors)
            else:
                consecutive_errors = 0
        
        # Count rapid responses (potential guessing)
        rapid_responses = sum(1 for t in response_times if t < thresholds["min_thinking"])
        
        # Count slow responses (potential cognitive load)
        slow_responses = sum(1 for t in response_times if t > thresholds["slow"])
        
        # Calculate hesitation index (based on answer changes and response time)
        avg_time = np.mean(response_times) if response_times else 0
        hesitation_index = 0.0
        if avg_time > 0:
            # Higher hesitation = slower responses + more answer changes
            time_factor = min(1.0, avg_time / thresholds["slow"])
            change_factor = min(1.0, answer_changes / (total * 2))
            hesitation_index = (time_factor + change_factor) / 2
        
        # Calculate confidence index (inverse of hesitation, adjusted for accuracy)
        confidence_index = 0.0
        if total > 0:
            accuracy = correct_count / total
            stability = 1.0 - min(1.0, answer_changes / total)
            speed_factor = 1.0 - min(1.0, avg_time / thresholds["normal"])
            confidence_index = (accuracy * 0.4 + stability * 0.3 + speed_factor * 0.3)
        
        return {
            "accuracy_percent": (correct_count / total) * 100,
            "avg_response_time": avg_time,
            "max_delay": max(response_times) if response_times else 0,
            "min_response_time": min(response_times) if response_times else 0,
            "error_rate": ((total - correct_count) / total) * 100,
            "skipped_questions": float(skipped),
            "answer_changes_total": float(answer_changes),
            "response_time_variance": float(np.var(response_times)) if len(response_times) > 1 else 0.0,
            "consecutive_errors": float(max_consecutive),
            "rapid_response_count": float(rapid_responses),
            "slow_response_count": float(slow_responses),
            "hesitation_index": round(hesitation_index, 3),
            "confidence_index": round(confidence_index, 3),
        }
    
    @classmethod
    def to_vector(cls, features: Dict[str, float]) -> np.ndarray:
        """Convert feature dictionary to numpy array for ML model."""
        return np.array([features.get(name, 0.0) for name in cls.FEATURE_NAMES]).reshape(1, -1)
    
    @classmethod
    def get_feature_summary(cls, features: Dict[str, float]) -> str:
        """Generate a human-readable summary of extracted features."""
        return f"""
Feature Summary:
- Accuracy: {features.get('accuracy_percent', 0):.1f}%
- Avg Response Time: {features.get('avg_response_time', 0):.0f}ms
- Answer Changes: {features.get('answer_changes_total', 0):.0f}
- Consecutive Errors: {features.get('consecutive_errors', 0):.0f}
- Hesitation Index: {features.get('hesitation_index', 0):.2f}
- Confidence Index: {features.get('confidence_index', 0):.2f}
- Rapid Responses: {features.get('rapid_response_count', 0):.0f}
- Slow Responses: {features.get('slow_response_count', 0):.0f}
"""

