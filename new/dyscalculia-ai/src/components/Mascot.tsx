'use client';

import { motion } from 'framer-motion';

interface MascotProps {
    mood?: 'happy' | 'thinking' | 'celebrating' | 'encouraging';
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

export function Mascot({
    mood = 'happy',
    size = 'md',
    message
}: MascotProps) {
    const sizeClasses = {
        sm: 'text-6xl',
        md: 'text-8xl',
        lg: 'text-9xl',
    };

    const moodEmojis = {
        happy: '🦊',
        thinking: '🤔',
        celebrating: '🎉',
        encouraging: '💪',
    };

    const moodMessages = {
        happy: "Hi friend! Let's play!",
        thinking: 'Hmm, take your time!',
        celebrating: 'Amazing job!',
        encouraging: 'You can do it!',
    };

    return (
        <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
            <motion.div
                className={`mascot ${sizeClasses[size]}`}
                animate={{
                    y: [0, -10, 0],
                    rotate: mood === 'celebrating' ? [0, -10, 10, 0] : 0
                }}
                transition={{
                    y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                    rotate: { duration: 0.5, repeat: mood === 'celebrating' ? Infinity : 0 }
                }}
            >
                {moodEmojis[mood]}
            </motion.div>

            {(message || moodMessages[mood]) && (
                <motion.div
                    className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <p className="text-lg font-medium text-gray-700">
                        {message || moodMessages[mood]}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
