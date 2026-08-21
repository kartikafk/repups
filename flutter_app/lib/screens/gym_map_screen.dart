import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

/// The React app presents a provider-independent map fallback.  This native
/// equivalent keeps the same useful behaviour: show available gyms and let a
/// user open any gym's details without requiring a map-provider key.
class GymMapScreen extends StatefulWidget {
  const GymMapScreen({super.key});

  @override
  State<GymMapScreen> createState() => _GymMapScreenState();
}

class _GymMapScreenState extends State<GymMapScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient().getGyms();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Gym map',
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
                      onPressed: () => setState(
                          () => _future = ApiClient().getGyms()),
                      child: const Text('Retry')));
            }
            final gyms = snapshot.data?['gyms'] as List? ?? [];
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  height: 190,
                  decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16)),
                  child: const Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.map_outlined, color: AppColors.neon, size: 44),
                      SizedBox(height: 10),
                      Text('Choose a gym below for directions.',
                          style: TextStyle(color: AppColors.textMuted)),
                    ]),
                  ),
                ),
                const SizedBox(height: 16),
                ...gyms.whereType<Map>().map((raw) {
                  final gym = Map<String, dynamic>.from(raw);
                  final id = gym['_id'] ?? gym['id'];
                  return Card(
                    color: AppColors.surface,
                    child: ListTile(
                      onTap: id == null
                          ? null
                          : () => context.go('/client/gyms/$id'),
                      leading: const Icon(Icons.location_on_outlined,
                          color: AppColors.neon),
                      title: Text(gym['name']?.toString() ?? 'Gym',
                          style: const TextStyle(color: AppColors.textPrimary)),
                      subtitle: Text(
                          gym['location']?.toString() ??
                              gym['address']?.toString() ??
                              'Location unavailable',
                          style: const TextStyle(color: AppColors.textMuted)),
                      trailing: const Icon(Icons.chevron_right,
                          color: AppColors.textMuted),
                    ),
                  );
                }),
              ],
            );
          },
        ),
      );
}
