'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Home } from 'lucide-react';
import { useTestStore, Question } from '@/store/testStore';
import { PuzzleCard } from '@/components/PuzzleCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Timer } from '@/components/Timer';
import { VoiceController } from '@/components/VoiceController';
import { Mascot } from '@/components/Mascot';
import { api } from '@/lib/api';

const fallbackQuestions: Question[] = [
    {
        questionId: 'mr_1',
        testType: 'memory-recall',
        story: 'Look at these animals: 🐶 🐱 🐰 🐻. Which animal came second?',
        visualObject: '🐱',
        memorySequence: ['🐶', '🐱', '🐰', '🐻'],
        options: ['🐶', '🐱', '🐰', '🐻'],
        correctAnswer: '🐱',
    },
    {
        questionId: 'mr_2',
        testType: 'memory-recall',
        story: 'Remember these numbers: 3, 7, 2, 9. What was the third number?',
        visualObject: '🔢',
        memorySequence: ['3', '7', '2', '9'],
        options: ['3', '7', '2', '9'],
        correctAnswer: '2',
    },
    {
        questionId: 'mr_3',
        testType: 'memory-recall',
        story: 'Look at these fruits: 🍎 🍌 🍇 🍊. Which fruit came last?',
        visualObject: '🍊',
        memorySequence: ['🍎', '🍌', '🍇', '🍊'],
        options: ['🍎', '🍌', '🍇', '🍊'],
        correctAnswer: '🍊',
    },
    {
        questionId: 'mr_4',
        testType: 'memory-recall',
        story: 'Remember: 🌟 🌙 ☀️ 🌈. Which came first?',
        visualObject: '🌟',
        memorySequence: ['🌟', '🌙', '☀️', '🌈'],
        options: ['🌟', '🌙', '☀️', '🌈'],
        correctAnswer: '🌟',
    },
    {
        questionId: 'mr_5',
        testType: 'memory-recall',
        story: 'These shapes appeared: 🔴 🔵 🟢 🟡. What was the third shape?',
        visualObject: '🟢',
        memorySequence: ['🔴', '🔵', '🟢', '🟡'],
        options: ['🔴', '🔵', '🟢', '🟡'],
        correctAnswer: '🟢',
    },
];

