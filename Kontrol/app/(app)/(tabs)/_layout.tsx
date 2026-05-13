import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';

import { colors } from '@/components/ui/theme';

export default function AppTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen
        name="habits/index"
        options={{
          title: 'Hábitos',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} name="check-circle" size={26} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} name="bar-chart" size={26} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Recordatorios',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} name="notifications-none" size={26} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} name="settings" size={26} />,
        }}
      />
    </Tabs>
  );
}
