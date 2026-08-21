import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

/// Mirrors ClientProfilePage.jsx with the existing GET/PATCH `/api/me` API.
class ClientProfileScreen extends ConsumerStatefulWidget {
  const ClientProfileScreen({super.key});
  @override
  ConsumerState<ClientProfileScreen> createState() => _ClientProfileScreenState();
}

class _ClientProfileScreenState extends ConsumerState<ClientProfileScreen> {
  final _api = ApiClient();
  final _name = TextEditingController();
  final _age = TextEditingController();
  String _goal = '';
  Map<String, dynamic>? _user;
  bool _loading = true, _editing = false, _saving = false;
  String? _error, _message;
  static const _goals = ['Cut', 'Bulk', 'Recomp', 'Maintain'];

  @override void initState() { super.initState(); _load(); }
  @override void dispose() { _name.dispose(); _age.dispose(); super.dispose(); }
  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _api.getCurrentUser();
      final user = Map<String, dynamic>.from(result['user'] as Map? ?? {});
      if (!mounted) return;
      setState(() { _user = user; _name.text = user['name']?.toString() ?? ''; _age.text = user['age']?.toString() ?? ''; _goal = user['goal']?.toString() ?? ''; _loading = false; });
    } catch (_) { if (mounted) setState(() { _error = 'Unable to load your profile.'; _loading = false; }); }
  }
  Future<void> _save() async {
    setState(() { _saving = true; _message = null; });
    try {
      final response = await _api.updateMyProfile({'name': _name.text.trim(), 'age': _age.text.trim(), 'goal': _goal});
      if (!mounted) return;
      setState(() { _user = Map<String, dynamic>.from(response['user'] as Map? ?? _user!); _editing = false; _message = 'Saved'; _saving = false; });
      ref.read(authProvider.notifier).refreshUser();
    } catch (_) { if (mounted) setState(() { _message = 'Could not save profile.'; _saving = false; }); }
  }
  String get _initials { final parts = (_user?['name']?.toString() ?? '').split(' ').where((x) => x.isNotEmpty).take(2); final value = parts.map((x) => x[0].toUpperCase()).join(); return value.isEmpty ? '?' : value; }
  @override Widget build(BuildContext context) => Scaffold(backgroundColor: AppColors.bg, appBar: AppBar(backgroundColor: AppColors.bg, leading: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)), title: const Text('Profile', style: TextStyle(color: AppColors.textPrimary)), actions: [TextButton(onPressed: _loading ? null : () => setState(() => _editing = !_editing), child: Text(_editing ? 'Cancel' : 'Edit'))]), body: _loading ? const Center(child: CircularProgressIndicator(color: AppColors.neon)) : _error != null ? Center(child: OutlinedButton(onPressed: _load, child: const Text('Retry'))) : ListView(padding: const EdgeInsets.all(20), children: [
    Center(child: CircleAvatar(radius: 42, backgroundColor: AppColors.neonDeep, backgroundImage: _user?['photoUrl'] != null ? NetworkImage(_user!['photoUrl'].toString()) : null, child: _user?['photoUrl'] == null ? Text(_initials, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 24)) : null)), const SizedBox(height: 12), Center(child: Text(_user?['email']?.toString() ?? '', style: const TextStyle(color: AppColors.textMuted))), const SizedBox(height: 28),
    _field('Name', _name, enabled: _editing), _field('Age', _age, enabled: _editing, keyboard: TextInputType.number), const Text('PRIMARY GOAL', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700)), const SizedBox(height: 8), DropdownButtonFormField<String>(value: _goals.contains(_goal) ? _goal : null, items: _goals.map((goal) => DropdownMenuItem(value: goal, child: Text(goal))).toList(), onChanged: _editing ? (value) => setState(() => _goal = value ?? '') : null), const SizedBox(height: 20), if (_editing) FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving…' : 'Save profile')), if (_message != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_message!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.success))), const SizedBox(height: 26), const Text('Account', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w800)), const SizedBox(height: 8), OutlinedButton.icon(onPressed: () async { await ref.read(authProvider.notifier).signOut(); if (mounted) context.go('/'); }, icon: const Icon(Icons.logout), label: const Text('Sign out')),
  ]));
  Widget _field(String label, TextEditingController controller, {required bool enabled, TextInputType? keyboard}) => Padding(padding: const EdgeInsets.only(bottom: 16), child: TextField(controller: controller, enabled: enabled, keyboardType: keyboard, style: const TextStyle(color: AppColors.textPrimary), decoration: InputDecoration(labelText: label)));
}
