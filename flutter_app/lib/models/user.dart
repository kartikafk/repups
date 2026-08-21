class User {
  final String id;
  final String name;
  final String email;
  final String? photoUrl;
  final String role; // 'client' or 'trainer'
  
  User({
    required this.id,
    required this.name,
    required this.email,
    this.photoUrl,
    required this.role,
  });
  
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      photoUrl: json['photoUrl'],
      role: json['role'] ?? 'client',
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'photoUrl': photoUrl,
      'role': role,
    };
  }
  
  String get firstName => name.split(' ').first;
  
  String get initials {
    final parts = name.split(' ').where((p) => p.isNotEmpty).take(2).toList();
    if (parts.isEmpty) return '?';
    return parts.map((p) => p[0].toUpperCase()).join();
  }
}

class WorkoutSession {
  final String? id;
  final String exercise;
  final int repCount;
  final double avgScore;
  final String date;
  final double? weight;
  
  WorkoutSession({
    this.id,
    required this.exercise,
    required this.repCount,
    required this.avgScore,
    required this.date,
    this.weight,
  });
  
  factory WorkoutSession.fromJson(Map<String, dynamic> json) {
    return WorkoutSession(
      id: json['_id'] ?? json['id'],
      exercise: json['exercise'] ?? '',
      repCount: json['repCount'] ?? 0,
      avgScore: (json['avgScore'] ?? 0).toDouble(),
      date: json['date'] ?? '',
      weight: json['weight']?.toDouble(),
    );
  }
}

class PostureRecord {
  final String? id;
  final double overallScore;
  final Map<String, dynamic>? details;
  
  PostureRecord({
    this.id,
    required this.overallScore,
    this.details,
  });
  
  factory PostureRecord.fromJson(Map<String, dynamic> json) {
    return PostureRecord(
      id: json['_id'] ?? json['id'],
      overallScore: (json['overallScore'] ?? 0).toDouble(),
      details: json['details'],
    );
  }
}

class WorkoutPlan {
  final String id;
  final String name;
  final String? goal;
  final List<dynamic> days;
  
  WorkoutPlan({
    required this.id,
    required this.name,
    this.goal,
    required this.days,
  });
  
  factory WorkoutPlan.fromJson(Map<String, dynamic> json) {
    return WorkoutPlan(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      goal: json['goal'],
      days: json['days'] ?? [],
    );
  }
}

class Trainer {
  final String id;
  final String name;
  final String? photoUrl;
  final String? gym;
  final String? location;
  final List<String>? specialties;
  
  Trainer({
    required this.id,
    required this.name,
    this.photoUrl,
    this.gym,
    this.location,
    this.specialties,
  });
  
  factory Trainer.fromJson(Map<String, dynamic> json) {
    return Trainer(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      photoUrl: json['photoUrl'],
      gym: json['gym'],
      location: json['location'],
      specialties: json['specialties'] != null 
        ? List<String>.from(json['specialties'])
        : null,
    );
  }
}
