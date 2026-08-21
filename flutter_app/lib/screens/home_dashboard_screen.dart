import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'dart:math' as math;
import '../theme/app_colors.dart';
import '../services/api_client.dart';
import '../widgets/bottom_nav.dart';

class HomeDashboardScreen extends StatefulWidget {
  const HomeDashboardScreen({Key? key}) : super(key: key);

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  final ApiClient _api = ApiClient();
  
  Map<String, dynamic>? _user;
  List<dynamic> _sessions = [];
  Map<String, dynamic>? _posture;
  List<dynamic> _plans = [];
  Map<String, dynamic>? _trainer;
  String _error = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    try {
      setState(() => _loading = true);
      
      // Load user data first
      final userData = await _api.getCurrentUser();
      if (!mounted) return;
      
      setState(() => _user = userData['user']);
      
      final userId = userData['user']?['_id'] ?? userData['user']?['id'];
      
      // Load all dashboard data in parallel
      final results = await Future.wait([
        _api.getSessions(limit: 100).catchError((e) => <dynamic>[]),
        _api.getMyWorkoutPlans().catchError((e) => {'plans': <dynamic>[]}),
        userId != null ? _api.getLatestPosture(userId).catchError((e) => {'record': null}) : Future.value({'record': null}),
        _api.getTrainerRequests().catchError((e) => {'requests': <dynamic>[]}),
      ], eagerError: false);
      
      if (!mounted) return;
      
      setState(() {
        _sessions = results[0] is List ? (results[0] as List) : <dynamic>[];
        _plans = (results[1] as Map)['plans'] ?? <dynamic>[];
        _posture = (results[2] as Map)['record'];
        final requests = (results[3] as Map)['requests'] ?? <dynamic>[];
        
        _trainer = (requests as List).cast<Map<String, dynamic>>().firstWhere(
          (request) => request['status'] == 'accepted',
          orElse: () => <String, dynamic>{},
        )['trainer'];
        
        _loading = false;
        _error = '';
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }
  Map<String, dynamic> get _stats {
    final formScores = _sessions.map((item) => double.tryParse(item['avgScore']?.toString() ?? '0') ?? 0)
        .where((score) => score.isFinite && score > 0).toList();
    final workoutDays = _sessions.map((item) => item['date']).where((d) => d != null).toSet();
    final volume = _sessions.fold<double>(0.0, (sum, item) => 
        sum + ((double.tryParse(item['weight']?.toString() ?? '0') ?? 0) * 
               (double.tryParse(item['repCount']?.toString() ?? '0') ?? 0)));
    
    return {
      'posture': ((double.tryParse(_posture?['overallScore']?.toString() ?? '0') ?? 0)).round(),
      'sessions': _sessions.length,
      'workoutDays': workoutDays.length,
      'averageForm': formScores.isNotEmpty ? (formScores.reduce((a, b) => a + b) / formScores.length).round() : 0,
      'volume': volume.round(),
    };
  }

  String get _firstName => (_user?['name']?.toString().split(' ').first) ?? 'Athlete';

  @override
  Widget build(BuildContext context) {
    if (_error.isNotEmpty) {
      return Scaffold(
        backgroundColor: AppColors.bg,
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(_error, style: const TextStyle(color: AppColors.error)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadDashboardData,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_user == null) {
      return Scaffold(
        backgroundColor: AppColors.bg,
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                CircularProgressIndicator(color: AppColors.neon),
                SizedBox(height: 16),
                Text(
                  'Loading your performance hub…',
                  style: TextStyle(color: AppColors.textPrimary),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final stats = _stats;
    final plan = _plans.isNotEmpty ? _plans[0] : null;

    return Scaffold(
      backgroundColor: AppColors.bg,
      bottomNavigationBar: const BottomNav(currentIndex: 0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildWelcome(),
              const SizedBox(height: 32),
              _buildTopStats(stats),
              const SizedBox(height: 20),
              _buildWorkoutCard(plan),
              const SizedBox(height: 16),
              _buildCoachCard(),
              const SizedBox(height: 16),
              _buildAIInsightCard(stats),
              const SizedBox(height: 20),
              _buildQuickActions(),
              const SizedBox(height: 20),
              _buildExtraStats(stats),
              const SizedBox(height: 16),
              _buildProgressBar(plan),
              const SizedBox(height: 100), // Bottom nav spacing
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
            text: 'Rep',
            style: TextStyle(
              fontFamily: 'Syne',
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
            children: [
              TextSpan(
                text: 'Ups',
                style: TextStyle(color: AppColors.neon),
              ),
            ],
          ),
        ),
        Row(
          children: [
            _buildIconButton(
              icon: '♢',
              onTap: () => context.go('/client/notifications'),
            ),
            const SizedBox(width: 12),
            _buildAvatar(),
          ],
        ),
      ],
    );
  }

  Widget _buildIconButton({required String icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Text(
            icon,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 18),
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    return GestureDetector(
      onTap: () => context.go('/client/profile'),
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: _user?['photoUrl'] != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: Image.network(_user!['photoUrl'], fit: BoxFit.cover),
              )
            : Center(
                child: Text(
                  (_user?['name']?.toString() ?? '')
                      .split(' ')
                      .where((part) => part.isNotEmpty)
                      .take(2)
                      .map((part) => part[0].toUpperCase())
                      .join(),
                  style: const TextStyle(
                    color: AppColors.neon,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
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
              'Hey $_firstName ',
              style: const TextStyle(
                fontFamily: 'Syne',
                fontSize: 32,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const Text('✦', style: TextStyle(fontSize: 24, color: AppColors.neon)),
          ],
        ),
        const SizedBox(height: 8),
        const Text(
          'Let\'s crush your goals today.',
          style: TextStyle(fontSize: 16, color: AppColors.textMuted),
        ),
      ],
    );
  }

  Widget _buildTopStats(Map<String, dynamic> stats) {
    return Row(
      children: [
        Expanded(child: _buildPostureCard(stats['posture'])),
        const SizedBox(width: 12),
        Expanded(child: _buildStreakCard(stats['workoutDays'])),
      ],
    );
  }

  Widget _buildPostureCard(int score) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppShadows.glowCard,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('POSTURE SCORE', style: TextStyle(
                  fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1)),
                const SizedBox(height: 16),
                RichText(text: TextSpan(
                  text: '$score', style: const TextStyle(
                    fontFamily: 'Syne', fontSize: 32, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  children: const [TextSpan(text: '/100', style: TextStyle(fontSize: 14, color: AppColors.textMuted))],
                )),
                const SizedBox(height: 8),
                Text(score >= 70 ? 'Good' : score > 0 ? 'Keep improving' : 'No scan yet',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.neon)),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () => context.go('/client/assessments'),
                  child: const Text('View assessment →', 
                    style: TextStyle(fontSize: 11, color: AppColors.neonDeep, decoration: TextDecoration.underline)),
                ),
              ],
            ),
          ),
          _buildScoreRing(score),
        ],
      ),
    );
  }

  Widget _buildScoreRing(int score) {
    return SizedBox(width: 64, height: 64, child: CustomPaint(
      painter: _ScoreRingPainter(score: score),
      child: Center(child: Text('$score', style: const TextStyle(
        fontFamily: 'Syne', fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary))),
    ));
  }
  Widget _buildStreakCard(int days) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppShadows.glowCard,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Text('WEEKLY ', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.8)),
              Text('🔥', style: TextStyle(fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Text('$days', style: const TextStyle(fontFamily: 'Syne', fontSize: 32, fontWeight: FontWeight.w800, color: AppColors.textPrimary, height: 1)),
          const SizedBox(height: 4),
          const Text('Active days', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
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
            Text(dayLabels[index], style: TextStyle(
              fontSize: 9, color: isActive ? AppColors.neon : AppColors.textDim, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Container(width: 4, height: 4, decoration: BoxDecoration(
              color: isActive ? AppColors.neon : AppColors.border, shape: BoxShape.circle)),
          ],
        );
      }),
    );
  }

  Widget _buildWorkoutCard(dynamic plan) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppShadows.glowCard,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("TODAY'S WORKOUT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.8)),
                const SizedBox(height: 8),
                Text(plan?['name'] ?? 'Upper Body Strength', style: const TextStyle(fontFamily: 'Syne', fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                const SizedBox(height: 6),
                Text(plan != null ? "Your trainer's assigned program" : 'Chest, Shoulders, Triceps', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => context.go(plan != null ? '/client/workout-plan' : '/session'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.neon, foregroundColor: AppColors.bg,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Text('▶', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 8),
                    Text(plan != null ? 'View Plan ›' : 'Start Workout ›', style: const TextStyle(fontFamily: 'Syne', fontSize: 14, fontWeight: FontWeight.w700)),
                  ]),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(width: 80, height: 80, decoration: BoxDecoration(color: AppColors.surfaceAlt, borderRadius: BorderRadius.circular(16)),
            child: const Center(child: Text('💪', style: TextStyle(fontSize: 40)))),
        ],
      ),
    );
  }
  Widget _buildCoachCard() {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: () => context.go(_trainer != null ? '/client/my-trainer' : '/client/trainers'),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(20), boxShadow: AppShadows.glowCard),
          child: Row(
            children: [
              Container(width: 48, height: 48, decoration: BoxDecoration(color: AppColors.surfaceAlt, borderRadius: BorderRadius.circular(12)),
                child: const Center(child: Text('▣', style: TextStyle(fontSize: 24)))),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('YOUR COACH', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.8)),
                    const SizedBox(height: 4),
                    Text(_trainer?['name'] ?? 'Find a trainer', style: const TextStyle(fontFamily: 'Syne', fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    const SizedBox(height: 2),
                    Text(_trainer != null ? 'View your coaching relationship' : 'Get personalized support', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAIInsightCard(Map<String, dynamic> stats) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(20), boxShadow: AppShadows.glowCard),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('AI COACH INSIGHT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.8)),
                const SizedBox(height: 8),
                const Text('Your progress, explained.', style: TextStyle(fontFamily: 'Syne', fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                Text(stats['averageForm'] > 0 ? 'Your average form score is ${stats['averageForm']}%. Keep building consistent reps.' : 'Ask your AI coach about training, recovery, or posture.',
                  style: const TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4)),
                const SizedBox(height: 14),
                GestureDetector(onTap: () => context.go('/ai-coach-insight'),
                  child: const Text('View insight ›', style: TextStyle(fontSize: 13, color: AppColors.neon, fontWeight: FontWeight.w600))),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(width: 60, height: 60, decoration: BoxDecoration(color: AppColors.surfaceAlt, borderRadius: BorderRadius.circular(14)),
            child: const Center(child: Text('🤖', style: TextStyle(fontSize: 32)))),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Quick Actions', style: TextStyle(fontFamily: 'Syne', fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildQuickActionButton(icon: '🏋️', label: 'Start Workout', onTap: () => context.go('/session'))),
            const SizedBox(width: 12),
            Expanded(child: _buildQuickActionButton(icon: '📷', label: 'Posture Scan', onTap: () => context.go('/posture-assessment'))),
            const SizedBox(width: 12),
            Expanded(child: _buildQuickActionButton(icon: '📋', label: 'View Plan', onTap: () => context.go('/client/workout-plan'))),
          ],
        ),
      ],
    );
  }
  Widget _buildQuickActionButton({required String icon, required String label, required VoidCallback onTap}) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(14)),
          child: Column(children: [
            Text(icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
          ]),
        ),
      ),
    );
  }

  Widget _buildExtraStats(Map<String, dynamic> stats) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(20), boxShadow: AppShadows.glowCard),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatColumn('🏆', '${stats['sessions']}', 'Sets Logged'),
          _buildStatColumn('◷', stats['averageForm'] > 0 ? '${stats['averageForm']}' : '—', 'Form Score'),
          _buildStatColumn('⚖', '${stats['volume']}', 'Volume kg'),
        ],
      ),
    );
  }

  Widget _buildStatColumn(String emoji, String value, String label) {
    return Column(children: [
      Text(emoji, style: const TextStyle(fontSize: 16)),
      const SizedBox(height: 4),
      Text(value, style: const TextStyle(fontFamily: 'Syne', fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
      const SizedBox(height: 4),
      Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
    ]);
  }

  Widget _buildProgressBar(dynamic plan) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(20), boxShadow: AppShadows.glowCard),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Program Completion', style: TextStyle(fontSize: 14, color: AppColors.textMuted)),
              Text(plan != null ? 'Active' : 'Start today', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity, height: 6,
            decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(3)),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: plan != null ? 0.68 : 0.0,
              child: Container(decoration: BoxDecoration(color: AppColors.neon, borderRadius: BorderRadius.circular(3))),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScoreRingPainter extends CustomPainter {
  final int score;
  _ScoreRingPainter({required this.score});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 4;
    final paint = Paint()..strokeWidth = 4..style = PaintingStyle.stroke;

    // Background circle
    paint.color = AppColors.border;
    canvas.drawCircle(center, radius, paint);

    // Progress arc
    paint.color = AppColors.neon;
    paint.strokeCap = StrokeCap.round;
    final sweepAngle = (score / 100) * 2 * math.pi;
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -math.pi / 2, sweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
