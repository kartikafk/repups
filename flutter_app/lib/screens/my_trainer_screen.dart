import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

class MyTrainerScreen extends StatefulWidget {
  const MyTrainerScreen({super.key});
  @override State<MyTrainerScreen> createState() => _MyTrainerScreenState();
}
class _MyTrainerScreenState extends State<MyTrainerScreen> {
  final _api = ApiClient(); late Future<Map<String, dynamic>> _future;
  @override void initState() { super.initState(); _future = _api.getMyTrainer(); }
  @override Widget build(BuildContext context) => Scaffold(backgroundColor: AppColors.bg, appBar: AppBar(backgroundColor: AppColors.bg, leading: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)), title: const Text('My Trainer', style: TextStyle(color: AppColors.textPrimary))), body: FutureBuilder<Map<String, dynamic>>(future: _future, builder: (context, snapshot) { if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator(color: AppColors.neon)); if (snapshot.hasError) return Center(child: OutlinedButton(onPressed: () => setState(() => _future = _api.getMyTrainer()), child: const Text('Retry'))); final trainer = snapshot.data?['trainer'] as Map?; if (trainer == null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [const Text('You do not have a trainer yet.', style: TextStyle(color: AppColors.textMuted)), const SizedBox(height: 12), FilledButton(onPressed: () => context.go('/client/trainers'), child: const Text('Find a trainer'))])); final id = trainer['_id'] ?? trainer['id']; return ListView(padding: const EdgeInsets.all(20), children: [CircleAvatar(radius: 44, backgroundColor: AppColors.neonDeep, backgroundImage: trainer['photoUrl'] != null ? NetworkImage(trainer['photoUrl'].toString()) : null, child: trainer['photoUrl'] == null ? const Icon(Icons.person, size: 36) : null), const SizedBox(height: 16), Text(trainer['name']?.toString() ?? 'Your trainer', textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textPrimary, fontSize: 25, fontWeight: FontWeight.w800)), if (trainer['gym'] != null) Text(trainer['gym'].toString(), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted)), const SizedBox(height: 28), FilledButton.icon(onPressed: () => context.go('/trainer-chat${id == null ? '' : '?trainerId=$id'}'), icon: const Icon(Icons.chat_bubble_outline), label: const Text('Message trainer')), const SizedBox(height: 10), OutlinedButton(onPressed: id == null ? null : () => context.go('/client/trainers/$id'), child: const Text('View profile'))]); }));
}
