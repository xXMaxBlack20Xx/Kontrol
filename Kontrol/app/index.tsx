import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, type Href, useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { useAuth } from '@/features/account/auth-context';

const logo = require('@/assets/logo/Kontrol_logo_icon_app_v2.png');

const colors = {
  background: '#F7F7F8',
  card: '#FFFFFF',
  cardSoft: '#FBFBFC',
  ink: '#111111',
  muted: '#6E6E73',
  subtle: '#8A8A8E',
  border: '#E5E5EA',
  borderStrong: '#D1D1D6',
  black: '#000000',
  success: '#1D1D1F',
};

export default function IndexRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoadingSession } = useAuth();

  if (isLoadingSession) {
    return <SessionLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href={'/(app)/(tabs)/habits' as Href} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <Image source={logo} style={styles.logoSmall} />
            <View>
              <Text style={styles.brandName}>Kontrol</Text>
              <Text style={styles.brandTagline}>Hábitos Atómicos</Text>
            </View>
          </View>

          <View style={styles.heroVisual}>
            <View style={styles.previewPanel}>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={styles.previewEyebrow}>Hoy</Text>
                  <Text style={styles.previewTitle}>Ritmo diario</Text>
                </View>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>3/4</Text>
                </View>
              </View>

              <View style={styles.previewList}>
                <View style={styles.previewItemDone}>
                  <MaterialIcons color={colors.ink} name="check-circle" size={20} />
                  <Text style={styles.previewItemText}>Leer 10 páginas</Text>
                </View>
                <View style={styles.previewItemDone}>
                  <MaterialIcons color={colors.ink} name="check-circle" size={20} />
                  <Text style={styles.previewItemText}>Caminar 20 minutos</Text>
                </View>
                <View style={styles.previewItemPending}>
                  <MaterialIcons color={colors.subtle} name="radio-button-unchecked" size={20} />
                  <Text style={styles.previewItemPendingText}>Dormir temprano</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>Controla tus hábitos sin complicarte.</Text>
            <Text style={styles.description}>
              Registra lo importante en segundos, conserva tus datos en el iPhone y mira cómo
              crece tu constancia sin ruido.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push('/(auth)/register' as Href)}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}>
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
              <MaterialIcons color={colors.card} name="arrow-forward" size={20} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(auth)/login' as Href)}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}>
              <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.valueSection}>
          <View style={styles.valueItem}>
            <View style={styles.iconFrame}>
              <MaterialIcons color={colors.ink} name="lock-outline" size={22} />
            </View>
            <View style={styles.valueTextBlock}>
              <Text style={styles.valueTitle}>Datos locales</Text>
              <Text style={styles.valueText}>Cuenta, sesión y registros viven en este dispositivo.</Text>
            </View>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.iconFrame}>
              <MaterialIcons color={colors.ink} name="insights" size={22} />
            </View>
            <View style={styles.valueTextBlock}>
              <Text style={styles.valueTitle}>Rachas claras</Text>
              <Text style={styles.valueText}>Ve qué cumpliste hoy y cómo avanza tu constancia.</Text>
            </View>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.iconFrame}>
              <MaterialIcons color={colors.ink} name="notifications-none" size={22} />
            </View>
            <View style={styles.valueTextBlock}>
              <Text style={styles.valueTitle}>Recordatorios útiles</Text>
              <Text style={styles.valueText}>Programa alertas locales solo cuando aportan valor.</Text>
            </View>
          </View>
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
    flexGrow: 1,
    gap: 22,
    justifyContent: 'space-between',
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  hero: {
    gap: 24,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  logoSmall: {
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
  heroVisual: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 32,
    borderWidth: 1,
    gap: 16,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
  },
  previewPanel: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    width: '100%',
  },
  previewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewEyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  previewTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  previewBadge: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 48,
    paddingHorizontal: 12,
  },
  previewBadgeText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '800',
  },
  previewList: {
    gap: 8,
  },
  previewItemDone: {
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  previewItemPending: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  previewItemText: {
    color: colors.success,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  previewItemPendingText: {
    color: colors.muted,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  copyBlock: {
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 39,
    fontWeight: '800',
    lineHeight: 44,
  },
  description: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 18,
    shadowColor: colors.black,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  primaryButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: colors.card,
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  secondaryButtonPressed: {
    backgroundColor: '#EFEFF0',
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  valueSection: {
    gap: 10,
    paddingBottom: 4,
  },
  valueItem: {
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  valueTextBlock: {
    flex: 1,
    gap: 4,
  },
  valueTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  valueText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
});
