'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceControllerProps {
    onTranscription: (text: string) => void;
    disabled?: boolean;
    questionText?: string;
    autoMode?: boolean;
    onAutoSubmit?: (text: string) => void;
    onDebug?: (msg: string) => void;
}

// Add types for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

/**
 * Add natural pauses to text for more pleasant TTS
 */
function addNaturalPauses(text: string): string {
    if (!text) return '';
    let processed = text.replace(/([.!?])\s+/g, '$1    ');
    processed = processed.replace(/[🦖🐼🐰🦊🐶🐱🐻🦁🐯🐘🐵🦋🍎🥕🦴💰🥜🎈🍪🌟🌙☀️🌈🔴🔵🟢🟡🔢]/g, '');
    processed = processed.replace(/(\d+)/g, ' $1 ');
    return processed.replace(/\s+/g, ' ').trim();
}

export function VoiceController({
    onTranscription,
    disabled = false,
    questionText,
    autoMode = false,
    onAutoSubmit,
    onDebug
}: VoiceControllerProps) {
    const [isListening, setIsListening] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [status, setStatus] = useState<string>('Idle');

    // Refs for Speech Recognition
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false; // Stop after one sentence to simulate turn-taking
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    setIsListening(true);
                    setStatus('Listening...');
                    if (onDebug) onDebug('Speech: Started Listening');
                };

                recognition.onend = () => {
                    setIsListening(false);
                    setStatus('Idle');
                    if (onDebug) onDebug('Speech: Ended');
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                    setStatus('Error');
                    if (onDebug) onDebug(`Speech Error: ${event.error}`);
                };

                recognition.onresult = (event: any) => {
                    if (event.results && event.results[0]) {
                        const transcript = event.results[0][0].transcript;
                        if (onDebug) onDebug(`Speech Result: "${transcript}"`);
                        onTranscription(transcript);

                        if (autoMode && onAutoSubmit) {
                            setStatus('Processing...');
                            onAutoSubmit(transcript);
                        }
                    }
                };

                recognitionRef.current = recognition;
            } else {
                setStatus('Not Supported');
                if (onDebug) onDebug('Speech API Not Supported');
            }
        }
    }, [onTranscription, autoMode, onAutoSubmit, onDebug]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                if (onDebug) onDebug('Command: Start Listening');
            } catch (e) {
                // Ignore start errors (already started)
            }
        }
    }, [isListening, onDebug]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            if (onDebug) onDebug('Command: Stop Listening');
        }
    }, [isListening, onDebug]);

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // TTS Logic
    const speakQuestion = useCallback(() => {
        if (!questionText || isPlaying) return;

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const processedText = addNaturalPauses(questionText);

            setIsPlaying(true);
            const utterance = new SpeechSynthesisUtterance(processedText);

            // Child-friendly settings
            utterance.rate = 0.8;
            utterance.pitch = 1.1;

            // Try to pick a female voice
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
            if (voice) utterance.voice = voice;

            utterance.onend = () => {
                setIsPlaying(false);
                if (onDebug) onDebug('TTS: Finished');
                if (autoMode) {
                    if (onDebug) onDebug('AutoMode: Starting Listen after TTS');
                    // Auto-start listening after question
                    // Small delay to ensure synthesis is fully released
                    setTimeout(() => startListening(), 500);
                }
            };

            utterance.onerror = () => setIsPlaying(false);

            if (onDebug) onDebug('TTS: Speaking...');
            window.speechSynthesis.speak(utterance);
        }
    }, [questionText, isPlaying, autoMode, startListening, onDebug]);

    // Auto-play when question changes
    useEffect(() => {
        if (questionText && !disabled) {
            // Cancel any current listening or speaking
            if (isListening) stopListening();
            window.speechSynthesis.cancel();

            const timer = setTimeout(speakQuestion, 1000);
            return () => clearTimeout(timer);
        }
    }, [questionText, speakQuestion, disabled]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) { }
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    return (
        <div className="flex items-center gap-4">
            <motion.button
                className={`mic-btn relative ${isListening ? 'bg-red-500' : 'bg-indigo-500'} p-4 rounded-full text-white shadow-lg`}
                onClick={toggleListening}
                disabled={disabled}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {isListening ? <MicOff /> : <Mic />}

                {/* Ripple Effect for Listening */}
                {isListening && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-red-400"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                )}
            </motion.button>

            {/* Status Pill */}
            <AnimatePresence>
                {status !== 'Idle' && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-600"
                    >
                        {status}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Replay Button */}
            <button
                onClick={speakQuestion}
                disabled={isPlaying}
                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
            >
                <Volume2 className={isPlaying ? "animate-pulse" : ""} />
            </button>
        </div>
    );
}
