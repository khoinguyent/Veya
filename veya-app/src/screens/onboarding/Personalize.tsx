import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, ScrollView, NativeScrollEvent, NativeSyntheticEvent, FlatList, TextInput, Switch, Modal, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../core/theme';

const { width, height } = Dimensions.get('window');

// Helper function to get accent color per section index
// Maps: 0=basic, 1=lifestyle, 2=goals, 3=challenges, 4=practice, 5=experience, 6=mood, 7=time, 8=reminders, 9=interests, 10=consent
const getAccentColor = (sectionIndex: number): string => {
  const accentMap: Record<number, string> = {
    0: theme.colors.primary,      // basic (Goals section)
    1: theme.colors.secondary,    // lifestyle (Routine)
    2: theme.colors.primary,      // goals
    3: theme.colors.secondary,    // challenges
    4: theme.colors.accent1,      // practice (Preferences)
    5: theme.colors.secondary,    // experience (Routine)
    6: theme.colors.accent1,      // mood (Lifestyle)
    7: theme.colors.primary,      // time (Emotions)
    8: theme.colors.secondary,    // reminders (Notifications)
    9: theme.colors.accent1,      // interests (Review Summary)
    10: theme.colors.primary,     // consent (Home Transition)
  };
  return accentMap[sectionIndex] || theme.colors.primary;
};

type Choice = { id: string; label: string; emoji?: string };

// Remove old BG colors - all sections use unified background

// Dropdown options
const AGE_RANGES = [
  { id: '13-17', label: '13-17' },
  { id: '18-24', label: '18-24' },
  { id: '25-34', label: '25-34' },
  { id: '35-44', label: '35-44' },
  { id: '45-54', label: '45-54' },
  { id: '55-64', label: '55-64' },
  { id: '65+', label: '65+' },
];

const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'non_binary', label: 'Non-binary' },
  { id: 'prefer_not_say', label: 'Prefer not to say' },
];

const WORK_HOURS = [
  { id: 'under_4', label: 'Under 4 hours' },
  { id: '4_6', label: '4-6 hours' },
  { id: '6_8', label: '6-8 hours' },
  { id: '8_10', label: '8-10 hours' },
  { id: '10_12', label: '10-12 hours' },
  { id: 'over_12', label: 'Over 12 hours' },
];

const SCREEN_TIME_RANGES = [
  { id: 'under_2', label: 'Under 2 hours' },
  { id: '2_4', label: '2-4 hours' },
  { id: '4_6', label: '4-6 hours' },
  { id: '6_8', label: '6-8 hours' },
  { id: '8_10', label: '8-10 hours' },
  { id: 'over_10', label: 'Over 10 hours' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({ id: String(i), label: String(i).padStart(2, '0') }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ id: String(i), label: String(i).padStart(2, '0') }));

// Mock API response for dynamic items
const MOCK_DATA: Record<string, Choice[]> = {
  basic: [],
  lifestyle: [],
  goals: [
    { id: 'reduce_stress', label: 'Reduce stress', emoji: '🌿' },
    { id: 'sleep_better', label: 'Sleep better', emoji: '😴' },
    { id: 'improve_focus', label: 'Improve focus', emoji: '🎯' },
    { id: 'manage_emotions', label: 'Manage emotions', emoji: '💞' },
  ],
  challenges: [
    { id: 'overthinking', label: 'Overthinking', emoji: '🤯' },
    { id: 'burnout', label: 'Burnout', emoji: '🔥' },
    { id: 'fatigue', label: 'Fatigue', emoji: '🥱' },
    { id: 'insomnia', label: 'Insomnia', emoji: '🌙' },
    { id: 'low_motivation', label: 'Low motivation', emoji: '🪫' },
    { id: 'loneliness', label: 'Loneliness', emoji: '🫥' },
    { id: 'relationship_stress', label: 'Relationship stress', emoji: '💔' },
    { id: 'anxiety', label: 'Anxiety', emoji: '😟' },
  ],
  practice: [
    { id: 'breathing', label: 'Breathing', emoji: '🫁' },
    { id: 'guided_meditation', label: 'Guided meditation', emoji: '🧘' },
    { id: 'soundscape', label: 'Soundscape', emoji: '🌧️' },
    { id: 'short_reflections', label: 'Short reflections', emoji: '📝' },
    { id: 'mindful_journaling', label: 'Mindful journaling', emoji: '📓' },
  ],
  time: [
    { id: 'morning', label: 'Morning', emoji: '🌅' },
    { id: 'afternoon', label: 'Afternoon', emoji: '🌤️' },
    { id: 'night', label: 'Night', emoji: '🌃' },
  ],
  reminders: [
    { id: 'morning', label: 'Morning check-in', emoji: '🌞' },
    { id: 'midday', label: 'Midday break', emoji: '🌤️' },
    { id: 'evening', label: 'Evening reflection', emoji: '🌙' },
  ],
  experience: [
    { id: 'beginner', label: 'Beginner', emoji: '🌱' },
    { id: 'intermediate', label: 'Intermediate', emoji: '🌿' },
    { id: 'advanced', label: 'Advanced', emoji: '🌳' },
  ],
  mood: [
    { id: 'calm', label: 'Calm 😌' },
    { id: 'stressed', label: 'Stressed 😣' },
    { id: 'sad', label: 'Sad 😞' },
    { id: 'happy', label: 'Happy 😊' },
  ],
  interests: [
    { id: 'mindfulness', label: 'Mindfulness', emoji: '🧠' },
    { id: 'sleep_science', label: 'Sleep science', emoji: '🛌' },
    { id: 'productivity', label: 'Productivity', emoji: '⚡' },
    { id: 'relationships', label: 'Relationships', emoji: '💞' },
    { id: 'self_compassion', label: 'Self-compassion', emoji: '💗' },
  ],
  consent: [],
};

