import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ImageBackground,
  ViewToken,
  Pressable,
  GestureResponderEvent,
  ColorValue,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography } from '../../components/ui/Typography';
import { LibraryStackParamList } from '../../navigation/LibraryNavigator';
import {
  apiService,
  LibraryArticleBlockApiResponse,
  LibraryArticleDetailApiResponse,
} from '../../services/api';
import { useLibraryStore } from '../../store/useLibraryStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const palette = {
  background: '#FFF7DC',
  primary: '#7796AF',
  secondary: '#94C6C8',
  textPrimary: '#2F3F4A',
  textSecondary: 'rgba(47, 63, 74, 0.72)',
  muted: 'rgba(47, 63, 74, 0.45)',
};

const GRAPHIC_GRADIENT: [ColorValue, ColorValue] = ['#94C6C8', '#B9DDBB'];

export type ArticleBlock = LibraryArticleBlockApiResponse & {
  metadata: Record<string, any>;
};

const emphasizeInline = (text: string, strongColor: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const stripped = part.replace(/\*\*/g, '');
      return (
        <Text key={`${stripped}-${index}`} style={{ fontWeight: '700', color: strongColor }}>
          {stripped}
        </Text>
      );
    }
    return <Text key={`${part}-${index}`}>{part}</Text>;
  });
};

