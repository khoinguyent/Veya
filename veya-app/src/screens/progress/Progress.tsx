import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, Image, Dimensions, ScaledSize } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../core/theme';
import { apiService, JournalEntryResponse } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useSessionStore } from '../../store/useSessionStore';
import { SvgUri } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';

const palette = {
  background: '#FFF7DC',
  card: '#B9DDBB',
  accent: '#7796AF',
  accentSoft: 'rgba(119, 150, 175, 0.16)',
  accentBorder: 'rgba(119, 150, 175, 0.28)',
  textPrimary: '#2F3F4A',
  textSecondary: 'rgba(47, 63, 74, 0.72)',
  timelineDot: '#94C6C8',
  timelineLine: 'rgba(148, 198, 200, 0.35)',
};

type GratitudeEntry = JournalEntryResponse & { relativeDateLabel?: string };

const MOCK_GRATITUDE_ENTRIES: GratitudeEntry[] = [
  {
    id: 'mock-1',
    note: 'Grateful for the warm cup of tea that started my day gently.',
    emoji: '🍵',
    tags: ['morning', 'comfort'],
    local_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'What made you smile today?',
  },
  {
    id: 'mock-2',
    note: 'Thankful for an unexpected message from an old friend.',
    emoji: '💌',
    tags: ['connection'],
    local_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: true,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'A moment of connection',
  },
  {
    id: 'mock-3',
    note: 'Grateful for the quiet walk after dinner.',
    emoji: '🌙',
    tags: ['evening', 'calm'],
    local_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'A calming moment',
  },
  {
    id: 'mock-4',
    note: 'Thankful for learning something new at work today.',
    emoji: '💡',
    tags: ['growth', 'work'],
    local_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'Progress check-in',
  },
  {
    id: 'mock-5',
    note: 'Grateful for the sunset colors over the park.',
    emoji: '🌅',
    tags: ['nature', 'beauty'],
    local_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'Simple joys',
  },
  {
    id: 'mock-6',
    note: 'Thankful for how calm I felt after the breathing exercise.',
    emoji: '🧘‍♀️',
    tags: ['breathing'],
    local_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'Breathing reflection',
  },
  {
    id: 'mock-7',
    note: 'Grateful for the time to cook a wholesome meal.',
    emoji: '🥗',
    tags: ['health', 'food'],
    local_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'Nurture the body',
  },
  {
    id: 'mock-8',
    note: 'Thankful for laughter shared during our team check-in.',
    emoji: '😄',
    tags: ['team', 'joy'],
    local_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'What made you laugh?',
  },
  {
    id: 'mock-9',
    note: 'Grateful for feeling grounded after a quick meditation.',
    emoji: '🪷',
    tags: ['meditation'],
    local_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'Reset and renew',
  },
  {
    id: 'mock-10',
    note: 'Thankful for the supportive message from a mentor.',
    emoji: '🤝',
    tags: ['support'],
    local_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    local_timezone: 'UTC',
    sequence_in_day: 1,
    is_favorite: true,
    created_at: new Date().toISOString(),
    updated_at: null,
    prompt: 'Support system',
  },
];

