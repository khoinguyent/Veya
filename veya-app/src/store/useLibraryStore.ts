import { create } from 'zustand';

import apiService, {
  ApiError,
  LibraryArticleSummaryApiResponse,
  LibraryCategoryTreeApiResponse,
  LibraryTopicDetailApiResponse,
  LibraryTopicSummaryApiResponse,
} from '../services/api';

export type LibraryContentType = 'article' | 'audio' | 'video' | 'story' | 'course' | 'practice' | 'collection';

export interface LibraryCategory {
  id: string;
  slug: string;
  title: string;
  description?: string;
  parentId?: string | null;
  accentColor: string;
  icon?: string;
  coverImage?: string;
  orderIndex: number;
  isActive: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface LibraryTopic {
  id: string;
  slug: string;
  categoryId: string;
  title: string;
  summary: string;
  coverImage?: string;
  articleCount: number;
  tags?: string[];
  orderIndex: number;
  isActive: boolean;
  accentColor?: string;
  metadata?: Record<string, unknown>;
  parentTopicId?: string | null;
}

export interface LibraryArticle {
  id: string;
  topicId: string;
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  contentType: LibraryContentType;
  durationMinutes?: number;
  mood?: string;
  excerpt?: string;
  audioPreviewUrl?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  presentationStyle: 'single_page' | 'paged_blocks';
  presentationConfig: Record<string, any>;
  blocks: Array<{
    position: number;
    blockType: string;
    payload: Record<string, any>;
    metadata: Record<string, any>;
  }>;
}

interface LibraryState {
  categories: LibraryCategory[];
  topics: LibraryTopic[];
  articles: LibraryArticle[];
  featuredArticles: LibraryArticle[];
  selectedCategoryId?: string;
  selectedTopicId?: string;
  selectedTopicSlug?: string;
  searchQuery: string;
  isLoading: boolean;
  isTopicLoading: boolean;
  error?: string;
  fetchLibrary: () => Promise<void>;
  loadCategoryContent: (categoryId: string) => Promise<void>;
  loadTopicContent: (topic: LibraryTopic) => Promise<void>;
  selectCategory: (categoryId?: string) => void;
  selectTopic: (topic?: LibraryTopic) => void;
  setSearchQuery: (query: string) => void;
  loadedTopicChildren: Record<string, boolean>;
}

const DEFAULT_ACCENT_COLOR = '#44785B';

// --- Mock fallback data (used when backend returns errors) ---
const MOCK_CATEGORY_TOPICS: Record<
  string,
  Array<LibraryTopicSummaryApiResponse & { articles?: LibraryArticleSummaryApiResponse[] }>
> = {
  'guided-meditations': [
    {
      id: 'mock-guided-1',
      slug: 'morning-reset',
      title: 'Morning Reset',
      summary: 'Calming start to the day with gentle prompts.',
      cover_image_url:
        'https://images.unsplash.com/photo-1526403225210-e1baf8ac8b23?auto=format&fit=crop&w=1200&q=80',
      order_index: 1,
      article_count: 3,
      tags: ['focus', 'breath'],
      accent_color: '#7796AF',
      is_active: true,
      articles: [
        {
          id: 'mock-article-1',
          slug: 'soft-sunrise',
          title: 'Soft Sunrise',
          subtitle: 'Ease into the morning with intention',
          hero_image_url:
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
          content_type: 'article',
          layout_variant: 'story',
          reading_time_minutes: 5,
          duration_seconds: null,
          tags: ['gratitude'],
          is_published: true,
          published_at: null,
          metadata: {},
        },
      ],
    },
    {
      id: 'mock-guided-2',
      slug: 'midday-clarity',
      title: 'Midday Clarity',
      summary: 'Refocus and ground during busy afternoons.',
      cover_image_url:
        'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=1200&q=80',
      order_index: 2,
      article_count: 2,
      tags: ['reset', 'focus'],
      accent_color: '#94C6C8',
      is_active: true,
      articles: [
        {
          id: 'mock-article-2',
          slug: 'clarity-breaths',
          title: 'Clarity Breaths',
          subtitle: 'Three mindful pauses to reset your focus',
          hero_image_url:
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
          content_type: 'article',
          layout_variant: 'practice',
          reading_time_minutes: 4,
          duration_seconds: 240,
          tags: ['breathing'],
          is_published: true,
          published_at: null,
          metadata: {},
        },
      ],
    },
  ],
};

const flattenCategoryTree = (
  node: LibraryCategoryTreeApiResponse,
  parentId?: string | null
): LibraryCategory[] => {
  const {
    id,
    slug,
    title,
    description,
    accent_color,
    icon,
    cover_image_url,
    order_index,
    is_active,
    tags,
    metadata,
    children,
  } = node;

  const current: LibraryCategory = {
    id,
    slug,
    title,
    description: description ?? undefined,
    parentId: parentId ?? null,
    accentColor: accent_color ?? DEFAULT_ACCENT_COLOR,
    icon: icon ?? undefined,
    coverImage: cover_image_url ?? undefined,
    orderIndex: order_index ?? 0,
    isActive: is_active ?? true,
    tags: tags ?? [],
    metadata,
  };

  const childNodes = (children ?? []).flatMap((child) => flattenCategoryTree(child, id));
  return [current, ...childNodes];
};

const mapTopicSummary = (
  topic: LibraryTopicSummaryApiResponse,
  categoryId: string,
  parentTopicId: string | null = null
): LibraryTopic => ({
  id: topic.id,
  slug: topic.slug,
  categoryId,
  title: topic.title,
  summary: topic.summary ?? '',
  coverImage: topic.cover_image_url ?? undefined,
  articleCount: topic.article_count ?? 0,
  tags: topic.tags ?? [],
  orderIndex: topic.order_index ?? 0,
  isActive: topic.is_active ?? true,
  accentColor: topic.accent_color ?? undefined,
  parentTopicId,
  metadata: undefined,
});

const mergeTopics = (existing: LibraryTopic[], incoming: LibraryTopic[]): LibraryTopic[] => {
  if (!incoming.length) return existing;
  const map = new Map<string, LibraryTopic>();
  for (const topic of existing) {
    map.set(topic.id, topic);
  }
  for (const topic of incoming) {
    map.set(topic.id, topic);
  }
  return Array.from(map.values());
};

const mapArticleSummary = (
  article: LibraryArticleSummaryApiResponse,
  topicId: string
): LibraryArticle => {
  const metadata = article.metadata ?? {};
  const durationMinutes = article.reading_time_minutes
    ?? (article.duration_seconds ? Math.max(1, Math.round(article.duration_seconds / 60)) : undefined);

  return {
    id: article.id,
    topicId,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle ?? undefined,
    heroImage: article.hero_image_url ?? undefined,
    contentType: (article.content_type as LibraryContentType) ?? 'article',
    durationMinutes: durationMinutes ?? undefined,
    excerpt: (metadata?.excerpt as string) ?? undefined,
    audioPreviewUrl: (metadata?.preview_audio_url as string) ?? undefined,
    tags: article.tags ?? [],
    metadata,
    presentationStyle: article.presentation_style ?? 'single_page',
    presentationConfig: article.presentation_config ?? {},
    blocks: [],
  };
};

const collectArticlesFromTopicDetail = (
  detail: LibraryTopicDetailApiResponse,
  topicId: string
) => {
  return (detail.articles ?? []).map((article) => mapArticleSummary(article, topicId));
};

export const useLibraryStore = create<LibraryState>((set, get) => ({
  categories: [],
  topics: [],
  articles: [],
  featuredArticles: [],
  selectedCategoryId: undefined,
  selectedTopicId: undefined,
  selectedTopicSlug: undefined,
  searchQuery: '',
  isLoading: false,
  isTopicLoading: false,
  error: undefined,
  loadedTopicChildren: {},
  async fetchLibrary() {
    if (get().isLoading) return;

    set({ isLoading: true, error: undefined });

    try {
      const categoryTree = await apiService.getLibraryCategories();
      const flattened = categoryTree.flatMap((root) => flattenCategoryTree(root));
      const sorted = flattened.sort((a, b) => a.orderIndex - b.orderIndex);

      const previousSelectedCategoryId = get().selectedCategoryId;
      const previousSelectedTopicId = get().selectedTopicId;
      const isCategoryValid =
        previousSelectedCategoryId &&
        sorted.some((category) => category.id === previousSelectedCategoryId);

      set({
        categories: sorted,
        selectedCategoryId: isCategoryValid ? previousSelectedCategoryId : undefined,
        selectedTopicId: isCategoryValid ? previousSelectedTopicId : undefined,
        selectedTopicSlug: isCategoryValid ? get().selectedTopicSlug : undefined,
        topics: isCategoryValid ? get().topics : [],
        articles: isCategoryValid ? get().articles : [],
        featuredArticles: isCategoryValid ? get().featuredArticles : [],
        isLoading: false,
        loadedTopicChildren: isCategoryValid ? get().loadedTopicChildren : {},
      });
    } catch (error: any) {
      const message = (error as ApiError)?.detail ?? error?.message ?? 'Unable to load library';
      console.error('❌ Failed to load library categories', error);
      set({
        isLoading: false,
        error: message,
      });
    }
  },
  async loadCategoryContent(categoryId: string) {
    const category = get().categories.find((item) => item.id === categoryId);
    if (!category) {
      set({
        topics: [],
        articles: [],
        featuredArticles: [],
        isLoading: false,
        selectedTopicId: undefined,
        loadedTopicChildren: {},
      });
      return;
    }

    set({
      isLoading: true,
      error: undefined,
      selectedTopicId: undefined,
      topics: [],
      articles: [],
      featuredArticles: [],
      loadedTopicChildren: {},
    });

    try {
      const topicsResponse = await apiService.getLibraryTopicsByCategory(category.slug);
      const normalizedTopics = topicsResponse
        .map((topic) => mapTopicSummary(topic, category.id, null))
        .sort((a, b) => a.orderIndex - b.orderIndex);

      set({
        topics: normalizedTopics,
        isLoading: false,
        articles: [],
        featuredArticles: [],
        loadedTopicChildren: {},
      });
    } catch (error: any) {
      const fallbackTopics = MOCK_CATEGORY_TOPICS[category.slug];
      if (fallbackTopics) {
        console.warn('⚠️ Falling back to mock topics for category:', category.slug, error);
        const normalizedTopics = fallbackTopics
          .map((topic) => mapTopicSummary(topic, category.id, null))
          .sort((a, b) => a.orderIndex - b.orderIndex);
        set({
          topics: normalizedTopics,
          articles: [],
          featuredArticles: [],
          isLoading: false,
          error: undefined,
          loadedTopicChildren: {},
        });
      } else {
        const message = (error as ApiError)?.detail ?? error?.message ?? 'Unable to load category';
        console.error('❌ Failed to load category content', error);
        set({
          topics: [],
          articles: [],
          featuredArticles: [],
          isLoading: false,
          error: message,
        });
      }
    }
  },
  async loadTopicContent(topic: LibraryTopic) {
    if (!topic) {
      set({
        selectedTopicId: undefined,
        selectedTopicSlug: undefined,
        articles: [],
        featuredArticles: [],
      });
      return;
    }

    set({
      isTopicLoading: true,
      error: undefined,
      selectedTopicId: topic.id,
      selectedTopicSlug: topic.slug,
    });

    try {
      const detail = await apiService.getLibraryTopicDetail(topic.slug);
      const shouldFetchChildren = !get().loadedTopicChildren[topic.id];
      const childTopicSummaries = shouldFetchChildren
        ? await apiService.getLibraryTopicsByParentSlug(topic.slug)
        : [];

      const aggregatedArticles = collectArticlesFromTopicDetail(detail, topic.id);
      const childTopics = childTopicSummaries
        .map((child) => mapTopicSummary(child, topic.categoryId, topic.id))
        .sort((a, b) => a.orderIndex - b.orderIndex);

      set((state) => ({
        articles: aggregatedArticles,
        featuredArticles: aggregatedArticles.slice(0, 4),
        topics: mergeTopics(state.topics, childTopics),
        isTopicLoading: false,
        loadedTopicChildren: {
          ...state.loadedTopicChildren,
          [topic.id]: true,
        },
      }));
    } catch (error: any) {
      const category = get().categories.find((cat) => cat.id === topic.categoryId);
      const fallbackTopics = category ? MOCK_CATEGORY_TOPICS[category.slug] : undefined;
      const fallbackTopic = fallbackTopics?.find((mockTopic) => mockTopic.slug === topic.slug);
      if (fallbackTopic?.articles?.length) {
        console.warn('⚠️ Falling back to mock articles for topic:', topic.slug, error);
        const aggregatedArticles = fallbackTopic.articles.map((article) => mapArticleSummary(article, topic.id));
        const childTopics = (fallbackTopics ?? [])
          .filter((child) => child.slug !== fallbackTopic.slug)
          .map((child) => mapTopicSummary(child, topic.categoryId, topic.id));
        set((state) => ({
          articles: aggregatedArticles,
          featuredArticles: aggregatedArticles.slice(0, 4),
          topics: mergeTopics(state.topics, childTopics),
          isTopicLoading: false,
          loadedTopicChildren: {
            ...state.loadedTopicChildren,
            [topic.id]: true,
          },
        }));
        return;
      }

      const message = (error as ApiError)?.detail ?? error?.message ?? 'Unable to load topic';
      console.error('❌ Failed to load topic content', error);
      set({
        articles: [],
        featuredArticles: [],
        isTopicLoading: false,
        error: message,
      });
    }
  },
  selectCategory(categoryId) {
    if (!categoryId) {
      set({
        selectedCategoryId: undefined,
        selectedTopicId: undefined,
        selectedTopicSlug: undefined,
        topics: [],
        articles: [],
        featuredArticles: [],
        loadedTopicChildren: {},
      });
      return;
    }

    set({
      selectedCategoryId: categoryId,
      selectedTopicId: undefined,
      selectedTopicSlug: undefined,
      topics: [],
      articles: [],
      featuredArticles: [],
      loadedTopicChildren: {},
    });
    void get().loadCategoryContent(categoryId);
  },
  selectTopic(topic) {
    if (!topic) {
      set({
        selectedTopicId: undefined,
        selectedTopicSlug: undefined,
        articles: [],
        featuredArticles: [],
        loadedTopicChildren: {},
      });
      return;
    }
    void get().loadTopicContent(topic);
  },
  setSearchQuery(query) {
    set({ searchQuery: query });
  },
}));
