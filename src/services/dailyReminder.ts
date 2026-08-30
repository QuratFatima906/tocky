import * as Notifications from 'expo-notifications';

import { type DailyReminder } from '@/domain';

/**
 * One notification, rescheduled whenever the reminder changes, so there is
 * never a second one left over from a time the user has since moved.
 *
 * The copy is a nudge to record, never a verdict on what was recorded. Tocky
 * cannot know whether the day went well and does not imply it did not.
 */
const REMINDER_IDENTIFIER = 'tocky-daily-reminder';

const REMINDER_CONTENT = {
  title: 'How did today go?',
  body: 'A minute now keeps the week honest.',
} as const;

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

export async function askForReminderPermission(): Promise<ReminderPermission> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return 'granted';
    // Asking again once it has been refused does nothing on iOS, so the answer
    // stands until the user changes it in the system settings.
    if (!existing.canAskAgain) return 'denied';

    const asked = await Notifications.requestPermissionsAsync();

    return asked.granted ? 'granted' : 'denied';
  } catch {
    return 'undetermined';
  }
}

export async function currentReminderPermission(): Promise<ReminderPermission> {
  try {
    const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    if (granted) return 'granted';

    return canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'undetermined';
  }
}

/** Silently does nothing when the reminder is off, which is the wanted end state. */
export async function applyDailyReminder(reminder: DailyReminder): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
    if (!reminder.isOn) return;

    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: REMINDER_CONTENT,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
      },
    });
  } catch {
    // A reminder that could not be scheduled is reported by the screen, which
    // checks the permission, rather than taking the app down here.
  }
}
