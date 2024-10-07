// src/App.tsx

import React, { useEffect, useRef } from 'react';
import './App.css';
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
  HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let runningMode = 'IMAGE'; 

    const loadRecognizer = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      const gestureRecognizer = await GestureRecognizer.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: runningMode as 'IMAGE' | 'VIDEO',
          numHands: 2,
        }
      );

      gestureRecognizerRef.current = gestureRecognizer;
    };

    loadRecognizer();

    //渲染結束會做的事
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    intervalRef.current = window.setInterval(updateImage, 300);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const updateImage = async () => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = `http://172.20.10.3/?${new Date().getTime()}`;
    image.onload = async () => {
      if (canvasRef.current && gestureRecognizerRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = image.width;
          canvas.height = image.height;

          const result = await gestureRecognizerRef.current.recognize(image);
          onResults(result, image);
        }
      }
    };
    image.onerror = (error) => {
      console.error('Error loading image:', error);
    };
  };

  const onResults = (result: HandLandmarkerResult, image: HTMLImageElement) => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        if (result.landmarks) {
          const drawingUtils = new DrawingUtils(ctx);
          for (const landmarks of result.landmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              GestureRecognizer.HAND_CONNECTIONS,
              {
                color: '#00FF00',
                lineWidth: 5,
              }
            );
            drawingUtils.drawLandmarks(landmarks, {
              color: '#FF0000',
              lineWidth: 2,
            });
          }
        }
      }
    }
  };

  return (
    <div className="App">
      <h1>✨ ESP32-CAM 即時影像與手部辨識 ✨</h1>
      <canvas ref={canvasRef} id="outputCanvas"></canvas>
    </div>
  );
};

export default App;
