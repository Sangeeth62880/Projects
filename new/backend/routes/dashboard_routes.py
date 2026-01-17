from fastapi import APIRouter, HTTPException
from schemas.schemas import DashboardMetrics, AgeGroup, RiskLevel
from ai.gemini_generator import GeminiQuestionGenerator

router = APIRouter()

gemini = GeminiQuestionGenerator()


@router.get("/dashboard/{session_id}", response_model=DashboardMetrics)
async def get_dashboard_metrics(session_id: str):
    """Get dashboard metrics for a completed session."""
    # Import here to avoid circular imports
    from routes.test_routes import sessions, answers
    
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    session_answers = answers.get(session_id, [])
    
    # Calculate metrics
    total = len(session_answers)
    correct = sum(1 for a in session_answers if a.get("correct", False))
    accuracy = (correct / total * 100) if total > 0 else 0
    
    avg_time = sum(a.get("response_time_ms", 0) for a in session_answers) / total if total > 0 else 0
    
    # Mock risk assessment (would use ML in production)
    from schemas.schemas import RiskClassificationResponse
    risk = RiskClassificationResponse(
        risk_level=RiskLevel.LOW if accuracy > 70 else RiskLevel.MEDIUM if accuracy > 40 else RiskLevel.HIGH,
        confidence=0.85,
        explanation="Based on test performance analysis.",
        recommendations=["Continue regular practice", "Consider professional consultation if concerned"]
    )
    
    return DashboardMetrics(
        session_id=session_id,
        child_age=session["age_group"],
        test_results={
            "total_questions": total,
            "correct_answers": correct,
            "tests_completed": session.get("completed_tests", [])
        },
        overall_accuracy=accuracy,
        avg_response_time=avg_time,
        risk_assessment=risk
    )


@router.get("/dashboard/{session_id}/explanation")
async def get_explanation(session_id: str):
    """Get AI-generated explanation of results for parents."""
    from routes.test_routes import sessions
    
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Generate parent-friendly explanation using Gemini
    explanation = await gemini.generate_parent_explanation(session_id)
    
    return {"explanation": explanation}
