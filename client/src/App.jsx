import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// 📂 Client Components
import CameraView from "./components/client/CameraView";
import ReportView from "./components/client/ReportView";
import AICoachPage from "./components/client/AICoachPage";
import CommunityPage from "./components/client/CommunityPage";
import FindTrainerPage from "./components/client/FindTrainerPage";
import WorkoutAssessmentPage from "./components/client/WorkoutAssessmentPage";
import ClientDashboardPage from "./components/client/ClientDashboardPage";
import WorkoutSessionPlayer from "./components/client/WorkoutSessionPlayer"; 
import RepUpsSignup from "./components/signup"; 
import MessagesPage from "./components/client/MessagesPage";
import MyTrainerPage from "./components/client/MyTrainerPage";
import TrainerListPage from "./components/client/TrainerListPage";
import ClientTrainerProfilePage from "./components/client/TrainerProfilePage";
import TrainerChat from "./components/client/Trainerchat";
import TrainerProfileView from "./components/client/TrainerProfileView";
import { AdminLogin, AdminPanel } from "./admin/AdminPanel";
import ClientProfilePage from "./components/client/ClientProfilePage";
import EventsGymsPage from "./components/client/EventsGymsPage";
import WorkoutPlanPage from "./components/client/WorkoutPlanPage";
import QnAPage from "./components/client/QnAPage";
import NotificationsPage from "./components/client/NotificationsPage";
import ClientPageShell from "./components/client/ClientPageShell";

// 🏋️ Trainer Portal Component
import TrainerDashboard from "./trainer/pages/Trainerdashboard";
import AssessmentReportPage from "./trainer/pages/AssessmentReportPage";

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

// 🔑 Wrapper to pass router location state (trainer id) into TrainerProfileView,
// and wire its callbacks to real navigation instead of local modal state.
function TrainerProfileRouteWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const passedTrainerId = location.state?.trainerId || null;

  if (!passedTrainerId) {
    // No trainer id in state (e.g. direct URL visit/refresh) — nothing to show.
    return <Navigate to="/trainers" replace />;
  }

  return (
    <TrainerProfileView
      trainerId={passedTrainerId}
      onBack={() => navigate(-1)}
      onMessage={() => navigate('/trainer-chat', { state: { trainerId: passedTrainerId } })}
      onScheduleCall={() => navigate('/trainer-chat', { state: { trainerId: passedTrainerId } })}
    />
  );
}

function ClientFrame({ title, children }) {
  return <ClientPageShell title={title}>{children}</ClientPageShell>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RepUpsSignup />} />
        <Route path="/ai-onboarding" element={<ClientFrame title="AI Coach"><AICoachPage /></ClientFrame>} />
        <Route path="/posture-assessment" element={<WorkoutAssessmentPage />} />
        <Route path="/dashboard" element={<ClientDashboardPage />} />
        <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
        <Route path="/trainer/assessment-report/:assessmentId" element={<AssessmentReportPage />} />
        <Route path="/session" element={<WorkoutSessionPlayer />} />
        <Route path="/workout" element={<WorkoutFlow />} />
        <Route path="/report" element={<ReportRouteWrapper />} />
        <Route path="/ai-coach" element={<ClientFrame title="AI Coach"><AICoachPage /></ClientFrame>} />
        <Route path="/community" element={<ClientFrame title="Community"><CommunityPage /></ClientFrame>} />
        <Route path="/trainers" element={<ClientFrame title="Find a Trainer"><FindTrainerPage /></ClientFrame>} />
        <Route path="/trainer-chat" element={<ClientFrame title="Messages"><TrainerChatWrapper /></ClientFrame>} />
        <Route path="/trainer-profile" element={<ClientFrame title="Trainer Profile"><TrainerProfileRouteWrapper /></ClientFrame>} />
        <Route path="/client/profile" element={<ClientProfilePage />} />
        <Route path="/client/workout-plan" element={<ClientFrame title="Workout Plan"><WorkoutPlanPage /></ClientFrame>} />
        <Route path="/client/qna" element={<ClientFrame title="Q&A"><QnAPage /></ClientFrame>} />
        <Route path="/client/notifications" element={<ClientFrame title="Notifications"><NotificationsPage /></ClientFrame>} />
        <Route path="/client/my-trainer" element={<ClientFrame title="My Trainer"><MyTrainerPage /></ClientFrame>} />
        <Route path="/client/trainers" element={<ClientFrame title="Find a Trainer"><TrainerListPage /></ClientFrame>} />
        <Route path="/client/trainers/:trainerId" element={<ClientFrame title="Trainer Profile"><ClientTrainerProfilePage /></ClientFrame>} />
        <Route path="/client/events-gyms" element={<ClientFrame title="Explore"><EventsGymsPage /></ClientFrame>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
