import { useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import {
  Button,
  Card,
  CATEGORY_PRESETS,
  CategoryTile,
  Screen,
  Surface,
  Text,
  TockyOwl,
  useTheme,
  type CategoryIconName,
  type GradientName,
  type OwlExpression,
} from '@/design-system';

const HERO_OWL_SIZE = 168;
const CLUSTER_TILE_SIZE = 56;
const DOT_SIZE = 8;
const ACTIVE_DOT_WIDTH = 24;

const CLUSTER_ICONS: readonly CategoryIconName[] = ['work', 'learning', 'creative', 'health'];

const HOURS_BARS: readonly { readonly icon: CategoryIconName; readonly height: number }[] = [
  { icon: 'work', height: 38 },
  { icon: 'learning', height: 56 },
  { icon: 'creative', height: 70 },
  { icon: 'health', height: 46 },
];

const BAR_WIDTH = 20;

function hueOf(icon: CategoryIconName | undefined, fallback: string): string {
  return CATEGORY_PRESETS.find((preset) => preset.icon === icon)?.hue ?? fallback;
}

type Pane = {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly gradient: GradientName;
  readonly owl: OwlExpression;
  readonly owlCategory?: CategoryIconName;
  readonly illustration?: 'categories' | 'hours';
};

const PANES: readonly Pane[] = [
  {
    eyebrow: 'Meet Tocky',
    title: 'Where did your day go?',
    body: "Tocky quietly watches the clock so you don't have to. Tap a category, and it tracks where your hours actually land — no scoreboards, no guilt.",
    gradient: 'heroLilac',
    owl: 'wink',
    owlCategory: 'work',
  },
  {
    eyebrow: 'One tap',
    title: 'Pick a category, start the clock.',
    body: 'Work, learning, creative, health — tap one and Tocky tracks it in the background. Switch anytime without losing a second.',
    gradient: 'heroMint',
    owl: 'curious',
    owlCategory: 'learning',
    illustration: 'categories',
  },
  {
    eyebrow: 'Insights',
    title: 'See where your hours land.',
    body: 'Every week Tocky shows your patterns — gently. Your data stays on your device.',
    gradient: 'heroBlush',
    owl: 'happy',
    illustration: 'hours',
  },
];

export function OnboardingScreen({
  onDone,
  onSignIn,
}: {
  onDone: () => void;
  onSignIn: () => void;
}) {
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const [paneIndex, setPaneIndex] = useState(0);

  function showPane(index: number): void {
    setPaneIndex(index);
    pager.current?.scrollTo({ x: index * width, animated: true });
    announcePane(index);
  }

  function syncPaneToScroll(event: NativeSyntheticEvent<NativeScrollEvent>): void {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index === paneIndex) return;

    setPaneIndex(index);
    announcePane(index);
  }

  return (
    <ScrollView
      ref={pager}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={syncPaneToScroll}
      style={{ flex: 1 }}
      testID="onboarding-pager"
    >
      {PANES.map((pane, index) => (
        <View
          key={pane.eyebrow}
          testID={`onboarding-pane-${index}`}
          accessibilityElementsHidden={index !== paneIndex}
          importantForAccessibility={index === paneIndex ? 'auto' : 'no-hide-descendants'}
          style={{ width }}
        >
          <OnboardingPane
            pane={pane}
            isLastPane={index === PANES.length - 1}
            onSkip={onDone}
            onNext={() => showPane(index + 1)}
            onDone={onDone}
            onSignIn={onSignIn}
            activePaneIndex={paneIndex}
          />
        </View>
      ))}
    </ScrollView>
  );
}

function OnboardingPane({
  pane,
  activePaneIndex,
  isLastPane,
  onSkip,
  onNext,
  onDone,
  onSignIn,
}: {
  pane: Pane;
  activePaneIndex: number;
  isLastPane: boolean;
  onSkip: () => void;
  onNext: () => void;
  onDone: () => void;
  onSignIn: () => void;
}) {
  const theme = useTheme();

  return (
    <Screen
      scrollable
      gradient={pane.gradient}
      gap="xl"
      contentStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        {!isLastPane && <Button label="Skip" variant="ghost" size="small" onPress={onSkip} />}
      </View>

      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xl }}
      >
        <TockyOwl
          expression={pane.owl}
          bodyColor={hueOf(pane.owlCategory, theme.color.accent)}
          size={HERO_OWL_SIZE}
        />
        {pane.illustration === 'categories' && <CategoryCluster />}
        {pane.illustration === 'hours' && <HoursBars />}
      </View>

      <Card gap="lg">
        <Surface
          background="accentTint"
          radius="pill"
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
          }}
        >
          <Text variant="overline" color="accentOnTint">
            {pane.eyebrow}
          </Text>
        </Surface>

        <View style={{ gap: theme.spacing.md }}>
          <Text variant="title" accessibilityRole="header">
            {pane.title}
          </Text>
          <Text variant="bodyMedium" color="textSecondary">
            {pane.body}
          </Text>
        </View>

        <PaneDots activeIndex={activePaneIndex} />

        {isLastPane ? (
          <>
            <Button label="Get started" size="large" fullWidth onPress={onDone} />
            <Button
              label="I already have an account"
              variant="ghost"
              size="small"
              fullWidth
              onPress={() => {
                onDone();
                onSignIn();
              }}
            />
          </>
        ) : (
          <Button label="Next" size="large" fullWidth onPress={onNext} />
        )}
      </Card>
    </Screen>
  );
}

function CategoryCluster() {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', gap: theme.spacing.md }}
    >
      {CLUSTER_ICONS.map((icon) => (
        <CategoryTile
          key={icon}
          icon={icon}
          color={hueOf(icon, theme.color.accent)}
          size={CLUSTER_TILE_SIZE}
        />
      ))}
    </View>
  );
}

function HoursBars() {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.md }}
    >
      {HOURS_BARS.map((bar) => (
        <Surface
          key={bar.icon}
          radius="sm"
          style={{
            width: BAR_WIDTH,
            height: bar.height,
            backgroundColor: hueOf(bar.icon, theme.color.accent),
          }}
        />
      ))}
    </View>
  );
}

function announcePane(index: number): void {
  const pane = PANES[index];
  if (pane === undefined) return;

  AccessibilityInfo.announceForAccessibility(`${pane.title} Step ${index + 1} of ${PANES.length}.`);
}

function PaneDots({ activeIndex }: { activeIndex: number }) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${activeIndex + 1} of ${PANES.length}`}
      accessibilityValue={{ min: 1, max: PANES.length, now: activeIndex + 1 }}
      style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.sm }}
    >
      {PANES.map((pane, index) => (
        <Surface
          key={pane.eyebrow}
          radius="pill"
          background={index === activeIndex ? 'accent' : 'track'}
          style={{ width: index === activeIndex ? ACTIVE_DOT_WIDTH : DOT_SIZE, height: DOT_SIZE }}
        />
      ))}
    </View>
  );
}
