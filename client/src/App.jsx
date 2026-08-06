import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// 📂 Client Components
import CameraView from "./components/client/CameraView";
import ReportView from "./components/client/ReportView";
import CommunityFeed from "./components/client/CommunityFeed";
import TrainerDiscovery from "./components/client/TrainerDiscovery";
import AIOnboardingChat from "./components/client/AIOnboardingChat";
import PostureAssessment from "./components/client/PostureAssessment";
import HomeDashboard from "./components/client/HomeDashboard";
import WorkoutSessionPlayer from "./components/client/WorkoutSessionPlayer"; 
import RepUpsSignup from "./components/signup"; 
import TrainerChat from "./components/client/Trainerchat";

// 🏋️ Trainer Portal Component
import TrainerDashboard from "./trainer/pages/Trainerdashboard";

// 🎣 Hooks
import { usePoseTracker } from "./hooks/usePoseTracker";
import { EXERCISE_LIBRARY } from "./hooks/exercises";

function WorkoutFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialExercise = location.state?.exercise || 'squat';
  const initialFacing = location.state?.facingMode || 'user';
  const activeSetIndex = location.state?.setIndex ?? 0;
  const targetDate = location.state?.date || new Date().toISOString().split('T')[0];
  const targetWeight = location.state?.weight || 0;
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
      navigate('/session', { replace: true });
    }
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

// Wrapper to pass router location state (trainer info) into TrainerChat safely
function TrainerChatWrapper() {
  const location = useLocation();
  const passedTrainerId = location.state?.trainerId || null;
  return <TrainerChat initialTrainerId={passedTrainerId} />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RepUpsSignup />} />
        <Route path="/ai-onboarding" element={<AIOnboardingChat />} />
        <Route path="/posture-assessment" element={<PostureAssessment />} />
        <Route path="/dashboard" element={<HomeDashboard />} />
        <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
        <Route path="/session" element={<WorkoutSessionPlayer />} />
        <Route path="/workout" element={<WorkoutFlow />} />
        <Route path="/report" element={<ReportRouteWrapper />} />
        <Route path="/ai-coach" element={<AIOnboardingChat />} /> 
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/trainers" element={<TrainerDiscovery />} />
        <Route path="/trainer-chat" element={<TrainerChatWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}