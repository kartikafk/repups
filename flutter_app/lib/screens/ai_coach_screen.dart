import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/bottom_nav.dart';

/// Functional equivalent of AICoachPage + text portion of AIOnboardingChat.
class AICoachScreen extends StatefulWidget {
  const AICoachScreen({super.key});
  @override State<AICoachScreen> createState() => _AICoachScreenState();
}
class _AICoachScreenState extends State<AICoachScreen> {
  final _api = ApiClient(), _input = TextEditingController();
  final List<_Line> _lines = []; bool _sending = false;
  @override void dispose() { _input.dispose(); super.dispose(); }
  Future<void> _send() async {
    final text = _input.text.trim(); if (text.isEmpty || _sending) return;
    setState(() { _lines.add(_Line(text, true)); _input.clear(); _sending = true; });
    try { final data = await _api.chatWithAI(text); final reply = data['message'] ?? data['reply'] ?? data['response'] ?? 'I could not generate an answer.'; if (mounted) setState(() => _lines.add(_Line(reply.toString(), false))); }
    catch (_) { if (mounted) setState(() => _lines.add(const _Line('I could not reach your AI coach. Please try again.', false))); }
    finally { if (mounted) setState(() => _sending = false); }
  }
  @override Widget build(BuildContext context) => Scaffold(backgroundColor: AppColors.bg, bottomNavigationBar: const BottomNav(currentIndex: 3), body: SafeArea(child: Column(children: [
    Padding(padding: const EdgeInsets.fromLTRB(20, 16, 12, 8), child: Row(children: [const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('AI Coach', style: TextStyle(color: AppColors.textPrimary, fontSize: 28, fontWeight: FontWeight.w800)), Text('Your training and recovery assistant', style: TextStyle(color: AppColors.textMuted))])), IconButton(onPressed: () => context.go('/ai-coach-insight'), icon: const Icon(Icons.insights_outlined, color: AppColors.neon))])),
    Expanded(child: ListView(padding: const EdgeInsets.all(20), children: [const _Bubble('Ask about training, recovery, or the results of your posture assessment.', false), ..._lines.map((line) => _Bubble(line.text, line.mine)), if (_sending) const _Bubble('Thinking…', false)])),
    SafeArea(top: false, child: Padding(padding: const EdgeInsets.fromLTRB(16, 8, 16, 12), child: Row(children: [Expanded(child: TextField(controller: _input, onSubmitted: (_) => _send(), style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Ask your coach…'))), const SizedBox(width: 8), FilledButton(onPressed: _sending ? null : _send, child: const Icon(Icons.arrow_upward))])))
  ])));
}
class _Line { const _Line(this.text, this.mine); final String text; final bool mine; }
class _Bubble extends StatelessWidget { const _Bubble(this.text, this.mine); final String text; final bool mine; @override Widget build(BuildContext context) => Align(alignment: mine ? Alignment.centerRight : Alignment.centerLeft, child: Container(constraints: const BoxConstraints(maxWidth: 320), margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(13), decoration: BoxDecoration(color: mine ? AppColors.neonDeep : AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)), child: Text(text, style: const TextStyle(color: AppColors.textPrimary, height: 1.35)))); }
