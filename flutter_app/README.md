# RepUps Flutter App

Complete Flutter migration of the RepUps fitness tracking and coaching platform with full feature parity from the React frontend.

## 🎯 Project Status

The Flutter app is currently **7% complete** with authentication and core routing infrastructure in place. See [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) for detailed progress tracking.

### ✅ What's Working

- **Authentication System**: JWT-based login/signup with role selection (client/trainer/admin)
- **Role-Based Routing**: Automatic redirects based on user role with go_router guards
- **Client Dashboard**: Main dashboard with API integration for user data, sessions, posture, and plans
- **Posture Assessment Flow**: Multi-step capture interface (camera integration pending)
- **Assessment History**: List and detail views of posture assessments
- **Workout Session Setup**: Exercise selection and workout preparation
- **API Client**: Complete Dio-based HTTP client with all backend endpoints
- **Theme System**: Dark RepUps theme matching React design

### 🚧 In Progress

- Camera and pose tracking service
- Workout camera with real-time form analysis
- Community features
- Trainer portal
- Admin panel
- Events and gyms with Razorpay payments

## 📋 Prerequisites

- **Flutter SDK**: 3.47.0 or higher
- **Dart SDK**: 3.13.0 or higher
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **VS Code** with Flutter extension (recommended)
- **Backend API**: RepUps Node.js backend running on `http://localhost:5001`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd flutter_app
flutter pub get
```

### 2. Run the Backend API

The Flutter app requires the RepUps backend to be running:

```bash
cd ../server
npm install
npm start
# Backend will run on http://localhost:5001
```

### 3. Run the Flutter App

#### **Web (Chrome)**

```bash
flutter run -d chrome --web-port=3000 --dart-define=API_BASE_URL=http://localhost:5001
```

#### **Android Emulator**

The Android emulator cannot access `localhost` on your machine. Use `10.0.2.2` instead:

```bash
# Start Android emulator from Android Studio
flutter emulators --launch <emulator_id>

# Run the app
flutter run -d <device_id> --dart-define=API_BASE_URL=http://10.0.2.2:5001
```

**Note**: `10.0.2.2` is the special alias to your host loopback interface from the Android emulator.

#### **Physical Android Device (via USB)**

For a physical device connected via USB on the same network:

```bash
# Find your local IP address
# Windows: ipconfig
# Mac/Linux: ifconfig

# Run with your local IP
flutter run -d <device_id> --dart-define=API_BASE_URL=http://192.168.1.X:5001
```

Replace `192.168.1.X` with your actual local IP address.

#### **iOS Simulator (macOS only)**

```bash
flutter run -d iphone --dart-define=API_BASE_URL=http://localhost:5001
```

#### **Physical iOS Device**

```bash
# Use your local IP address
flutter run -d <device_id> --dart-define=API_BASE_URL=http://192.168.1.X:5001
```

## 🔧 Development Setup

### VS Code Configuration

Recommended VS Code extensions:

- Flutter
- Dart
- Dart Data Class Generator
- Flutter Intl
- Error Lens

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Flutter (Web)",
      "request": "launch",
      "type": "dart",
      "program": "lib/main.dart",
      "args": [
        "-d",
        "chrome",
        "--web-port=3000",
        "--dart-define=API_BASE_URL=http://localhost:5001"
      ]
    },
    {
      "name": "Flutter (Android Emulator)",
      "request": "launch",
      "type": "dart",
      "program": "lib/main.dart",
      "args": [
        "--dart-define=API_BASE_URL=http://10.0.2.2:5001"
      ]
    },
    {
      "name": "Flutter (iOS Simulator)",
      "request": "launch",
      "type": "dart",
      "program": "lib/main.dart",
      "args": [
        "-d",
        "iphone",
        "--dart-define=API_BASE_URL=http://localhost:5001"
      ]
    }
  ]
}
```

### Android Studio Configuration

1. Open `flutter_app` in Android Studio
2. Edit Run Configuration
3. Add to **Additional run args**: `--dart-define=API_BASE_URL=http://10.0.2.2:5001`

## 📱 Platform-Specific Setup

### Android

#### Camera Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.autofocus" />
```

#### Network Configuration (for API access)

Add to `android/app/src/main/AndroidManifest.xml` inside `<application>`:

```xml
<application android:usesCleartextTraffic="true">
```

#### Minimum SDK Version

Ensure `android/app/build.gradle` has:

```gradle
android {
    defaultConfig {
        minSdkVersion 21
    }
}
```

### iOS

#### Camera Permissions

Add to `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>RepUps needs camera access for workout tracking and posture assessment</string>
<key>NSMicrophoneUsageDescription</key>
<string>RepUps needs microphone access for voice guidance during workouts</string>
```

#### Network Configuration

Add to `ios/Runner/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## 🧪 Testing

### Run Unit Tests

```bash
flutter test
```

### Run Integration Tests

```bash
flutter test integration_test
```

### Run Tests with Coverage

```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

## 🏗️ Building

### Debug Build (Android)

```bash
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:5001
```

### Release Build (Android)

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.repups.com
```

### App Bundle (Android - for Play Store)

```bash
flutter build appbundle --release --dart-define=API_BASE_URL=https://api.repups.com
```

