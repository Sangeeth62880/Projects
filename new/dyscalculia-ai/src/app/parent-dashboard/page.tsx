'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Home, TrendingUp, Clock, Target, Brain,
    AlertCircle, CheckCircle, Info, ChevronRight
} from 'lucide-react';
import { useTestStore } from '@/store/testStore';
import { api } from '@/lib/api';

export default function ParentDashboard() {
    const router = useRouter();
    const { testResults, riskAssessment, setRiskAssessment, ageGroup, sessionId } = useTestStore();

    const [showDemo, setShowDemo] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    // Demo data if no test results
    const hasResults = testResults.length > 0;

    const demoResults = [
        { testType: 'number-comparison', totalQuestions: 5, correctAnswers: 4, avgResponseTime: 4500, answers: [] },
        { testType: 'mental-arithmetic', totalQuestions: 5, correctAnswers: 3, avgResponseTime: 6200, answers: [] },
        { testType: 'memory-recall', totalQuestions: 5, correctAnswers: 4, avgResponseTime: 5100, answers: [] },
    ];

    const results = hasResults ? testResults : (showDemo ? demoResults : []);

    // Calculate stats
    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
    const totalCorrect = results.reduce((sum, r) => sum + r.correctAnswers, 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const avgTime = results.length > 0
        ? results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length / 1000
        : 0;

    // Calculate risk assessment if we have results but no assessment
    useEffect(() => {
        const calculateRisk = async () => {
            // Only calculate if we have results but no risk assessment yet
            if (!hasResults || riskAssessment || isCalculating) return;

            setIsCalculating(true);

            try {
                const allAnswers = testResults.flatMap(r => r.answers || []);
                const maxDelay = allAnswers.length > 0
                    ? Math.max(...allAnswers.map(a => a.responseTimeMs || 0))
                    : avgTime * 1000 * 1.5;
                const answerChanges = allAnswers.reduce((sum, a) => sum + (a.answerChanges || 0), 0);

                const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;

                const features = {
                    accuracy_percent: overallAccuracy,
                    avg_response_time: avgResponseTime,
                    max_delay: maxDelay,
                    error_rate: 100 - overallAccuracy,
                    skipped_questions: 0,
                    answer_changes: answerChanges,
                };

                const result = await api.analyzeRisk(sessionId || 'local', features);
                setRiskAssessment({
                    riskLevel: result.risk_level,
                    confidence: result.confidence,
                    explanation: result.explanation,
                    recommendations: result.recommendations,
                });
            } catch (error) {
                console.error('Failed to analyze risk:', error);
                // Set fallback assessment based on accuracy
                const level = overallAccuracy > 70 ? 'low' : overallAccuracy > 40 ? 'medium' : 'high';
                setRiskAssessment({
                    riskLevel: level,
                    confidence: 0.75,
                    explanation: `Based on ${Math.round(overallAccuracy)}% accuracy across ${testResults.length} test(s). ` +
                        (level === 'low' ? 'Performance indicates good mathematical understanding.' :
                            level === 'medium' ? 'Some areas may benefit from additional practice and support.' :
                                'We recommend discussing these results with an educational specialist.'),
                    recommendations: level === 'low'
                        ? ['Continue with age-appropriate math activities', 'Praise their effort and progress']
                        : level === 'medium'
                            ? ['Practice number recognition daily', 'Use visual aids for math concepts', 'Consider educational games']
                            : ['Consult with an educational psychologist', 'Focus on building math confidence', 'Use multi-sensory learning approaches'],
                });
            } finally {
                setIsCalculating(false);
            }
        };

        calculateRisk();
    }, [hasResults, riskAssessment, isCalculating, testResults, overallAccuracy, avgTime, sessionId, setRiskAssessment, results]);

    const getRiskColor = (level: string | undefined) => {
        switch (level) {
            case 'low': return 'text-green-600 bg-green-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'high': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getRiskIcon = (level: string | undefined) => {
        switch (level) {
            case 'low': return <CheckCircle className="w-6 h-6" />;
            case 'medium': return <Info className="w-6 h-6" />;
            case 'high': return <AlertCircle className="w-6 h-6" />;
            default: return <Brain className="w-6 h-6" />;
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-3 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-sm"
                        >
                            <Home className="w-6 h-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
                            <p className="text-gray-500">Track your child&apos;s learning progress</p>
                        </div>
                    </div>

                    {ageGroup && (
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                            Age: {ageGroup} years
                        </span>
                    )}
                </div>

                {/* No Results Message */}
                {!hasResults && !showDemo && (
                    <motion.div
                        className="bg-white rounded-2xl p-8 text-center mb-8 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Test Results Yet</h2>
                        <p className="text-gray-500 mb-6">Have your child complete the tests to see detailed insights here.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push('/test/age-select')}
                                className="btn-primary"
                            >
                                Start Test Now
                            </button>
                            <button
                                onClick={() => setShowDemo(true)}
                                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                View Demo Data
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Stats Overview */}
                {(hasResults || showDemo) && (
                    <>
                        <motion.div
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Target className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-500 text-sm">Accuracy</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{Math.round(overallAccuracy)}%</p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="text-gray-500 text-sm">Correct</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{totalCorrect}/{totalQuestions}</p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-gray-500 text-sm">Avg Time</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{avgTime.toFixed(1)}s</p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <span className="text-gray-500 text-sm">Tests Done</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{results.length}</p>
                            </div>
                        </motion.div>

                        {/* Risk Assessment Card */}
                        <motion.div
                            className="bg-white rounded-2xl p-6 shadow-sm mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                Screening Assessment
                                {isCalculating && <span className="text-sm text-gray-400 animate-pulse">Analyzing...</span>}
                            </h2>

                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getRiskColor(riskAssessment?.riskLevel || (showDemo ? 'low' : undefined))}`}>
                                {getRiskIcon(riskAssessment?.riskLevel || (showDemo ? 'low' : undefined))}
                                <span className="font-medium capitalize">
                                    {isCalculating ? 'Analyzing' :
                                        riskAssessment?.riskLevel ? `${riskAssessment.riskLevel.charAt(0).toUpperCase() + riskAssessment.riskLevel.slice(1)}` :
                                            showDemo ? 'Low' : 'Pending'} Concern Level
                                </span>
                            </div>

                            <p className="text-gray-600 mt-4">
                                {isCalculating
                                    ? 'Using our ML model to analyze test performance patterns...'
                                    : riskAssessment?.explanation || (showDemo
                                        ? 'Based on the assessment (accuracy: 73.3%), your child showed good number sense and mathematical reasoning. Response times were within normal range.'
                                        : 'Complete the test to receive a detailed assessment.'
                                    )}
                            </p>

                            {(riskAssessment?.recommendations || showDemo) && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                                    <h3 className="font-medium text-blue-800 mb-2">Recommendations</h3>
                                    <ul className="space-y-2">
                                        {(riskAssessment?.recommendations || [
                                            'Continue with regular age-appropriate math activities',
                                            'Encourage number games and puzzles',
                                            'Celebrate their mathematical curiosity'
                                        ]).map((rec, i) => (
                                            <li key={i} className="text-blue-700 text-sm flex items-start gap-2">
                                                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>

                        {/* Test Breakdown */}
                        <motion.div
                            className="bg-white rounded-2xl p-6 shadow-sm mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-lg font-semibold mb-4">Test Performance</h2>

                            <div className="space-y-4">
                                {results.map((result, index) => {
                                    const accuracy = (result.correctAnswers / result.totalQuestions) * 100;
                                    const testName = result.testType.split('-').map(word =>
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ');

                                    return (
                                        <div key={index} className="border border-gray-100 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">
                                                        {result.testType === 'number-comparison' ? '🔢' :
                                                            result.testType === 'mental-arithmetic' ? '🧮' : '🧠'}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium">{testName}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {result.correctAnswers}/{result.totalQuestions} correct •
                                                            {(result.avgResponseTime / 1000).toFixed(1)}s avg
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-indigo-600">
                                                        {Math.round(accuracy)}%
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${accuracy}%` }}
                                                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Disclaimer */}
                        <motion.div
                            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-amber-800">Important Note</h3>
                                    <p className="text-amber-700 text-sm mt-1">
                                        This is a pre-screening tool designed to identify potential areas for support,
                                        not a clinical diagnosis. If you have concerns about your child&apos;s mathematical
                                        development, please consult with an educational psychologist or learning specialist.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <button
                                onClick={() => router.push('/test/age-select')}
                                className="btn-primary"
                            >
                                Start New Assessment
                            </button>
                        </motion.div>
                    </>
                )}
            </div>
        </main>
    );
}
