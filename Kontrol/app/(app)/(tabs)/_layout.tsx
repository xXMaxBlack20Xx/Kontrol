import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/ui/theme-context';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Track hover/press interactions for tabs to trigger dynamic blur/overlay effects
  const [activeInteractionIndex, setActiveInteractionIndex] = useState<number | null>(null);
  // Track hover/press interactions for the floating circle button
  const [isCircleActive, setIsCircleActive] = useState(false);

  // Dynamic values based on active interactions
  const capsuleIntensity = activeInteractionIndex !== null ? 98 : 90;
  const capsuleBgOpacity = activeInteractionIndex !== null
    ? (isDark ? 'rgba(30, 30, 30, 0.75)' : 'rgba(225, 225, 230, 0.8)')
    : (isDark ? 'rgba(20, 20, 20, 0.55)' : 'rgba(240, 240, 245, 0.6)');

  const circleIntensity = isCircleActive ? 98 : 90;
  // Match circle background with the capsule glass color overlay
  const circleBgColor = isCircleActive
    ? (isDark ? 'rgba(30, 30, 30, 0.75)' : 'rgba(225, 225, 230, 0.8)')
    : (isDark ? 'rgba(20, 20, 20, 0.55)' : 'rgba(240, 240, 245, 0.6)');

  const inactiveIconColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.55)';
  const circleIconColor = isCircleActive ? '#007AFF' : inactiveIconColor;

  return (
    <View style={[styles.tabBarContainer, { bottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}>
      {/* Capsule Navigation Bar */}
      <View style={[styles.capsuleShadow, { shadowColor: '#000000' }]}>
        <BlurView
          intensity={capsuleIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.capsuleBlur,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: capsuleBgOpacity,
            },
          ]}
        >
          <View style={styles.tabItemsContainer}>
            {state.routes.map((route: any, index: number) => {
              const isFocused = state.index === index;
              const isInteracting = activeInteractionIndex === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              let iconName: any = 'home';

              if (route.name === 'habits/index') {
                iconName = 'home';
              } else if (route.name === 'progress') {
                iconName = 'insights';
              } else if (route.name === 'reminders') {
                iconName = 'notifications';
              } else if (route.name === 'settings') {
                iconName = 'settings';
              }

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  onPressIn={() => setActiveInteractionIndex(index)}
                  onPressOut={() => setActiveInteractionIndex(null)}
                  onHoverIn={() => setActiveInteractionIndex(index)}
                  onHoverOut={() => setActiveInteractionIndex(null)}
                  style={[
                    styles.tabItem,
                    isInteracting && { transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <View style={styles.iconWrapper}>
                    <MaterialIcons
                      name={iconName}
                      size={32}
                      color={isFocused ? '#007AFF' : inactiveIconColor}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>

      {/* Floating Action Button (Habit Creation) */}
      <Pressable
        onPress={() => router.push('/(app)/habits/create' as Href)}
        onPressIn={() => setIsCircleActive(true)}
        onPressOut={() => setIsCircleActive(false)}
        onHoverIn={() => setIsCircleActive(true)}
        onHoverOut={() => setIsCircleActive(false)}
        style={[
          styles.circleShadow,
          isCircleActive && { transform: [{ scale: 0.94 }] },
        ]}
      >
        <BlurView
          intensity={circleIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.circleBlur,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: circleBgColor,
            },
          ]}
        >
          <MaterialIcons name="add" size={32} color={circleIconColor} style={styles.boldPlus} />
        </BlurView>
      </Pressable>
    </View>
  );
}

export default function AppTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="habits/index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progreso',
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Recordatorios',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuraciones',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  capsuleShadow: {
    flex: 1,
    marginRight: 10,
    shadowRadius: 16,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  capsuleBlur: {
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tabItemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleShadow: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  circleBlur: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boldPlus: {
    fontWeight: 'bold',
  },
});
