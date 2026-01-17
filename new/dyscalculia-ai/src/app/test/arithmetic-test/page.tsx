'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Home } from 'lucide-react';
import { useTestStore, Question } from '@/store/testStore';
import { PuzzleCard } from '@/components/PuzzleCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Timer } from '@/components/Timer';
import { VoiceController } from '@/components/VoiceController';
import { EmotionMonitor } from '@/components/EmotionMonitor';
import { Mascot } from '@/components/Mascot';
import { api } from '@/lib/api';

const fallbackQuestions: Question[] = [
    {
        questionId: 'ma_1',
        testType: 'mental-arithmetic',
        story: '🐰 Bunny has 3 carrots. 🦊 Fox gives her 4 more carrots. How many carrots does Bunny have now?',
        visualObject: '🥕',
        leftValue: 3,
        rightValue: 4,
        options: ['5', '6', '7', '8'],
        correctAnswer: '7',
    },
    {
        questionId: 'ma_2',
        testType: 'mental-arithmetic',
        story: '🐶 Dog had 8 bones. He ate 3 bones. How many bones are left?',
        visualObject: '🦴',
        leftValue: 8,
        rightValue: 3,
        options: ['4', '5', '6', '7'],
        correctAnswer: '5',
    },
    {
        questionId: 'ma_3',
        testType: 'mental-arithmetic',
        story: '🦋 There are 6 butterflies. 2 more butterflies join them. How many butterflies are there?',
        visualObject: '🦋',
        leftValue: 6,
        rightValue: 2,
        options: ['7', '8', '9', '10'],
        correctAnswer: '8',
    },
    {
        questionId: 'ma_4',
        testType: 'mental-arithmetic',
        story: '🍪 Mom baked 10 cookies. Kids ate 4 cookies. How many cookies are left?',
        visualObject: '🍪',
        leftValue: 10,
        rightValue: 4,
        options: ['4', '5', '6', '7'],
        correctAnswer: '6',
    },
    {
        questionId: 'ma_5',
        testType: 'mental-arithmetic',
        story: '🎈 You have 5 balloons. Your friend gives you 5 more. How many balloons do you have?',
        visualObject: '🎈',
        leftValue: 5,
        rightValue: 5,
        options: ['8', '9', '10', '11'],
        correctAnswer: '10',
    },
];

