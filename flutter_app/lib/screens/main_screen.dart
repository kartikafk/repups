import 'package:flutter/material.dart';
import '../widgets/bottom_nav.dart';
import 'home_dashboard_screen.dart';
import 'community_screen.dart';
import 'workout_session_screen.dart';
import 'trainer_list_screen.dart';
import 'profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeDashboardScreen(),        // Home - matches React /dashboard
    CommunityScreen(),           // Community - matches React /community  
    WorkoutSessionScreen(),      // Events & Gyms - matches React /client/events-gyms
    TrainerListScreen(),         // Coach - matches React /ai-coach -> /client/trainers for now
    ProfileScreen(),             // Find Trainer - matches React /client/trainers -> Profile for now
  ];

  // Match React navigation paths exactly
  final List<String> _routePaths = [
    '/dashboard',
    '/community', 
    '/client/events-gyms',
    '/ai-coach',
    '/client/trainers',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNav(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }
}