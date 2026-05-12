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
import { LoginError, loginErrorMessages } from '@/features/account/login';

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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await login({ email, password });
      router.replace('/(app)/(tabs)/habits' as Href);
    } catch (error) {
      if (error instanceof LoginError) {
        setMessage(loginErrorMessages[error.code]);
      } else {
        setMessage(loginErrorMessages.LOGIN_UNAVAILABLE);
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
            <Text style={styles.title}>Inicia sesión.</Text>
            <Text style={styles.description}>
              Vuelve a tus hábitos, rachas y recordatorios guardados en este dispositivo.
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
                  autoComplete="current-password"
                  onChangeText={setPassword}
                  placeholder="Tu contraseña"
                  placeholderTextColor={colors.subtle}
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
            </View>

            {message ? <Text style={[styles.feedback, styles.error]}>{message}</Text> : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || isSubmitting) && styles.primaryButtonPressed,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
                  <MaterialIcons color={colors.card} name="arrow-forward" size={20} />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/register' as Href)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
              <Text style={styles.secondaryButtonText}>Crear cuenta local</Text>
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
    gap: 28,
    justifyContent: 'center',
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
