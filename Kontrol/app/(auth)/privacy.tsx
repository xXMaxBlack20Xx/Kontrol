import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen-container';
import { radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';

const sections = [
  {
    icon: 'lock-outline' as const,
    title: 'Datos locales y cloud',
    body:
      'Kontrol conserva sesión segura en el dispositivo y consume Azure Functions para cuenta, hábitos, cumplimientos, recordatorios, fotos y dispositivos cuando hay sesión activa.',
  },
  {
    icon: 'password' as const,
    title: 'Contraseña protegida',
    body:
      'La contraseña se envía al backend de Kontrol por HTTPS y se almacena como hash con argon2. La app no guarda contraseñas en texto plano.',
  },
  {
    icon: 'notifications-none' as const,
    title: 'Recordatorios',
    body:
      'Los recordatorios usan notificaciones locales con permisos del sistema. El registro de dispositivos para push remoto se realiza mediante Azure Functions si el entorno nativo lo permite.',
  },
  {
    icon: 'logout' as const,
    title: 'Control de sesión',
    body:
      'La sesión se conserva al cerrar y reabrir la app. Al cerrar sesión, Kontrol invalida la sesión local antes de mostrar pantallas privadas.',
  },
];

const blueScreenGradientLight = {
  colors: ['#C8E0FE', '#E2EDFC', '#F4F8FF', '#F4F8FF'],
  locations: [0, 0.18, 0.4, 1],
} as const;

const blueScreenGradientDark = {
  colors: ['#0B1E36', '#0D1520', '#08090C', '#08090C'],
  locations: [0, 0.2, 0.44, 1],
} as const;

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const activeGradient = isDark ? blueScreenGradientDark : blueScreenGradientLight;

  return (
    <LinearGradient
      colors={[...activeGradient.colors]}
      locations={[...activeGradient.locations]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientRoot}
    >
      <ScreenContainer style={{ backgroundColor: 'transparent' }} contentStyle={styles.content} edges={['bottom']}>
        <AppHeader
          description="Kontrol usa un backend propio en Azure Functions para autenticación y datos protegidos, sin funciones sociales ni acceso directo a llaves privadas de Azure."
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

        <PrimaryButton
          onPress={() => router.back()}
          title="Entendido"
          style={{
            backgroundColor: isDark ? '#0A84FF' : '#007AFF',
            marginTop: spacing.sm,
          }}
          textColor="#FFFFFF"
        />
      </ScreenContainer>
    </LinearGradient>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  content: {
    gap: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  sectionList: {
    gap: 12,
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
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
