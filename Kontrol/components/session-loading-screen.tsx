import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function SessionLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#0A84FF" />
      <Text style={styles.text}>Cargando sesion...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F7F7F8',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    color: '#6E6E73',
    fontSize: 15,
    fontWeight: '600',
  },
});
