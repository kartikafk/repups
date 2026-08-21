import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int>? onTap;

  const BottomNav({
    Key? key,
    required this.currentIndex,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Match React AppBottomNav structure exactly
    final navItems = [
      {'label': 'Home', 'path': '/dashboard', 'icon': Icons.home},
      {'label': 'Community', 'path': '/community', 'icon': Icons.people},
      {
        'label': 'Events & Gyms',
        'path': '/client/events-gyms',
        'icon': Icons.location_on
      },
      {'label': 'Coach', 'path': '/ai-coach', 'icon': Icons.psychology},
      {
        'label': 'Find Trainer',
        'path': '/client/trainers',
        'icon': Icons.search
      },
    ];

    return Container(
      // Match React styles.bottomNav exactly
      height: 74,
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF050708).withOpacity(0.98), // rgba(5,7,8,.98)
        border: const Border(
          top: BorderSide(color: Color(0xFF252C31)), // C.border
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: navItems.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isActive = currentIndex == index;

          return Expanded(
            child: GestureDetector(
              onTap: () {
                if (onTap != null) {
                  onTap!(index);
                } else {
                  context.go(item['path'] as String);
                }
              },
              child: Container(
                // Match React styles.navButton
                padding: const EdgeInsets.symmetric(horizontal: 1, vertical: 2),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      item['icon'] as IconData,
                      size: 20,
                      color: isActive
                          ? const Color(0xFFC8FF3D) // C.lime
                          : const Color(0xFF8A9298), // default color
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item['label'] as String,
                      // Match React styles.navLabel exactly
                      style: TextStyle(
                        fontSize: 7.5,
                        height: 1.05,
                        color: isActive
                            ? const Color(0xFFC8FF3D) // C.lime
                            : const Color(0xFF8A9298), // default color
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
