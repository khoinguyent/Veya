import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { theme } from '../../../core/theme';
import { apiService } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';

const { width } = Dimensions.get('window');
const ACCENT = '#4D6B64';
const EMOJI_OPTIONS = ['😀', '😊', '🙏', '🌟', '💖', '🌿', '✨', '🥰'];
const TAG_COLORS = [
  '#FADADD', // pastel pink
  '#E6F4EA', // mint
  '#FAF3DD', // light sand
  '#E0F2FF', // powder blue
  '#FBE4FF', // lavender
  '#FFEFD6', // peach
  '#E9ECFF', // periwinkle
  '#F4F1DE', // cream
];
const EXAMPLE_PROMPTS = [
  'Grateful for a good meal',
  'Thankful for a deep breath',
  'Appreciating a kind message',
  'Smiling about a shared laugh',
  'Grateful for quiet moments',
  'Thankful for feeling strong',
];

interface JournalCardProps {
  prompt: string;
  onPress?: () => void;
}

export const JournalCard: React.FC<JournalCardProps> = ({ prompt, onPress }) => {
  const svgAsset = require('../../../assets/illustrations/diary.svg');
  const svgUri = Image.resolveAssetSource(svgAsset).uri;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [note, setNote] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastEntry, setLastEntry] = useState<{ emoji: string; text: string } | null>(null);
  const [tags, setTags] =
    useState<Array<{ value: string; color: string }>>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const exampleOpacity = useRef(new Animated.Value(1)).current;
  const backendToken = useAuthStore((state) => state.backendToken);

  useEffect(() => {
    if (!modalVisible) return;
    const timer = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [modalVisible]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(exampleOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(exampleOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [exampleIndex, exampleOpacity]);

  const inspirationalPrompt = useMemo(
    () => EXAMPLE_PROMPTS[exampleIndex % EXAMPLE_PROMPTS.length],
    [exampleIndex],
  );

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1.05,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleOpenModal = () => {
    setModalVisible(true);
    setShowSuccess(false);
    onPress?.();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setShowSuccess(false);
    Keyboard.dismiss();
  };

  const handleSuggestion = (suggestion: string) => {
    setNote((prev) => {
      if (!prev.trim()) return suggestion;
      const separator = prev.trim().endsWith('.') || prev.trim().endsWith('!') ? ' ' : ' ';
      return `${prev}${separator}${suggestion}`;
    });
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.value === trimmed)) {
      setTagInput('');
      return;
    }
    const color =
      TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    setTags((prev) => [...prev, { value: trimmed, color }]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item.value !== tag));
  };

  const handleSubmit = async () => {
    const trimmed = note.trim();
    if (!trimmed) {
      animateButton();
      return;
    }
    if (!backendToken) {
      Alert.alert('Sign in required', 'Please sign in to save your gratitude notes.');
      return;
    }
    if (isSaving) return;

    animateButton();
    setIsSaving(true);

    try {
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
      const payload = {
        prompt,
        emoji: selectedEmoji,
        note: trimmed,
        tags: tags.map((tag) => tag.value),
        source: 'gratitude_journal',
        local_timezone: timezone,
        created_from_device: Platform.OS,
      };

      const response = await apiService.createJournalEntry(backendToken, payload);

      const savedEmoji = response.emoji || selectedEmoji;
      setLastEntry({ emoji: savedEmoji, text: trimmed });
      setShowSuccess(true);
      setNote('');
      setTags([]);
      onPress?.();
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (error: any) {
      console.error('Failed to save journal entry:', error);
      const message =
        error?.detail ||
        error?.message ||
        'Unable to save your note right now. Please try again later.';
      Alert.alert('Could not save entry', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.content}>
          <View style={styles.textSection}>
            <Text style={styles.prompt} numberOfLines={1} ellipsizeMode="tail">
              {prompt}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleOpenModal}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Write reflection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.illustrationContainer}>
        <SvgUri 
          uri={svgUri} 
          width={Math.min(160, width * 0.5)} 
          height={Math.min(160, width * 0.5)}
          style={styles.illustration}
        />
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.overlayBackdrop} onPress={Keyboard.dismiss} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalWrapper}
          >
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.headerTitleRow}>
                    <Text style={styles.modalTitle}>{selectedEmoji} What made you smile?</Text>
                    <Animated.View style={styles.floatingIcon}>
                      <Text style={styles.floatingIconText}>🌱</Text>
                    </Animated.View>
                  </View>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Animated.Text style={[styles.exampleText, { opacity: exampleOpacity }]}>
                  {`Idea: “${inspirationalPrompt}”`}
                </Animated.Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.emojiRow}
                >
                  {EMOJI_OPTIONS.map((emoji) => {
                    const isActive = emoji === selectedEmoji;
                    return (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.emojiButton,
                          isActive && { backgroundColor: ACCENT, transform: [{ scale: 1.08 }] },
                        ]}
                        onPress={() => setSelectedEmoji(emoji)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.emojiText, isActive && styles.emojiTextActive]}>
                          {emoji}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.inputWrapper}>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="A quick thanks today?"
                    placeholderTextColor="rgba(60, 57, 52, 0.45)"
                    multiline
                    style={styles.textInput}
                    textAlignVertical="top"
                    maxLength={240}
                  />
                </View>

                <View style={styles.tagInputRow}>
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Add a tag..."
                    placeholderTextColor="rgba(60, 57, 52, 0.4)"
                    style={styles.tagInput}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[
                      styles.addTagButton,
                      !tagInput.trim() && { opacity: 0.5 },
                    ]}
                    onPress={handleAddTag}
                    disabled={!tagInput.trim()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addTagButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {tags.length > 0 && (
                  <View style={styles.suggestionsRow}>
                    {tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.value}
                        style={[
                          styles.suggestionPill,
                          { backgroundColor: tag.color },
                        ]}
                        onPress={() => handleSuggestion(tag.value)}
                        onLongPress={() => handleRemoveTag(tag.value)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.suggestionText,
                            { color: '#3A3A38' },
                          ]}
                        >
                          {tag.value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Animated.View style={[styles.submitWrapper, { transform: [{ scale: buttonScale }] }]}>
                  <TouchableOpacity
                    style={[styles.submitButton, isSaving && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    activeOpacity={0.9}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Add Note</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {showSuccess && lastEntry && (
                  <View style={styles.successContainer}>
                    <Text style={styles.successTitle}>Thank you!</Text>
                    <Text style={styles.successSubtitle}>
                      {lastEntry.emoji} {lastEntry.text}
                    </Text>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setNote(lastEntry.text);
                        setSelectedEmoji(lastEntry.emoji);
                        setShowSuccess(false);
                      }}
                    >
                      <Text style={styles.editButtonText}>Edit latest entry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 8, // Reduced gap to ProgressCard
  },
  card: {
    backgroundColor: '#9CAFAA',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    overflow: 'hidden', // Clip card content but allow illustration to extend
    minHeight: 100, // Minimum height for consistent card sizing
    width: '90%', // Card width at 85%
    alignSelf: 'flex-start', // Align card to the left
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  textSection: {
    flex: 1,
    paddingRight: 100, // Padding to prevent overlap with illustration
    zIndex: 2,
  },
  prompt: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    lineHeight: 26,
  },
  button: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'flex-start', // Make button smaller and left-aligned
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  illustrationContainer: {
    position: 'absolute',
    right: -55, // Move SVG further right to show 1/3 outside card (card covers 2/3)
    top: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    // Illustration extends beyond card boundaries
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 26, 22, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    position: 'relative',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  modalCard: {
    backgroundColor: '#FBF5EC',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  floatingIcon: {
     position: 'absolute',
     right: -10,
     top: -18,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  floatingIconText: {
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: 'rgba(60, 57, 52, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  exampleText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(60, 57, 52, 0.7)',
    fontStyle: 'italic',
  },
  emojiRow: {
    marginTop: 18,
    gap: 10,
    paddingVertical: 2,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F4E6D8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  emojiText: {
    fontSize: 26,
  },
  emojiTextActive: {
    color: '#FFFFFF',
  },
  inputWrapper: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(92, 139, 112, 0.22)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 120,
  },
  textInput: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },
  tagInput: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(92, 139, 112, 0.24)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  addTagButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: ACCENT,
    borderRadius: 14,
  },
  addTagButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  suggestionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F0F4F3',
    borderRadius: 16,
  },
  suggestionText: {
    color: ACCENT,
    fontWeight: '600',
    fontSize: 13,
  },
  submitWrapper: {
    marginTop: 22,
  },
  submitButton: {
    backgroundColor: ACCENT,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  successContainer: {
    marginTop: 20,
    backgroundColor: '#E7F2EB',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ACCENT,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  editButtonText: {
    color: ACCENT,
    fontWeight: '600',
  },
});

