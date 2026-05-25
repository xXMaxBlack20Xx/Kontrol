import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { Card } from '@/components/ui/card';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SettingsRow } from '@/components/ui/settings-row';
import { gradients, radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import { getMeWithApi, type ApiUser } from '@/features/account/auth-service';
import { getConfiguredApiBaseUrl } from '@/features/api/api';
import { listDevices, registerDevice } from '@/features/api/device-service';
import { checkBackendHealth } from '@/features/api/health-service';
import { remoteCompletionRepository } from '@/features/habits/remote-completion-repository';
import { remoteHabitRepository } from '@/features/habits/remote-habit-repository';
import { calculateProgressDashboard, type ProgressDashboard } from '@/features/habits/progress-helpers';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import {
  getLocalNotificationPermissionStatus,
  getNativeDevicePushToken,
  requestLocalNotificationPermissionStatus,
} from '@/features/reminders/expo-notification-scheduler';

type NotificationStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

type BackendStatus = {
  state: 'idle' | 'checking' | 'connected' | 'error';
  checkedAt?: string;
  detail?: string;
};

function formatDateTime(value?: string): string {
  if (!value) {
    return 'No disponible';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No disponible';
  }

  return date.toLocaleString();
}

function getNotificationStatusLabel(status: NotificationStatus): string {
  const labels: Record<NotificationStatus, string> = {
    granted: 'Concedido',
    denied: 'Denegado',
    undetermined: 'No solicitado',
    unavailable: 'No disponible en este entorno',
  };

  return labels[status];
}

function getApiEnvironmentLabel(): string {
  try {
    return getConfiguredApiBaseUrl();
  } catch {
    return 'No configurado';
  }
}

function canRegisterNativeDevice(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export default function SettingsScreen() {
  const router = useRouter();
  const { clearSession, logout, user } = useAuth();
  const { colors, isDark, setTheme, theme } = useTheme();
  const styles = getStyles(colors, isDark);
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [progress, setProgress] = useState<ProgressDashboard | null>(null);
  const [reminderCount, setReminderCount] = useState(0);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>('undetermined');
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isClearingLocalSession, setIsClearingLocalSession] = useState(false);
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
  const [isRegisteringDevice, setIsRegisteringDevice] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({ state: 'idle' });

  const loadSettingsData = useCallback(async (options: { quiet?: boolean } = {}) => {
    if (!user) {
      setIsLoadingOverview(false);
      return;
    }

    if (options.quiet) {
      setIsRefreshing(true);
    } else {
      setIsLoadingOverview(true);
    }

    try {
      const [nextProfile, habits, completions, reminders, devices, permission] = await Promise.all([
        getMeWithApi().catch(() => null),
        remoteHabitRepository.listByAccount(user.accountId).catch(() => []),
        remoteCompletionRepository.listByAccount(user.accountId).catch(() => []),
        fileReminderRepository.listByAccount(user.accountId).catch(() => []),
        listDevices().then((response) => response.devices).catch(() => null),
        getLocalNotificationPermissionStatus().catch(() => 'unavailable' as NotificationStatus),
      ]);

      setProfile(nextProfile);
      setProgress(calculateProgressDashboard(habits, completions));
      setReminderCount(reminders.length);
      setDeviceCount(devices?.length ?? null);
      setNotificationStatus(permission);
    } catch {
      setMessage({ text: 'No se pudo actualizar Configuración. Intenta nuevamente.', type: 'error' });
    } finally {
      setIsLoadingOverview(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadSettingsData();
    }, [loadSettingsData]),
  );

  function confirmLogout() {
    Alert.alert('Cerrar sesión', '¿Quieres cerrar tu sesión en este dispositivo?', [
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
      setMessage({ text: 'La sesión remota no respondió. Revisa si la sesión local quedó cerrada.', type: 'info' });
    } finally {
      setIsLoggingOut(false);
    }
  }

  function confirmClearLocalSession() {
    Alert.alert('Borrar sesión local', 'Esto elimina los tokens guardados en este dispositivo sin llamar al backend.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: handleClearLocalSession,
        style: 'destructive',
        text: 'Borrar sesión local',
      },
    ]);
  }

  async function handleClearLocalSession() {
    setIsClearingLocalSession(true);
    setMessage(null);

    try {
      await clearSession();
      router.replace('/(auth)/login' as Href);
    } catch {
      setMessage({ text: 'No se pudo borrar la sesión local. Intenta nuevamente.', type: 'error' });
    } finally {
      setIsClearingLocalSession(false);
    }
  }

  async function handleRefresh() {
    setMessage(null);
    await loadSettingsData({ quiet: true });
    setMessage({ text: 'Datos de configuración actualizados.', type: 'success' });
  }

  async function handleCheckHealth() {
    setBackendStatus({ state: 'checking' });

    try {
      await checkBackendHealth();
      setBackendStatus({ state: 'connected', checkedAt: new Date().toISOString(), detail: 'Backend conectado' });
    } catch {
      setBackendStatus({
        state: 'error',
        checkedAt: new Date().toISOString(),
        detail: 'No se pudo comprobar el backend. La app puede seguir operando con pantallas protegidas si la sesión es válida.',
      });
    }
  }

  async function handleRequestNotifications() {
    setIsRequestingNotifications(true);
    setMessage(null);

    try {
      const nextStatus = await requestLocalNotificationPermissionStatus();
      setNotificationStatus(nextStatus);
      setMessage({
        text: nextStatus === 'granted'
          ? 'Permisos de notificación concedidos.'
          : nextStatus === 'unavailable'
            ? 'Las notificaciones no están disponibles en este entorno. Usa una development build o build nativa si aplica.'
            : 'El permiso de notificación fue denegado.',
        type: nextStatus === 'granted' ? 'success' : 'info',
      });
    } catch {
      setMessage({ text: 'No se pudieron revisar los permisos de notificación.', type: 'error' });
    } finally {
      setIsRequestingNotifications(false);
    }
  }

  async function handleRegisterDevice() {
    if (!canRegisterNativeDevice()) {
      setMessage({ text: 'El registro de dispositivo requiere iOS o Android.', type: 'info' });
      return;
    }

    setIsRegisteringDevice(true);
    setMessage(null);

    try {
      let currentStatus = notificationStatus;

      if (currentStatus !== 'granted') {
        currentStatus = await requestLocalNotificationPermissionStatus();
        setNotificationStatus(currentStatus);
      }

      if (currentStatus !== 'granted') {
        setMessage({ text: 'Activa permisos de notificación antes de registrar el dispositivo.', type: 'info' });
        return;
      }

      const nativePushToken = await getNativeDevicePushToken();

      if (!nativePushToken) {
        setMessage({
          text: 'No se pudo obtener token nativo. Para Notification Hubs valida en development build o build nativa, no como flujo simulado.',
          type: 'info',
        });
        return;
      }

      const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;

      if (!platform) {
        setMessage({ text: 'El registro de dispositivo requiere iOS o Android.', type: 'info' });
        return;
      }

      const result = await registerDevice({
        appVersion: Constants.expoConfig?.version,
        nativePushToken,
        platform,
      });
      setDeviceCount((currentCount) => currentCount === null ? 1 : Math.max(currentCount, 1));
      setMessage({
        text: result.warning ?? 'Dispositivo registrado para notificaciones remotas.',
        type: result.warning ? 'info' : 'success',
      });
    } catch {
      setMessage({ text: 'No se pudo registrar el dispositivo. Revisa sesión, conectividad y configuración nativa.', type: 'error' });
    } finally {
      setIsRegisteringDevice(false);
    }
  }

  if (!user) {
    return <SessionLoadingScreen />;
  }

  const activeGradient = isDark ? gradients.blueScreenDark : gradients.blueScreenLight;
  const visibleUser = profile ?? user;
  const displayName = visibleUser.displayName?.trim() || 'Usuario de Kontrol';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const isDevelopment = __DEV__;

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
          description="Cuenta, hábitos, recordatorios, seguridad y estado técnico de Kontrol."
          descriptionColor={colors.textSecondary}
          textColor={colors.textPrimary}
          title="Configuración"
        />

        {message ? <FeedbackMessage message={message.text} type={message.type} /> : null}

        <Card style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{visibleUser.email}</Text>
            <View style={styles.statusPill}>
              <MaterialIcons color={colors.successText} name="verified-user" size={16} />
              <Text style={styles.statusPillText}>Sesión activa</Text>
            </View>
          </View>
        </Card>

        <SettingsSection title="Cuenta">
          <SettingsRow
            detail={visibleUser.email}
            icon="alternate-email"
            title="Correo"
          />
          <SettingsRow
            detail={formatDateTime(user.createdAt)}
            icon="lock-clock"
            title="Sesión creada"
          />
          <SettingsRow
            accessibilityLabel="Actualizar perfil"
            detail={isLoadingOverview || isRefreshing ? 'Actualizando...' : 'Consulta GET /me y datos relacionados.'}
            icon="refresh"
            onPress={handleRefresh}
            title="Refrescar datos"
          />
          {isDevelopment ? (
            <SettingsRow
              detail={visibleUser.userId}
              icon="badge"
              title="User ID técnico"
            />
          ) : null}
        </SettingsSection>

        <Card style={styles.summaryCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Hábitos</Text>
              <Text style={styles.sectionCaption}>Resumen rápido de tu actividad.</Text>
            </View>
            {isLoadingOverview ? <ActivityIndicator color={colors.textSecondary} /> : null}
          </View>
          <View style={styles.summaryGrid}>
            <SummaryMetric label="Activos" value={`${progress?.activeHabits ?? 0}`} />
            <SummaryMetric label="Hoy" value={`${progress?.todayCompleted ?? 0}/${progress?.todayExpected ?? 0}`} />
            <SummaryMetric label="Racha" value={`${progress?.currentStreak ?? 0}d`} />
          </View>
          <View style={styles.rowList}>
            <SettingsRow
              accessibilityLabel="Ir a hábitos"
              detail="Ver y completar hábitos activos."
              icon="checklist"
              onPress={() => router.push('/(app)/(tabs)/habits' as Href)}
              title="Mis hábitos"
            />
            <SettingsRow
              accessibilityLabel="Crear hábito"
              detail="Agregar un nuevo hábito personalizado."
              icon="add-circle-outline"
              onPress={() => router.push('/(app)/habits/create' as Href)}
              title="Crear hábito"
            />
            <SettingsRow
              accessibilityLabel="Ir a progreso"
              detail="Consultar rachas y progreso real."
              icon="insights"
              onPress={() => router.push('/(app)/(tabs)/progress' as Href)}
              title="Progreso y rachas"
            />
          </View>
        </Card>

        <SettingsSection title="Recordatorios y notificaciones">
          <SettingsRow
            accessibilityLabel="Ver recordatorios"
            detail={`${reminderCount} recordatorio(s) local(es) guardado(s).`}
            icon="notifications-none"
            onPress={() => router.push('/(app)/(tabs)/reminders' as Href)}
            title="Recordatorios"
          />
          <SettingsRow
            accessibilityLabel="Solicitar permisos de notificación"
            detail={isRequestingNotifications ? 'Revisando permisos...' : getNotificationStatusLabel(notificationStatus)}
            icon="notification-important"
            onPress={handleRequestNotifications}
            title="Permisos locales"
          />
          <SettingsRow
            accessibilityLabel="Ver dispositivos registrados"
            detail={deviceCount === null ? 'Requiere sesión y backend disponible.' : `${deviceCount} dispositivo(s) registrado(s).`}
            icon="devices"
            onPress={() => router.push('/(app)/devices' as Href)}
            title="Dispositivos"
          />
          <SettingsRow
            accessibilityLabel="Registrar este dispositivo"
            detail={isRegisteringDevice ? 'Registrando...' : 'Usa token nativo si el entorno lo permite.'}
            icon="phonelink-ring"
            onPress={handleRegisterDevice}
            title="Registrar este dispositivo"
          />
        </SettingsSection>

        <SettingsSection title="Apariencia">
          <View style={styles.themePicker}>
            <ThemeOption
              label="Claro"
              onPress={() => setTheme('light')}
              selected={theme === 'light'}
            />
            <ThemeOption
              label="Oscuro"
              onPress={() => setTheme('dark')}
              selected={theme === 'dark'}
            />
          </View>
          <Text style={styles.helperText}>El tema global actual soporta claro y oscuro. La preferencia “sistema” no existe como modo persistente separado.</Text>
        </SettingsSection>

        <SettingsSection title="Datos y sincronización">
          <SettingsRow
            accessibilityLabel="Refrescar hábitos y progreso"
            detail={isRefreshing ? 'Actualizando...' : 'Recarga perfil, hábitos, cumplimientos y dispositivos.'}
            icon="sync"
            onPress={handleRefresh}
            title="Refrescar datos"
          />
          <SettingsRow
            detail="La app consume endpoints protegidos para hábitos, completions y progress. No hay cliente manual conectado a POST /sync/habits en esta pantalla."
            icon="cloud-done"
            title="Sincronización cloud"
          />
        </SettingsSection>

        <SettingsSection title="Multimedia e imágenes">
          <SettingsRow
            detail="Las imágenes de hábitos usan URLs temporales y metadata vía Azure Functions. No se muestran llaves ni URLs sensibles."
            icon="photo-library"
            title="Fotos privadas"
          />
        </SettingsSection>

        {isDevelopment ? (
          <Card style={styles.backendCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Estado del backend</Text>
                <Text style={styles.sectionCaption}>{getApiEnvironmentLabel()}</Text>
              </View>
              <BackendBadge status={backendStatus} />
            </View>
            <Text style={styles.backendText}>
              {backendStatus.detail ?? 'Health check disponible para validar GET /health sin bloquear la app.'}
            </Text>
            {backendStatus.checkedAt ? <Text style={styles.helperText}>Última revisión: {formatDateTime(backendStatus.checkedAt)}</Text> : null}
            <SettingsRow
              accessibilityLabel="Probar conexión del backend"
              detail={backendStatus.state === 'checking' ? 'Probando conexión...' : 'Ejecuta GET /health.'}
              icon="monitor-heart"
              onPress={handleCheckHealth}
              title="Probar conexión"
            />
          </Card>
        ) : null}

        <SettingsSection title="Seguridad">
          <SettingsRow
            accessibilityLabel="Cerrar sesión"
            detail={isLoggingOut ? 'Cerrando sesión...' : 'Revoca el refresh token cuando el backend responde y limpia SecureStore.'}
            icon="logout"
            onPress={confirmLogout}
            title="Cerrar sesión"
            tone="danger"
          />
          <SettingsRow
            accessibilityLabel="Borrar sesión local"
            detail={isClearingLocalSession ? 'Borrando sesión...' : 'Acción de recuperación local sin borrar cuenta del backend.'}
            icon="delete-outline"
            onPress={confirmClearLocalSession}
            title="Borrar sesión local"
            tone="danger"
          />
        </SettingsSection>

        <SettingsSection title="Acerca de">
          <SettingsRow
            detail={`Versión ${appVersion}`}
            icon="info-outline"
            title="Kontrol"
          />
          <SettingsRow
            accessibilityLabel="Ver aviso de privacidad"
            detail="Consulta el aviso local del MVP."
            icon="description"
            onPress={() => router.push('/(auth)/privacy' as Href)}
            title="Aviso de privacidad"
          />
          {isDevelopment ? (
            <SettingsRow
              detail="Azure Functions dev, visible solo en desarrollo."
              icon="dns"
              title="Entorno técnico"
            />
          ) : null}
        </SettingsSection>
      </ScreenContainer>
    </LinearGradient>
  );

  function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
    return (
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.rowList}>{children}</View>
      </Card>
    );
  }

  function SummaryMetric({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.summaryMetric}>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    );
  }

  function ThemeOption({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
    return (
      <Pressable
        accessibilityLabel={`Tema ${label}`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [styles.themeOption, selected && styles.themeOptionSelected, pressed && styles.pressed]}
      >
        <Text style={[styles.themeOptionText, selected && styles.themeOptionTextSelected]}>{label}</Text>
      </Pressable>
    );
  }

  function BackendBadge({ status }: { status: BackendStatus }) {
    const badgeStyles = {
      idle: styles.backendBadgeIdle,
      checking: styles.backendBadgeIdle,
      connected: styles.backendBadgeConnected,
      error: styles.backendBadgeError,
    };
    const label = {
      idle: 'Sin revisar',
      checking: 'Revisando',
      connected: 'Conectado',
      error: 'Error',
    }[status.state];

    return (
      <View style={[styles.backendBadge, badgeStyles[status.state]]}>
        <Text style={styles.backendBadgeText}>{label}</Text>
      </View>
    );
  }
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
  profileInitial: {
    color: colors.primaryText,
    fontFamily: typography.fontFamily,
    fontSize: 28,
    fontWeight: typography.weights.heavy,
  },
  profileTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.6,
  },
  profileEmail: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    lineHeight: 20,
  },
  statusPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.successBackground,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.md,
  },
  statusPillText: {
    color: colors.successText,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  sectionCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.5,
  },
  sectionCaption: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 19,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  rowList: {
    gap: spacing.sm,
  },
  summaryCard: {
    gap: spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryMetric: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    flex: 1,
    gap: 2,
    minHeight: 78,
    padding: spacing.md,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 24,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.7,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  themePicker: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  themeOption: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  themeOptionSelected: {
    backgroundColor: colors.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0 : 0.08,
    shadowRadius: 10,
  },
  themeOptionText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
  themeOptionTextSelected: {
    color: colors.textPrimary,
  },
  helperText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 19,
  },
  backendCard: {
    gap: spacing.md,
  },
  backendText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  backendBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backendBadgeIdle: {
    backgroundColor: colors.surfaceMuted,
  },
  backendBadgeConnected: {
    backgroundColor: colors.successBackground,
  },
  backendBadgeError: {
    backgroundColor: colors.dangerBackground,
  },
  backendBadgeText: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  pressed: {
    opacity: 0.72,
  },
});