const PAGES = [
  {
    key: 'basic',
    title: 'Personalize Your Journey',
    subtitle: 'Tell us a bit about you',
    type: 'form' as const,
    icon: '👤',
  },
  {
    key: 'lifestyle',
    title: 'Lifestyle & Routine',
    subtitle: 'This helps us schedule sessions at the right times',
    type: 'form' as const,
    icon: '⏰',
  },
  {
    key: 'goals',
    title: 'Personalize Your Journey',
    subtitle: 'What brings you here today?',
    type: 'multi' as const,
    icon: '🎯',
  },
  {
    key: 'challenges',
    title: 'Personalize Your Journey',
    subtitle: 'Which challenges do you face most often?',
    type: 'multi' as const,
    icon: '💪',
  },
  {
    key: 'practice',
    title: 'Personalize Your Journey',
    subtitle: 'What type of practice do you enjoy?',
    type: 'multi' as const,
    icon: '🧘',
  },
  {
    key: 'experience',
    title: 'Experience Level',
    subtitle: 'We will tailor difficulty and guidance tone',
    type: 'single' as const,
    icon: '📚',
  },
  {
    key: 'mood',
    title: 'Mood Tendencies',
    subtitle: 'Pick the one that fits you most often',
    type: 'single' as const,
    icon: '😊',
  },
  {
    key: 'time',
    title: 'Personalize Your Journey',
    subtitle: 'When do you prefer to practice?',
    type: 'single' as const,
    icon: '🌅',
  },
  {
    key: 'reminders',
    title: 'Notifications & Reminders',
    subtitle: 'Choose when you want gentle nudges',
    type: 'multi' as const,
    icon: '🔔',
  },
  {
    key: 'interests',
    title: 'Optional Deep Interests',
    subtitle: 'This curates your articles and learning feed',
    type: 'multi' as const,
    icon: '📖',
  },
  {
    key: 'consent',
    title: 'Data Privacy & Consent',
    subtitle: 'Your wellness journey, your data',
    type: 'consent' as const,
    icon: '🔒',
  },
];

function Dot({ active, accentColor }: { active: boolean; accentColor: string }) {
  return <View style={[styles.dot, active && { backgroundColor: accentColor }]} />;
}

