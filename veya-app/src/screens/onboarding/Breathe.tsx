import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../core/theme';
import { useSessionStore } from '../../store/useSessionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { navigateBasedOnOnboardingStatus } from '../../utils/navigationHelpers';
import { BACKEND_TOKEN_KEY } from '../../store/useAuthStore';

const { width, height } = Dimensions.get('window');

function BreathingCircle({ running, cycleMs, center }: { running: boolean; cycleMs: number; center?: React.ReactNode }) {
  // One driving value for the cycle, then stagger layers with phase offsets
  const progress = useRef(new Animated.Value(0)).current; // 0..1

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (running) {
      loop = Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: cycleMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      );
      loop.start();
    }
    return () => {
      loop?.stop?.();
      progress.stopAnimation();
      progress.setValue(0);
    };
  }, [running, progress]);

  // Helper to build layered circle styles with phase shift and color
  const layer = (offset: number, color: string, opacity: number, sizePct: number) => {
    const phased = Animated.modulo(Animated.add(progress, offset), 1);
    const scale = phased.interpolate({
      inputRange: [0, 1 / 3, 1],
      outputRange: [0.8, 1.1, 0.8],
    });
    const size = Math.min(280, width * 0.7) * sizePct;
    const radius = size / 2;
    return (
      <Animated.View
        key={color + offset}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        }}
      />
    );
  };

  // Palette provided
  const palette = ['#F7D3C6', '#E8E1F4', '#C7EBD0', '#F8EAC9'];
  return (
    <View style={styles.circleStack}>
      {layer(0.00, palette[0], 0.55, 1.05)}
      {layer(0.10, palette[1], 0.48, 0.85)}
      {layer(0.20, palette[2], 0.45, 1.20)}
      {layer(0.30, palette[3], 0.40, 0.65)}
      {center}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  return <View style={[styles.dot, active && { backgroundColor: theme.colors.primary }]} />;
}

