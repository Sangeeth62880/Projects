from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class AgeGroup(str, Enum):
    AGE_5_6 = "5-6"
    AGE_7_8 = "7-8"
    AGE_9_10 = "9-10"


class TestType(str, Enum):
    NUMBER_COMPARISON = "number-comparison"
    MENTAL_ARITHMETIC = "mental-arithmetic"
    MEMORY_RECALL = "memory-recall"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SessionRequest(BaseModel):
    age_group: AgeGroup


class SessionResponse(BaseModel):
    session_id: str
    age_group: AgeGroup
    message: str


class Question(BaseModel):
    question_id: str
    test_type: TestType
    story: str
    visual_object: str
    left_value: Optional[int] = None
    right_value: Optional[int] = None
    memory_sequence: Optional[List[str]] = None
    options: List[str]
    correct_answer: str
    # Contextual visual fields
    emoji: Optional[str] = None  # The object being counted (🥕, ⭐, 🎈)
    left_emoji: Optional[str] = None  # Character for left side (🐰)
    right_emoji: Optional[str] = None  # Character for right side (🐻)
    left_label: Optional[str] = None  # Label for left side (Rabbit)
    right_label: Optional[str] = None  # Label for right side (Bear)


class QuestionSetResponse(BaseModel):
    questions: List[Question]
    test_type: TestType
    total_questions: int


class AnswerSubmission(BaseModel):
    session_id: str
    question_id: str
    selected_answer: str
    response_time_ms: int
    answer_changes: int = 0


class AnswerResponse(BaseModel):
    correct: bool
    message: str


class FeatureVector(BaseModel):
    accuracy_percent: float
    avg_response_time: float
    max_delay: float
    error_rate: float
    skipped_questions: int
    answer_changes: int


class RiskClassificationRequest(BaseModel):
    session_id: str
    features: FeatureVector


class RiskClassificationResponse(BaseModel):
    risk_level: RiskLevel
    confidence: float
    explanation: str
    recommendations: List[str]


class DashboardMetrics(BaseModel):
    session_id: str
    child_age: AgeGroup
    test_results: dict
    overall_accuracy: float
    avg_response_time: float
    risk_assessment: RiskClassificationResponse


class TTSRequest(BaseModel):
    text: str
    voice: str = "child-friendly"


class STTResponse(BaseModel):
    transcription: str
    confidence: float
