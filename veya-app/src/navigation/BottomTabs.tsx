import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Home } from '../screens/home/Home';
import { Sessions } from '../screens/sessions/Sessions';
import { Progress } from '../screens/progress/Progress';
import { Profile } from '../screens/profile/Profile';
import { theme } from '../core/theme';
import { LibraryNavigator } from './LibraryNavigator';

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Sessions: undefined;
  Progress: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Home: 'home',
  Library: 'book',
  Sessions: 'play-circle',
  Progress: 'bar-chart-2',
};

const ACTIVE_PILL_COLOR = '#FFFFFF';
const ACTIVE_CIRCLE_COLOR = theme.colors.primary; // keep brand green
const INACTIVE_ICON_COLOR = '#7A7E83';
const TAB_BACKGROUND = 'rgba(255, 255, 255, 0.4)';

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const visibleRoutes = state.routes.filter((route, index) => {
    const options = descriptors[route.key]?.options;
    if (options?.tabBarButton && options.tabBarButton === null) {
      return false;
    }
    // hide explicitly when tabBarStyle display none
    if (options?.tabBarStyle && (options.tabBarStyle as any).display === 'none') {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        {visibleRoutes.map((route, index) => {
          const isFocused = state.index === state.routes.indexOf(route);
          const iconName = TAB_ICONS[route.name] ?? 'circle';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
              testID={descriptors[route.key]?.options.tabBarTestID}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
              activeOpacity={0.85}
            >
              <View style={[styles.iconCircle, isFocused && styles.iconCircleActive]}
              >
                <Feather
                  name={iconName}
                  size={22}
                  color={isFocused ? '#131313' : INACTIVE_ICON_COLOR}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const BottomTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Library" component={LibraryNavigator} />
      <Tab.Screen name="Sessions" component={Sessions} />
      <Tab.Screen name="Progress" component={Progress} />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    padding: 0,
    borderRadius: 32,
    backgroundColor: 'transparent',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TAB_BACKGROUND,
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  tabItemActive: {},
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  iconCircleActive: {
    backgroundColor: ACTIVE_CIRCLE_COLOR,
    shadowColor: '#2F4F3E',
    shadowOpacity: 0.22,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
});

