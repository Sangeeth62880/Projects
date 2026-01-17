const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SessionResponse {
    session_id: string;
    age_group: string;
    message: string;
}

export interface QuestionResponse {
    questions: Array<{
        question_id: string;
        test_type: string;
        story: string;
        visual_object: string;
        left_value?: number;
        right_value?: number;
        memory_sequence?: string[];
        options: string[];
        correct_answer: string;
    }>;
    test_type: string;
    total_questions: number;
}

export interface STTResponse {
    transcription: string;
    confidence: number;
}

export interface RiskResponse {
    risk_level: 'low' | 'medium' | 'high';
    confidence: number;
    explanation: string;
    recommendations: string[];
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async startSession(ageGroup: string): Promise<SessionResponse> {
        const response = await fetch(`${this.baseUrl}/api/session/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ age_group: ageGroup }),
        });

        if (!response.ok) {
            throw new Error('Failed to start session');
        }

        return response.json();
    }

    async getQuestions(testType: string, sessionId: string, ageGroup: string): Promise<QuestionResponse> {
        const params = new URLSearchParams({
            session_id: sessionId,
            age_group: ageGroup,
        });

        const response = await fetch(
            `${this.baseUrl}/api/questions/${testType}?${params}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }

        return response.json();
    }

    async submitAnswer(data: {
        sessionId: string;
        questionId: string;
        selectedAnswer: string;
        responseTimeMs: number;
        answerChanges: number;
    }): Promise<{ correct: boolean; message: string }> {
        const response = await fetch(`${this.baseUrl}/api/answer/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: data.sessionId,
                question_id: data.questionId,
                selected_answer: data.selectedAnswer,
                response_time_ms: data.responseTimeMs,
                answer_changes: data.answerChanges,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit answer');
        }

        return response.json();
    }

    async speechToText(audioBlob: Blob): Promise<STTResponse> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        const response = await fetch(`${this.baseUrl}/api/stt`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Speech to text failed');
        }

        return response.json();
    }

    async textToSpeech(text: string): Promise<Blob> {
        const response = await fetch(`${this.baseUrl}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice: 'child-friendly' }),
        });

        if (!response.ok) {
            throw new Error('Text to speech failed');
        }

        return response.blob();
    }

    async analyzeRisk(sessionId: string, features: {
        accuracy_percent: number;
        avg_response_time: number;
        max_delay: number;
        error_rate: number;
        skipped_questions: number;
        answer_changes: number;
    }): Promise<RiskResponse> {
        const response = await fetch(`${this.baseUrl}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                features,
            }),
        });

        if (!response.ok) {
            throw new Error('Risk analysis failed');
        }

        return response.json();
    }

    async getDashboardMetrics(sessionId: string) {
        const response = await fetch(
            `${this.baseUrl}/api/dashboard/${sessionId}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard metrics');
        }

        return response.json();
    }
}

export const api = new ApiClient();
