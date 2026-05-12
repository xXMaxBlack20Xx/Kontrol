import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const logo = require('@/assets/logo/Kontrol_logo_icon_app_v2.png');

const colors = {
  background: '#F7F7F8',
  card: '#FFFFFF',
  ink: '#111111',
  muted: '#6E6E73',
  border: '#E5E5EA',
  field: '#F4F4F5',
  black: '#000000',
};

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
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Image source={logo} style={styles.logo} />
          <View>
            <Text style={styles.brandName}>Kontrol</Text>
            <Text style={styles.brandTagline}>Privacidad local</Text>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Aviso de privacidad</Text>
          <Text style={styles.description}>
            Kontrol funciona localmente en este MVP. No hay backend, sincronización en la nube ni
            funciones sociales.
          </Text>
        </View>

        <View style={styles.sectionList}>
          {sections.map((section) => (
            <View key={section.title} style={styles.card}>
              <View style={styles.iconFrame}>
                <MaterialIcons color={colors.ink} name={section.icon} size={22} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.body}>{section.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  logo: {
    borderRadius: 12,
    height: 42,
    width: 42,
  },
  brandName: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
  },
  brandTagline: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  header: {
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 43,
  },
  description: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
  },
  sectionList: {
    gap: 10,
  },
  card: {
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.03,
    shadowRadius: 18,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: colors.field,
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cardText: {
    flex: 1,
    gap: 5,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
