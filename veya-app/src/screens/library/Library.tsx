import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  ColorValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LibraryStackParamList } from '../../navigation/LibraryNavigator';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography } from '../../components/ui/Typography';
import { theme } from '../../core/theme';
import {
  useLibraryStore,
  LibraryCategory,
} from '../../store/useLibraryStore';

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
  const normalized =
    raw.length === 3
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

const CategoryCard: React.FC<{
  category: LibraryCategory;
  isActive: boolean;
  onPress: () => void;
}> = ({ category, isActive, onPress }) => {
  const accentColor = category.accentColor ?? palette.fern;
  const overlayColors = useMemo<[ColorValue, ColorValue]>(
    () => [withOpacity(accentColor, 0.18), withOpacity(accentColor, 0.75)],
    [accentColor]
  );
  const iconBadgeStyle = useMemo(
    () => ({ backgroundColor: withOpacity(accentColor, 0.28) }),
    [accentColor]
  );
  const tagChipBackground = useMemo(
    () => ({
      backgroundColor: withOpacity(accentColor, 0.12),
      borderColor: withOpacity(accentColor, 0.45),
    }),
    [accentColor]
  );

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.categoryCardContainer, isActive && styles.categoryCardActive]}
      onPress={onPress}
    >
      <View style={styles.categoryCardInner}>
        <ImageBackground
          source={{ uri: category.coverImage ?? FALLBACK_IMAGE }}
          style={styles.categoryImage}
          imageStyle={styles.categoryImageBorder}
        >
          <LinearGradient colors={overlayColors} style={styles.categoryImageOverlay} />
        </ImageBackground>
        <View style={styles.categoryContent}>
          <View style={styles.categoryHeaderRow}>
            <View style={[styles.categoryIconBadge, iconBadgeStyle]}>
              <Feather name={(category.icon as any) ?? 'feather'} size={18} color={accentColor} />
            </View>
            <Typography variant="h3" color={palette.canopy} style={styles.categoryCardTitle}>
              {category.title}
            </Typography>
          </View>
          {!!category.description && (
            <Typography variant="body" color={palette.fern} numberOfLines={2} style={styles.categoryDescription}>
              {category.description}
            </Typography>
          )}
          {!!category.tags?.length && (
            <View style={styles.categoryTagRow}>
              {category.tags.slice(0, 2).map((tag) => (
                <View key={tag} style={[styles.categoryTagChip, tagChipBackground]}>
                  <Typography variant="caption" color={accentColor} style={styles.categoryTagText}>
                    {tag}
                  </Typography>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

type LibraryScreenProps = NativeStackScreenProps<LibraryStackParamList, 'LibraryCategories'>;

export const Library: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const {
    categories,
    searchQuery,
    isLoading,
    fetchLibrary,
    setSearchQuery,
  } = useLibraryStore();

  useFocusEffect(
    useCallback(() => {
      fetchLibrary();
    }, [fetchLibrary])
  );

  const filteredCategories = useMemo(() => {
    const lower = searchQuery.trim().toLowerCase();
    return categories
      .filter((category) => category.isActive)
      .filter((category) => {
        if (!lower) return true;
        return (
          category.title.toLowerCase().includes(lower) ||
          category.tags?.some((tag) => tag.toLowerCase().includes(lower))
        );
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [categories, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}> 
      <LinearGradient
        colors={[palette.driftwood, palette.sage, palette.fern]}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.45, 1]}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Typography variant="h1" color={palette.canopy}>
            Library
          </Typography>
          <Typography variant="body" color={withOpacity(palette.alabaster, 0.7)} style={styles.headerSubtitle}>
            Explore, read, learn, and save your favorite mindfulness resources 🍃
          </Typography>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={palette.fern} />
          <TextInput
            placeholder="Search mindfulness topics..."
            placeholderTextColor={withOpacity(palette.fern, 0.55)}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Typography variant="h3" color={palette.alabaster}>
            Categories
          </Typography>
          <Typography variant="body" color={withOpacity(palette.alabaster, 0.68)}>
            Choose a mood to explore.
          </Typography>
        </View>
        <View style={styles.categoryList}>
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isActive={false}
              onPress={() => navigation.navigate('LibraryTopics', { categoryId: category.id })}
            />
          ))}
        </View>

        {isLoading && (
          <View style={styles.loader}>
            <ActivityIndicator color={palette.fern} />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.driftwood,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 8,
  },
  headerSubtitle: {
    marginTop: 4,
    lineHeight: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    marginTop: 20,
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
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 6,
  },
  categoryList: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 16,
  },
  categoryCardContainer: {
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  categoryCardInner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: withOpacity(palette.alabaster, 0.87),
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F1F14',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    minHeight: 128,
  },
  categoryCardActive: {
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  categoryImage: {
    width: 118,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  categoryImageBorder: {
    resizeMode: 'cover',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  categoryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 8,
  },
  categoryIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  categoryDescription: {
    fontSize: 13,
    lineHeight: 17,
  },
  categoryTagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#0F1F14',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  categoryTagText: {
    fontWeight: '600',
    textTransform: 'capitalize',
    fontSize: 11,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  loader: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
});

