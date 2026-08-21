class AppConfig {
  // Flutter native clients require an absolute Dio base URL. Android emulators
  // reach the host machine through 10.0.2.2; physical devices should override
  // this with --dart-define=API_BASE_URL=http://<LAN-IP>:5000.
  static const String _defaultApiUrl = 'http://10.0.2.2:5000/api';

  /// Get API base URL from environment or use default for development
  static String get apiBaseUrl {
    const String envUrl = String.fromEnvironment('API_BASE_URL');
    if (envUrl.isNotEmpty) {
      final normalized = envUrl.replaceFirst(RegExp(r'/+$'), '');
      // Accept either an API origin (http://host:5000) or a complete API
      // prefix (http://host:5000/api). This avoids the previous /api/api bug.
      return normalized.endsWith('/api') ? normalized : '$normalized/api';
    }
    return _defaultApiUrl;
  }

  /// Razorpay public key for payments
  static String get razorpayKeyId {
    const String keyId = String.fromEnvironment('RAZORPAY_KEY_ID');
    if (keyId.isEmpty) {
      throw Exception(
          'RAZORPAY_KEY_ID not configured. Use --dart-define to set it.');
    }
    return keyId;
  }

  /// Whether we're in debug mode
  static bool get isDebug {
    bool inDebugMode = false;
    assert(inDebugMode = true);
    return inDebugMode;
  }

  /// App version info
  static const String appName = 'RepUps';
  static const String version = '1.0.0';

  /// API timeout settings
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration uploadTimeout = Duration(minutes: 5);

  /// Camera and pose detection settings
  static const double poseConfidenceThreshold = 0.5;
  static const int maxVideoRecordingSeconds = 300; // 5 minutes

  /// Storage keys
  static const String tokenKey = 'jwt_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';
  static const String onboardingKey = 'onboarding_completed';
}
