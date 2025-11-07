import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';
import { theme } from '../../../core/theme';

const { width } = Dimensions.get('window');
// Chart container will be: width - 24 (HomeDashboard left) - 20 (HomeDashboard right padding)
// Chart content area (after container's padding on each side): container width - padding
const CONTAINER_WIDTH = width - 24 - 20; // Match DailyFocusCard outer width
const CHART_WIDTH = CONTAINER_WIDTH - 24; // Account for chartContainer padding (12px each side = 24px total)
const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 40, bottom: 50, left: 0, right: 0 }; // No side padding since Y-axis labels are removed
const GRAPH_WIDTH = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
const GRAPH_HEIGHT = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

// Mock data interfaces
interface WeeklyMoodData {
  day: string;
  mood: number; // 1-5 scale
}

interface TodayMoodData {
  hour: number; // 0-23
  mood: number; // 1-5 scale
}

interface MoodTrendsData {
  weekly: WeeklyMoodData[];
  today: TodayMoodData[];
  averageMood: number;
  latestMoodTime: number; // Latest hour with mood entry
}

// Mock API function - Replace with actual API call later
const fetchMoodTrends = async (): Promise<MoodTrendsData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Generate mock weekly data (last 7 days)
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekly: WeeklyMoodData[] = days.map((day, index) => ({
    day,
    mood: 2.5 + Math.random() * 2, // Random mood between 2.5-4.5
  }));

  // Generate mock today's data (by hours)
  const now = new Date();
  const currentHour = now.getHours();
  const today: TodayMoodData[] = [];
  
  // Generate mood entries from 6 AM
  const startHour = 6;
  // Use current hour or 20 (8 PM) as max, but ensure at least until 18 (6 PM)
  const endHour = Math.max(Math.min(currentHour, 20), 18);
  
  // Generate entries at specific hours (6, 9, 12, 15, 18, etc.)
  const hourSteps = [6, 9, 12, 15, 18, 20];
  for (const hour of hourSteps) {
    if (hour <= endHour) {
      today.push({
        hour,
        mood: 3 + Math.random() * 1.5, // Random mood between 3-4.5
      });
    }
  }
  
  // Sort by hour and get the latest entry hour
  today.sort((a, b) => a.hour - b.hour);
  const latestMoodTime = today.length > 0 ? Math.max(...today.map(t => t.hour)) : endHour;

  // Calculate average mood
  const allMoods = [...weekly.map(w => w.mood), ...today.map(t => t.mood)];
  const averageMood = allMoods.reduce((sum, mood) => sum + mood, 0) / allMoods.length;

  return {
    weekly,
    today,
    averageMood: parseFloat(averageMood.toFixed(1)),
    latestMoodTime,
  };
};

// Create smooth bezier curve path using Catmull-Rom spline approximation
const createSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Calculate control points for smooth bezier curve
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
};

