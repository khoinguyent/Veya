import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../core/theme';

interface GreetingHeaderProps {
  name?: string;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({ name = 'Kai' }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        {getGreeting()}, {name} 👋
      </Text>
      <Text style={styles.subtext}>Take a mindful moment.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    opacity: 0.8,
  },
});

