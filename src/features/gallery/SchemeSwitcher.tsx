import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  MINIMUM_TOUCH_TARGET,
  useTextStyle,
  useTheme,
  useThemePreference,
  type ThemePreference,
} from '@/design-system';

const THEME_OPTIONS: readonly ThemePreference[] = ['light', 'dark', 'system'];

function SchemeOption({ option }: { option: ThemePreference }) {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const isSelected = preference === option;
  const { style, ...textProps } = useTextStyle(
    'labelSmall',
    isSelected ? theme.color.textOnAccent : theme.color.textSecondary,
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Preview in ${option} theme`}
      onPress={() => setPreference(option)}
      style={[
        styles.schemeOption,
        {
          backgroundColor: isSelected ? theme.color.accent : theme.color.surfaceMuted,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      <Text style={style} {...textProps}>
        {option}
      </Text>
    </Pressable>
  );
}

export function SchemeSwitcher() {
  const theme = useTheme();

  return (
    <View style={[styles.switcher, { gap: theme.spacing.sm }]}>
      {THEME_OPTIONS.map((option) => (
        <SchemeOption key={option} option={option} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  switcher: { flexDirection: 'row' },
  schemeOption: {
    minHeight: MINIMUM_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
