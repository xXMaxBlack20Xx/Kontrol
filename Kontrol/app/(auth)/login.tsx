import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { PrimaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { spacing, radius, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import { LoginError, loginErrorMessages } from '@/features/account/login';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const blueScreenGradientLight = {
  colors: ['#C8E0FE', '#E2EDFC', '#F4F8FF', '#F4F8FF'],
  locations: [0, 0.18, 0.4, 1],
} as const;

const blueScreenGradientDark = {
  colors: ['#0B1E36', '#0D1520', '#08090C', '#08090C'],
  locations: [0, 0.2, 0.44, 1],
} as const;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeGradient = isDark ? blueScreenGradientDark : blueScreenGradientLight;

  const isEmailValid = EMAIL_REGEX.test(email);
  const isFormValid = isEmailValid && password.length > 0;
  const showEmailError = email.length > 0 && !isEmailValid && email.includes('@');

  const validateEmail = (text: string) => {
    setEmail(text);
    setMessage(null);
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    setMessage(null);
  };

  async function handleLogin() {
    if (!isFormValid) {
      return;
    }

    setMessage(null);
    setIsSubmitting(true);

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
    <LinearGradient
      colors={[...activeGradient.colors]}
      locations={[...activeGradient.locations]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientRoot}
    >
      <ScreenContainer centered style={{ backgroundColor: 'transparent' }} contentStyle={styles.content} keyboardAvoiding>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Iniciar sesión</Text>
          <Text style={styles.title}>Inicia sesión.</Text>
          <Text style={styles.description}>
            Vuelve a tus hábitos, rachas y recordatorios guardados en este dispositivo.
          </Text>
        </View>

        <Card style={styles.form}>
          {/* Email input field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Correo electrónico</Text>
            <View style={[
              styles.inputShell,
              {
                backgroundColor: colors.surfaceMuted,
                borderWidth: showEmailError ? 1 : 0,
                borderColor: showEmailError ? colors.dangerText : 'transparent'
              }
            ]}>
              <MaterialIcons color={colors.textTertiary} name="alternate-email" size={20} />
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                inputMode="email"
                placeholder="usuario@correo.com"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { color: colors.textPrimary }]}
                onChangeText={validateEmail}
                value={email}
              />
            </View>
            {showEmailError ? (
              <Text style={[styles.inlineError, { color: colors.dangerText }]}>
                Por favor, introduce un correo electrónico válido.
              </Text>
            ) : null}
          </View>

          {/* Password input field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Contraseña</Text>
            <View style={[
              styles.inputShell,
              {
                backgroundColor: colors.surfaceMuted
              }
            ]}>
              <MaterialIcons color={colors.textTertiary} name="lock-outline" size={20} />
              <TextInput
                autoComplete="current-password"
                placeholder="Tu contraseña"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!isPasswordVisible}
                style={[styles.input, { color: colors.textPrimary }]}
                onChangeText={validatePassword}
                value={password}
              />
              <Pressable
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                hitSlop={8}
                style={styles.toggleButton}
              >
                <MaterialIcons
                  name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
          </View>

          {message ? <FeedbackMessage message={message} /> : null}

          <PrimaryButton
            loading={isSubmitting}
            onPress={handleLogin}
            title="Iniciar sesión"
            disabled={!isFormValid}
            style={{
              backgroundColor: isDark ? '#0A84FF' : '#007AFF',
              opacity: isFormValid ? 1 : 0.4,
            }}
            textColor="#FFFFFF"
          />
          <Pressable onPress={() => router.push('/(auth)/register' as Href)} style={styles.textLinkButton}>
            <Text style={styles.textLink}>Crear cuenta</Text>
          </Pressable>
        </Card>
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
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    fontFamily: typography.fontFamily,
    color: colors.textTertiary,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 41,
  },
  description: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 25,
  },
  form: {
    gap: spacing.xl,
    borderRadius: radius.xxl, // 28
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  inputShell: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 54,
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: 17,
    height: '100%',
    paddingVertical: 0,
  },
  toggleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  inlineError: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    marginLeft: 4,
  },
  textLinkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  textLink: {
    fontFamily: typography.fontFamily,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
