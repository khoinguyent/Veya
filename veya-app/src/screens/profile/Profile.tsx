import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../core/theme';
import { useAuthStore, BACKEND_USER_KEY } from '../../store/useAuthStore';
import { useUserInfoStore } from '../../store/useUserInfoStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../../services/api';

const PROFILE_COLORS = {
  background: '#EEECE6',
  surface: '#E0CFBD',
  highlight: '#F6EFE4',
  accent: '#7DC0B5',
  accentSoft: '#B6846A',
  textPrimary: '#5B4A3F',
  textSecondary: 'rgba(91, 74, 63, 0.72)',
  border: '#D7C4AD',
  statSurface: '#FFFFFF',
  clay: '#937F71',
};

const withOpacity = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized.length === 3 ? sanitized.repeat(2) : sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const safeAlpha = Math.min(Math.max(alpha, 0), 1);
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

const QUICK_ACTIONS = [
  {
    id: 'goals',
    title: 'Update goals',
    subtitle: 'Modify focus areas anytime',
    icon: 'target',
    background: '#EDF7F4',
    iconColor: PROFILE_COLORS.accent,
  },
  {
    id: 'insights',
    title: 'Life Profile',
    subtitle: 'Refresh your personal insights',
    icon: 'bookmark',
    background: '#F8E9E4',
    iconColor: PROFILE_COLORS.accentSoft,
  },
  {
    id: 'quotes',
    title: 'Quote notebook',
    subtitle: 'Save uplifting words and notes',
    icon: 'edit-3',
    background: '#EEF4FA',
    iconColor: '#627A9F',
  },
  {
    id: 'gratitude',
    title: 'Gratitude journal',
    subtitle: 'Browse heartfelt thank-you notes',
    icon: 'book-open',
    background: '#FBEDE3',
    iconColor: '#B6846A',
  },
  {
    id: 'favorites',
    title: 'Favorites hub',
    subtitle: 'Jump to saved sessions and reads',
    icon: 'star',
    background: '#F4E9F9',
    iconColor: '#8564A5',
  },
];

const SUPPORT_OPTIONS = [
  { id: 'support', title: 'Need help?', icon: 'life-buoy' },
  { id: 'terms', title: 'Terms & Conditions', icon: 'file-text' },
  { id: 'logout', title: 'Log out', icon: 'log-out' },
];

