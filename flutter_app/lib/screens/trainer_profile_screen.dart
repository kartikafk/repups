import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

class TrainerProfileScreen extends StatefulWidget {
  final String trainerId;
  const TrainerProfileScreen({super.key, required this.trainerId});
  @override State<TrainerProfileScreen> createState() => _TrainerProfileScreenState();
}
class _TrainerProfileScreenState extends State<TrainerProfileScreen> {
  final _api = ApiClient(); late Future<Map<String, dynamic>> _future;
  @override void initState() { super.initState(); _future = _api.getClientTrainerById(widget.trainerId); }
  @override Widget build(BuildContext context) => Scaffold(backgroundColor: AppColors.bg, appBar: AppBar(backgroundColor: AppColors.bg, leading: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)), title: const Text('Trainer Profile', style: TextStyle(color: AppColors.textPrimary))), body: FutureBuilder<Map<String, dynamic>>(future: _future, builder: (context, snapshot) { if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator(color: AppColors.neon)); if (snapshot.hasError) return Center(child: OutlinedButton(onPressed: () => setState(() => _future = _api.getClientTrainerById(widget.trainerId)), child: const Text('Retry'))); final trainer = snapshot.data?['trainer'] as Map? ?? const {}; final specialties = trainer['specializations'] ?? trainer['specialties'] ?? const []; return ListView(padding: const EdgeInsets.all(20), children: [Center(child: CircleAvatar(radius: 48, backgroundColor: AppColors.neonDeep, backgroundImage: trainer['photoUrl'] != null ? NetworkImage(trainer['photoUrl'].toString()) : null, child: trainer['photoUrl'] == null ? const Icon(Icons.person, size: 42) : null)), const SizedBox(height: 14), Text(trainer['name']?.toString() ?? 'Trainer', textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 26)), if (trainer['location'] != null) Text(trainer['location'].toString(), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted)), const SizedBox(height: 16), if (specialties is List && specialties.isNotEmpty) Wrap(spacing: 8, runSpacing: 8, children: specialties.map((item) => Chip(label: Text(item.toString()))).toList()), if (trainer['bio'] != null) Padding(padding: const EdgeInsets.symmetric(vertical: 20), child: Text(trainer['bio'].toString(), style: const TextStyle(color: AppColors.textPrimary, height: 1.45))), FilledButton.icon(onPressed: () => context.go('/trainer-chat?trainerId=${widget.trainerId}'), icon: const Icon(Icons.chat_bubble_outline), label: const Text('Message trainer'))]); }));
}
