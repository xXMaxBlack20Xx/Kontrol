import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';

export default function AppTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0A84FF',
        tabBarInactiveTintColor: '#8A8A8E',
      }}>
      <Tabs.Screen
        name="habits/index"
        options={{
          title: 'Habitos',
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
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} name="settings" size={26} />,
        }}
      />
    </Tabs>
  );
}
