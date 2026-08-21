import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

class ChallengeInboxScreen extends ConsumerWidget {
  const ChallengeInboxScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = ref.watch(currentUserProvider)?.id;
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        leading: IconButton(
            onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)),
        title: const Text('Challenge Inbox',
            style: TextStyle(color: AppColors.textPrimary)),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: id == null
            ? Future.value(<String, dynamic>{})
            : ApiClient().getFriendChallenges(id),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(
                child: CircularProgressIndicator(color: AppColors.neon));
          }
          final items = snapshot.data?['challenges'] as List<dynamic>? ?? [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: items.whereType<Map>().map((item) {
              return Card(
                color: AppColors.surface,
                child: ListTile(
                  title: Text(item['exercise']?.toString() ?? 'Challenge',
                      style: const TextStyle(color: AppColors.textPrimary)),
                  subtitle: Text('Target: ${item['target'] ?? '-'}',
                      style: const TextStyle(color: AppColors.textMuted)),
                ),
              );
            }).toList(),
          );
        },
      ),
    );
  }
}
