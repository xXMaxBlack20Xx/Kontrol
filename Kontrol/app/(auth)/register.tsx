import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { BrandMark } from '@/components/ui/brand-mark';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { FeedbackMessage, TextInputField } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { colors, radius, spacing } from '@/components/ui/theme';
import { useAuth } from '@/features/account/auth-context';
import { RegistrationError, registrationErrorMessages } from '@/features/account/registration';

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
    <ScreenContainer contentStyle={styles.content} keyboardAvoiding>
      <BrandMark />

      <AppHeader
        description="Empieza con una cuenta local para guardar tus hábitos, sesión y progreso en este dispositivo."
        title="Crea tu cuenta."
      />

      <Card style={styles.form}>
        <TextInputField
          autoCapitalize="none"
          autoComplete="email"
          icon="alternate-email"
          inputMode="email"
          label="Correo electrónico"
          onChangeText={setEmail}
          placeholder="usuario@correo.com"
          value={email}
        />

        <TextInputField
          autoComplete="new-password"
          icon="lock-outline"
          label="Contraseña"
          onChangeText={setPassword}
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
          value={password}
        />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: privacyNoticeAccepted }}
          onPress={() => setPrivacyNoticeAccepted((currentValue) => !currentValue)}
          style={({ pressed }) => [styles.privacyRow, pressed && styles.pressed]}>
          <View style={[styles.checkbox, privacyNoticeAccepted && styles.checkboxChecked]}>
            {privacyNoticeAccepted ? (
              <MaterialIcons color={colors.primaryText} name="check" size={17} />
            ) : null}
          </View>
          <Text style={styles.privacyText}>Acepto el aviso de privacidad.</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/privacy' as Href)}
          style={({ pressed }) => [styles.privacyLink, pressed && styles.pressed]}>
          <Text style={styles.privacyLinkText}>Ver aviso de privacidad</Text>
          <MaterialIcons color={colors.textPrimary} name="arrow-forward-ios" size={14} />
        </Pressable>

        {message ? <FeedbackMessage message={message} /> : null}

        <PrimaryButton
          icon="arrow-forward"
          loading={isSubmitting}
          onPress={handleRegister}
          title="Crear cuenta"
        />

        <SecondaryButton onPress={() => router.replace('/(auth)/login' as Href)} title="Iniciar sesión" />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  form: {
    gap: spacing.lg,
  },
  privacyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 48,
  },
  pressed: {
    opacity: 0.72,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  privacyText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  privacyLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  privacyLinkText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
