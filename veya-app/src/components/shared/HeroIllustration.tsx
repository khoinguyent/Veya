import React from 'react';
import { View, ViewProps, Image, ImageSourcePropType } from 'react-native';
import { theme } from '../../core/theme';

interface HeroIllustrationProps extends ViewProps {
  size?: number;
  color?: string;
}

export const HeroIllustration: React.FC<HeroIllustrationProps> = ({
  size = 300,
  color = theme.colors.primary,
  style,
  ...props
}) => {
  // Try to load PNG version if available, otherwise use placeholder
  let svgSource: ImageSourcePropType;
  try {
    svgSource = require('../../assets/illustrations/hero_fs2@1x.png');
  } catch {
    // Fallback to a simple colored circle if image not found
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]} {...props}>
        <View style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          backgroundColor: color,
          opacity: 0.2,
        }} />
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]} {...props}>
      <Image
        source={svgSource}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
};


