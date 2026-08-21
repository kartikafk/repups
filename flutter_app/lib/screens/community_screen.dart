import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/bottom_nav.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});
  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final _api = ApiClient();
  late Future<Map<String, dynamic>> _feed;
  @override
  void initState() {
    super.initState();
    _feed = _api.getCommunityFeed();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.bg,
        bottomNavigationBar: const BottomNav(currentIndex: 1),
        body: SafeArea(
            child: FutureBuilder<Map<String, dynamic>>(
          future: _feed,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done)
              return const Center(
                  child: CircularProgressIndicator(color: AppColors.neon));
            if (snapshot.hasError)
              return Center(
                  child: OutlinedButton(
                      onPressed: () =>
                          setState(() => _feed = _api.getCommunityFeed()),
                      child: const Text('Retry')));
            final posts = snapshot.data?['posts'] as List<dynamic>? ?? [];
            return ListView(padding: const EdgeInsets.all(20), children: [
              Row(children: [
                const Expanded(
                    child: Text('Community',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 28,
                            fontWeight: FontWeight.w800))),
                IconButton(
                    onPressed: () => context.go('/community/leaderboard'),
                    icon: const Icon(Icons.emoji_events_outlined,
                        color: AppColors.neon)),
                IconButton(
                    onPressed: () => context.go('/community/challenges'),
                    icon:
                        const Icon(Icons.bolt_outlined, color: AppColors.neon)),
              ]),
              const Text('Train together. Stay accountable.',
                  style: TextStyle(color: AppColors.textMuted)),
              const SizedBox(height: 16),
              if (posts.isEmpty)
                const Center(
                    child: Padding(
                        padding: EdgeInsets.all(32),
                        child: Text('No posts yet.',
                            style: TextStyle(color: AppColors.textMuted)))),
              ...posts.whereType<Map>().map(_post),
            ]);
          },
        )),
      );
  Widget _post(Map post) {
    final author = post['author'] as Map? ?? const {};
    final name = author['name'] ?? post['authorName'] ?? 'RepUps athlete';
    final text = post['content'] ?? post['text'] ?? post['caption'] ?? '';
    return Card(
        color: AppColors.surface,
        child: Padding(
            padding: const EdgeInsets.all(14),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name.toString(),
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(text.toString(),
                  style: const TextStyle(color: AppColors.textMuted))
            ])));
  }
}
