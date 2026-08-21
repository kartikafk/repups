// Remove google_mlkit_pose_detection dependency for now
// import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

class Exercise {
  final String id;
  final String name;
  final String description;
  final List<String> instructions;
  final String targetMuscles;
  final ExerciseType type;
  
  Exercise({
    required this.id,
    required this.name,
    required this.description,
    required this.instructions,
    required this.targetMuscles,
    required this.type,
  });
}

enum ExerciseType {
  squat,
  pushup,
  deadlift,
  benchPress,
  pullup,
  lunge,
  plank,
}

class WorkoutSet {
  final Exercise exercise;
  final int targetReps;
  final double targetWeight;
  final int setNumber;
  
  WorkoutSet({
    required this.exercise,
    required this.targetReps,
    required this.targetWeight,
    required this.setNumber,
  });
}

class RepCountResult {
  final int repCount;
  final double formScore;
  final List<double> formScores;
  final Duration duration;
  final List<String> formFeedback;
  
  RepCountResult({
    required this.repCount,
    required this.formScore,
    required this.formScores,
    required this.duration,
    required this.formFeedback,
  });
}

// Exercise library
class ExerciseLibrary {
  static final List<Exercise> exercises = [
    Exercise(
      id: 'squat',
      name: 'Squat',
      description: 'A fundamental lower body exercise',
      instructions: [
        'Stand with feet shoulder-width apart',
        'Keep your back straight and chest up',
        'Lower down by bending your knees',
        'Go down until thighs are parallel to floor',
        'Push through your heels to return up',
      ],
      targetMuscles: 'Quadriceps, Glutes, Hamstrings',
      type: ExerciseType.squat,
    ),
    Exercise(
      id: 'pushup',
      name: 'Push-up',
      description: 'Upper body strength exercise',
      instructions: [
        'Start in plank position',
        'Keep body in straight line',
        'Lower chest towards floor',
        'Push back up to starting position',
      ],
      targetMuscles: 'Chest, Shoulders, Triceps',
      type: ExerciseType.pushup,
    ),
    Exercise(
      id: 'deadlift',
      name: 'Deadlift',
      description: 'Full body compound movement',
      instructions: [
        'Stand with feet hip-width apart',
        'Bend at hips and knees to grip bar',
        'Keep back straight and chest up',
        'Lift by extending hips and knees',
        'Stand tall, then lower with control',
      ],
      targetMuscles: 'Hamstrings, Glutes, Back',
      type: ExerciseType.deadlift,
    ),
  ];
  
  static Exercise? getExercise(String id) {
    try {
      return exercises.firstWhere((ex) => ex.id == id);
    } catch (e) {
      return null;
    }
  }
}

// Pose analysis for rep counting - simplified without ML Kit
class PoseAnalyzer {
  // Placeholder for future implementation
  static RepAnalysis analyzeSquat(dynamic pose) {
    return RepAnalysis(
      isValidPose: true,
      repPhase: RepPhase.middle,
      formScore: 80.0,
      feedback: ['Pose analysis coming soon'],
    );
  }
  
  static RepAnalysis analyzePushup(dynamic pose) {
    return RepAnalysis(
      isValidPose: true,
      repPhase: RepPhase.middle,
      formScore: 85.0,
      feedback: ['Pose analysis coming soon'],
    );
  }
}

enum RepPhase {
  top,
  middle,
  bottom,
  invalid,
}

class RepAnalysis {
  final bool isValidPose;
  final RepPhase repPhase;
  final double formScore;
  final List<String> feedback;
  final double? kneeAngle;
  final double? elbowAngle;
  final double? hipHeight;
  
  RepAnalysis({
    required this.isValidPose,
    required this.repPhase,
    required this.formScore,
    required this.feedback,
    this.kneeAngle,
    this.elbowAngle,
    this.hipHeight,
  });
}