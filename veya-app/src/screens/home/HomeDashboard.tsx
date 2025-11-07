import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { GreetingHeader } from './components/GreetingHeader';
import { MoodTracker } from './components/MoodTracker';
import { DailyFocusCard } from './components/DailyFocusCard';
import { MoodTrendsChart } from './components/MoodTrendsChart';
import { ProgressCard, ActivityData } from './components/ProgressCard';
import { JournalCard } from './components/JournalCard';
import { QuoteCard } from './components/QuoteCard';

const { width } = Dimensions.get('window');

// Mock API function - Replace with actual API call later
const fetchActiveActivity = async (): Promise<ActivityData | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data: User is in a "7 days meditation" challenge
  return {
    id: 'activity-1',
    name: '7 Days Meditation',
    type: 'meditation',
    currentStreak: 4, // User has completed 4 days
    totalSessions: 12,
    totalMinutes: 48,
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    targetDays: 7,
  };
};

export const HomeDashboard: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeActivity, setActiveActivity] = useState<ActivityData | null>(null);
  const fadeAnims = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0))
  ).current;

  // Fetch active activity on mount
  useEffect(() => {
    const loadActivity = async () => {
      try {
        const activity = await fetchActiveActivity();
        setActiveActivity(activity);
      } catch (error) {
        console.error('Failed to load active activity:', error);
        setActiveActivity(null);
      }
    };

    loadActivity();
  }, []);

  useEffect(() => {
    Animated.stagger(100, fadeAnims.map((anim) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    )).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnims[0], transform: [{ translateY: fadeAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <GreetingHeader name="Kai" />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnims[1], transform: [{ translateY: fadeAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <MoodTracker />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnims[2], transform: [{ translateY: fadeAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], paddingRight: 20 }}>
          <DailyFocusCard
            title="Positive Vibes"
            duration="32 min"
            onPress={() => console.log('Daily focus tapped')}
          />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnims[3], transform: [{ translateY: fadeAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], paddingRight: 20 }}>
          <MoodTrendsChart />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnims[4], transform: [{ translateY: fadeAnims[4].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <ProgressCard activity={activeActivity} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnims[5], transform: [{ translateY: fadeAnims[5].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <JournalCard
            prompt="A quick thanks?"
            onPress={() => console.log('Journal tapped')}
          />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnims[6], transform: [{ translateY: fadeAnims[6].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <QuoteCard />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Sand primary color
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
});

