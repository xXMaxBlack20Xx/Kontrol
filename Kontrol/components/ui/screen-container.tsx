import { PropsWithChildren, ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from './theme';
import { useTheme } from './theme-context';

type ScreenContainerProps = PropsWithChildren<{
  centered?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
  keyboardAvoiding?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  scroll?: boolean;
}>;

export function ScreenContainer({
  centered = false,
  children,
  contentStyle,
  style,
  edges,
  keyboardAvoiding = false,
  refreshControl,
  scroll = true,
}: ScreenContainerProps) {
  const { colors } = useTheme();

  const content = scroll ? (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[styles.content, centered && styles.centered, contentStyle]}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, centered && styles.centered, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: colors.background }, style]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoider}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingBottom: 100,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
  },
});
