'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTestStore, AgeGroup } from '@/store/testStore';
import { Mascot } from '@/components/Mascot';
import { api } from '@/lib/api';

const ageGroups: { value: AgeGroup; label: string; emoji: string; description: string }[] = [
    { value: '5-6', label: '5-6 Years', emoji: '🧒', description: 'Just starting out!' },
    { value: '7-8', label: '7-8 Years', emoji: '👦', description: 'Growing learners!' },
    { value: '9-10', label: '9-10 Years', emoji: '🧑', description: 'Math explorers!' },
];

export default function AgeSelectPage() {
    const router = useRouter();
    const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { setAgeGroup, setSessionId } = useTestStore();

    const handleContinue = async () => {
        if (!selectedAge) return;

        setIsLoading(true);

        try {
            // Start session with backend
            const response = await api.startSession(selectedAge);
            setSessionId(response.session_id);
            setAgeGroup(selectedAge);

            // Navigate to first test
            router.push('/test/number-test');
        } catch (error) {
            console.error('Failed to start session:', error);
            // Still proceed even if backend is unavailable
            setAgeGroup(selectedAge);
            router.push('/test/number-test');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Mascot mood="happy" size="md" message="How old are you?" />

                    <motion.h1
                        className="text-3xl md:text-4xl font-bold text-gray-800 mt-8 mb-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        Select Your Age Group
                    </motion.h1>

                    <motion.p
                        className="text-lg text-gray-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        This helps us pick the perfect games for you! 🎯
                    </motion.p>
                </motion.div>

                {/* Age Cards */}
                <motion.div
                    className="grid md:grid-cols-3 gap-6 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    {ageGroups.map((age, index) => (
                        <motion.button
                            key={age.value}
                            className={`age-card ${selectedAge === age.value ? 'selected' : ''}`}
                            onClick={() => setSelectedAge(age.value)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            whileHover={{ scale: 1.05, rotate: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-6xl mb-2">{age.emoji}</span>
                            <span className="text-2xl font-bold text-gray-800">{age.label}</span>
                            <span className="text-sm text-gray-500">{age.description}</span>

                            {selectedAge === age.value && (
                                <motion.div
                                    className="absolute top-3 right-3 text-2xl"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring' }}
                                >
                                    ✓
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Continue Button */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <motion.button
                        className={`btn-primary inline-flex items-center gap-3 ${!selectedAge ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        onClick={handleContinue}
                        disabled={!selectedAge || isLoading}
                        whileHover={selectedAge ? { scale: 1.05 } : {}}
                        whileTap={selectedAge ? { scale: 0.95 } : {}}
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                <span>Getting Ready...</span>
                            </>
                        ) : (
                            <>
                                <span>Let&apos;s Start! 🚀</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </motion.button>
                </motion.div>

                {/* Tips */}
                <motion.div
                    className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <h3 className="font-semibold text-gray-700 mb-3">💡 Tips for Parents</h3>
                    <ul className="text-gray-600 space-y-2 text-sm">
                        <li>• Make sure your child is comfortable and relaxed</li>
                        <li>• There are no wrong answers - this is just for fun!</li>
                        <li>• You can help read questions if needed</li>
                        <li>• The games take about 10-15 minutes</li>
                    </ul>
                </motion.div>
            </div>
        </main>
    );
}
