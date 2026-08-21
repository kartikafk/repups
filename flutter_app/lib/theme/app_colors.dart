import 'package:flutter/material.dart';

/// RepUps Design Tokens - Neon Blue Dark Theme
/// Matches the web app's theme exactly
class AppColors {
  // Backgrounds
  static const Color bg = Color(0xFF060B14);           // Page background (near-black navy)
  static const Color surface = Color(0xFF101826);      // Card background
  static const Color surfaceAlt = Color(0xFF0B1220);   // Nested/icon backgrounds
  
  // Borders
  static const Color border = Color(0xFF1C2636);       // Card borders
  static const Color borderLight = Color(0xFF243444);  // Lighter borders for hover states
  
  // Accent colors (neon-blue theme)
  static const Color neon = Color(0xFF29E0FF);         // Primary accent (buttons, active states)
  static const Color neonDeep = Color(0xFF3D5AFE);     // Secondary accent (links, glow)
  
  // Text
  static const Color textPrimary = Color(0xFFF5F9FF);  // Primary text
  static const Color textMuted = Color(0xFF8592A6);    // Muted/secondary text
  static const Color textDim = Color(0xFF5F6D7E);      // Very dim text
  
  // Status colors
  static const Color success = Color(0xFF4DFFA0);      // Success/positive
  static const Color warning = Color(0xFFFFB020);      // Warning
  static const Color error = Color(0xFFFF4D6D);        // Error/danger
  
  // Private constructor to prevent instantiation
  AppColors._();
}

/// Border radius constants
class AppRadius {
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double full = 999.0;
  
  AppRadius._();
}

/// Shadow configurations
class AppShadows {
  static List<BoxShadow> get glowNeon => [
    BoxShadow(
      color: AppColors.neon.withOpacity(0.5),
      blurRadius: 40,
      offset: const Offset(0, 18),
      spreadRadius: -22,
    ),
  ];
  
  static List<BoxShadow> get glowNeonSoft => [
    BoxShadow(
      color: AppColors.neon.withOpacity(0.3),
      blurRadius: 24,
      offset: const Offset(0, 8),
      spreadRadius: -8,
    ),
  ];
  
  static List<BoxShadow> get glowNeonDeep => [
    BoxShadow(
      color: AppColors.neonDeep.withOpacity(0.4),
      blurRadius: 40,
      offset: const Offset(0, 18),
      spreadRadius: -22,
    ),
  ];
  
  static List<BoxShadow> get glowCard => [
    BoxShadow(
      color: Colors.white.withOpacity(0.04),
      blurRadius: 0,
      offset: const Offset(0, 1),
    ),
    BoxShadow(
      color: Colors.black.withOpacity(0.5),
      blurRadius: 20,
      offset: const Offset(0, 4),
    ),
  ];
  
  static List<BoxShadow> get shadowSm => [
    BoxShadow(
      color: Colors.black.withOpacity(0.4),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];
  
  static List<BoxShadow> get shadowMd => [
    BoxShadow(
      color: Colors.black.withOpacity(0.5),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];
  
  static List<BoxShadow> get shadowLg => [
    BoxShadow(
      color: Colors.black.withOpacity(0.6),
      blurRadius: 32,
      offset: const Offset(0, 8),
    ),
  ];
  
  AppShadows._();
}
