"""
Behavioral Signal Analysis Engine for Dyscalculia Screening

Extracts cognitive behavior patterns beyond simple correctness:
- Response latency patterns
- Answer revision behavior
- Hesitation indicators
- Cognitive load signals

All derived features are used for AI-based screening analysis.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
import statistics


@dataclass
class RawSignal:
    """Raw behavioral signal captured during a response."""
    question_id: str
    response_time_ms: int
    answer_changes: int
    idle_time_before_submit_ms: int
    time_to_first_interaction_ms: int
    is_correct: bool
    selected_answer: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class DerivedFeatures:
    """Computed cognitive behavior features."""
    hesitation_score: float  # 0-1: Higher = more hesitation
    confidence_estimation_score: float  # 0-1: Higher = more confident
    decision_stability_index: float  # 0-1: Higher = more stable decisions
    cognitive_load_indicator: float  # 0-1: Higher = more cognitive strain
    rapid_guessing_detected: bool  # True if answering too fast to think
    speed_accuracy_imbalance: float  # Negative = speed, Positive = accuracy focused


class BehavioralSignalAnalyzer:
    """
    Extracts and analyzes behavioral signals during dyscalculia screening.
    
    Captures:
    - Response latency patterns
    - Answer revision count
    - Idle time before submission
    - Rapid guessing behavior
    - Speed vs accuracy imbalance
    
    Computes:
    - hesitation_score
    - confidence_estimation_score
    - decision_stability_index
    - cognitive_load_indicator
    """
    
    # Age-based expected response time thresholds (ms)
    AGE_RESPONSE_THRESHOLDS = {
        "5-6": {"min_thinking": 2000, "normal": 8000, "slow": 15000},
        "7-8": {"min_thinking": 1500, "normal": 6000, "slow": 12000},
        "9-10": {"min_thinking": 1000, "normal": 5000, "slow": 10000},
    }
    
    # Sessions storage
    _sessions: Dict[str, Dict] = {}
    
    def get_or_create_session(self, session_id: str, age_group: str) -> Dict:
        """Initialize or retrieve session behavioral data."""
        if session_id not in self._sessions:
            self._sessions[session_id] = {
                "age_group": age_group,
                "signals": [],
                "derived_features_history": [],
                "created_at": datetime.now(),
            }
        return self._sessions[session_id]
    
    def record_signal(
        self,
        session_id: str,
        question_id: str,
        response_time_ms: int,
        answer_changes: int,
        idle_time_before_submit_ms: int,
        time_to_first_interaction_ms: int,
        is_correct: bool,
        selected_answer: str,
        age_group: str = "7-8"
    ) -> DerivedFeatures:
        """
        Record a raw behavioral signal and compute derived features.
        
        Returns computed DerivedFeatures for this response.
        """
        session = self.get_or_create_session(session_id, age_group)
        
        signal = RawSignal(
            question_id=question_id,
            response_time_ms=response_time_ms,
            answer_changes=answer_changes,
            idle_time_before_submit_ms=idle_time_before_submit_ms,
            time_to_first_interaction_ms=time_to_first_interaction_ms,
            is_correct=is_correct,
            selected_answer=selected_answer,
        )
        
        session["signals"].append(signal)
        
        # Compute derived features based on this and recent signals
        features = self._compute_derived_features(session, signal, age_group)
        session["derived_features_history"].append(features)
        
        return features
    
    def _compute_derived_features(
        self, 
        session: Dict, 
        current_signal: RawSignal,
        age_group: str
    ) -> DerivedFeatures:
        """Compute cognitive behavior features from signals."""
        
        signals = session["signals"]
        thresholds = self.AGE_RESPONSE_THRESHOLDS.get(age_group, self.AGE_RESPONSE_THRESHOLDS["7-8"])
        
        # --- Hesitation Score ---
        # Based on: idle time before submit, time to first interaction, response time
        hesitation_components = []
        
        # Long idle time before submitting indicates hesitation
        if current_signal.idle_time_before_submit_ms > 2000:
            hesitation_components.append(min(1.0, current_signal.idle_time_before_submit_ms / 10000))
        
        # Long time to first interaction indicates uncertainty
        if current_signal.time_to_first_interaction_ms > thresholds["min_thinking"]:
            hesitation_components.append(min(1.0, current_signal.time_to_first_interaction_ms / 8000))
        
        # Multiple answer changes indicate hesitation
        if current_signal.answer_changes > 0:
            hesitation_components.append(min(1.0, current_signal.answer_changes / 5))
        
        hesitation_score = sum(hesitation_components) / max(len(hesitation_components), 1)
        hesitation_score = min(1.0, max(0.0, hesitation_score))
        
        # --- Confidence Estimation Score ---
        # High confidence = quick response, no changes, correct answer
        confidence_factors = []
        
        # Fast response (within normal range) = high confidence
        if current_signal.response_time_ms < thresholds["normal"]:
            confidence_factors.append(1.0 - (current_signal.response_time_ms / thresholds["normal"]))
        else:
            confidence_factors.append(0.0)
        
        # No answer changes = higher confidence
        confidence_factors.append(1.0 if current_signal.answer_changes == 0 else max(0, 1.0 - current_signal.answer_changes * 0.25))
        
        # Correct answer adds to confidence
        if current_signal.is_correct:
            confidence_factors.append(0.8)
        
        confidence_estimation_score = sum(confidence_factors) / max(len(confidence_factors), 1)
        confidence_estimation_score = min(1.0, max(0.0, confidence_estimation_score))
        
        # --- Decision Stability Index ---
        # Based on consistency of answer changes across recent questions
        recent_signals = signals[-5:]  # Last 5 responses
        total_changes = sum(s.answer_changes for s in recent_signals)
        avg_changes_per_question = total_changes / max(len(recent_signals), 1)
        
        # Lower changes = higher stability
        decision_stability_index = max(0.0, 1.0 - (avg_changes_per_question / 3))
        
        # --- Cognitive Load Indicator ---
        # High cognitive load = slow responses, many changes, increasing response times
        cognitive_load_factors = []
        
        # Slow response indicates processing difficulty
        if current_signal.response_time_ms > thresholds["normal"]:
            cognitive_load_factors.append(min(1.0, current_signal.response_time_ms / thresholds["slow"]))
        
        # Many answer changes indicate cognitive strain
        cognitive_load_factors.append(min(1.0, current_signal.answer_changes / 4))
        
        # Check for increasing response times (trend analysis)
        if len(signals) >= 3:
            recent_times = [s.response_time_ms for s in signals[-3:]]
            if all(recent_times[i] < recent_times[i+1] for i in range(len(recent_times)-1)):
                cognitive_load_factors.append(0.7)  # Increasing trend = fatigue
        
        cognitive_load_indicator = sum(cognitive_load_factors) / max(len(cognitive_load_factors), 1)
        cognitive_load_indicator = min(1.0, max(0.0, cognitive_load_indicator))
        
        # --- Rapid Guessing Detection ---
        # Answering faster than minimum thinking time
        rapid_guessing_detected = current_signal.response_time_ms < thresholds["min_thinking"]
        
        # --- Speed vs Accuracy Imbalance ---
        # Negative = prioritizing speed (fast but wrong)
        # Positive = prioritizing accuracy (slow but correct)
        if len(signals) >= 3:
            recent = signals[-3:]
            avg_time = statistics.mean(s.response_time_ms for s in recent)
            accuracy = sum(1 for s in recent if s.is_correct) / len(recent)
            
            # Normalize time to 0-1 scale
            time_factor = avg_time / thresholds["slow"]
            
            # Imbalance: accuracy - (1 - time_factor)
            # Fast & accurate = balanced, Slow & inaccurate = negative imbalance
            speed_accuracy_imbalance = accuracy - (1 - time_factor)
        else:
            speed_accuracy_imbalance = 0.0
        
        return DerivedFeatures(
            hesitation_score=round(hesitation_score, 3),
            confidence_estimation_score=round(confidence_estimation_score, 3),
            decision_stability_index=round(decision_stability_index, 3),
            cognitive_load_indicator=round(cognitive_load_indicator, 3),
            rapid_guessing_detected=rapid_guessing_detected,
            speed_accuracy_imbalance=round(speed_accuracy_imbalance, 3),
        )
    
    def get_session_analysis(self, session_id: str) -> Optional[Dict]:
        """Get comprehensive behavioral analysis for a session."""
        if session_id not in self._sessions:
            return None
        
        session = self._sessions[session_id]
        signals = session["signals"]
        
        if not signals:
            return None
        
        features_history = session["derived_features_history"]
        
        # Aggregate metrics
        total_correct = sum(1 for s in signals if s.is_correct)
        accuracy = total_correct / len(signals)
        
        avg_response_time = statistics.mean(s.response_time_ms for s in signals)
        total_answer_changes = sum(s.answer_changes for s in signals)
        
        rapid_guessing_count = sum(1 for f in features_history if f.rapid_guessing_detected)
        
        # Average derived features
        avg_hesitation = statistics.mean(f.hesitation_score for f in features_history) if features_history else 0
        avg_confidence = statistics.mean(f.confidence_estimation_score for f in features_history) if features_history else 0
        avg_stability = statistics.mean(f.decision_stability_index for f in features_history) if features_history else 0
        avg_cognitive_load = statistics.mean(f.cognitive_load_indicator for f in features_history) if features_history else 0
        
        return {
            "session_id": session_id,
            "age_group": session["age_group"],
            "total_questions": len(signals),
            "accuracy": round(accuracy, 3),
            "avg_response_time_ms": round(avg_response_time, 0),
            "total_answer_changes": total_answer_changes,
            "rapid_guessing_count": rapid_guessing_count,
            "behavioral_metrics": {
                "avg_hesitation_score": round(avg_hesitation, 3),
                "avg_confidence_score": round(avg_confidence, 3),
                "avg_decision_stability": round(avg_stability, 3),
                "avg_cognitive_load": round(avg_cognitive_load, 3),
            },
            "signals": [
                {
                    "question_id": s.question_id,
                    "response_time_ms": s.response_time_ms,
                    "answer_changes": s.answer_changes,
                    "is_correct": s.is_correct,
                }
                for s in signals
            ],
        }
    
    def get_ai_analysis_context(self, session_id: str) -> str:
        """Generate context string for AI-based analysis."""
        analysis = self.get_session_analysis(session_id)
        if not analysis:
            return "No behavioral data available."
        
        return f"""
BEHAVIORAL ANALYSIS CONTEXT:

Session: {analysis['session_id']}
Age Group: {analysis['age_group']}
Total Questions: {analysis['total_questions']}
Overall Accuracy: {analysis['accuracy'] * 100:.1f}%
Average Response Time: {analysis['avg_response_time_ms']:.0f}ms
Total Answer Changes: {analysis['total_answer_changes']}
Rapid Guessing Instances: {analysis['rapid_guessing_count']}

COGNITIVE METRICS:
- Hesitation Score: {analysis['behavioral_metrics']['avg_hesitation_score']:.2f} (0=decisive, 1=very hesitant)
- Confidence Score: {analysis['behavioral_metrics']['avg_confidence_score']:.2f} (0=uncertain, 1=confident)
- Decision Stability: {analysis['behavioral_metrics']['avg_decision_stability']:.2f} (0=unstable, 1=stable)
- Cognitive Load: {analysis['behavioral_metrics']['avg_cognitive_load']:.2f} (0=low, 1=high strain)

This data should inform the screening interpretation.
"""


# Global instance
behavioral_analyzer = BehavioralSignalAnalyzer()
