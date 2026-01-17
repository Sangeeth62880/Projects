'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, BarChart3, RotateCcw, Trophy, Star, Clock, Target } from 'lucide-react';
import { useTestStore } from '@/store/testStore';
import { Mascot } from '@/components/Mascot';
import { api } from '@/lib/api';

export default function ResultPage() {
    const router = useRouter();
    const {
        sessionId,
        testResults,
        riskAssessment,
        setRiskAssessment,
        ageGroup,
        resetSession
    } = useTestStore();

    const [isAnalyzing, setIsAnalyzing] = useState(true);

    // Calculate overall stats
    const totalQuestions = testResults.reduce((sum, r) => sum + r.totalQuestions, 0);
    const totalCorrect = testResults.reduce((sum, r) => sum + r.correctAnswers, 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const avgResponseTime = testResults.length > 0
        ? testResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / testResults.length
        : 0;

    // Analyze risk on mount
    useEffect(() => {
        const analyzeResults = async () => {
            if (!sessionId || testResults.length === 0) {
                setIsAnalyzing(false);
                return;
            }

            try {
                const allAnswers = testResults.flatMap(r => r.answers);
                const maxDelay = allAnswers.length > 0
                    ? Math.max(...allAnswers.map(a => a.responseTimeMs))
                    : 0;
                const answerChanges = allAnswers.reduce((sum, a) => sum + a.answerChanges, 0);

                const features = {
                    accuracy_percent: overallAccuracy,
                    avg_response_time: avgResponseTime,
                    max_delay: maxDelay,
                    error_rate: 100 - overallAccuracy,
                    skipped_questions: 0,
                    answer_changes: answerChanges,
                };

                const result = await api.analyzeRisk(sessionId, features);
                setRiskAssessment({
                    riskLevel: result.risk_level,
                    confidence: result.confidence,
                    explanation: result.explanation,
                    recommendations: result.recommendations,
                });
            } catch (error) {
                console.error('Failed to analyze risk:', error);
                // Set default assessment
                const defaultLevel = overallAccuracy > 70 ? 'low' : overallAccuracy > 40 ? 'medium' : 'high';
                setRiskAssessment({
                    riskLevel: defaultLevel,
                    confidence: 0.8,
                    explanation: `Based on ${Math.round(overallAccuracy)}% accuracy across all tests.`,
                    recommendations: [
                        'Continue practicing with age-appropriate activities',
                        'Consider discussing with an educational specialist if concerned',
                    ],
                });
            } finally {
                setIsAnalyzing(false);
            }
        };

        analyzeResults();
    }, [sessionId, testResults, overallAccuracy, avgResponseTime, setRiskAssessment]);

    const handleRestart = () => {
        resetSession();
        router.push('/test/age-select');
    };

    const getRiskBadgeClass = (level: string) => {
        switch (level) {
            case 'low': return 'risk-badge risk-low';
            case 'medium': return 'risk-badge risk-medium';
            case 'high': return 'risk-badge risk-high';
            default: return 'risk-badge';
        }
    };

    const getStarsEarned = () => {
        if (overallAccuracy >= 80) return 5;
        if (overallAccuracy >= 60) return 4;
        if (overallAccuracy >= 40) return 3;
        if (overallAccuracy >= 20) return 2;
        return 1;
    };

    if (isAnalyzing) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Mascot mood="thinking" size="lg" />
                    <p className="text-xl text-gray-600 mt-4">Analyzing your results... 🔍</p>
                    <div className="mt-4">
                        <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-500"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2 }}
                            />
                        </div>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="p-3 rounded-full bg-white/80 hover:bg-white transition-colors"
                    >
                        <Home className="w-6 h-6 text-gray-600" />
                    </button>

                    <h1 className="text-2xl font-bold text-gray-800">Your Results</h1>

                    <div className="w-12" /> {/* Spacer */}
                </div>

                {/* Celebration */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                    <Mascot mood="celebrating" size="lg" message="You did amazing!" />

                    {/* Stars */}
                    <div className="flex justify-center gap-2 mt-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <motion.div
                                key={star}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{
                                    scale: star <= getStarsEarned() ? 1 : 0.5,
                                    rotate: 0,
                                    opacity: star <= getStarsEarned() ? 1 : 0.3,
                                }}
                                transition={{ delay: star * 0.1, type: 'spring' }}
                            >
                                <Star
                                    size={48}
                                    fill={star <= getStarsEarned() ? '#fbbf24' : 'none'}
                                    color={star <= getStarsEarned() ? '#fbbf24' : '#d1d5db'}
                                />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="metric-card">
                        <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                        <div className="metric-value">{Math.round(overallAccuracy)}%</div>
                        <div className="metric-label">Accuracy</div>
                    </div>

                    <div className="metric-card">
                        <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <div className="metric-value">{totalCorrect}/{totalQuestions}</div>
                        <div className="metric-label">Correct</div>
                    </div>

                    <div className="metric-card">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <div className="metric-value">{(avgResponseTime / 1000).toFixed(1)}s</div>
                        <div className="metric-label">Avg Time</div>
                    </div>

                    <div className="metric-card">
                        <Star className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                        <div className="metric-value">{getStarsEarned()}</div>
                        <div className="metric-label">Stars Earned</div>
                    </div>
                </motion.div>

                {/* Test Breakdown */}
                <motion.div
                    className="card mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h3 className="text-lg font-semibold mb-4">Test Breakdown</h3>
                    <div className="space-y-4">
                        {testResults.map((result, index) => (
                            <div key={`result-${index}-${result.testType}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        {result.testType === 'number-comparison' ? '🔢' :
                                            result.testType === 'mental-arithmetic' ? '🧮' : '🧠'}
                                    </span>
                                    <div>
                                        <p className="font-medium capitalize">
                                            {result.testType.replace('-', ' ')}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {result.correctAnswers}/{result.totalQuestions} correct
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-indigo-600">
                                        {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Risk Assessment (for parents) */}
                {riskAssessment && (
                    <motion.div
                        className="card mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Screening Summary</h3>
                            <span className={getRiskBadgeClass(riskAssessment.riskLevel)}>
                                {riskAssessment.riskLevel === 'low' ? 'Low Concern' :
                                    riskAssessment.riskLevel === 'medium' ? 'Some Attention Needed' : 'Consultation Recommended'}
                            </span>
                        </div>

                        <p className="text-gray-600 mb-4">{riskAssessment.explanation}</p>

                        <div className="bg-blue-50 rounded-xl p-4">
                            <h4 className="font-medium text-blue-800 mb-2">💡 Recommendations</h4>
                            <ul className="space-y-2">
                                {riskAssessment.recommendations.map((rec, i) => (
                                    <li key={i} className="text-blue-700 text-sm flex items-start gap-2">
                                        <span>•</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="text-xs text-gray-400 mt-4">
                            ⚠️ This is a screening tool, not a diagnosis. Please consult a professional for clinical evaluation.
                        </p>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <button
                        onClick={handleRestart}
                        className="btn-primary inline-flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>Play Again</span>
                    </button>

                    <button
                        onClick={() => router.push('/parent-dashboard')}
                        className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                        <BarChart3 className="w-5 h-5" />
                        <span>View Full Dashboard</span>
                    </button>
                </motion.div>
            </div>
        </main>
    );
}
