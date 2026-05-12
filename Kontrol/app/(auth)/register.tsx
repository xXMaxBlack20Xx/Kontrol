import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/account/auth-context';
import { RegistrationError, registrationErrorMessages } from '@/features/account/registration';

const logo = require('@/assets/logo/Kontrol_logo_icon_app_v2.png');

const colors = {
  background: '#F7F7F8',
  card: '#FFFFFF',
  ink: '#111111',
  muted: '#6E6E73',
  subtle: '#8A8A8E',
  border: '#E5E5EA',
  borderStrong: '#D1D1D6',
  field: '#F4F4F5',
  dangerBackground: '#FDECEC',
  dangerText: '#B3261E',
  black: '#000000',
};

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [privacyNoticeAccepted, setPrivacyNoticeAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await register({ email, password, privacyNoticeAccepted });
      router.replace('/(app)/(tabs)/habits' as Href);
    } catch (error) {
      if (error instanceof RegistrationError) {
        setMessage(registrationErrorMessages[error.code]);
      } else {
        setMessage(registrationErrorMessages.REGISTRATION_UNAVAILABLE);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoider}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <Image source={logo} style={styles.logo} />
            <View>
              <Text style={styles.brandName}>Kontrol</Text>
              <Text style={styles.brandTagline}>Hábitos locales</Text>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Crea tu cuenta.</Text>
            <Text style={styles.description}>
              Empieza con una cuenta local para guardar tus hábitos, sesión y progreso en este
              dispositivo.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={styles.inputShell}>
                <MaterialIcons color={colors.subtle} name="alternate-email" size={20} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  inputMode="email"
                  onChangeText={setEmail}
                  placeholder="usuario@correo.com"
                  placeholderTextColor={colors.subtle}
                  style={styles.input}
                  value={email}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputShell}>
                <MaterialIcons color={colors.subtle} name="lock-outline" size={20} />
                <TextInput
                  autoComplete="new-password"
                  onChangeText={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={colors.subtle}
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: privacyNoticeAccepted }}
              onPress={() => setPrivacyNoticeAccepted((currentValue) => !currentValue)}
              style={({ pressed }) => [styles.privacyRow, pressed && styles.rowPressed]}>
              <View style={[styles.checkbox, privacyNoticeAccepted && styles.checkboxChecked]}>
                {privacyNoticeAccepted ? <MaterialIcons color={colors.card} name="check" size={17} /> : null}
              </View>
              <Text style={styles.privacyText}>Acepto el aviso de privacidad.</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/privacy' as Href)}
              style={({ pressed }) => [styles.privacyLink, pressed && styles.rowPressed]}>
              <Text style={styles.privacyLinkText}>Ver aviso de privacidad</Text>
              <MaterialIcons color={colors.ink} name="arrow-forward-ios" size={14} />
            </Pressable>

            {message ? <Text style={[styles.feedback, styles.error]}>{message}</Text> : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleRegister}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || isSubmitting) && styles.primaryButtonPressed,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Crear cuenta</Text>
                  <MaterialIcons color={colors.card} name="arrow-forward" size={20} />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.replace('/(auth)/login' as Href)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
              <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 24,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 24,
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
  form: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 18,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 17,
    minHeight: 52,
  },
  privacyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 44,
  },
  rowPressed: {
    opacity: 0.72,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkboxChecked: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  privacyText: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  privacyLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
  },
  privacyLinkText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  feedback: {
    borderRadius: 16,
    fontSize: 15,
    lineHeight: 20,
    padding: 12,
  },
  error: {
    backgroundColor: colors.dangerBackground,
    color: colors.dangerText,
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
});
