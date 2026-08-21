import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_colors.dart';

class EventAttendeeScreen extends StatefulWidget {
  const EventAttendeeScreen({super.key, required this.eventId});
  final String eventId;

  @override
  State<EventAttendeeScreen> createState() => _EventAttendeeScreenState();
}

class _EventAttendeeScreenState extends State<EventAttendeeScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _emergencyContact = TextEditingController();
  final _notes = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _emergencyContact.dispose();
    _notes.dispose();
    super.dispose();
  }

  void _continue() {
    final params = GoRouterState.of(context).uri.queryParameters;
    final ticket = params['ticketTypeId'];
    final quantity = int.tryParse(params['quantity'] ?? '') ?? 1;
    if (ticket == null ||
        [_name, _email, _phone].any((item) => item.text.trim().isEmpty)) {
      setState(() => _error = 'Enter attendee name, email, and phone.');
      return;
    }
    context.go('/client/events/${widget.eventId}/review', extra: {
      'ticketTypeId': ticket,
      'quantity': quantity,
      'attendee': {
        'fullName': _name.text.trim(),
        'email': _email.text.trim(),
        'phone': _phone.text.trim(),
        'emergencyContact': _emergencyContact.text.trim(),
        'notes': _notes.text.trim(),
      },
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Attendee Details',
              style: TextStyle(color: AppColors.textPrimary)),
        ),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          const Text('Who will attend?',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 23)),
          const SizedBox(height: 16),
          _field(_name, 'Full name'),
          _field(_email, 'Email', type: TextInputType.emailAddress),
          _field(_phone, 'Phone', type: TextInputType.phone),
          _field(_emergencyContact, 'Emergency contact (optional)'),
          _field(_notes, 'Additional notes (optional)', lines: 3),
          if (_error != null)
            Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(_error!,
                    style: const TextStyle(color: AppColors.error))),
          const SizedBox(height: 20),
          FilledButton(
              onPressed: _continue, child: const Text('Review payment')),
        ]),
      );

  Widget _field(TextEditingController controller, String label,
          {TextInputType? type, int lines = 1}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
            controller: controller,
            keyboardType: type,
            minLines: lines,
            maxLines: lines,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: InputDecoration(labelText: label)),
      );
}
