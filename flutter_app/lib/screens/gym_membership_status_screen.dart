import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class GymMembershipStatusScreen extends StatefulWidget {
  const GymMembershipStatusScreen({super.key});

  @override
  State<GymMembershipStatusScreen> createState() =>
      _GymMembershipStatusScreenState();
}

class _GymMembershipStatusScreenState extends State<GymMembershipStatusScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient().getGymMemberships();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('My memberships',
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
                child: TextButton(
                  onPressed: () =>
                      setState(() => _future = ApiClient().getGymMemberships()),
                  child: const Text('Could not load memberships. Retry'),
                ),
              );
            }
            final memberships = snapshot.data?['memberships'] as List? ?? [];
            if (memberships.isEmpty) {
              return Center(
                child: FilledButton.icon(
                  onPressed: () => context.go('/client/gyms'),
                  icon: const Icon(Icons.fitness_center),
                  label: const Text('Explore gyms'),
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: () async =>
                  setState(() => _future = ApiClient().getGymMemberships()),
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: memberships.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item =
                      Map<String, dynamic>.from(memberships[index] as Map);
                  final paid = item['paymentStatus'] == 'paid';
                  return Card(
                    color: AppColors.surface,
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor:
                            paid ? AppColors.success : AppColors.warning,
                        child: Icon(paid ? Icons.check : Icons.schedule,
                            color: AppColors.bg),
                      ),
                      title: Text(
                          item['planName']?.toString() ?? 'Gym membership',
                          style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700)),
                      subtitle: Text(
                          '${item['status'] ?? 'pending'} • ₹${item['amount'] ?? '-'}',
                          style: const TextStyle(color: AppColors.textMuted)),
                    ),
                  );
                },
              ),
            );
          },
        ),
      );
}
