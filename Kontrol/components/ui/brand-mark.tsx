import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

const logo = require('@/assets/logo/Kontrol_logo_icon_app_v2.png');

type BrandMarkProps = {
  tagline?: string;
};

export function BrandMark({ tagline = 'Hábitos locales' }: BrandMarkProps) {
  return (
    <View style={styles.brandRow}>
      <Image source={logo} style={styles.logo} />
      <View>
        <Text style={styles.brandName}>Kontrol</Text>
        <Text style={styles.brandTagline}>{tagline}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  brandTagline: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
});
