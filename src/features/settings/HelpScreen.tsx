import Constants from 'expo-constants';
import { Linking, View } from 'react-native';

import { Card, IconButton, Screen, Text, useTheme } from '@/design-system';

const SUPPORT_ADDRESS = 'hello@tocky.app';

/**
 * What someone needs when something is wrong, and nothing that pretends to be
 * more than it is: there is no account, no server and no support queue, so the
 * page says where the data lives and how to reach a person.
 */
const ANSWERS: readonly { readonly question: string; readonly answer: string }[] = [
  {
    question: 'Where is my data?',
    answer:
      'On this device, in a database only Tocky can read. Nothing is uploaded, because Tocky makes no network calls at all.',
  },
  {
    question: 'What happens if I delete the app?',
    answer:
      'Everything goes with it. Export your sessions from Settings first if you want to keep them.',
  },
  {
    question: 'Why does a session I paused still count?',
    answer:
      'It does not. Time is measured from when a session started to when it ended, minus every pause, and worked out fresh each time rather than counted up.',
  },
  {
    question: 'Tocky asked whether to keep a very long session.',
    answer:
      'Anything past eight hours gets a question, because a clock left running looks the same as a long day. It is only ever a question — Tocky keeps the session unless you say otherwise.',
  },
];

export function HelpScreen({ onBack }: { onBack: () => void }) {
  const theme = useTheme();
  const version = Constants.expoConfig?.version ?? '0.0.0';

  return (
    <Screen scrollable gap="lg" testID="help-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <IconButton icon="back" accessibilityLabel="Back" background="surface" onPress={onBack} />
        <Text variant="screenTitle" accessibilityRole="header">
          Help &amp; support
        </Text>
      </View>

      {ANSWERS.map(({ question, answer }) => (
        <Card key={question} gap="sm">
          <Text variant="sectionTitle" accessibilityRole="header">
            {question}
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            {answer}
          </Text>
        </Card>
      ))}

      <Card gap="sm">
        <Text variant="sectionTitle" accessibilityRole="header">
          Still stuck?
        </Text>
        <Text variant="bodySmall" color="textSecondary">
          Write to {SUPPORT_ADDRESS} and say which version you are on.
        </Text>
        <Text
          variant="label"
          color="accent"
          accessibilityRole="link"
          accessibilityLabel={`Email ${SUPPORT_ADDRESS}`}
          onPress={() => void Linking.openURL(emailLink(version))}
        >
          Send an email
        </Text>
      </Card>

      <Text variant="caption" color="textTertiary" style={{ textAlign: 'center' }}>
        Tocky · v{version}
      </Text>
    </Screen>
  );
}

/** The version goes in the subject, since it is the first thing to be asked. */
function emailLink(version: string): string {
  return `mailto:${SUPPORT_ADDRESS}?subject=${encodeURIComponent(`Tocky v${version}`)}`;
}
