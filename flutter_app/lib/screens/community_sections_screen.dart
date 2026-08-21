import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

enum CommunitySection { leaderboard, challenges }

class CommunitySectionsScreen extends StatefulWidget {
  const CommunitySectionsScreen({super.key, required this.section});
  final CommunitySection section;
  @override State<CommunitySectionsScreen> createState() => _CommunitySectionsScreenState();
}
class _CommunitySectionsScreenState extends State<CommunitySectionsScreen> {
  final _api = ApiClient(); late Future<Map<String, dynamic>> _future;
  @override void initState() { super.initState(); _future = widget.section == CommunitySection.leaderboard ? _api.getCommunityLeaderboard() : _api.getCommunityChallenges(); }
  @override Widget build(BuildContext context) { final leaderboard = widget.section == CommunitySection.leaderboard; return Scaffold(backgroundColor: AppColors.bg, appBar: AppBar(backgroundColor: AppColors.bg, leading: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)), title: Text(leaderboard ? 'Leaderboard' : 'Challenges', style: const TextStyle(color: AppColors.textPrimary))), body: FutureBuilder<Map<String, dynamic>>(future: _future, builder: (context, snapshot) { if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator(color: AppColors.neon)); if (snapshot.hasError) return const Center(child: Text('Unable to load this section.', style: TextStyle(color: AppColors.textMuted))); final items = (snapshot.data?[leaderboard ? 'leaderboard' : 'challenges'] as List<dynamic>?) ?? []; return ListView(padding: const EdgeInsets.all(16), children: [if (!leaderboard) Align(alignment: Alignment.centerRight, child: OutlinedButton(onPressed: () => context.go('/community/challenge-friend'), child: const Text('Challenge a friend'))), if (items.isEmpty) const Padding(padding: EdgeInsets.all(32), child: Center(child: Text('Nothing to show yet.', style: TextStyle(color: AppColors.textMuted)))), ...items.whereType<Map>().toList().asMap().entries.map((entry) { final item = entry.value; final title = item['name'] ?? item['title'] ?? item['exercise'] ?? 'Community item'; final subtitle = leaderboard ? '${item['xp'] ?? item['points'] ?? 0} points' : item['description'] ?? item['message'] ?? ''; return Card(color: AppColors.surface, child: ListTile(leading: leaderboard ? CircleAvatar(backgroundColor: AppColors.neonDeep, child: Text('${entry.key + 1}')) : const Icon(Icons.bolt, color: AppColors.neon), title: Text(title.toString(), style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)), subtitle: Text(subtitle.toString(), style: const TextStyle(color: AppColors.textMuted)))); })]); })); }
}
