import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MoodIcon, MoodId } from '../../../components/shared/MoodIcon';

const { width, height } = Dimensions.get('window');

// Mood entry data interface
export interface MoodEntryData {
  moodId: MoodId;
  moodLabel: string;
  moodSvg?: string; // Optional: if API provides SVG URI directly
  currentNotes?: string; // Optional: pre-existing notes
}

// Props for the modal
export interface MoodEntryModalProps {
  visible: boolean;
  moodEntryData: MoodEntryData | null;
  onClose: () => void;
  onSave: (data: { moodId: MoodId; notes: string }) => void;
}

// Mood color palette
interface MoodColors {
  background: string;
  textPrimary: string;
  textSecondary: string;
  button: string;
  buttonText: string;
  inputBackground: string;
  inputBorder: string;
  closeButton: string;
}

const getMoodColors = (moodId: MoodId): MoodColors => {
  const colorMap: Record<MoodId, MoodColors> = {
    balanced: {
      background: '#F4E6C2', // Soft Sand
      textPrimary: '#3E4E42', // Dark olive
      textSecondary: '#5A6B5E',
      button: '#4A8066', // Forest green (theme primary)
      buttonText: '#F4E6C2',
      inputBackground: '#FFFFFF',
      inputBorder: '#E8D9B8',
      closeButton: '#5A6B5E',
    },
    sleepy: {
      background: '#B9C9D6', // Muted Mist Blue
      textPrimary: '#2E3E45', // Navy
      textSecondary: '#4A5A63',
      button: '#2E3E45',
      buttonText: '#B9C9D6',
      inputBackground: '#FFFFFF',
      inputBorder: '#A8B8C5',
      closeButton: '#4A5A63',
    },
    energetic: {
      background: '#F9D8A8', // Pastel Amber
      textPrimary: '#4A3A1E', // Dark brown
      textSecondary: '#6B5B3E',
      button: '#4A8066', // Forest green
      buttonText: '#F9D8A8',
      inputBackground: '#FFFFFF',
      inputBorder: '#F0C896',
      closeButton: '#6B5B3E',
    },
    angry: {
      background: '#E8A09A', // Pastel Clay Red
      textPrimary: '#442F2C', // Dark brown-red
      textSecondary: '#5A4542',
      button: '#442F2C',
      buttonText: '#E8A09A',
      inputBackground: '#FFFFFF',
      inputBorder: '#D9908A',
      closeButton: '#5A4542',
    },
    relaxed: {
      background: '#C9DFC8', // Pale Sage
      textPrimary: '#334336', // Dark sage green
      textSecondary: '#4A5F4D',
      button: '#4A8066', // Forest green
      buttonText: '#C9DFC8',
      inputBackground: '#FFFFFF',
      inputBorder: '#B8CFB7',
      closeButton: '#4A5F4D',
    },
  };
  return colorMap[moodId];
};

// Mood-specific messages
const getMoodMessage = (moodId: MoodId): string => {
  const messages: Record<MoodId, string> = {
    sleepy: "It's a bit sleepy now... Take a moment to rest.",
    balanced: "Feeling balanced and centered today.",
    angry: "I see you're feeling angry. Let's work through this together.",
    energetic: "Today is an exciting day! Full of energy and possibilities.",
    relaxed: "Feeling relaxed and at peace. Enjoy this calm moment.",
  };
  return messages[moodId];
};

// Mood-specific placeholder text
const getMoodPlaceholder = (moodId: MoodId): string => {
  const placeholders: Record<MoodId, string> = {
    sleepy: "What's making you feel sleepy? Share your thoughts...",
    balanced: "How are you feeling today? What's on your mind?",
    angry: "What's making you feel angry? Tell us about it...",
    energetic: "What's got you feeling energetic today? Share your excitement!",
    relaxed: "What's helping you feel relaxed? Enjoy this moment...",
  };
  return placeholders[moodId];
};

export const MoodEntryModal: React.FC<MoodEntryModalProps> = ({
  visible,
  moodEntryData,
  onClose,
  onSave,
}) => {
  const [notes, setNotes] = useState<string>('');

  // Reset notes when modal opens/closes or mood changes
  React.useEffect(() => {
    if (visible && moodEntryData) {
      setNotes(moodEntryData.currentNotes || '');
    } else if (!visible) {
      setNotes('');
    }
  }, [visible, moodEntryData]);

  const handleSave = () => {
    if (moodEntryData) {
      onSave({
        moodId: moodEntryData.moodId,
        notes: notes.trim(),
      });
      onClose();
    }
  };

  if (!moodEntryData) {
    return null;
  }

  const moodMessage = getMoodMessage(moodEntryData.moodId);
  const moodPlaceholder = getMoodPlaceholder(moodEntryData.moodId);
  const colors = getMoodColors(moodEntryData.moodId);

  // Dynamic styles based on mood colors
  const dynamicStyles = {
    modalContent: {
      backgroundColor: colors.background,
    },
    closeButtonText: {
      color: colors.closeButton,
    },
    moodMessage: {
      color: colors.textPrimary,
    },
    notesLabel: {
      color: colors.textSecondary,
    },
    notesInput: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.inputBorder,
      color: colors.textPrimary,
    },
    saveButton: {
      backgroundColor: colors.button,
      shadowColor: colors.button,
    },
    saveButtonText: {
      color: colors.buttonText,
    },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            style={[styles.modalContent, dynamicStyles.modalContent]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.closeButtonText, dynamicStyles.closeButtonText]}>✕</Text>
              </TouchableOpacity>

              {/* Mood message */}
              <Text style={[styles.moodMessage, dynamicStyles.moodMessage]}>{moodMessage}</Text>

              {/* Mood SVG */}
              <View style={styles.moodIconContainer}>
                <MoodIcon
                  moodId={moodEntryData.moodId}
                  size={150}
                />
              </View>

              {/* Notes input */}
              <View style={styles.notesContainer}>
                <Text style={[styles.notesLabel, dynamicStyles.notesLabel]}>Add your thoughts (optional)</Text>
                <TextInput
                  style={[styles.notesInput, dynamicStyles.notesInput]}
                  placeholder={moodPlaceholder}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={6}
                  value={notes}
                  onChangeText={setNotes}
                  textAlignVertical="top"
                />
              </View>

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveButton, dynamicStyles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={[styles.saveButtonText, dynamicStyles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    width: '100%',
    maxWidth: width * 0.9,
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  moodMessage: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  moodIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  notesInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

