import { useRef, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * Lightweight still-image pose capture, separate from the live video
 * PoseLandmarker used during workouts (usePoseTracker.js). This one runs
 * in IMAGE mode since we only need a single detection per captured photo.
 */
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

  /**
   * Captures the current video frame to a canvas, runs pose detection on
   * it, and returns both the landmarks and a data URL of the snapshot
   * (used later for the on-screen report and the PDF).
   * @param {HTMLVideoElement} video
   * @returns {Promise<{ landmarks: Array|null, imageDataUrl: string }|null>}
   */
  const captureAndAnalyze = useCallback(async (video) => {
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);

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
      } catch (e) {
        // ignore
      }
      landmarkerRef.current = null;
    }
    loadingPromiseRef.current = null;
  }, []);

  return { captureAndAnalyze, dispose };
}