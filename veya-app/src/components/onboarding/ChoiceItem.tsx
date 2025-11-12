import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

interface ChoiceItemProps {
  code: string;
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  accentColor: string;
}

export const ChoiceItem: React.FC<ChoiceItemProps> = ({
  label,
  emoji,
  selected,
  onPress,
  accentColor,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.choice, selected && { borderColor: accentColor, backgroundColor: `${accentColor}20` }]}
      onPress={onPress}
    >
      <View style={styles.choiceRow}>
        {!!emoji && <Text style={styles.choiceEmoji}>{emoji}</Text>}
        <Text style={[styles.choiceText, selected && { color: accentColor, fontWeight: '600' }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  choice: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: theme.colors.card,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  choiceEmoji: {
    fontSize: 18,
  },
  choiceText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
});

