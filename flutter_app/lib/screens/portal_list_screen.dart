import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

/// Reusable backend-backed lists for existing trainer/admin portal endpoints.
class PortalListScreen extends StatefulWidget {
  const PortalListScreen({super.key, required this.title, required this.endpoint, required this.collectionKey});
  final String title, endpoint, collectionKey;
  @override State<PortalListScreen> createState() => _PortalListScreenState();
}
class _PortalListScreenState extends State<PortalListScreen> {
  final _api = ApiClient(); late Future<Map<String, dynamic>> _future;
  @override void initState() { super.initState(); _future = _api.get<Map<String, dynamic>>(widget.endpoint); }
  @override Widget build(BuildContext context) => Scaffold(backgroundColor: AppColors.bg, appBar: AppBar(backgroundColor: AppColors.bg, leading: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)), title: Text(widget.title, style: const TextStyle(color: AppColors.textPrimary))), body: FutureBuilder<Map<String, dynamic>>(future: _future, builder: (context, snapshot) { if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator(color: AppColors.neon)); if (snapshot.hasError) return Center(child: OutlinedButton(onPressed: () => setState(() => _future = _api.get<Map<String, dynamic>>(widget.endpoint)), child: const Text('Retry'))); final items = snapshot.data?[widget.collectionKey] as List<dynamic>? ?? []; return ListView(padding: const EdgeInsets.all(16), children: [if (items.isEmpty) const Padding(padding: EdgeInsets.all(32), child: Center(child: Text('Nothing to show yet.', style: TextStyle(color: AppColors.textMuted)))), ...items.whereType<Map>().map((item) { final title = item['name'] ?? item['title'] ?? item['email'] ?? item['_id'] ?? 'Item'; final subtitle = item['status'] ?? item['body'] ?? item['createdAt'] ?? ''; return Card(color: AppColors.surface, child: ListTile(title: Text(title.toString(), style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)), subtitle: Text(subtitle.toString(), style: const TextStyle(color: AppColors.textMuted)))); })]); }));
}
