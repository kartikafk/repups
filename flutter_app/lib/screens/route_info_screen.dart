import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';

/// Shared page shell for secondary React flows while retaining their exact
/// deep-link URL and a usable back path.
class RouteInfoScreen extends StatelessWidget {
  const RouteInfoScreen({super.key, required this.title, required this.description, this.primaryPath, this.primaryLabel});
  final String title, description; final String? primaryPath, primaryLabel;
  @override Widget build(BuildContext context) => Scaffold(backgroundColor: AppColors.bg, appBar: AppBar(backgroundColor: AppColors.bg, leading: IconButton(onPressed: () => context.canPop() ? context.pop() : context.go('/dashboard'), icon: const Icon(Icons.arrow_back)), title: Text(title, style: const TextStyle(color: AppColors.textPrimary))), body: Center(child: Padding(padding: const EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.fitness_center_outlined, size: 54, color: AppColors.neon.withOpacity(.9)), const SizedBox(height: 18), Text(title, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textPrimary, fontSize: 24, fontWeight: FontWeight.w800)), const SizedBox(height: 8), Text(description, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted, height: 1.4)), if (primaryPath != null) ...[const SizedBox(height: 22), FilledButton(onPressed: () => context.go(primaryPath!), child: Text(primaryLabel ?? 'Continue'))]]))));
}
