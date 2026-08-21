import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

class EventRegistrationScreen extends StatefulWidget {
  const EventRegistrationScreen({super.key, required this.eventId});
  final String eventId;
  @override
  State<EventRegistrationScreen> createState() =>
      _EventRegistrationScreenState();
}

class _EventRegistrationScreenState extends State<EventRegistrationScreen> {
  final _api = ApiClient();
  late Future<Map<String, dynamic>> _future;
  int _quantity = 1;
  String? _ticketId;
  Map<String, dynamic>? _quote;
  String? _error;
  @override
  void initState() {
    super.initState();
    _future = _api.getEvent(widget.eventId);
  }

  Future<void> _quoteTicket() async {
    if (_ticketId == null) return;
    setState(() {
      _error = null;
    });
    try {
      final data = await _api.quoteEventRegistration(
          widget.eventId, _ticketId!, _quantity);
      if (mounted)
        setState(() => _quote = data['quote'] as Map<String, dynamic>?);
    } catch (_) {
      if (mounted)
        setState(() => _error = 'Unable to calculate this ticket quote.');
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Event Registration',
              style: TextStyle(color: AppColors.textPrimary))),
      body: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done)
              return const Center(
                  child: CircularProgressIndicator(color: AppColors.neon));
            final event = snapshot.data?['event'] as Map? ?? const {};
            final tickets = event['ticketTypes'] as List<dynamic>? ?? [];
            return ListView(padding: const EdgeInsets.all(20), children: [
              Text(event['name']?.toString() ?? 'Event',
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 16),
              ...tickets.whereType<Map>().map((ticket) {
                final id = ticket['_id'] ?? ticket['id'];
                return RadioListTile<String>(
                    value: id?.toString() ?? '',
                    groupValue: _ticketId,
                    onChanged: (value) => setState(() => _ticketId = value),
                    title: Text(ticket['name']?.toString() ?? 'Ticket',
                        style: const TextStyle(color: AppColors.textPrimary)),
                    subtitle: Text('₹${ticket['price'] ?? '-'}',
                        style: const TextStyle(color: AppColors.textMuted)));
              }),
              Row(children: [
                const Text('Quantity',
                    style: TextStyle(color: AppColors.textPrimary)),
                IconButton(
                    onPressed: _quantity > 1
                        ? () => setState(() => _quantity--)
                        : null,
                    icon: const Icon(Icons.remove)),
                Text('$_quantity',
                    style: const TextStyle(color: AppColors.textPrimary)),
                IconButton(
                    onPressed: () => setState(() => _quantity++),
                    icon: const Icon(Icons.add))
              ]),
              FilledButton(
                  onPressed: _ticketId == null ? null : _quoteTicket,
                  child: const Text('Review quote')),
              if (_quote != null)
                Card(
                    color: AppColors.surface,
                    child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Total: ₹${_quote!['total'] ?? '-'}',
                                  style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800)),
                              const SizedBox(height: 10),
                              FilledButton(
                                  onPressed: () => context.go(
                                      '/client/events/${widget.eventId}/attendee?ticketTypeId=$_ticketId&quantity=$_quantity'),
                                  child: const Text(
                                      'Continue to attendee details'))
                            ]))),
              if (_error != null)
                Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(_error!,
                        style: const TextStyle(color: AppColors.error)))
            ]);
          }));
}
