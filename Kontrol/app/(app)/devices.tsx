import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { DestructiveButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { gradients, radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import { deleteDevice, listDevices, sendTestNotification, type DeviceRecord } from '@/features/api/device-service';

function formatDateTime(value?: string): string {
  if (!value) {
    return 'No disponible';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'No disponible' : date.toLocaleString();
}

export default function DevicesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);

  const loadDevices = useCallback(async () => {
    if (!user) {
      setDevices([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await listDevices();
      setDevices(response.devices);
    } catch {
      setDevices([]);
      setMessage({ text: 'No se pudieron cargar los dispositivos registrados.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDevices();
    }, [loadDevices]),
  );

  function confirmDeleteDevice(device: DeviceRecord) {
    Alert.alert('Eliminar dispositivo', 'Este dispositivo dejará de recibir notificaciones remotas desde Kontrol.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: () => handleDeleteDevice(device.id),
        style: 'destructive',
        text: 'Eliminar',
      },
    ]);
  }

  async function handleDeleteDevice(deviceId: string) {
    setDeletingDeviceId(deviceId);
    setMessage(null);

    try {
      await deleteDevice(deviceId);
      setDevices((currentDevices) => currentDevices.filter((device) => device.id !== deviceId));
      setMessage({ text: 'Dispositivo eliminado.', type: 'success' });
    } catch {
      setMessage({ text: 'No se pudo eliminar el dispositivo.', type: 'error' });
    } finally {
      setDeletingDeviceId(null);
    }
  }

  async function handleSendTestNotification() {
    setIsSendingTest(true);
    setMessage(null);

    try {
      const result = await sendTestNotification({
        body: 'Notificación de prueba enviada desde Kontrol.',
        title: 'Kontrol',
      });
      setMessage({
        text: result.warning ?? `Notificación procesada. Enviadas: ${result.sent}. Fallidas: ${result.failed}.`,
        type: result.warning ? 'info' : 'success',
      });
    } catch {
      setMessage({ text: 'No se pudo enviar la notificación de prueba. Valida Notification Hubs en build nativa.', type: 'error' });
    } finally {
      setIsSendingTest(false);
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
      <ScreenContainer contentStyle={styles.content} edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <AppHeader
          backLabel="Configuración"
          description="Dispositivos registrados para notificaciones remotas. No se muestran tokens completos."
          onBack={() => router.back()}
          title="Dispositivos"
        />

        {message ? <FeedbackMessage message={message.text} type={message.type} /> : null}

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.textPrimary} />
            <Text style={styles.loadingText}>Cargando dispositivos...</Text>
          </View>
        ) : null}

        {!isLoading && devices.length === 0 ? (
          <EmptyState
            action={<SecondaryButton compact fullWidth={false} icon="refresh" onPress={loadDevices} title="Reintentar" />}
            description="Registra este dispositivo desde Configuración si el entorno nativo permite obtener un token APNs o FCM."
            icon="devices"
            title="Sin dispositivos"
          />
        ) : null}

        {devices.map((device) => (
          <Card key={device.id} style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceIcon}>
                <MaterialIcons color={colors.primary} name={device.platform === 'ios' ? 'phone-iphone' : 'phone-android'} size={24} />
              </View>
              <View style={styles.deviceTitleBlock}>
                <Text style={styles.deviceTitle}>{device.deviceName ?? (device.platform === 'ios' ? 'iPhone' : 'Android')}</Text>
                <Text style={styles.deviceSubtitle}>{device.platform.toUpperCase()} · {device.pushProvider.toUpperCase()}</Text>
              </View>
              <View style={[styles.enabledPill, !device.enabled && styles.disabledPill]}>
                <Text style={styles.enabledPillText}>{device.enabled ? 'Activo' : 'Inactivo'}</Text>
              </View>
            </View>

            <View style={styles.metaList}>
              <Text style={styles.metaText}>Actualizado: {formatDateTime(device.updatedAt)}</Text>
              <Text style={styles.metaText}>App: {device.appVersion ?? 'No disponible'}</Text>
              <Text style={styles.metaText}>Notification Hub: {device.notificationHubInstallationId ? 'registrado' : 'pendiente'}</Text>
            </View>

            <DestructiveButton
              compact
              fullWidth={false}
              icon="delete-outline"
              loading={deletingDeviceId === device.id}
              onPress={() => confirmDeleteDevice(device)}
              title="Eliminar"
            />
          </Card>
        ))}

        {devices.length > 0 ? (
          <Card style={styles.testCard}>
            <Text style={styles.sectionTitle}>Prueba de notificación</Text>
            <Text style={styles.bodyText}>Envía una prueba solo si Notification Hubs está configurado. El error se maneja sin bloquear Settings.</Text>
            <SecondaryButton
              icon="send"
              loading={isSendingTest}
              onPress={handleSendTestNotification}
              title="Enviar prueba"
            />
          </Card>
        ) : null}
      </ScreenContainer>
    </LinearGradient>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
  deviceCard: {
    gap: spacing.lg,
  },
  deviceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  deviceIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  deviceTitleBlock: {
    flex: 1,
    gap: 2,
  },
  deviceTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 17,
    fontWeight: typography.weights.heavy,
  },
  deviceSubtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  enabledPill: {
    backgroundColor: colors.successBackground,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  disabledPill: {
    backgroundColor: colors.surfaceMuted,
  },
  enabledPillText: {
    color: colors.successText,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  metaList: {
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  testCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.5,
  },
  bodyText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
  },
});
