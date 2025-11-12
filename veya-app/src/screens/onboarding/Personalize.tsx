import React, { useRef, useState, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, ScrollView, NativeScrollEvent, NativeSyntheticEvent, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../core/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { apiService } from '../../services/api';
import { PersonalizeSection, TemplateItem, FieldDefinition } from '../../components/onboarding/PersonalizeSection';

const { width, height } = Dimensions.get('window');

// Use consistent green color for all personalize screens
const PERSONALIZE_ACCENT_COLOR = '#5C8B70'; // Dark green from the button

// Helper function to get accent color per section index
// All personalize screens now use the same green color
const getAccentColor = (sectionIndex: number): string => {
  return PERSONALIZE_ACCENT_COLOR;
};

// Map backend field_key to answer key in form
const FIELD_KEY_MAP: Record<string, string> = {
  name: 'name',
  age_range: 'ageRange',
  gender: 'gender',
  occupation: 'occupation',
  wake_time: 'wake',
  sleep_time: 'sleep',
  work_hours: 'workHours',
  screen_time: 'screenTime',
};

// Map backend category/screen_key to answer key
const CATEGORY_KEY_MAP: Record<string, string> = {
  goals: 'goals',
  challenges: 'challenges',
  practices: 'practice',
  practice_preferences: 'practice',
  interests: 'interests',
  reminders: 'reminders',
  experience_levels: 'experience',
  mood_tendencies: 'mood',
  practice_times: 'time',
};

interface OnboardingScreen {
  id: string;
  category: string;
  view_order: number;
  screen_key: string;
  screen_title: string;
  screen_subtitle: string;
  screen_type: 'form' | 'multi' | 'single' | 'consent';
  screen_icon: string;
  templates: TemplateItem[];
  fields?: FieldDefinition[];
  version: number;
}

function Dot({ active, accentColor }: { active: boolean; accentColor: string }) {
  return <View style={[styles.dot, active && { backgroundColor: accentColor }]} />;
}

export default function Personalize() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<ScrollView | null>(null);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [screens, setScreens] = useState<OnboardingScreen[]>([]);
  const [staticOptions, setStaticOptions] = useState<Record<string, Array<{ id: string; label: string }>>>({});
  const { backendToken } = useAuthStore();

  // Fetch templates and static options from API
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        console.log('🌐 Fetching onboarding templates from API...');
        
        // Fetch onboarding templates (includes screen metadata and templates)
        const onboardingTemplates = await apiService.getOnboardingTemplates();
        console.log('✅ Onboarding templates fetched:', onboardingTemplates.length, 'screens');
        
        // Fetch static options (age_ranges, genders, etc.)
        const allTemplates = await apiService.getAllTemplates();
        console.log('✅ Static options fetched');
        
        // Map static options to dropdown format
        const options: Record<string, Array<{ id: string; label: string }>> = {};
        
        if (allTemplates.age_ranges) {
          options.age_ranges = Array.isArray(allTemplates.age_ranges) 
            ? allTemplates.age_ranges.map((item: any) => 
                typeof item === 'string' ? { id: item, label: item } : { id: item.id, label: item.label }
              )
            : [];
        }
        
        if (allTemplates.genders) {
          options.genders = Array.isArray(allTemplates.genders)
            ? allTemplates.genders.map((item: any) =>
                typeof item === 'string' ? { id: item, label: item } : { id: item.id, label: item.label }
              )
            : [];
        }
        
        if (allTemplates.work_hours) {
          options.work_hours = Array.isArray(allTemplates.work_hours)
            ? allTemplates.work_hours.map((item: any) =>
                typeof item === 'string' ? { id: item, label: item } : { id: item.id, label: item.label }
              )
            : [];
        }
        
        if (allTemplates.screen_time) {
          options.screen_time = Array.isArray(allTemplates.screen_time)
            ? allTemplates.screen_time.map((item: any) =>
                typeof item === 'string' ? { id: item, label: item } : { id: item.id, label: item.label }
              )
            : [];
        }
        
        setStaticOptions(options);
        
        // Process onboarding templates - enhance fields with static options
        const processedScreens = onboardingTemplates.map((screen) => {
          // Enhance form fields with static options
          if (screen.fields && screen.fields.length > 0) {
            const enhancedFields = screen.fields.map((field: any) => {
              const fieldKey = (field as any).field_key || field.name;
              const mappedName = FIELD_KEY_MAP[fieldKey] || fieldKey;
              
              // Map field_key to options source
              if (fieldKey === 'age_range' && options.age_ranges) {
                return { 
                  ...field, 
                  field_key: fieldKey,
                  name: mappedName,
                  options: options.age_ranges.map(opt => ({ id: opt.id, label: opt.label }))
                };
              }
              if (fieldKey === 'gender' && options.genders) {
                return { 
                  ...field, 
                  field_key: fieldKey,
                  name: mappedName,
                  options: options.genders.map(opt => ({ id: opt.id, label: opt.label }))
                };
              }
              if (fieldKey === 'work_hours' && options.work_hours) {
                return { 
                  ...field, 
                  field_key: fieldKey,
                  name: mappedName,
                  options: options.work_hours.map(opt => ({ id: opt.id, label: opt.label }))
                };
              }
              if (fieldKey === 'screen_time' && options.screen_time) {
                return { 
                  ...field, 
                  field_key: fieldKey,
                  name: mappedName,
                  options: options.screen_time.map(opt => ({ id: opt.id, label: opt.label }))
                };
              }
              // Map other field keys - ensure name and field_key are set
              return { 
                ...field, 
                field_key: fieldKey,
                name: mappedName
              };
            });
            return { ...screen, fields: enhancedFields };
          }
          return screen;
        });
        
        setScreens(processedScreens);
        console.log('✅ Templates processed and ready');
      } catch (error: any) {
        console.error('❌ Error loading templates:', error);
        Alert.alert(
          'Loading Failed',
          'Failed to load personalization options. Please check your connection and try again.',
          [
            { text: 'Retry', onPress: loadTemplates },
            { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
          ]
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const onToggle = (pageKey: string, choiceCode: string, multi: boolean) => {
    setAnswers((prev) => {
      const current = prev[pageKey] ?? [];
      if (multi) {
        const exists = current.includes(choiceCode);
        const next = exists ? current.filter((c: string) => c !== choiceCode) : [...current, choiceCode];
        return { ...prev, [pageKey]: next };
      }
      return { ...prev, [pageKey]: [choiceCode] };
    });
  };

  const onFieldChange = (fieldName: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldName]: value }));
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
    if (page < screens.length - 1) goTo(page + 1);
  };
  const onBack = () => {
    if (page > 0) goTo(page - 1);
  };

  const isLast = page === screens.length - 1;
  const currentScreen = screens[page];
  const currentAccent = getAccentColor(page);
  const unifiedBg = theme.colors.background;

  // Map answers to backend format for submission
  const mapAnswersToBackendFormat = () => {
    const backendData: Record<string, any> = {};
    
    // Map form fields
    if (answers.name) backendData.name = answers.name;
    if (answers.ageRange) backendData.age_range = answers.ageRange;
    if (answers.gender) backendData.gender = answers.gender;
    if (answers.occupation) backendData.occupation = answers.occupation;
    if (answers.wake) backendData.wake_time = answers.wake;
    if (answers.sleep) backendData.sleep_time = answers.sleep;
    if (answers.workHours) backendData.work_hours = answers.workHours;
    if (answers.screenTime) backendData.screen_time = answers.screenTime;
    
    // Map template selections (use category from screen)
    screens.forEach((screen) => {
      const answerKey = CATEGORY_KEY_MAP[screen.category] || screen.screen_key;
      const selectedValues = answers[answerKey] || [];
      
      if (screen.screen_type === 'multi' || screen.screen_type === 'single') {
        if (screen.category === 'goals') backendData.goals = selectedValues;
        else if (screen.category === 'challenges') backendData.challenges = selectedValues;
        else if (screen.category === 'practices' || screen.category === 'practice_preferences') backendData.practice_preferences = selectedValues;
        else if (screen.category === 'interests') backendData.interests = selectedValues;
        else if (screen.category === 'reminders') backendData.reminder_times = selectedValues;
        else if (screen.category === 'experience_levels') backendData.experience_level = selectedValues[0];
        else if (screen.category === 'mood_tendencies') backendData.mood_tendency = selectedValues[0];
        else if (screen.category === 'practice_times') backendData.preferred_practice_time = selectedValues[0];
      }
    });
    
    // Map consent
    backendData.data_consent = answers.consent || false;
    backendData.marketing_consent = false;
    backendData.onboarding_screen = 'completed';
    
    return backendData;
  };

  // Save profile data to backend when completing setup
  const handleCompleteSetup = async () => {
    if (!backendToken) {
      Alert.alert('Error', 'Please log in to save your profile');
      return;
    }

    setIsSaving(true);
    try {
      const profileData = mapAnswersToBackendFormat();
      console.log('💾 Saving profile data to backend...', profileData);
      
      await apiService.updateUserProfile(backendToken, profileData);
      console.log('✅ Profile saved successfully');

      // Navigate to Main (Dashboard)
      navigation.replace('Main');
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      Alert.alert(
        'Save Failed',
        error.detail || 'Failed to save your profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: unifiedBg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PERSONALIZE_ACCENT_COLOR} />
          <Text style={styles.loadingText}>Loading personalization options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no screens loaded
  if (screens.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: unifiedBg }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No personalization options available</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: PERSONALIZE_ACCENT_COLOR }]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        {screens.map((screen, index) => {
          const answerKey = CATEGORY_KEY_MAP[screen.category] || screen.screen_key;
          const selectedValues = answers[answerKey] || [];
          
          return (
            <View key={screen.id} style={[styles.page, { backgroundColor: unifiedBg, paddingTop: insets.top + 16 }]}>
              <PersonalizeSection
                screenKey={screen.screen_key}
                screenTitle={screen.screen_title}
                screenSubtitle={screen.screen_subtitle}
                screenType={screen.screen_type}
                screenIcon={screen.screen_icon}
                templates={screen.templates}
                fields={screen.fields}
                selectedValues={selectedValues}
                answers={answers}
                onToggle={(value, isMulti) => onToggle(answerKey, value, isMulti)}
                onFieldChange={onFieldChange}
                accentColor={getAccentColor(index)}
                insets={insets}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom controls */}
      <View style={[styles.bottom, { backgroundColor: unifiedBg }]}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {page + 1} of {screens.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((page + 1) / screens.length) * 100}%`, backgroundColor: currentAccent }]} />
          </View>
        </View>

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {screens.map((_, i) => (
            <Dot key={i} active={i === page} accentColor={getAccentColor(i)} />
          ))}
        </View>

        {/* Swipe hint */}
        {page < screens.length - 1 && (
          <Text style={styles.swipeHint}>Swipe or tap to continue →</Text>
        )}

        {/* Single Continue button */}
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: currentAccent }, isLast && styles.continueBtnFinal, isSaving && styles.continueBtnDisabled]}
          onPress={isLast ? handleCompleteSetup : onNext}
          activeOpacity={0.8}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.continueBtnText}>
              {isLast ? 'Complete Setup' : 'Continue'}
            </Text>
          )}
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
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    color: theme.colors.background,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
