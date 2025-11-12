import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut,
  getIdToken,
} from 'firebase/auth';
import { auth } from '../core/firebase';
import { authenticateWithBackend, BackendAuthResponse } from '../services/authService';

interface User {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  isGuest: boolean;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  backendToken: string | null; // Backend JWT token
  backendUser: BackendAuthResponse['user'] | null; // Backend user info
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => () => void; // Returns cleanup function
  setBackendAuth: (backendAuth: BackendAuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  refreshBackendToken: () => Promise<string | null>;
}

export const BACKEND_TOKEN_KEY = '@veya:backend_token';
export const BACKEND_USER_KEY = '@veya:backend_user';

// Convert Firebase User to our User interface
const convertFirebaseUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) return null;
  
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || undefined,
    displayName: firebaseUser.displayName || undefined,
    avatarUrl: firebaseUser.photoURL || undefined,
    isGuest: false,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  backendToken: null,
  backendUser: null,
  isAuthenticated: false,
  isLoading: true,
  
  initialize: () => {
    // Set loading state immediately
    set({ isLoading: true });

    // Listen to auth state changes (user sign in/out)
    // Firebase SDK automatically handles persistence via AsyncStorage
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log('✅ Firebase Auth: User signed in', firebaseUser.uid);
        
        // Handle async operations in a separate async function
        (async () => {
          // Load stored backend token and user (if available)
          try {
            const [tokenResult, userResult] = await AsyncStorage.multiGet([BACKEND_TOKEN_KEY, BACKEND_USER_KEY]);
            const [, storedToken] = tokenResult;
            const [, storedUserStr] = userResult;
            
            if (storedToken && storedUserStr) {
              try {
                const storedUser = JSON.parse(storedUserStr);
                // We have backend auth, use backend user info
                const user: User = {
                  id: storedUser.id,
                  email: storedUser.email,
                  displayName: storedUser.display_name,
                  avatarUrl: storedUser.avatar_url,
                  isGuest: storedUser.is_guest,
                };
                
                set({ 
                  firebaseUser,
                  user,
                  backendToken: storedToken,
                  backendUser: storedUser,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return; // Exit early if we have valid backend auth
              } catch (error) {
                console.error('Error parsing stored backend user:', error);
              }
            }
          } catch (error) {
            console.error('Error loading stored backend auth:', error);
          }
          
          // No stored backend token, authenticate with backend
          // This will automatically create a new backend token if Firebase user exists
          try {
            console.log('🔄 No backend token found, authenticating with backend...');
            const idToken = await getIdToken(firebaseUser, true);
            const backendAuth = await authenticateWithBackend(idToken, 'email');
            await get().setBackendAuth(backendAuth);
            // setBackendAuth already sets isLoading to false via isAuthenticated
            set({ isLoading: false });
            console.log('✅ Backend authentication completed automatically');
          } catch (error) {
            console.error('❌ Failed to authenticate with backend:', error);
            // Still set Firebase user, but backend auth failed
            // Use Firebase user as fallback
            const user = convertFirebaseUser(firebaseUser);
            set({ 
              firebaseUser,
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        })();
      } else {
        // Firebase user is null - check if we have backend token
        // This can happen if Firebase session expired but backend token is still valid
        (async () => {
          try {
            const [tokenResult, userResult] = await AsyncStorage.multiGet([BACKEND_TOKEN_KEY, BACKEND_USER_KEY]);
            const [, storedToken] = tokenResult;
            const [, storedUserStr] = userResult;
            
            if (storedToken && storedUserStr) {
              // We have backend token but no Firebase user
              // This means Firebase session expired/cleared but backend token remains
              console.log('⚠️  Backend token exists but Firebase user is null');
              console.log('   This can happen if Firebase emulator was restarted');
              console.log('   Backend token is still valid, but Firebase session is lost');
              
              try {
                const storedUser = JSON.parse(storedUserStr);
                const user: User = {
                  id: storedUser.id,
                  email: storedUser.email,
                  displayName: storedUser.display_name,
                  avatarUrl: storedUser.avatar_url,
                  isGuest: storedUser.is_guest,
                };
                
                // Keep backend auth but mark Firebase as null
                // User will need to login again to restore Firebase session
                set({ 
                  firebaseUser: null,
                  user,
                  backendToken: storedToken,
                  backendUser: storedUser,
                  isAuthenticated: true, // Backend token is still valid
                  isLoading: false,
                });
                
                console.log('📝 Backend authentication preserved');
                console.log('   User should login again to restore Firebase session');
                return;
              } catch (error) {
                console.error('Error parsing stored backend user:', error);
              }
            }
          } catch (error) {
            console.error('Error checking stored backend auth:', error);
          }
          
          // No backend token either - user is fully signed out
          console.log('👋 Firebase Auth: User signed out (no backend token)');
          
          // Clear backend tokens asynchronously
          AsyncStorage.multiRemove([BACKEND_TOKEN_KEY, BACKEND_USER_KEY]).catch((error) => {
            console.error('Error clearing backend tokens:', error);
          });
          
          set({ 
            firebaseUser: null,
            user: null,
            backendToken: null,
            backendUser: null,
            isAuthenticated: false,
            isLoading: false,
          });
        })();
      }
    });

    // Return cleanup function
    return () => {
      unsubscribeAuth();
    };
  },
  
  setBackendAuth: async (backendAuth: BackendAuthResponse) => {
    // Store backend JWT token and user info
    await AsyncStorage.setItem(BACKEND_TOKEN_KEY, backendAuth.token);
    await AsyncStorage.setItem(BACKEND_USER_KEY, JSON.stringify(backendAuth.user));
    
    // Convert backend user to our User interface
    const user: User = {
      id: backendAuth.user.id,
      email: backendAuth.user.email,
      displayName: backendAuth.user.display_name,
      avatarUrl: backendAuth.user.avatar_url,
      isGuest: backendAuth.user.is_guest,
    };
    
    set({
      backendToken: backendAuth.token,
      backendUser: backendAuth.user,
      user,
      isAuthenticated: true,
    });
    
    console.log('✅ Backend auth stored in state');
  },
  
  refreshBackendToken: async (): Promise<string | null> => {
    const { firebaseUser } = get();
    if (!firebaseUser) {
      return null;
    }
    
    try {
      // Get fresh Firebase ID token
      const idToken = await getIdToken(firebaseUser, true);
      
      // Authenticate with backend to get fresh backend JWT
      const backendAuth = await authenticateWithBackend(idToken, 'email');
      await get().setBackendAuth(backendAuth);
      
      return backendAuth.token;
    } catch (error) {
      console.error('❌ Error refreshing backend token:', error);
      return null;
    }
  },
  
  logout: async () => {
    try {
      // Clear backend tokens first
      await AsyncStorage.multiRemove([BACKEND_TOKEN_KEY, BACKEND_USER_KEY]);
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      // State update is handled automatically by onAuthStateChanged listener
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  },
}));

