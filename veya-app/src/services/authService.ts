import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../core/firebase';

/**
 * Firebase Authentication Service
 * Handles Firebase Auth and backend API integration
 */

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface BackendAuthResponse {
  user: {
    id: string;
    email?: string;
    display_name?: string;
    avatar_url?: string;
    is_guest: boolean;
    auth_provider: string;
    is_active: boolean;
  };
  token: string; // Backend JWT token
  is_new_user: boolean;
}

// Backend API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Send Firebase ID token to backend for verification and get backend JWT
 * This function is exported so it can be used by the auth store
 */
export const authenticateWithBackend = async (
  idToken: string,
  provider: 'email' | 'apple' | 'google' = 'email'
): Promise<BackendAuthResponse> => {
  try {
    console.log(`🌐 Sending Firebase ID token to backend: ${API_BASE_URL}/auth/firebase/register`);
    
    const response = await fetch(`${API_BASE_URL}/auth/firebase/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_token: idToken,
        provider: provider === 'email' ? 'firebase' : provider,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error(`❌ Backend authentication failed: ${response.status}`, errorData);
      throw new Error(errorData.detail || 'Backend authentication failed');
    }

    const data = await response.json();
    console.log('✅ Backend authentication successful');
    console.log('🔑 Backend JWT token received');
    console.log('👤 Backend user:', data.user.id);
    console.log('🆕 Is new user:', data.is_new_user);
    
    return data;
  } catch (error: any) {
    console.error('❌ Backend authentication error:', error);
    throw error;
  }
};

/**
 * Sign up a new user with email and password
 * 1. Creates user in Firebase Auth
 * 2. Gets Firebase ID token
 * 3. Sends token to backend for verification
 * 4. Returns backend JWT token and user info
 */
export const signup = async (
  email: string,
  password: string,
  displayName?: string
): Promise<{ firebaseUser: FirebaseUser; backendAuth: BackendAuthResponse }> => {
  try {
    // Step 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Step 2: Update display name if provided
    if (displayName && firebaseUser) {
      await updateProfile(firebaseUser, { displayName });
      // Wait a bit for profile update to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Firebase Auth: User created:', firebaseUser.uid);

    // Step 3: Get Firebase ID token
    const idToken = await firebaseUser.getIdToken(true);
    console.log('🔑 Firebase ID Token obtained');

    // Step 4: Send token to backend and get backend JWT
    const backendAuth = await authenticateWithBackend(idToken, 'email');

    return {
      firebaseUser,
      backendAuth,
    };
  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    throw error;
  }
};

/**
 * Sign in an existing user with email and password
 * 1. Signs in to Firebase Auth
 * 2. Gets Firebase ID token
 * 3. Sends token to backend for verification
 * 4. Returns backend JWT token and user info
 */
export const login = async (
  email: string,
  password: string
): Promise<{ firebaseUser: FirebaseUser; backendAuth: BackendAuthResponse }> => {
  try {
    // Step 1: Sign in to Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('✅ Firebase Auth: User signed in:', firebaseUser.uid);

    // Step 2: Get Firebase ID token
    const idToken = await firebaseUser.getIdToken(true);
    console.log('🔑 Firebase ID Token obtained');

    // Step 3: Send token to backend and get backend JWT
    // Use /firebase/register endpoint as it handles both new and existing users
    const backendAuth = await authenticateWithBackend(idToken, 'email');

    return {
      firebaseUser,
      backendAuth,
    };
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log('✅ User signed out successfully');
  } catch (error: any) {
    console.error('❌ Sign out error:', error);
    throw error;
  }
};

/**
 * Listen to authentication state changes
 * Returns an unsubscribe function
 */
export const listenToAuthChanges = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Get Firebase ID token for the current user
 */
export const getIdToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  try {
    const token = await user.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    console.error('❌ Error getting ID token:', error);
    return null;
  }
};

/**
 * Convert Firebase User to our AuthUser interface
 */
export const convertFirebaseUser = (firebaseUser: FirebaseUser | null): AuthUser | null => {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
};