function ChoiceItem({ label, selected, onPress, emoji, accentColor }: { label: string; selected: boolean; onPress: () => void; emoji?: string; accentColor: string }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.choice, selected && { borderColor: accentColor, backgroundColor: `${accentColor}20` }]} onPress={onPress}>
      <View style={styles.choiceRow}>
        {!!emoji && <Text style={styles.choiceEmoji}>{emoji}</Text>}
        <Text style={[styles.choiceText, selected && { color: accentColor, fontWeight: '600' }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function TextField({ label, value, onChangeText, keyboardType = 'default' as const, optional = false }: { label: string; value: string; onChangeText: (t: string) => void; keyboardType?: 'default' | 'numeric'; optional?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}{optional && ' (optional)'}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor={'rgba(0,0,0,0.35)'}
      />
    </View>
  );
}

function Dropdown({ label, value, options, onSelect, optional = false }: { label: string; value: string; options: { id: string; label: string }[]; onSelect: (id: string) => void; optional?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
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
                    <Text style={[styles.modalItemText, value === opt.id && styles.modalItemTextSelected]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function TimePicker({ label, value, onSelect }: { label: string; value: string; onSelect: (v: string) => void }) {
  const parseValue = (val: string) => {
    if (!val) return { hour: '07', minute: '00', hourEnd: '07', minuteEnd: '30', isRange: false };
    if (val.includes(' - ')) {
      const [start, end] = val.split(' - ');
      const [h1, m1] = start.split(':');
      const [h2, m2] = end.split(':');
      return {
        hour: String(h1).padStart(2, '0'),
        minute: String(m1 || '00').padStart(2, '0'),
        hourEnd: String(h2).padStart(2, '0'),
        minuteEnd: String(m2 || '00').padStart(2, '0'),
        isRange: true,
      };
    }
    const [h, m] = val.split(':');
    return {
      hour: String(h).padStart(2, '0'),
      minute: String(m || '00').padStart(2, '0'),
      hourEnd: '07',
      minuteEnd: '30',
      isRange: false,
    };
  };

  const parsed = parseValue(value);
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [hourEnd, setHourEnd] = useState(parsed.hourEnd);
  const [minuteEnd, setMinuteEnd] = useState(parsed.minuteEnd);
  const [isRange, setIsRange] = useState(parsed.isRange);

  useEffect(() => {
    const p = parseValue(value);
    setHour(p.hour);
    setMinute(p.minute);
    setHourEnd(p.hourEnd);
    setMinuteEnd(p.minuteEnd);
    setIsRange(p.isRange);
  }, [value]);

  const formatTime = (h: string, m: string) => {
    const hPadded = String(h).padStart(2, '0');
    const mPadded = String(m).padStart(2, '0');
    return `${hPadded}:${mPadded}`;
  };
  const displayValue = value || (isRange ? `${formatTime(hour, minute)} - ${formatTime(hourEnd, minuteEnd)}` : formatTime(hour, minute));

  const handleConfirm = () => {
    const result = isRange ? `${formatTime(hour, minute)} - ${formatTime(hourEnd, minuteEnd)}` : formatTime(hour, minute);
    onSelect(result);
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>{displayValue || 'Select time...'}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.timePickerContent}>
              <View style={styles.timePickerHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity onPress={() => setIsRange(!isRange)}>
                  <Text style={styles.rangeToggle}>{isRange ? 'Range' : 'Single'} {isRange ? '✓' : ''}</Text>
                </TouchableOpacity>
              </View>
              {!isRange ? (
                <View style={styles.timePickerBody}>
                  <ScrollView style={styles.timePickerColumn}>
                    {HOURS.map((h) => {
                      const hPadded = h.id.padStart(2, '0');
                      return (
                        <TouchableOpacity key={h.id} style={[styles.timePickerItem, hour === hPadded && styles.timePickerItemSelected]} onPress={() => setHour(hPadded)}>
                          <Text style={[styles.timePickerItemText, hour === hPadded && styles.timePickerItemTextSelected]}>{h.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.timePickerSeparator}>:</Text>
                  <ScrollView style={styles.timePickerColumn}>
                    {MINUTES.filter((_, i) => i % 5 === 0).map((m) => {
                      const mPadded = m.id.padStart(2, '0');
                      return (
                        <TouchableOpacity key={m.id} style={[styles.timePickerItem, minute === mPadded && styles.timePickerItemSelected]} onPress={() => setMinute(mPadded)}>
                          <Text style={[styles.timePickerItemText, minute === mPadded && styles.timePickerItemTextSelected]}>{m.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.timePickerBody}>
                  <View style={styles.timeRangeSection}>
                    <Text style={styles.timeRangeLabel}>From</Text>
                    <View style={styles.timePickerRow}>
                      <ScrollView style={styles.timePickerColumn}>
                        {HOURS.map((h) => {
                          const hPadded = h.id.padStart(2, '0');
                          return (
                            <TouchableOpacity key={h.id} style={[styles.timePickerItem, hour === hPadded && styles.timePickerItemSelected]} onPress={() => setHour(hPadded)}>
                              <Text style={[styles.timePickerItemText, hour === hPadded && styles.timePickerItemTextSelected]}>{h.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <Text style={styles.timePickerSeparator}>:</Text>
                      <ScrollView style={styles.timePickerColumn}>
                        {MINUTES.filter((_, i) => i % 5 === 0).map((m) => {
                          const mPadded = m.id.padStart(2, '0');
                          return (
                            <TouchableOpacity key={m.id} style={[styles.timePickerItem, minute === mPadded && styles.timePickerItemSelected]} onPress={() => setMinute(mPadded)}>
                              <Text style={[styles.timePickerItemText, minute === mPadded && styles.timePickerItemTextSelected]}>{m.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                  <View style={styles.timeRangeSection}>
                    <Text style={styles.timeRangeLabel}>To</Text>
                    <View style={styles.timePickerRow}>
                      <ScrollView style={styles.timePickerColumn}>
                        {HOURS.map((h) => {
                          const hPadded = h.id.padStart(2, '0');
                          return (
                            <TouchableOpacity key={h.id} style={[styles.timePickerItem, hourEnd === hPadded && styles.timePickerItemSelected]} onPress={() => setHourEnd(hPadded)}>
                              <Text style={[styles.timePickerItemText, hourEnd === hPadded && styles.timePickerItemTextSelected]}>{h.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <Text style={styles.timePickerSeparator}>:</Text>
                      <ScrollView style={styles.timePickerColumn}>
                        {MINUTES.filter((_, i) => i % 5 === 0).map((m) => {
                          const mPadded = m.id.padStart(2, '0');
                          return (
                            <TouchableOpacity key={m.id} style={[styles.timePickerItem, minuteEnd === mPadded && styles.timePickerItemSelected]} onPress={() => setMinuteEnd(mPadded)}>
                              <Text style={[styles.timePickerItemText, minuteEnd === mPadded && styles.timePickerItemTextSelected]}>{m.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              )}
              <View style={styles.timePickerActions}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setOpen(false)}>
                  <Text style={[styles.btnText, styles.btnGhostText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={handleConfirm}>
                  <Text style={styles.btnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function Personalize() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<ScrollView | null>(null);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const onToggle = (pageKey: string, choiceId: string, multi: boolean) => {
    setAnswers((prev) => {
      const current = prev[pageKey] ?? [];
      if (multi) {
        const exists = current.includes(choiceId);
        const next = exists ? current.filter((c) => c !== choiceId) : [...current, choiceId];
        return { ...prev, [pageKey]: next };
      }
      return { ...prev, [pageKey]: [choiceId] };
    });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(x / width);
    if (nextIndex !== page) setPage(nextIndex);
  };

  const goTo = (idx: number) => {
    if (!pagerRef.current) return;
    pagerRef.current.scrollTo({ x: width * idx, animated: true });
    setPage(idx);
  };

  const onNext = () => {
    if (page < PAGES.length - 1) goTo(page + 1);
  };
  const onBack = () => {
    if (page > 0) goTo(page - 1);
  };

  const isLast = page === PAGES.length - 1;
  const currentAccent = getAccentColor(page);
  const unifiedBg = theme.colors.background;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: unifiedBg }]}>
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
        {PAGES.map((p) => {
          const selected = answers[p.key] ?? [];
          const data = MOCK_DATA[p.key] ?? [];
          return (
            <View key={p.key} style={[styles.page, { backgroundColor: unifiedBg, paddingTop: insets.top + 16 } ]}>
              <View style={styles.header}>
                <Text style={styles.title}>{p.icon} {p.title}</Text>
                <Text style={styles.subtitle}>{p.subtitle}</Text>
              </View>

              {p.type === 'form' && (
                <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
                  {p.key === 'basic' && (
                    <>
                      <TextField label="Name" value={answers.name ?? ''} onChangeText={(t) => setAnswers((s) => ({ ...s, name: t }))} />
                      <Dropdown label="Age range" value={answers.ageRange ?? ''} options={AGE_RANGES} onSelect={(id) => setAnswers((s) => ({ ...s, ageRange: id }))} />
                      <Dropdown label="Gender" value={answers.gender ?? ''} options={GENDERS} onSelect={(id) => setAnswers((s) => ({ ...s, gender: id }))} optional />
                      <TextField label="Occupation" value={answers.occupation ?? ''} onChangeText={(t) => setAnswers((s) => ({ ...s, occupation: t }))} optional />
                    </>
                  )}
                  {p.key === 'lifestyle' && (
                    <>
                      <TimePicker label="Wake-up time" value={answers.wake ?? ''} onSelect={(v) => setAnswers((s) => ({ ...s, wake: v }))} />
                      <TimePicker label="Sleep time" value={answers.sleep ?? ''} onSelect={(v) => setAnswers((s) => ({ ...s, sleep: v }))} />
                      <Dropdown label="Average daily work hours" value={answers.workHours ?? ''} options={WORK_HOURS} onSelect={(id) => setAnswers((s) => ({ ...s, workHours: id }))} />
                      <Dropdown label="Daily screen time" value={answers.screenTime ?? ''} options={SCREEN_TIME_RANGES} onSelect={(id) => setAnswers((s) => ({ ...s, screenTime: id }))} />
                    </>
                  )}
                </ScrollView>
              )}

              {p.type !== 'form' && p.type !== 'consent' && (
                <FlatList
                  data={data}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <ChoiceItem
                      label={item.label}
                      emoji={item.emoji}
                      selected={(answers[p.key] ?? []).includes(item.id)}
                      onPress={() => onToggle(p.key, item.id, p.type === 'multi')}
                      accentColor={getAccentColor(PAGES.findIndex((pg) => pg.key === p.key))}
                    />
                  )}
                  contentContainerStyle={[styles.choices, { paddingBottom: insets.bottom + 140 }]}
                  showsVerticalScrollIndicator={false}
                />
              )}

              {p.type === 'consent' && (
                <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
                  <View style={styles.consentCard}>
                    <Text style={styles.consentIcon}>🔒</Text>
                    <Text style={styles.consentTitle}>Your Data, Your Privacy</Text>
                    <Text style={styles.consentDescription}>
                      We use your wellness data to personalize your experience—recommending sessions, articles, and reminders that fit your goals and challenges.
                    </Text>
                    <Text style={styles.consentDescription}>
                      Your data stays secure and is never shared with third parties. You can update your preferences anytime in settings.
                    </Text>
                    <View style={styles.consentToggleRow}>
                      <Switch
                        value={!!answers.consent}
                        onValueChange={(v) => setAnswers((s) => ({ ...s, consent: v }))}
                        trackColor={{ false: theme.colors.accent2, true: currentAccent }}
                        thumbColor={answers.consent ? '#FFFFFF' : '#FFFFFF'}
                      />
                      <Text style={styles.consentToggleText}>I agree to use my wellness data for personalized insights</Text>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom controls */}
      <View style={[styles.bottom, { backgroundColor: unifiedBg }]}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {page + 1} of {PAGES.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((page + 1) / PAGES.length) * 100}%`, backgroundColor: currentAccent }]} />
          </View>
        </View>

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {PAGES.map((_, i) => (
            <Dot key={i} active={i === page} accentColor={getAccentColor(i)} />
          ))}
        </View>

        {/* Swipe hint */}
        {page < PAGES.length - 1 && (
          <Text style={styles.swipeHint}>Swipe or tap to continue →</Text>
        )}

        {/* Single Continue button */}
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: currentAccent }, isLast && styles.continueBtnFinal]}
          onPress={isLast ? () => navigation.replace('Main') : onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>
            {isLast ? 'Complete Setup' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  page: {
    width,
    height,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
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
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
    opacity: 0.7,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  swipeHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.6,
  },
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  continueBtnFinal: {
    // Final button can be slightly darker
  },
  continueBtnText: {
    color: theme.colors.background,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
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
  formScroll: {
    flex: 1,
    marginTop: 12,
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
    width: width * 0.85,
    maxHeight: height * 0.6,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  modalList: {
    maxHeight: height * 0.4,
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
  timePickerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: width,
    maxHeight: height * 0.7,
    padding: 20,
    paddingBottom: 40,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rangeToggle: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  timePickerBody: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePickerColumn: {
    width: 80,
    maxHeight: 200,
  },
  timePickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  timePickerItemSelected: {
    backgroundColor: `${theme.colors.primary}25`,
  },
  timePickerItemText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  timePickerItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  timePickerSeparator: {
    fontSize: 24,
    marginHorizontal: 8,
    color: theme.colors.textPrimary,
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  timeRangeSection: {
    flex: 1,
    alignItems: 'center',
  },
  timeRangeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  consentCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 24,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  consentIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  consentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  consentDescription: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  consentToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: 12,
  },
  consentToggleText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
});


