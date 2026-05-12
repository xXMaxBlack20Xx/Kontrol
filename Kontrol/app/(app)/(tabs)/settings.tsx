import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { useAuth } from '@/features/account/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function confirmLogout() {
    Alert.alert('Cerrar sesion', 'Tendras que iniciar sesion para volver a ver tus datos privados.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: handleLogout,
        style: 'destructive',
        text: 'Cerrar sesion',
      },
    ]);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setMessage(null);

    try {
      await logout();
      router.replace('/(auth)/login' as Href);
    } catch {
      setMessage('No se pudo cerrar la sesion local. Intenta nuevamente.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!user) {
    return <SessionLoadingScreen />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Kontrol</Text>
        <Text style={styles.title}>Ajustes</Text>
        <Text style={styles.description}>Administra tu sesion local y la informacion basica de la app.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cuenta local</Text>
        <Text style={styles.detail}>{user.email}</Text>
        <Text style={styles.detail}>Sesion creada: {new Date(user.createdAt).toLocaleString()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Privacidad</Text>
        <Text style={styles.detail}>
          Tus datos del MVP se conservan localmente en este dispositivo. No hay backend ni sincronizacion
          en la nube.
        </Text>
      </View>

      {message ? <Text style={[styles.feedback, styles.error]}>{message}</Text> : null}

      <Pressable
        disabled={isLoggingOut}
        onPress={confirmLogout}
        style={({ pressed }) => [styles.logoutButton, (pressed || isLoggingOut) && styles.buttonPressed]}>
        {isLoggingOut ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons color="#FFFFFF" name="logout" size={20} />
            <Text style={styles.logoutButtonText}>Cerrar sesion</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F7F7F8',
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 24,
  },
  header: {
    gap: 10,
    marginBottom: 8,
  },
  eyebrow: {
    color: '#6E6E73',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: '#111111',
    fontSize: 34,
    fontWeight: '700',
  },
  description: {
    color: '#5F6368',
    fontSize: 17,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 8,
    padding: 18,
  },
  sectionTitle: {
    color: '#1D1D1F',
    fontSize: 18,
    fontWeight: '700',
  },
  detail: {
    color: '#6E6E73',
    fontSize: 15,
    lineHeight: 22,
  },
  feedback: {
    borderRadius: 14,
    fontSize: 15,
    lineHeight: 20,
    padding: 12,
  },
  error: {
    backgroundColor: '#FDECEC',
    color: '#B3261E',
  },
  logoutButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#B3261E',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
