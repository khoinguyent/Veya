import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import { useBreathTimer } from '../../hooks/useBreathTimer';

interface BreathPacerProps {
  breathDuration?: number; // Total breath cycle duration in seconds
  onComplete?: () => void;
}

export const BreathPacer: React.FC<BreathPacerProps> = ({
  breathDuration = 8,
  onComplete,
}) => {
  const { timer, isActive, start, pause, reset } = useBreathTimer({
    duration: breathDuration,
    onComplete,
  });

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const progress = timer / breathDuration;
    // Animate scale from 0.8 to 1.2 during breath cycle
    setScale(0.8 + progress * 0.4);
  }, [timer, breathDuration]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          {
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary,
    opacity: 0.3,
  },
});

