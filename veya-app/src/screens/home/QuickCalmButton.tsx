import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { theme } from '../../core/theme';

interface QuickCalmButtonProps {
  onPress?: () => void;
}

export const QuickCalmButton: React.FC<QuickCalmButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Typography variant="h3" style={styles.text}>
          Quick Calm
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Take a moment to breathe
        </Typography>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  text: {
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
});

