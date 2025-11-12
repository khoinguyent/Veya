import React from 'react';
import { View, StyleSheet, Text, Switch, ScrollView } from 'react-native';
import { theme } from '../../core/theme';

interface ConsentCardProps {
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  accentColor: string;
  insets: { top: number; bottom: number };
}

export const ConsentCard: React.FC<ConsentCardProps> = ({
  consent,
  onConsentChange,
  accentColor,
  insets,
}) => {
  return (
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
            value={consent}
            onValueChange={onConsentChange}
            trackColor={{ false: theme.colors.accent2, true: accentColor }}
            thumbColor="#FFFFFF"
          />
          <Text style={styles.consentToggleText}>
            I agree to use my wellness data for personalized insights
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  formScroll: {
    flex: 1,
    marginTop: 12,
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