const formatRelativeDate = (isoString?: string | null): string => {
  if (!isoString) return 'Recently';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.round(diffDays / 7)} weeks ago`;
  if (diffDays < 45) return '1 month ago';
  return `${Math.round(diffDays / 30)} months ago`;
};

const TREE_WIDTH_RATIO = 0.8;
const TREE_HEIGHT_RATIO = 0.72; // relative to width
const LEAF_BASE_SIZE = 44;

const LEAF_SLOTS = [
  { x: 0.50, y: 0.14, baseScale: 0.95, baseRotate: -12 },
  { x: 0.56, y: 0.16, baseScale: 0.92, baseRotate: 3 },
  { x: 0.44, y: 0.17, baseScale: 0.9, baseRotate: -8 },
  { x: 0.63, y: 0.18, baseScale: 0.88, baseRotate: 12 },
  { x: 0.37, y: 0.19, baseScale: 0.86, baseRotate: -16 },
  { x: 0.70, y: 0.2, baseScale: 0.84, baseRotate: 18 },
  { x: 0.31, y: 0.21, baseScale: 0.82, baseRotate: -22 },
  { x: 0.76, y: 0.22, baseScale: 0.8, baseRotate: 24 },
  { x: 0.25, y: 0.23, baseScale: 0.78, baseRotate: -28 },
  { x: 0.82, y: 0.24, baseScale: 0.76, baseRotate: 30 },
  { x: 0.18, y: 0.25, baseScale: 0.74, baseRotate: -30 },
  { x: 0.67, y: 0.26, baseScale: 0.82, baseRotate: 16 },
  { x: 0.42, y: 0.27, baseScale: 0.8, baseRotate: -12 },
  { x: 0.6, y: 0.28, baseScale: 0.78, baseRotate: 8 },
  { x: 0.48, y: 0.29, baseScale: 0.76, baseRotate: -10 },
  { x: 0.53, y: 0.3, baseScale: 0.74, baseRotate: 4 },
  { x: 0.58, y: 0.31, baseScale: 0.72, baseRotate: 14 },
  { x: 0.47, y: 0.32, baseScale: 0.7, baseRotate: -14 },
  { x: 0.66, y: 0.33, baseScale: 0.68, baseRotate: 16 },
  { x: 0.36, y: 0.34, baseScale: 0.66, baseRotate: -18 },
  { x: 0.73, y: 0.35, baseScale: 0.64, baseRotate: 18 },
  { x: 0.29, y: 0.36, baseScale: 0.62, baseRotate: -20 },
  { x: 0.79, y: 0.37, baseScale: 0.6, baseRotate: 20 },
  { x: 0.23, y: 0.38, baseScale: 0.58, baseRotate: -22 },
  { x: 0.85, y: 0.39, baseScale: 0.56, baseRotate: 22 },
  { x: 0.17, y: 0.4, baseScale: 0.54, baseRotate: -24 },
  { x: 0.62, y: 0.41, baseScale: 0.7, baseRotate: 12 },
  { x: 0.44, y: 0.42, baseScale: 0.68, baseRotate: -8 },
  { x: 0.65, y: 0.43, baseScale: 0.66, baseRotate: 10 },
  { x: 0.41, y: 0.44, baseScale: 0.64, baseRotate: -10 },
  { x: 0.69, y: 0.45, baseScale: 0.62, baseRotate: 12 },
  { x: 0.37, y: 0.46, baseScale: 0.6, baseRotate: -12 },
  { x: 0.73, y: 0.47, baseScale: 0.58, baseRotate: 14 },
  { x: 0.33, y: 0.48, baseScale: 0.56, baseRotate: -14 },
  { x: 0.77, y: 0.49, baseScale: 0.54, baseRotate: 16 },
  { x: 0.29, y: 0.5, baseScale: 0.52, baseRotate: -16 },
  { x: 0.54, y: 0.51, baseScale: 0.6, baseRotate: 8 },
  { x: 0.48, y: 0.52, baseScale: 0.58, baseRotate: -8 },
  { x: 0.59, y: 0.53, baseScale: 0.56, baseRotate: 10 },
  { x: 0.43, y: 0.54, baseScale: 0.54, baseRotate: -10 },
  { x: 0.63, y: 0.55, baseScale: 0.52, baseRotate: 12 },
  { x: 0.39, y: 0.56, baseScale: 0.5, baseRotate: -12 },
  { x: 0.67, y: 0.57, baseScale: 0.48, baseRotate: 14 },
  { x: 0.35, y: 0.58, baseScale: 0.46, baseRotate: -14 },
  { x: 0.71, y: 0.59, baseScale: 0.44, baseRotate: 16 },
  { x: 0.31, y: 0.6, baseScale: 0.42, baseRotate: -16 },
  { x: 0.75, y: 0.61, baseScale: 0.4, baseRotate: 18 },
  { x: 0.27, y: 0.62, baseScale: 0.38, baseRotate: -18 },
  { x: 0.79, y: 0.63, baseScale: 0.36, baseRotate: 20 },
  { x: 0.23, y: 0.64, baseScale: 0.34, baseRotate: -20 },
  { x: 0.6, y: 0.65, baseScale: 0.46, baseRotate: 10 },
  { x: 0.46, y: 0.66, baseScale: 0.44, baseRotate: -8 },
  { x: 0.64, y: 0.67, baseScale: 0.42, baseRotate: 12 },
  { x: 0.42, y: 0.68, baseScale: 0.4, baseRotate: -10 },
  { x: 0.68, y: 0.69, baseScale: 0.38, baseRotate: 14 },
  { x: 0.38, y: 0.7, baseScale: 0.36, baseRotate: -12 },
  { x: 0.72, y: 0.71, baseScale: 0.34, baseRotate: 16 },
  { x: 0.34, y: 0.72, baseScale: 0.32, baseRotate: -14 },
  { x: 0.53, y: 0.73, baseScale: 0.38, baseRotate: 4 },
  { x: 0.57, y: 0.74, baseScale: 0.36, baseRotate: 8 },
  { x: 0.49, y: 0.75, baseScale: 0.34, baseRotate: -6 },
  { x: 0.61, y: 0.76, baseScale: 0.32, baseRotate: 12 },
  { x: 0.45, y: 0.77, baseScale: 0.3, baseRotate: -8 },
  { x: 0.65, y: 0.78, baseScale: 0.28, baseRotate: 14 },
  { x: 0.41, y: 0.79, baseScale: 0.26, baseRotate: -10 },
  { x: 0.69, y: 0.8, baseScale: 0.24, baseRotate: 16 },
  { x: 0.37, y: 0.81, baseScale: 0.22, baseRotate: -12 },
  { x: 0.58, y: 0.82, baseScale: 0.3, baseRotate: 10 },
  { x: 0.44, y: 0.83, baseScale: 0.28, baseRotate: -8 },
  { x: 0.62, y: 0.84, baseScale: 0.26, baseRotate: 12 },
  { x: 0.4, y: 0.85, baseScale: 0.24, baseRotate: -10 },
  { x: 0.66, y: 0.86, baseScale: 0.22, baseRotate: 14 },
  { x: 0.36, y: 0.87, baseScale: 0.2, baseRotate: -12 },
];

const MOCK_SESSION_PATH = [
  {
    id: 'mock-session-1',
    label: 'Daily Calm • Meditation',
    duration: 12,
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'mock-session-2',
    label: 'Evening Unwind • Breathing',
    duration: 8,
    completedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
  },
  {
    id: 'mock-session-3',
    label: 'Sunrise Breathing • Breathing',
    duration: 10,
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'mock-session-4',
    label: 'Forest Focus • Meditation',
    duration: 16,
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'mock-session-5',
    label: 'Gratitude Notes • Reflection',
    duration: 5,
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

export const Progress: React.FC = () => {
  const backendToken = useAuthStore((state) => state.backendToken);
  const sessions = useSessionStore((state) => state.sessions);

  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeEntry = entries[activeIndex];

  const gratitudeCount = entries.length || MOCK_GRATITUDE_ENTRIES.length;
  const leafCount = Math.min(Math.max(gratitudeCount || MOCK_GRATITUDE_ENTRIES.length, 100), 100);

  const treeUri = useMemo(
    () => Image.resolveAssetSource(require('../../assets/illustrations/tree.svg')).uri,
    []
  );

  const [treeDimensions, setTreeDimensions] = useState(() => {
    const screenWidth = Dimensions.get('window').width;
    const width = screenWidth * TREE_WIDTH_RATIO;
    return {
      width,
      height: width * TREE_HEIGHT_RATIO,
    };
  });
  const [treeReady, setTreeReady] = useState(false);

  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      const width = window.width * TREE_WIDTH_RATIO;
      setTreeDimensions({ width, height: width * TREE_HEIGHT_RATIO });
      setTreeReady(false);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  const leafUri = useMemo(
    () => Image.resolveAssetSource(require('../../assets/illustrations/leaf.svg')).uri,
    []
  );
  const leafUri2 = useMemo(
    () => Image.resolveAssetSource(require('../../assets/illustrations/leaf2.svg')).uri,
    []
  );
  const leafUri3 = useMemo(
     () => Image.resolveAssetSource(require('../../assets/illustrations/leaf3.svg')).uri,
     []
   );
   const leafSet = useMemo(() => [leafUri, leafUri2, leafUri3], [leafUri, leafUri2, leafUri3]);

  const leaves = useMemo(() => {
    const leavesArray = [] as Array<{
      x: number;
      y: number;
      scale: number;
      opacity: number;
      rotate: number;
      uri: string;
    }>;

    const randomAt = (seedIndex: number) => {
      let seed = (leafCount + 37) * 9301 + seedIndex * 83457;
      return () => {
        seed = (seed * 49297 + 2333) % 233280;
        return seed / 233280;
      };
    };

    for (let index = 0; index < leafCount; index += 1) {
      const anchor = LEAF_SLOTS[index % LEAF_SLOTS.length];
      const slotIteration = Math.floor(index / LEAF_SLOTS.length);
      const rand = randomAt(index + slotIteration * 13);
      const intensity = (index + 1) / Math.max(leafCount, 1);
      const jitterScale = 0.06 + slotIteration * 0.025;
      const jitterX = (rand() - 0.5) * jitterScale;
      const jitterY = (rand() - 0.5) * (jitterScale * 1.3);
      const rotationVariance = (rand() - 0.5) * (18 + slotIteration * 4);
      const depthScale = anchor.baseScale - slotIteration * 0.05;
      const chosenUri = leafSet[Math.floor(rand() * leafSet.length) % leafSet.length];

      const leaf = {
        x: anchor.x + jitterX,
        y: anchor.y + jitterY,
        scale: Math.max(depthScale, 0.22),
        opacity: 0.6 + intensity * 0.3,
        rotate: anchor.baseRotate + rotationVariance,
        uri: chosenUri,
      };

      // enforce minimal separation to avoid overlap
      const minDistance = 0.05;
      let adjustedLeaf = leaf;
      let attempts = 0;
      while (attempts < 6) {
        const tooClose = leavesArray.some((existing) => {
          const dx = existing.x - adjustedLeaf.x;
          const dy = existing.y - adjustedLeaf.y;
          return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });

        if (!tooClose) break;

        const retryRand = randomAt(index + attempts * 97);
        adjustedLeaf = {
          ...adjustedLeaf,
          x: anchor.x + (retryRand() - 0.5) * (jitterScale * 1.4),
          y: anchor.y + (retryRand() - 0.5) * (jitterScale * 1.4),
          rotate: anchor.baseRotate + (retryRand() - 0.5) * (22 + slotIteration * 5),
        };
        attempts += 1;
      }

      leavesArray.push(adjustedLeaf);
    }

    return leavesArray;
  }, [leafCount, leafSet]);

  useEffect(() => {
    let cancelled = false;

    const fetchNotes = async () => {
      const mockWithDates = MOCK_GRATITUDE_ENTRIES.map((entry) => ({
        ...entry,
        relativeDateLabel: formatRelativeDate(entry.local_date ?? entry.created_at),
      }));
      if (cancelled) return;
      setEntries(mockWithDates);
      setActiveIndex(Math.floor(Math.random() * mockWithDates.length));
      setNotesError(null);
      setIsLoadingNotes(false);
    };

    fetchNotes();

    return () => {
      cancelled = true;
    };
  }, [backendToken]);

  useEffect(() => {
    if (entries.length <= 1) return;

    const intervalId = setInterval(() => {
      setActiveIndex((current) => {
        if (entries.length <= 1) return current;
        let next = current;
        while (next === current) {
          next = Math.floor(Math.random() * entries.length);
        }
        return next;
      });
    }, 15000);

    return () => clearInterval(intervalId);
  }, [entries]);

  const sessionTimeline = useMemo(() => {
    if (sessions.length) {
      return [...sessions]
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
        .map((session, index, array) => ({
          ...session,
          isLast: index === array.length - 1,
          label:
            session.type === 'meditation'
              ? 'Meditation'
              : session.type === 'sleep'
              ? 'Sleep'
              : 'Breathing',
        }));
    }

    return MOCK_SESSION_PATH.map((session, index, array) => ({
      id: session.id,
      label: session.label,
      duration: session.duration,
      completedAt: session.completedAt,
      isLast: index === array.length - 1,
    }));
  }, [sessions]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Typography variant="h1" style={styles.title} color={palette.textPrimary}>
          Progress
        </Typography>
        <Typography variant="body" style={styles.introText} color={palette.textSecondary}>
          Your progress and statistics will appear here...
        </Typography>

        <View style={[styles.treeCard, { marginHorizontal: '10%' }]}>
          <View
            style={[styles.treeCanvas, treeDimensions]}
            onLayout={() => setTreeReady(true)}
          >
            <SvgUri uri={treeUri} width={treeDimensions.width} height={treeDimensions.height} />
            {treeReady && (
              <View style={styles.leafLayer}>
                {leaves.map((leaf, index) => {
                  const size = LEAF_BASE_SIZE * leaf.scale;
                  const left = treeDimensions.width * leaf.x - size / 2;
                  const top = treeDimensions.height * leaf.y - size / 2;
                  return (
                    <View
                      key={`leaf-${index}`}
                      style={[
                        styles.leafWrapper,
                        {
                          left,
                          top,
                          width: size,
                          height: size,
                          opacity: leaf.opacity,
                          transform: [{ rotate: `${leaf.rotate}deg` }],
                        },
                      ]}
                    >
                      <SvgUri uri={leaf.uri} width="100%" height="100%" />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.gratitudeCard}>
          <View style={styles.gratitudeHeader}>
            <View style={styles.gratitudeBadge}>
              <Text style={styles.gratitudeBadgeText}>Gratitude spotlight</Text>
            </View>
            <Typography variant="body" color={palette.textSecondary} style={styles.gratitudeSubtitle}>
              Rotating every few moments
            </Typography>
          </View>

          {isLoadingNotes && !entries.length ? (
            <View style={styles.cardLoader}>
              <ActivityIndicator color={palette.accent} />
            </View>
          ) : notesError && !entries.length ? (
            <View style={styles.cardEmpty}>
              <Typography variant="body" color={palette.textSecondary}>
                {notesError}
              </Typography>
            </View>
          ) : activeEntry ? (
            <View style={styles.noteContent}>
              <View style={styles.noteRow}>
                <View style={styles.noteEmoji}>
                  <Text style={styles.noteEmojiText}>{activeEntry.emoji || '🌿'}</Text>
                </View>
                <Text style={styles.noteText}>{activeEntry.note}</Text>
              </View>
              <View style={styles.noteMetaRow}>
                <Text style={styles.noteMetaText}>{activeEntry.relativeDateLabel ?? 'Recently'}</Text>
                <Text style={styles.noteMetaText}>
                  {activeEntry.source ? activeEntry.source.replace(/_/g, ' ') : 'Mindfulness journal'}
                </Text>
              </View>
              {!!activeEntry.tags?.length && (
                <View style={styles.noteTags}>
                  {activeEntry.tags.slice(0, 4).map((tag) => (
                    <View key={tag} style={styles.noteTagPill}>
                      <Text style={styles.noteTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : backendToken ? (
            <View style={styles.cardEmpty}>
              <Typography variant="body" color={palette.textSecondary}>
                Start capturing a quick thank-you — your reflections will rotate here.
              </Typography>
            </View>
          ) : (
            <View style={styles.cardEmpty}>
              <Typography variant="body" color={palette.textSecondary}>
                Sign in to see your gratitude notes highlighted here.
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <Typography variant="h2" color={palette.textPrimary} style={styles.timelineTitle}>
              Session path
            </Typography>
            <Typography variant="body" color={palette.textSecondary}>
              A quick glance at the practices you’ve completed.
            </Typography>
          </View>

          <View style={styles.timelineList}>
            {sessionTimeline.slice(0, 12).map((session) => (
              <View key={session.id} style={styles.timelineRow}>
                <View style={styles.timelineIndicator}>
                  <View style={styles.timelineDot} />
                  {!session.isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>
                    {session.label} • {session.duration} min
                  </Text>
                  <Text style={styles.timelineDate}>
                    {session.completedAt.toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 24,
    gap: 24,
  },
  treeCard: {
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  treeCanvas: {
    alignSelf: 'center',
    position: 'relative',
  },
  leafLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  leafWrapper: {
    position: 'absolute',
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  introText: {
    marginBottom: theme.spacing.xl,
  },
  gratitudeCard: {
    marginTop: 12,
    backgroundColor: palette.card,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
    shadowColor: palette.accent,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  gratitudeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  gratitudeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
  },
  gratitudeBadgeText: {
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
    color: palette.accent,
    fontSize: 13,
  },
  gratitudeSubtitle: {
    flexShrink: 1,
  },
  cardLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  cardEmpty: {
    paddingVertical: 12,
  },
  noteContent: {
    gap: 12,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noteEmoji: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteEmojiText: {
    fontSize: 28,
  },
  noteText: {
    fontSize: 17,
    lineHeight: 24,
    color: palette.textPrimary,
    flex: 1,
    flexWrap: 'wrap',
  },
  noteMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  noteMetaText: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  noteTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteTagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  noteTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.accent,
    textTransform: 'capitalize',
  },
  timelineCard: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: palette.timelineDot,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    marginBottom: theme.spacing.xxl,
  },
  timelineHeader: {
    gap: 8,
    marginBottom: 20,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  timelineList: {
    gap: 18,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  timelineIndicator: {
    width: 18,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.timelineDot,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: palette.timelineLine,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    gap: 4,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  timelineDate: {
    fontSize: 13,
    color: palette.textSecondary,
  },
});

