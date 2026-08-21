import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class QnaScreen extends StatefulWidget {
  const QnaScreen({super.key});

  @override
  State<QnaScreen> createState() => _QnaScreenState();
}

class _QnaScreenState extends State<QnaScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient().get<Map<String, dynamic>>('/questions');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('RepUps Q&A',
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
                      onPressed: () => setState(() =>
                          _future = ApiClient().get<Map<String, dynamic>>('/questions')),
                      child: const Text('Unable to load questions. Retry')));
            }
            final questions = snapshot.data?['questions'] as List? ?? [];
            final newCount = questions.whereType<Map>().where((question) =>
                question['answer'] == null && (question['replies'] ?? 0) == 0).length;
            if (questions.isEmpty) {
              return const Center(
                  child: Text('No questions yet.',
                      style: TextStyle(color: AppColors.textMuted)));
            }
            return RefreshIndicator(
              onRefresh: () async => setState(() =>
                  _future = ApiClient().get<Map<String, dynamic>>('/questions')),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(children: [
                    const Expanded(
                        child: Text('Questions matched to your specializations',
                            style: TextStyle(color: AppColors.textMuted))),
                    if (newCount > 0)
                      Chip(label: Text('$newCount new')),
                  ]),
                  const SizedBox(height: 12),
                  ...questions.whereType<Map>().map(_questionCard),
                ],
              ),
            );
          },
        ),
      );

  Widget _questionCard(Map raw) {
    final question = Map<String, dynamic>.from(raw);
    final tags = question['tags'] as List? ?? const [];
    final replies = question['replies'] ?? 0;
    return Card(
      color: AppColors.surface,
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            CircleAvatar(
                backgroundColor: AppColors.neonDeep,
                child: Text(_initials(question['authorName']?.toString() ?? ''),
                    style: const TextStyle(color: AppColors.textPrimary))),
            const SizedBox(width: 10),
            Expanded(
                child: Text(question['authorName']?.toString() ?? 'Anonymous',
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700))),
            Text('$replies ${replies == 1 ? 'reply' : 'replies'}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ]),
          const SizedBox(height: 12),
          Text(question['question']?.toString() ?? '',
              style: const TextStyle(color: AppColors.textPrimary, height: 1.35)),
          if (tags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
                spacing: 6,
                children: tags
                    .map((tag) => Chip(
                        label: Text(tag.toString()),
                        labelStyle: const TextStyle(fontSize: 11)))
                    .toList()),
          ],
          if (question['answer'] != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                  color: AppColors.surfaceAlt,
                  borderRadius: BorderRadius.circular(10)),
              child: Text('AI response\n${question['answer']}',
                  style: const TextStyle(color: AppColors.textMuted)),
            ),
          ],
        ]),
      ),
    );
  }

  String _initials(String name) {
    final value = name
        .split(' ')
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0].toUpperCase())
        .join();
    return value.isEmpty ? '?' : value;
  }
}
