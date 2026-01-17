import os
import pickle
from typing import Optional
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from schemas.schemas import FeatureVector, RiskClassificationResponse, RiskLevel


class RiskClassifier:
    """ML-based risk classifier for dyscalculia screening."""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.model_path = model_path or os.path.join(
            os.path.dirname(__file__), "models", "risk_classifier.pkl"
        )
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Load existing model or create a new one with synthetic data."""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
                return
            except Exception as e:
                print(f"Error loading model: {e}")
        
        # Create and train with synthetic data
        self._train_with_synthetic_data()
    
    def _train_with_synthetic_data(self):
        """Train model with synthetic data for MVP."""
        np.random.seed(42)
        
        # Generate synthetic training data
        # Features: [accuracy, avg_time, max_delay, error_rate, skipped, changes]
        
        # Low risk: High accuracy, normal times
        low_risk = np.random.normal(
            loc=[85, 3000, 6000, 15, 0, 1],
            scale=[10, 500, 1000, 10, 0.5, 1],
            size=(100, 6)
        )
        
        # Medium risk: Medium accuracy, variable times
        medium_risk = np.random.normal(
            loc=[55, 5000, 10000, 45, 1, 3],
            scale=[15, 1000, 2000, 15, 1, 2],
            size=(100, 6)
        )
        
        # High risk: Low accuracy, slow/erratic times
        high_risk = np.random.normal(
            loc=[25, 8000, 15000, 75, 3, 5],
            scale=[15, 2000, 3000, 15, 2, 2],
            size=(100, 6)
        )
        
        # Combine and clip to valid ranges
        X = np.vstack([low_risk, medium_risk, high_risk])
        X = np.clip(X, 0, None)  # No negative values
        X[:, 0] = np.clip(X[:, 0], 0, 100)  # Accuracy 0-100
        X[:, 3] = np.clip(X[:, 3], 0, 100)  # Error rate 0-100
        
        y = np.array([0] * 100 + [1] * 100 + [2] * 100)  # 0=Low, 1=Medium, 2=High
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X, y)
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)
        
        print("Trained and saved new risk classifier model")
    
    def classify(self, features: FeatureVector) -> RiskClassificationResponse:
        """Classify risk level based on extracted features."""
        
        # Convert to array
        X = np.array([[
            features.accuracy_percent,
            features.avg_response_time,
            features.max_delay,
            features.error_rate,
            features.skipped_questions,
            features.answer_changes
        ]])
        
        if self.model is None:
            self._train_with_synthetic_data()
        
        # Predict
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        confidence = float(max(probabilities))
        
        # Map to risk level
        risk_levels = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH]
        risk_level = risk_levels[prediction]
        
        # Generate recommendations
        recommendations = self._get_recommendations(risk_level, features)
        explanation = self._get_explanation(risk_level, features, confidence)
        
        return RiskClassificationResponse(
            risk_level=risk_level,
            confidence=confidence,
            explanation=explanation,
            recommendations=recommendations
        )
    
    def _get_explanation(
        self,
        risk: RiskLevel,
        features: FeatureVector,
        confidence: float
    ) -> str:
        """Generate human-readable explanation."""
        
        explanations = {
            RiskLevel.LOW: f"Based on the assessment (accuracy: {features.accuracy_percent:.1f}%), your child showed strong number sense and mathematical reasoning. Response times were within normal range.",
            RiskLevel.MEDIUM: f"The assessment shows some areas that may benefit from additional support (accuracy: {features.accuracy_percent:.1f}%). This is common and doesn't indicate a diagnosis.",
            RiskLevel.HIGH: f"The screening suggests that a professional evaluation may be beneficial (accuracy: {features.accuracy_percent:.1f}%). Early support can make a significant positive difference."
        }
        
        return explanations.get(risk, "Assessment completed. Please consult a specialist for detailed analysis.")
    
    def _get_recommendations(
        self,
        risk: RiskLevel,
        features: FeatureVector
    ) -> list:
        """Generate personalized recommendations."""
        
        base_recommendations = {
            RiskLevel.LOW: [
                "Continue with regular age-appropriate math activities",
                "Encourage number games and puzzles",
                "Celebrate their mathematical curiosity"
            ],
            RiskLevel.MEDIUM: [
                "Consider additional practice with number concepts",
                "Use visual and hands-on learning materials",
                "Monitor progress over the next few months",
                "Consult with teacher about classroom support"
            ],
            RiskLevel.HIGH: [
                "Schedule an evaluation with an educational psychologist",
                "Explore specialized learning support options",
                "Use multi-sensory learning approaches",
                "Connect with school special education services",
                "Consider working with a math specialist tutor"
            ]
        }
        
        return base_recommendations.get(risk, [])
