import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  MINIMUM_TOUCH_TARGET,
  PressableScale,
  Text,
  TockyIcon,
  radius,
  useTheme,
  type TockyIconName,
} from '@/design-system';

import { useReportBottomChrome } from './BottomChrome';

const usesLiquidGlass = isLiquidGlassAvailable();

const TAB_ICON_SIZE = 26;
const START_BUTTON_SIZE = 56;
const START_BUTTON_LIFT = 6;
const INACTIVE_OPACITY = 0.5;

export type TabBarState = {
  readonly index: number;
  readonly routes: readonly { readonly name: string }[];
};

export type TabBarNavigation = {
  readonly navigate: (routeName: string) => void;
};

export type TabDefinition = {
  readonly name: string;
  readonly label: string;
  readonly icon: TockyIconName;
};

export const TAB_DEFINITIONS: readonly TabDefinition[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'history', label: 'History', icon: 'history' },
  { name: 'insights', label: 'Insights', icon: 'insights' },
  { name: 'tasks', label: 'Tasks', icon: 'tasks' },
];

export function TockyTabBar({
  state,
  navigation,
  onStartSession,
}: {
  state: TabBarState;
  navigation: TabBarNavigation;
  onStartSession: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reportHeight = useReportBottomChrome('tabBar');
  const activeRouteName = state.routes[state.index]?.name;

  const tabsBeforeStartButton = TAB_DEFINITIONS.slice(0, 2);
  const tabsAfterStartButton = TAB_DEFINITIONS.slice(2);

  return (
    <GlassView
      {...reportHeight}
      testID="tocky-tab-bar"
      glassEffectStyle="regular"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        paddingTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: insets.bottom,
        ...(usesLiquidGlass ? {} : { backgroundColor: theme.color.surfaceTranslucent }),
        borderTopWidth: 1,
        borderTopColor: theme.color.borderSubtle,
      }}
    >
      {tabsBeforeStartButton.map((tab) => (
        <TabButton
          key={tab.name}
          tab={tab}
          isActive={tab.name === activeRouteName}
          onPress={() => navigation.navigate(tab.name)}
        />
      ))}

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Start a new session"
        onPress={onStartSession}
        style={{ marginTop: -START_BUTTON_LIFT }}
      >
        <LinearGradient
          colors={[...theme.gradient.accentCompact.colors] as [string, string]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{
            width: START_BUTTON_SIZE,
            height: START_BUTTON_SIZE,
            borderRadius: radius.xl,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.elevation.glow,
          }}
        >
          <TockyIcon name="add" color={theme.color.textOnAccent} size={TAB_ICON_SIZE} />
        </LinearGradient>
      </PressableScale>

      {tabsAfterStartButton.map((tab) => (
        <TabButton
          key={tab.name}
          tab={tab}
          isActive={tab.name === activeRouteName}
          onPress={() => navigation.navigate(tab.name)}
        />
      ))}
    </GlassView>
  );
}

function TabButton({
  tab,
  isActive,
  onPress,
}: {
  tab: TabDefinition;
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <PressableScale
      accessible
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={{
        minWidth: MINIMUM_TOUCH_TARGET,
        minHeight: MINIMUM_TOUCH_TARGET,
        alignItems: 'center',
        gap: theme.spacing.xs,
        opacity: isActive ? 1 : INACTIVE_OPACITY,
      }}
    >
      <TockyIcon
        name={tab.icon}
        color={isActive ? theme.color.accent : theme.color.text}
        size={TAB_ICON_SIZE}
      />
      <Text variant="tabLabel" color={isActive ? 'accent' : 'text'}>
        {tab.label}
      </Text>
    </PressableScale>
  );
}
