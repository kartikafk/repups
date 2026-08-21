import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

class TrainerChatScreen extends ConsumerStatefulWidget {
  const TrainerChatScreen({super.key});
  @override
  ConsumerState<TrainerChatScreen> createState() => _TrainerChatScreenState();
}

class _TrainerChatScreenState extends ConsumerState<TrainerChatScreen> {
  final _api = ApiClient();
  final _input = TextEditingController();
  List<dynamic> _messages = [];
  bool _loading = true;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  String? get _trainerId =>
      GoRouterState.of(context).uri.queryParameters['trainerId'];
  Future<void> _load() async {
    final trainerId = _trainerId;
    final clientId = ref.read(currentUserProvider)?.id;
    if (trainerId == null || clientId == null) {
      setState(() => _loading = false);
      return;
    }
    try {
      final data =
          await _api.getMessageThread(trainerId: trainerId, clientId: clientId);
      if (mounted)
        setState(() {
          _messages = data['messages'] as List<dynamic>? ?? [];
          _loading = false;
        });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final trainerId = _trainerId;
    final clientId = ref.read(currentUserProvider)?.id;
    final text = _input.text.trim();
    if (trainerId == null || clientId == null || text.isEmpty) return;
    _input.clear();
    try {
      final data = await _api.sendMessage(
          trainerId: trainerId, clientId: clientId, text: text);
      if (mounted) setState(() => _messages.add(data['message']));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Messages',
              style: TextStyle(color: AppColors.textPrimary))),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.neon))
          : Column(children: [
              Expanded(
                  child: ListView(
                      padding: const EdgeInsets.all(16),
                      children: _messages.whereType<Map>().map((item) {
                        final mine = item['from'] == 'client';
                        return Align(
                            alignment: mine
                                ? Alignment.centerRight
                                : Alignment.centerLeft,
                            child: Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                    color: mine
                                        ? AppColors.neonDeep
                                        : AppColors.surface,
                                    borderRadius: BorderRadius.circular(12)),
                                child: Text(item['text']?.toString() ?? '',
                                    style: const TextStyle(
                                        color: AppColors.textPrimary))));
                      }).toList())),
              Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(children: [
                    Expanded(
                        child: TextField(
                            controller: _input,
                            onSubmitted: (_) => _send(),
                            style:
                                const TextStyle(color: AppColors.textPrimary),
                            decoration: const InputDecoration(
                                hintText: 'Type a message...'))),
                    IconButton(
                        onPressed: _send,
                        icon: const Icon(Icons.send, color: AppColors.neon))
                  ]))
            ]));
}
