import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

/// Reviews the server-calculated ticket price before a payment order is
/// created. This mirrors the React flow's quote-before-order sequence.
class EventReviewScreen extends StatefulWidget {
  const EventReviewScreen({super.key, required this.eventId});
  final String eventId;

  @override
  State<EventReviewScreen> createState() => _EventReviewScreenState();
}

class _EventReviewScreenState extends State<EventReviewScreen> {
  Map<String, dynamic>? _payload;
  Future<Map<String, dynamic>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _payload ??= _routePayload;
    if (_payload != null && _future == null) {
      _future = ApiClient().quoteEventRegistration(widget.eventId,
          _payload!['ticketTypeId'].toString(), _payload!['quantity'] as int);
    }
  }

  Map<String, dynamic>? get _routePayload {
    final extra = GoRouterState.of(context).extra;
    return extra is Map ? Map<String, dynamic>.from(extra) : null;
  }

  @override
  Widget build(BuildContext context) {
    if (_payload == null) {
      return Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(backgroundColor: AppColors.bg),
        body: Center(
            child: FilledButton(
                onPressed: () => context.go('/client/events/${widget.eventId}/register'),
                child: const Text('Choose tickets first'))),
      );
    }
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Review & Pay',
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
                      .quoteEventRegistration(widget.eventId,
                          _payload!['ticketTypeId'].toString(), _payload!['quantity'] as int)),
                  child: const Text('Unable to calculate quote. Retry')),
            );
          }
          final quote = Map<String, dynamic>.from(
              snapshot.data?['quote'] as Map? ?? const {});
          final ticket = Map<String, dynamic>.from(
              quote['ticket'] as Map? ?? const {});
          return ListView(padding: const EdgeInsets.all(20), children: [
            Card(
              color: AppColors.surface,
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${ticket['name'] ?? 'Ticket'} × ${quote['quantity'] ?? 1}',
                      style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 14),
                  _price('Subtotal', quote['subtotal']),
                  _price('Platform fee', quote['platformFee']),
                  _price('Tax', quote['tax']),
                  const Divider(color: AppColors.border),
                  _price('Total', quote['total'], total: true),
                ]),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
                'Payment checkout will open securely after the native Razorpay integration is enabled.',
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
