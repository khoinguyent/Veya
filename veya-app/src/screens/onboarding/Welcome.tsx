import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SvgUri } from 'react-native-svg';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../core/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { apiService } from '../../services/api';

const { height, width } = Dimensions.get('window');

const COLORS = {
  sand: theme.colors.background,
  forest: theme.colors.primary,
  deepForest: theme.colors.textPrimary,
  subtitle: theme.colors.textSecondary,
  dotInactive: theme.colors.accent2,
};

const BACKEND_TOKEN_KEY = '@veya:backend_token';

const Welcome: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { backendToken } = useAuthStore();

  // Animations
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(10)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslate = useRef(new Animated.Value(10)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslate = useRef(new Animated.Value(10)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  // Load and play background music
  useEffect(() => {
    let isMounted = true;

    const loadAndPlayMusic = async () => {
      try {
        // Set audio mode for background playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        // Load the audio file
        const audioAsset = require('../../assets/audio/spiritual-purification-272572.mp3');
        const { sound } = await Audio.Sound.createAsync(
          audioAsset,
          {
            shouldPlay: true,
            isLooping: true,
            volume: 0.5, // Set volume to 50% for background music
          }
        );

        if (isMounted) {
          soundRef.current = sound;
        } else {
          // Component unmounted before sound loaded, unload it
          await sound.unloadAsync();
        }
      } catch (error) {
        console.error('Error loading background music:', error);
      }
    };

    loadAndPlayMusic();

    // Cleanup function
    return () => {
      isMounted = false;
      const stopMusic = async () => {
        try {
          if (soundRef.current) {
            // Check status before stopping to avoid interrupting operations
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded) {
              // Only stop if sound is playing
              if (status.isPlaying) {
                await soundRef.current.stopAsync().catch((err) => {
                  // Ignore errors if sound is already stopped
                  if (err.code !== 'E_AUDIO_NOPLAYER') {
                    console.warn('Error stopping sound:', err);
                  }
                });
              }
              // Wait a bit before unloading to ensure stop completes
              await new Promise(resolve => setTimeout(resolve, 100));
              // Unload the sound
              await soundRef.current.unloadAsync().catch((err) => {
                // Ignore errors if sound is already unloaded
                if (err.code !== 'E_AUDIO_NOPLAYER') {
                  console.warn('Error unloading sound:', err);
                }
              });
            }
            soundRef.current = null;
          }
        } catch (error: any) {
          // Handle "Seeking interrupted" and other errors gracefully
          if (error.message?.includes('Seeking interrupted') || error.code === 'E_AUDIO_NOPLAYER') {
            // This is expected when the sound is being cleaned up
            console.log('Sound cleanup completed (interrupted operation is normal)');
          } else {
            console.error('Error stopping background music:', error);
          }
          // Ensure soundRef is cleared even if there's an error
          soundRef.current = null;
        }
      };
      stopMusic();
    };
  }, []);

  // Stop music when navigating away
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This runs when the screen loses focus
        const stopMusic = async () => {
          try {
            if (soundRef.current) {
              const status = await soundRef.current.getStatusAsync();
              if (status.isLoaded && status.isPlaying) {
                await soundRef.current.stopAsync().catch((err) => {
                  // Ignore errors if sound is already stopped or unloaded
                  if (err.code !== 'E_AUDIO_NOPLAYER') {
                    console.warn('Error stopping music on blur:', err);
                  }
                });
              }
            }
          } catch (error: any) {
            // Handle errors gracefully - sound might already be stopped/unloaded
            if (error.code !== 'E_AUDIO_NOPLAYER' && !error.message?.includes('Seeking interrupted')) {
              console.error('Error stopping music on blur:', error);
            }
          }
        };
        stopMusic();
      };
    }, [])
  );

  useEffect(() => {
    Animated.sequence([
      Animated.timing(imageOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.stagger(150, [
        Animated.parallel([
          Animated.timing(titleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(titleTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(subtitleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(subtitleTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(buttonTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, [imageOpacity, titleOpacity, titleTranslate, subtitleOpacity, subtitleTranslate, buttonOpacity, buttonTranslate]);

  const onPressIn = () => {
    Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleContinue = async () => {
    setIsChecking(true);
    
    try {
      // Check if token exists locally (either from store or AsyncStorage)
      const storedToken = backendToken || await AsyncStorage.getItem(BACKEND_TOKEN_KEY);
      
      // Also check if Firebase user exists
      const { firebaseUser } = useAuthStore.getState();
      
      console.log('🔍 Continue button clicked:');
      console.log('  - Backend Token:', storedToken ? 'Found' : 'Not found');
      console.log('  - Firebase User:', firebaseUser ? `Found (${firebaseUser.uid})` : 'Not found');
      
      if (!storedToken) {
        // No token stored - navigate to Breathe screen
        console.log('📝 No token found - navigating to Breathe screen');
        navigation.navigate('Breathe');
        return;
      }
      
      // Check if Firebase user is missing but backend token exists
      // This can happen if Firebase emulator was restarted
      if (!firebaseUser && storedToken) {
        console.log('⚠️  Backend token exists but Firebase user is null');
        console.log('   Firebase session may have expired - checking onboarding status anyway');
        // Continue with onboarding check - backend token is still valid
      }

      // Token exists - check onboarding status
      console.log('🔍 Token found - checking onboarding status');
      try {
        const onboardingStatus = await apiService.getOnboardingStatus(storedToken);
        console.log('📊 Onboarding status:', onboardingStatus);
        
        if (onboardingStatus.is_completed) {
          // Onboarding completed - navigate to Dashboard
          console.log('✅ Onboarding completed - navigating to Dashboard');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          // Onboarding not completed - navigate to appropriate screen
          const currentScreen = onboardingStatus.current_screen;
          const nextScreen = onboardingStatus.next_screen;
          const completedScreens = onboardingStatus.completed_screens || [];
          const hasProfile = onboardingStatus.has_profile;
          
          console.log(`📱 Onboarding in progress:`);
          console.log(`   Current screen: ${currentScreen}`);
          console.log(`   Next screen: ${nextScreen}`);
          console.log(`   Completed screens: ${completedScreens.join(', ')}`);
          console.log(`   Has profile: ${hasProfile}`);
          
          // Determine target screen based on onboarding progress
          // Priority: Breathe → Personalize → Main
          let targetScreen: string | null = null;

          // Check if Breathe has been completed
          if (!completedScreens.includes('breathe') && !completedScreens.includes('welcome')) {
            // Breathe not completed - navigate to Breathe first
            targetScreen = 'Breathe';
            console.log('🌬️  Breathe not completed - navigating to Breathe');
          } else if (!hasProfile) {
            // Breathe completed but no profile - navigate to Personalize
            targetScreen = 'Personalize';
            console.log('📝 Breathe completed but no profile - navigating to Personalize');
          } else if (!completedScreens.includes('personalize')) {
            // Profile exists but Personalize not completed - navigate to Personalize
            targetScreen = 'Personalize';
            console.log('📝 Personalize not completed - navigating to Personalize');
          } else {
            console.log('🎉 Breathe & Personalize complete - navigating to Dashboard');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
            return;
          }
          
          const routeName = targetScreen || 'Breathe';
          console.log(`🚀 Navigating to: ${routeName}`);
          navigation.replace(routeName as any);
        }
      } catch (error: any) {
        console.error('❌ Error checking onboarding status:', error);
        // If API call fails (e.g., token invalid), navigate to Breathe
        console.log('⚠️  API error - navigating to Breathe screen');
        navigation.navigate('Breathe');
      }
    } catch (error) {
      console.error('❌ Error in handleContinue:', error);
      // On error, default to Breathe screen
      navigation.navigate('Breathe');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.sand }] }>
      <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, backgroundColor: theme.colors.sand }]}>
        {/* Top zone: Illustration */}
        <View style={styles.topZone}>
          {(() => {
            const svgAsset = require('../../assets/illustrations/hero_fs3.svg');
            const svgUri = Image.resolveAssetSource(svgAsset).uri;
            return (
              <Animated.View style={{ opacity: imageOpacity, width: '100%', alignItems: 'center' }}>
                <SvgUri uri={svgUri} width="80%" height={height * 0.45} />
              </Animated.View>
            );
          })()}
        </View>

        {/* Middle zone: Text */}
        <View style={styles.middleZone}>
          <View style={styles.textBlock}>
            <Animated.Text
              style={[
                styles.title,
                { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
              ]}
            >
          Welcome to Your Space of Mindfulness
            </Animated.Text>

            <Animated.Text
              style={[
                styles.subtitle,
                { opacity: subtitleOpacity, transform: [{ translateY: subtitleTranslate }] },
              ]}
            >
              Breathe. Relax. Be present.
            </Animated.Text>
          </View>
        </View>

        {/* Bottom zone: Button + Dots */}
        <View style={styles.bottomZone}>
          <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonTranslate }] }}>
            <Animated.View style={{ transform: [{ scale: pressScale }] }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.button, isChecking && styles.buttonDisabled]}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={handleContinue}
                disabled={isChecking}
              >
                {isChecking ? (
                  <ActivityIndicator color={COLORS.sand} />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.sand,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.sand,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topZone: {
    alignItems: 'center',
  },
  middleZone: {
    alignItems: 'center',
  },
  bottomZone: {
    alignItems: 'center',
  },
  image: {
    width: width - 48,
    height: height * 0.45,
    alignSelf: 'center',
  },
  textBlock: {
    width: '100%',
    marginTop: 24, // space between illustration and title
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.deepForest,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8, // title → subtitle
    fontSize: 16,
    color: COLORS.subtitle,
    opacity: 0.8,
    textAlign: 'center',
  },
  button: {
    marginTop: 48, // subtitle → button
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.forest,
    width: width - 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.sand,
    fontSize: 16,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    columnGap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.dotInactive,
  },
  dotActive: {
    backgroundColor: COLORS.forest,
  },
});

