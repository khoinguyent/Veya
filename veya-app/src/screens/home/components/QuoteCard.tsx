import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../core/theme';

const QUOTES = [
  { text: "Breathe. You're doing better than you think.", author: 'Anonymous' },
  { text: 'You are not your thoughts.', author: 'Eckhart Tolle' },
  { text: 'In this moment, there is peace.', author: 'Thich Nhat Hanh' },
  { text: 'Every breath is a fresh start.', author: 'Unknown' },
  { text: 'Be present. Be kind. Be you.', author: 'Mindfulness Wisdom' },
  { text: 'The present moment is the only time over which we have dominion.', author: 'Thich Nhat Hanh' },
  { text: 'Calm mind brings inner strength and self-confidence.', author: 'Dalai Lama' },
];

export const QuoteCard: React.FC = () => {
  const [quote, setQuote] = useState(QUOTES[0]);

  const refreshQuote = () => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);
  };

  useEffect(() => {
    // Set random quote on mount
    refreshQuote();
  }, []);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={refreshQuote}
      activeOpacity={0.9}
    >
      <Text style={styles.quote}>"{quote.text}"</Text>
      {quote.author && <Text style={styles.author}>--{quote.author}--</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 0, // Minimal gap to match tight spacing
    // Height is dynamic - no fixed height, adjusts to content
  },
  quote: {
    fontSize: 20,
    fontStyle: 'italic',
    fontFamily: 'Georgia', // Serif font for elegant quote styling (fallback to system serif)
    color: '#5A6B5D', // Soft muted green-gray for a calm, literary feel
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: 0.3,
    flexShrink: 1, // Allow text to wrap and shrink if needed
  },
  author: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#8A9B8C', // Lighter muted green-gray for author
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

