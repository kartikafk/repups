import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class GymCheckoutScreen extends StatefulWidget {
  const GymCheckoutScreen({super.key, required this.gymId});
  final String gymId;

  @override
  State<GymCheckoutScreen> createState() => _GymCheckoutScreenState();
}

class _GymCheckoutScreenState extends State<GymCheckoutScreen> {
  Future<Map<String, dynamic>>? _future;
  String? _planId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _planId ??= GoRouterState.of(context).uri.queryParameters['planId'];
    if (_planId != null && _future == null) {
      _future = ApiClient().quoteGymMembership(widget.gymId, _planId!);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_planId == null) {
      return Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(backgroundColor: AppColors.bg),
        body: Center(
            child: FilledButton(
                onPressed: () =>
                    context.go('/client/gyms/${widget.gymId}/memberships'),
                child: const Text('Choose a membership plan'))),
      );
    }
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Checkout',
              style: TextStyle(color: AppColors.textPrimary))),
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
                    onPressed: () => setState(() => _future = ApiClient()
                        .quoteGymMembership(widget.gymId, _planId!)),
                    child: const Text('Unable to calculate quote. Retry')));
          }
          final quote = Map<String, dynamic>.from(
              snapshot.data?['quote'] as Map? ?? const {});
          final plan = Map<String, dynamic>.from(
              quote['plan'] as Map? ?? const {});
          return ListView(padding: const EdgeInsets.all(20), children: [
            Card(
              color: AppColors.surface,
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(plan['name']?.toString() ?? 'Membership plan',
                      style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 5),
                  Text('${plan['durationDays'] ?? '-'} days · prepaid',
                      style: const TextStyle(color: AppColors.textMuted)),
                  const SizedBox(height: 14),
                  _price('Subtotal', quote['subtotal']),
                  _price('Tax', quote['tax']),
                  const Divider(color: AppColors.border),
                  _price('Total', quote['total'], total: true),
                ]),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
                'Secure payment checkout requires the native Razorpay package to be enabled for this Flutter app.',
                style: TextStyle(color: AppColors.textMuted)),
          ]);
        },
      ),
    );
  }

  Widget _price(String label, dynamic amount, {bool total = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label,
              style: TextStyle(
                  color: total ? AppColors.textPrimary : AppColors.textMuted,
                  fontWeight: total ? FontWeight.w800 : FontWeight.normal)),
          Text('₹${amount ?? '-'}',
              style: TextStyle(
                  color: total ? AppColors.neon : AppColors.textPrimary,
                  fontWeight: total ? FontWeight.w800 : FontWeight.normal)),
        ]),
      );
}
