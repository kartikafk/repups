import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// 📂 Client Components
import CameraView from "./components/client/CameraView";
import ReportView from "./components/client/ReportView";
import AICoachPage from "./components/client/AICoachPage";
import AICoachInsightPage from "./components/client/AICoachInsightPage";
import CommunityPage from "./components/client/CommunityPage";
import CommunityLeaderboard from "./components/client/CommunityLeaderboard";
import CommunityChallenges from "./components/client/CommunityChallenges";
import ChallengeFriend from "./components/client/ChallengeFriend";
import ChallengeInbox from "./components/client/ChallengeInbox";
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
import ClientAssessmentHistoryPage from "./components/client/ClientAssessmentHistoryPage";
import ClientAssessmentReportPage from "./components/client/ClientAssessmentReportPage";
import EventsGymsPage from "./components/client/EventsGymsPage";
import { EventDetails, EventRegister, EventAttendee, EventReview, EventSuccess, GymsList, GymMap, GymDetails, GymMemberships, GymCheckout, GymSuccess, GymMembership } from "./components/client/EventsGymsFlow";
import WorkoutPlanPage from "./components/client/WorkoutPlanPage";
import QnAPage from "./components/client/QnAPage";
import NotificationsPage from "./components/client/NotificationsPage";
import ClientPageShell from "./components/client/ClientPageShell";
import AppBottomNav from "./components/client/AppBottomNav";

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

function ClientAppViewport({ children }) {
  const { pathname } = useLocation();
  const excluded = ["/", "/ai-onboarding", "/trainer-dashboard", "/admin", "/admin/login"];
  const isClientRoute = !excluded.includes(pathname) && !pathname.startsWith("/trainer/");

  useEffect(() => {
    document.body.classList.remove("client-mobile-app");
  }, []);

  return <div className={isClientRoute ? "client-app-viewport" : undefined}>{children}{isClientRoute && <AppBottomNav />}</div>;
}

export default function App() {
  return (
    <Router>
      <ClientAppViewport>
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
        <Route path="/ai-coach-insight" element={<AICoachInsightPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/following" element={<CommunityPage />} />
        <Route path="/community/leaderboard" element={<CommunityLeaderboard />} />
        <Route path="/community/challenges" element={<CommunityChallenges />} />
        <Route path="/community/challenge-friend" element={<ChallengeFriend />} />
        <Route path="/community/challenge-inbox" element={<ChallengeInbox />} />
        <Route path="/trainers" element={<ClientFrame title="Find a Trainer"><FindTrainerPage /></ClientFrame>} />
        <Route path="/trainer-chat" element={<ClientFrame title="Messages"><TrainerChatWrapper /></ClientFrame>} />
        <Route path="/trainer-profile" element={<ClientFrame title="Trainer Profile"><TrainerProfileRouteWrapper /></ClientFrame>} />
        <Route path="/client/profile" element={<ClientProfilePage />} />
        <Route path="/client/assessments" element={<ClientAssessmentHistoryPage />} />
        <Route path="/client/assessments/:assessmentId" element={<ClientAssessmentReportPage />} />
        <Route path="/client/workout-plan" element={<ClientFrame title="Workout Plan"><WorkoutPlanPage /></ClientFrame>} />
        <Route path="/client/qna" element={<ClientFrame title="Q&A"><QnAPage /></ClientFrame>} />
        <Route path="/client/notifications" element={<ClientFrame title="Notifications"><NotificationsPage /></ClientFrame>} />
        <Route path="/client/my-trainer" element={<ClientFrame title="My Trainer"><MyTrainerPage /></ClientFrame>} />
        <Route path="/client/trainers" element={<ClientFrame title="Find a Trainer"><TrainerListPage /></ClientFrame>} />
        <Route path="/client/trainers/:trainerId" element={<ClientFrame title="Trainer Profile"><ClientTrainerProfilePage /></ClientFrame>} />
        <Route path="/client/events-gyms" element={<EventsGymsPage />} />
        <Route path="/client/events/:eventId" element={<EventDetails />} />
        <Route path="/client/events/:eventId/register" element={<EventRegister />} />
        <Route path="/client/events/:eventId/tickets" element={<EventRegister />} />
        <Route path="/client/events/:eventId/attendee" element={<EventAttendee />} />
        <Route path="/client/events/:eventId/review" element={<EventReview />} />
        <Route path="/client/events/:eventId/success" element={<EventSuccess />} />
        <Route path="/client/gyms" element={<GymsList />} />
        <Route path="/client/gyms/map" element={<GymMap />} />
        <Route path="/client/gyms/:gymId" element={<GymDetails />} />
        <Route path="/client/gyms/:gymId/memberships" element={<GymMemberships />} />
        <Route path="/client/gyms/:gymId/checkout" element={<GymCheckout />} />
        <Route path="/client/gyms/:gymId/success" element={<GymSuccess />} />
        <Route path="/client/gyms/:gymId/membership" element={<GymMembership />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ClientAppViewport>
    </Router>
  );
}
