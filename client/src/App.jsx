import { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import CameraView from './components/CameraView';
import ReportView from './components/ReportView';
import HistoryView from './components/HistoryView';
import { usePoseTracker } from './hooks/usePoseTracker';
import { syncAssessmentRecord } from './api';

export default function App() {
  const [screen, setScreen] = useState('start'); // start | camera | report
  const [exercise, setExercise] = useState('squat');
  const [facingMode, setFacingMode] = useState('user');
  const [voiceOn, setVoiceOn] = useState(true);
  const [report, setReport] = useState(null);
  const [startRequested, setStartRequested] = useState(false);

  // Preview modal state
  const [showReplay, setShowReplay] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const tracker = usePoseTracker({ exercise, voiceOn });

  // Note: the 360-hour (15-day) retention window is enforced entirely
  // server-side via a MongoDB TTL index on the `assessments` collection
  // (see server/models/Assessment.js) — no client-side purge needed.

  // Receives the replay blob URL from ReportView (report.avgTempo.replay)
 const handlePreview = (url) => {
  console.log("handlePreview called");
  console.log("URL:", url);

  if (!url) {
    console.log("No URL");
    return;
  }

  setPreviewUrl(url);
  setShowReplay(true);

  console.log("Modal should open");
};

  const handleClosePreview = () => {
    setShowReplay(false);
  };

  const handleStart = () => {
    setStartRequested(true);
    setScreen('camera');
  };

  const handleStop = () => {
    tracker.stop();
    setStartRequested(false);
    setScreen('start');
  };

  const handleEndSet = async () => {
    await tracker.stop();
    setStartRequested(false);
    const finishedReport = tracker.buildReport();
    setReport(finishedReport);
    setScreen('report');

    // Save to this device only (IndexedDB) — video never uploaded to the server.
    saveAssessment({ report: finishedReport, videoBlob: finishedReport.videoBlob }).catch((err) => {
      console.warn('Failed to save assessment locally:', err);
    });

    // Sync a minimal stats-only record (no video) so the server can
    // enforce the 360-hour retention window with a MongoDB TTL index,
    // independent of whether the app is ever reopened.
    syncAssessmentRecord({
      exercise: finishedReport.exercise,
      avgScore: finishedReport.avgScore,
      repCount: finishedReport.repCount,
      avgRom: finishedReport.avgRom,
      consistency: finishedReport.consistency
    }).catch((err) => {
      console.warn('Failed to sync assessment record:', err);
    });
  };

  const handleAgain = () => {
    tracker.stop();
    tracker.clearReplay(); // discard the last recording — user didn't save/export it
    setStartRequested(false);
    setReport(null);
    setShowReplay(false);
    setPreviewUrl(null);
    setScreen('start');
  };

  const handleOpenHistory = () => {
    setScreen('history');
  };

  const handleBackFromHistory = () => {
    setScreen('start');
  };
console.log("showReplay =", showReplay);
console.log("previewUrl =", previewUrl);
  return (
    <div id="app">
      {screen === 'camera' && (
        <CameraView
          tracker={tracker}
          exercise={exercise}
          facingMode={facingMode}
          shouldStart={startRequested}
          onStop={handleStop}
          onEndSet={handleEndSet}
        />
      )}
      {screen === 'start' && (
        <StartScreen
          exercise={exercise}
          setExercise={setExercise}
          facingMode={facingMode}
          setFacingMode={setFacingMode}
          voiceOn={voiceOn}
          setVoiceOn={setVoiceOn}
          onStart={handleStart}
          onOpenHistory={handleOpenHistory}
        />
      )}
      {screen === 'history' && <HistoryView onBack={handleBackFromHistory} />}
      {screen === 'report' && report && (
        <ReportView
          report={report}
          onAgain={handleAgain}
          onDone={handleAgain}
          onPreview={handlePreview}
        />
      )}

      {showReplay && previewUrl && (
        <div className="preview-modal-overlay" style={{ position: "fixed",inset: 0,background: "rgba(255,0,0,0.4)",zIndex: 99999}} onClick={handleClosePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="preview-modal-close" onClick={handleClosePreview}>
              ✕
            </button>
            <video
              src={previewUrl}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: '80vh', borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}