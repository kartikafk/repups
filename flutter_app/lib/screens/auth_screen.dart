import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../features/auth/providers/auth_provider.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _formKey = GlobalKey<FormState>();

  // Mode: 'signin' or 'signup'
  String _mode = 'signin';

  // Role: 'client' or 'trainer'
  String _role = 'client';

  // Form controllers
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final _ageController = TextEditingController();

  bool _obscurePassword = true;

  // Step tracking for signup
  int _signupStep = 1;
  String _selectedGoal = '';
  final List<String> _goals = [
    'Cut',
    'Maintain',
    'Bulk',
    'Athletic Performance'
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  Future<void> _handleAuth() async {
    if (!_formKey.currentState!.validate()) return;

    final authNotifier = ref.read(authProvider.notifier);

    try {
      if (_mode == 'signin') {
        // Sign In
        await authNotifier.signIn(
          _emailController.text.trim(),
          _passwordController.text,
          role: _role,
        );
      } else {
        // Sign Up
        final userData = {
          'role': _role,
          'name': _nameController.text.trim(),
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
        };

        // Add client-specific fields
        if (_role == 'client') {
          userData['weight'] = _weightController.text;
          userData['height'] = _heightController.text;
          userData['age'] = _ageController.text;
          userData['goal'] = _selectedGoal;
        }

        await authNotifier.signUp(userData);
      }

      // Navigation is handled by go_router redirect
    } catch (e) {
      // Error handling is managed by the auth provider
    }
  }

  void _toggleMode() {
    setState(() {
      _mode = _mode == 'signin' ? 'signup' : 'signin';
      _signupStep = 1;
      // Clear error when switching modes
      ref.read(authProvider.notifier).clearError();
    });
  }

  void _toggleRole() {
    setState(() {
      _role = _role == 'client' ? 'trainer' : 'client';
      _signupStep = 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.isLoading;
    final error = authState.error;

    final isClient = _role == 'client';
    final accentColor = isClient ? AppColors.neon : const Color(0xFF4D9FFF);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo
                  _buildLogo(accentColor),
                  const SizedBox(height: 48),

                  // Mode switcher (signin/signup)
                  _buildModeSwitcher(),
                  const SizedBox(height: 32),

                  // Heading
                  _buildHeading(),
                  const SizedBox(height: 24),

                  // Error message
                  if (error != null) _buildError(error),

                  // Form
                  Form(
                    key: _formKey,
                    child: _mode == 'signin'
                        ? _buildSignInForm(isLoading)
                        : _buildSignUpForm(accentColor, isLoading),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo(Color accentColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: accentColor,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: accentColor.withOpacity(0.5),
                blurRadius: 20,
              ),
            ],
          ),
          child: const Center(
            child: Text('💪', style: TextStyle(fontSize: 20)),
          ),
        ),
        const SizedBox(width: 12),
        RichText(
          text: TextSpan(
            children: [
              const TextSpan(
                text: 'Rep',
                style: TextStyle(
                  fontFamily: 'Syne',
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              TextSpan(
                text: 'Ups',
                style: TextStyle(
                  fontFamily: 'Syne',
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: accentColor,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildModeSwitcher() {
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      runSpacing: 10,
      children: [
        // Role toggle
        OutlinedButton(
          onPressed: _toggleRole,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AppColors.border),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          ),
          child: Text(
            'Switch to ${_role == 'client' ? 'Trainer' : 'Client'}',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textMuted,
            ),
          ),
        ),

        // Sign in/up toggle
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(
              _mode == 'signin' ? 'New here?' : 'Have account?',
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(width: 8),
            OutlinedButton(
              onPressed: _toggleMode,
              style: OutlinedButton.styleFrom(
                side: BorderSide(
                  color: (_role == 'client'
                          ? AppColors.neon
                          : const Color(0xFF4D9FFF))
                      .withOpacity(0.5),
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
              ),
              child: Text(
                _mode == 'signin' ? 'Register' : 'Sign in',
                style: TextStyle(
                  fontSize: 13,
                  color: _role == 'client'
                      ? AppColors.neon
                      : const Color(0xFF4D9FFF),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHeading() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _mode == 'signin'
              ? 'Welcome back${_role == 'trainer' ? ', Coach' : ''} 👋'
              : _signupStep == 1
                  ? 'Create account'
                  : 'Your profile',
          style: const TextStyle(
            fontFamily: 'Syne',
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          _mode == 'signin'
              ? 'Sign in as a ${_role == 'client' ? 'Client' : 'Trainer'}'
              : _signupStep == 1
                  ? 'Fill in your credentials to start'
                  : 'Personalize your experience',
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textMuted,
          ),
        ),
      ],
    );
  }

  Widget _buildError(String error) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.1),
        border: Border.all(color: AppColors.error.withOpacity(0.5)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        error,
        style: const TextStyle(
          fontSize: 13,
          color: AppColors.error,
        ),
      ),
    );
  }

  Widget _buildSignInForm(bool isLoading) {
    return Column(
      children: [
        _buildTextField(
          controller: _emailController,
          label: 'Email address',
          hint:
              _role == 'trainer' ? 'coach@example.com' : 'athlete@example.com',
          keyboardType: TextInputType.emailAddress,
          validator: (value) {
            if (value == null || value.isEmpty) return 'Email is required';
            if (!value.contains('@')) return 'Invalid email';
            return null;
          },
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _passwordController,
          label: 'Password',
          hint: '••••••••',
          obscureText: _obscurePassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_off : Icons.visibility,
              color: AppColors.textMuted,
              size: 20,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
            },
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return 'Password is required';
            return null;
          },
        ),
        const SizedBox(height: 24),
        _buildPrimaryButton(
          label: isLoading
              ? 'Signing In...'
              : 'Sign In as ${_role == 'client' ? 'Client' : 'Trainer'} →',
          onPressed: isLoading ? null : _handleAuth,
        ),
      ],
    );
  }

  Widget _buildSignUpForm(Color accentColor, bool isLoading) {
    if (_signupStep == 1) {
      return Column(
        children: [
          _buildTextField(
            controller: _nameController,
            label: 'Full name',
            hint: 'Your name',
            validator: (value) {
              if (value == null || value.isEmpty) return 'Name is required';
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _emailController,
            label: 'Email',
            hint: 'you@example.com',
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.isEmpty) return 'Email is required';
              if (!value.contains('@')) return 'Invalid email';
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _passwordController,
            label: 'Password',
            hint: 'Min. 8 characters',
            obscureText: _obscurePassword,
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_off : Icons.visibility,
                color: AppColors.textMuted,
                size: 20,
              ),
              onPressed: () {
                setState(() {
                  _obscurePassword = !_obscurePassword;
                });
              },
            ),
            validator: (value) {
              if (value == null || value.isEmpty) return 'Password is required';
              if (value.length < 8)
                return 'Password must be at least 8 characters';
              return null;
            },
          ),
          if (_role == 'client') ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _weightController,
                    label: 'Weight (kg)',
                    hint: '75',
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildTextField(
                    controller: _heightController,
                    label: 'Height (cm)',
                    hint: '175',
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildTextField(
                    controller: _ageController,
                    label: 'Age',
                    hint: '25',
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 24),
          _buildPrimaryButton(
            label: _role == 'client' ? 'Continue →' : 'Create Account ✓',
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                if (_role == 'client') {
                  setState(() => _signupStep = 2);
                } else {
                  _handleAuth();
                }
              }
            },
          ),
        ],
      );
    } else {
      // Step 2: Client-specific (goal selection)
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Primary goal',
            style: TextStyle(
              fontFamily: 'Space Mono',
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.textMuted,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _goals.map((goal) {
              final isSelected = _selectedGoal == goal;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedGoal = isSelected ? '' : goal;
                  });
                },
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? accentColor.withOpacity(0.15)
                        : AppColors.surface,
                    border: Border.all(
                      color: isSelected ? accentColor : AppColors.border,
                    ),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    goal,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? accentColor : AppColors.textMuted,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(10),
                  color: AppColors.surface,
                ),
                child: IconButton(
                  icon:
                      const Icon(Icons.arrow_back, color: AppColors.textMuted),
                  onPressed: () {
                    setState(() => _signupStep = 1);
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildPrimaryButton(
                  label: isLoading ? 'Creating...' : 'Create Account ✓',
                  onPressed: isLoading ? null : _handleAuth,
                ),
              ),
            ],
          ),
        ],
      );
    }
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontFamily: 'Space Mono',
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textMuted,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 14,
          ),
          decoration: InputDecoration(
            hintText: hint,
            suffixIcon: suffixIcon,
          ),
          validator: validator,
        ),
      ],
    );
  }

  Widget _buildPrimaryButton({
    required String label,
    required VoidCallback? onPressed,
  }) {
    final accentColor =
        _role == 'client' ? AppColors.neon : const Color(0xFF4D9FFF);

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: accentColor,
          foregroundColor: AppColors.bg,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
          shadowColor: accentColor.withOpacity(0.4),
        ),
        child: Center(
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ),
    );
  }
}
