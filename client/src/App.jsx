import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import CameraView from './components/CameraView';
import ReportView from './components/ReportView';
import { usePoseTracker } from './hooks/usePoseTracker';
import CommunityFeed from './components/CommunityFeed';
import { EXERCISE_LIBRARY } from './hooks/exercises';

import RepUpsSignup from './components/signup'; 
import AIOnboardingChat from './components/AIOnboardingChat';
import PostureAssessment from './components/PostureAssessment';
import HomeDashboard from './components/HomeDashboard';
import WorkoutSessionPlayer from './components/WorkoutSessionPlayer'; 

function WorkoutFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialExercise = location.state?.exercise || 'squat';
  const initialFacing = location.state?.facingMode || 'user';
  const activeSetIndex = location.state?.setIndex ?? 0;
  const targetDate = location.state?.date || new Date().toISOString().split('T')[0];
  const targetWeight = location.state?.weight || 0;

  // Use the userId WorkoutSessionPlayer already resolved (via its
  // getResolvedUserId, which checks the 'user' JSON object, then
  // 'profileId', then 'userId') and passed through navigation state.
  // Do NOT re-derive it here.
  const sessionUserId = location.state?.userId || null;

  const [screen, setScreen] = useState('camera'); 
  const [exercise] = useState(initialExercise);
  const [facingMode] = useState(initialFacing);
  const [voiceOn] = useState(true);
  const [report, setReport] = useState(null);
  const [startRequested, setStartRequested] = useState(true);

  const tracker = usePoseTracker({ exercise, voiceOn });

  useEffect(() => {
    if (!sessionUserId) {
      console.warn('WorkoutFlow launched with no userId in navigation state. Redirecting to session picker.');
      navigate('/session', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = () => {
    tracker.stop();
    setStartRequested(false);
    navigate('/session');
  };

  const handleEndSet = async () => {
    await tracker.stop();
    setStartRequested(false);
    const finishedReport = tracker.buildReport();

    const exerciseMeta = EXERCISE_LIBRARY.find(ex => ex.key === finishedReport.exercise || ex.trackingKey === finishedReport.exercise);
    const cleanExerciseName = exerciseMeta ? exerciseMeta.name : (exerciseMeta?.label || finishedReport.exercise);

    // Single enriched report object. Saved exactly once, by ReportView
    // (via saveSession) below -- no separate manual sync call.
    const enrichedReport = {
      ...finishedReport,
      exercise: cleanExerciseName,
      setIndex: activeSetIndex,
      date: targetDate,
      weight: targetWeight,
      userId: sessionUserId
    };

    setReport(enrichedReport);
    setScreen('report');
  };

  const handleAgain = () => {
    tracker.stop();
    tracker.clearReplay(); 
    navigate('/session'); 
  };

  const handlePreview = (replayUrl) => {
    if (!replayUrl) return;
    window.open(replayUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="app">
      {screen === 'camera' && (
        <CameraView tracker={tracker} exercise={exercise} facingMode={facingMode} shouldStart={startRequested} onStop={handleStop} onEndSet={handleEndSet} />
      )}
      {screen === 'report' && report && (
        <ReportView
          report={report}
          onAgain={handleAgain}
          onDone={handleAgain}
          onPreview={handlePreview}
          isHistorical={false}
        />
      )}
    </div>
  );
}

function ReportRouteWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const reportData = location.state?.report;

  if (!reportData) {
    return <Navigate to="/session" replace />;
  }

  const handlePreview = (replayUrl) => {
    if (!replayUrl) return;
    window.open(replayUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <ReportView 
      report={reportData} 
      onAgain={() => navigate('/session')} 
      onDone={() => navigate('/session')} 
      onPreview={handlePreview}
      isHistorical={true}
    />
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RepUpsSignup />} />
        <Route path="/ai-onboarding" element={<AIOnboardingChat />} />
        <Route path="/posture-assessment" element={<PostureAssessment />} />
        <Route path="/dashboard" element={<HomeDashboard />} />
        {/* No userId prop passed here -- WorkoutSessionPlayer resolves it
            itself from localStorage on every mount via getResolvedUserId,
            which is more thorough and always fresh. */}
        <Route path="/session" element={<WorkoutSessionPlayer />} />
        <Route path="/workout" element={<WorkoutFlow />} />
        <Route path="/report" element={<ReportRouteWrapper />} />
        <Route path="/ai-coach" element={<AIOnboardingChat />} /> 
        <Route path="/community" element={<CommunityFeed/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}