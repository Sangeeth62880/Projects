'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
    isRunning: boolean;
    warningThreshold?: number; // seconds
    onTimeUpdate?: (seconds: number) => void;
}

export function Timer({
    isRunning,
    warningThreshold = 30,
    onTimeUpdate
}: TimerProps) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!isRunning) {
            setSeconds(0);
            return;
        }

        const interval = setInterval(() => {
            setSeconds((prev) => {
                const newValue = prev + 1;
                onTimeUpdate?.(newValue);
                return newValue;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, onTimeUpdate]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isWarning = seconds >= warningThreshold;

    return (
        <div className={`timer ${isWarning ? 'warning' : ''}`}>
            <Clock size={20} />
            <span>{formatTime(seconds)}</span>
        </div>
    );
}
