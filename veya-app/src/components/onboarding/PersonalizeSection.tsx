import React from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../core/theme';
import { ChoiceItem } from './ChoiceItem';
import { FormFields } from './FormFields';
import { ConsentCard } from './ConsentCard';

export interface TemplateItem {
  code: string;
  label: string;
  emoji?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface FieldDefinition {
  field_key?: string;
  name?: string;
  field_type?: string;
  type?: string;
  label: string;
  optional?: boolean;
  required?: boolean;
  options?: Array<{ id: string; label: string }>;
  placeholder?: string;
  keyboard_type?: string;
}

export interface PersonalizeSectionProps {
  screenKey: string;
  screenTitle: string;
  screenSubtitle: string;
  screenType: 'form' | 'multi' | 'single' | 'consent';
  screenIcon: string;
  templates: TemplateItem[];
  fields?: FieldDefinition[];
  selectedValues: string[];
  answers: Record<string, any>;
  onToggle: (value: string, isMulti: boolean) => void;
  onFieldChange: (fieldName: string, value: any) => void;
  accentColor: string;
  insets: { top: number; bottom: number };
}

export const PersonalizeSection: React.FC<PersonalizeSectionProps> = ({
  screenTitle,
  screenSubtitle,
  screenType,
  screenIcon,
  templates,
  fields,
  selectedValues,
  answers,
  onToggle,
  onFieldChange,
  accentColor,
  insets,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {screenIcon} {screenTitle}
        </Text>
        <Text style={styles.subtitle}>{screenSubtitle}</Text>
      </View>

      {/* Content based on screen type */}
      {screenType === 'form' && fields && (
        <FormFields
          fields={fields}
          answers={answers}
          onFieldChange={onFieldChange}
          accentColor={accentColor}
          insets={insets}
        />
      )}

      {(screenType === 'multi' || screenType === 'single') && (
        <FlatList
          data={templates.filter(t => t.is_active).sort((a, b) => a.display_order - b.display_order)}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <ChoiceItem
              code={item.code}
              label={item.label}
              emoji={item.emoji}
              selected={selectedValues.includes(item.code)}
              onPress={() => onToggle(item.code, screenType === 'multi')}
              accentColor={accentColor}
            />
          )}
          contentContainerStyle={[styles.choices, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {screenType === 'consent' && (
        <ConsentCard
          consent={answers.consent || false}
          onConsentChange={(value) => onFieldChange('consent', value)}
          accentColor={accentColor}
          insets={insets}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  choices: {
    marginTop: 12,
    gap: 12,
  },
});

