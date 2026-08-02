import { useRef, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export function usePostureCapture() {
  const landmarkerRef = useRef(null);
  const loadingPromiseRef = useRef(null);

  const ensureLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    if (loadingPromiseRef.current) return loadingPromiseRef.current;

    loadingPromiseRef.current = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'IMAGE',
        numPoses: 1
      });
      landmarkerRef.current = landmarker;
      return landmarker;
    })();

    return loadingPromiseRef.current;
  }, []);

  const captureAndAnalyze = useCallback(async (video) => {
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 📉 Optimized quality to 75% to prevent heavy payloads
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.75);

    try {
      const landmarker = await ensureLandmarker();
      const result = landmarker.detect(canvas);
      const landmarks =
        result.landmarks && result.landmarks.length > 0 ? result.landmarks[0] : null;
      return { landmarks, imageDataUrl };
    } catch (err) {
      console.error('Posture capture detection failed:', err);
      return { landmarks: null, imageDataUrl };
    }
  }, [ensureLandmarker]);

  const dispose = useCallback(() => {
    if (landmarkerRef.current) {
      try {
        landmarkerRef.current.close();
      } catch (e) {}
      landmarkerRef.current = null;
    }
    loadingPromiseRef.current = null;
  }, []);

  return { captureAndAnalyze, dispose };
}