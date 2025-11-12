/**
 * Navigation helpers for authentication and onboarding flows
 */

import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { apiService } from '../services/api';

type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Breathe: undefined;
  Personalize: undefined;
  Main: undefined;
};

type NavigationProp = {
  reset: (options: { index: number; routes: Array<{ name: keyof RootStackParamList }> }) => void;
  dispatch?: (action: any) => void;
};

/**
 * Check onboarding status and navigate to the appropriate screen
 * Works with both NavigationContainerRef (from AppNavigator) and navigation prop (from screens)
 * @param navigation - Navigation ref or navigation prop to perform navigation
 * @param token - Backend JWT token
 * @returns Promise that resolves when navigation is complete
 */
export const navigateBasedOnOnboardingStatus = async (
  navigation: NavigationContainerRef<RootStackParamList> | NavigationProp | null,
  token: string
): Promise<void> => {
  if (!navigation) {
    console.warn('⚠️  Navigation is null, cannot navigate');
    return;
  }

  try {
    console.log('🔍 Checking onboarding status...');
    const onboardingStatus = await apiService.getOnboardingStatus(token);
    console.log('📊 Onboarding status:', onboardingStatus);

    // Helper to navigate to a screen
    const navigateToScreen = (screenName: keyof RootStackParamList) => {
      if ('reset' in navigation && typeof navigation.reset === 'function') {
        // It's a navigation prop (from useNavigation hook)
        navigation.reset({
          index: 0,
          routes: [{ name: screenName }],
        });
      } else if ('dispatch' in navigation && typeof navigation.dispatch === 'function') {
        // It's a NavigationContainerRef
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: screenName }],
          })
        );
      } else {
        console.error('❌ Invalid navigation object - missing reset or dispatch method');
      }
    };

    if (onboardingStatus.is_completed) {
      // Onboarding completed - navigate to Dashboard
      console.log('✅ Onboarding completed - navigating to Dashboard');
      navigateToScreen('Main');
    } else {
      // Onboarding not completed - navigate to appropriate screen
      const currentScreen = onboardingStatus.current_screen;
      const nextScreen = onboardingStatus.next_screen;
      const completedScreens = onboardingStatus.completed_screens || [];
      const hasProfile = onboardingStatus.has_profile;
      const pendingScreens = (onboardingStatus as any).pending_screens || [];

      console.log(`📱 Onboarding in progress:`);
      console.log(`   Current screen: ${currentScreen}`);
      console.log(`   Next screen: ${nextScreen}`);
      console.log(`   Completed screens: ${completedScreens.join(', ')}`);
      console.log(`   Has profile: ${hasProfile}`);
      console.log(`   Pending screens: ${pendingScreens.join(', ')}`);

      // Determine target screen based on onboarding progress
      // Priority: Breathe → Personalize → Main
      let targetScreen: keyof RootStackParamList;

      // If breathe step not completed, send user there first
      if (!completedScreens.includes('breathe') && !completedScreens.includes('welcome')) {
        targetScreen = 'Breathe';
        console.log('🌬️  Breathe not completed - navigating to Breathe');
      } else if (!hasProfile || pendingScreens.includes('personalize')) {
        targetScreen = 'Personalize';
        console.log('📝 Navigating to Personalize to continue onboarding');
      } else if (nextScreen === 'breathe' && !completedScreens.includes('breathe')) {
        targetScreen = 'Breathe';
        console.log('🌬️  Next required screen is Breathe - navigating to Breathe');
      } else if (nextScreen === 'personalize') {
        targetScreen = 'Personalize';
        console.log('📝 Next required screen is Personalize - navigating there');
      } else {
        console.log('🎯 Onboarding still in progress but no explicit next screen provided.');
        if (nextScreen && nextScreen in { Breathe: true, Personalize: true, Main: true } && nextScreen !== 'Main') {
          targetScreen = nextScreen as keyof RootStackParamList;
          console.log(`ℹ️  Fallback to nextScreen value: ${nextScreen}`);
        } else {
          console.log('📌 Defaulting to Personalize to resume onboarding flow');
          targetScreen = 'Personalize';
        }
      }

      console.log(`🚀 Navigating to: ${targetScreen}`);
      navigateToScreen(targetScreen);
    }
  } catch (error: any) {
    console.error('❌ Error checking onboarding status:', error);
    // If API call fails, navigate to Breathe screen (first step in onboarding)
    console.log('⚠️  API error - navigating to Breathe screen');
    if ('reset' in navigation && typeof navigation.reset === 'function') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Breathe' }],
      });
    } else if ('dispatch' in navigation && typeof navigation.dispatch === 'function') {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Breathe' }],
        })
      );
    }
  }
};
