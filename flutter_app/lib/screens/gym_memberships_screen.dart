import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

class GymMembershipsScreen extends StatefulWidget {
  const GymMembershipsScreen({super.key, required this.gymId});
  final String gymId;
  @override
  State<GymMembershipsScreen> createState() => _GymMembershipsScreenState();
}

class _GymMembershipsScreenState extends State<GymMembershipsScreen> {
  final _api = ApiClient();
  late Future<Map<String, dynamic>> _future;
  @override
  void initState() {
    super.initState();
    _future = _api.getGymPlans(widget.gymId);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Memberships',
              style: TextStyle(color: AppColors.textPrimary))),
      body: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done)
              return const Center(
                  child: CircularProgressIndicator(color: AppColors.neon));
            final plans = snapshot.data?['plans'] as List<dynamic>? ?? [];
            return ListView(
                padding: const EdgeInsets.all(16),
                children: plans.whereType<Map>().map((plan) {
                  final id = plan['_id'] ?? plan['id'];
                  return Card(
                      color: AppColors.surface,
                      child: ListTile(
                          title: Text(plan['name']?.toString() ?? 'Membership',
                              style: const TextStyle(
                                  color: AppColors.textPrimary)),
                          subtitle: Text(
                              '₹${plan['price'] ?? plan['amount'] ?? '-'}',
                              style:
                                  const TextStyle(color: AppColors.textMuted)),
                          trailing: FilledButton(
                              onPressed: id == null
                                  ? null
                                  : () => context.go(
                                      '/client/gyms/${widget.gymId}/checkout?planId=$id'),
                              child: const Text('Select'))));
                }).toList());
          }));
}
