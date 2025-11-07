import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  children: React.ReactNode;
  color?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  children,
  color = theme.colors.text,
  style,
  ...props
}) => {
  const variantStyle = styles[variant];
  
  return (
    <Text
      style={[
        styles.base,
        variantStyle,
        color && { color },
        style,
      ].filter(Boolean)}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
  h1: theme.typography.h1,
  h2: theme.typography.h2,
  h3: theme.typography.h3,
  body: theme.typography.body,
  caption: theme.typography.caption,
  small: theme.typography.small,
});