export default function Breathe() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [running, setRunning] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const soundRef = useRef<Audio.Sound | null>(null);

  // content fade-in
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  // breathing phase text derived from progress time using a separate clock
  const [phaseText, setPhaseText] = useState('Breathe in…');
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(Date.now());
  useEffect(() => {
    const cycle = sessionActive ? 10000 : 6000;
    if (running) {
      startTime.current = Date.now();
      ticker.current = setInterval(() => {
        const t = ((Date.now() - startTime.current) % cycle) / 1000; // seconds within cycle
        if (sessionActive) {
          // 4s in, 2s hold, 4s exhale
          if (t < 4) setPhaseText('Breathe in…');
          else if (t < 6) setPhaseText('Hold…');
          else setPhaseText('Exhale…');
        } else {
          // idle: 2s in, 1s hold, 3s exhale
          if (t < 2) setPhaseText('Breathe in…');
          else if (t < 3) setPhaseText('Hold…');
          else setPhaseText('Exhale…');
        }
      }, 100);
    }
    return () => {
      if (ticker.current) clearInterval(ticker.current);
      ticker.current = null;
    };
  }, [running, sessionActive]);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Utility: play a one-shot cue and auto-unload
  const playCue = async (
    asset: any,
    options?: { volume?: number; rate?: number }
  ) => {
    try {
      const { sound } = await Audio.Sound.createAsync(asset, {
        shouldPlay: true,
        volume: options?.volume ?? 0.8,
      });
      if (options?.rate && typeof sound.setRateAsync === 'function') {
        try {
          await sound.setRateAsync(options.rate, true);
        } catch {}
      }
      sound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.didJustFinish || (status.isLoaded && status.positionMillis >= (status.durationMillis || 0))) {
          try { await sound.unloadAsync(); } catch {}
        }
      });
    } catch (e) {
      // swallow non-fatal cue errors
    }
  };

  // Schedule 6 breathing cycles (10s each) with cues at 0s, 4s, 7s
  const scheduleCues = () => {
    const inFx = require('../../assets/audio/breathe-in-87397.mp3');
    const inVoiceA = require('../../assets/audio/breathein(voice).mp3');
    const holdFx = require('../../assets/audio/hold.mp3');
    const outFx = require('../../assets/audio/breath-out-242642.mp3');
    const outVoiceA = require('../../assets/audio/exhale(voice).mp3');

    // clear previous
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    for (let i = 0; i < 6; i++) {
      const base = i * 10000;
      // 0s: breathe in (fx + voice, voice slightly slower)
      timeoutsRef.current.push(
        setTimeout(() => {
          playCue(inFx, { volume: 0.7 });
          playCue(inVoiceA, { volume: 0.8, rate: 0.92 });
        }, base)
      );
      // 4s: hold
      timeoutsRef.current.push(
        setTimeout(() => {
          playCue(holdFx, { volume: 0.7 });
        }, base + 4000)
      );
      // 6s: exhale (fx + voice, voice slightly slower)
      timeoutsRef.current.push(
        setTimeout(() => {
          playCue(outFx, { volume: 0.7 });
          playCue(outVoiceA, { volume: 0.8, rate: 0.92 });
        }, base + 6000)
      );
    }
  };
  const handleContinue = () => {
    if (sessionActive) return;
    // start 60s session
    setSessionActive(true);
    setRunning(true);
    startTime.current = Date.now(); // align phase to start with breathe in
    setRemaining(60);
    scheduleCues();
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          // finish session
          (async () => {
            try {
              if (soundRef.current) {
                try { await soundRef.current.stopAsync(); } catch {}
                try { await soundRef.current.unloadAsync(); } catch {}
                soundRef.current = null;
              }
              // clear scheduled cues
              timeoutsRef.current.forEach((t) => clearTimeout(t));
              timeoutsRef.current = [];
              const store = useSessionStore.getState() as any;
              if (typeof store.setOnboarded === 'function') await store.setOnboarded();
            } catch {            }
            // Session finished - check if user is authenticated and handle navigation
            (async () => {
              try {
                // Check if user has backend token (authenticated)
                const { backendToken } = useAuthStore.getState();
                const storedToken = backendToken || await AsyncStorage.getItem(BACKEND_TOKEN_KEY);
                
                if (storedToken) {
                  // User is authenticated - check onboarding status and navigate accordingly
                  console.log('✅ 1-minute session completed - checking onboarding status...');
                  // Use navigation prop directly (it supports reset method)
                  await navigateBasedOnOnboardingStatus(navigation, storedToken);
                } else {
                  // No token - navigate to Login screen
                  console.log('✅ 1-minute session completed - no token, navigating to Login');
                  navigation.replace('Login');
                }
              } catch (error) {
                console.error('❌ Error handling session completion:', error);
                // Fallback to Login on error
                navigation.replace('Login');
              }
            })();
          })();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Background audio: randomly choose a track and loop it while on this screen
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const tracks = [
        { asset: require('../../assets/audio/bamboo_wind-22306.mp3'), volume: 0.72 },
        { asset: require('../../assets/audio/semi-desert-insects-ravens-birds-quiet-with-bad-mic-noise-badlands-ab-190818-7028.mp3'), volume: 0.98 },
        { asset: require('../../assets/audio/soft-rain-on-a-tile-roof-14515.mp3'), volume: 0.76 },
      ];
      
      const start = async () => {
        try {
          // Small delay to ensure previous screen audio has stopped
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Set audio mode with proper configuration
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });
          
          const index = Math.floor(Math.random() * tracks.length);
          console.log(`[Breathe] Loading audio track ${index + 1}/${tracks.length}`);
          
          const { sound } = await Audio.Sound.createAsync(
            tracks[index].asset,
            {
              shouldPlay: true,
              isLooping: true,
              volume: tracks[index].volume,
            }
          );
          
          if (isMounted) {
            soundRef.current = sound;
            try { await sound.setVolumeAsync(tracks[index].volume); } catch {}
            console.log('[Breathe] Background audio started successfully');
          } else {
            console.log('[Breathe] Component unmounted, unloading audio');
            await sound.unloadAsync();
          }
        } catch (e) {
          console.error('[Breathe] Error loading background audio:', e);
        }
      };
      
      start();
      
      return () => {
        isMounted = false;
        (async () => {
          try {
            if (soundRef.current) {
              console.log('[Breathe] Stopping background audio');
              try { await soundRef.current.stopAsync(); } catch (e) { console.warn('[Breathe] Error stopping:', e); }
              try { await soundRef.current.unloadAsync(); } catch (e) { console.warn('[Breathe] Error unloading:', e); }
              soundRef.current = null;
            }
          } catch (e) {
            console.error('[Breathe] Error in cleanup:', e);
          }
        })();
      };
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={[styles.root, { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 16, opacity: fadeIn, backgroundColor: theme.colors.background }]}
      >
        {/* Skip action */}
        <TouchableOpacity onPress={async () => {
          try {
            setRunning(false);
            setSessionActive(false);
            if (countdownRef.current) clearInterval(countdownRef.current);
            timeoutsRef.current.forEach((t) => clearTimeout(t));
            timeoutsRef.current = [];
            if (soundRef.current) {
              try { await soundRef.current.stopAsync(); } catch {}
              try { await soundRef.current.unloadAsync(); } catch {}
              soundRef.current = null;
            }
            
            // Check if user is authenticated and handle navigation
            const { backendToken } = useAuthStore.getState();
            const storedToken = backendToken || await AsyncStorage.getItem(BACKEND_TOKEN_KEY);
            
            if (storedToken) {
              // User is authenticated - check onboarding status and navigate accordingly
              console.log('⏭️  Skipping session - checking onboarding status...');
              // Use navigation prop directly (it supports reset method)
              await navigateBasedOnOnboardingStatus(navigation, storedToken);
            } else {
              // No token - navigate to Login screen
              console.log('⏭️  Skipping session - no token, navigating to Login');
              navigation.replace('Login');
            }
          } catch (error) {
            console.error('❌ Error handling skip:', error);
            // Fallback to Login on error
            navigation.replace('Login');
          }
        }} activeOpacity={0.7} style={[styles.skipBtn, { top: insets.top + 8 }]}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        {/* Top zone */}
        <View style={styles.topZone}>
          <BreathingCircle
            running={running}
            cycleMs={sessionActive ? 10000 : 6000}
            center={
              sessionActive ? (
                <Animated.Text style={styles.countdown}>{remaining}</Animated.Text>
              ) : undefined
            }
          />
        </View>

        {/* Middle zone */}
        <View style={styles.middleZone}>
          <Text style={styles.title}>Breathe & Balance</Text>
          <Text style={styles.subtitle}>{phaseText}</Text>
        </View>

        {/* Bottom zone */}
        <View style={styles.bottomZone}>
          {!sessionActive && (
            <TouchableOpacity activeOpacity={0.9} style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Start 1-Minute Session</Text>
            </TouchableOpacity>
          )}

          <View style={styles.pagination}>
            <Dot active={false} />
            <Dot active={true} />
            <Dot active={false} />
          </View>
      </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const C = {
  sand: theme.colors.background,
  forest: theme.colors.primary,
  textPrimary: theme.colors.textPrimary,
  textSecondary: theme.colors.textSecondary,
  dotInactive: theme.colors.accent2,
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.sand,
  },
  root: {
    flex: 1,
    backgroundColor: C.sand,
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
  circle: {
    width: Math.min(280, width * 0.7),
    height: Math.min(280, width * 0.7),
    borderRadius: Math.min(280, width * 0.7) / 2,
    backgroundColor: C.forest,
    opacity: 0.15,
  },
  circleStack: {
    width: Math.min(320, width * 0.8),
    height: Math.min(320, width * 0.8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: C.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: C.textSecondary,
    opacity: 0.9,
    letterSpacing: 0.2,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: C.forest,
    width: Math.min(320, Math.round(width * 0.8)),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  countdown: {
    position: 'absolute',
    color: '#2F3A32',
    fontSize: Math.min(72, Math.round(width * 0.2)),
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255,255,255,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginTop: 16,
  },
  skipBtn: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 5,
  },
  skipText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.dotInactive,
  },
});

 