export const Profile: React.FC = () => {
  const { backendToken } = useAuthStore();
  const {
    userInfo,
    isLoading,
    fetchUserInfo,
    loadCachedUserInfo,
    updateUserInfo: updateUserInfoStore,
  } = useUserInfoStore();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const themeColors = {
    background: PROFILE_COLORS.background,
    card: PROFILE_COLORS.surface,
    highlight: PROFILE_COLORS.highlight,
    accent: PROFILE_COLORS.accent,
    textPrimary: PROFILE_COLORS.textPrimary,
    textSecondary: PROFILE_COLORS.textSecondary,
    border: PROFILE_COLORS.border,
  };

  useFocusEffect(
    useCallback(() => {
      loadCachedUserInfo();
      if (backendToken) {
        fetchUserInfo(backendToken, true).catch((error) => {
          console.warn('Failed to refresh user info:', error);
        });
      }
    }, [backendToken, fetchUserInfo, loadCachedUserInfo])
  );

  const displayName = useMemo(() => {
    if (!userInfo) return 'Mindful Explorer';
    if (userInfo.nickname) return userInfo.nickname;
    return (
      userInfo.display_name ||
      [userInfo.firstname, userInfo.lastname].filter(Boolean).join(' ') ||
      userInfo.email ||
      'Mindful Explorer'
    );
  }, [userInfo]);

  const memberSince = useMemo(() => {
    if (!userInfo?.created_at) return 'Member since this week';
    try {
      const date = new Date(userInfo.created_at);
      const formatter = new Intl.DateTimeFormat('en', {
        month: 'long',
        year: 'numeric',
      });
      return `Member since ${formatter.format(date)}`;
    } catch (error) {
      return 'Member since this week';
    }
  }, [userInfo?.created_at]);

  const initials = useMemo(() => {
    const source =
      displayName ||
      userInfo?.email ||
      userInfo?.username ||
      'Mindful Explorer';
    const parts = source.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [displayName, userInfo?.email, userInfo?.username]);

  const stats = useMemo(
    () => [
      {
        id: 'streak',
        label: 'Day streak',
        value: userInfo?.stats?.day_streak ?? 0,
        icon: 'sun',
      },
      {
        id: 'badges',
        label: 'Badges',
        value: userInfo?.stats?.badges_count ?? 0,
        icon: 'award',
      },
      {
        id: 'checkins',
        label: 'Check-ins',
        value: userInfo?.stats?.total_checkins ?? 0,
        icon: 'check-circle',
      },
    ],
    [
      userInfo?.stats?.day_streak,
      userInfo?.stats?.badges_count,
      userInfo?.stats?.total_checkins,
    ]
  );

  const handleAvatarUpload = useCallback(async () => {
    if (isUploadingAvatar) {
      return;
    }

    if (!backendToken) {
      Alert.alert(
        'Sign in required',
        'Please sign in again to update your profile picture.'
      );
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permission needed',
        'We need access to your photo library to let you choose an avatar.'
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (pickerResult.canceled || !pickerResult.assets?.length) {
      return;
    }

    const asset = pickerResult.assets[0];
    if (!asset?.uri) {
      Alert.alert('Upload failed', 'We could not read the selected image.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const extension =
        (asset.fileName?.split('.').pop() ||
          asset.uri.split('.').pop() ||
          'jpg').toLowerCase();
      const safeExtension = extension.replace(/[^a-z0-9]/gi, '') || 'jpg';
      const mimeType =
        asset.mimeType ||
        (safeExtension === 'jpg' || safeExtension === 'jpeg'
          ? 'image/jpeg'
          : `image/${safeExtension}`);

      const slugBase = `avatar-${userInfo?.id || 'user'}-${Date.now()}`;
      const safeSlug = slugBase
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const fileName =
        asset.fileName ||
        `${safeSlug}.${safeExtension === 'jpg' ? 'jpeg' : safeExtension}`;

      const uploadResponse = await apiService.uploadResource(backendToken, {
        file: {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        },
        name: `Avatar for ${displayName}`,
        slug: safeSlug,
        description: `Profile avatar uploaded on ${new Date().toISOString()}`,
        resource_type: 'image',
        category: 'profile',
        tags: ['avatar', 'profile'],
        is_public: true,
      });

      const newAvatarUrl = uploadResponse.resource.public_url;
      if (!newAvatarUrl) {
        throw new Error('Upload succeeded but no image URL returned.');
      }

      await apiService.updateUserInfo(backendToken, {
        avatar_url: newAvatarUrl,
      });

      await updateUserInfoStore({ avatar_url: newAvatarUrl });

      const authState = useAuthStore.getState();
      if (authState.backendUser || authState.user) {
        const updatedBackendUser = authState.backendUser
          ? { ...authState.backendUser, avatar_url: newAvatarUrl }
          : null;
        if (updatedBackendUser) {
          await AsyncStorage.setItem(
            BACKEND_USER_KEY,
            JSON.stringify(updatedBackendUser)
          );
        }

        useAuthStore.setState({
          backendUser: updatedBackendUser ?? authState.backendUser,
          user: authState.user
            ? { ...authState.user, avatarUrl: newAvatarUrl }
            : authState.user,
        });
      }

      Alert.alert('Profile updated', 'Your profile photo has been refreshed.');
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      const message =
        error?.detail ||
        error?.message ||
        'Unable to update your profile photo right now.';
      Alert.alert('Upload failed', message);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [backendToken, displayName, isUploadingAvatar, updateUserInfoStore, userInfo?.id]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}> 
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { backgroundColor: themeColors.background }] }
      >
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
              shadowColor: withOpacity(PROFILE_COLORS.clay, 0.42),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.avatarWrapper,
              { backgroundColor: themeColors.highlight, borderColor: themeColors.border },
            ]}
            activeOpacity={0.85}
            onPress={handleAvatarUpload}
          >
            {userInfo?.avatar_url ? (
              <Image source={{ uri: userInfo.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: themeColors.highlight }] }>
                <Text style={[styles.avatarInitials, { color: themeColors.accent }]}>{initials}</Text>
              </View>
            )}
            {isUploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.avatarHint, { color: themeColors.textSecondary }]}>Tap to update photo</Text>

          <Text style={[styles.profileName, { color: themeColors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.profileMeta, { color: themeColors.textSecondary }]}>{memberSince}</Text>

          <View style={[styles.statsRow, { backgroundColor: PROFILE_COLORS.statSurface, borderColor: themeColors.border }] }>
            {stats.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.statCard,
                  index === 1 && styles.statCardMiddle,
                ]}
              >
                <View style={[styles.statIconWrapper, { backgroundColor: withOpacity(themeColors.accent, 0.12) }]}>
                  <Feather name={item.icon as any} size={18} color={themeColors.accent} />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: action.background,
                    borderColor: withOpacity('#000000', 0.05),
                    shadowColor: withOpacity('#C49D7C', 0.6),
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  console.log(`Quick action pressed: ${action.id}`);
                }}
              >
                <View style={styles.actionIconWrapper}>
                  <View style={[styles.actionIconBg, { backgroundColor: withOpacity('#FFFFFF', 0.7) }] }>
                    <Feather name={action.icon as any} size={20} color={action.iconColor} />
                  </View>
                </View>
                <Text style={[styles.actionTitle, { color: themeColors.textPrimary }]}>{action.title}</Text>
                <Text style={[styles.actionSubtitle, { color: themeColors.textSecondary }]}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Support & Preferences</Text>
          <View style={[styles.supportList, { backgroundColor: '#FFFFFF' }] }>
            {SUPPORT_OPTIONS.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.supportRow,
                  idx === SUPPORT_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                ]}
                activeOpacity={0.75}
                onPress={() => console.log(`Support press: ${item.id}`)}
              >
                <View style={[styles.supportIconWrapper, { backgroundColor: withOpacity(themeColors.accent, 0.14) }] }>
                  <Feather name={item.icon as any} size={18} color={themeColors.accent} />
                </View>
                <Text style={[styles.supportLabel, { color: themeColors.textPrimary }]}>{item.title}</Text>
                <Feather name="chevron-right" size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={themeColors.accent} />
            <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Refreshing profile</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  profileCard: {
    borderRadius: 28,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 12,
    marginBottom: theme.spacing.md,
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    marginBottom: theme.spacing.lg,
  },
  profileMeta: {
    fontSize: 12,
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 18,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statCardMiddle: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(42, 74, 58, 0.08)',
  },
  statIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: PROFILE_COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  menuBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  menuCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F0',
  },
  menuText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.md,
  },
  actionCard: {
    width: '48%',
    borderRadius: 24,
    padding: theme.spacing.md,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  actionIconWrapper: {
    marginBottom: theme.spacing.sm,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  reflectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  reflectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  reflectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  reflectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 12,
    borderRadius: 16,
  },
  reflectionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  supportList: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: withOpacity('#000000', 0.04),
    backgroundColor: '#FFFFFF',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withOpacity('#000000', 0.06),
  },
  supportIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  supportLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  loadingText: {
    fontSize: 13,
  },
});

