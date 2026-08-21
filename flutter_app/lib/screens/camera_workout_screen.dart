import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../models/exercise.dart';

class CameraWorkoutScreen extends StatefulWidget {
  final WorkoutSet? workoutSet;
  
  const CameraWorkoutScreen({Key? key, this.workoutSet}) : super(key: key);

  @override
  State<CameraWorkoutScreen> createState() => _CameraWorkoutScreenState();
}

class _CameraWorkoutScreenState extends State<CameraWorkoutScreen> {
  bool _isWorkoutActive = false;
  int _repCount = 0;
  late int _targetReps;
  late String _exerciseName;
  double _formScore = 85.0;

  @override
  void initState() {
    super.initState();
    // Use workoutSet data if provided, otherwise use defaults
    _targetReps = widget.workoutSet?.targetReps ?? 12;
    _exerciseName = widget.workoutSet?.exercise.name ?? 'Push-ups';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Camera placeholder
            _buildCameraPlaceholder(),
            
            // Top bar
            _buildTopBar(),
            
            // Workout stats
            if (_isWorkoutActive) _buildWorkoutStats(),
            
            // Controls
            _buildControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildCameraPlaceholder() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.grey[900],
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.videocam,
              size: 80,
              color: AppColors.textMuted,
            ),
            SizedBox(height: 16),
            Text(
              'Camera View',
              style: TextStyle(
                fontSize: 18,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Real camera integration will be added here',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textDim,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
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
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.close, color: Colors.white, size: 28),
            ),
            Text(
              _exerciseName.toUpperCase(),
              style: const TextStyle(
                fontFamily: 'Syne',
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                letterSpacing: 1,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.neon.withOpacity(0.2),
                border: Border.all(color: AppColors.neon),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Set 1',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.neon,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkoutStats() {
    return Positioned(
      top: 80,
      left: 16,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.7),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.neon.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  '$_repCount',
                  style: const TextStyle(
                    fontFamily: 'Syne',
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                    color: AppColors.neon,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '/ $_targetReps',
                  style: const TextStyle(
                    fontSize: 20,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Form: ${_formScore.toStringAsFixed(0)}%',
              style: TextStyle(
                fontSize: 14,
                color: _formScore > 80 
                    ? AppColors.neon 
                    : _formScore > 60 
                        ? AppColors.warning 
                        : AppColors.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControls() {
    return Positioned(
      bottom: 40,
      left: 0,
      right: 0,
      child: Column(
        children: [
          // Instructions
          if (!_isWorkoutActive)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 32),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text(
                    _exerciseName,
                    style: const TextStyle(
                      fontFamily: 'Syne',
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Target: $_targetReps reps',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.neon,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.workoutSet?.exercise.instructions.first ?? 
                    'Keep your body in a straight line from head to heels',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          const SizedBox(height: 20),
          // Control buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Start/Pause button
              FloatingActionButton(
                onPressed: _toggleWorkout,
                backgroundColor: _isWorkoutActive ? AppColors.warning : AppColors.neon,
                child: Icon(
                  _isWorkoutActive ? Icons.pause : Icons.play_arrow,
                  color: Colors.black,
                  size: 32,
                ),
              ),
              
              // Rep counter (manual for demo)
              if (_isWorkoutActive)
                FloatingActionButton(
                  onPressed: _addRep,
                  backgroundColor: AppColors.neon,
                  child: const Icon(
                    Icons.add,
                    color: Colors.black,
                    size: 32,
                  ),
                ),
              
              // Complete set button
              if (_isWorkoutActive)
                FloatingActionButton(
                  onPressed: _completeSet,
                  backgroundColor: AppColors.success,
                  child: const Icon(
                    Icons.check,
                    color: Colors.black,
                    size: 32,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  void _toggleWorkout() {
    setState(() {
      _isWorkoutActive = !_isWorkoutActive;
    });
  }

  void _addRep() {
    setState(() {
      _repCount++;
      // Simulate form score variation
      _formScore = 75 + (25 * (0.5 + 0.5 * (_repCount % 3) / 3));
      
      if (_repCount >= _targetReps) {
        _completeSet();
      }
    });
  }

  void _completeSet() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text(
          'Set Complete!',
          style: TextStyle(
            fontFamily: 'Syne',
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w800,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$_repCount / $_targetReps reps',
              style: const TextStyle(
                fontSize: 16,
                color: AppColors.neon,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Average form: ${_formScore.toStringAsFixed(0)}%',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: const Text(
              'Done',
              style: TextStyle(color: AppColors.neon),
            ),
          ),
        ],
      ),
    );
  }
}