import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config/app_config.dart';
import '../core/errors/app_exception.dart';

class ApiClient {
  late final Dio _dio;
  SharedPreferences? _prefs;

  // Singleton pattern
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.apiTimeout,
      receiveTimeout: AppConfig.apiTimeout,
      sendTimeout: AppConfig.uploadTimeout,
      validateStatus: (status) => status != null && status < 500,
    ));

    _setupInterceptors();
  }

  void _setupInterceptors() {
    // Request interceptor for auth headers
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        // Log requests in debug mode only
        if (AppConfig.isDebug) {
          print('🚀 ${options.method} ${options.path}');
          if (options.data != null) {
            print('📦 Request body: ${options.data}');
          }
        }

        handler.next(options);
      },
      onResponse: (response, handler) {
        if (AppConfig.isDebug) {
          print('✅ ${response.statusCode} ${response.requestOptions.path}');
        }
        handler.next(response);
      },
      onError: (error, handler) {
        if (AppConfig.isDebug) {
          print('❌ ${error.response?.statusCode} ${error.requestOptions.path}');
          print('Error: ${error.message}');
        }
        handler.next(error);
      },
    ));
  }

  // Initialize SharedPreferences if needed
  Future<void> _ensurePrefsInitialized() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // Token management (matching React implementation)
  Future<String?> getToken() async {
    await _ensurePrefsInitialized();
    return _prefs!.getString(AppConfig.tokenKey);
  }

  Future<void> saveToken(String token) async {
    await _ensurePrefsInitialized();
    await _prefs!.setString(AppConfig.tokenKey, token);
  }

  Future<void> clearToken() async {
    await _ensurePrefsInitialized();
    await _prefs!.remove(AppConfig.tokenKey);
    await _prefs!.remove(AppConfig.userKey);
  }

  // User data persistence
  Future<void> saveUser(Map<String, dynamic> userData) async {
    await _ensurePrefsInitialized();
    await _prefs!.setString(AppConfig.userKey, jsonEncode(userData));
  }

  Future<Map<String, dynamic>?> getStoredUser() async {
    await _ensurePrefsInitialized();
    final userJson = _prefs!.getString(AppConfig.userKey);
    if (userJson != null) {
      return jsonDecode(userJson);
    }
    return null;
  }

  /// Get active user ID (matching React getActiveUserId function)
  Future<String?> getActiveUserId() async {
    try {
      final userData = await getStoredUser();
      if (userData != null) {
        return userData['_id'] ?? userData['id'];
      }
    } catch (e) {
      if (AppConfig.isDebug) {
        print('Error getting user ID: $e');
      }
    }
    return null;
  }

  // Generic HTTP methods with proper error handling
  Future<T> _handleRequest<T>(Future<Response> request) async {
    try {
      final response = await request;

      if (response.statusCode == 401) {
        await clearToken(); // Clear invalid token
        throw const AuthException();
      }

      if (response.statusCode! >= 400) {
        final message = response.data is Map
            ? (response.data['error'] ??
                response.data['message'] ??
                'Request failed')
            : 'Request failed with status ${response.statusCode}';
        throw ExceptionHandler.handleError(message, response.statusCode);
      }

      return response.data as T;
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw const NetworkException();
      }

      final statusCode = e.response?.statusCode;
      final message = e.response?.data is Map
          ? (e.response!.data['error'] ??
              e.response!.data['message'] ??
              e.message)
          : (e.message ?? 'Network request failed');

      throw ExceptionHandler.handleError(message, statusCode);
    }
  }

  Future<T> get<T>(String endpoint, {Map<String, dynamic>? queryParameters}) {
    return _handleRequest<T>(
        _dio.get(endpoint, queryParameters: queryParameters));
  }

  Future<T> post<T>(String endpoint,
      {dynamic data, Map<String, dynamic>? queryParameters}) {
    return _handleRequest<T>(
        _dio.post(endpoint, data: data, queryParameters: queryParameters));
  }

  Future<T> put<T>(String endpoint, {dynamic data}) {
    return _handleRequest<T>(_dio.put(endpoint, data: data));
  }

  Future<T> patch<T>(String endpoint, {dynamic data}) {
    return _handleRequest<T>(_dio.patch(endpoint, data: data));
  }

  Future<T> delete<T>(String endpoint, {dynamic data}) {
    return _handleRequest<T>(_dio.delete(endpoint, data: data));
  }

  // Multipart file upload
  Future<T> uploadFile<T>(
    String endpoint,
    File file, {
    String fieldName = 'file',
    Map<String, dynamic>? additionalFields,
    ProgressCallback? onProgress,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(
        file.path,
        filename: file.path.split('/').last,
      ),
      if (additionalFields != null) ...additionalFields,
    });

    return _handleRequest<T>(_dio.post(
      endpoint,
      data: formData,
      onSendProgress: onProgress,
    ));
  }

  // ============ AUTH ENDPOINTS (matching React api.js) ============

  Future<Map<String, dynamic>> signIn(
    String email,
    String password, {
    String role = 'client',
  }) async {
    // React uses a separate trainer auth router. Keeping this distinction is
    // essential because a trainer JWT is issued by `/trainers/signin`.
    final endpoint = role == 'trainer' ? '/trainers/signin' : '/auth/signin';
    final response = await post<Map<String, dynamic>>(endpoint, data: {
      'email': email,
      'password': password,
    });

    if (response['token'] != null) {
      await saveToken(response['token']);
      if (response['user'] != null) {
        await saveUser({...response['user'], 'role': role});
      }
    }
    return response;
  }

  Future<Map<String, dynamic>> signUp(Map<String, dynamic> userData) async {
    final role = userData['role']?.toString() ?? 'client';
    final endpoint =
        role == 'trainer' ? '/trainers/register' : '/auth/register';
    final response = await post<Map<String, dynamic>>(endpoint, data: userData);

    if (response['token'] != null) {
      await saveToken(response['token']);
      if (response['user'] != null) {
        await saveUser({...response['user'], 'role': role});
      }
    }
    return response;
  }

  Future<void> signOut() async {
    try {
      await post('/auth/logout');
    } catch (e) {
      // Continue with local logout even if server request fails
    } finally {
      await clearToken();
    }
  }

  // ============ USER ENDPOINTS ============

  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await get<Map<String, dynamic>>('/me');
    if (response['user'] != null) {
      await saveUser(response['user']);
    }
    return response;
  }

  // ============ SESSION ENDPOINTS (matching React saveSession/fetchSessions) ============

  Future<List<dynamic>> getSessions({int limit = 100}) async {
    return await get<List<dynamic>>('/sessions',
        queryParameters: {'limit': limit});
  }

  Future<Map<String, dynamic>> saveSession(
      Map<String, dynamic> sessionData) async {
    // Session ownership taken from bearer token (matching React comment)
    return await post<Map<String, dynamic>>('/sessions', data: sessionData);
  }

  Future<Map<String, dynamic>> syncAssessmentRecord(
      Map<String, dynamic> payload) async {
    return await post<Map<String, dynamic>>('/sessions', data: payload);
  }

  // ============ WORKOUT PLAN ENDPOINTS ============

  Future<Map<String, dynamic>> getMyWorkoutPlans() async {
    return await get<Map<String, dynamic>>('/workout-plans/me');
  }

  // ============ POSTURE ENDPOINTS ============

  Future<Map<String, dynamic>> getLatestPosture(String userId) async {
    return await get<Map<String, dynamic>>('/posture/$userId/latest');
  }

  Future<Map<String, dynamic>> savePostureAssessment(
      Map<String, dynamic> data) async {
    return await post<Map<String, dynamic>>('/posture/save', data: data);
  }

  // ============ TRAINER ENDPOINTS ============

  Future<Map<String, dynamic>> getTrainerRequests() async {
    return await get<Map<String, dynamic>>('/client/trainer-requests');
  }

  Future<Map<String, dynamic>> getMyTrainer() async =>
      get<Map<String, dynamic>>('/client/trainer');

  Future<List<dynamic>> getTrainers() async {
    return await get<List<dynamic>>('/trainers');
  }

  Future<Map<String, dynamic>> getNearbyTrainers(
          {double? latitude, double? longitude}) =>
      get<Map<String, dynamic>>('/trainers/nearby', queryParameters: {
        if (latitude != null) 'lat': latitude,
        if (longitude != null) 'lng': longitude,
      });

  Future<Map<String, dynamic>> getClientTrainers({String? query}) =>
      get<Map<String, dynamic>>('/client/trainers',
          queryParameters:
              query == null || query.isEmpty ? null : {'q': query});

  Future<Map<String, dynamic>> getClientTrainerById(String trainerId) =>
      get<Map<String, dynamic>>('/client/trainers/$trainerId');

  Future<Map<String, dynamic>> getTrainerById(String trainerId) async {
    return await get<Map<String, dynamic>>('/trainers/$trainerId');
  }

  Future<Map<String, dynamic>> sendTrainerRequest(
      String trainerId, String message) async {
    return await post<Map<String, dynamic>>('/trainer-requests', data: {
      'trainerId': trainerId,
      'message': message,
    });
  }

  // ============ COMMUNITY ENDPOINTS ============

  Future<Map<String, dynamic>> getCommunityFeed() async {
    return await get<Map<String, dynamic>>('/community/feed');
  }

  Future<Map<String, dynamic>> getCommunityLeaderboard() async {
    return await get<Map<String, dynamic>>('/community/leaderboard');
  }

  Future<Map<String, dynamic>> getCommunityChallenges() async {
    return await get<Map<String, dynamic>>('/community/challenges');
  }

  Future<Map<String, dynamic>> challengeFriend(
          Map<String, dynamic> challengeData) =>
      post<Map<String, dynamic>>('/community/friend-challenges',
          data: challengeData);

  Future<Map<String, dynamic>> getFriendChallenges(String userId) =>
      get<Map<String, dynamic>>('/community/friend-challenges/$userId');

  Future<void> respondToFriendChallenge(
      String challengeId, String action) async {
    await post<Map<String, dynamic>>(
        '/community/friend-challenges/$challengeId/$action');
  }

  // ============ AI COACH ENDPOINTS ============

  Future<Map<String, dynamic>> chatWithAI(String message,
      {String? profileId, List<File>? attachments}) async {
    if (attachments != null && attachments.isNotEmpty) {
      // Multipart request for attachments
      final formData = FormData.fromMap({
        'query': message,
        if (profileId != null) 'profileId': profileId,
        for (int i = 0; i < attachments.length; i++)
          'attachments': await MultipartFile.fromFile(
            attachments[i].path,
            filename: 'attachment_$i.jpg',
          ),
      });

      return _handleRequest<Map<String, dynamic>>(
          _dio.post('/ai-coach/chat', data: formData));
    } else {
      return await post<Map<String, dynamic>>('/ai-coach/chat', data: {
        'query': message,
        if (profileId != null) 'profileId': profileId
      });
    }
  }

  Future<Map<String, dynamic>> getAIInsights() async {
    return await get<Map<String, dynamic>>('/ai-coach/insights');
  }

  // ============ EVENTS & GYMS ============
  Future<Map<String, dynamic>> getEvents({String? city, String? category}) =>
      get<Map<String, dynamic>>('/events', queryParameters: {
        if (city != null && city.isNotEmpty) 'city': city,
        if (category != null && category.isNotEmpty) 'category': category,
      });

  Future<Map<String, dynamic>> getEvent(String eventId) =>
      get<Map<String, dynamic>>('/events/$eventId');

  Future<Map<String, dynamic>> quoteEventRegistration(
          String eventId, String ticketTypeId, int quantity) =>
      post<Map<String, dynamic>>('/events/$eventId/registration/quote',
          data: {'ticketTypeId': ticketTypeId, 'quantity': quantity});

  Future<Map<String, dynamic>> createEventPaymentOrder(
          String eventId, Map<String, dynamic> data) =>
      post<Map<String, dynamic>>('/events/$eventId/payment/order', data: data);

  Future<Map<String, dynamic>> getGyms({String? query, String? city}) =>
      get<Map<String, dynamic>>('/gyms', queryParameters: {
        if (query != null && query.isNotEmpty) 'q': query,
        if (city != null && city.isNotEmpty) 'city': city,
      });

  Future<Map<String, dynamic>> getGym(String gymId) =>
      get<Map<String, dynamic>>('/gyms/$gymId');

  Future<Map<String, dynamic>> getGymPlans(String gymId) =>
      get<Map<String, dynamic>>('/gyms/$gymId/plans');

  Future<Map<String, dynamic>> getGymMemberships() =>
      get<Map<String, dynamic>>('/gyms/my/memberships');

  Future<Map<String, dynamic>> quoteGymMembership(
          String gymId, String planId) =>
      post<Map<String, dynamic>>('/gyms/$gymId/membership/quote',
          data: {'planId': planId});

  Future<Map<String, dynamic>> createGymPaymentOrder(
          String gymId, String planId) =>
      post<Map<String, dynamic>>('/gyms/$gymId/payment/order',
          data: {'planId': planId});

  // ============ NOTIFICATIONS ============

  Future<Map<String, dynamic>> getNotifications() async {
    return await get<Map<String, dynamic>>('/notifications');
  }

  Future<Map<String, dynamic>> markNotificationRead(
      String notificationId) async {
    return await patch<Map<String, dynamic>>(
        '/notifications/$notificationId/read');
  }

  Future<void> markAllNotificationsRead() async {
    await patch<Map<String, dynamic>>('/notifications/read-all');
  }

  Future<Map<String, dynamic>> updateMyProfile(
      Map<String, dynamic> data) async {
    final response = await patch<Map<String, dynamic>>('/me', data: data);
    if (response['user'] != null) await saveUser(response['user']);
    return response;
  }

  Future<Map<String, dynamic>> respondToTrainerRequest(
    String requestId,
    String status,
  ) =>
      patch<Map<String, dynamic>>(
        '/client/trainer-requests/$requestId',
        data: {'status': status},
      );

  Future<Map<String, dynamic>> getMessageThread(
          {required String trainerId, required String clientId}) =>
      get<Map<String, dynamic>>('/messages/thread',
          queryParameters: {'trainerId': trainerId, 'clientId': clientId});

  Future<Map<String, dynamic>> sendMessage(
          {required String trainerId,
          required String clientId,
          required String text}) =>
      post<Map<String, dynamic>>('/messages/send',
          data: {'trainerId': trainerId, 'clientId': clientId, 'text': text});

  // ============ ADMIN ENDPOINTS ============

  Future<Map<String, dynamic>> adminSignIn(
      String email, String password) async {
    // The React admin panel uses the normal auth endpoint; authorization is
    // determined by the returned user's role, not a separate public route.
    final response = await post<Map<String, dynamic>>('/auth/signin', data: {
      'email': email,
      'password': password,
    });

    if (response['token'] != null) {
      await saveToken(response['token']);
      final user = response['user'] ?? response['admin'];
      if (user != null) {
        await saveUser({...user, 'role': 'admin'});
      }
    }
    return response;
  }

  Future<Map<String, dynamic>> getAdminDashboard() async {
    return await get<Map<String, dynamic>>('/admin/dashboard');
  }

  Future<Map<String, dynamic>> getAdminUsers(
      {int page = 1, int limit = 50}) async {
    return await get<Map<String, dynamic>>('/admin/users', queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  Future<Map<String, dynamic>> getAdminResource(String resource) =>
      get<Map<String, dynamic>>('/admin/$resource');
}
