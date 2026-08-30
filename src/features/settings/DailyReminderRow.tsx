import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Linking, Switch, View } from 'react-native';

import { CategoryTile, PressableScale, Text, useTheme } from '@/design-system';
import { formatReminderTime, type DailyReminder } from '@/domain';
import type { ReminderPermission } from '@/services/dailyReminder';

const ROW_TILE_SIZE = 34;

/**
 * A reminder is two decisions -- whether, and when -- so the row carries both
 * rather than sending the user to a screen of its own for a single time.
 *
 * When notifications are refused the toggle still works and still remembers
 * what was asked for; the row says plainly that nothing will arrive until the
 * permission changes, and offers the only place that can change it.
 */
export function DailyReminderRow({
  reminder,
  permission,
  onChange,
}: {
  reminder: DailyReminder;
  permission: ReminderPermission;
  onChange: (next: DailyReminder) => void;
}) {
  const theme = useTheme();
  const [isPickingTime, setIsPickingTime] = useState(false);
  const willNotFire = reminder.isOn && permission === 'denied';

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.color.border }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
        }}
      >
        <CategoryTile icon="history" color={theme.color.accent} size={ROW_TILE_SIZE} />
        <Text variant="label" style={{ flex: 1 }}>
          Daily reminder
        </Text>

        {reminder.isOn && (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Reminder time, ${formatReminderTime(reminder)}`}
            onPress={() => setIsPickingTime((wasPicking) => !wasPicking)}
          >
            <Text variant="label" color="accent">
              {formatReminderTime(reminder)}
            </Text>
          </PressableScale>
        )}

        <Switch
          testID="daily-reminder-switch"
          accessibilityLabel="Daily reminder"
          value={reminder.isOn}
          onValueChange={(isOn) => {
            setIsPickingTime(false);
            onChange({ ...reminder, isOn });
          }}
          trackColor={{ true: theme.color.accent, false: theme.color.track }}
        />
      </View>

      {isPickingTime && (
        <DateTimePicker
          value={timeAsDate(reminder)}
          mode="time"
          display="spinner"
          testID="reminder-time-picker"
          // A wheel a person turns, which is what VoiceOver calls adjustable.
          // The native control handles the gestures; it just never says so.
          accessibilityRole="adjustable"
          accessibilityLabel="Pick the reminder time"
          // onChange is deprecated in 9.x, and onValueChange only fires with a
          // date, so there is no undefined to guard against.
          onValueChange={(_event, picked) => {
            onChange({ ...reminder, hour: picked.getHours(), minute: picked.getMinutes() });
          }}
        />
      )}

      {willNotFire && (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Notifications are off for Tocky. Open Settings to turn them on."
          onPress={() => void Linking.openSettings()}
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
            gap: theme.spacing.xs,
          }}
        >
          <Text variant="captionSmall" color="errorText">
            Notifications are off for Tocky, so this reminder will not arrive.
          </Text>
          <Text variant="captionSmall" color="accent">
            Open Settings
          </Text>
        </PressableScale>
      )}
    </View>
  );
}

/** The picker speaks in dates; only the hour and minute of this one are read. */
function timeAsDate({ hour, minute }: DailyReminder): Date {
  const time = new Date();
  time.setHours(hour, minute, 0, 0);

  return time;
}
