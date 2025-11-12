import React, { useRef, useEffect, useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Animated, Dimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { theme } from '../../core/theme';
import { GreetingHeader } from './components/GreetingHeader';
import { MoodTracker } from './components/MoodTracker';
import { DailyFocusCard } from './components/DailyFocusCard';
import { MoodTrendsChart } from './components/MoodTrendsChart';
import { ProgressCard, ActivityData } from './components/ProgressCard';
import { JournalCard } from './components/JournalCard';
import { QuoteCard } from './components/QuoteCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserInfoStore } from '../../store/useUserInfoStore';
import { MainTabParamList } from '../../navigation/BottomTabs';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HOME_PALETTE = {
  clay: '#DE9A67',
  cream: '#FDF1DF',
  drift: '#D7D7D7',
  tide: '#7EACB8',
};

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
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const backendToken = useAuthStore((state) => state.backendToken);
  const userInfo = useUserInfoStore((state) => state.userInfo);
  const loadCachedUserInfo = useUserInfoStore((state) => state.loadCachedUserInfo);
  const fetchUserInfo = useUserInfoStore((state) => state.fetchUserInfo);

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

  useEffect(() => {
    loadCachedUserInfo();
  }, [loadCachedUserInfo]);

  useEffect(() => {
    if (!backendToken) return;
    fetchUserInfo(backendToken).catch((error) => {
      console.warn('Failed to refresh user info on home:', error);
    });
  }, [backendToken, fetchUserInfo]);

  const displayName = useMemo(() => {
    if (!userInfo) return 'Mindful Explorer';
    const rawName =
      userInfo.display_name ||
      userInfo.nickname ||
      [userInfo.firstname, userInfo.lastname].filter(Boolean).join(' ').trim() ||
      userInfo.username ||
      userInfo.email ||
      'Mindful Explorer';

    if (!rawName) return 'Mindful Explorer';

    const parts = rawName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase() || ''}.`.trim();
    }

    return parts[0] || 'Mindful Explorer';
  }, [
    userInfo?.display_name,
    userInfo?.nickname,
    userInfo?.firstname,
    userInfo?.lastname,
    userInfo?.username,
    userInfo?.email,
  ]);

  const avatarInitials = useMemo(() => {
    const source =
      displayName ||
      userInfo?.display_name ||
      userInfo?.nickname ||
      [userInfo?.firstname, userInfo?.lastname].filter(Boolean).join(' ') ||
      userInfo?.username ||
      userInfo?.email ||
      'ME';

    const cleaned = source.trim();
    if (!cleaned) {
      return 'ME';
    }

    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    const first = parts[0][0];
    const last = parts[parts.length - 1][0];
    return `${first ?? ''}${last ?? ''}`.toUpperCase() || 'ME';
  }, [
    displayName,
    userInfo?.display_name,
    userInfo?.nickname,
    userInfo?.firstname,
    userInfo?.lastname,
    userInfo?.username,
    userInfo?.email,
  ]);

  const handleAvatarPress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[HOME_PALETTE.clay, HOME_PALETTE.cream, HOME_PALETTE.drift, HOME_PALETTE.tide]}
        locations={[0, 0.36, 0.68, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(12, insets.top - 24),
            paddingBottom: insets.bottom + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnims[0], transform: [{ translateY: fadeAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <GreetingHeader
            name={displayName}
            nickname={userInfo?.nickname}
            subtitle="How are you feeling today?"
            avatarUrl={userInfo?.avatar_url}
            avatarInitials={avatarInitials}
            timezone={userInfo?.timezone}
            onAvatarPress={handleAvatarPress}
          />
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
    backgroundColor: HOME_PALETTE.clay,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    gap: 24,
  },
});

