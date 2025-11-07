import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';

export type MoodId = 'sleepy' | 'balanced' | 'angry' | 'energetic' | 'relaxed';

interface MoodIconProps {
  moodId: MoodId | string;
  size?: number;
  emoji?: string;
}

// Load SVG assets
const sleepySvgAsset = require('../../assets/illustrations/sleepy.svg');
const sleepySvgUri = Image.resolveAssetSource(sleepySvgAsset).uri;

const angrySvgAsset = require('../../assets/illustrations/angry.svg');
const angrySvgUri = Image.resolveAssetSource(angrySvgAsset).uri;

const balanceSvgAsset = require('../../assets/illustrations/balance.svg');
const balanceSvgUri = Image.resolveAssetSource(balanceSvgAsset).uri;

const energeticSvgAsset = require('../../assets/illustrations/enegertic.svg');
const energeticSvgUri = Image.resolveAssetSource(energeticSvgAsset).uri;

const relaxedSvgAsset = require('../../assets/illustrations/relaxed.svg');
const relaxedSvgUri = Image.resolveAssetSource(relaxedSvgAsset).uri;

const MOOD_SVG_MAP: Record<MoodId, string | null> = {
  sleepy: sleepySvgUri,
  angry: angrySvgUri,
  balanced: balanceSvgUri,
  energetic: energeticSvgUri,
  relaxed: relaxedSvgUri,
};

export const MoodIcon: React.FC<MoodIconProps> = ({ 
  moodId, 
  size = 100,
  emoji 
}) => {
  const svgUri = MOOD_SVG_MAP[moodId as MoodId];

  if (svgUri) {
    return (
      <View style={[styles.svgContainer, { width: size, height: size }]}>
        <SvgUri 
          uri={svgUri} 
          width={size} 
          height={size}
        />
      </View>
    );
  }

  // Fallback to emoji
  return (
    <Text style={[styles.moodEmoji, { fontSize: size * 0.56 }]}>
      {emoji || '😊'}
    </Text>
  );
};

const styles = StyleSheet.create({
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  moodEmoji: {
    marginBottom: 0,
  },
});

