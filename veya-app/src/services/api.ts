// API Configuration and Service
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email?: string;
    display_name?: string;
    avatar_url?: string;
    is_guest: boolean;
    auth_provider: string;
    is_active: boolean;
  };
  token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name?: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface UploadResourcePayload {
  file: {
    uri: string;
    name: string;
    type: string;
  };
  name: string;
  slug: string;
  description?: string;
  resource_type: 'illustration' | 'sound' | 'image' | 'video' | 'audio' | 'document' | 'other';
  category?: 'onboarding' | 'home' | 'profile' | 'meditation' | 'mood' | 'background' | 'icon' | 'other';
  tags?: string[];
  is_public?: boolean;
}

export interface ResourceUploadResponse {
  resource: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    resource_type: string;
    category: string;
    mime_type: string;
    file_extension: string;
    r2_key: string;
    r2_bucket: string;
    public_url: string;
    file_size?: number;
    created_at: string;
    uploaded_at?: string;
    updated_at?: string;
  };
  message: string;
}

export interface JournalEntryPayload {
  prompt?: string;
  emoji?: string;
  note: string;
  tags?: string[];
  mood?: string;
  source?: string;
  is_favorite?: boolean;
  local_date?: string;
  local_timezone?: string;
  sentiment_score?: number;
  weather_snapshot?: Record<string, any>;
  attachments?: Array<Record<string, any>>;
  metadata?: Record<string, any>;
  created_from_device?: string;
}

export interface JournalEntryResponse {
  id: string;
  prompt?: string | null;
  emoji?: string | null;
  note: string;
  tags: string[];
  mood?: string | null;
  source?: string | null;
  is_favorite: boolean;
  local_date: string;
  local_timezone: string;
  sequence_in_day: number;
  word_count?: number | null;
  created_local_at?: string | null;
  updated_local_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  archived_at?: string | null;
  weather_snapshot?: Record<string, any>;
  attachments?: Array<Record<string, any>>;
  metadata?: Record<string, any>;
  created_from_device?: string | null;
}

export interface JournalEntryListResponse {
  items: JournalEntryResponse[];
  next_cursor?: string | null;
}

export interface LibraryCategoryTreeApiResponse {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  accent_color?: string | null;
  icon?: string | null;
  cover_image_url?: string | null;
  order_index: number;
  is_active: boolean;
  tags: string[];
  metadata?: Record<string, any>;
  children?: LibraryCategoryTreeApiResponse[];
}

export interface LibraryTopicSummaryApiResponse {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  cover_image_url?: string | null;
  order_index: number;
  article_count: number;
  tags: string[];
  accent_color?: string | null;
  is_active: boolean;
}

export interface LibraryArticleSummaryApiResponse {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  hero_image_url?: string | null;
  content_type: string;
  layout_variant?: string | null;
  reading_time_minutes?: number | null;
  duration_seconds?: number | null;
  tags: string[];
  is_published: boolean;
  published_at?: string | null;
  metadata?: Record<string, any>;
  presentation_style?: 'single_page' | 'paged_blocks';
  presentation_config?: Record<string, any> | null;
}

export interface LibraryArticleBlockApiResponse {
  position: number;
  block_type: string;
  payload: Record<string, any>;
  metadata?: Record<string, any> | null;
}

export interface LibraryTopicDetailApiResponse {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  cover_image_url?: string | null;
  tags?: string[];
  metadata?: Record<string, any>;
  category?: LibraryCategoryTreeApiResponse | null;
  articles: LibraryArticleSummaryApiResponse[];
}

export interface LibraryArticleDetailApiResponse {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  hero_image_url?: string | null;
  hero_video_url?: string | null;
  audio_url?: string | null;
  transcript_url?: string | null;
  content_locale: string;
  content_type: string;
  layout_variant?: string | null;
  reading_time_minutes?: number | null;
  duration_seconds?: number | null;
  tags: string[];
  is_published: boolean;
  published_at?: string | null;
  metadata?: Record<string, any>;
  blocks: LibraryArticleBlockApiResponse[];
  topic?: LibraryTopicSummaryApiResponse | null;
  presentation_style?: 'single_page' | 'paged_blocks';
  presentation_config?: Record<string, any> | null;
}

