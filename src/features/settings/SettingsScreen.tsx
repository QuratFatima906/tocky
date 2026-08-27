import Constants from 'expo-constants';
import { useState } from 'react';
import { View } from 'react-native';

import { useSessionStore, useSessionStoreSnapshot } from '@/data';
import {
  Button,
  Card,
  CATEGORY_PRESETS,
  IconButton,
  Screen,
  Surface,
  Text,
  TextField,
  TockyOwl,
  useTheme,
  useThemePreference,
  type CategoryIconName,
  type ThemePreference,
} from '@/design-system';

import { SettingsRow } from './SettingsRow';

const AVATAR_TILE_SIZE = 58;
const AVATAR_OWL_SIZE = 38;
const PROFILE_NAME_MAX_LENGTH = 40;

const APPEARANCES: readonly { readonly preference: ThemePreference; readonly label: string }[] = [
  { preference: 'light', label: 'Light' },
  { preference: 'dark', label: 'Dark' },
  { preference: 'system', label: 'System' },
];

function hueOf(icon: CategoryIconName, fallback: string): string {
  return CATEGORY_PRESETS.find((preset) => preset.icon === icon)?.hue ?? fallback;
}

export function SettingsScreen({ onManageCategories }: { onManageCategories?: () => void }) {
  const theme = useTheme();
  const store = useSessionStore();
  const { profileName, categories } = useSessionStoreSnapshot();
  const { preference, setPreference } = useThemePreference();

  const [draftName, setDraftName] = useState<string | null>(null);

  function saveName(): void {
    if (draftName !== null) store.setProfileName(draftName);
    setDraftName(null);
  }

  function chooseAppearance(next: ThemePreference): void {
    setPreference(next);
    store.setThemePreference(next);
  }

  const activeCategoryCount = categories.filter((category) => !category.isArchived).length;

  return (
    <Screen scrollable gap="xl" testID="settings-screen">
      <Text variant="title" accessibilityRole="header">
        Settings
      </Text>

      <Card
        background="surfaceMuted"
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}
      >
        <Surface
          radius="lg"
          elevation="card"
          style={{
            width: AVATAR_TILE_SIZE,
            height: AVATAR_TILE_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TockyOwl expression="happy" size={AVATAR_OWL_SIZE} />
        </Surface>

        {draftName === null ? (
          <>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <Text variant="sectionTitle">{profileName ?? 'Add your name'}</Text>
              <Text variant="bodySmall" color="textSecondary">
                Everything stays on this device
              </Text>
            </View>
            <IconButton
              icon="edit"
              accessibilityLabel={profileName === null ? 'Add your name' : 'Edit your name'}
              iconColor="accent"
              background="surface"
              onPress={() => setDraftName(profileName ?? '')}
            />
          </>
        ) : (
          <View style={{ flex: 1, gap: theme.spacing.md }}>
            <TextField
              value={draftName}
              onChangeText={setDraftName}
              accessibilityLabel="Your name"
              placeholder="Your name"
              maxLength={PROFILE_NAME_MAX_LENGTH}
              autoFocus
            />
            <Button label="Save" size="small" onPress={saveName} />
          </View>
        )}
      </Card>

      <SettingsGroup title="Appearance">
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: 'row', gap: theme.spacing.sm, padding: theme.spacing.lg }}
        >
          {APPEARANCES.map((appearance) => (
            <Button
              key={appearance.preference}
              label={appearance.label}
              size="small"
              variant={preference === appearance.preference ? 'primary' : 'secondary'}
              accessibilityRole="radio"
              accessibilityState={{ selected: preference === appearance.preference }}
              onPress={() => chooseAppearance(appearance.preference)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      </SettingsGroup>

      <SettingsGroup title="Preferences">
        <SettingsRow
          icon="history"
          hue={hueOf('work', theme.color.accent)}
          label="Daily reminder"
          isAwaited
        />
        <SettingsRow
          icon="tasks"
          hue={hueOf('learning', theme.color.accent)}
          label="Idle detection"
          isAwaited
        />
        <SettingsRow
          icon="insights"
          hue={hueOf('social', theme.color.accent)}
          label="Weekly report"
          isAwaited
          isLast
        />
      </SettingsGroup>

      <SettingsGroup title="General">
        {onManageCategories === undefined ? (
          <SettingsRow
            icon="creative"
            hue={hueOf('creative', theme.color.accent)}
            label="Manage categories"
            value={String(activeCategoryCount)}
            isAwaited
          />
        ) : (
          <SettingsRow
            icon="creative"
            hue={hueOf('creative', theme.color.accent)}
            label="Manage categories"
            value={String(activeCategoryCount)}
            onPress={onManageCategories}
          />
        )}
        <SettingsRow
          icon="switch"
          hue={hueOf('personal', theme.color.accent)}
          label="Export data"
          isAwaited
        />
        <SettingsRow
          icon="health"
          hue={hueOf('health', theme.color.accent)}
          label="Help & support"
          isAwaited
          isLast
        />
      </SettingsGroup>

      <Text variant="caption" color="textTertiary" style={{ textAlign: 'center' }}>
        Tocky · v{Constants.expoConfig?.version ?? '0.0.0'}
      </Text>
    </Screen>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text variant="overline" color="textTertiary" style={{ paddingLeft: theme.spacing.xs }}>
        {title}
      </Text>
      <Surface radius="xl" elevation="card" style={{ overflow: 'hidden' }}>
        {children}
      </Surface>
    </View>
  );
}
