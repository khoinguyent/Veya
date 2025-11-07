import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../ui/Typography';
import { theme } from '../../core/theme';
import { useAudio } from '../../hooks/useAudio';
import { formatTime } from '../../utils/formatTime';

interface AudioPlayerControlsProps {
  audioUri: string;
  title?: string;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  audioUri,
  title,
}) => {
  const { isPlaying, duration, position, play, pause, seek } = useAudio(audioUri);

  return (
    <View style={styles.container}>
      {title && (
        <Typography variant="h3" style={styles.title}>
          {title}
        </Typography>
      )}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={isPlaying ? pause : play}
        >
          <Typography variant="body">
            {isPlaying ? 'Pause' : 'Play'}
          </Typography>
        </TouchableOpacity>
      </View>
      <View style={styles.timeContainer}>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {formatTime(position)} / {formatTime(duration)}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  title: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  button: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  timeContainer: {
    alignItems: 'center',
  },
});

