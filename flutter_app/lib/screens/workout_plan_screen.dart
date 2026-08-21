import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

class WorkoutPlanScreen extends StatefulWidget {
  const WorkoutPlanScreen({super.key});
  @override
  State<WorkoutPlanScreen> createState() => _WorkoutPlanScreenState();
}

class _WorkoutPlanScreenState extends State<WorkoutPlanScreen> {
  final _api = ApiClient();
  late Future<Map<String, dynamic>> _future;
  @override
  void initState() {
    super.initState();
    _future = _api.getMyWorkoutPlans();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
          backgroundColor: AppColors.bg,
          leading: IconButton(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back)),
          title: const Text('Workout Plan',
              style: TextStyle(color: AppColors.textPrimary))),
      body: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done)
              return const Center(
                  child: CircularProgressIndicator(color: AppColors.neon));
            final plans = snapshot.data?['plans'] as List<dynamic>? ?? [];
            return ListView(padding: const EdgeInsets.all(20), children: [
              const Text('Assigned by your trainer',
                  style: TextStyle(color: AppColors.textMuted)),
              const SizedBox(height: 16),
              ...plans.whereType<Map>().map(_plan)
            ]);
          }));
  Widget _plan(Map plan) {
    final days = plan['days'] as List<dynamic>? ?? [];
    return Card(
        color: AppColors.surface,
        child: Padding(
            padding: const EdgeInsets.all(16),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(plan['name']?.toString() ?? 'Workout plan',
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 19)),
              if (plan['description'] != null)
                Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(plan['description'].toString(),
                        style: const TextStyle(color: AppColors.textMuted))),
              ...days.asMap().entries.map((entry) {
                final day = entry.value as Map? ?? const {};
                return ExpansionTile(
                    title: Text(
                        day['label']?.toString() ?? 'Day ${entry.key + 1}',
                        style: const TextStyle(color: AppColors.textPrimary)),
                    children: (day['exercises'] as List<dynamic>? ?? [])
                        .whereType<Map>()
                        .map((exercise) => ListTile(
                            title: Text(
                                exercise['name']?.toString() ?? 'Exercise',
                                style: const TextStyle(
                                    color: AppColors.textPrimary)),
                            trailing: Text(
                                '${exercise['sets'] ?? '-'} x ${exercise['reps'] ?? '-'}',
                                style: const TextStyle(color: AppColors.neon))))
                        .toList());
              })
            ])));
  }
}
