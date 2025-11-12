import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, connectAuthEmulator, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
// For Firebase Auth Emulator, we can use minimal config
// For production, use your actual Firebase project config
const USE_EMULATOR = __DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

// Log configuration status
console.log('🔧 Firebase Configuration:');
console.log(`  - __DEV__: ${__DEV__}`);
console.log(`  - EXPO_PUBLIC_USE_FIREBASE_EMULATOR: ${process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR}`);
console.log(`  - USE_EMULATOR: ${USE_EMULATOR}`);

const firebaseConfig = USE_EMULATOR
  ? {
      // Minimal config for Firebase Auth Emulator
      apiKey: 'fake-api-key',
      authDomain: 'localhost',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-veya',
    }
  : {
      // Production Firebase config
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'your-api-key',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'your-app-id',
    };

// Validate configuration
if (!USE_EMULATOR) {
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey || apiKey === 'your-api-key') {
    if (__DEV__) {
      // In development, provide helpful error message
      console.error('❌ Firebase Configuration Error:');
      console.error('   The app is trying to use production Firebase but no valid API key is configured.');
      console.error('');
      console.error('   🔧 To fix this:');
      console.error('   1. Create a .env file in veya-app directory with:');
      console.error('      EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true');
      console.error('      EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=localhost');
      console.error('      EXPO_PUBLIC_FIREBASE_EMULATOR_PORT=9099');
      console.error('      EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-veya');
      console.error('');
      console.error('   2. Restart Expo (stop and run: npm start)');
      console.error('');
      console.error('   📝 Note: Environment variables are loaded at build time,');
      console.error('      so you must restart Expo after creating/changing .env file.');
      console.error('');
      throw new Error(
        'Firebase configuration error: Missing emulator configuration.\n\n' +
        'To use Firebase Emulator in development:\n' +
        '1. Create .env file with EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true\n' +
        '2. Restart Expo (npm start)\n\n' +
        'See FIREBASE_TROUBLESHOOTING.md for more details.'
      );
    } else {
      // In production, require valid API key
      console.error('❌ Firebase Error: Invalid API key in production mode!');
      throw new Error(
        'Firebase configuration error: Invalid API key. ' +
        'Please provide valid Firebase credentials via environment variables.'
      );
    }
  }
}

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log(`✅ Firebase app initialized (project: ${firebaseConfig.projectId})`);
} else {
  app = getApps()[0];
  console.log('✅ Using existing Firebase app instance');
}

// Initialize Auth with AsyncStorage persistence for React Native
// This ensures auth state persists across app restarts
let auth: Auth;
try {
  // Try to initialize with AsyncStorage persistence
  // This is the recommended way for React Native
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
} catch (error: any) {
  // If auth is already initialized, get the existing instance
  // This can happen during hot reloads in development
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
    console.log('✅ Using existing Firebase Auth instance');
  } else {
    console.error('❌ Firebase Auth initialization error:', error);
    throw error;
  }
}

// Connect to Firebase Auth Emulator in development
// IMPORTANT: This must happen BEFORE any auth operations
// Based on docker-compose.yml: emulator runs on port 9099
const EMULATOR_HOST = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
const EMULATOR_PORT = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_PORT || '9099';

if (USE_EMULATOR) {
  // Determine the correct host based on platform
  let emulatorUrl: string;
  
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    // For physical Android devices, use your machine's IP address
    emulatorUrl = `http://${EMULATOR_HOST === 'localhost' ? '10.0.2.2' : EMULATOR_HOST}:${EMULATOR_PORT}`;
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost directly
    emulatorUrl = `http://${EMULATOR_HOST}:${EMULATOR_PORT}`;
  } else {
    // Web platform
    emulatorUrl = `http://${EMULATOR_HOST}:${EMULATOR_PORT}`;
  }
  
  try {
    // Connect to emulator - this must be done before any auth operations
    // Note: connectAuthEmulator will throw if already connected, which we handle below
    connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
    console.log(`🔥 Firebase Auth Emulator connected: ${emulatorUrl}`);
    console.log('✅ Emulator mode enabled - all auth operations will use the emulator');
  } catch (error: any) {
    // If emulator is already connected, this is expected and fine
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';
    
    if (
      errorMessage.includes('already connected') || 
      errorMessage.includes('already-initialized') ||
      errorCode === 'auth/already-initialized' ||
      errorMessage.includes('Cannot connect')
    ) {
      // Emulator is already connected - this is fine, especially during hot reloads
      console.log('✅ Firebase Auth Emulator already connected');
    } else {
      // Some other error occurred
      console.error('❌ Failed to connect to Firebase Auth Emulator:', error);
      console.error('   Error message:', errorMessage);
      console.error('   Error code:', errorCode);
      console.error('');
      console.error('   Troubleshooting:');
      console.error('   1. Make sure the Firebase Emulator is running:');
      console.error('      docker-compose --profile dev up -d firebase-emulator');
      console.error(`      Or: firebase emulators:start --only auth --project ${firebaseConfig.projectId}`);
      console.error('');
      console.error('   2. Verify emulator is accessible at:', emulatorUrl);
      console.error('');
      console.error('   3. Check emulator logs:');
      console.error('      docker-compose --profile dev logs firebase-emulator');
      console.error('');
      // Don't throw - allow app to continue but warn user
      console.warn('⚠️  Continuing without emulator - auth operations may fail');
    }
  }
} else {
  console.log('📦 Using production Firebase (not emulator)');
}

export { auth };
export default app;

