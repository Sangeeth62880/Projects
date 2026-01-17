'use client';

import { motion } from 'framer-motion';
import { Question } from '@/store/testStore';

interface PuzzleCardProps {
    question: Question;
    selectedAnswer: string | null;
    onSelectAnswer: (answer: string) => void;
    showResult?: boolean;
    disabled?: boolean;
    hideMemory?: boolean;
}

// Visual object types for dyscalculia screening
const VISUAL_ICONS: Record<string, string> = {
    dots: '●',
    stars: '⭐',
    blocks: '■',
    fruits: '🍎',
    animals: '🐾',
    hearts: '❤️',
    circles: '◉',
    default: '●',
};

// Colors for visual groups
const GROUP_COLORS = {
    left: {
        bg: 'from-blue-500/20 to-blue-600/20',
        border: 'border-blue-400',
        text: 'text-blue-400',
        dot: 'bg-blue-400',
    },
    right: {
        bg: 'from-purple-500/20 to-purple-600/20',
        border: 'border-purple-400',
        text: 'text-purple-400',
        dot: 'bg-purple-400',
    },
};

// Render visual objects for a number using contextual emojis
function VisualNumber({
    count,
    emoji = '●',
    label,
    characterEmoji,
    color,
    maxShow = 12
}: {
    count: number;
    emoji?: string;
    label?: string;
    characterEmoji?: string;
    color: 'left' | 'right';
    maxShow?: number;
}) {
    const colors = GROUP_COLORS[color];
    const showCount = Math.min(count, maxShow);
    const hasMore = count > maxShow;

    // Arrange dots in a nice grid pattern
    const getGridCols = (n: number) => {
        if (n <= 3) return 'grid-cols-3';
        if (n <= 6) return 'grid-cols-3';
        if (n <= 9) return 'grid-cols-3';
        return 'grid-cols-4';
    };

    return (
        <motion.div
            className={`rounded-2xl p-6 bg-gradient-to-br ${colors.bg} border-2 ${colors.border} min-w-[140px]`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
        >
            {/* Character emoji and Label */}
            <div className={`text-center mb-3 flex items-center justify-center gap-2`}>
                {characterEmoji && (
                    <span className="text-2xl">{characterEmoji}</span>
                )}
                {label && (
                    <span className={`font-bold text-lg ${colors.text}`}>{label}</span>
                )}
            </div>

            {/* Dots/Objects Grid */}
            <div className={`grid ${getGridCols(showCount)} gap-2 justify-items-center`}>
                {Array.from({ length: showCount }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            delay: i * 0.05,
                            type: 'spring',
                            stiffness: 300
                        }}
                        className="text-2xl"
                    >
                        <span>{emoji}</span>
                    </motion.div>
                ))}
            </div>

            {/* Number display */}
            <motion.div
                className={`text-center mt-3 text-4xl font-bold ${colors.text}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {count}
                {hasMore && <span className="text-sm ml-1">items</span>}
            </motion.div>
        </motion.div>
    );
}

// Memory sequence display
function SequenceDisplay({ sequence }: { sequence: string[] }) {
    return (
        <div className="flex gap-4 justify-center flex-wrap">
            {sequence.map((item, i) => (
                <motion.div
                    key={i}
                    className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-400 rounded-xl px-6 py-4 text-2xl font-bold"
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.15, type: 'spring' }}
                >
                    {item}
                </motion.div>
            ))}
        </div>
    );
}

export function PuzzleCard({
    question,
    selectedAnswer,
    onSelectAnswer,
    showResult = false,
    disabled = false,
    hideMemory = false
}: PuzzleCardProps) {
    const getOptionClass = (option: string) => {
        let className = 'option-btn';

        if (selectedAnswer === option) {
            if (showResult) {
                className += option === question.correctAnswer ? ' correct' : ' incorrect';
            } else {
                className += ' selected';
            }
        } else if (showResult && option === question.correctAnswer) {
            className += ' correct';
        }

        return className;
    };

    // Extract contextual emoji from question (default to colorful dot)
    const emoji = (question as any).emoji || '🔵';

    // Extract character emojis for each side
    const leftEmoji = (question as any).left_emoji || (question as any).leftEmoji;
    const rightEmoji = (question as any).right_emoji || (question as any).rightEmoji;

    // Extract labels
    const leftLabel = (question as any).left_label || (question as any).leftLabel;
    const rightLabel = (question as any).right_label || (question as any).rightLabel;

    const hasVisualComparison = question.leftValue != null && question.rightValue != null;
    const hasMemorySequence = question.memorySequence && question.memorySequence.length > 0;

    // During memorization phase (hideMemory=false), show generic instruction
    // During recall phase (hideMemory=true), show the actual question
    const displayStory = (hasMemorySequence && !hideMemory)
        ? "Memorize the sequence below! 🧠"
        : question.story;

    return (
        <motion.div
            className="puzzle-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Question Text - Now SHORT */}
            <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <p className="text-2xl md:text-3xl font-semibold leading-relaxed">
                    {displayStory}
                </p>
            </motion.div>

            {/* VISUAL DISPLAY - Adapts based on test type */}
            {hasVisualComparison && (
                <motion.div
                    className="flex justify-center items-center gap-8 mb-8 flex-wrap"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Left Group */}
                    <VisualNumber
                        count={question.leftValue!}
                        emoji={emoji}
                        characterEmoji={leftEmoji}
                        label={leftLabel}
                        color="left"
                    />

                    {/* Operator - Different for each test type */}
                    <motion.div
                        className="text-5xl font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                    >
                        {question.testType === 'mental-arithmetic' ? (
                            // Show + or - based on story content
                            <span className="text-indigo-500">
                                {question.story.toLowerCase().includes('take') ||
                                    question.story.toLowerCase().includes('ate') ||
                                    question.story.toLowerCase().includes('left') ||
                                    question.story.toLowerCase().includes('away') ||
                                    question.story.toLowerCase().includes('loses') ||
                                    question.story.toLowerCase().includes('gives away')
                                    ? '−' : '+'}
                            </span>
                        ) : (
                            // Default: comparison "vs"
                            <span className="text-gray-400">vs</span>
                        )}
                    </motion.div>

                    {/* Right Group */}
                    <VisualNumber
                        count={question.rightValue!}
                        emoji={emoji}
                        characterEmoji={rightEmoji}
                        label={rightLabel}
                        color="right"
                    />
                </motion.div>
            )}

            {/* MEMORY SEQUENCE */}
            {hasMemorySequence && (
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {!hideMemory ? (
                        <SequenceDisplay sequence={question.memorySequence!} />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-8 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-medium"
                        >
                            <p className="text-xl">Trying to remember...</p>
                            <div className="flex gap-2 justify-center mt-3">
                                <span className="animate-bounce delay-0">❓</span>
                                <span className="animate-bounce delay-100">❓</span>
                                <span className="animate-bounce delay-200">❓</span>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Answer Options */}
            <motion.div
                className="grid grid-cols-2 gap-4 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                {question.options.map((option, index) => (
                    <motion.button
                        key={`option-${index}`}
                        className={getOptionClass(option)}
                        onClick={() => !disabled && onSelectAnswer(option)}
                        disabled={disabled}
                        whileHover={!disabled ? { scale: 1.05 } : {}}
                        whileTap={!disabled ? { scale: 0.98 } : {}}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                    >
                        {option}
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    );
}
