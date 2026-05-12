import { Redirect, Stack, type Href, usePathname } from 'expo-router';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { useAuth } from '@/features/account/auth-context';

export default function AuthLayout() {
  const { isAuthenticated, isLoadingSession } = useAuth();
  const pathname = usePathname();
  const isPrivacyRoute = pathname.endsWith('/privacy');

  if (isLoadingSession) {
    return <SessionLoadingScreen />;
  }

  if (isAuthenticated && !isPrivacyRoute) {
    return <Redirect href={'/(app)/(tabs)/habits' as Href} />;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen
        name="privacy"
        options={{
          headerBackTitle: 'Atrás',
          headerShadowVisible: false,
          title: 'Aviso de privacidad',
        }}
      />
    </Stack>
  );
}
