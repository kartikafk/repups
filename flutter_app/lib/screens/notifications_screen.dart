import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

/// Live notifications and trainer-request flow from NotificationsPage.jsx.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _api = ApiClient();
  bool _loading = true, _marking = false; String? _error;
  List<dynamic> _notifications = [], _requests = [];
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try { final values = await Future.wait([_api.getNotifications(), _api.getTrainerRequests()]); if (!mounted) return; setState(() { _notifications = values[0]['notifications'] as List<dynamic>? ?? []; _requests = values[1]['requests'] as List<dynamic>? ?? []; _loading = false; }); }
    catch (_) { if (mounted) setState(() { _loading = false; _error = 'Unable to load notifications.'; }); }
  }
  Future<void> _respond(String id, String status) async { try { await _api.respondToTrainerRequest(id, status); await _load(); } catch (_) { if (mounted) setState(() => _error = 'Unable to update the request.'); } }
  Future<void> _markAll() async { setState(() => _marking = true); try { await _api.markAllNotificationsRead(); await _load(); } finally { if (mounted) setState(() => _marking = false); } }
  @override Widget build(BuildContext context) { final pending = _requests.where((item) => item is Map && item['status'] == 'pending').cast<Map>().toList(); final unread = _notifications.where((item) => item is Map && item['readAt'] == null).length; return Scaffold(backgroundColor: AppColors.bg, appBar: AppBar(backgroundColor: AppColors.bg, leading: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)), title: const Text('Notifications', style: TextStyle(color: AppColors.textPrimary)), actions: [if (unread > 0) TextButton(onPressed: _marking ? null : _markAll, child: Text(_marking ? 'Marking…' : 'Mark all read'))]), body: _loading ? const Center(child: CircularProgressIndicator(color: AppColors.neon)) : RefreshIndicator(color: AppColors.neon, onRefresh: _load, child: ListView(padding: const EdgeInsets.all(16), children: [if (_error != null) _Notice(_error!), ...pending.map((request) => _RequestCard(request: request, onAccept: () => _respond(request['_id'].toString(), 'accepted'), onReject: () => _respond(request['_id'].toString(), 'rejected'))), if (_notifications.isEmpty && pending.isEmpty) const Padding(padding: EdgeInsets.all(32), child: Center(child: Text('You’re all caught up.', style: TextStyle(color: AppColors.textMuted)))), ..._notifications.whereType<Map>().map((item) => _NotificationCard(item))]))); }
}
class _RequestCard extends StatelessWidget { const _RequestCard({required this.request, required this.onAccept, required this.onReject}); final Map request; final VoidCallback onAccept, onReject; @override Widget build(BuildContext context) { final trainer = request['trainer'] is Map ? request['trainer'] as Map : const {}; return Card(color: AppColors.surface, child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Trainer connection request', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)), const SizedBox(height: 6), Text('${trainer['name'] ?? 'A trainer'} wants to connect with you.', style: const TextStyle(color: AppColors.textMuted)), const SizedBox(height: 12), Row(children: [Expanded(child: FilledButton(onPressed: onAccept, child: const Text('Accept'))), const SizedBox(width: 8), Expanded(child: OutlinedButton(onPressed: onReject, child: const Text('Reject')))])]))); } }
class _NotificationCard extends StatelessWidget { const _NotificationCard(this.item); final Map item; @override Widget build(BuildContext context) => Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: item['readAt'] == null ? AppColors.surface : AppColors.surfaceAlt, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(item['type'] == 'payment' ? Icons.payments_outlined : Icons.notifications_outlined, color: AppColors.neon), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(item['title']?.toString() ?? 'Notification', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)), const SizedBox(height: 3), Text(item['body']?.toString() ?? '', style: const TextStyle(color: AppColors.textMuted))]))])); }
class _Notice extends StatelessWidget { const _Notice(this.text); final String text; @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(text, style: const TextStyle(color: AppColors.error))); }
