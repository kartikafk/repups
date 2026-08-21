import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';

class WorkoutCameraScreen extends ConsumerStatefulWidget {
  const WorkoutCameraScreen({super.key});

  @override
  ConsumerState<WorkoutCameraScreen> createState() => _WorkoutCameraScreenState();
}

class _WorkoutCameraScreenState extends ConsumerState<WorkoutCameraScreen> {
  bool _isRecording = false;
  int _repCount = 0;
  double _formScore = 0.0;
  String _currentPhase = 'Ready';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Camera Preview (Placeholder)
            _buildCameraPreview(),
            
            // Overlay UI
            Column(
              children: [
                _buildTopBar(),
                const Spacer(),
                _buildBottomControls(),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCameraPreview() {
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.videocam_outlined,
              size: 80,
              color: Colors.grey.shade700,
            ),
            const SizedBox(height: 16),
            Text(
              'Camera Preview',
              style: TextStyle(
                color: Colors.grey.shade700,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Enable camera permission',
              style: TextStyle(
                color: Colors.grey.shade800,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withOpacity(0.7),
            Colors.transparent,
          ],
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => _showExitDialog(),
                icon: const Icon(Icons.close, color: Colors.white, size: 28),
              ),
              Expanded(
                child: Column(
                  children: [
                    Text(
                      _currentPhase,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_isRecording)
                      Text(
                        'Set in progress...',
                        style: TextStyle(
                          color: Colors.grey.shade400,
                          fontSize: 14,
                        ),
                      ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _toggleCamera(),
                icon: const Icon(Icons.cameraswitch, color: Colors.white, size: 28),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildStatsRow(),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildStatCard('Reps', _repCount.toString(), AppTheme.primaryBlue),
        _buildStatCard('Form', '${(_formScore * 100).toInt()}%', 
          _formScore >= 0.8 ? Colors.green : _formScore >= 0.6 ? Colors.orange : Colors.red),
        _buildStatCard('Phase', _currentPhase, Colors.purple),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5), width: 2),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade400,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withOpacity(0.7),
            Colors.transparent,
          ],
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Form Issues (if any)
          if (_isRecording && _formScore < 0.8) _buildFormIssues(),
          
          const SizedBox(height: 16),
          
          // Main Control Button
          GestureDetector(
            onTap: _toggleRecording,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isRecording ? Colors.red : AppTheme.primaryBlue,
                boxShadow: [
                  BoxShadow(
                    color: (_isRecording ? Colors.red : AppTheme.primaryBlue).withOpacity(0.5),
                    blurRadius: 20,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: Icon(
                _isRecording ? Icons.stop : Icons.play_arrow,
                color: Colors.white,
                size: 40,
              ),
            ),
          ),
          
          const SizedBox(height: 12),
          
          Text(
            _isRecording ? 'Stop Set' : 'Start Set',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormIssues() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange, width: 2),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber, color: Colors.orange, size: 20),
          const SizedBox(width: 8),
          const Expanded(
            child: Text(
              'Keep your back straight',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _toggleRecording() {
    setState(() {
      _isRecording = !_isRecording;
      if (_isRecording) {
        _startWorkout();
      } else {
        _endWorkout();
      }
    });
  }

  void _startWorkout() {
    // TODO: Implement camera and pose tracking
    // - Start camera stream
    // - Initialize pose detection
    // - Begin rep counting
    // - Monitor form in real-time
    
    // Simulate workout progress
    Future.delayed(const Duration(seconds: 2), () {
      if (_isRecording && mounted) {
        setState(() {
          _repCount++;
          _formScore = 0.85;
          _currentPhase = 'Descending';
        });
      }
    });
  }

  void _endWorkout() {
    // The report screen persists this payload through the same POST /sessions
    // contract used by the React ReportView.
    context.go('/report', extra: {
      'repCount': _repCount,
      'avgScore': (_formScore * 100).round(),
      'avgRom': 0,
      'consistency': 0,
      'avgTempo': const {'ecc': 0, 'pause': 0, 'con': 0},
      'topIssues': const [],
      'exercise': 'Squat',
    });
  }

  void _toggleCamera() {
    // TODO: Switch between front and back camera
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Camera switch coming soon')),
    );
  }

  void _showExitDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.cardColor,
        title: const Text(
          'Exit Workout?',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Your current set will not be saved.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.pop();
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Exit'),
          ),
        ],
      ),
    );
  }
}
