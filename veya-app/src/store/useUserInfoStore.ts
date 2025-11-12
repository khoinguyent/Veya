import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

export interface UserStats {
  day_streak: number;
  longest_streak: number;
  total_checkins: number;
  badges_count: number;
  minutes_practiced: number;
  last_checkin_at?: string | null;
}

export interface GreetingTheme {
  card: string;
  highlight: string;
  accent: string;
  text_primary: string;
  text_secondary: string;
}

export interface GreetingInfo {
  title: string;
  subtitle: string;
  icon: string;
  theme: GreetingTheme;
}

/**
 * User Display Info - Optimized for frontend display
 * This is the lightweight user info returned from /users/me/info endpoint
 */
export interface UserDisplayInfo {
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
  stats: UserStats;
  greeting?: GreetingInfo;
  timezone: string;
  created_at: string;
  last_login_at?: string;
}

const USER_INFO_STORAGE_KEY = '@veya:user_info';
const USER_INFO_TIMESTAMP_KEY = '@veya:user_info_timestamp';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes (matches backend cache)

const defaultStats: UserStats = {
  day_streak: 0,
  longest_streak: 0,
  total_checkins: 0,
  badges_count: 0,
  minutes_practiced: 0,
  last_checkin_at: null,
};

const defaultGreeting: GreetingInfo = {
  title: 'Hello',
  subtitle: 'Take a mindful moment',
  icon: 'sun',
  theme: {
    card: '#E4EFE6',
    highlight: '#F2F8F3',
    accent: '#5C8B70',
    text_primary: '#3F5A4B',
    text_secondary: '#6B826F',
  },
};

interface UserInfoState {
  userInfo: UserDisplayInfo | null;
  isLoading: boolean;
  lastFetched: number | null; // Timestamp of last fetch
  error: string | null;
  
  // Actions
  fetchUserInfo: (token: string, forceRefresh?: boolean) => Promise<UserDisplayInfo | null>;
  updateUserInfo: (updates: Partial<UserDisplayInfo>) => Promise<void>;
  clearUserInfo: () => Promise<void>;
  loadCachedUserInfo: () => Promise<void>;
}

