import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

import { PressableScale, Text } from '@/design-system';
import { formatReminderTime, type DailyReminder } from '@/domain';
import type { ReminderPermission } from '@/services/dailyReminder';

import { SettingsToggleRow } from './SettingsToggleRow';

/**
 * A reminder is two decisions -- whether, and when -- so the row carries both
 * rather than sending the user to a screen of its own for a single time.
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
  const [isPickingTime, setIsPickingTime] = useState(false);

  return (
    <SettingsToggleRow
      icon="history"
      label="Daily reminder"
      isOn={reminder.isOn}
      permission={permission}
      switchTestID="daily-reminder-switch"
      onToggle={(isOn) => {
        setIsPickingTime(false);
        onChange({ ...reminder, isOn });
      }}
      trailing={
        reminder.isOn ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Reminder time, ${formatReminderTime(reminder)}`}
            onPress={() => setIsPickingTime((wasPicking) => !wasPicking)}
          >
            <Text variant="label" color="accent">
              {formatReminderTime(reminder)}
            </Text>
          </PressableScale>
        ) : null
      }
      expanded={
        isPickingTime ? (
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
        ) : null
      }
    />
  );
}

/** The picker speaks in dates; only the hour and minute of this one are read. */
function timeAsDate({ hour, minute }: DailyReminder): Date {
  const time = new Date();
  time.setHours(hour, minute, 0, 0);

  return time;
}
