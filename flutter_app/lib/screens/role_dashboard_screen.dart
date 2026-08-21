import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

enum PortalRole { trainer, admin }

class RoleDashboardScreen extends ConsumerWidget {
  const RoleDashboardScreen({super.key, required this.role});
  final PortalRole role;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trainer = role == PortalRole.trainer;
    final links = trainer
        ? <List<String>>[
            ['Clients', '/trainer/clients'],
            ['Appointments', '/trainer/appointments'],
            ['Plans', '/trainer/plans']
          ]
        : <List<String>>[
            ['Users', '/admin/users'],
            ['Sessions', '/admin/sessions'],
            ['Bookings', '/admin/bookings'],
            ['Gyms', '/admin/gyms'],
            ['Audit logs', '/admin/logs']
          ];
    final future = trainer
        ? ApiClient().get<Map<String, dynamic>>('/trainer/dashboard')
        : ApiClient().getAdminDashboard();
    return Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
            backgroundColor: AppColors.bg,
            title: Text(trainer ? 'Trainer Dashboard' : 'Admin Dashboard',
                style: const TextStyle(color: AppColors.textPrimary))),
        body: FutureBuilder<Map<String, dynamic>>(
            future: future,
            builder: (context, snapshot) {
              final stats = snapshot.data?['stats'] as Map? ?? const {};
              return ListView(padding: const EdgeInsets.all(20), children: [
                Wrap(
                    children: stats.entries
                        .map<Widget>((entry) => Padding(
                            padding: const EdgeInsets.all(6),
                            child: Text('${entry.key}: ${entry.value}',
                                style: const TextStyle(
                                    color: AppColors.textPrimary))))
                        .toList()),
                ...links.map((link) => Card(
                    color: AppColors.surface,
                    child: ListTile(
                        onTap: () => context.go(link[1]),
                        title: Text(link[0],
                            style: const TextStyle(
                                color: AppColors.textPrimary)))))
              ]);
            }));
  }
}
