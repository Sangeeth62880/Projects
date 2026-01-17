import { create } from 'zustand';

export type AgeGroup = '5-6' | '7-8' | '9-10';
export type TestType = 'number-comparison' | 'mental-arithmetic' | 'memory-recall';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Question {
    questionId: string;
    testType: TestType;
    story: string;
    visualObject: string;
    leftValue?: number;
    rightValue?: number;
    memorySequence?: string[];
    options: string[];
    correctAnswer: string;
    // Contextual emoji fields for visual display
    emoji?: string;           // The object being counted (🥕, ⭐, 🎈)
    left_emoji?: string;      // Character for left side (🐰)
    right_emoji?: string;     // Character for right side (🐻)
    left_label?: string;      // Label for left side (Rabbit)
    right_label?: string;     // Label for right side (Bear)
}

export interface Answer {
    questionId: string;
    selectedAnswer: string;
    responseTimeMs: number;
    answerChanges: number;
    correct: boolean;
}

export interface TestResult {
    testType: TestType;
    totalQuestions: number;
    correctAnswers: number;
    avgResponseTime: number;
    answers: Answer[];
}

export interface RiskAssessment {
    riskLevel: RiskLevel;
    confidence: number;
    explanation: string;
    recommendations: string[];
}

interface TestStore {
    // Session
    sessionId: string | null;
    ageGroup: AgeGroup | null;

    // Current test state
    currentTestType: TestType | null;
    questions: Question[];
    currentQuestionIndex: number;
    answers: Answer[];

    // Results
    testResults: TestResult[];
    riskAssessment: RiskAssessment | null;

    // Timing
    questionStartTime: number | null;

    // Actions
    setSessionId: (id: string) => void;
    setAgeGroup: (age: AgeGroup) => void;
    startTest: (testType: TestType, questions: Question[]) => void;
    submitAnswer: (answer: string, answerChanges?: number) => void;
    nextQuestion: () => void;
    completeTest: () => void;
    setRiskAssessment: (assessment: RiskAssessment) => void;
    resetSession: () => void;

    // Computed
    getCurrentQuestion: () => Question | null;
    getProgress: () => number;
    isTestComplete: () => boolean;
}

export const useTestStore = create<TestStore>((set, get) => ({
    // Initial state
    sessionId: null,
    ageGroup: null,
    currentTestType: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    testResults: [],
    riskAssessment: null,
    questionStartTime: null,

    // Actions
    // CRITICAL: Setting a new sessionId CLEARS all previous session data
    // This ensures dashboard only shows current session insights
    setSessionId: (id) => set({
        sessionId: id,
        // Reset all session-specific data for clean slate
        currentTestType: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        testResults: [],  // Clear previous test results
        riskAssessment: null,  // Clear previous assessment
        questionStartTime: null,
    }),

    setAgeGroup: (age) => set({ ageGroup: age }),

    startTest: (testType, questions) => set({
        currentTestType: testType,
        questions,
        currentQuestionIndex: 0,
        answers: [],
        questionStartTime: Date.now(),
    }),

    submitAnswer: (answer, answerChanges = 0) => {
        const { questions, currentQuestionIndex, answers, questionStartTime } = get();
        const currentQuestion = questions[currentQuestionIndex];

        if (!currentQuestion || !questionStartTime) return;

        const responseTime = Date.now() - questionStartTime;
        const isCorrect = answer === currentQuestion.correctAnswer;

        const newAnswer: Answer = {
            questionId: currentQuestion.questionId,
            selectedAnswer: answer,
            responseTimeMs: responseTime,
            answerChanges,
            correct: isCorrect,
        };

        set({ answers: [...answers, newAnswer] });
    },

    nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex < questions.length - 1) {
            set({
                currentQuestionIndex: currentQuestionIndex + 1,
                questionStartTime: Date.now(),
            });
        }
    },

    completeTest: () => {
        const { currentTestType, questions, answers, testResults } = get();

        if (!currentTestType) return;

        const correctCount = answers.filter(a => a.correct).length;
        const avgTime = answers.length > 0
            ? answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / answers.length
            : 0;

        const result: TestResult = {
            testType: currentTestType,
            totalQuestions: questions.length,
            correctAnswers: correctCount,
            avgResponseTime: avgTime,
            answers,
        };

        set({
            testResults: [...testResults, result],
            currentTestType: null,
            questions: [],
            currentQuestionIndex: 0,
            answers: [],
            questionStartTime: null,
        });
    },

    setRiskAssessment: (assessment) => set({ riskAssessment: assessment }),

    resetSession: () => set({
        sessionId: null,
        ageGroup: null,
        currentTestType: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        testResults: [],
        riskAssessment: null,
        questionStartTime: null,
    }),

    // Computed getters
    getCurrentQuestion: () => {
        const { questions, currentQuestionIndex } = get();
        return questions[currentQuestionIndex] || null;
    },

    getProgress: () => {
        const { currentQuestionIndex, questions } = get();
        if (questions.length === 0) return 0;
        return ((currentQuestionIndex + 1) / questions.length) * 100;
    },

    isTestComplete: () => {
        const { currentQuestionIndex, questions, answers } = get();
        return questions.length > 0 && answers.length === questions.length;
    },
}));
