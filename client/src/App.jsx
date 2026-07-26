import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Existing Workout Engine Imports
import StartScreen from './components/StartScreen';
import CameraView from './components/CameraView';
import ReportView from './components/ReportView';
import HistoryView from './components/HistoryView';
import { usePoseTracker } from './hooks/usePoseTracker';
import { syncAssessmentRecord } from './api';

// New Architecture Imports
import RepUpsSignup from './components/signup';
import AIOnboardingChat from './components/AIOnboardingChat';
import PostureAssessment from './components/PostureAssessment';
import HomeDashboard from './components/HomeDashboard';
import AIChatbot from './components/AIOnboardingChat'; // Optional: if using your full-screen AI chat component

// Mock/Safe helper if local IndexedDB save helper is missing in your workspace
const saveAssessment = async (data) => {
  console.log("💾 Assessment saved locally:", data);
  return true;
};

// ----------------------------------------------------------------------
// 1. Original Workout App Component (WorkoutFlow)
// ----------------------------------------------------------------------
function WorkoutFlow() {
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

  const handlePreview = (url) => {
    if (!url) return;
    setPreviewUrl(url);
    setShowReplay(true);
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

    // Save locally
    saveAssessment({ report: finishedReport, videoBlob: finishedReport.videoBlob }).catch((err) => {
      console.warn('Failed to save assessment locally:', err);
    });

    // Sync stats record
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
    tracker.clearReplay(); 
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
        <div className="preview-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={handleClosePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#111116', border: '1px solid #222232', borderRadius: 12, padding: 20, width: '100%', maxWidth: 500, position: 'relative' }}>
            <button className="preview-modal-close" onClick={handleClosePreview} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>
              ✕
            </button>
            <video
              src={previewUrl}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: '70vh', borderRadius: 8, marginTop: 20 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. The Main Router App Component
// ----------------------------------------------------------------------
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Step 1: Sign Up / Sign In Page */}
        <Route path="/" element={<RepUpsSignup />} />

        {/* Step 2: AI Chatbot Intake Component */}
        <Route path="/ai-onboarding" element={<AIOnboardingChat />} />

        {/* Step 3: Posture Assessment & PDF Generator Page */}
        <Route path="/posture-assessment" element={<PostureAssessment />} />

        {/* Step 4: Home Dashboard Hub */}
        <Route path="/dashboard" element={<HomeDashboard />} />

        {/* Step 5: Original Camera & Workout Tracking Flow */}
        <Route path="/workout" element={<WorkoutFlow />} />

        {/* Navbar Option Routes */}
        <Route path="/ai-coach" element={<AIOnboardingChat />} /> {/* Or use <AIChatbot /> if created */}
        <Route path="/community" element={<HomeDashboard />} />
        <Route path="/workout-tracks" element={<HomeDashboard />} />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}