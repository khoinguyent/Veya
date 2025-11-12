import React, { useCallback } from 'react';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../core/theme';
import { useSessionsFeed } from '../../hooks/useSessionsFeed';
import { SessionSummary } from '../../services/api';

const palette = {
  peachLight: '#FED3B0',
  peach: '#FDB59D',
  rose: '#EE9398',
  mauve: '#BA7B87',
  cocoa: '#7E5460',
  cream: '#FFF5EE',
  white: '#FFFFFF',
  overlay: 'rgba(126, 84, 96, 0.12)',
  card: '#FFE8D2',
};

export const Sessions: React.FC = () => {
  const { sessions, isLoading, isRefreshing, hasMore, loadMore, refresh } = useSessionsFeed({ pageSize: 6 });

  const renderHeader = useCallback(() => (
    <View style={styles.headerWrapper}>
      <View style={styles.heroCard}>
        <LinearGradient
          colors={[palette.peachLight, palette.peach]}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroContent}>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroLabel}>Daily Calm</Text>
            <Text style={styles.heroTitle}>Find Your Pause</Text>
            <Text style={styles.heroSubtitle}>APR 30 • PAUSE PRACTICE</Text>
          </View>
          <View style={styles.heroPlayButton}>
            <Feather name="play" size={20} color="#1B1B1B" />
          </View>
        </View>
      </View>
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionTitle}>Popular Sessions</Text>
        <Text style={styles.sectionSubtitle}>Handpicked journeys to calm, focus, and restore.</Text>
      </View>
    </View>
  ), []);

  const renderSessionCard = useCallback(({ item }: { item: SessionSummary }) => (
    <TouchableOpacity activeOpacity={0.88} style={styles.sessionCard}>
      <ImageBackground
        source={{ uri: item.artworkUrl }}
        style={styles.sessionImage}
        imageStyle={styles.sessionImageStyle}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.55)']}
          style={styles.sessionOverlay}
        />
        <View style={styles.sessionContent}>
          <Text style={styles.sessionName} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.sessionMetaRow}>
            {item.category ? (
              <View style={styles.sessionPill}>
                <Text style={styles.sessionPillText}>{item.category}</Text>
              </View>
            ) : null}
            {item.durationMinutes ? (
              <View style={styles.sessionMeta}>
                <Feather name="clock" size={12} color="#F5F3F0" />
                <Text style={styles.sessionMetaText}>{`${item.durationMinutes} min`}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[palette.peachLight, palette.cream]}
        style={StyleSheet.absoluteFillObject}
      />
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSessionCard}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading && !isRefreshing ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sessions</Text>
              <Text style={styles.emptySubtitle}>Your meditation sessions will appear here...</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading && hasMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={theme.colors.textPrimary} />
            </View>
          ) : <View style={{ height: 24 }} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasMore && !isLoading) {
            loadMore();
          }
        }}
        refreshing={isRefreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const CARD_BORDER_RADIUS = 22;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  columnWrapper: {
    gap: 18,
    marginBottom: 18,
  },
  headerWrapper: {
    width: '100%',
    marginBottom: 24,
    gap: 24,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    minHeight: 140,
    overflow: 'hidden',
    backgroundColor: palette.peachLight,
    shadowColor: palette.rose,
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextGroup: {
    flex: 1,
    gap: 6,
  },
  heroLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.cocoa,
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.cocoa,
  },
  heroSubtitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    color: 'rgba(126, 84, 96, 0.65)',
    letterSpacing: 1.2,
  },
  heroPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.rose,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionIntro: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.cocoa,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(126, 84, 96, 0.6)',
  },
  sessionCard: {
    flex: 1,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: palette.card,
    shadowColor: palette.mauve,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sessionImage: {
    aspectRatio: 4 / 5,
    justifyContent: 'flex-end',
    width: '100%',
  },
  sessionImageStyle: {
    borderRadius: CARD_BORDER_RADIUS,
  },
  sessionOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_BORDER_RADIUS,
  },
  sessionContent: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 8,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sessionPillText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '600',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'flex-start',
    gap: 4,
    paddingTop: 24,
    paddingBottom: 12,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.cocoa,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(126, 84, 96, 0.75)',
  },
  footerLoader: {
    paddingVertical: 16,
  },
});

