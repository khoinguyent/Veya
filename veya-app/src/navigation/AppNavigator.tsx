import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import Welcome from '../screens/onboarding/Welcome';
import Breathe from '../screens/onboarding/Breathe';
import Personalize from '../screens/onboarding/Personalize';
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import { LoadingScreen } from '../screens/LoadingScreen';
import { useAuthStore } from '../store/useAuthStore';

type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Breathe: undefined;
  Personalize: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const prevAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    // Initialize Firebase Auth listeners
    const cleanup = initialize();
    setIsInitialized(true);

    // Cleanup on unmount
    return cleanup;
  }, [initialize]);

  // Handle navigation when auth state changes
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    // Skip on initial mount (handled by initialRouteName)
    if (prevAuthState.current === null) {
      prevAuthState.current = isAuthenticated;
      return;
    }

    // Only navigate if auth state actually changed
    if (prevAuthState.current !== isAuthenticated && navigationRef.current) {
      if (isAuthenticated) {
        // User just logged in - check onboarding status and navigate accordingly
        const { backendToken } = useAuthStore.getState();
        if (backendToken) {
          console.log('🔐 User authenticated - checking onboarding status...');
          navigateBasedOnOnboardingStatus(navigationRef.current, backendToken);
        } else {
          // No backend token, navigate to Welcome
          console.log('⚠️  User authenticated but no backend token - navigating to Welcome');
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        }
      } else {
        // User just logged out - navigate to Welcome
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    }

    prevAuthState.current = isAuthenticated;
  }, [isAuthenticated, isInitialized, isLoading]);

  // Handle initial navigation based on auth and onboarding status
  useEffect(() => {
    if (!isInitialized || isLoading || !navigationRef.current) return;
    if (prevAuthState.current !== null) return; // Only run on initial mount

    // On initial mount, if user is authenticated, check onboarding status
    if (isAuthenticated) {
      const { backendToken } = useAuthStore.getState();
      if (backendToken) {
        console.log('🔐 App started - user authenticated, checking onboarding status...');
        
        // Load cached user info for quick display
        import('../store/useUserInfoStore').then(({ useUserInfoStore }) => {
          useUserInfoStore.getState().loadCachedUserInfo();
        });
        
        // Fetch fresh user info (async, non-blocking)
        import('../store/useUserInfoStore').then(({ useUserInfoStore }) => {
          useUserInfoStore.getState().fetchUserInfo(backendToken, false)
            .catch((error) => {
              console.error('⚠️  Failed to fetch user info on app start (non-critical):', error);
            });
        });
        
        navigateBasedOnOnboardingStatus(navigationRef.current, backendToken);
      }
    }
  }, [isInitialized, isLoading, isAuthenticated]);

  // Show loading screen while checking auth state
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Breathe" component={Breathe} />
        <Stack.Screen name="Personalize" component={Personalize} />
        <Stack.Screen name="Main" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