export const useUserInfoStore = create<UserInfoState>((set, get) => ({
  userInfo: null,
  isLoading: false,
  lastFetched: null,
  error: null,

  /**
   * Load cached user info from AsyncStorage
   */
  loadCachedUserInfo: async () => {
    try {
      const [userInfoStr, timestampStr] = await AsyncStorage.multiGet([
        USER_INFO_STORAGE_KEY,
        USER_INFO_TIMESTAMP_KEY,
      ]);
      
      const [, userInfoJson] = userInfoStr;
      const [, timestampJson] = timestampStr;
      
      if (userInfoJson && timestampJson) {
         const rawUserInfo = JSON.parse(userInfoJson) as Partial<UserDisplayInfo>;
         const userInfo: UserDisplayInfo = {
           ...(rawUserInfo as UserDisplayInfo),
           stats: { ...defaultStats, ...(rawUserInfo.stats ?? {}) } as UserStats,
           greeting: rawUserInfo.greeting
            ? {
                ...defaultGreeting,
                ...rawUserInfo.greeting,
                theme: {
                  ...defaultGreeting.theme,
                  ...(rawUserInfo.greeting?.theme ?? {}),
                },
              }
            : defaultGreeting,
          timezone: rawUserInfo.timezone ?? 'UTC',
        };
        const lastFetched = parseInt(timestampJson, 10);
        const age = Date.now() - lastFetched;
        
        // Only use cache if it's less than cache duration old
        if (age < CACHE_DURATION_MS) {
          console.log('📦 Loaded user info from cache (age:', Math.round(age / 1000), 's)');
          set({ userInfo, lastFetched });
          return;
        } else {
          console.log('⚠️  Cached user info expired (age:', Math.round(age / 1000), 's)');
          // Cache expired, but keep it as fallback
          set({ userInfo, lastFetched });
        }
      }
    } catch (error) {
      console.error('❌ Error loading cached user info:', error);
    }
  },

  /**
   * Fetch user info from API
   * @param token - Backend JWT token
   * @param forceRefresh - If true, bypass cache and fetch fresh data
   */
  fetchUserInfo: async (token: string, forceRefresh: boolean = false) => {
    const { userInfo, lastFetched } = get();
    
    // Check if we have fresh cached data (unless force refresh)
    if (!forceRefresh && userInfo && lastFetched) {
      const age = Date.now() - lastFetched;
      if (age < CACHE_DURATION_MS) {
        console.log('✅ Using cached user info (age:', Math.round(age / 1000), 's)');
        return userInfo;
      }
    }

    set({ isLoading: true, error: null });

    try {
      console.log('🌐 Fetching user info from API...');
      const apiUserInfo = await apiService.getUserInfo(token);
      const userInfo: UserDisplayInfo = {
        ...(apiUserInfo as UserDisplayInfo),
        stats: { ...defaultStats, ...(apiUserInfo.stats ?? {}) },
        greeting: apiUserInfo.greeting
          ? {
              ...defaultGreeting,
              ...apiUserInfo.greeting,
              theme: {
                ...defaultGreeting.theme,
                ...(apiUserInfo.greeting?.theme ?? {}),
              },
            }
          : defaultGreeting,
        timezone: apiUserInfo.timezone ?? 'UTC',
      };
      
      console.log('✅ User info fetched successfully');
      console.log('   Display name:', userInfo.display_name);
      console.log('   Has profile:', userInfo.has_profile);
      console.log('   Onboarding completed:', userInfo.onboarding_completed);
      
      // Save to AsyncStorage
      const timestamp = Date.now();
      await AsyncStorage.multiSet([
        [USER_INFO_STORAGE_KEY, JSON.stringify(userInfo)],
        [USER_INFO_TIMESTAMP_KEY, timestamp.toString()],
      ]);
      
      set({ 
        userInfo, 
        lastFetched: timestamp,
        isLoading: false,
        error: null,
      });
      
      return userInfo;
    } catch (error: any) {
      console.error('❌ Error fetching user info:', error);
      const errorMessage = error.detail || error.message || 'Failed to fetch user info';
      
      set({ 
        isLoading: false, 
        error: errorMessage,
      });
      
      // Return cached data as fallback if available
      if (userInfo) {
        console.log('⚠️  Using cached user info as fallback');
        return userInfo;
      }
      
      return null;
    }
  },

  /**
   * Update user info locally (optimistic update)
   * This should be called after successfully updating user info on the backend
   * @param updates - Partial user info to update
   */
  updateUserInfo: async (updates: Partial<UserDisplayInfo>) => {
    const { userInfo } = get();
    
    if (!userInfo) {
      console.warn('⚠️  Cannot update user info - no user info loaded');
      return;
    }
    
    const normalizedUserInfo: UserDisplayInfo = {
      ...userInfo,
      ...updates,
      stats: {
        ...defaultStats,
        ...userInfo.stats,
        ...(updates.stats ?? {}),
      },
      greeting: updates.greeting
        ? {
            ...defaultGreeting,
            ...userInfo.greeting,
            ...updates.greeting,
            theme: {
              ...defaultGreeting.theme,
              ...(userInfo.greeting?.theme ?? {}),
              ...(updates.greeting?.theme ?? {}),
            },
          }
        : userInfo.greeting ?? defaultGreeting,
      timezone: updates.timezone ?? userInfo.timezone ?? 'UTC',
    };
    
    // Update in store
    set({ userInfo: normalizedUserInfo });
    
    // Update in AsyncStorage
    try {
      const timestamp = Date.now();
      await AsyncStorage.multiSet([
        [USER_INFO_STORAGE_KEY, JSON.stringify(normalizedUserInfo)],
        [USER_INFO_TIMESTAMP_KEY, timestamp.toString()],
      ]);
      console.log('✅ User info updated locally');
    } catch (error) {
      console.error('❌ Error updating user info in storage:', error);
    }
  },

  /**
   * Clear user info (on logout)
   */
  clearUserInfo: async () => {
    try {
      await AsyncStorage.multiRemove([
        USER_INFO_STORAGE_KEY,
        USER_INFO_TIMESTAMP_KEY,
      ]);
      set({ 
        userInfo: null, 
        lastFetched: null,
        error: null,
      });
      console.log('🧹 User info cleared');
    } catch (error) {
      console.error('❌ Error clearing user info:', error);
    }
  },
}));

