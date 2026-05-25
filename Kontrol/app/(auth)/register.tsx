import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PrimaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import { RegistrationError, registrationErrorMessages } from '@/features/account/registration';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[0-9]).{8,}$/;

const blueScreenGradientLight = {
  colors: ['#C8E0FE', '#E2EDFC', '#F4F8FF', '#F4F8FF'],
  locations: [0, 0.18, 0.4, 1],
} as const;

const blueScreenGradientDark = {
  colors: ['#0B1E36', '#0D1520', '#08090C', '#08090C'],
  locations: [0, 0.2, 0.44, 1],
} as const;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacyNoticeAccepted, setPrivacyNoticeAccepted] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeGradient = isDark ? blueScreenGradientDark : blueScreenGradientLight;

  const isEmailValid = EMAIL_REGEX.test(email);
  const isPasswordValid = PASSWORD_REGEX.test(password);
  const doPasswordsMatch = password === confirmPassword;
  const isFormValid = isEmailValid && isPasswordValid && doPasswordsMatch && privacyNoticeAccepted;

  const showEmailError = email.length > 0 && !isEmailValid && email.includes('@');
  const showPasswordReqError = password.length > 0 && !isPasswordValid;
  const showPasswordMatchError = confirmPassword.length > 0 && !doPasswordsMatch;

  const validateEmail = (text: string) => {
    setEmail(text);
    setMessage(null);
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    setMessage(null);
  };

  const validateConfirmPassword = (text: string) => {
    setConfirmPassword(text);
    setMessage(null);
  };

  async function handleRegister() {
    if (!isFormValid) {
      return;
    }

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
    <LinearGradient
      colors={[...activeGradient.colors]}
      locations={[...activeGradient.locations]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientRoot}
    >
      <ScreenContainer style={{ backgroundColor: 'transparent' }} contentStyle={styles.content} keyboardAvoiding>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Nuevo registro</Text>
          <Text style={styles.title}>Crea tu cuenta.</Text>
          <Text style={styles.description}>
            Empieza con una cuenta segura para guardar tus hábitos, sesión y progreso en Kontrol.
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
                backgroundColor: colors.surfaceMuted,
                borderWidth: showPasswordReqError ? 1 : 0,
                borderColor: showPasswordReqError ? colors.dangerText : 'transparent'
              }
            ]}>
              <MaterialIcons color={colors.textTertiary} name="lock-outline" size={20} />
              <TextInput
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
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
            {showPasswordReqError ? (
              <Text style={[styles.inlineError, { color: colors.dangerText }]}>
                Debe tener al menos 8 caracteres y un número.
              </Text>
            ) : null}
          </View>

          {/* Confirm Password input field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Confirmar contraseña</Text>
            <View style={[
              styles.inputShell,
              {
                backgroundColor: colors.surfaceMuted,
                borderWidth: showPasswordMatchError ? 1 : 0,
                borderColor: showPasswordMatchError ? colors.dangerText : 'transparent'
              }
            ]}>
              <MaterialIcons color={colors.textTertiary} name="lock-outline" size={20} />
              <TextInput
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!isConfirmPasswordVisible}
                style={[styles.input, { color: colors.textPrimary }]}
                onChangeText={validateConfirmPassword}
                value={confirmPassword}
              />
              <Pressable
                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                hitSlop={8}
                style={styles.toggleButton}
              >
                <MaterialIcons
                  name={isConfirmPasswordVisible ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
            {showPasswordMatchError ? (
              <Text style={[styles.inlineError, { color: colors.dangerText }]}>
                Las contraseñas no coinciden.
              </Text>
            ) : null}
          </View>

          {/* Privacy notice check */}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: privacyNoticeAccepted }}
            onPress={() => setPrivacyNoticeAccepted((currentValue) => !currentValue)}
            style={({ pressed }) => [styles.privacyRow, pressed && styles.pressed]}
          >
            <View style={[styles.checkbox, privacyNoticeAccepted && styles.checkboxChecked]}>
              {privacyNoticeAccepted ? (
                <MaterialIcons color={colors.primaryText} name="check" size={17} />
              ) : null}
            </View>
            <Text style={styles.privacyText}>Acepto el aviso de privacidad.</Text>
          </Pressable>

          {/* Privacy link */}
          <Pressable
            onPress={() => router.push('/(auth)/privacy' as Href)}
            style={({ pressed }) => [styles.privacyLink, pressed && styles.pressed]}
          >
            <Text style={styles.privacyLinkText}>Ver aviso de privacidad</Text>
            <MaterialIcons color={colors.textPrimary} name="arrow-forward-ios" size={14} />
          </Pressable>

          {message ? <FeedbackMessage message={message} /> : null}

          <PrimaryButton
            loading={isSubmitting}
            onPress={handleRegister}
            title="Crear cuenta"
            disabled={!isFormValid}
            style={{
              backgroundColor: isDark ? '#0A84FF' : '#007AFF',
              opacity: isFormValid ? 1 : 0.4,
            }}
            textColor="#FFFFFF"
          />
          <Pressable onPress={() => router.replace('/(auth)/login' as Href)} style={styles.textLinkButton}>
            <Text style={styles.textLink}>Iniciar sesión</Text>
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
