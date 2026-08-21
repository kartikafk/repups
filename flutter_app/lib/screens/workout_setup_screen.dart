import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../models/exercise.dart';
import 'camera_workout_screen.dart';

class WorkoutSetupScreen extends StatefulWidget {
  const WorkoutSetupScreen({Key? key}) : super(key: key);

  @override
  State<WorkoutSetupScreen> createState() => _WorkoutSetupScreenState();
}

class _WorkoutSetupScreenState extends State<WorkoutSetupScreen> {
  Exercise? _selectedExercise;
  int _targetReps = 10;
  double _targetWeight = 0.0;
  
  @override
  void initState() {
    super.initState();
    _selectedExercise = ExerciseLibrary.exercises.first;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back, color: AppColors.textMuted),
                  ),
                  const Expanded(
                    child: Text(
                      'Setup Workout',
                      style: TextStyle(
                        fontFamily: 'Syne',
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),
              
              // Exercise Selection
              const Text(
                'Choose Exercise',
                style: TextStyle(
                  fontFamily: 'Syne',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              
              const SizedBox(height: 16),
              
              ...ExerciseLibrary.exercises.map((exercise) {
                final isSelected = _selectedExercise?.id == exercise.id;
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        setState(() {
                          _selectedExercise = exercise;
                        });
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: isSelected 
                              ? AppColors.neon.withOpacity(0.1)
                              : AppColors.surface,
                          border: Border.all(
                            color: isSelected 
                                ? AppColors.neon 
                                : AppColors.border,
                            width: isSelected ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    exercise.name,
                                    style: TextStyle(
                                      fontFamily: 'Syne',
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: isSelected 
                                          ? AppColors.neon 
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                if (isSelected)
                                  Icon(
                                    Icons.check_circle,
                                    color: AppColors.neon,
                                    size: 24,
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              exercise.description,
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textMuted,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Target: ${exercise.targetMuscles}',
                              style: TextStyle(
                                fontSize: 12,
                                color: isSelected 
                                    ? AppColors.neon.withOpacity(0.8)
                                    : AppColors.textDim,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
              
              const SizedBox(height: 24),
              
              // Configuration
              const Text(
                'Set Configuration',
                style: TextStyle(
                  fontFamily: 'Syne',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Target Reps
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Target Reps',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '$_targetReps',
                          style: const TextStyle(
                            fontFamily: 'Syne',
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: AppColors.neon,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildAdjustButton(
                          Icons.remove,
                          () {
                            if (_targetReps > 1) {
                              setState(() {
                                _targetReps--;
                              });
                            }
                          },
                        ),
                        Expanded(
                          child: Slider(
                            value: _targetReps.toDouble(),
                            min: 1,
                            max: 30,
                            divisions: 29,
                            activeColor: AppColors.neon,
                            inactiveColor: AppColors.border,
                            onChanged: (value) {
                              setState(() {
                                _targetReps = value.round();
                              });
                            },
                          ),
                        ),
                        _buildAdjustButton(
                          Icons.add,
                          () {
                            if (_targetReps < 30) {
                              setState(() {
                                _targetReps++;
                              });
                            }
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Target Weight (optional)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Weight (kg)',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          _targetWeight > 0 
                              ? '${_targetWeight.toStringAsFixed(1)} kg'
                              : 'Bodyweight',
                          style: const TextStyle(
                            fontFamily: 'Syne',
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.neon,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildAdjustButton(
                          Icons.remove,
                          () {
                            if (_targetWeight > 0) {
                              setState(() {
                                _targetWeight = (_targetWeight - 2.5).clamp(0.0, 200.0);
                              });
                            }
                          },
                        ),
                        Expanded(
                          child: Slider(
                            value: _targetWeight,
                            min: 0,
                            max: 200,
                            divisions: 80,
                            activeColor: AppColors.neon,
                            inactiveColor: AppColors.border,
                            onChanged: (value) {
                              setState(() {
                                _targetWeight = (value / 2.5).round() * 2.5;
                              });
                            },
                          ),
                        ),
                        _buildAdjustButton(
                          Icons.add,
                          () {
                            if (_targetWeight < 200) {
                              setState(() {
                                _targetWeight = (_targetWeight + 2.5).clamp(0.0, 200.0);
                              });
                            }
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const Spacer(),
              
              // Start Workout Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _selectedExercise != null ? _startWorkout : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.neon,
                    foregroundColor: AppColors.bg,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.play_circle_filled, size: 24),
                      const SizedBox(width: 8),
                      Text(
                        'Start ${_selectedExercise?.name ?? 'Workout'}',
                        style: const TextStyle(
                          fontFamily: 'Syne',
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildAdjustButton(IconData icon, VoidCallback onPressed) {
    return Container(
      width: 40,
      height: 40,
      margin: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.neon.withOpacity(0.1),
        border: Border.all(color: AppColors.neon.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: IconButton(
        onPressed: onPressed,
        icon: Icon(icon, color: AppColors.neon, size: 20),
        padding: EdgeInsets.zero,
      ),
    );
  }
  
  void _startWorkout() {
    if (_selectedExercise == null) return;
    
    final workoutSet = WorkoutSet(
      exercise: _selectedExercise!,
      targetReps: _targetReps,
      targetWeight: _targetWeight,
      setNumber: 1,
    );
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CameraWorkoutScreen(workoutSet: workoutSet),
      ),
    );
  }
}