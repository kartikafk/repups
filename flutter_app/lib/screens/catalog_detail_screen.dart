import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

/// Shared native detail page for a server event or gym. It keeps dynamic IDs
/// in the URL exactly as the React routes do.
class CatalogDetailScreen extends StatefulWidget {
  const CatalogDetailScreen({super.key, required this.id, required this.isEvent});
  final String id; final bool isEvent;
  @override State<CatalogDetailScreen> createState() => _CatalogDetailScreenState();
}
class _CatalogDetailScreenState extends State<CatalogDetailScreen> {
  final _api = ApiClient(); late Future<Map<String, dynamic>> _item;
  @override void initState() { super.initState(); _item = widget.isEvent ? _api.getEvent(widget.id) : _api.getGym(widget.id); }
  @override Widget build(BuildContext context) => Scaffold(backgroundColor: AppColors.bg, appBar: AppBar(backgroundColor: AppColors.bg, leading: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back))), body: FutureBuilder<Map<String, dynamic>>(future: _item, builder: (context, snapshot) { if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator(color: AppColors.neon)); if (snapshot.hasError) return const Center(child: Text('Unable to load details.', style: TextStyle(color: AppColors.textMuted))); final item = (snapshot.data?[widget.isEvent ? 'event' : 'gym'] as Map?)?.cast<String, dynamic>() ?? {}; final title = item['name']?.toString() ?? (widget.isEvent ? 'Event' : 'Gym'); final location = item['city'] ?? item['locationName'] ?? 'Location unavailable'; return ListView(padding: const EdgeInsets.all(20), children: [Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 30, fontWeight: FontWeight.w800)), const SizedBox(height: 8), Text(location.toString(), style: const TextStyle(color: AppColors.textMuted)), const SizedBox(height: 24), if (item['description'] != null) Text(item['description'].toString(), style: const TextStyle(color: AppColors.textPrimary, height: 1.45)), const SizedBox(height: 24), FilledButton(onPressed: () => context.go(widget.isEvent ? '/client/events/${widget.id}/register' : '/client/gyms/${widget.id}/memberships'), child: Text(widget.isEvent ? 'Register for event' : 'View memberships'))]); }));
}
