import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { theme } from '../../../core/theme';

const { width } = Dimensions.get('window');

interface DailyFocusCardProps {
  title: string;
  description?: string;
  duration: string;
  onPress?: () => void;
}

export const DailyFocusCard: React.FC<DailyFocusCardProps> = ({
  title,
  description = 'Boost your mood with positive vibes.',
  duration,
  onPress,
}) => {
  const svgAsset = require('../../../assets/illustrations/positive_vibe.svg');
  const svgUri = Image.resolveAssetSource(svgAsset).uri;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          <View style={styles.textSection}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            <View style={styles.durationRow}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
              <Text style={styles.duration}>{duration}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.illustrationContainer}>
        <SvgUri 
          uri={svgUri} 
          width={Math.min(160, width * 0.5)} 
          height={Math.min(160, width * 0.5)}
          style={styles.illustration}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FCE4E4', // Pastel peach-pink
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    overflow: 'hidden', // Clip card content but allow illustration to extend
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  textSection: {
    flex: 1,
    paddingRight: 100, // Increased padding to prevent overlap with illustration
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.85,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 2,
  },
  duration: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  illustrationContainer: {
    position: 'absolute',
    right: -25,
    top: 20,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    transform: [{ scaleX: -1 }], // Flip
  },
});

