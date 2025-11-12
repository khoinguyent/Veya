import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { FieldDefinition } from './PersonalizeSection';
import { TimePicker } from './TimePicker';

interface FormFieldsProps {
  fields: FieldDefinition[];
  answers: Record<string, any>;
  onFieldChange: (fieldName: string, value: any) => void;
  accentColor: string;
  insets: { top: number; bottom: number };
}

export const FormFields: React.FC<FormFieldsProps> = ({
  fields,
  answers,
  onFieldChange,
  accentColor,
  insets,
}) => {
  return (
    <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
      {fields.map((field) => {
        if (field.type === 'text') {
          return (
            <TextField
              key={field.name}
              label={field.label}
              value={answers[field.name] || ''}
              onChangeText={(value) => onFieldChange(field.name, value)}
              optional={field.optional}
            />
          );
        } else if (field.type === 'dropdown' && field.options) {
          return (
            <Dropdown
              key={field.name}
              label={field.label}
              value={answers[field.name] || ''}
              options={field.options}
              onSelect={(value) => onFieldChange(field.name, value)}
              optional={field.optional}
            />
          );
        } else if (field.type === 'time') {
          return (
            <TimePicker
              key={field.name}
              label={field.label}
              value={answers[field.name] || ''}
              onSelect={(value) => onFieldChange(field.name, value)}
            />
          );
        }
        return null;
      })}
    </ScrollView>
  );
};

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  optional?: boolean;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
}

const TextField: React.FC<TextFieldProps> = ({ 
  label, 
  value, 
  onChangeText, 
  optional = false,
  keyboardType = 'default',
  placeholder,
}) => {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}{optional && ' (optional)'}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={'rgba(0,0,0,0.35)'}
        keyboardType={keyboardType}
      />
    </View>
  );
};

interface DropdownProps {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onSelect: (id: string) => void;
  optional?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onSelect, optional = false }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  const { width, height } = require('react-native').Dimensions.get('window');

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}{optional && ' (optional)'}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)}>
        <Text style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]}>
          {selected ? selected.label : 'Select...'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{label}</Text>
              <ScrollView style={styles.modalList}>
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.modalItem, value === opt.id && styles.modalItemSelected]}
                    onPress={() => {
                      onSelect(opt.id);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, value === opt.id && styles.modalItemTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  formScroll: {
    flex: 1,
    marginTop: 12,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    color: theme.colors.textPrimary,
  },
  dropdown: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  dropdownPlaceholder: {
    color: 'rgba(0,0,0,0.35)',
  },
  dropdownArrow: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    maxHeight: '60%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  modalItemSelected: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  modalItemText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  modalItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

