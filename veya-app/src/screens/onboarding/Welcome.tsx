import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SvgUri } from 'react-native-svg';
import { Audio } from 'expo-av';
import { theme } from '../../core/theme';

const { height, width } = Dimensions.get('window');

const COLORS = {
  sand: theme.colors.background,
  forest: theme.colors.primary,
  deepForest: theme.colors.textPrimary,
  subtitle: theme.colors.textSecondary,
  dotInactive: theme.colors.accent2,
};

const Welcome: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const soundRef = useRef<Audio.Sound | null>(null);

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
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
        } catch (error) {
          console.error('Error stopping background music:', error);
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
              await soundRef.current.stopAsync();
            }
          } catch (error) {
            console.error('Error stopping music on blur:', error);
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
                style={styles.button}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={() => navigation.navigate('Breathe')}
              >
                <Text style={styles.buttonText}>Continue</Text>
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

