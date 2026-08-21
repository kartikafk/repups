abstract class AppException implements Exception {
  const AppException(this.message, this.statusCode);
  
  final String message;
  final int? statusCode;
  
  @override
  String toString() => message;
}

class NetworkException extends AppException {
  const NetworkException([String message = 'Network error occurred'])
      : super(message, null);
}

class ServerException extends AppException {
  const ServerException(String message, int statusCode)
      : super(message, statusCode);
}

class AuthException extends AppException {
  const AuthException([String message = 'Authentication failed'])
      : super(message, 401);
}

class ValidationException extends AppException {
  const ValidationException([String message = 'Validation failed'])
      : super(message, 400);
}

class NotFoundException extends AppException {
  const NotFoundException([String message = 'Resource not found'])
      : super(message, 404);
}

class PermissionException extends AppException {
  const PermissionException([String message = 'Permission denied'])
      : super(message, 403);
}

class CacheException extends AppException {
  const CacheException([String message = 'Cache operation failed'])
      : super(message, null);
}

/// Utility to convert API errors to app exceptions
class ExceptionHandler {
  static AppException handleError(dynamic error, int? statusCode) {
    if (error is AppException) return error;
    
    switch (statusCode) {
      case 400:
        return ValidationException(error.toString());
      case 401:
        return const AuthException();
      case 403:
        return const PermissionException();
      case 404:
        return const NotFoundException();
      default:
        if (statusCode != null && statusCode >= 500) {
          return ServerException(error.toString(), statusCode);
        }
        if (statusCode == null) {
          return NetworkException(error.toString());
        }
        return ServerException(error.toString(), statusCode);
    }
  }
  
  /// Get user-friendly error message
  static String getUserMessage(AppException exception) {
    switch (exception.runtimeType) {
      case NetworkException:
        return 'Please check your internet connection and try again.';
      case AuthException:
        return 'Please sign in again to continue.';
      case PermissionException:
        return 'You don\'t have permission to perform this action.';
      case NotFoundException:
        return 'The requested information could not be found.';
      case ValidationException:
        return exception.message.isNotEmpty 
            ? exception.message 
            : 'Please check your input and try again.';
      case ServerException:
        return exception.statusCode! >= 500
            ? 'Server error occurred. Please try again later.'
            : exception.message;
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}