export default function MemoryTestPage() {
    const router = useRouter();
    const {
        sessionId,
        ageGroup,
        questions,
        currentQuestionIndex,
        answers,
        startTest,
        submitAnswer,
        nextQuestion,
        completeTest,
        getCurrentQuestion,
        getProgress,
    } = useTestStore();

    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [answerChanges, setAnswerChanges] = useState(0);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [showMemory, setShowMemory] = useState(true);
    const [memoryTimer, setMemoryTimer] = useState(5);

    const currentQuestion = getCurrentQuestion();
    const progress = getProgress();
    const earnedStars = answers.filter(a => a.correct).length;

    useEffect(() => {
        const loadQuestions = async () => {
            setIsLoading(true);

            try {
                if (sessionId && ageGroup) {
                    const response = await api.getQuestions('memory-recall', sessionId, ageGroup);
                    const mappedQuestions: Question[] = response.questions.map(q => ({
                        questionId: q.question_id,
                        testType: 'memory-recall',
                        story: q.story,
                        visualObject: q.visual_object,
                        memorySequence: q.memory_sequence,
                        options: q.options,
                        correctAnswer: q.correct_answer,
                    }));
                    startTest('memory-recall', mappedQuestions);
                } else {
                    startTest('memory-recall', fallbackQuestions);
                }
            } catch (error) {
                console.error('Failed to load questions:', error);
                startTest('memory-recall', fallbackQuestions);
            } finally {
                setIsLoading(false);
            }
        };

        loadQuestions();
        loadQuestions();
    }, [sessionId, ageGroup, startTest]);

    // Memory display timer
    useEffect(() => {
        if (!currentQuestion) return;

        setShowMemory(true);
        setMemoryTimer(5);

        const timer = setInterval(() => {
            setMemoryTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setShowMemory(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQuestion]);

    const handleSelectAnswer = useCallback((answer: string) => {
        if (showResult) return;

        if (selectedAnswer && selectedAnswer !== answer) {
            setAnswerChanges(prev => prev + 1);
        }
        setSelectedAnswer(answer);
    }, [selectedAnswer, showResult]);

    const handleSubmit = useCallback(async () => {
        if (!selectedAnswer || !currentQuestion) return;

        setShowResult(true);
        submitAnswer(selectedAnswer, answerChanges);

        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

        // Fetch AI feedback
        try {
            const params = new URLSearchParams({
                is_correct: String(isCorrect),
                question_story: currentQuestion.story,
                selected_answer: selectedAnswer,
                correct_answer: currentQuestion.correctAnswer,
            });
            const response = await fetch(`http://localhost:8000/api/feedback?${params}`, {
                method: 'POST',
            });
            if (response.ok) {
                const data = await response.json();
                setAiFeedback(data.feedback);
            }
        } catch (error) {
            const fallbackFeedback = isCorrect
                ? "Fantastic memory! You got it right! 🎉"
                : `Good effort! The answer was ${currentQuestion.correctAnswer}. Keep practicing! ⭐`;
            setAiFeedback(fallbackFeedback);
        }

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                nextQuestion();
                setSelectedAnswer(null);
                setShowResult(false);
                setAnswerChanges(0);
                setAiFeedback(null);
            } else {
                completeTest();
                router.push('/test/result');
            }
        }, 3000);  // Longer delay for feedback
    }, [selectedAnswer, currentQuestion, answerChanges, currentQuestionIndex, questions.length, submitAnswer, nextQuestion, completeTest, router]);

    const handleVoiceTranscription = useCallback((text: string) => {
        if (!currentQuestion) return;

        const lowerText = text.toLowerCase().trim();
        const matchedOption = currentQuestion.options.find(
            opt => opt.toLowerCase() === lowerText || lowerText.includes(opt.toLowerCase())
        );

        if (matchedOption) {
            handleSelectAnswer(matchedOption);
        }
    }, [currentQuestion, handleSelectAnswer]);

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Mascot mood="thinking" size="lg" />
                    <p className="text-xl text-gray-600 mt-4">Loading memory games... 🧠</p>
                </motion.div>
            </main>
        );
    }

    if (!currentQuestion) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">No questions available</p>
                    <button onClick={() => router.push('/test/age-select')} className="btn-primary mt-4">
                        Go Back
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.push('/')}
                        className="p-3 rounded-full bg-white/80 hover:bg-white transition-colors"
                    >
                        <Home className="w-6 h-6 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-4">
                        <Timer isRunning={!showResult} />
                        <span className="text-lg font-semibold text-gray-700">
                            {currentQuestionIndex + 1} / {questions.length}
                        </span>
                    </div>
                </div>

                <div className="mb-8">
                    <ProgressBar
                        progress={progress}
                        showStars={true}
                        totalStars={questions.length}
                        earnedStars={earnedStars}
                    />
                </div>

                <motion.div className="text-center mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium">
                        🧠 Memory Recall
                    </span>
                    {showMemory && (
                        <div className="mt-4 text-orange-500 font-bold animate-pulse">
                            Memorize in: {memoryTimer}s
                        </div>
                    )}
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.questionId}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <PuzzleCard
                            question={currentQuestion}
                            selectedAnswer={selectedAnswer}
                            onSelectAnswer={handleSelectAnswer}
                            showResult={showResult}
                            disabled={showResult || showMemory}
                            hideMemory={!showMemory}
                        />
                    </motion.div>
                </AnimatePresence>

                <motion.div
                    className="flex flex-col md:flex-row items-center justify-center gap-6 mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <VoiceController
                        onTranscription={handleVoiceTranscription}
                        disabled={showResult}
                        questionText={currentQuestion.story}
                    />

                    <motion.button
                        className={`btn-secondary inline-flex items-center gap-2 ${!selectedAnswer || showResult ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        onClick={handleSubmit}
                        disabled={!selectedAnswer || showResult}
                        whileHover={selectedAnswer && !showResult ? { scale: 1.05 } : {}}
                        whileTap={selectedAnswer && !showResult ? { scale: 0.95 } : {}}
                    >
                        <span>Submit Answer</span>
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </motion.div>

                <AnimatePresence>
                    {showResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
                        >
                            <div className="text-center bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md mx-4">
                                <div className={`text-7xl mb-4 ${selectedAnswer === currentQuestion.correctAnswer
                                    ? 'text-green-500'
                                    : 'text-orange-500'
                                    }`}>
                                    {selectedAnswer === currentQuestion.correctAnswer ? '🎉' : '⭐'}
                                </div>
                                {aiFeedback && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-xl font-medium text-gray-700"
                                    >
                                        {aiFeedback}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
