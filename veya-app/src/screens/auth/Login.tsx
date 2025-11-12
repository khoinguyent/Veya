import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationContainerRef } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../core/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { login as firebaseLogin } from '../../services/authService';
import { navigateBasedOnOnboardingStatus } from '../../utils/navigationHelpers';

const Login: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { setBackendAuth } = useAuthStore.getState();
      
      // Step 1: Sign in with Firebase Auth
      // Step 2: Get Firebase ID token
      // Step 3: Send token to backend and get backend JWT
      const { firebaseUser, backendAuth } = await firebaseLogin(email.trim().toLowerCase(), password);
      
      console.log('✅ Firebase Auth: Login successful!');
      console.log('👤 Firebase User ID:', firebaseUser.uid);
      console.log('📧 Email:', firebaseUser.email);
      
      // Step 4: Store backend JWT token and user info
      await setBackendAuth(backendAuth);
      
      console.log('✅ Backend JWT token stored');
      console.log('👤 Backend User ID:', backendAuth.user.id);
      console.log('🆕 Is new user:', backendAuth.is_new_user);
      
      // Step 5: Fetch user info for display (async, don't block navigation)
      // This will be handled by the auth store's setBackendAuth method
      // which automatically triggers user info fetch
      
      // Step 6: Check onboarding status and navigate accordingly
      // This will navigate to Dashboard if onboarding is complete,
      // or to the appropriate onboarding screen if not
      const navigationRef = navigation.getParent()?.getParent() as NavigationContainerRef<any> | null;
      if (navigationRef && backendAuth.token) {
        console.log('🚀 Navigating based on onboarding status...');
        await navigateBasedOnOnboardingStatus(navigationRef, backendAuth.token);
      } else {
        console.log('⚠️  Navigation ref not available, AppNavigator will handle navigation');
        // Fallback: AppNavigator will handle navigation via auth state change
      }
    } catch (error: any) {
      console.error('❌ Login error', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      
      // Firebase Auth error codes
      let errorMessage = 'Login failed. Please check your credentials.';
      let helpfulMessage = '';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
        helpfulMessage = 'Please register first or check your email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
        helpfulMessage = 'If you forgot your password, you can:\n' +
          '1. Delete the user in Firebase Emulator UI (http://localhost:4000)\n' +
          '2. Register again with the same email\n' +
          '3. Or create a new account with a different email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
        helpfulMessage = 'Make sure Firebase Emulator is running:\n' +
          'docker-compose --profile dev up -d firebase-emulator';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error with helpful message
      if (helpfulMessage) {
        Alert.alert('Login Failed', `${errorMessage}\n\n${helpfulMessage}`);
      } else {
        Alert.alert('Login Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    setSocialLoading(provider);
    try {
      // TODO: Replace with actual social sign-in
      // For Apple: Use @react-native-apple-authentication
      // For Google: Use @react-native-google-signin/google-signin or Firebase Auth
      
      // Example flow:
      // 1. Sign in with Apple/Google using their SDKs
      // 2. Get ID token from Firebase Auth
      // 3. Call API: POST /api/auth/firebase with { id_token, provider: 'apple' | 'google' }
      // 4. Store token and user from response using: await login(token, user)
      // 5. Navigate to Main: navigation.replace('Main')
      
      // Mock implementation for now
      Alert.alert(
        'Coming Soon',
        `${provider === 'apple' ? 'Apple' : 'Google'} sign-in will be available after Firebase integration.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'An error occurred');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* Email/Password Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign-In */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                styles.appleButton,
                socialLoading === 'apple' && styles.buttonDisabled,
              ]}
              onPress={() => handleSocialLogin('apple')}
              disabled={!!socialLoading}
            >
              {socialLoading === 'apple' ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Feather name="smartphone" size={20} color="#000" />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialButton,
                styles.googleButton,
                socialLoading === 'google' && styles.buttonDisabled,
              ]}
              onPress={() => handleSocialLogin('google')}
              disabled={!!socialLoading}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Feather name="mail" size={20} color="#000" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    opacity: 0.8,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.accent2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.accent2,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  socialContainer: {
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.accent2,
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  appleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

