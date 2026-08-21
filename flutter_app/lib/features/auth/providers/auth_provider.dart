import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../services/api_client.dart';
import '../../../core/errors/app_exception.dart';
import '../models/user.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;
  
  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });
  
  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
  
  AuthState clearError() => copyWith(error: null);
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;
  
  AuthNotifier(this._apiClient) : super(const AuthState()) {
    _initializeAuth();
  }
  
  Future<void> _initializeAuth() async {
    state = state.copyWith(isLoading: true);
    
    try {
      // Check if we have a stored token
      final token = await _apiClient.getToken();
      if (token != null) {
        // Try to get current user to validate token
        final response = await _apiClient.getCurrentUser();
        final user = User.fromJson(response['user'] ?? response);
        
        state = AuthState(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      // Token invalid or network error - clear stored data
      await _apiClient.clearToken();
      state = state.copyWith(isLoading: false);
    }
  }
  
  Future<void> signIn(String email, String password, {String role = 'client'}) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final response = await _apiClient.signIn(email, password, role: role);
      final user = User.fromJson({...response['user'] ?? response, 'role': role});
      
      state = AuthState(
        user: user,
        isAuthenticated: true,
        isLoading: false,
      );
    } on AppException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ExceptionHandler.getUserMessage(e),
      );
      rethrow;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred. Please try again.',
      );
      rethrow;
    }
  }
  
  Future<void> signUp(Map<String, dynamic> userData) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final response = await _apiClient.signUp(userData);
      final requestedRole = userData['role']?.toString() ?? 'client';
      final user = User.fromJson({...response['user'] ?? response, 'role': requestedRole});
      
      state = AuthState(
        user: user,
        isAuthenticated: true,
        isLoading: false,
      );
    } on AppException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ExceptionHandler.getUserMessage(e),
      );
      rethrow;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to create account. Please try again.',
      );
      rethrow;
    }
  }

  Future<void> signInAdmin(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.adminSignIn(email, password);
      final user = User.fromJson({...response['user'] ?? response['admin'] ?? response, 'role': 'admin'});
      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
    } on AppException catch (e) {
      state = state.copyWith(isLoading: false, error: ExceptionHandler.getUserMessage(e));
      rethrow;
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Unable to sign in as admin.');
      rethrow;
    }
  }
  
  Future<void> signOut() async {
    state = state.copyWith(isLoading: true);
    
    try {
      await _apiClient.signOut();
    } catch (e) {
      // Continue with logout even if server request fails
    }
    
    state = const AuthState(isLoading: false);
  }
  
  Future<void> refreshUser() async {
    if (!state.isAuthenticated) return;
    
    try {
      final response = await _apiClient.getCurrentUser();
      final user = User.fromJson(response['user'] ?? response);
      
      state = state.copyWith(user: user);
    } catch (e) {
      // If refresh fails, user might need to re-authenticate
      if (e is AuthException) {
        await signOut();
      }
    }
  }
  
  void clearError() {
    state = state.clearError();
  }
}

// Providers
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(apiClientProvider));
});

// Convenience providers
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

final userRoleProvider = Provider<UserRole?>((ref) {
  return ref.watch(authProvider).user?.role;
});
