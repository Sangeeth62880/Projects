'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { motion } from 'framer-motion';

interface EmotionMonitorProps {
    onEmotionUpdate?: (emotion: string, confidence: number) => void;
    showDebug?: boolean;
}

export function EmotionMonitor({ onEmotionUpdate, showDebug = false }: EmotionMonitorProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState('Initializing...');
    const [detectedEmotion, setDetectedEmotion] = useState('Neutral');
    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const requestRef = useRef<number>(0);

    // Initialize MediaPipe
    useEffect(() => {
        const initMediaPipe = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );

                const landmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });

                landmarkerRef.current = landmarker;
                setStatus('Ready');
                startWebcam();
            } catch (error) {
                console.error("MediaPipe Init Error:", error);
                setStatus('AI Error');
            }
        };

        initMediaPipe();
    }, []);

    const startWebcam = async () => {
        if (!videoRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', predictWebcam);
        } catch (err) {
            console.error(err);
            setStatus('Camera Error');
        }
    };

    const predictWebcam = () => {
        const video = videoRef.current;
        const landmarker = landmarkerRef.current;

        if (!video || !landmarker) return;

        const startTimeMs = performance.now();
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            const result = landmarker.detectForVideo(video, startTimeMs);

            if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
                const shapes = result.faceBlendshapes[0].categories;

                // Simple heuristic for demo
                const smile = shapes.find(s => s.categoryName === 'mouthSmileLeft')?.score || 0;
                const frown = shapes.find(s => s.categoryName === 'browDownLeft')?.score || 0;
                const surprise = shapes.find(s => s.categoryName === 'browInnerUp')?.score || 0;

                let emotion = 'Neutral';
                let confidence = 0.5;

                if (smile > 0.5) { emotion = 'Happy'; confidence = smile; }
                else if (frown > 0.5) { emotion = 'Confused/Focused'; confidence = frown; }
                else if (surprise > 0.5) { emotion = 'Surprised'; confidence = surprise; }

                setDetectedEmotion(emotion);
                if (onEmotionUpdate) onEmotionUpdate(emotion, confidence);

                setStatus('Tracking');
            } else {
                setStatus('No Face');
            }
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return (
        <div className="relative rounded-xl overflow-hidden shadow-md bg-zinc-900 min-h-[160px] w-full flex items-center justify-center">
            {/* Video Feed */}
            <video
                ref={videoRef}
                className="w-full h-full object-cover transform scale-x-[-1] absolute inset-0"
                autoPlay
                playsInline
                muted
            />

            {/* Status if loading/error */}
            {(status === 'Initializing...' || status === 'Camera Error' || status === 'AI Error') && (
                <div className="z-10 text-white text-xs text-center p-2 bg-black/50 rounded-lg backdrop-blur-sm">
                    {status === 'Initializing...' && <div className="animate-spin text-2xl mb-2">⏳</div>}
                    <p className="font-semibold">{status}</p>
                </div>
            )}

            {/* Overlay Status */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs flex justify-between items-center z-20">
                <span>{status === 'Tracking' ? 'Active' : status}</span>
                <span className={`font-bold ${detectedEmotion === 'Happy' ? 'text-green-400' :
                        detectedEmotion === 'Neutral' ? 'text-gray-300' : 'text-yellow-400'
                    }`}>
                    {detectedEmotion}
                </span>
            </div>

            {/* Focusing Ring */}
            <motion.div
                className="absolute inset-0 border-4 rounded-xl pointer-events-none z-20"
                animate={{
                    borderColor: detectedEmotion === 'Happy' ? 'rgba(74, 222, 128, 0.5)' :
                        detectedEmotion === 'Confused/Focused' ? 'rgba(250, 204, 21, 0.5)' :
                            'rgba(255, 255, 255, 0.1)'
                }}
            />
        </div>
    );
}
