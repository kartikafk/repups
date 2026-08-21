import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/bottom_nav.dart';

class TrainerListScreen extends StatefulWidget {
  const TrainerListScreen({super.key});
  @override
  State<TrainerListScreen> createState() => _TrainerListScreenState();
}

class _TrainerListScreenState extends State<TrainerListScreen> {
  final _api = ApiClient();
  final _search = TextEditingController();
  late Future<Map<String, dynamic>> _future;
  @override
  void initState() {
    super.initState();
    _future = _api.getClientTrainers();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _load() => setState(
      () => _future = _api.getClientTrainers(query: _search.text.trim()));
  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: AppColors.bg,
      bottomNavigationBar: const BottomNav(currentIndex: 4),
      body: SafeArea(
          child: FutureBuilder<Map<String, dynamic>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done)
                  return const Center(
                      child: CircularProgressIndicator(color: AppColors.neon));
                final trainers =
                    snapshot.data?['trainers'] as List<dynamic>? ?? [];
                return ListView(padding: const EdgeInsets.all(20), children: [
                  const Text('Find a Trainer',
                      style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 28,
                          fontWeight: FontWeight.w800)),
                  TextField(
                      controller: _search,
                      onSubmitted: (_) => _load(),
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: InputDecoration(
                          hintText: 'Search',
                          suffixIcon: IconButton(
                              onPressed: _load,
                              icon: const Icon(Icons.search)))),
                  const SizedBox(height: 12),
                  ...trainers.whereType<Map>().map((trainer) {
                    final id = trainer['_id'] ?? trainer['id'];
                    return Card(
                        color: AppColors.surface,
                        child: ListTile(
                            onTap: id == null
                                ? null
                                : () => context.go('/client/trainers/$id'),
                            title: Text(
                                trainer['name']?.toString() ?? 'Trainer',
                                style: const TextStyle(
                                    color: AppColors.textPrimary)),
                            subtitle: Text(
                                (trainer['specializations'] ??
                                        trainer['specialties'] ??
                                        [])
                                    .toString(),
                                style: const TextStyle(
                                    color: AppColors.textMuted)),
                            trailing: const Icon(Icons.chevron_right,
                                color: AppColors.neon)));
                  })
                ]);
              })));
}
