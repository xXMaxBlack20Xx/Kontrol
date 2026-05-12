import { Redirect, Stack, type Href } from 'expo-router';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { useAuth } from '@/features/account/auth-context';

export default function ProtectedAppLayout() {
  const { isAuthenticated, isLoadingSession } = useAuth();

  if (isLoadingSession) {
    return <SessionLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="habits/create" />
      <Stack.Screen name="habits/[id]" />
      <Stack.Screen name="habits/[id]/edit" />
    </Stack>
  );
}
