import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle as SvgCircle } from 'react-native-svg';
import { theme } from '../../../core/theme';

const { width } = Dimensions.get('window');
const CARD_PADDING = 24 * 2; // Left and right padding from HomeDashboard
const CARD_INTERNAL_PADDING = 20 * 2; // Left and right padding of card
// Timeline width should fit within card boundaries
const TIMELINE_WIDTH = width - CARD_PADDING - CARD_INTERNAL_PADDING;

// Activity data interface (matches API response structure)
export interface ActivityData {
  id: string;
  name: string;
  type: string; // e.g., "meditation", "breathing", "journaling"
  currentStreak: number; // Days in current streak
  totalSessions: number;
  totalMinutes: number;
  startDate: string; // ISO date string
  targetDays?: number; // Optional: target days for the activity (e.g., 7 for "7 days meditation")
}

interface ProgressCardProps {
  activity?: ActivityData | null;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  activity,
}) => {
  // If no activity, don't render
  if (!activity) {
    return null;
  }

  const { name, currentStreak, targetDays } = activity;

  // Calculate which days to show: 3 days before today, today, and 3 days after today
  // Today is currentStreak (the current day number in the streak)
  const today = currentStreak;
  const maxTotalDays = targetDays || Math.max(currentStreak + 3, 7);
  
  // Calculate visible day range
  let startDay: number;
  let endDay: number;
  let visibleDays: number[];
  
  if (today <= 4) {
    // If less than 5 days streak, show all days from 1 to today + 3 (or maxTotalDays)
    startDay = 1;
    endDay = Math.min(today + 3, maxTotalDays);
    visibleDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i);
  } else {
    // Show 3 days before today, today, and 3 days after today
    startDay = Math.max(1, today - 3);
    endDay = Math.min(today + 3, maxTotalDays);
    visibleDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i);
  }
  
  const visibleDaysCount = visibleDays.length;
  
  // Add padding to prevent edge dots from being cut off
  const TIMELINE_PADDING = 20; // Padding on each side
  const ACTUAL_TIMELINE_WIDTH = TIMELINE_WIDTH - (TIMELINE_PADDING * 2);
  
  // Calculate spacing for timeline dots based on visible days
  const dotSpacing = visibleDaysCount > 1 ? ACTUAL_TIMELINE_WIDTH / (visibleDaysCount - 1) : 0;
  const dotRadius = 6;
  const circleRadius = 14; // Pastel circle radius
  const timelineY = 20; // Y position for timeline

  return (
    <View style={styles.card}>
      {/* Title */}
      <Text style={styles.title}>Your Progress</Text>
      
      {/* Activity name and days count on same line */}
      <View style={styles.activityRow}>
        <Text style={styles.activityName}>{name} streak</Text>
        <Text style={styles.daysText}>{currentStreak} days</Text>
      </View>
      
      {/* Timeline */}
      <View style={styles.timelineContainer}>
        <Svg width={TIMELINE_WIDTH} height={40}>
          {/* Pastel circle backgrounds for completed days - drawn first */}
          {visibleDays.map((dayNumber, index) => {
            const x = TIMELINE_PADDING + (index * dotSpacing);
            const hasStreak = dayNumber <= currentStreak;
            
            if (!hasStreak) return null;
            
            return (
              <SvgCircle
                key={`circle-${dayNumber}`}
                cx={x}
                cy={timelineY}
                r={circleRadius}
                fill="#C7EBD0" // Vibrant soft green for better highlight
                opacity={0.75}
              />
            );
          })}
          
          {/* Horizontal line - drawn over circles */}
          <Line
            x1={TIMELINE_PADDING}
            y1={timelineY}
            x2={TIMELINE_WIDTH - TIMELINE_PADDING}
            y2={timelineY}
            stroke={theme.colors.accent2}
            strokeWidth="2"
          />
          
          {/* Day dots - drawn over line and circles */}
          {visibleDays.map((dayNumber, index) => {
            const x = TIMELINE_PADDING + (index * dotSpacing);
            const hasStreak = dayNumber <= currentStreak;
            
            return (
              <SvgCircle
                key={`dot-${dayNumber}`}
                cx={x}
                cy={timelineY}
                r={dotRadius}
                fill={hasStreak ? theme.colors.primary : theme.colors.card} // Forest green for completed, card color for incomplete
              />
            );
          })}
        </Svg>
        
        {/* Day labels positioned absolutely */}
        {visibleDays.map((dayNumber, index) => {
          const x = TIMELINE_PADDING + (index * dotSpacing);
          return (
            <Text
              key={`label-${dayNumber}`}
              style={[
                styles.dayLabel,
                { left: x - 8 },
              ]}
            >
              {dayNumber}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 20,
    marginBottom: 8, // Reduced gap to next component
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  daysText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  timelineContainer: {
    position: 'relative',
    width: TIMELINE_WIDTH,
    height: 50,
    marginBottom: 20,
  },
  dayLabel: {
    position: 'absolute',
    top: 28,
    fontSize: 11,
    color: theme.colors.textSecondary,
    width: 16,
    textAlign: 'center',
  },
});

