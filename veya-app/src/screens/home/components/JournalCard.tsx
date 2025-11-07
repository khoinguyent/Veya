import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { theme } from '../../../core/theme';

const { width } = Dimensions.get('window');

interface JournalCardProps {
  prompt: string;
  onPress?: () => void;
}

export const JournalCard: React.FC<JournalCardProps> = ({
  prompt,
  onPress,
}) => {
  const svgAsset = require('../../../assets/illustrations/diary.svg');
  const svgUri = Image.resolveAssetSource(svgAsset).uri;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.content}>
          <View style={styles.textSection}>
            <Text style={styles.prompt} numberOfLines={1} ellipsizeMode="tail">{prompt}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                console.log('Journal entry tapped');
                onPress?.();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Write reflection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    marginBottom: 8, // Reduced gap to ProgressCard
  },
  card: {
    backgroundColor: '#E2B59A',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    overflow: 'hidden', // Clip card content but allow illustration to extend
    minHeight: 100, // Minimum height for consistent card sizing
    width: '90%', // Card width at 85%
    alignSelf: 'flex-start', // Align card to the left
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  textSection: {
    flex: 1,
    paddingRight: 100, // Padding to prevent overlap with illustration
    zIndex: 2,
  },
  prompt: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    lineHeight: 26,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'flex-start', // Make button smaller and left-aligned
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  illustrationContainer: {
    position: 'absolute',
    right: -55, // Move SVG further right to show 1/3 outside card (card covers 2/3)
    top: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    // Illustration extends beyond card boundaries
  },
});

