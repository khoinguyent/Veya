import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../../../core/theme';

interface GreetingHeaderProps {
  name?: string;
  nickname?: string;
  subtitle?: string;
  timezone?: string;
  avatarUrl?: string | null;
  avatarInitials?: string;
  onAvatarPress?: () => void;
}

type GreetingTheme = {
  match: (hour: number) => boolean;
  title: string;
  subtitles: string[];
};

const GREETING_THEMES: GreetingTheme[] = [
  {
    match: (hour) => hour >= 5 && hour < 11,
    title: 'Good morning',
    subtitles: [
      'Start your day grounded.',
      'Slow breaths, fresh focus.',
      'Rise gently into today.',
    ],
  },
  {
    match: (hour) => hour >= 11 && hour < 17,
    title: 'Good afternoon',
    subtitles: [
      'Keep your calm flowing.',
      'Take a mindful pause.',
      'Reset with a deep breath.',
    ],
  },
  {
    match: (hour) => hour >= 17 && hour < 21,
    title: 'Good evening',
    subtitles: [
      'Unwind and reflect gently.',
      'Slow down with gratitude.',
      'Let the day settle softly.',
    ],
  },
  {
    match: () => true,
    title: 'Good night',
    subtitles: [
      'You’ve done enough today.',
      'Rest comes from within.',
      'Soften your thoughts for sleep.',
    ],
  },
];

const resolveHourForTimezone = (timezone?: string) => {
  const now = new Date();
  if (!timezone) return now.getHours();

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    });
    const hour = Number(formatter.format(now));
    if (!Number.isNaN(hour)) {
      return hour;
    }
  } catch (error) {
    console.warn('GreetingHeader: failed to parse timezone, using device time', error);
  }
  return now.getHours();
};

const pickDynamicSubtitle = (theme: GreetingTheme, hour: number) => {
  if (!theme.subtitles.length) return 'Take a mindful moment.';
  const index = hour % theme.subtitles.length;
  return theme.subtitles[index];
};

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  name = 'Mindful Explorer',
  nickname,
  subtitle,
  timezone,
  avatarUrl,
  avatarInitials,
  onAvatarPress,
}) => {
  const displayName = nickname || name || 'Mindful Explorer';
  const initialsSource = avatarInitials || displayName.slice(0, 2) || 'ME';

  const greeting = useMemo(() => {
    const hour = resolveHourForTimezone(timezone);
    const theme = GREETING_THEMES.find((item) => item.match(hour)) ?? GREETING_THEMES[GREETING_THEMES.length - 1];
    const dynamicSubtitle = pickDynamicSubtitle(theme, hour);

    return {
      title: theme.title,
      subtitle: subtitle ?? dynamicSubtitle,
    };
  }, [subtitle, timezone]);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>{greeting.title}, {displayName}</Text>
        <Text style={styles.subtext}>{greeting.subtitle}</Text>
      </View>

      <TouchableOpacity
        onPress={onAvatarPress}
        activeOpacity={0.8}
        style={styles.avatarButton}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>
              {initialsSource.toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 24,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    opacity: 0.8,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#D1E5D9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C5DBC9',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F4F3E',
    letterSpacing: 0.5,
  },
});