### iOS Build

```bash
flutter build ios --release --dart-define=API_BASE_URL=https://api.repups.com
```

### Web Build

```bash
flutter build web --release --dart-define=API_BASE_URL=https://api.repups.com
```

## 🔑 API Configuration

The app uses `--dart-define` for API configuration:

- **Default (Development)**: `/api` (relative URL for same-origin requests)
- **Custom Backend**: `--dart-define=API_BASE_URL=http://localhost:5001`
- **Production**: `--dart-define=API_BASE_URL=https://api.repups.com`

The API base URL is configured in `lib/core/config/app_config.dart`.

## 💳 Payment Integration (Razorpay)

### Test Mode Configuration

Add to run arguments:

```bash
--dart-define=RAZORPAY_KEY_ID=rzp_test_your_key_id
```

### Production Configuration

Add to run arguments:

```bash
--dart-define=RAZORPAY_KEY_ID=rzp_live_your_key_id
```

### Setup Razorpay

1. Create account at [razorpay.com](https://razorpay.com)
2. Get API keys from Dashboard → Settings → API Keys
3. Add keys to environment variables or pass via `--dart-define`

## 🎨 Assets

Assets are located in:

- **Images**: `lib/assets/images/`
- **Icons**: `lib/assets/icons/`
- **Fonts**: `lib/assets/fonts/`

To add new assets:

1. Place files in appropriate directory
2. Update `pubspec.yaml`:

```yaml
flutter:
  assets:
    - assets/images/
    - assets/icons/
```

## 📦 Dependencies

### Core Dependencies

- `flutter_riverpod`: ^2.4.9 - State management
- `go_router`: ^12.1.3 - Navigation and routing
- `dio`: ^5.3.2 - HTTP client
- `shared_preferences`: ^2.2.2 - Local data persistence

### Camera & ML

- `camera`: ^0.10.5+5 - Camera access
- `google_mlkit_pose_detection`: ^0.10.0 - Pose detection

### UI & Utils

- `flutter_svg`: ^2.0.9 - SVG rendering
- `intl`: ^0.18.1 - Internationalization
- `url_launcher`: ^6.2.1 - URL launching

### Real-time

- `socket_io_client`: ^2.0.3+1 - WebSocket communication

See `pubspec.yaml` for complete list.

## 🐛 Troubleshooting

### Camera Not Working

1. Check permissions in `AndroidManifest.xml` and `Info.plist`
2. On Android emulator, use a device with camera support
3. Physical devices work better for camera features

### API Connection Failed

1. Ensure backend is running: `cd server && npm start`
2. Check `API_BASE_URL` is correctly configured
3. For Android emulator, use `10.0.2.2` instead of `localhost`
4. For physical devices, use your local IP address
5. Check firewall settings allow connections on port 5001

### Build Errors

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter pub upgrade
flutter run
```

### Hot Reload Not Working

```bash
# Hot restart (R key in terminal)
# Or run with:
flutter run --no-fast-start
```

## 📚 Architecture

```
lib/
├── core/
│   ├── config/         # App configuration
│   ├── routing/        # go_router configuration
│   ├── theme/          # App theme
│   ├── errors/         # Error handling
│   └── constants/      # App constants
├── features/
│   └── auth/           # Authentication feature
│       ├── models/     # User models
│       └── providers/  # Riverpod providers
├── models/             # Shared data models
├── screens/            # App screens
├── services/           # API and services
│   ├── api_client.dart # HTTP client
│   └── socket_service.dart # WebSocket
├── shared/             # Shared widgets
└── main.dart           # App entry point
```

## 🔗 Related Documentation

- [Migration Status](./MIGRATION_STATUS.md) - Detailed migration progress
- [React Frontend](../client/README.md) - Original React app
- [Backend API](../server/README.md) - Node.js backend

## 📝 Development Workflow

1. **Check migration status**: Review `MIGRATION_STATUS.md`
2. **Create feature branch**: `git checkout -b feature/workout-camera`
3. **Implement feature**: Follow existing patterns
4. **Test thoroughly**: Unit + integration tests
5. **Update status**: Mark routes complete in `MIGRATION_STATUS.md`
6. **Code review**: Submit PR with migration notes

## 🚀 Deployment

### Web Deployment

```bash
flutter build web --release --dart-define=API_BASE_URL=https://api.repups.com
# Deploy the build/web directory to your hosting provider
```

### Android Play Store

```bash
flutter build appbundle --release --dart-define=API_BASE_URL=https://api.repups.com
# Upload the build/app/outputs/bundle/release/app-release.aab to Play Console
```

### iOS App Store

```bash
flutter build ios --release --dart-define=API_BASE_URL=https://api.repups.com
# Open ios/Runner.xcworkspace in Xcode and archive
```

## 📞 Support

For issues related to:

- **Flutter Migration**: Check `MIGRATION_STATUS.md` and GitHub issues
- **Backend API**: See `server/README.md`
- **React Frontend**: See `client/README.md`

## 📄 License

[Your License Here]

---

**Last Updated**: August 20, 2026  
**Flutter Version**: 3.47.0  
**Migration Progress**: 7%