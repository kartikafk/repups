import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/bottom_nav.dart';

class EventsGymsScreen extends StatelessWidget {
  const EventsGymsScreen({super.key});
  @override
  Widget build(BuildContext context) => DefaultTabController(
      length: 2,
      child: Scaffold(
          backgroundColor: AppColors.bg,
          bottomNavigationBar: const BottomNav(currentIndex: 2),
          appBar: AppBar(
              backgroundColor: AppColors.bg,
              title: const Text('Events & Gyms',
                  style: TextStyle(color: AppColors.textPrimary)),
              bottom:
                  const TabBar(tabs: [Tab(text: 'Events'), Tab(text: 'Gyms')])),
          body: TabBarView(children: [
            _list(ApiClient().getEvents(), 'events', true),
            _list(ApiClient().getGyms(), 'gyms', false)
          ])));
  Widget _list(Future<Map<String, dynamic>> future, String key, bool events) =>
      FutureBuilder<Map<String, dynamic>>(
          future: future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done)
              return const Center(
                  child: CircularProgressIndicator(color: AppColors.neon));
            final values = snapshot.data?[key] as List<dynamic>? ?? [];
            return ListView(
                children: values.whereType<Map>().map((item) {
              final id = item['_id'] ?? item['id'];
              return ListTile(
                  onTap: id == null
                      ? null
                      : () => context.go(
                          events ? '/client/events/$id' : '/client/gyms/$id'),
                  title: Text(item['name']?.toString() ?? '',
                      style: const TextStyle(color: AppColors.textPrimary)),
                  subtitle: Text(item['city']?.toString() ?? '',
                      style: const TextStyle(color: AppColors.textMuted)));
            }).toList());
          });
}
