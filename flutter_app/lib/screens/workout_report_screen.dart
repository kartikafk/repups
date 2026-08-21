import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class WorkoutReportScreen extends StatefulWidget {
  const WorkoutReportScreen({super.key});

  @override
  State<WorkoutReportScreen> createState() => _WorkoutReportScreenState();
}

class _WorkoutReportScreenState extends State<WorkoutReportScreen> {
  bool _saving = false;
  String? _state;

  Map<String, dynamic> get _report {
    final extra = GoRouterState.of(context).extra;
    return extra is Map
        ? Map<String, dynamic>.from(extra)
        : <String, dynamic>{};
  }

  Future<void> _save() async {
    if (_report.isEmpty || _saving) return;
    setState(() {
      _saving = true;
      _state = null;
    });
    try {
      await ApiClient().saveSession(_report);
      if (mounted) setState(() => _state = 'Saved to workout history');
    } catch (_) {
      if (mounted) setState(() => _state = 'Unable to save this workout.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _save());
  }

  @override
  Widget build(BuildContext context) {
    final report = _report;
    final reps = report['repCount'] ??
        (report['reps'] is List ? (report['reps'] as List).length : '-');
    final score = report['avgScore'] ?? report['formScore'] ?? '-';
    final weight = num.tryParse(report['weight']?.toString() ?? '');
    final repCount = num.tryParse(reps.toString());
    final volume = weight != null && repCount != null
        ? '${(weight * repCount).round()} kg'
        : '-';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        leading: IconButton(
          onPressed: () => context.go('/dashboard'),
          icon: const Icon(Icons.close),
        ),
        title: const Text('Workout Complete',
            style: TextStyle(color: AppColors.textPrimary)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Center(
              child: Text('Great work!',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 28,
                      fontWeight: FontWeight.w800))),
          const SizedBox(height: 8),
          Center(
              child: Text(report['exercise']?.toString() ?? 'Workout set',
                  style: const TextStyle(color: AppColors.textMuted))),
          const SizedBox(height: 26),
          Row(children: [
            _Metric('Total volume', volume),
            const SizedBox(width: 10),
            _Metric('Reps tracked', reps.toString()),
          ]),
          const SizedBox(height: 12),
          Card(
            color: AppColors.surface,
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Set summary',
                      style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 18)),
                  const SizedBox(height: 12),
                  _row('Weight', weight == null ? '-' : '$weight kg'),
                  _row('Form score', score.toString()),
                  _row('Average ROM',
                      report['avgRom'] == null ? '-' : '${report['avgRom']}°'),
                  _row('Tempo', report['avgTempo']?.toString() ?? '-'),
                ],
              ),
            ),
          ),
          if (_state != null)
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: Text(_state!,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: _state!.startsWith('Saved')
                          ? AppColors.success
                          : AppColors.error)),
            ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? 'Saving...' : 'Save set'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
              onPressed: () => context.go('/session'),
              child: const Text('Keep training')),
        ],
      ),
    );
  }

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child:
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: const TextStyle(color: AppColors.textMuted)),
          Text(value,
              style: const TextStyle(
                  color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
        ]),
      );
}

class _Metric extends StatelessWidget {
  const _Metric(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14)),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label.toUpperCase(),
                style:
                    const TextStyle(color: AppColors.textMuted, fontSize: 10)),
            const SizedBox(height: 5),
            Text(value,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w800)),
          ]),
        ),
      );
}
