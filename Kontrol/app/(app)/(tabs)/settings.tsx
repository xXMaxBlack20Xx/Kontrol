import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SettingsRow } from '@/components/ui/settings-row';
import { gradients, radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import { getMeWithApi, type ApiUser } from '@/features/account/auth-service';
import { removeProfilePhoto, uploadProfilePhoto, type SelectedProfilePhoto } from '@/features/account/profile-service';
import { getConfiguredApiBaseUrl } from '@/features/api/api';
import { listDevices, registerDevice } from '@/features/api/device-service';
import { checkBackendHealth } from '@/features/api/health-service';
import { getPhoto } from '@/features/api/photo-service';
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
type ProfilePhotoState = 'idle' | 'picking' | 'uploading' | 'saving' | 'success' | 'error';

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

const maxProfilePhotoSizeBytes = 10_000_000;

function getProfilePhotoType(asset: ImagePicker.ImagePickerAsset): Pick<SelectedProfilePhoto, 'contentType' | 'fileExtension'> | null {
  const mimeType = asset.mimeType?.toLowerCase();
  const uri = asset.uri.toLowerCase();

  if (mimeType === 'image/jpeg' || uri.endsWith('.jpg') || uri.endsWith('.jpeg')) {
    return { contentType: 'image/jpeg', fileExtension: uri.endsWith('.jpeg') ? 'jpeg' : 'jpg' };
  }

  if (mimeType === 'image/png' || uri.endsWith('.png')) {
    return { contentType: 'image/png', fileExtension: 'png' };
  }

  if (mimeType === 'image/webp' || uri.endsWith('.webp')) {
    return { contentType: 'image/webp', fileExtension: 'webp' };
  }

  return null;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { clearSession, logout, refreshUser, user } = useAuth();
  const { colors, isDark, setTheme } = useTheme();
  const styles = getStyles(colors, isDark);
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [profilePhotoReadUrl, setProfilePhotoReadUrl] = useState<string | null>(null);
  const [profilePhotoPreviewUri, setProfilePhotoPreviewUri] = useState<string | null>(null);
  const [profilePhotoState, setProfilePhotoState] = useState<ProfilePhotoState>('idle');
  const [lastFailedPhotoId, setLastFailedPhotoId] = useState<string | null>(null);
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
  const activeProfilePhotoId = profile?.profilePhotoId ?? user?.profilePhotoId ?? null;
  const isProfilePhotoBusy = profilePhotoState === 'picking' || profilePhotoState === 'uploading' || profilePhotoState === 'saving';

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

  const loadProfilePhotoUrl = useCallback(async (photoId: string | null) => {
    if (!photoId) {
      setProfilePhotoReadUrl(null);
      return;
    }

    try {
      const result = await getPhoto(photoId);
      setProfilePhotoReadUrl(result.readUrl);
    } catch {
      setProfilePhotoReadUrl(null);
    }
  }, []);

  useEffect(() => {
    setLastFailedPhotoId(null);
    void loadProfilePhotoUrl(activeProfilePhotoId);
  }, [activeProfilePhotoId, loadProfilePhotoUrl]);

  async function handleChangeProfilePhoto() {
    if (isProfilePhotoBusy) {
      return;
    }

    setMessage(null);
    setProfilePhotoState('picking');

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setProfilePhotoState('idle');
        setMessage({ text: 'Permite acceso a tus fotos para seleccionar una imagen.', type: 'info' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: 'images',
        quality: 0.86,
      });

      if (result.canceled) {
        setProfilePhotoState('idle');
        return;
      }

      const asset = result.assets[0];
      const imageType = getProfilePhotoType(asset);

      if (!imageType) {
        setProfilePhotoState('error');
        setMessage({ text: 'Selecciona una imagen JPG, PNG o WebP.', type: 'error' });
        return;
      }

      if (asset.fileSize && asset.fileSize > maxProfilePhotoSizeBytes) {
        setProfilePhotoState('error');
        setMessage({ text: 'La imagen no puede superar 10 MB.', type: 'error' });
        return;
      }

      setProfilePhotoPreviewUri(asset.uri);

      const updatedUser = await uploadProfilePhoto(
        {
          contentType: imageType.contentType,
          fileExtension: imageType.fileExtension,
          sizeBytes: asset.fileSize,
          uri: asset.uri,
        },
        (phase) => setProfilePhotoState(phase),
      );
      const refreshedUser = await refreshUser().catch(() => null);
      const nextProfile = refreshedUser ?? updatedUser;

      setProfile(nextProfile);
      setProfilePhotoPreviewUri(null);
      setProfilePhotoState('success');
      setMessage({ text: 'Foto actualizada.', type: 'success' });
      void loadProfilePhotoUrl(nextProfile.profilePhotoId);
    } catch {
      setProfilePhotoState('error');
      setProfilePhotoPreviewUri(null);
      setMessage({ text: 'No se pudo subir la foto. Inténtalo de nuevo.', type: 'error' });
    }
  }

  function confirmRemoveProfilePhoto() {
    if (!activeProfilePhotoId || isProfilePhotoBusy) {
      return;
    }

    Alert.alert('Quitar foto', 'Tu perfil volverá a mostrar el avatar con inicial. El archivo no se borra físicamente del almacenamiento.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: handleRemoveProfilePhoto,
        style: 'destructive',
        text: 'Quitar foto',
      },
    ]);
  }

  async function handleRemoveProfilePhoto() {
    setProfilePhotoState('saving');
    setMessage(null);

    try {
      const updatedUser = await removeProfilePhoto();
      const refreshedUser = await refreshUser().catch(() => null);
      const nextProfile = refreshedUser ?? updatedUser;

      setProfile(nextProfile);
      setProfilePhotoPreviewUri(null);
      setProfilePhotoReadUrl(null);
      setProfilePhotoState('success');
      setMessage({ text: 'Foto de perfil quitada.', type: 'success' });
    } catch {
      setProfilePhotoState('error');
      setMessage({ text: 'No se pudo guardar la foto de perfil.', type: 'error' });
    }
  }

  function handleProfilePhotoError() {
    setProfilePhotoReadUrl(null);

    if (activeProfilePhotoId && lastFailedPhotoId !== activeProfilePhotoId) {
      setLastFailedPhotoId(activeProfilePhotoId);
      void loadProfilePhotoUrl(activeProfilePhotoId);
    }
  }

  const showInfoAlert = () => {
    Alert.alert(
      'Acerca de Configuración',
      'Cuenta, hábitos, recordatorios, seguridad y estado técnico de Kontrol.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

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
  const profileInitial = (visibleUser.displayName?.trim() || visibleUser.email).slice(0, 1).toUpperCase();
  const profilePhotoUri = profilePhotoPreviewUri ?? profilePhotoReadUrl;
  const profilePhotoStatusLabel = profilePhotoState === 'picking'
    ? 'Abriendo galería...'
    : profilePhotoState === 'uploading'
      ? 'Subiendo foto...'
      : profilePhotoState === 'saving'
        ? 'Guardando perfil...'
        : null;
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
        <View style={styles.heroBlock}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <AppHeader
                textColor={colors.textPrimary}
                title="Configuración"
              />
            </View>
            <Pressable
              onPress={showInfoAlert}
              style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
              hitSlop={12}
            >
              <MaterialIcons name="info-outline" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {message ? <FeedbackMessage message={message.text} type={message.type} /> : null}

        {/* SECTION 1: CUENTA */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>CUENTA</Text>
          <View style={styles.blockContainer}>
            {/* Profile Card Row */}
            <View style={styles.profileCard}>
              <View style={styles.profileAvatarShell}>
                <View style={styles.profileAvatar}>
                  {profilePhotoUri ? (
                    <Image
                      accessibilityIgnoresInvertColors
                      onError={handleProfilePhotoError}
                      source={{ uri: profilePhotoUri }}
                      style={styles.profileAvatarImage}
                    />
                  ) : (
                    <Text style={styles.profileInitial}>{profileInitial}</Text>
                  )}
                  {isProfilePhotoBusy ? (
                    <View style={styles.profileAvatarOverlay}>
                      <ActivityIndicator color={colors.primaryText} />
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={styles.profileTextBlock}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{visibleUser.email}</Text>
                <View style={styles.statusPill}>
                  <MaterialIcons color={colors.successText} name="verified-user" size={16} />
                  <Text style={styles.statusPillText}>Sesión activa</Text>
                </View>
                <View style={styles.profileActionsRow}>
                  <Pressable
                    accessibilityLabel="Cambiar foto de perfil"
                    disabled={isProfilePhotoBusy}
                    onPress={handleChangeProfilePhoto}
                    style={({ pressed }) => [styles.profilePhotoButton, pressed && styles.pressed, isProfilePhotoBusy && styles.disabledButton]}
                  >
                    <MaterialIcons color={colors.primaryText} name="photo-camera" size={16} />
                    <Text style={styles.profilePhotoButtonText}>Cambiar foto</Text>
                  </Pressable>
                  {activeProfilePhotoId ? (
                    <Pressable
                      accessibilityLabel="Quitar foto de perfil"
                      disabled={isProfilePhotoBusy}
                      onPress={confirmRemoveProfilePhoto}
                      style={({ pressed }) => [styles.removePhotoButton, pressed && styles.pressed, isProfilePhotoBusy && styles.disabledButton]}
                    >
                      <Text style={styles.removePhotoButtonText}>Quitar foto</Text>
                    </Pressable>
                  ) : null}
                </View>
                {profilePhotoStatusLabel ? <Text style={styles.profilePhotoStatus}>{profilePhotoStatusLabel}</Text> : null}
              </View>
            </View>

            <View style={styles.separator} />

            <SettingsRow
              detail={visibleUser.email}
              icon="alternate-email"
              title="Correo"
            />

            <View style={styles.separator} />

            <SettingsRow
              detail={formatDateTime(user.createdAt)}
              icon="lock-clock"
              title="Sesión creada"
            />

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Actualizar perfil"
              detail={isLoadingOverview || isRefreshing ? 'Actualizando...' : 'Consulta GET /me y datos relacionados.'}
              icon="refresh"
              onPress={handleRefresh}
              title="Refrescar datos"
              showChevron={false}
            />

            {isDevelopment ? (
              <>
                <View style={styles.separator} />
                <SettingsRow
                  detail={visibleUser.userId}
                  icon="badge"
                  title="User ID técnico"
                />
              </>
            ) : null}

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Cerrar sesión"
              detail={isLoggingOut ? 'Cerrando sesión...' : 'Revoca el refresh token cuando el backend responde y limpia SecureStore.'}
              icon="logout"
              onPress={confirmLogout}
              title="Cerrar sesión"
              tone="danger"
              showChevron={false}
            />

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Borrar sesión local"
              detail={isClearingLocalSession ? 'Borrando sesión...' : 'Acción de recuperación local sin borrar cuenta del backend.'}
              icon="delete-outline"
              onPress={confirmClearLocalSession}
              title="Borrar sesión local"
              tone="danger"
              showChevron={false}
            />
          </View>
        </View>

        {/* SECTION 2: PREFERENCIAS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>PREFERENCIAS</Text>
          <View style={styles.blockContainer}>
            {/* Summary metrics header */}
            <View style={{ padding: 16, gap: 16 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.summaryTitleCaption}>Resumen rápido de tu actividad.</Text>
                {isLoadingOverview ? <ActivityIndicator color={colors.textSecondary} /> : null}
              </View>
              <View style={styles.summaryGrid}>
                <SummaryMetric label="Activos" value={`${progress?.activeHabits ?? 0}`} />
                <SummaryMetric label="Hoy" value={`${progress?.todayCompleted ?? 0}/${progress?.todayExpected ?? 0}`} />
                <SummaryMetric label="Racha" value={`${progress?.currentStreak ?? 0}d`} />
              </View>
            </View>

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Ir a hábitos"
              detail="Ver y completar hábitos activos."
              icon="checklist"
              onPress={() => router.push('/(app)/(tabs)/habits' as Href)}
              title="Mis hábitos"
            />

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Crear hábito"
              detail="Agregar un nuevo hábito personalizado."
              icon="add-circle-outline"
              onPress={() => router.push('/(app)/habits/create' as Href)}
              title="Crear hábito"
            />

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Ir a progreso"
              detail="Consultar rachas y progreso real."
              icon="insights"
              onPress={() => router.push('/(app)/(tabs)/progress' as Href)}
              title="Progreso y rachas"
            />

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Ver recordatorios"
              detail={`${reminderCount} recordatorio(s) local(es) guardado(s).`}
              icon="notifications-none"
              onPress={() => router.push('/(app)/(tabs)/reminders' as Href)}
              title="Recordatorios"
            />

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Solicitar permisos de notificación"
              detail={isRequestingNotifications ? 'Revisando permisos...' : getNotificationStatusLabel(notificationStatus)}
              icon="notification-important"
              onPress={handleRequestNotifications}
              title="Permisos locales"
              showChevron={false}
            />

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Ver dispositivos registrados"
              detail={deviceCount === null ? 'Requiere sesión y backend disponible.' : `${deviceCount} dispositivo(s) registrado(s).`}
              icon="devices"
              onPress={() => router.push('/(app)/devices' as Href)}
              title="Dispositivos"
            />

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Registrar este dispositivo"
              detail={isRegisteringDevice ? 'Registrando...' : 'Usa token nativo si el entorno lo permite.'}
              icon="phonelink-ring"
              onPress={handleRegisterDevice}
              title="Registrar este dispositivo"
              showChevron={false}
            />

            <View style={styles.separator} />

            {/* Dark Mode Switch Row */}
            <View style={styles.switchRow}>
              <View style={[styles.switchIconFrame, { backgroundColor: colors.surface }]}>
                <MaterialIcons color={colors.textPrimary} name="dark-mode" size={22} />
              </View>
              <View style={styles.switchTextBlock}>
                <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>Tema oscuro</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor={Platform.OS === 'android' ? (isDark ? colors.primary : colors.surface) : undefined}
                ios_backgroundColor={colors.borderStrong}
              />
            </View>

            <View style={styles.separator} />

            <SettingsRow
              detail="Las fotos de perfil y hábitos usan URLs temporales y metadata vía Azure Functions. No se muestran llaves ni URLs sensibles."
              icon="photo-library"
              title="Fotos privadas"
            />
          </View>
        </View>

        {/* SECTION 3: SISTEMA */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>SISTEMA</Text>
          <View style={styles.blockContainer}>
            <SettingsRow
              detail="La app consume endpoints protegidos para hábitos, completions y progress. No hay cliente manual conectado a POST /sync/habits en esta pantalla."
              icon="cloud-done"
              title="Sincronización cloud"
            />

            {isDevelopment ? (
              <>
                <View style={styles.separator} />
                {/* Backend environment URL row with badge */}
                <View style={{ padding: 16, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <Text
                        style={[styles.sectionCaption, { flexShrink: 1 }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {getApiEnvironmentLabel()}
                      </Text>
                    </View>
                    <BackendBadge status={backendStatus} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.backendText, { flexShrink: 1 }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {backendStatus.detail ?? 'Health check disponible para validar GET /health sin bloquear la app.'}
                      </Text>
                    </View>
                  </View>
                  {backendStatus.checkedAt ? (
                    <Text style={styles.helperText}>Última revisión: {formatDateTime(backendStatus.checkedAt)}</Text>
                  ) : null}
                </View>
                <View style={styles.separator} />
                <SettingsRow
                  accessibilityLabel="Probar conexión del backend"
                  detail={backendStatus.state === 'checking' ? 'Probando conexión...' : 'Ejecuta GET /health.'}
                  icon="monitor-heart"
                  onPress={handleCheckHealth}
                  title="Probar conexión"
                  showChevron={false}
                />
              </>
            ) : null}

            <View style={styles.separator} />

            <SettingsRow
              accessibilityLabel="Ver aviso de privacidad"
              detail="Consulta el aviso local del MVP."
              icon="description"
              onPress={() => router.push('/(auth)/privacy' as Href)}
              title="Aviso de privacidad"
            />

            <View style={styles.separator} />

            <SettingsRow
              detail={`Versión ${appVersion}`}
              icon="info-outline"
              title="Kontrol"
            />

            {isDevelopment ? (
              <>
                <View style={styles.separator} />
                <SettingsRow
                  detail="Azure Functions dev, visible solo en desarrollo."
                  icon="dns"
                  title="Entorno técnico"
                />
              </>
            ) : null}
          </View>
        </View>
      </ScreenContainer>
    </LinearGradient>
  );

  function SummaryMetric({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.summaryMetric}>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
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
    padding: 16,
  },
  profileAvatarShell: {
    borderRadius: 38,
    padding: 3,
    backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,122,255,0.14)',
  },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: isDark ? '#17385F' : '#D9EBFF',
    borderRadius: 35,
    height: 70,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 70,
  },
  profileAvatarImage: {
    height: '100%',
    width: '100%',
  },
  profileAvatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.36)',
    justifyContent: 'center',
  },
  profileInitial: {
    color: colors.primary,
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
  profileActionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  profilePhotoButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  profilePhotoButtonText: {
    color: colors.primaryText,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  removePhotoButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerBackground,
    borderRadius: radius.pill,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  removePhotoButtonText: {
    color: colors.dangerText,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  profilePhotoStatus: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  disabledButton: {
    opacity: 0.62,
  },
  blockContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  sectionContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    marginLeft: 8,
  },
  sectionFooter: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    marginTop: spacing.xs,
    marginHorizontal: spacing.lg,
    lineHeight: 18,
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
  summaryTitleCaption: {
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
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
  heroBlock: {
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  infoButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  switchIconFrame: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  switchTextBlock: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.4,
  },
});
