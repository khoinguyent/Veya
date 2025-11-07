import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'medium',
  style,
  ...props
}) => {
  const paddingStyle = {
    none: { padding: 0 },
    small: { padding: theme.spacing.sm },
    medium: { padding: theme.spacing.md },
    large: { padding: theme.spacing.lg },
  };

  return (
    <View
      style={[styles.card, paddingStyle[padding], style]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

