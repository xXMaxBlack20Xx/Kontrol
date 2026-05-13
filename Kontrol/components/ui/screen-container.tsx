import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from './theme';

type ScreenContainerProps = PropsWithChildren<{
  centered?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  keyboardAvoiding?: boolean;
  scroll?: boolean;
}>;

export function ScreenContainer({
  centered = false,
  children,
  contentStyle,
  edges,
  keyboardAvoiding = false,
  scroll = true,
}: ScreenContainerProps) {
  const content = scroll ? (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[styles.content, centered && styles.centered, contentStyle]}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, centered && styles.centered, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={styles.screen}>
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
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingBottom: 36,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
  },
});
