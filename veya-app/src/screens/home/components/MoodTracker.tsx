import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { theme } from '../../../core/theme';
import { MoodIcon, MoodId } from '../../../components/shared/MoodIcon';
import { MoodEntryModal, MoodEntryData } from './MoodEntryModal';

const { width } = Dimensions.get('window');

// Optional haptics
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {}

// Type definition for mood data from API
export interface Mood {
  id: MoodId; // Use MoodId type to ensure SVG icons are used
  label: string;
  emoji: string;
  icon?: string; // Optional: if API provides icon identifier
  isActive?: boolean; // Optional: if API tracks active status
}

interface MoodsResponse {
  moods: Mood[];
  selectedMoodId?: string | null;
}

// Mock API function - Replace with actual API call later
const fetchMoods = async (): Promise<MoodsResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data representing what the API would return
  return {
    moods: [
      { id: 'sleepy', emoji: '😴', label: 'Sleepy', isActive: true },
      { id: 'balanced', emoji: '😌', label: 'Balanced', isActive: true },
      { id: 'angry', emoji: '😠', label: 'Angry', isActive: true },
      { id: 'energetic', emoji: '⚡', label: 'Energetic', isActive: true },
      { id: 'relaxed', emoji: '🧘', label: 'Relaxed', isActive: true },
    ],
    selectedMoodId: null,
  };
};

export const MoodTracker: React.FC = () => {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [moodEntryData, setMoodEntryData] = useState<MoodEntryData | null>(null);
  
  const feelingCardSvgAsset = require('../../../assets/illustrations/feeling_card.svg');
  const feelingCardSvgUri = Image.resolveAssetSource(feelingCardSvgAsset).uri;

  // Fetch moods on component mount
  useEffect(() => {
    const loadMoods = async () => {
      try {
        setLoading(true);
        const response = await fetchMoods();
        setMoods(response.moods);
        // Set initial selected mood if API provides it
        if (response.selectedMoodId) {
          setSelected(response.selectedMoodId);
        }
      } catch (error) {
        console.error('Failed to load moods:', error);
        // Fallback to empty array or default moods on error
        setMoods([]);
      } finally {
        setLoading(false);
      }
    };

    loadMoods();
  }, []);

  const handleSelect = async (id: MoodId) => {
    if (Haptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    
    // Find the selected mood from the moods array
    const selectedMood = moods.find(mood => mood.id === id);
    if (!selectedMood) return;

    // Prepare mood entry data (can be enhanced with API call to fetch existing notes)
    const entryData: MoodEntryData = {
      moodId: selectedMood.id,
      moodLabel: selectedMood.label,
      moodSvg: selectedMood.icon, // If API provides SVG URI
      // currentNotes: await fetchExistingNotes(id), // Can be fetched from API
    };

    setMoodEntryData(entryData);
    setSelected(id);
    setModalVisible(true);
  };

  const handleSave = async (data: { moodId: MoodId; notes: string }) => {
    try {
      // TODO: Call API to save mood entry
      // Example: await saveMoodEntry({ moodId: data.moodId, notes: data.notes });
      console.log('Saving mood entry:', data);
      
      // For now, just log the data
      // The API call will be implemented later
    } catch (error) {
      console.error('Failed to save mood entry:', error);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    // Optionally reset selected state after closing
    // setSelected(null);
  };

  // Filter active moods only (if API provides isActive flag)
  const activeMoods = moods.filter(mood => mood.isActive !== false);

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.title}>How are you feeling today?</Text>
        <View style={styles.content}>
          <View style={styles.textSection}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : activeMoods.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodsContainer}>
                {activeMoods.map((mood) => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[styles.moodItem, selected === mood.id && styles.moodItemSelected]}
                    onPress={() => handleSelect(mood.id)}
                    activeOpacity={0.7}
                  >
                    <MoodIcon 
                      moodId={mood.id} 
                      size={100}
                      emoji={mood.emoji}
                    />
                    <Text style={[styles.moodLabel, selected === mood.id && styles.moodLabelSelected]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No moods available</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.illustrationContainer}>
        <SvgUri 
          uri={feelingCardSvgUri} 
          width={Math.min(170, width * 0.5)} 
          height={Math.min(170, width * 0.5)}
          style={styles.illustration}
        />
      </View>
      
      {/* Mood Entry Modal */}
      <MoodEntryModal
        visible={modalVisible}
        moodEntryData={moodEntryData}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 24,
    alignSelf: 'flex-end', // Keep card aligned right
    width: '100%',
  },
  card: {
    backgroundColor: '#E8F5E9', // Enhanced pastel green background
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    minHeight: 140, // Match DailyFocusCard height
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    overflow: 'hidden', // Clip card content but allow illustration to extend
    maxWidth: '95%', // Resize card slightly smaller
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  textSection: {
    flex: 1,
    paddingLeft: 100, // Reduced padding to bring moods closer to illustration
    zIndex: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    zIndex: 11, // Higher z-index to appear above illustration
    position: 'relative',
  },
  moodsContainer: {
    gap: 0,
    paddingRight: 4,
  },
  moodItem: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 2,
    borderRadius: 16,
    backgroundColor: 'transparent',
    minWidth: 80,
  },
  moodItemSelected: {
    backgroundColor: 'transparent',
    opacity: 0.7,
  },
  moodLabel: {
    fontSize: 14, // Increased from 12
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  moodLabelSelected: {
    color: '#FFFFFF',
  },
  illustrationContainer: {
    position: 'absolute',
    left: -45, // Moved further left to extend more beyond boundaries
    top: 50, // Increased margin from card header
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    // Illustration extends beyond card boundaries
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});

