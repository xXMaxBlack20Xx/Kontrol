import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { Card } from '@/components/ui/card';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SettingsRow } from '@/components/ui/settings-row';
import { colors, spacing } from '@/components/ui/theme';
import { useAuth } from '@/features/account/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function confirmLogout() {
    Alert.alert('Cerrar sesión', 'Tendrás que iniciar sesión para volver a ver tus datos privados.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: handleLogout,
        style: 'destructive',
        text: 'Cerrar sesión',
      },
    ]);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setMessage(null);

    try {
      await logout();
      router.replace('/(auth)/login' as Href);
    } catch {
      setMessage('No se pudo cerrar la sesión local. Intenta nuevamente.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!user) {
    return <SessionLoadingScreen />;
  }

  return (
    <ScreenContainer contentStyle={styles.content} edges={['top']}>
      <AppHeader
        description="Administra tu sesión local y la información básica de la app."
        eyebrow="Kontrol"
        title="Configuración"
      />

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Cuenta local</Text>
        <SettingsRow detail={user.email} icon="alternate-email" title="Correo" />
        <SettingsRow
          detail={new Date(user.createdAt).toLocaleString()}
          icon="lock-clock"
          title="Sesión creada"
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Privacidad</Text>
        <SettingsRow
          detail="Tus datos del MVP se conservan localmente en este dispositivo."
          icon="lock-outline"
          title="Datos locales"
        />
        <SettingsRow
          detail="No hay backend ni sincronización en la nube."
          icon="description"
          onPress={() => router.push('/(auth)/privacy' as Href)}
          title="Aviso de privacidad"
        />
      </Card>

      {message ? <FeedbackMessage message={message} /> : null}

      <Card style={styles.sectionCard}>
        {isLoggingOut ? (
          <View style={styles.logoutLoading}>
            <ActivityIndicator color={colors.dangerText} />
            <Text style={styles.logoutLoadingText}>Cerrando sesión...</Text>
          </View>
        ) : (
          <SettingsRow
            detail="Finaliza esta sesión local y vuelve a la pantalla de acceso."
            icon="logout"
            onPress={confirmLogout}
            title="Cerrar sesión"
            tone="danger"
          />
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  sectionCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  logoutLoading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
  },
  logoutLoadingText: {
    color: colors.dangerText,
    fontSize: 15,
    fontWeight: '700',
  },
});
