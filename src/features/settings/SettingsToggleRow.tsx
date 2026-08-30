import type { ReactNode } from 'react';
import { Linking, Switch, View } from 'react-native';

import { CategoryTile, PressableScale, Text, useTheme } from '@/design-system';
import type { ReminderPermission } from '@/services/dailyReminder';

const ROW_TILE_SIZE = 34;

/**
 * A preference that is on or off, and says so when the system will not let it
 * happen. Built for the daily reminder and promoted the moment the weekly
 * report needed the same chrome.
 *
 * A refused permission never breaks the switch or forgets what was asked for.
 * The row says nothing will arrive and offers the only place that can change
 * it, rather than looking as though it is working.
 */
export function SettingsToggleRow({
  icon,
  label,
  isOn,
  onToggle,
  permission,
  switchTestID,
  trailing,
  expanded,
  isLast = false,
}: {
  icon: string;
  label: string;
  isOn: boolean;
  onToggle: (next: boolean) => void;
  permission: ReminderPermission;
  switchTestID: string;
  trailing?: ReactNode;
  expanded?: ReactNode;
  isLast?: boolean;
}) {
  const theme = useTheme();
  const willNotFire = isOn && permission === 'denied';

  return (
    <View style={isLast ? {} : { borderBottomWidth: 1, borderBottomColor: theme.color.border }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
        }}
      >
        <CategoryTile icon={icon} color={theme.color.accent} size={ROW_TILE_SIZE} />
        <Text variant="label" style={{ flex: 1 }}>
          {label}
        </Text>

        {trailing}

        <Switch
          testID={switchTestID}
          accessibilityLabel={label}
          value={isOn}
          onValueChange={onToggle}
          trackColor={{ true: theme.color.accent, false: theme.color.track }}
        />
      </View>

      {expanded}

      {willNotFire && (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Notifications are off for Tocky, so ${label} will not arrive. Open Settings.`}
          onPress={() => void Linking.openSettings()}
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
            gap: theme.spacing.xs,
          }}
        >
          <Text variant="captionSmall" color="errorText">
            Notifications are off for Tocky, so this will not arrive.
          </Text>
          <Text variant="captionSmall" color="accent">
            Open Settings
          </Text>
        </PressableScale>
      )}
    </View>
  );
}
