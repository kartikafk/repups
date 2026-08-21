enum UserRole { client, trainer, admin }

class User {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? photoUrl;
  final DateTime? createdAt;
  final Map<String, dynamic>? metadata;
  
  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.photoUrl,
    this.createdAt,
    this.metadata,
  });
  
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: _parseRole(json['role'] ?? json['userType']),
      photoUrl: json['photoUrl'] ?? json['profilePicture'],
      createdAt: json['createdAt'] != null 
          ? DateTime.tryParse(json['createdAt']) 
          : null,
      metadata: json['metadata'] ?? {},
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'role': role.name,
      if (photoUrl != null) 'photoUrl': photoUrl,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
    };
  }
  
  static UserRole _parseRole(String? roleString) {
    switch (roleString?.toLowerCase()) {
      case 'trainer':
        return UserRole.trainer;
      case 'admin':
        return UserRole.admin;
      case 'client':
      default:
        return UserRole.client;
    }
  }
  
  User copyWith({
    String? id,
    String? name,
    String? email,
    UserRole? role,
    String? photoUrl,
    DateTime? createdAt,
    Map<String, dynamic>? metadata,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      photoUrl: photoUrl ?? this.photoUrl,
      createdAt: createdAt ?? this.createdAt,
      metadata: metadata ?? this.metadata,
    );
  }
  
  /// Get user initials for avatar
  String get initials {
    final parts = name.split(' ').where((part) => part.isNotEmpty);
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }
  
  /// Get first name
  String get firstName {
    final parts = name.split(' ').where((part) => part.isNotEmpty);
    return parts.isNotEmpty ? parts.first : 'User';
  }
  
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User && runtimeType == other.runtimeType && id == other.id;
  
  @override
  int get hashCode => id.hashCode;
  
  @override
  String toString() => 'User(id: $id, name: $name, email: $email, role: $role)';
}