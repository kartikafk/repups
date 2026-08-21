import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Auth
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/models/user.dart';

// Screens - Auth
import '../../screens/auth_screen.dart';

// Client Screens
import '../../screens/home_dashboard_screen.dart';
import '../../screens/posture_capture_screen.dart';
import '../../screens/assessment_history_screen.dart';
import '../../screens/assessment_report_screen.dart';
import '../../screens/workout_session_screen.dart';
import '../../screens/workout_camera_screen.dart';
import '../../screens/workout_report_screen.dart';
import '../../screens/workout_plan_screen.dart';
import '../../screens/community_screen.dart';
import '../../screens/trainer_discovery_screen.dart';
import '../../screens/trainer_list_screen.dart';
import '../../screens/trainer_profile_screen.dart';
import '../../screens/trainer_chat_screen.dart';
import '../../screens/my_trainer_screen.dart';
import '../../screens/client_profile_screen.dart';
import '../../screens/ai_coach_screen.dart';
import '../../screens/ai_coach_insight_screen.dart';
import '../../screens/events_gyms_screen.dart';
import '../../screens/notifications_screen.dart';
import '../../screens/catalog_detail_screen.dart';
import '../../screens/community_sections_screen.dart';
import '../../screens/friend_challenge_screen.dart';
import '../../screens/admin_login_screen.dart';
import '../../screens/role_dashboard_screen.dart';
import '../../screens/portal_list_screen.dart';
import '../../screens/gym_memberships_screen.dart';
import '../../screens/gym_membership_status_screen.dart';
import '../../screens/event_registration_screen.dart';
import '../../screens/event_attendee_screen.dart';
import '../../screens/challenge_inbox_screen.dart';
import '../../screens/purchase_complete_screen.dart';
import '../../screens/gym_map_screen.dart';
import '../../screens/trainer_assessment_report_screen.dart';
import '../../screens/qna_screen.dart';
import '../../screens/event_review_screen.dart';
import '../../screens/gym_checkout_screen.dart';

// Create alias for consistency
typedef ClientDashboardScreen = HomeDashboardScreen;

// Trainer Screens (placeholders)
// import '../../screens/trainer_dashboard_screen.dart';

// Admin Screens (placeholders)
// import '../../screens/admin_dashboard_screen.dart';

class AppRoutes {
  // Auth routes
  static const String auth = '/';

  // Client routes
  static const String dashboard = '/dashboard';
  static const String postureAssessment = '/posture-assessment';
  static const String clientAssessments = '/client/assessments';
  static const String clientAssessmentReport =
      '/client/assessments/:assessmentId';
  static const String workoutSession = '/session';
  static const String workoutCamera = '/workout';
  static const String workoutReport = '/report';
  static const String workoutPlan = '/client/workout-plan';
  static const String community = '/community';
  static const String trainers = '/trainers';
  static const String clientTrainers = '/client/trainers';
  static const String clientTrainerProfile = '/client/trainers/:trainerId';
  static const String trainerChat = '/trainer-chat';
  static const String myTrainer = '/client/my-trainer';
  static const String clientProfile = '/client/profile';
  static const String aiCoach = '/ai-coach';
  static const String aiOnboarding = '/ai-onboarding';
  static const String aiCoachInsight = '/ai-coach-insight';
  static const String eventsGyms = '/client/events-gyms';
  static const String notifications = '/client/notifications';

  // Trainer routes
  static const String trainerDashboard = '/trainer-dashboard';
  static const String trainerAssessmentReport =
      '/trainer/assessment-report/:assessmentId';

  // Admin routes
  static const String adminDashboard = '/admin';
  static const String adminLogin = '/admin/login';
}

// Create a notifier to refresh GoRouter when auth changes
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(this._ref) {
    _ref.listen(
      authProvider,
      (_, __) => notifyListeners(),
    );
  }

  final Ref _ref;
}

final goRouterRefreshProvider = Provider<GoRouterRefreshStream>((ref) {
  return GoRouterRefreshStream(ref);
});

final routerProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = ref.watch(goRouterRefreshProvider);

  return GoRouter(
    initialLocation: AppRoutes.auth,
    refreshListenable: refreshNotifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);

      final isLoading = authState.isLoading;
      final isAuthenticated = authState.isAuthenticated;
      final user = authState.user;

      if (isLoading) return null;

      final path = state.uri.path;
      final isAuthRoute =
          path == AppRoutes.auth || path == AppRoutes.adminLogin;
      final isAdminRoute = path == '/admin' || path.startsWith('/admin/');
      // `/trainers` and `/trainer-chat` are client routes. Do not treat their
      // shared prefix as the trainer portal.
      final isTrainerRoute =
          path == AppRoutes.trainerDashboard || path.startsWith('/trainer/');

      // Not authenticated
      if (!isAuthenticated) {
        return isAuthRoute ? null : AppRoutes.auth;
      }

      // Authenticated - redirect based on role
      if (isAuthRoute) {
        switch (user?.role) {
          case UserRole.client:
            return AppRoutes.dashboard;
          case UserRole.trainer:
            return AppRoutes.trainerDashboard;
          case UserRole.admin:
            return AppRoutes.adminDashboard;
          default:
            return AppRoutes.auth;
        }
      }

      // Role-based access control
      if (isAdminRoute && user?.role != UserRole.admin) {
        return AppRoutes.auth;
      }

      if (isTrainerRoute &&
          user?.role != UserRole.trainer &&
          user?.role != UserRole.admin) {
        return AppRoutes.dashboard; // Redirect clients to dashboard
      }

      // Client trying to access trainer routes
      if (user?.role == UserRole.client && isTrainerRoute) {
        return AppRoutes.dashboard;
      }

      return null;
    },
    routes: [
      // Auth Route
      GoRoute(
        path: AppRoutes.auth,
        builder: (context, state) => const AuthScreen(),
      ),

      // Client Routes
      GoRoute(
        path: AppRoutes.dashboard,
        builder: (context, state) => const ClientDashboardScreen(),
      ),

      GoRoute(
        path: AppRoutes.postureAssessment,
        builder: (context, state) => const PostureCaptureScreen(),
      ),

      GoRoute(
        path: AppRoutes.clientAssessments,
        builder: (context, state) => const AssessmentHistoryScreen(),
      ),

      GoRoute(
        path: AppRoutes.clientAssessmentReport,
        builder: (context, state) => AssessmentReportScreen(
          assessmentId: state.pathParameters['assessmentId']!,
        ),
      ),

      GoRoute(
        path: AppRoutes.workoutSession,
        builder: (context, state) => const WorkoutSessionScreen(),
      ),

      GoRoute(
        path: AppRoutes.workoutCamera,
        builder: (context, state) => const WorkoutCameraScreen(),
      ),

      GoRoute(
        path: AppRoutes.workoutReport,
        builder: (context, state) => const WorkoutReportScreen(),
      ),

      GoRoute(
        path: AppRoutes.workoutPlan,
        builder: (context, state) => const WorkoutPlanScreen(),
      ),

      GoRoute(
        path: AppRoutes.community,
        builder: (context, state) => const CommunityScreen(),
      ),
      GoRoute(
        path: '/community/following',
        builder: (context, state) => const CommunityScreen(),
      ),
      GoRoute(
        path: '/community/leaderboard',
        builder: (context, state) => const CommunitySectionsScreen(
            section: CommunitySection.leaderboard),
      ),
      GoRoute(
        path: '/community/challenges',
        builder: (context, state) =>
            const CommunitySectionsScreen(section: CommunitySection.challenges),
      ),
      GoRoute(
        path: '/community/challenge-friend',
        builder: (context, state) => const FriendChallengeScreen(),
      ),
      GoRoute(
        path: '/community/challenge-inbox',
        builder: (context, state) => const ChallengeInboxScreen(),
      ),

      GoRoute(
        path: AppRoutes.trainers,
        builder: (context, state) => const TrainerDiscoveryScreen(),
      ),

      GoRoute(
        path: AppRoutes.clientTrainers,
        builder: (context, state) => const TrainerListScreen(),
      ),

      GoRoute(
        path: AppRoutes.clientTrainerProfile,
        builder: (context, state) => TrainerProfileScreen(
          trainerId: state.pathParameters['trainerId']!,
        ),
      ),

      GoRoute(
        path: AppRoutes.trainerChat,
        builder: (context, state) => const TrainerChatScreen(),
      ),

      GoRoute(
        path: AppRoutes.myTrainer,
        builder: (context, state) => const MyTrainerScreen(),
      ),

      GoRoute(
        path: AppRoutes.clientProfile,
        builder: (context, state) => const ClientProfileScreen(),
      ),

      GoRoute(
        path: AppRoutes.aiCoach,
        builder: (context, state) => const AICoachScreen(),
      ),
      GoRoute(
        path: AppRoutes.aiOnboarding,
        builder: (context, state) => const AICoachScreen(),
      ),

      GoRoute(
        path: AppRoutes.aiCoachInsight,
        builder: (context, state) => const AICoachInsightScreen(),
      ),

      GoRoute(
        path: AppRoutes.eventsGyms,
        builder: (context, state) => const EventsGymsScreen(),
      ),
      GoRoute(
        path: '/client/events/:eventId',
        builder: (context, state) => CatalogDetailScreen(
            id: state.pathParameters['eventId']!, isEvent: true),
      ),
      GoRoute(
        path: '/client/gyms/:gymId',
        builder: (context, state) => CatalogDetailScreen(
            id: state.pathParameters['gymId']!, isEvent: false),
      ),
      GoRoute(
          path: '/trainer-profile',
          builder: (context, state) => const TrainerListScreen()),
      GoRoute(
          path: '/client/qna',
          builder: (context, state) => const QnaScreen()),
      GoRoute(
          path: '/client/events/:eventId/register',
          builder: (context, state) => EventRegistrationScreen(
              eventId: state.pathParameters['eventId']!)),
      GoRoute(
          path: '/client/events/:eventId/tickets',
          builder: (context, state) => EventRegistrationScreen(
              eventId: state.pathParameters['eventId']!)),
      GoRoute(
          path: '/client/events/:eventId/attendee',
          builder: (context, state) =>
              EventAttendeeScreen(eventId: state.pathParameters['eventId']!)),
      GoRoute(
          path: '/client/events/:eventId/review',
          builder: (context, state) => EventReviewScreen(
              eventId: state.pathParameters['eventId']!)),
      GoRoute(
          path: '/client/events/:eventId/success',
          builder: (context, state) => const PurchaseCompleteScreen(
              title: 'Registration complete',
              message: 'Your event registration has been confirmed.')),
      GoRoute(
          path: '/client/gyms',
          builder: (context, state) => const EventsGymsScreen()),
      GoRoute(
          path: '/client/gyms/map',
          builder: (context, state) => const GymMapScreen()),
      GoRoute(
          path: '/client/gyms/:gymId/memberships',
          builder: (context, state) =>
              GymMembershipsScreen(gymId: state.pathParameters['gymId']!)),
      GoRoute(
          path: '/client/gyms/:gymId/checkout',
          builder: (context, state) => GymCheckoutScreen(
              gymId: state.pathParameters['gymId']!)),
      GoRoute(
          path: '/client/gyms/:gymId/success',
          builder: (context, state) => const GymMembershipStatusScreen()),
      GoRoute(
          path: '/client/gyms/:gymId/membership',
          builder: (context, state) => const GymMembershipStatusScreen()),
      GoRoute(
        path: AppRoutes.notifications,
        builder: (context, state) => const NotificationsScreen(),
      ),

      // Trainer Routes
      GoRoute(
        path: AppRoutes.trainerDashboard,
        builder: (context, state) =>
            const RoleDashboardScreen(role: PortalRole.trainer),
      ),

      GoRoute(
        path: AppRoutes.trainerAssessmentReport,
        builder: (context, state) => TrainerAssessmentReportScreen(
            assessmentId: state.pathParameters['assessmentId']!),
      ),
      GoRoute(
          path: '/trainer/clients',
          builder: (context, state) => const PortalListScreen(
              title: 'Clients',
              endpoint: '/trainer/clients',
              collectionKey: 'clients')),
      GoRoute(
          path: '/trainer/appointments',
          builder: (context, state) => const PortalListScreen(
              title: 'Appointments',
              endpoint: '/bookings',
              collectionKey: 'bookings')),
      GoRoute(
          path: '/trainer/messages',
          builder: (context, state) => PortalListScreen(
              title: 'Messages',
              endpoint:
                  '/messages/conversations/${state.uri.queryParameters['trainerId'] ?? ''}',
              collectionKey: 'conversations')),
      GoRoute(
          path: '/trainer/plans',
          builder: (context, state) => const PortalListScreen(
              title: 'Plans',
              endpoint: '/workout-plans',
              collectionKey: 'plans')),

      // Admin Routes
      GoRoute(
        path: AppRoutes.adminLogin,
        builder: (context, state) => const AdminLoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminDashboard,
        builder: (context, state) =>
            const RoleDashboardScreen(role: PortalRole.admin),
      ),
      GoRoute(
          path: '/admin/users',
          builder: (context, state) => const PortalListScreen(
              title: 'Users',
              endpoint: '/admin/users',
              collectionKey: 'users')),
      GoRoute(
          path: '/admin/sessions',
          builder: (context, state) => const PortalListScreen(
              title: 'Sessions',
              endpoint: '/admin/sessions',
              collectionKey: 'sessions')),
      GoRoute(
          path: '/admin/bookings',
          builder: (context, state) => const PortalListScreen(
              title: 'Bookings',
              endpoint: '/admin/bookings',
              collectionKey: 'bookings')),
      GoRoute(
          path: '/admin/gyms',
          builder: (context, state) => const PortalListScreen(
              title: 'Gyms', endpoint: '/admin/gyms', collectionKey: 'gyms')),
      GoRoute(
          path: '/admin/logs',
          builder: (context, state) => const PortalListScreen(
              title: 'Audit logs',
              endpoint: '/admin/audit-logs',
              collectionKey: 'logs')),
    ],

    // 404 Error Handler
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('Page Not Found')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64),
            const SizedBox(height: 16),
            Text(
              'Page not found: ${state.uri}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.auth),
              child: const Text('Go to Home'),
            ),
          ],
        ),
      ),
    ),
  ); // Close errorBuilder
}); // Close routerProvider

// Navigation helpers
extension AppRouterExtension on GoRouter {
  // Auth
  void goToAuth() => go(AppRoutes.auth);

  // Client
  void goToDashboard() => go(AppRoutes.dashboard);
  void goToPostureAssessment() => go(AppRoutes.postureAssessment);
  void goToWorkoutSession() => go(AppRoutes.workoutSession);
  void goToCommunity() => go(AppRoutes.community);
  void goToTrainers() => go(AppRoutes.trainers);
  void goToMyTrainer() => go(AppRoutes.myTrainer);
  void goToProfile() => go(AppRoutes.clientProfile);
  void goToAICoach() => go(AppRoutes.aiCoach);

  // Trainer
  void goToTrainerDashboard() => go(AppRoutes.trainerDashboard);
}