export default function ArithmeticTestPage() {
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

    // Conversation Mode State
    const [conversationMode, setConversationMode] = useState(false);
    const speakingRef = useRef<boolean>(false);

    // Debug State
    const [logs, setLogs] = useState<string[]>([]);
    const addLog = useCallback((msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 10)); // Keep last 10
    }, []);

    const currentQuestion = getCurrentQuestion();
    const progress = getProgress();
    const earnedStars = answers.filter(a => a.correct).length;

    useEffect(() => {
        const loadQuestions = async () => {
            setIsLoading(true);

            try {
                if (sessionId && ageGroup) {
                    const response = await api.getQuestions('mental-arithmetic', sessionId, ageGroup);
                    const mappedQuestions: Question[] = response.questions.map(q => ({
                        questionId: q.question_id,
                        testType: 'mental-arithmetic',
                        story: q.story,
                        visualObject: q.visual_object,
                        leftValue: q.left_value,
                        rightValue: q.right_value,
                        options: q.options,
                        correctAnswer: q.correct_answer,
                    }));
                    startTest('mental-arithmetic', mappedQuestions);
                    addLog("Questions Loaded");
                } else {
                    startTest('mental-arithmetic', fallbackQuestions);
                    addLog("Fallback Questions Loaded");
                }
            } catch (error) {
                console.error('Failed to load questions:', error);
                startTest('mental-arithmetic', fallbackQuestions);
                addLog("Error loading questions, used fallback");
            } finally {
                setIsLoading(false);
            }
        };

        loadQuestions();
    }, [sessionId, ageGroup, startTest, addLog]);

    const handleSelectAnswer = useCallback((answer: string) => {
        if (showResult) return;

        if (selectedAnswer && selectedAnswer !== answer) {
            setAnswerChanges(prev => prev + 1);
        }
        setSelectedAnswer(answer);
    }, [selectedAnswer, showResult]);

    // TTS Helper with Promise
    const speakText = useCallback((text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!conversationMode || !('speechSynthesis' in window)) {
                resolve();
                return;
            }

            const cleanText = text.replace(/[^\w\s.,!?]/g, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);

            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
            if (voice) utterance.voice = voice;
            utterance.rate = 0.9;

            utterance.onend = () => {
                speakingRef.current = false;
                addLog(`TTS Ended: "${text.substring(0, 10)}..."`);
                resolve();
            };
            utterance.onerror = () => {
                speakingRef.current = false;
                addLog("TTS Error");
                resolve();
            };

            speakingRef.current = true;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        });
    }, [conversationMode, addLog]);

    const proceedToNext = useCallback(async () => {
        // Wait a small beat after speech
        await new Promise(r => setTimeout(r, 1000));

        if (currentQuestionIndex < questions.length - 1) {
            nextQuestion();
            setSelectedAnswer(null);
            setShowResult(false);
            setAnswerChanges(0);
            setAiFeedback(null);
            addLog("Proceeding to Next Question");
        } else {
            completeTest();
            router.push('/test/memory-test');
            addLog("Test Completed");
        }
    }, [currentQuestionIndex, questions.length, nextQuestion, completeTest, router, addLog]);


    const handleSubmit = useCallback(async () => {
        if (!selectedAnswer || !currentQuestion) return;

        setShowResult(true);
        submitAnswer(selectedAnswer, answerChanges);
        addLog(`Submitted: ${selectedAnswer}`);

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
                await speakText(data.feedback);
            } else {
                throw new Error("Feedback failed");
            }
        } catch (error) {
            const fallbackFeedback = isCorrect
                ? "Great job! You got it right! 🎉"
                : `Nice try! The answer was ${currentQuestion.correctAnswer}. Keep going! ⭐`;
            setAiFeedback(fallbackFeedback);
            await speakText(fallbackFeedback);
        }

        proceedToNext();
    }, [selectedAnswer, currentQuestion, answerChanges, submitAnswer, speakText, proceedToNext, addLog]);

    // --- Voice Logic Helpers ---

    const wordToNumber: { [key: string]: string } = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
        'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
        'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18',
        'nineteen': '19', 'twenty': '20'
    };

    const normalizeAnswer = (text: string): string => {
        let normalized = text.toLowerCase().trim();
        normalized = normalized.replace(/[^\w\s]/g, '');
        // Replace number words with digits
        Object.keys(wordToNumber).forEach(word => {
            normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), wordToNumber[word]);
        });
        return normalized;
    };

    const findMatchingOption = (text: string, options: string[]): string | undefined => {
        const normalized = normalizeAnswer(text);
        return options.find(opt => {
            const normOpt = normalizeAnswer(opt);
            return normalized === normOpt || normalized.includes(normOpt) || normOpt.includes(normalized);
        });
    };

    // Unified voice handler
    const handleVoiceInput = useCallback(async (text: string, isAutoSubmit: boolean = false) => {
        if (!currentQuestion || showResult) return;

        addLog(`Voice: "${text}" (${isAutoSubmit ? 'Auto' : 'Manual'})`);

        const matchedOption = findMatchingOption(text, currentQuestion.options);

        if (matchedOption) {
            addLog(`Matched Option: ${matchedOption}`);
            handleSelectAnswer(matchedOption);

            if (isAutoSubmit) {
                setShowResult(true);
                submitAnswer(matchedOption, 0);

                const isCorrect = matchedOption === currentQuestion.correctAnswer;
                // ... same logic as handleSubmit ...
                // Reusing separate block to avoid refactoring risk
                try {
                    const params = new URLSearchParams({
                        is_correct: String(isCorrect),
                        question_story: currentQuestion.story,
                        selected_answer: matchedOption,
                        correct_answer: currentQuestion.correctAnswer,
                    });
                    const res = await fetch(`http://localhost:8000/api/feedback?${params}`, { method: 'POST' });
                    const data = await res.json();
                    setAiFeedback(data.feedback);
                    await speakText(data.feedback);
                } catch (err) {
                    const fallbackFeedback = isCorrect
                        ? "Great job! You got it right! 🎉"
                        : `Nice try! The answer was ${currentQuestion.correctAnswer}. Keep going! ⭐`;
                    setAiFeedback(fallbackFeedback);
                    await speakText(fallbackFeedback);
                }

                proceedToNext();
            }
        } else {
            addLog(`No Match Found for "${text}"`);
        }
    }, [currentQuestion, showResult, conversationMode, handleSelectAnswer, submitAnswer, speakText, proceedToNext, addLog]);

    const handleVoiceTranscription = useCallback((text: string) => {
        handleVoiceInput(text, false);
    }, [handleVoiceInput]);

    const handleAutoSubmit = useCallback((text: string) => {
        handleVoiceInput(text, true);
    }, [handleVoiceInput]);


    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Mascot mood="thinking" size="lg" />
                    <p className="text-xl text-gray-600 mt-4">Loading math puzzles... 🧮</p>
                </motion.div>
            </main>
        );
    }

    if (!currentQuestion) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                {/* ... empty ... */}
            </main>
        );
    }

    return (
        <main className="min-h-screen py-8 px-4 pb-32">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.push('/')}
                        className="p-3 rounded-full bg-white/80 hover:bg-white transition-colors"
                    >
                        <Home className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Conversation Mode Toggle */}
                    <button
                        onClick={() => {
                            setConversationMode(!conversationMode);
                            addLog(`Chat Mode: ${!conversationMode ? 'ON' : 'OFF'}`);
                        }}
                        className={`px-4 py-2 rounded-full font-medium transition-colors ${conversationMode
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        {conversationMode ? '🎙️ Chat Mode ON' : '💬 Chat Mode OFF'}
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
                    <span className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-medium">
                        🧮 Mental Arithmetic
                    </span>
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
                            disabled={showResult}
                        />
                    </motion.div>
                </AnimatePresence>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-8">
                    <div className="flex flex-col gap-4">
                        <VoiceController
                            onTranscription={handleVoiceTranscription}
                            disabled={showResult}
                            questionText={`${currentQuestion.story} Options are: ${currentQuestion.options.join(', ')}`}
                            autoMode={conversationMode}
                            onAutoSubmit={handleAutoSubmit}
                            onDebug={addLog}
                        />
                        {/* Emotion Monitor Widget */}
                        <div className="w-full max-w-[200px] mx-auto">
                            <EmotionMonitor />
                        </div>
                    </div>

                    <button
                        className={`btn-secondary inline-flex items-center gap-2 ${!selectedAnswer || showResult ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        onClick={handleSubmit}
                        disabled={!selectedAnswer || showResult}
                    >
                        <span>Submit Answer</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Debug Console */}
                <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-green-400 p-2 font-mono text-xs h-32 overflow-y-auto z-40 pointer-events-none">
                    <div className="max-w-4xl mx-auto">
                        <div className="font-bold border-b border-green-800 mb-1">Debug Console</div>
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                        {logs.length === 0 && <div className="text-gray-500">Waiting for events...</div>}
                    </div>
                </div>

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
