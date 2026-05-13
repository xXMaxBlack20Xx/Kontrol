import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { BrandMark } from '@/components/ui/brand-mark';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { FeedbackMessage, TextInputField } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { spacing } from '@/components/ui/theme';
import { useAuth } from '@/features/account/auth-context';
import { LoginError, loginErrorMessages } from '@/features/account/login';

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
    <ScreenContainer centered contentStyle={styles.content} keyboardAvoiding>
      <BrandMark />

      <AppHeader
        description="Vuelve a tus hábitos, rachas y recordatorios guardados en este dispositivo."
        title="Inicia sesión."
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
          autoComplete="current-password"
          icon="lock-outline"
          label="Contraseña"
          onChangeText={setPassword}
          placeholder="Tu contraseña"
          secureTextEntry
          value={password}
        />

        {message ? <FeedbackMessage message={message} /> : null}

        <PrimaryButton
          icon="arrow-forward"
          loading={isSubmitting}
          onPress={handleLogin}
          title="Iniciar sesión"
        />

        <SecondaryButton
          onPress={() => router.push('/(auth)/register' as Href)}
          title="Crear cuenta local"
        />
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
});
