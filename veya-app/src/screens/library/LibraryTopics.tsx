import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography } from '../../components/ui/Typography';
import { theme } from '../../core/theme';
import {
  useLibraryStore,
  LibraryTopic,
  LibraryArticle,
} from '../../store/useLibraryStore';
import { LibraryStackParamList } from '../../navigation/LibraryNavigator';

const palette = {
  canopy: '#4E7556',
  fern: '#5F8465',
  sage: '#84A77B',
  driftwood: '#D5D0A6',
  mist: '#9FBF8C',
  alabaster: '#F1F3ED',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const withOpacity = (hexColor: string = palette.fern, alpha: number): string => {
  const raw = hexColor.replace('#', '');
  const normalized = raw.length === 3
    ? raw
        .split('')
        .map((char) => char + char)
        .join('')
    : raw;

  const int = parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return `rgba(${r}, ${g}, ${b}, ${Math.min(Math.max(alpha, 0), 1)})`;
};

const TopicCard: React.FC<{
  topic: LibraryTopic;
  accentColor: string;
  isActive: boolean;
  onPress: () => void;
}> = ({ topic, accentColor, isActive, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.topicCard, isActive && styles.topicCardActive]}
      onPress={onPress}
    >
      <ImageBackground
        source={{ uri: topic.coverImage ?? FALLBACK_IMAGE }}
        style={styles.topicImage}
        imageStyle={styles.topicImageBorder}
      >
        <View style={[styles.topicTag, { backgroundColor: accentColor + 'CC' }]}> 
          <Feather name="layers" size={14} color="#FFFFFF" />
          <Typography variant="caption" color="#FFFFFF" style={styles.topicTagText}>
            {topic.articleCount} journeys
          </Typography>
        </View>
      </ImageBackground>
      <View style={styles.topicContent}>
        <Typography variant="h3" style={styles.topicTitle}>
          {topic.title}
        </Typography>
        <Typography variant="body" color={theme.colors.textSecondary} numberOfLines={2}>
          {topic.summary}
        </Typography>
        <View style={styles.topicFooter}>
          <View style={styles.topicChipRow}>
            {topic.tags?.slice(0, 2).map((tag) => (
              <View key={tag} style={[styles.topicChip, { backgroundColor: accentColor + '22' }] }>
                <Typography variant="caption" color={accentColor}>
                  #{tag}
                </Typography>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ArticleCard: React.FC<{ article: LibraryArticle; onPress?: () => void }> = ({ article, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.articleCard} onPress={onPress}>
      <ImageBackground
        source={{ uri: article.heroImage ?? FALLBACK_IMAGE }}
        style={styles.articleImage}
        imageStyle={styles.articleImageBorder}
      >
        <View style={styles.articleBadge}>
          <Feather
            name={article.contentType === 'audio' ? 'headphones' : article.contentType === 'video' ? 'play-circle' : 'book-open'}
            size={14}
            color="#122F0B"
          />
          <Typography variant="caption" style={styles.articleBadgeText}>
            {article.contentType.toUpperCase()}
          </Typography>
        </View>
      </ImageBackground>
      <View style={styles.articleContent}>
        <Typography variant="h3" style={styles.articleTitle} numberOfLines={2}>
          {article.title}
        </Typography>
        {article.subtitle && (
          <Typography variant="body" color={theme.colors.textSecondary} numberOfLines={2}>
            {article.subtitle}
          </Typography>
        )}
        {article.durationMinutes && (
          <Typography variant="caption" color={palette.fern} style={styles.articleDuration}>
            <Feather name="clock" size={12} color={palette.fern} /> {` ${article.durationMinutes} min`}
          </Typography>
        )}
        {article.excerpt && (
          <Typography variant="body" color={theme.colors.textSecondary} numberOfLines={2}>
            {article.excerpt}
          </Typography>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const LibraryTopicsScreen: React.FC<NativeStackScreenProps<LibraryStackParamList, 'LibraryTopics'>> = ({ route, navigation }) => {
  const { categoryId } = route.params;

  const {
    categories,
    topics,
    articles,
    featuredArticles,
    selectedCategoryId,
    selectedTopicId,
    searchQuery,
    isLoading,
    isTopicLoading,
    fetchLibrary,
    selectCategory,
    selectTopic,
    setSearchQuery,
  } = useLibraryStore();

  useEffect(() => {
    let isMounted = true;

    const ensureCategory = async () => {
      if (!categories.length) {
        await fetchLibrary();
      }
      if (!isMounted) return;
      if (selectedCategoryId !== categoryId) {
        selectCategory(categoryId);
      }
    };

    ensureCategory();
    setSearchQuery('');

    return () => {
      isMounted = false;
      setSearchQuery('');
    };
  }, [categories.length, categoryId, fetchLibrary, selectCategory, selectedCategoryId, setSearchQuery]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId]
  );

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId),
    [topics, selectedTopicId]
  );

  const activeParentId = selectedTopic ? selectedTopic.id : null;
  const parentTopic = useMemo(
    () => (selectedTopic ? topics.find((topic) => topic.id === selectedTopic.parentTopicId) : undefined),
    [selectedTopic, topics]
  );

  const accentColor = selectedCategory?.accentColor ?? palette.fern;
  const topicAccentColor = selectedTopic?.accentColor ?? accentColor;

  const filteredTopics = useMemo(() => {
    const lower = searchQuery.trim().toLowerCase();
    return topics
      .filter((topic) => topic.categoryId === categoryId)
      .filter((topic) => {
        const parentId = topic.parentTopicId ?? null;
        return parentId === activeParentId;
      })
      .filter((topic) => {
        if (!lower) return true;
        return (
          topic.title.toLowerCase().includes(lower) ||
          topic.summary.toLowerCase().includes(lower) ||
          topic.tags?.some((tag) => tag.toLowerCase().includes(lower))
        );
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [topics, categoryId, activeParentId, searchQuery]);

  const filteredArticles = useMemo(() => {
    if (!selectedTopicId) return featuredArticles;
    const lower = searchQuery.trim().toLowerCase();
    const topicArticles = articles.filter((article) => article.topicId === selectedTopicId);
    if (!lower) return topicArticles;
    return topicArticles.filter((article) =>
      [article.title, article.subtitle, article.excerpt]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(lower))
    );
  }, [articles, featuredArticles, searchQuery, selectedTopicId]);

  return (
    <SafeAreaView style={styles.safeArea}> 
      <LinearGradient
        colors={[palette.driftwood, palette.sage, palette.fern]}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.45, 1]}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={22} color={palette.alabaster} />
            <Typography variant="body" color={palette.alabaster}>
              Library
            </Typography>
          </TouchableOpacity>
        </View>

        <Typography variant="h1" color={palette.alabaster} style={styles.title}>
          {selectedTopic ? selectedTopic.title : selectedCategory?.title ?? 'Topics'}
        </Typography>
        {(selectedTopic?.summary || selectedCategory?.description) && (
          <Typography variant="body" color={withOpacity(palette.alabaster, 0.8)} style={styles.subtitle}>
            {selectedTopic?.summary ?? selectedCategory?.description}
          </Typography>
        )}

        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={palette.fern} />
          <TextInput
            placeholder="Search topics or articles..."
            placeholderTextColor={withOpacity(palette.fern, 0.55)}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {selectedTopic && (
          <View style={styles.breadcrumbRow}>
            <TouchableOpacity
              style={styles.breadcrumbButton}
              onPress={() => {
                setSearchQuery('');
                selectTopic(parentTopic ?? undefined);
              }}
            >
              <Feather name="chevron-left" size={18} color={palette.alabaster} />
              <Typography variant="body" color={palette.alabaster}>
                {parentTopic ? parentTopic.title : selectedCategory?.title ?? 'All topics'}
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.topicList}>
          {filteredTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              accentColor={topic.accentColor ?? accentColor}
              isActive={topic.id === selectedTopicId}
              onPress={() => {
                setSearchQuery('');
                selectTopic(topic);
              }}
            />
          ))}
          {isLoading && (
            <View style={styles.loader}>
              <ActivityIndicator color={accentColor} />
            </View>
          )}
          {!isLoading && !filteredTopics.length && (
            <View style={styles.emptyState}>
              <Feather name="compass" size={28} color={withOpacity(palette.alabaster, 0.65)} />
              <Typography variant="body" color={withOpacity(palette.alabaster, 0.72)}>
                No topics here yet — new journeys are on the way.
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Typography variant="h3" color={palette.alabaster} style={styles.sectionTitle}>
            {selectedTopic ? selectedTopic.title : 'Featured articles'}
          </Typography>

          {isTopicLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={topicAccentColor} />
            </View>
          ) : (
            <View style={styles.articleGrid}>
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onPress={() => navigation.navigate('LibraryArticle', { articleSlug: article.slug })}
                />
              ))}
              {!filteredArticles.length && !filteredTopics.length && (
                <View style={styles.emptyState}>
                  <Feather name="book-open" size={28} color={withOpacity(palette.alabaster, 0.65)} />
                  <Typography variant="body" color={withOpacity(palette.alabaster, 0.72)}>
                    No featured journeys yet — check back soon.
                  </Typography>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 16,
    gap: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  title: {
    marginTop: 4,
  },
  subtitle: {
    marginTop: -6,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: withOpacity(palette.alabaster, 0.28),
    backgroundColor: withOpacity(palette.alabaster, 0.94),
    shadowColor: '#0F1F14',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  searchInput: {
    flex: 1,
    color: palette.canopy,
    fontSize: 15,
  },
  topicList: {
    gap: 16,
  },
  breadcrumbRow: {
    marginTop: -8,
    marginBottom: -4,
    alignItems: 'flex-start',
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: withOpacity(palette.alabaster, 0.12),
  },
  topicCard: {
    backgroundColor: withOpacity('#FFFFFF', 0.95),
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F1F14',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  topicCardActive: {
    shadowOpacity: 0.18,
    shadowRadius: 18,
    transform: [{ translateY: -2 }],
  },
  topicImage: {
    height: 160,
    justifyContent: 'flex-start',
  },
  topicImageBorder: {
    resizeMode: 'cover',
  },
  topicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomRightRadius: 14,
  },
  topicTagText: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  topicContent: {
    padding: 16,
    gap: 8,
  },
  topicTitle: {
    color: palette.canopy,
    fontSize: 18,
    lineHeight: 24,
  },
  topicFooter: {
    marginTop: 6,
    gap: 10,
  },
  topicChipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F2F6F4',
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  articleGrid: {
    gap: 16,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F1F14',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  articleImage: {
    height: 150,
    justifyContent: 'flex-end',
  },
  articleImageBorder: {
    resizeMode: 'cover',
  },
  articleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(181, 202, 186, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopRightRadius: 12,
  },
  articleBadgeText: {
    fontWeight: '600',
    color: '#122F0B',
  },
  articleContent: {
    padding: 16,
    gap: 6,
  },
  articleTitle: {
    color: palette.canopy,
    fontSize: 18,
    lineHeight: 24,
  },
  articleDuration: {
    marginVertical: 4,
  },
  loader: {
    paddingVertical: 24,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
});
