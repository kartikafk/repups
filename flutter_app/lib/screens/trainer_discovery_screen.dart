import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

/// FindTrainerPage.jsx equivalent using the existing nearby-trainers API.
class TrainerDiscoveryScreen extends StatefulWidget {
  const TrainerDiscoveryScreen({super.key});
  @override
  State<TrainerDiscoveryScreen> createState() => _TrainerDiscoveryScreenState();
}

class _TrainerDiscoveryScreenState extends State<TrainerDiscoveryScreen> {
  final _api = ApiClient();
  late Future<Map<String, dynamic>> _future;
  @override
  void initState() {
    super.initState();
    _future = _api.getNearbyTrainers();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Find a Trainer',
              style: TextStyle(color: AppColors.textPrimary))),
      body: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done)
              return const Center(
                  child: CircularProgressIndicator(color: AppColors.neon));
            if (snapshot.hasError)
              return Center(
                  child: OutlinedButton(
                      onPressed: () =>
                          setState(() => _future = _api.getNearbyTrainers()),
                      child: const Text('Retry')));
            final trainers = snapshot.data?['trainers'] as List<dynamic>? ?? [];
            return ListView(padding: const EdgeInsets.all(20), children: [
              const Text('Coaches near you',
                  style: TextStyle(color: AppColors.textMuted)),
              const SizedBox(height: 12),
              if (trainers.isEmpty)
                const Center(
                    child: Padding(
                        padding: EdgeInsets.all(32),
                        child: Text('No nearby trainers found.',
                            style: TextStyle(color: AppColors.textMuted)))),
              ...trainers.whereType<Map>().map((trainer) {
                final id = trainer['_id'] ?? trainer['id'];
                return Card(
                    color: AppColors.surface,
                    child: ListTile(
                        onTap: id == null
                            ? null
                            : () => context.go('/client/trainers/$id'),
                        title: Text(trainer['name']?.toString() ?? 'Trainer',
                            style:
                                const TextStyle(color: AppColors.textPrimary)),
                        subtitle: Text(
                            trainer['gym']?.toString() ??
                                trainer['location']?.toString() ??
                                '',
                            style: const TextStyle(color: AppColors.textMuted)),
                        trailing: const Icon(Icons.chevron_right,
                            color: AppColors.neon)));
              })
            ]);
          }));
}
