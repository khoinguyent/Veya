import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/useAuthStore';

const TOKEN_KEY = '@veya:token';
const USER_KEY = '@veya:user';
const BACKEND_TOKEN_KEY = '@veya:backend_token';
const BACKEND_USER_KEY = '@veya:backend_user';

/**
 * Debug utility to check authentication state and stored tokens
 */
export const debugAuth = {
  /**
   * Check if token is stored in AsyncStorage
   */
  async checkStoredToken(): Promise<any> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);
      const backendToken = await AsyncStorage.getItem(BACKEND_TOKEN_KEY);
      const backendUserStr = await AsyncStorage.getItem(BACKEND_USER_KEY);
      
      console.log('🔍 === Auth Debug Info ===');
      console.log('📦 Legacy Token:', token ? `${token.substring(0, 30)}...` : 'NOT FOUND');
      console.log('👤 Legacy User:', userStr ? JSON.parse(userStr) : 'NOT FOUND');
      console.log('🔑 Backend Token:', backendToken ? `${backendToken.substring(0, 30)}...` : 'NOT FOUND');
      console.log('👤 Backend User:', backendUserStr ? JSON.parse(backendUserStr) : 'NOT FOUND');
      
      // Check auth store state
      const authState = useAuthStore.getState();
      console.log('🏪 Auth Store State:');
      console.log('  - Backend Token:', authState.backendToken ? `${authState.backendToken.substring(0, 30)}...` : 'null');
      console.log('  - Backend User:', authState.backendUser);
      console.log('  - User:', authState.user);
      console.log('  - Is Authenticated:', authState.isAuthenticated);
      console.log('  - Is Loading:', authState.isLoading);
      console.log('  - Firebase User:', authState.firebaseUser ? `Present (${authState.firebaseUser.uid})` : 'null');
      console.log('======================');
      
      return {
        hasLegacyToken: !!token,
        hasLegacyUser: !!userStr,
        hasBackendToken: !!backendToken,
        hasBackendUser: !!backendUserStr,
        backendToken: backendToken,
        backendUser: backendUserStr ? JSON.parse(backendUserStr) : null,
        authState: authState,
      };
    } catch (error) {
      console.error('❌ Error checking auth state:', error);
      throw error;
    }
  },

  /**
   * Clear all auth data (for testing)
   * Clears both legacy tokens and backend tokens
   * IMPORTANT: Also signs out from Firebase Auth to prevent auto-re-authentication
   */
  async clearAuth(): Promise<void> {
    try {
      console.log('🧹 Starting auth cleanup...');
      
      // First, sign out from Firebase Auth to prevent auto-re-authentication
      // This must be done BEFORE clearing tokens
      const { firebaseUser } = useAuthStore.getState();
      if (firebaseUser) {
        console.log('🔥 Signing out from Firebase Auth...');
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('../core/firebase');
        await signOut(auth);
        console.log('✅ Signed out from Firebase Auth');
      } else {
        // Check if Firebase Auth has a current user (might not be in store yet)
        const { auth } = await import('../core/firebase');
        if (auth.currentUser) {
          console.log('🔥 Signing out from Firebase Auth (currentUser exists)...');
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
          console.log('✅ Signed out from Firebase Auth');
        }
      }
      
      // Wait a bit for Firebase signout to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear all auth-related keys from AsyncStorage
      console.log('🧹 Clearing tokens from AsyncStorage...');
      await AsyncStorage.multiRemove([
        TOKEN_KEY,
        USER_KEY,
        BACKEND_TOKEN_KEY,
        BACKEND_USER_KEY,
      ]);
      console.log('✅ Cleared tokens from AsyncStorage');
      
      // Reset auth store state
      console.log('🔄 Resetting auth store state...');
      useAuthStore.setState({
        user: null,
        firebaseUser: null,
        backendToken: null,
        backendUser: null,
        isAuthenticated: false,
      });
      console.log('✅ Auth store reset');
      
      console.log('');
      console.log('✅ Auth cleanup complete!');
      console.log('📝 You can now test the new user flow');
      console.log('💡 Reload the app to see the changes');
    } catch (error) {
      console.error('❌ Error clearing auth:', error);
      throw error;
    }
  },

  /**
   * Clear only backend tokens (keeps Firebase Auth if signed in)
   * WARNING: If Firebase user is still signed in, the app will automatically
   * re-authenticate with backend and create a new token!
   * Use clearAuth() instead if you want to test new user flow.
   */
  async clearBackendTokens(): Promise<void> {
    try {
      console.log('🧹 Clearing backend tokens only...');
      console.log('⚠️  Note: If Firebase user is signed in, a new token will be created automatically');
      
      await AsyncStorage.multiRemove([BACKEND_TOKEN_KEY, BACKEND_USER_KEY]);
      
      // Reset backend token in store
      useAuthStore.setState({
        backendToken: null,
        backendUser: null,
      });
      
      console.log('✅ Cleared backend tokens');
      console.log('📝 Firebase Auth state preserved');
      console.log('⚠️  If you see a new token being created, Firebase user is still signed in');
      console.log('💡 Use clearAuth() to also sign out from Firebase');
    } catch (error) {
      console.error('❌ Error clearing backend tokens:', error);
    }
  },

  /**
   * Decode JWT token (basic decode, no verification)
   */
  decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      
      console.log('🔓 Decoded JWT Token:');
      console.log('  - User ID (sub):', decoded.sub);
      console.log('  - Expires (exp):', new Date(decoded.exp * 1000).toISOString());
      console.log('  - Issued (iat):', decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'N/A');
      console.log('  - Full payload:', decoded);
      
      return decoded;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return null;
    }
  },
};

// Make it available globally for debugging
if (__DEV__) {
  // @ts-ignore
  global.debugAuth = debugAuth;
}

