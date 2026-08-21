import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class TrainerAssessmentReportScreen extends StatefulWidget {
  const TrainerAssessmentReportScreen({super.key, required this.assessmentId});
  final String assessmentId;

  @override
  State<TrainerAssessmentReportScreen> createState() =>
      _TrainerAssessmentReportScreenState();
}

class _TrainerAssessmentReportScreenState extends State<TrainerAssessmentReportScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient().get<Map<String, dynamic>>(
        '/trainer/assessments/${widget.assessmentId}');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Assessment report',
              style: TextStyle(color: AppColors.textPrimary)),
        ),
        body: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(
                  child: CircularProgressIndicator(color: AppColors.neon));
            }
            if (snapshot.hasError) {
              return Center(
                  child: OutlinedButton(
                      onPressed: () => setState(() => _future = ApiClient()
                          .get<Map<String, dynamic>>('/trainer/assessments/${widget.assessmentId}')),
                      child: const Text('Unable to load report. Retry')));
            }
            final report = Map<String, dynamic>.from(
                snapshot.data?['assessment'] as Map? ?? const {});
            final client = Map<String, dynamic>.from(
                snapshot.data?['client'] as Map? ?? const {});
            final findings = report['findings'] as List? ?? [];
            final recommendations = report['recommendations'] as Map? ?? const {};
            return ListView(padding: const EdgeInsets.all(20), children: [
              Text(client['name']?.toString() ?? 'Client assessment',
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 16),
              _card('Composite alignment score',
                  '${report['overallScore'] ?? 0}/100'),
              const SizedBox(height: 16),
              _section('Findings', findings.isEmpty ? ['No findings recorded.'] : findings),
              const SizedBox(height: 16),
              _section('Avoid', recommendations['avoid'] as List? ?? const ['Nothing flagged.']),
              const SizedBox(height: 16),
              _section('Focus on', recommendations['focusOn'] as List? ?? const ['No focus areas recorded.']),
            ]);
          },
        ),
      );

  Widget _card(String label, String value) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
            color: AppColors.surface, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label.toUpperCase(),
              style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          const SizedBox(height: 8),
          Text(value,
              style: const TextStyle(
                  color: AppColors.neon,
                  fontSize: 30,
                  fontWeight: FontWeight.w800)),
        ]),
      );

  Widget _section(String title, List values) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
            color: AppColors.surface, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          ...values.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text('• $item',
                  style: const TextStyle(color: AppColors.textMuted)))),
        ]),
      );
}
