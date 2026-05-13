import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { BrandMark } from '@/components/ui/brand-mark';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen-container';
import { colors, radius, spacing } from '@/components/ui/theme';

const sections = [
  {
    icon: 'lock-outline' as const,
    title: 'Datos locales',
    body:
      'Tu cuenta, sesión, hábitos, cumplimientos y recordatorios se guardan en el almacenamiento local del dispositivo.',
  },
  {
    icon: 'password' as const,
    title: 'Contraseña protegida',
    body:
      'La contraseña se guarda como hash con sal mediante la abstracción de seguridad local del proyecto, no como texto plano.',
  },
  {
    icon: 'notifications-none' as const,
    title: 'Recordatorios',
    body:
      'Los recordatorios usan notificaciones locales del dispositivo cuando el sistema concede permisos. No se envían datos a un servidor para programarlos.',
  },
  {
    icon: 'logout' as const,
    title: 'Control de sesión',
    body:
      'La sesión se conserva al cerrar y reabrir la app. Al cerrar sesión, Kontrol invalida la sesión local antes de mostrar pantallas privadas.',
  },
];

export default function PrivacyScreen() {
  return (
    <ScreenContainer contentStyle={styles.content} edges={['bottom']}>
      <BrandMark tagline="Privacidad local" />

      <AppHeader
        description="Kontrol funciona localmente en este MVP. No hay backend, sincronización en la nube ni funciones sociales."
        title="Aviso de privacidad"
      />

      <View style={styles.sectionList}>
        {sections.map((section) => (
          <Card key={section.title} style={styles.card}>
            <View style={styles.iconFrame}>
              <MaterialIcons color={colors.textPrimary} name={section.icon} size={22} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
    paddingTop: spacing.xl,
  },
  sectionList: {
    gap: 10,
  },
  card: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cardText: {
    flex: 1,
    gap: 5,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