export interface SessionSummary {
  id: string;
  title: string;
  subtitle?: string;
  artworkUrl: string;
  durationMinutes: number | null;
  category?: string;
}

export interface SessionsPage {
  sessions: SessionSummary[];
  nextPage: number | null;
  hasMore: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      const rawText = await response.text();
      let data: any = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          if (response.ok) {
            console.warn('⚠️ Expected JSON but received text:', rawText);
            data = rawText;
          } else {
            console.error(`❌ API Error: ${response.status} - Non-JSON response`, rawText);
            throw {
              detail: rawText || 'An error occurred',
              status_code: response.status,
            } as ApiError;
          }
        }
      }

      if (!response.ok) {
        const errorDetail =
          (data && typeof data === 'object' && 'detail' in data && (data as any).detail) ||
          'An error occurred';

        console.error(`❌ API Error: ${response.status}`, data);
        throw {
          detail: errorDetail,
          status_code: response.status,
        } as ApiError;
      }

      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);

      if (data === null || data === undefined || data === '') {
        return {} as T;
      }

      return data as T;
    } catch (error: any) {
      if (error.detail) {
        throw error;
      }
      throw {
        detail: error.message || 'Network error. Please check your connection.',
      } as ApiError;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    // Note: This endpoint may need to be created in the backend
    // For now, we'll try to use it if it exists
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(token: string) {
    return this.request('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Helper method to get request with auth token
  async authenticatedRequest<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
    // If token not provided, try to get from auth store
    if (!token) {
      // This is a helper - in practice, pass token from auth store
      throw new Error('Token required for authenticated request');
    }
    
    return this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Onboarding status
  async getOnboardingStatus(token: string) {
    return this.authenticatedRequest<{
      is_completed: boolean;
      has_profile: boolean;
      personalized_at: string | null;
      completion_percentage: number;
      missing_fields: string[];
      current_screen: string | null;
      next_screen: string | null;
      completed_screens: string[];
      onboarding_started_at: string | null;
    }>('/onboarding/status', {
      method: 'GET',
    }, token);
  }

  // User info - optimized for frontend display (cached)
  async getUserInfo(token: string, useCache: boolean = true) {
    const url = useCache 
      ? '/users/me/info' 
      : '/users/me/info?use_cache=false';
    
    return this.authenticatedRequest<{
      id: string;
      email?: string;
      username?: string;
      display_name?: string;
      firstname?: string;
      lastname?: string;
      nickname?: string;
      avatar_url?: string;
      has_profile: boolean;
      profile_name?: string;
      onboarding_completed: boolean;
      onboarding_completion_percentage: number;
      current_onboarding_screen?: string;
      has_personalization: boolean;
      has_consent: boolean;
      stats: {
        day_streak: number;
        longest_streak: number;
        total_checkins: number;
        badges_count: number;
        minutes_practiced: number;
        last_checkin_at?: string | null;
      };
      greeting?: {
        title: string;
        subtitle: string;
        icon: string;
        theme: {
          card: string;
          highlight: string;
          accent: string;
          text_primary: string;
          text_secondary: string;
        };
      };
      timezone: string;
      created_at: string;
      last_login_at?: string;
    }>(url, {
      method: 'GET',
    }, token);
  }

  // Full user profile (including personalization data)
  async getUserProfile(token: string) {
    return this.authenticatedRequest<{
      id: string;
      email?: string;
      username?: string;
      display_name?: string;
      firstname?: string;
      lastname?: string;
      nickname?: string;
      avatar_url?: string;
      is_guest: boolean;
      auth_provider: string;
      is_active: boolean;
      created_at: string;
      updated_at?: string;
      last_login_at?: string;
      profile?: {
        id: string;
        user_id: string;
        name?: string;
        age_range?: string;
        gender?: string;
        occupation?: string;
        goals: string[];
        challenges: string[];
        practice_preferences: string[];
        interests: string[];
        reminder_times: string[];
        experience_level?: string;
        mood_tendency?: string;
        preferred_practice_time?: string;
        data_consent: boolean;
        marketing_consent: boolean;
        onboarding_screen?: string;
        onboarding_started_at?: string;
        personalized_at?: string;
        created_at: string;
        updated_at?: string;
      };
      social_accounts: Array<{
        id: string;
        provider: string;
        provider_account_id: string;
        provider_email?: string;
        created_at: string;
      }>;
    }>('/users/me', {
      method: 'GET',
    }, token);
  }

  // Update user basic info
  async updateUserInfo(
    token: string,
    updates: {
      display_name?: string;
      avatar_url?: string;
      username?: string;
    }
  ) {
    return this.authenticatedRequest<{
      id: string;
      email?: string;
      username?: string;
      display_name?: string;
      avatar_url?: string;
      is_guest: boolean;
      auth_provider: string;
      is_active: boolean;
      created_at: string;
      updated_at?: string;
      last_login_at?: string;
    }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, token);
  }

  async uploadResource(token: string, payload: UploadResourcePayload): Promise<ResourceUploadResponse> {
    const formData = new FormData();

    formData.append('file', payload.file as any);
    formData.append('name', payload.name);
    formData.append('slug', payload.slug);
    if (payload.description) {
      formData.append('description', payload.description);
    }
    formData.append('resource_type', payload.resource_type);
    formData.append('category', payload.category ?? 'profile');
    formData.append('is_public', String(payload.is_public ?? true));
    if (payload.tags?.length) {
      formData.append('tags', payload.tags.join(','));
    }

    const url = `${this.baseUrl}/resources/upload`;

    try {
      console.log('🌐 Uploading resource:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const rawText = await response.text();
      let data: any = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          if (response.ok) {
            console.warn('⚠️ Expected JSON but received text from upload:', rawText);
            data = rawText;
          } else {
            console.error(`❌ Upload error ${response.status}: Non-JSON response`, rawText);
            throw {
              detail: rawText || 'Failed to upload resource',
              status_code: response.status,
            } as ApiError;
          }
        }
      }

      if (!response.ok) {
        const errorDetail =
          (data && typeof data === 'object' && 'detail' in data && (data as any).detail) ||
          'Failed to upload resource';

        console.error(`❌ Upload error ${response.status}`, data);
        throw {
          detail: errorDetail,
          status_code: response.status,
        } as ApiError;
      }

      return data as ResourceUploadResponse;
    } catch (error: any) {
      if (error.detail) {
        throw error;
      }
      throw {
        detail: error.message || 'Network error while uploading resource',
      } as ApiError;
    }
  }

  async createJournalEntry(token: string, payload: JournalEntryPayload): Promise<JournalEntryResponse> {
    return this.authenticatedRequest<JournalEntryResponse>(
      '/journal/entries',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      token
    );
  }

  async getJournalEntries(
    token: string,
    options: {
      limit?: number;
      cursor?: string;
      startDate?: string;
      endDate?: string;
      favoritesOnly?: boolean;
      tag?: string;
      mood?: string;
      includeArchived?: boolean;
    } = {}
  ): Promise<JournalEntryListResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.cursor) params.append('cursor', options.cursor);
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate) params.append('end_date', options.endDate);
    if (options.tag) params.append('tag', options.tag);
    if (options.mood) params.append('mood', options.mood);
    if (options.favoritesOnly) params.append('favorites_only', 'true');
    if (options.includeArchived) params.append('include_archived', 'true');

    const query = params.toString();

    return this.authenticatedRequest<JournalEntryListResponse>(
      `/journal/entries${query ? `?${query}` : ''}`,
      { method: 'GET' },
      token
    );
  }

  // Update user profile (personalization data)
  async updateUserProfile(
    token: string,
    profileData: {
      name?: string;
      age_range?: string;
      gender?: string;
      occupation?: string;
      wake_time?: string;
      sleep_time?: string;
      work_hours?: string;
      screen_time?: string;
      goals?: string[];
      challenges?: string[];
      practice_preferences?: string[];
      interests?: string[];
      reminder_times?: string[];
      experience_level?: string;
      mood_tendency?: string;
      preferred_practice_time?: string;
      data_consent?: boolean;
      marketing_consent?: boolean;
      onboarding_screen?: string;
    }
  ) {
    // Use POST to create or update profile
    return this.authenticatedRequest<{
      id: string;
      user_id: string;
      name?: string;
      age_range?: string;
      gender?: string;
      occupation?: string;
      goals: string[];
      challenges: string[];
      practice_preferences: string[];
      interests: string[];
      reminder_times: string[];
      experience_level?: string;
      mood_tendency?: string;
      preferred_practice_time?: string;
      data_consent: boolean;
      marketing_consent: boolean;
      onboarding_screen?: string;
      onboarding_started_at?: string;
      personalized_at?: string;
      created_at: string;
      updated_at?: string;
    }>('/users/me/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }, token);
  }

  // Get all personalization templates for onboarding
  async getOnboardingTemplates() {
    return this.request<Array<{
      id: string;
      category: string;
      view_order: number;
      screen_key: string;
      screen_title: string;
      screen_subtitle: string;
      screen_type: 'form' | 'multi' | 'single' | 'consent';
      screen_icon: string;
      templates: Array<{
        code: string;
        label: string;
        emoji?: string;
        description?: string;
        display_order: number;
        is_active: boolean;
      }>;
      fields?: Array<{
        name: string;
        type: string;
        label: string;
        optional?: boolean;
        options?: Array<{ id: string; label: string }>;
      }>;
      version: number;
      created_at: string;
      updated_at?: string;
    }>>('/templates/onboarding', {
      method: 'GET',
    });
  }

  // Get all templates (alternative endpoint)
  async getAllTemplates() {
    return this.request<{
      goals?: Array<{ code: string; label: string; emoji?: string; description?: string }>;
      challenges?: Array<{ code: string; label: string; emoji?: string; description?: string }>;
      practices?: Array<{ code: string; label: string; emoji?: string; description?: string }>;
      interests?: Array<{ code: string; label: string; emoji?: string; description?: string }>;
      reminders?: Array<{ code: string; label: string; emoji?: string; description?: string }>;
      age_ranges?: Array<{ id: string; label: string }>;
      genders?: Array<{ id: string; label: string }>;
      work_hours?: Array<{ id: string; label: string }>;
      screen_time?: Array<{ id: string; label: string }>;
      experience_levels?: string[] | Array<{ code: string; label: string; emoji?: string }>;
      mood_tendencies?: string[] | Array<{ code: string; label: string; emoji?: string }>;
      practice_times?: string[] | Array<{ code: string; label: string; emoji?: string }>;
    }>('/templates/all', {
      method: 'GET',
    });
  }

  async getSessions(page: number = 1, pageSize: number = 6) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });

    try {
      const response = await this.request<any>(`/sessions?${params.toString()}`, {
        method: 'GET',
      });

      const items = (response?.items || response?.data || []).map(this.mapSessionSummary);
      const meta = response?.meta || response?.pagination || {};

      const nextPage =
        meta?.next_page ?? response?.nextPage ?? response?.next_page ?? null;
      const hasMore =
        meta?.has_more ?? response?.hasMore ?? response?.has_more ?? Boolean(nextPage);

      return {
        sessions: items,
        nextPage: typeof nextPage === 'number' ? nextPage : hasMore ? page + 1 : null,
        hasMore: Boolean(hasMore),
      };
    } catch (error) {
      console.warn('Falling back to mock sessions data:', error?.detail || error);
      return this.getMockSessions(page, pageSize);
    }
  }

  private mapSessionSummary = (item: any): SessionSummary => ({
    id: String(item?.id ?? item?.slug ?? item?.title ?? Date.now()),
    title: String(item?.title ?? 'Mindful Moment'),
    subtitle:
      item?.subtitle ?? item?.tagline ?? item?.description ?? item?.focus ?? undefined,
    artworkUrl:
      item?.artwork_url ??
      item?.artworkUrl ??
      item?.image_url ??
      item?.imageUrl ??
      'https://images.unsplash.com/photo-1526402466401-54fcaa98eb8e?auto=format&fit=crop&w=1200&q=80',
    durationMinutes:
      item?.duration_minutes ??
      item?.durationMinutes ??
      item?.length_minutes ??
      item?.lengthMinutes ??
      null,
    category: item?.category ?? item?.mood ?? item?.theme ?? undefined,
  });

  private getMockSessions(page: number, pageSize: number): SessionsPage {
    const MOCK_SESSIONS: SessionSummary[] = [
      {
        id: 'sunrise-breathing',
        title: 'Sunrise Breathing',
        subtitle: 'Ease into the day with calm intention',
        artworkUrl:
          'https://images.unsplash.com/photo-1499442361943-45d4de00f6f9?auto=format&fit=crop&w=800&q=80',
        durationMinutes: 12,
        category: 'Morning Reset',
      },
      {
        id: 'coastal-reset',
        title: 'Coastal Reset',
        subtitle: 'Release tension with ocean imagery',
        artworkUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        durationMinutes: 18,
        category: 'Relaxation',
      },
      {
        id: 'forest-focus',
        title: 'Forest Focus',
        subtitle: 'Deep work accompanied by woodland tones',
        artworkUrl:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
        durationMinutes: 22,
        category: 'Productivity',
      },
      {
        id: 'evening-unwind',
        title: 'Evening Unwind',
        subtitle: 'Soothe your mind before bedtime',
        artworkUrl:
          'https://images.unsplash.com/photo-1524901548305-08eeddc35080?auto=format&fit=crop&w=800&q=80',
        durationMinutes: 15,
        category: 'Evening Wind-down',
      },
      {
        id: 'mountain-clarity',
        title: 'Mountain Clarity',
        subtitle: 'Find perspective with expansive vistas',
        artworkUrl:
          'https://images.unsplash.com/photo-1476611338391-6f395a0ebc44?auto=format&fit=crop&w=800&q=80',
        durationMinutes: 20,
        category: 'Mindfulness',
      },
      {
        id: 'gratitude-waves',
        title: 'Gratitude Waves',
        subtitle: 'Reflect on small joys with gentle prompts',
        artworkUrl:
          'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
        durationMinutes: 10,
        category: 'Reflection',
      },
      {
        id: 'city-stillness',
        title: 'City Stillness',
        subtitle: 'Moments of quiet wherever you are',
        artworkUrl:
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
        durationMinutes: 8,
        category: 'Quick Break',
      },
      {
        id: 'lighthouse-flow',
        title: 'Lighthouse Flow',
        subtitle: 'Guided breath with gentle motion cues',
        artworkUrl:
          'https://images.unsplash.com/photo-1499084732479-de2c02d45fc4?auto=format&fit=crop&w=800&q=80',
        durationMinutes: 14,
        category: 'Breathwork',
      },
      {
        id: 'meadow-softness',
        title: 'Meadow Softness',
        subtitle: 'Body scan with nature visualization',
        artworkUrl:
          'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
        durationMinutes: 16,
        category: 'Body Scan',
      },
    ];

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = MOCK_SESSIONS.slice(start, end);
    const hasMore = end < MOCK_SESSIONS.length;

    return {
      sessions: slice,
      nextPage: hasMore ? page + 1 : null,
      hasMore,
    };
  }

  async getLibraryCategories() {
    return this.request<LibraryCategoryTreeApiResponse[]>('/library/categories', {
      method: 'GET',
    });
  }

  async getLibraryTopicsByCategory(slug: string) {
    return this.request<LibraryTopicSummaryApiResponse[]>(`/library/categories/${slug}/topics`, {
      method: 'GET',
    });
  }

  async getLibraryTopicDetail(slug: string) {
    return this.request<LibraryTopicDetailApiResponse>(`/library/topics/${slug}`, {
      method: 'GET',
    });
  }

  async getLibraryTopicsByParentSlug(slug: string) {
    const query = encodeURIComponent(slug);
    return this.request<LibraryTopicSummaryApiResponse[]>(`/library/topics?parent_slug=${query}`, {
      method: 'GET',
    });
  }

  async getLibraryArticleDetail(slug: string) {
    return this.request<LibraryArticleDetailApiResponse>(`/library/articles/${slug}`, {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();
export default apiService;

