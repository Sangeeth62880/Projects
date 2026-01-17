'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface ProgressBarProps {
    progress: number; // 0-100
    showStars?: boolean;
    totalStars?: number;
    earnedStars?: number;
}

export function ProgressBar({
    progress,
    showStars = true,
    totalStars = 5,
    earnedStars = 0
}: ProgressBarProps) {
    return (
        <div className="w-full space-y-3">
            {/* Progress bar */}
            <div className="progress-container">
                <motion.div
                    className="progress-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            {/* Stars */}
            {showStars && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: totalStars }).map((_, index) => (
                        <motion.div
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{
                                scale: index < earnedStars ? 1 : 1,
                            }}
                            transition={{
                                delay: index * 0.1,
                                type: 'spring',
                                stiffness: 500,
                                damping: 15
                            }}
                        >
                            <Star
                                size={32}
                                className={`star ${index < earnedStars ? 'filled' : ''}`}
                                fill={index < earnedStars ? '#fbbf24' : 'none'}
                            />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Progress text */}
            <p className="text-center text-sm text-gray-500 font-medium">
                {Math.round(progress)}% Complete
            </p>
        </div>
    );
}