const MarkdownDisplay: React.FC<{
  content: string;
  metadata: Record<string, any>;
}> = ({ content, metadata }) => {
  const strongColor = metadata.strongColor ?? palette.textPrimary;
  const lines = content.split(/\n{2,}/);

  return (
    <View style={{ gap: 12 }}>
      {lines.map((segment, idx) => {
        const trimmed = segment.trim();
        if (!trimmed) return null;

        if (/^#{1,6}\s/.test(trimmed)) {
          const level = trimmed.match(/^#{1,6}/)?.[0]?.length ?? 1;
          const text = trimmed.replace(/^#{1,6}\s*/, '').trim();
          const variant = level <= 2 ? 'h2' : 'h3';
          return (
            <Typography
              key={`md-heading-${idx}`}
              variant={variant}
              color={metadata.headingColor ?? palette.textPrimary}
              style={{ textAlign: metadata.textAlign ?? 'left' }}
            >
              {text}
            </Typography>
          );
        }

        if (/^(\d+\.|-|\*)\s/.test(trimmed)) {
          const items = trimmed.split(/\n/).map((item) => item.replace(/^(\d+\.|-|\*)\s*/, ''));
          return (
            <View key={`md-list-${idx}`} style={styles.listBlock}>
              {items.map((item, itemIdx) => (
                <View key={`md-list-item-${itemIdx}`} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Typography
                    variant="body"
                    color={metadata.textColor ?? palette.textSecondary}
                    style={[styles.listText, { textAlign: metadata.textAlign ?? 'left' }]}
                  >
                    {item}
                  </Typography>
                </View>
              ))}
            </View>
          );
        }

        return (
          <Typography
            key={`md-paragraph-${idx}`}
            variant="body"
            color={metadata.textColor ?? palette.textSecondary}
            style={[styles.paragraph, { textAlign: metadata.textAlign ?? 'left' }]}
          >
            {emphasizeInline(trimmed, strongColor)}
          </Typography>
        );
      })}
    </View>
  );
};

const TipsBlock: React.FC<{
  items: Array<{ title?: string; description?: string }>;
  metadata: Record<string, any>;
}> = ({ items, metadata }) => {
  const accent = metadata.accentColor ?? palette.primary;
  return (
    <View style={{ gap: 16 }}>
      {items.map((item, index) => (
        <View
          key={`tip-${index}`}
          style={[
            styles.tipCard,
            {
              backgroundColor: metadata.cardBackground ?? 'rgba(255,255,255,0.9)',
              borderColor: metadata.borderColor ?? accent,
            },
          ]}
        >
          {item.title ? (
            <Typography variant="h3" color={accent}>
              {item.title}
            </Typography>
          ) : null}
          {item.description ? (
            <Typography variant="body" color={metadata.textColor ?? palette.textSecondary}>
              {item.description}
            </Typography>
          ) : null}
        </View>
      ))}
    </View>
  );
};

interface NormalizedArticle {
  id: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  durationSeconds?: number | null;
  readingTimeMinutes?: number | null;
  tags: string[];
  topicTitle?: string;
  presentationStyle: 'single_page' | 'paged_blocks';
  presentationConfig: Record<string, any>;
  blocks: ArticleBlock[];
}

const normalizeArticleDetail = (detail: LibraryArticleDetailApiResponse): NormalizedArticle => {
  const hasHeroBlock = !!(detail.blocks ?? []).find((block) => block.block_type === 'hero');
  const inferredPaged =
    detail.presentation_style === 'paged_blocks' ||
    (!detail.presentation_style &&
      (detail.layout_variant === 'illustrated' || hasHeroBlock || (detail.blocks?.length ?? 0) > 4));

  const presentationStyle: 'single_page' | 'paged_blocks' = inferredPaged ? 'paged_blocks' : 'single_page';
  const presentationConfig = detail.presentation_config ?? {};

  const sortedBlocks: ArticleBlock[] = [...(detail.blocks ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((block) => ({
      ...block,
      metadata: block.metadata ?? {},
    }));

  // For paged experiences, ensure the hero image appears as a dedicated slide unless explicitly disabled
  const shouldInjectHeroSlide =
    presentationStyle === 'paged_blocks' &&
    detail.hero_image_url &&
    presentationConfig?.heroBehavior !== 'hide' &&
    !hasHeroBlock;

  if (shouldInjectHeroSlide) {
    sortedBlocks.unshift({
      position: Number.MIN_SAFE_INTEGER,
      block_type: 'image',
      payload: { url: detail.hero_image_url },
      metadata: {
        backgroundColor: 'transparent',
        height: presentationConfig?.heroHeight ?? SCREEN_HEIGHT * 0.45,
        borderRadius: presentationConfig?.heroBorderRadius ?? 36,
        overlayColor: presentationConfig?.heroOverlayColor ?? 'rgba(0,0,0,0.18)',
        caption: presentationConfig?.heroCaption ?? undefined,
        align: 'center',
      },
    });
  }

  if (__DEV__ && presentationStyle === 'paged_blocks') {
    console.log(
      '📚 Paged article blocks:',
      sortedBlocks.map((block) => block.block_type)
    );
  }

  return {
    id: detail.id,
    title: detail.title,
    subtitle: detail.subtitle ?? undefined,
    heroImage: detail.hero_image_url ?? undefined,
    durationSeconds: detail.duration_seconds ?? undefined,
    readingTimeMinutes: detail.reading_time_minutes ?? undefined,
    tags: detail.tags ?? [],
    topicTitle: detail.topic?.title ?? undefined,
    presentationStyle,
    presentationConfig,
    blocks: sortedBlocks,
  };
};

const getBlockContainerStyle = (
  block: ArticleBlock,
  config: Record<string, any>,
  options: { isLast: boolean; mode: 'single' | 'paged' }
) => {
  const metadata = block.metadata ?? {};
  const blockSpacing = metadata.spacing ?? config.blockSpacing ?? 18;
  const basePadding = config.defaultPadding ?? 22;
  const paddingVertical =
    metadata.paddingVertical ?? metadata.padding ?? basePadding;
  const paddingHorizontal =
    metadata.paddingHorizontal ?? metadata.padding ?? basePadding;
  const align = metadata.align ?? config.defaultAlign ?? 'flex-start';
  const borderRadius = metadata.borderRadius ?? config.defaultBorderRadius ?? 28;
  const backgroundColor = metadata.backgroundColor ?? config.defaultBlockBackground ?? 'transparent';
  const shadowColor = metadata.shadowColor ?? config.defaultShadowColor;

  const style: any = {
    marginBottom: options.isLast ? 0 : blockSpacing,
    alignSelf: 'stretch',
  };

  // For paged blocks, don't apply backgroundColor here - it's handled by the card background layer
  // For single page, apply backgroundColor to the block wrapper
  if (options.mode === 'single' && backgroundColor && backgroundColor !== 'transparent') {
    style.backgroundColor = backgroundColor;
  }

  if (paddingVertical || paddingHorizontal) {
    style.paddingVertical = paddingVertical;
    style.paddingHorizontal = paddingHorizontal;
  }

  if (borderRadius) {
    style.borderRadius = borderRadius;
  }

  if (align === 'center') {
    style.alignItems = 'center';
  } else if (align === 'right' || align === 'end') {
    style.alignItems = 'flex-end';
  }

  if (shadowColor) {
    style.shadowColor = shadowColor;
    style.shadowOpacity = metadata.shadowOpacity ?? config.defaultShadowOpacity ?? 0.18;
    style.shadowRadius = metadata.shadowRadius ?? config.defaultShadowRadius ?? 18;
    style.shadowOffset = metadata.shadowOffset ?? { width: 0, height: 10 };
    style.elevation = metadata.elevation ?? 6;
  }

  if (options.mode === 'paged') {
    style.flex = 1;
    style.justifyContent = metadata.justify ?? 'center';
  }

  return style;
};

const BlockRenderer: React.FC<{ block: ArticleBlock; article?: NormalizedArticle }> = ({ block, article }) => {
  const metadata = block.metadata ?? {};
  const textAlign = metadata.textAlign ?? metadata.align ?? 'left';
  const bodyColor = metadata.textColor ?? palette.textSecondary;
  const headingColor = metadata.headingColor ?? palette.textPrimary;
  const fontSize = metadata.fontSize;

  switch (block.block_type) {
    case 'heading':
      return (
        <Typography
          variant="h2"
          color={headingColor}
          style={[styles.heading, { textAlign: 'left', alignSelf: 'flex-start' }, fontSize ? { fontSize } : null]}
        >
          {block.payload?.text ?? ''}
        </Typography>
      );
    case 'paragraph':
      return (
        <Typography
          variant="body"
          color={bodyColor}
          style={[styles.paragraph, { textAlign }, fontSize ? { fontSize } : null]}
        >
          {emphasizeInline(block.payload?.text ?? '', metadata.strongColor ?? headingColor)}
        </Typography>
      );
    case 'text':
    case 'rich_text':
      const hasTitle = !!block.payload?.heading;
      return (
        <View style={styles.textBlock}>
          {hasTitle ? (
            <Typography
              variant="h2"
              color={headingColor}
              style={{ textAlign: 'left', marginBottom: 4, alignSelf: 'flex-start' }}
            >
              {block.payload.heading}
            </Typography>
          ) : null}
          <Typography
            variant={metadata.variant ?? 'body'}
            color={bodyColor}
            style={[styles.paragraph, { textAlign }, fontSize ? { fontSize } : null]}
          >
            {emphasizeInline(
              block.payload?.text ?? block.payload?.body ?? block.payload?.content ?? '',
              metadata.strongColor ?? headingColor
            )}
          </Typography>
        </View>
      );
    case 'quote':
      return (
        <Typography
          variant="body"
          color={metadata.textColor ?? headingColor}
          style={[styles.quoteText, { textAlign }]}
        >
          “{block.payload?.text ?? block.payload?.body ?? ''}”
        </Typography>
      );
    case 'list': {
      const items: string[] = block.payload?.items ?? [];
      return (
        <View style={styles.listBlock}>
          {items.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.listItem}>
              <View
                style={[
                  styles.bullet,
                  metadata.bulletColor ? { backgroundColor: metadata.bulletColor } : null,
                ]}
              />
              <Typography
                variant="body"
                color={bodyColor}
                style={[styles.listText, { textAlign }]}
              >
                {item}
              </Typography>
            </View>
          ))}
        </View>
      );
    }
    case 'image': {
      const imageUrl = metadata.url ?? block.payload?.url;
      const height = metadata.height ?? SCREEN_WIDTH * 0.55;
      const borderRadius = metadata.borderRadius ?? 32;
      if (!imageUrl) return null;
      return (
        <View style={styles.imageWrapper}>
          <ImageBackground
            source={{ uri: imageUrl }}
            style={[styles.imageBlock, { height }]}
            imageStyle={{ borderRadius, resizeMode: metadata.resizeMode ?? 'cover' }}
          >
            {metadata.overlayColor ? (
              <View
                style={[styles.imageOverlay, { backgroundColor: metadata.overlayColor }]}
              />
            ) : null}
          </ImageBackground>
          {metadata.caption ? (
            <Typography
              variant="caption"
              color={metadata.captionColor ?? palette.muted}
              style={styles.imageCaption}
            >
              {metadata.caption}
            </Typography>
          ) : null}
        </View>
      );
    }
    case 'illustration': {
      const imageUrl = metadata.imageUrl ?? metadata.url ?? block.payload?.url ?? block.payload?.image_url;
      if (!imageUrl) return null;
      const height = metadata.height ?? SCREEN_WIDTH * 0.55;
      return (
        <View style={styles.imageWrapper}>
          <ImageBackground
            source={{ uri: imageUrl }}
            style={[styles.imageBlock, { height }]}
            imageStyle={{ borderRadius: metadata.borderRadius ?? 24, resizeMode: metadata.resizeMode ?? 'contain' }}
          />
        </View>
      );
    }
    case 'hero': {
      const title = block.payload?.title ?? article?.title;
      const subtitle = block.payload?.subtitle ?? article?.subtitle;
      const imageUrl = block.payload?.imageUrl ?? block.payload?.image_url ?? article?.heroImage;
      const backgroundColor = metadata.backgroundColor ?? 'transparent';
      return (
        <View style={[styles.heroSlide, { backgroundColor }]}
        >
          {title ? (
            <Typography variant="h1" color={metadata.titleColor ?? palette.textPrimary} style={styles.heroSlideTitle}>
              {title}
            </Typography>
          ) : null}
          {subtitle ? (
            <Typography
              variant="body"
              color={metadata.subtitleColor ?? palette.textSecondary}
              style={styles.heroSlideSubtitle}
            >
              {subtitle}
            </Typography>
          ) : null}
          {imageUrl ? (
            <ImageBackground
              source={{ uri: imageUrl }}
              style={styles.heroSlideImage}
              imageStyle={{ borderRadius: metadata.borderRadius ?? 28, resizeMode: 'cover' }}
            />
          ) : null}
        </View>
      );
    }
    case 'markdown': {
      const content = block.payload?.content ?? '';
      return <MarkdownDisplay content={content} metadata={metadata} />;
    }
    case 'tips': {
      const items = block.payload?.items ?? [];
      if (!Array.isArray(items) || !items.length) return null;
      return <TipsBlock items={items} metadata={metadata} />;
    }
    case 'cta':
    case 'button': {
      const label = block.payload?.label ?? block.payload?.text ?? metadata.label ?? 'Continue';
      const description = block.payload?.description ?? metadata.description;
      return (
        <View style={styles.ctaContainer}>
          {description ? (
            <Typography variant="body" color={bodyColor} style={{ textAlign, marginBottom: 12 }}>
              {description}
            </Typography>
          ) : null}
          <TouchableOpacity
            style={[
              styles.ctaButton,
              {
                backgroundColor: metadata.buttonColor ?? article?.presentationConfig?.accentColor ?? palette.primary,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => {
              if (metadata.onPress) {
                metadata.onPress();
              } else {
                console.info('CTA pressed', label);
              }
            }}
          >
            <Text style={styles.ctaButtonText}>{label}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    default:
      console.warn('🟡 Unhandled article block type', block.block_type, block);
      return (
        <View style={styles.fallbackBlock}>
          <Typography variant="body" color={bodyColor} style={{ textAlign }}>
            {block.payload?.text ?? block.payload?.content ?? block.block_type}
          </Typography>
        </View>
      );
  }
};

const ArticleHeader: React.FC<{ article: NormalizedArticle; isPaged?: boolean }> = ({ article, isPaged = false }) => {
  return (
    <View style={[styles.headerContainer, isPaged && styles.headerContainerPaged]}>
      <Typography variant="h1" color={palette.textPrimary} style={styles.title}>
        {article.title}
      </Typography>
      {article.subtitle ? (
        <Typography variant="body" color={palette.textSecondary} style={styles.subtitle}>
          {article.subtitle}
        </Typography>
      ) : null}

      <View style={styles.metaRow}>
        {article.durationSeconds ? (
          <View style={styles.metaChip}>
            <Feather name="clock" size={14} color={palette.textPrimary} />
            <Text style={styles.metaText}>
              {Math.max(1, Math.round(article.durationSeconds / 60))} min
            </Text>
          </View>
        ) : null}
        {article.readingTimeMinutes ? (
          <View style={styles.metaChip}>
            <Feather name="book-open" size={14} color={palette.textPrimary} />
            <Text style={styles.metaText}>{article.readingTimeMinutes} min read</Text>
          </View>
        ) : null}
        {article.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ArticleSinglePageView: React.FC<{ article: NormalizedArticle }> = ({ article }) => {
  const { presentationConfig, blocks, heroImage } = article;

  return (
    <View style={styles.singlePageContent}>
      {heroImage ? (
        <ImageBackground
          source={{ uri: heroImage }}
          style={styles.heroImage}
          imageStyle={styles.heroImageBorder}
        >
          <LinearGradient colors={GRAPHIC_GRADIENT} style={styles.heroOverlay} />
        </ImageBackground>
      ) : null}

      {blocks.map((block, index) => (
        <View
          key={`${block.block_type}-${block.position}-${index}`}
          style={[
            styles.blockWrapper,
            getBlockContainerStyle(block, presentationConfig, {
              isLast: index === blocks.length - 1,
              mode: 'single',
            }),
          ]}
        >
          <BlockRenderer block={block} article={article} />
        </View>
      ))}
    </View>
  );
};

const ArticlePagedBlocks: React.FC<{
  article: NormalizedArticle;
  onBackgroundChange?: (color: string | string[]) => void;
  onIndexChange?: (index: number) => void;
  activeIndex?: number;
}> = ({ article, onBackgroundChange, onIndexChange, activeIndex }) => {
  const { presentationConfig, blocks } = article;
  const [currentIndex, setCurrentIndex] = useState(activeIndex ?? 0);
  const listRef = useRef<FlatList<ArticleBlock>>(null);
  const changeSourceRef = useRef<'prop' | 'user' | null>(null);
  const lastNotifiedIndexRef = useRef<number | null>(null);
  const onBackgroundChangeRef = useRef(onBackgroundChange);
  const onIndexChangeRef = useRef(onIndexChange);

  useEffect(() => {
    onBackgroundChangeRef.current = onBackgroundChange;
    onIndexChangeRef.current = onIndexChange;
  }, [onBackgroundChange, onIndexChange]);

  useEffect(() => {
    if (__DEV__) {
      console.log('[LibraryArticle] paged blocks payload', JSON.stringify(blocks, null, 2));
    }
  }, [blocks]);

  const handleIndexChange = useCallback((index: number, isUserAction: boolean = false) => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex === index) return prevIndex;
      changeSourceRef.current = isUserAction ? 'user' : 'prop';
      return index;
    });
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const firstVisible = viewableItems?.[0];
      if (firstVisible?.index != null && typeof firstVisible.index === 'number') {
        setCurrentIndex((prevIndex) => {
          if (prevIndex === firstVisible.index) return prevIndex;
          changeSourceRef.current = 'user';
          return firstVisible.index as number;
        });
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 55 }).current;

  const pagePadding = presentationConfig.pagePadding ?? 32;
  const pageVerticalPadding = presentationConfig.pageVerticalPadding ?? 36;
  const tapThreshold = presentationConfig.tapThreshold ?? 0.4;

  const scrollToIndex = useCallback(
    (target: number) => {
      if (target < 0 || target >= blocks.length) return;
      listRef.current?.scrollToIndex({ index: target, animated: true });
      handleIndexChange(target, true);
    },
    [blocks.length, handleIndexChange]
  );

  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return hex; // Return original if not a valid hex color
    }
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const renderItem = useCallback(
    ({ item, index }: { item: ArticleBlock; index: number }) => {
      const slideWidth = SCREEN_WIDTH * 0.9;
      const contentWidth = SCREEN_WIDTH * 0.9;
      const hasTitle = !!(
        item.payload?.heading ||
        item.payload?.title ||
        item.block_type === 'heading'
      );
      // Card background: use backgroundColor or backgroundGradient from metadata only
      const cardGradient = item.metadata?.backgroundGradient;
      const cardBg = item.metadata?.backgroundColor;
      const hasCardGradient = Array.isArray(cardGradient) && cardGradient.length >= 2;
      
      // Only apply opacity if backgroundColor is explicitly set (not transparent)
      const bgColorWithOpacity = cardBg !== undefined && cardBg !== 'transparent'
        ? (cardBg.startsWith('#')
            ? hexToRgba(cardBg, 0.4)
            : cardBg.startsWith('rgba')
            ? cardBg.replace(/rgba\(([^)]+)\)/, (_match: string, values: string) => {
                const parts = values.split(',').map((v: string) => v.trim());
                if (parts.length === 4) {
                  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0.4)`;
                }
                return cardBg;
              })
            : cardBg)
        : cardBg;
      
      return (
        <View style={{ width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
          <Pressable
            style={[
              styles.pagedSlide,
              {
                width: slideWidth,
                paddingHorizontal: 0,
                paddingVertical: pageVerticalPadding,
              },
            ]}
            onPress={(event: GestureResponderEvent) => {
              const tapX = event.nativeEvent.locationX;
              const goPrevious = tapX < slideWidth * tapThreshold;
              if (goPrevious) {
                if (index > 0) {
                  scrollToIndex(index - 1);
                }
              } else if (index < blocks.length - 1) {
                scrollToIndex(index + 1);
              }
            }}
          >
            {hasCardGradient && cardGradient && cardGradient.length >= 2 ? (
              <LinearGradient
                colors={cardGradient.slice(0, 2) as [ColorValue, ColorValue]}
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    borderRadius: 0,
                  },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            ) : cardBg !== undefined && cardBg !== null ? (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: bgColorWithOpacity,
                    borderRadius: 0,
                  },
                ]}
              />
            ) : null}
            <View style={[styles.pageInner, { width: contentWidth, paddingHorizontal: 16 }]}>
              <View
                style={[
                  styles.blockWrapper,
                  styles.pagedBlockWrapper,
                  getBlockContainerStyle(item, presentationConfig, {
                    isLast: true,
                    mode: 'paged',
                  }),
                  {
                    width: '100%',
                    paddingHorizontal: 0,
                    justifyContent: hasTitle ? 'flex-start' : 'center',
                    alignItems: hasTitle ? 'flex-start' : 'center',
                  },
                ]}
              >
                <BlockRenderer block={item} article={article} />
              </View>
            </View>
          </Pressable>
        </View>
      );
    },
    [pageVerticalPadding, presentationConfig, blocks.length, tapThreshold, scrollToIndex]
  );

  useEffect(() => {
    if (activeIndex == null) return;
    setCurrentIndex((prevIndex) => {
      if (prevIndex === activeIndex) return prevIndex;
      if (activeIndex < 0 || activeIndex >= blocks.length) return prevIndex;
      changeSourceRef.current = 'prop';
      listRef.current?.scrollToIndex({ index: activeIndex, animated: true });
      return activeIndex;
    });
  }, [activeIndex, blocks.length]);

  useEffect(() => {
    const currentBlock = blocks[currentIndex];
    if (!currentBlock) return;

    // Screen background: use pageBackground or pageBackgroundGradient from metadata only
    const pageGradient = currentBlock.metadata?.pageBackgroundGradient;
    const pageBg = currentBlock.metadata?.pageBackground;
    const hasPageGradient = Array.isArray(pageGradient) && pageGradient.length >= 2;

    if (hasPageGradient) {
      // Pass gradient array to background change callback
      onBackgroundChangeRef.current?.(pageGradient);
    } else if (pageBg !== undefined) {
      // Use pageBackground if explicitly set (even if transparent)
      onBackgroundChangeRef.current?.(pageBg);
    } else {
      // No pageBackground set, don't change background (keep current or default)
      // Don't call onBackgroundChangeRef to preserve existing background
    }

    const source = changeSourceRef.current;
    const shouldNotify = source === 'user' && lastNotifiedIndexRef.current !== currentIndex;

    if (shouldNotify) {
      lastNotifiedIndexRef.current = currentIndex;
      onIndexChangeRef.current?.(currentIndex);
    }

    changeSourceRef.current = null;
  }, [currentIndex, blocks, presentationConfig]);

  return (
    <View style={styles.pagedContainer}>
      <FlatList
        ref={listRef}
        data={blocks}
        keyExtractor={(block, idx) => `${block.block_type}-${block.position}-${idx}`}
        renderItem={renderItem}
        horizontal
        pagingEnabled={false}
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
    </View>
  );
};

export const LibraryArticleScreen: React.FC<NativeStackScreenProps<LibraryStackParamList, 'LibraryArticle'>> = ({ route, navigation }) => {
  const { articleSlug } = route.params;
  const { articles } = useLibraryStore();

  const [articleDetail, setArticleDetail] = useState<LibraryArticleDetailApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageBackground, setPageBackground] = useState<string | string[] | undefined>();
  const [pagedIndex, setPagedIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchArticle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiService.getLibraryArticleDetail(articleSlug);
        if (cancelled) return;
        setArticleDetail(response);
      } catch (err: any) {
        if (cancelled) return;
        const cachedArticle = articles.find((article) => article.slug === articleSlug);
        if (cachedArticle) {
          setArticleDetail({
            id: cachedArticle.id,
            slug: cachedArticle.slug,
            title: cachedArticle.title,
            subtitle: cachedArticle.subtitle,
            hero_image_url: cachedArticle.heroImage,
            hero_video_url: undefined,
            audio_url: cachedArticle.audioPreviewUrl,
            transcript_url: undefined,
            content_locale: 'en',
            content_type: cachedArticle.contentType,
            layout_variant: 'scroll',
            reading_time_minutes: cachedArticle.durationMinutes ?? null,
            duration_seconds: cachedArticle.durationMinutes ? cachedArticle.durationMinutes * 60 : null,
            tags: cachedArticle.tags ?? [],
            is_published: true,
            published_at: null,
            metadata: cachedArticle.metadata ?? {},
            blocks: [
              {
                position: 1,
                block_type: 'paragraph',
                payload: { text: cachedArticle.excerpt ?? 'Detailed content unavailable offline.' },
                metadata: {},
              },
            ],
            topic: undefined,
            presentation_style: cachedArticle.presentationStyle ?? 'single_page',
            presentation_config: cachedArticle.presentationConfig ?? {},
          });
          setError(null);
        } else {
          setError(err?.detail || err?.message || 'Unable to load article');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      cancelled = true;
    };
  }, [articleSlug, articles]);

  const normalizedArticle = useMemo(() => {
    if (!articleDetail) return null;
    return normalizeArticleDetail(articleDetail);
  }, [articleDetail]);

  // Determine background (solid color or gradient)
  // Only use pageBackground if explicitly set, no fallbacks
  const dynamicBackground = pageBackground;
  
  const isGradient = dynamicBackground && Array.isArray(dynamicBackground) && dynamicBackground.length >= 2;
  const solidBackground = isGradient ? undefined : (dynamicBackground as string | undefined);
  const gradientColors = isGradient 
    ? (dynamicBackground.slice(0, 2) as [ColorValue, ColorValue])
    : null;

  useEffect(() => {
    setPagedIndex(0);
  }, [normalizedArticle?.id, normalizedArticle?.presentationStyle]);

  return (
    <View style={styles.safeArea}>
      {isGradient && gradientColors ? (
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      ) : solidBackground !== undefined ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: solidBackground }]} />
      ) : null}
      <SafeAreaView style={styles.safeAreaView} edges={['top']}>
        <View style={[
          styles.container,
          normalizedArticle?.presentationStyle === 'paged_blocks'
            ? styles.containerPaged
            : null,
        ]}>
          {normalizedArticle?.presentationStyle === 'paged_blocks' && !isLoading && !error && (
            <View style={styles.topSlideNavigation}>
              <View style={styles.slideNavigationLines}>
                {normalizedArticle.blocks.map((_, index) => (
                  <TouchableOpacity
                    key={`nav-line-${index}`}
                    onPress={() => {
                      setPagedIndex(index);
                    }}
                    activeOpacity={0.7}
                    style={styles.slideNavLineContainer}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  >
                    <View
                      style={[
                        styles.slideNavLine,
                        index <= pagedIndex ? styles.slideNavLineFilled : styles.slideNavLineUnfilled,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Feather name="chevron-left" size={22} color={palette.textPrimary} />
              <Typography variant="body" color={palette.textPrimary}>
                {normalizedArticle?.topicTitle ?? 'Topics'}
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate('LibraryCategories')}>
              <Feather name="x" size={22} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Feather name="alert-circle" size={24} color={palette.primary} />
            <Typography variant="body" color={palette.textPrimary}>
              {error}
            </Typography>
          </View>
        ) : normalizedArticle ? (
          normalizedArticle.presentationStyle === 'paged_blocks' ? (
            <View style={styles.pagedLayout}>
              <ArticleHeader article={normalizedArticle} isPaged={true} />
              <ArticlePagedBlocks
                article={normalizedArticle}
                onBackgroundChange={(colorOrGradient) => setPageBackground(colorOrGradient)}
                onIndexChange={setPagedIndex}
                activeIndex={pagedIndex}
              />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <ArticleHeader article={normalizedArticle} />
              <ArticleSinglePageView article={normalizedArticle} />
              <View style={{ height: 60 }} />
            </ScrollView>
          )
        ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  safeAreaView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: palette.background,
  },
  containerPaged: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent', // Remove yellow background for paged blocks
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  closeButton: {
    padding: 6,
  },
  loader: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: 'rgba(255, 204, 204, 0.35)',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    marginTop: 12,
  },
  subtitle: {
    marginTop: -4,
    marginBottom: 12,
  },
  headerContainer: {
    marginBottom: 12,
  },
  headerContainerPaged: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(119, 150, 175, 0.12)',
    borderRadius: 999,
  },
  metaText: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(185, 221, 187, 0.32)',
  },
  tagText: {
    color: palette.textPrimary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  singlePageContent: {
    gap: 18,
  },
  blockWrapper: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  fallbackBlock: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  paragraph: {
    lineHeight: 24,
  },
  heading: {
    marginBottom: 4,
  },
  quoteText: {
    fontStyle: 'italic',
    lineHeight: 26,
  },
  listBlock: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  listText: {
    flex: 1,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  heroImage: {
    height: SCREEN_WIDTH * 0.6,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  heroImageBorder: {
    borderRadius: 32,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    opacity: 0.35,
  },
  heroSlide: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    paddingVertical: 32,
    paddingHorizontal: 28,
    gap: 18,
  },
  heroSlideTitle: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  heroSlideSubtitle: {
    fontSize: 18,
    lineHeight: 24,
    maxWidth: '90%',
  },
  heroSlideImage: {
    height: SCREEN_WIDTH * 0.55,
    borderRadius: 28,
    overflow: 'hidden',
  },
  imageWrapper: {
    gap: 10,
  },
  imageBlock: {
    width: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  imageCaption: {
    textAlign: 'center',
  },
  pagedLayout: {
    flex: 1,
  },
  topSlideNavigation: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  slideNavigationLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    height: 12,
    width: '100%',
  },
  slideNavLineContainer: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    minHeight: 12,
    paddingVertical: 4,
  },
  slideNavLine: {
    width: '100%',
    height: 2,
    borderRadius: 1,
  },
  slideNavLineFilled: {
    backgroundColor: '#4B5563',
    height: 2,
  },
  slideNavLineUnfilled: {
    backgroundColor: '#D1D5DB',
    height: 2,
  },
  pagedProgressWrapper: {
    paddingHorizontal: 8,
    marginBottom: 18,
    marginTop: 6,
  },
  pagedContainer: {
    flex: 1,
  },
  pagedSlide: {
    flex: 1,
    justifyContent: 'center',
  },
  pageInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pagedBlockWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  pagedFooter: {
    paddingTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(47, 63, 74, 0.2)',
  },
  progressDotActive: {
    backgroundColor: palette.primary,
    transform: [{ scale: 1.2 }],
  },
  progressDotCompleted: {
    backgroundColor: palette.secondary,
  },
  progressSegmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  segmentTapTarget: {
    flex: 1,
    alignItems: 'center',
    minHeight: 24,
    justifyContent: 'center',
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(92, 139, 112, 0.3)',
    minWidth: 20,
  },
  progressSegmentActive: {
    backgroundColor: '#5C8B70',
    height: 3,
    opacity: 1,
  },
  progressSegmentCompleted: {
    backgroundColor: '#5C8B70',
    opacity: 0.5,
  },
  progressLabel: {
    color: palette.textSecondary,
    fontWeight: '600',
  },
  pageControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 32,
  },
  pageControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(47, 63, 74, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  pageControlDisabled: {
    opacity: 0.35,
  },
  tipCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaContainer: {
    gap: 12,
    alignItems: 'center',
  },
  ctaButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textBlock: {
    gap: 6,
  },
});
