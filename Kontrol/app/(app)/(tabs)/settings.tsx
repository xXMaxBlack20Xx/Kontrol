import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View, Switch } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { Card } from '@/components/ui/card';
import { FeedbackMessage } from '@/components/ui/form';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SettingsRow } from '@/components/ui/settings-row';
import { gradients, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { colors: themeColors, isDark, toggleTheme } = useTheme();
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

  const activeGradient = isDark ? gradients.blueScreenDark : gradients.blueScreenLight;

  return (
    <LinearGradient
      colors={[...activeGradient.colors]}
      locations={[...activeGradient.locations]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientRoot}
    >
      <ScreenContainer
        contentStyle={styles.content}
        edges={['top']}
        style={{ backgroundColor: 'transparent' }}
      >
      <AppHeader
        description="Administra tu sesión segura y la información básica de la app."
        descriptionColor={themeColors.textSecondary}
        textColor={themeColors.textPrimary}
        title="Configuración"
      />

      <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Cuenta</Text>
        <SettingsRow
          detail={user.email}
          detailColor={themeColors.textSecondary}
          icon="alternate-email"
          iconBgColor={themeColors.surfaceMuted}
          textColor={themeColors.textPrimary}
          title="Correo"
        />
        <SettingsRow
          detail={new Date(user.createdAt).toLocaleString()}
          detailColor={themeColors.textSecondary}
          icon="lock-clock"
          iconBgColor={themeColors.surfaceMuted}
          textColor={themeColors.textPrimary}
          title="Sesión creada"
        />
      </Card>

      <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Personalización</Text>
        <View style={styles.themeToggleRow}>
          <View style={styles.themeToggleTextWrapper}>
            <Text style={[styles.themeToggleTitle, { color: themeColors.textPrimary }]}>Modo oscuro</Text>
            <Text style={[styles.themeToggleDescription, { color: themeColors.textSecondary }]}>
              Cambia la apariencia visual de esta pantalla.
            </Text>
          </View>
          <Switch
            onValueChange={toggleTheme}
            thumbColor={isDark ? '#F4F3F4' : '#F4F3F4'}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            value={isDark}
          />
        </View>
      </Card>

      <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Privacidad</Text>
        <SettingsRow
          detail="Tus tokens se guardan de forma segura y tus hábitos se consultan desde Kontrol."
          detailColor={themeColors.textSecondary}
          icon="lock-outline"
          iconBgColor={themeColors.surfaceMuted}
          textColor={themeColors.textPrimary}
          title="Datos protegidos"
        />
        <SettingsRow
          chevronColor={themeColors.textTertiary}
          detail="Consulta la información de privacidad del MVP."
          detailColor={themeColors.textSecondary}
          icon="description"
          iconBgColor={themeColors.surfaceMuted}
          onPress={() => router.push('/(auth)/privacy' as Href)}
          textColor={themeColors.textPrimary}
          title="Aviso de privacidad"
        />
      </Card>

      {message ? <FeedbackMessage message={message} /> : null}

      <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        {isLoggingOut ? (
          <View style={styles.logoutLoading}>
            <ActivityIndicator color={themeColors.dangerText} />
            <Text style={[styles.logoutLoadingText, { color: themeColors.dangerText }]}>Cerrando sesión...</Text>
          </View>
        ) : (
          <SettingsRow
            detail="Revoca el refresh token y vuelve a la pantalla de acceso."
            detailColor={themeColors.textSecondary}
            icon="logout"
            iconBgColor={themeColors.surfaceMuted}
            onPress={confirmLogout}
            textColor={themeColors.dangerText}
            title="Cerrar sesión"
            tone="danger"
          />
        )}
      </Card>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
  sectionCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.5,
  },
  logoutLoading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
  },
  logoutLoadingText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '700',
  },
  themeToggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
  },
  themeToggleTextWrapper: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.md,
  },
  themeToggleTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.4,
  },
  themeToggleDescription: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
});
