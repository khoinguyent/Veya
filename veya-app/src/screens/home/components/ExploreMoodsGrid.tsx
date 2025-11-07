import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../../../core/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2; // 24px padding each side, 12px gap

interface MoodCard {
  id: string;
  title: string;
  duration: string;
  emoji: string;
}

interface ExploreMoodsGridProps {
  moods: MoodCard[];
  onPress?: (id: string) => void;
}

export const ExploreMoodsGrid: React.FC<ExploreMoodsGridProps> = ({ moods, onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Explore Moods</Text>
      <View style={styles.grid}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={styles.card}
            onPress={() => onPress?.(mood.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={styles.title}>{mood.title}</Text>
            <Text style={styles.duration}>{mood.duration}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  duration: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

