import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_client.dart';
import '../models/user.dart';
import 'workout_setup_screen.dart';
import 'dart:math' as math;

class HomeDashboardScreen extends StatefulWidget {
  const HomeDashboardScreen({Key? key}) : super(key: key);

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  final ApiClient _api = ApiClient();
  
  User? _user;
  List<WorkoutSession> _sessions = [];
  PostureRecord? _posture;
  List<WorkoutPlan> _plans = [];
  Trainer? _trainer;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // ===== MOCK DATA MODE =====
      // Remove this section and uncomment the API calls below when backend is ready
      await Future.delayed(const Duration(seconds: 1)); // Simulate network delay
      
      final user = User(
        id: '123456',
        name: 'Kartik Joshi',
        email: 'kartik@repups.com',
        role: 'client',
        photoUrl: null,
      );
      
      final sessions = [
        WorkoutSession(
          id: '1',
          exercise: 'Squat',
          repCount: 12,
          avgScore: 87.5,
          date: DateTime.now().toIso8601String().split('T')[0],
          weight: 80.0,
        ),
        WorkoutSession(
          id: '2',
          exercise: 'Bench Press',
          repCount: 10,
          avgScore: 92.0,
          date: DateTime.now().subtract(const Duration(days: 1)).toIso8601String().split('T')[0],
          weight: 60.0,
        ),
        WorkoutSession(
          id: '3',
          exercise: 'Deadlift',
          repCount: 8,
          avgScore: 85.0,
          date: DateTime.now().subtract(const Duration(days: 2)).toIso8601String().split('T')[0],
          weight: 100.0,
        ),
      ];
      
      final plans = [
        WorkoutPlan(
          id: '1',
          name: 'Upper Body Strength',
          goal: 'Build muscle mass',
          days: [
            {'name': 'Day 1', 'exercises': []},
            {'name': 'Day 2', 'exercises': []},
          ],
        ),
      ];
      
      final posture = PostureRecord(
        id: '1',
        overallScore: 78.0,
        details: {},
      );
      
      final trainer = Trainer(
        id: '1',
        name: 'Coach Alex',
        photoUrl: null,
        gym: 'Iron Temple Gym',
        location: 'Mumbai, India',
        specialties: ['Strength Training', 'Hypertrophy'],
      );

      setState(() {
        _user = user;
        _sessions = sessions;
        _plans = plans;
        _posture = posture;
        _trainer = trainer;
        _loading = false;
      });
      