export const MoodTrendsChart: React.FC = () => {
  const [data, setData] = useState<MoodTrendsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchMoodTrends();
        setData(response);
      } catch (error) {
        console.error('Failed to load mood trends:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mood Trends & Insights</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Mood scale (1-5)
  const MOOD_MIN = 1;
  const MOOD_MAX = 5;

  // Mood labels for Y-axis
  const MOOD_LABELS = [
    { value: 1, label: 'Sleepy' },
    { value: 2, label: 'Stressed' },
    { value: 3, label: 'Balanced' },
    { value: 4, label: 'Relaxed' },
    { value: 5, label: 'Energetic' },
  ];

  // Dark pastel colors for each mood baseline (more vibrant for visibility)
  const getMoodBaselineColor = (moodValue: number): string => {
    const colorMap: Record<number, string> = {
      1: '#6B8AA0', // Brighter blue-gray for Sleepy
      2: '#B87A6F', // Brighter rose for Stressed
      3: '#9B8A6A', // Brighter beige for Balanced
      4: '#7BA87A', // Brighter sage for Relaxed
      5: '#C4A86A', // Brighter amber for Energetic
    };
    return colorMap[moodValue] || '#E8E8E8'; // Fallback to gray
  };

  // Convert mood values to Y coordinates (inverted: higher mood = lower Y)
  const moodToY = (mood: number): number => {
    const normalized = (mood - MOOD_MIN) / (MOOD_MAX - MOOD_MIN);
    return CHART_PADDING.top + GRAPH_HEIGHT - normalized * GRAPH_HEIGHT;
  };

  // Weekly data points
  const weeklyPoints = data.weekly.map((item, index) => ({
    x: CHART_PADDING.left + (index / (data.weekly.length - 1)) * GRAPH_WIDTH,
    y: moodToY(item.mood),
    mood: item.mood,
    day: item.day,
  }));

  // Today's data points (scaled by hours)
  const todayStartHour = 6;
  const todayEndHour = data.latestMoodTime;
  const todayHoursRange = todayEndHour - todayStartHour;
  const todayPoints = data.today.map((item) => {
    const hourProgress = (item.hour - todayStartHour) / (todayHoursRange || 1);
    return {
      x: CHART_PADDING.left + hourProgress * GRAPH_WIDTH,
      y: moodToY(item.mood),
      mood: item.mood,
      hour: item.hour,
    };
  });

  // Create smooth paths
  const weeklyPath = createSmoothPath(weeklyPoints);
  const todayPath = createSmoothPath(todayPoints);

  // Y-axis labels with mood names
  const yAxisLabels = MOOD_LABELS.map((mood) => ({
    value: mood.value,
    label: mood.label,
    y: moodToY(mood.value),
  }));

  // X-axis labels for days (bottom)
  const dayLabels = data.weekly.map((item, index) => ({
    label: item.day,
    x: CHART_PADDING.left + (index / (data.weekly.length - 1)) * GRAPH_WIDTH,
  }));

  // X-axis labels for hours (top) - only show a few labels
  const hourLabels: { label: string; x: number }[] = [];
  const hourStep = Math.max(2, Math.ceil(todayHoursRange / 4));
  for (let hour = todayStartHour; hour <= todayEndHour; hour += hourStep) {
    const hourProgress = (hour - todayStartHour) / (todayHoursRange || 1);
    hourLabels.push({
      label: `${hour}:00`,
      x: CHART_PADDING.left + hourProgress * GRAPH_WIDTH,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood Trends & Insights</Text>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartWrapper}>
          {/* X-axis labels for hours (top) - only show if there's today's data */}
          {data.today.length > 0 && hourLabels.map(({ label, x }, index) => (
            <Text
              key={`hour-${index}`}
              style={[
                styles.hourLabel,
                {
                  color: '#4A8066', // Green to match today's line
                  top: CHART_PADDING.top - 25,
                  left: x - 20,
                },
              ]}
            >
              {label}
            </Text>
          ))}

          {/* X-axis labels for days (bottom) */}
          {dayLabels.map(({ label, x }, index) => (
            <Text
              key={`day-${index}`}
              style={[
                styles.dayLabel,
                index === 2 && styles.dayLabelBold, // Bold Tuesday
                {
                  color: '#9B7EDE', // Purple to match weekly line
                  bottom: CHART_PADDING.bottom - 30,
                  left: x - 6,
                },
              ]}
            >
              {label}
            </Text>
          ))}

          <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.svg}>
            {/* Grid lines with mood-specific colors */}
            <G>
              {yAxisLabels.map(({ value, y }) => (
                <Line
                  key={value}
                  x1={0}
                  y1={y}
                  x2={GRAPH_WIDTH}
                  y2={y}
                  stroke={getMoodBaselineColor(value)}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  opacity={0.85}
                />
              ))}
            </G>

            {/* Weekly mood line */}
            <Path
              d={weeklyPath}
              fill="none"
              stroke="#9B7EDE" // Purple for weekly
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Today's mood line - only show if there's data */}
            {todayPath && todayPoints.length > 0 && (
              <Path
                d={todayPath}
                fill="none"
                stroke="#4A8066" // Forest green for today
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="8,4"
              />
            )}

            {/* Weekly data points */}
            {weeklyPoints.map((point, index) => (
              <Circle
                key={`weekly-${index}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#9B7EDE"
              />
            ))}

            {/* Today's data points - only show if there's data */}
            {todayPoints.length > 0 && todayPoints.map((point, index) => (
              <Circle
                key={`today-${index}`}
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill="#4A8066"
              />
            ))}
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  chartContainer: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 12, // Reduced padding for narrower margins
    width: '100%', // Full width to match DailyFocusCard
  },
  chartWrapper: {
    position: 'relative',
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  hourLabel: {
    position: 'absolute',
    fontSize: 11,
    width: 40,
    textAlign: 'center',
    fontWeight: '500',
  },
  dayLabel: {
    position: 'absolute',
    fontSize: 12,
    width: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  dayLabelBold: {
    fontWeight: '700',
  },
  loadingContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 24,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