      // ===== REAL API CALLS (commented out - uncomment when backend is ready) =====
      /*
      // Load user data
      final userData = await _api.getCurrentUser();
      final user = User.fromJson(userData['user']);
      
      // Load all dashboard data in parallel
      final results = await Future.wait([
        _api.getSessions(limit: 100),
        _api.getMyWorkoutPlans(),
        _api.getLatestPosture(user.id),
        _api.getTrainerRequests(),
      ]);

      final sessions = (results[0] as List)
          .map((json) => WorkoutSession.fromJson(json))
          .toList();
      
      final plansData = results[1] as Map<String, dynamic>;
      final plans = (plansData['plans'] as List? ?? [])
          .map((json) => WorkoutPlan.fromJson(json))
          .toList();
      
      final postureData = results[2] as Map<String, dynamic>;
      final posture = postureData['record'] != null
          ? PostureRecord.fromJson(postureData['record'])
          : null;
      
      final requestsData = results[3] as Map<String, dynamic>;
      final requests = (requestsData['requests'] as List? ?? []);
      Trainer? trainer;
      for (var request in requests) {
        if (request['status'] == 'accepted' && request['trainer'] != null) {
          trainer = Trainer.fromJson(request['trainer']);
          break;
        }
      }

      setState(() {
        _user = user;
        _sessions = sessions;
        _plans = plans;
        _posture = posture;
        _trainer = trainer;
        _loading = false;
      });
      */
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  DashboardStats _calculateStats() {
    final formScores = _sessions
        .map((s) => s.avgScore)
        .where((score) => score.isFinite && score > 0)
        .toList();
    
    final workoutDays = _sessions
        .map((s) => s.date)
        .where((date) => date.isNotEmpty)
        .toSet()
        .length;
    
    final volume = _sessions.fold<double>(
      0.0,
      (sum, s) => sum + (s.weight ?? 0) * s.repCount,
    );

    return DashboardStats(
      postureScore: _posture?.overallScore.round() ?? 0,
      totalSessions: _sessions.length,
      workoutDays: workoutDays,
      averageForm: formScores.isNotEmpty
          ? (formScores.reduce((a, b) => a + b) / formScores.length).round()
          : 0,
      volume: volume.round(),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(
          child: Text(
            'Loading your performance hub…',
            style: TextStyle(color: AppColors.textMuted),
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Text(
            _error!,
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      );
    }

    if (_user == null) {
      return const Scaffold(
        body: Center(child: Text('No user data')),
      );
    }

    final stats = _calculateStats();
    final plan = _plans.isNotEmpty ? _plans.first : null;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadDashboard,
          color: AppColors.neon,
          backgroundColor: AppColors.surface,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Header
              _buildHeader(),
              const SizedBox(height: 24),
              
              // Welcome section
              _buildWelcome(),
              const SizedBox(height: 24),
              
              // Top stats (Posture + Streak)
              _buildTopStats(stats),
              const SizedBox(height: 20),
              
              // Today's workout card
              _buildWorkoutCard(plan),
              const SizedBox(height: 16),
              
              // Coach/Trainer card
              _buildCoachCard(),
              const SizedBox(height: 16),
              
              // AI Coach insight card
              _buildAIInsightCard(stats),
              const SizedBox(height: 24),
              
              // Quick actions
              _buildQuickActions(),
              const SizedBox(height: 20),
              
              // Extra stats
              _buildExtraStats(stats),
              const SizedBox(height: 16),
              
              // Progress bar
              _buildProgressBar(plan),
              const SizedBox(height: 80), // Bottom nav spacing
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        RichText(
          text: const TextSpan(
            children: [
              TextSpan(
                text: 'Rep',
                style: TextStyle(
                  fontFamily: 'Syne',
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              TextSpan(
                text: 'Ups',
                style: TextStyle(
                  fontFamily: 'Syne',
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.neon,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
        ),
        Row(
          children: [
            _buildIconButton(
              icon: Icons.notifications_outlined,
              onTap: () {
                // Navigate to notifications
              },
            ),
            const SizedBox(width: 12),
            _buildAvatar(),
          ],
        ),
      ],
    );
  }

  Widget _buildIconButton({required IconData icon, required VoidCallback onTap}) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.textMuted, size: 20),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    return GestureDetector(
      onTap: () {
        // Navigate to profile
      },
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: _user!.photoUrl != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: Image.network(
                  _user!.photoUrl!,
                  fit: BoxFit.cover,
                ),
              )
            : Center(
                child: Text(
                  _user!.initials,
                  style: const TextStyle(
                    color: AppColors.neon,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildWelcome() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Hey ${_user!.firstName} ',
              style: const TextStyle(
                fontFamily: 'Syne',
                fontSize: 32,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
            const Text(
              '✦',
              style: TextStyle(
                fontSize: 24,
                color: AppColors.neon,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text(
          "Let's crush your goals today.",
          style: TextStyle(
            fontSize: 14,
            color: AppColors.textMuted,
          ),
        ),
      ],
    );
  }

  Widget _buildTopStats(DashboardStats stats) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: _buildPostureCard(stats.postureScore),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: _buildStreakCard(stats.workoutDays),
        ),
      ],
    );
  }

  Widget _buildPostureCard(int score) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.glowCard,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'POSTURE SCORE',
                  style: TextStyle(
                    fontFamily: 'Space Mono',
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textMuted,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '$score',
                      style: const TextStyle(
                        fontFamily: 'Syne',
                        fontSize: 36,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        height: 1,
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 4),
                      child: Text(
                        '/100',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  score >= 70
                      ? 'Good'
                      : score > 0
                          ? 'Keep improving'
                          : 'No scan yet',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () {
                    // Navigate to assessments
                  },
                  child: const Text(
                    'View assessment →',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.neon,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          _buildScoreRing(score),
        ],
      ),
    );
  }

  Widget _buildScoreRing(int score) {
    final safeScore = score.clamp(0, 100);
    return SizedBox(
      width: 80,
      height: 80,
      child: CustomPaint(
        painter: _ScoreRingPainter(score: safeScore),
        child: Center(
          child: Text(
            '$safeScore',
            style: const TextStyle(
              fontFamily: 'Syne',
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStreakCard(int days) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.glowCard,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Text(
                'WEEKLY',
                style: TextStyle(
                  fontFamily: 'Space Mono',
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                  letterSpacing: 0.8,
                ),
              ),
              SizedBox(width: 4),
              Text('🔥', style: TextStyle(fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '$days',
            style: const TextStyle(
              fontFamily: 'Syne',
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Active days',
            style: TextStyle(
              fontSize: 11,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 12),
          _buildWeekIndicator(days),
        ],
      ),
    );
  }

  Widget _buildWeekIndicator(int activeDays) {
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(7, (index) {
        final isActive = index < math.min(activeDays, 7);
        return Column(
          children: [
            Text(
              dayLabels[index],
              style: TextStyle(
                fontSize: 9,
                color: isActive ? AppColors.neon : AppColors.textDim,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Container(
              width: 4,
              height: 4,
              decoration: BoxDecoration(
                color: isActive ? AppColors.neon : AppColors.border,
                shape: BoxShape.circle,
              ),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildWorkoutCard(WorkoutPlan? plan) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.glowCard,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "TODAY'S WORKOUT",
                  style: TextStyle(
                    fontFamily: 'Space Mono',
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textMuted,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  plan?.name ?? 'Upper Body Strength',
                  style: const TextStyle(
                    fontFamily: 'Syne',
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  plan != null
                      ? "Your trainer's assigned program"
                      : 'Chest, Shoulders, Triceps',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const WorkoutSetupScreen(),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.neon,
                    foregroundColor: AppColors.bg,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        '▶',
                        style: TextStyle(fontSize: 12),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        plan != null ? 'View Plan ›' : 'Start Workout ›',
                        style: const TextStyle(
                          fontFamily: 'Syne',
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Text(
                '💪',
                style: TextStyle(fontSize: 40),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCoachCard() {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(AppRadius.xl),
      child: InkWell(
        onTap: () {
          // Navigate to trainer
        },
        borderRadius: BorderRadius.circular(AppRadius.xl),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(AppRadius.xl),
            boxShadow: AppShadows.glowCard,
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.surfaceAlt,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Text('▣', style: TextStyle(fontSize: 24)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'YOUR COACH',
                      style: TextStyle(
                        fontFamily: 'Space Mono',
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textMuted,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _trainer?.name ?? 'Find a trainer',
                      style: const TextStyle(
                        fontFamily: 'Syne',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _trainer != null
                          ? 'View your coaching relationship'
                          : 'Get personalized support',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: AppColors.textMuted,
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAIInsightCard(DashboardStats stats) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.glowCard,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AI COACH INSIGHT',
                  style: TextStyle(
                    fontFamily: 'Space Mono',
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textMuted,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your progress, explained.',
                  style: TextStyle(
                    fontFamily: 'Syne',
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  stats.averageForm > 0
                      ? 'Your average form score is ${stats.averageForm}%. Keep building consistent reps.'
                      : 'Ask your AI coach about training, recovery, or posture.',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMuted,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 14),
                GestureDetector(
                  onTap: () {
                    // Navigate to AI insight
                  },
                  child: const Text(
                    'View insight ›',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.neon,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Center(
              child: Text('🤖', style: TextStyle(fontSize: 32)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontFamily: 'Syne',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionButton(
                icon: '🏋️',
                label: 'Start Workout',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const WorkoutSetupScreen(),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionButton(
                icon: '📷',
                label: 'Posture Scan',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Posture assessment coming soon!'),
                      backgroundColor: AppColors.neon,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionButton(
                icon: '📋',
                label: 'View Plan',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Workout plan details coming soon!'),
                      backgroundColor: AppColors.neon,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionButton({
    required String icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: [
              Text(icon, style: const TextStyle(fontSize: 28)),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExtraStats(DashboardStats stats) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.glowCard,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatColumn('🏆', '${stats.totalSessions}', 'Sets Logged'),
          Container(
            width: 1,
            height: 40,
            color: AppColors.border,
          ),
          _buildStatColumn(
            '◷',
            stats.averageForm > 0 ? '${stats.averageForm}' : '—',
            'Form Score',
          ),
          Container(
            width: 1,
            height: 40,
            color: AppColors.border,
          ),
          _buildStatColumn('⚖', '${stats.volume}', 'Volume kg'),
        ],
      ),
    );
  }

  Widget _buildStatColumn(String icon, String value, String label) {
    return Column(
      children: [
        Text(icon, style: const TextStyle(fontSize: 20)),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            fontFamily: 'Syne',
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: AppColors.textMuted,
          ),
        ),
      ],
    );
  }

  Widget _buildProgressBar(WorkoutPlan? plan) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.glowCard,
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Program Completion',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textMuted,
                ),
              ),
              Text(
                plan != null ? 'Active' : 'Start today',
                style: const TextStyle(
                  fontFamily: 'Syne',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: plan != null ? 0.68 : 0.0,
              backgroundColor: AppColors.border,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.neon),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }
}

// Custom painter for score ring
class _ScoreRingPainter extends CustomPainter {
  final int score;

  _ScoreRingPainter({required this.score});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 4;
    
    // Background circle
    final bgPaint = Paint()
      ..color = AppColors.border
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6;
    canvas.drawCircle(center, radius, bgPaint);
    
    // Progress arc
    final progressPaint = Paint()
      ..color = AppColors.neon
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;
    
    const startAngle = -math.pi / 2;
    final sweepAngle = (score / 100) * 2 * math.pi;
    
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(_ScoreRingPainter oldDelegate) {
    return oldDelegate.score != score;
  }
}

// Data class for stats
class DashboardStats {
  final int postureScore;
  final int totalSessions;
  final int workoutDays;
  final int averageForm;
  final int volume;

  DashboardStats({
    required this.postureScore,
    required this.totalSessions,
    required this.workoutDays,
    required this.averageForm,
    required this.volume,
  });
}
