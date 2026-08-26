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
  useReportBottomChrome,
  type TockyIconName,
} from '@/design-system';

const usesLiquidGlass = isLiquidGlassAvailable();

const TAB_ICON_SIZE = 26;
const START_BUTTON_ICON_SIZE = 24;
const START_BUTTON_SIZE = 56;
const START_BUTTON_LIFT = 6;

export type TabBarRoute = { readonly key: string; readonly name: string };

export type TabBarState = {
  readonly index: number;
  readonly routes: readonly TabBarRoute[];
};

export type TabBarNavigation = {
  readonly navigate: (routeName: string) => void;
  readonly emit?: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
    defaultPrevented: boolean;
  };
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

  const shownTabs = state.routes.flatMap((route) => {
    const definition = TAB_DEFINITIONS.find((tab) => tab.name === route.name);
    return definition === undefined ? [] : [{ route, definition }];
  });
  const startButtonPosition = Math.ceil(shownTabs.length / 2);

  function selectTab(route: TabBarRoute) {
    const isActive = route.name === activeRouteName;
    const pressEvent = navigation.emit?.({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isActive && pressEvent?.defaultPrevented !== true) navigation.navigate(route.name);
  }

  return (
    <GlassView
      {...reportHeight}
      testID="tocky-tab-bar"
      accessibilityRole="tabbar"
      glassEffectStyle="regular"
      colorScheme={theme.scheme}
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
      {shownTabs.slice(0, startButtonPosition).map(({ route, definition }) => (
        <TabButton
          key={route.key}
          tab={definition}
          isActive={route.name === activeRouteName}
          onPress={() => selectTab(route)}
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
          <TockyIcon name="add" color={theme.color.textOnAccent} size={START_BUTTON_ICON_SIZE} />
        </LinearGradient>
      </PressableScale>

      {shownTabs.slice(startButtonPosition).map(({ route, definition }) => (
        <TabButton
          key={route.key}
          tab={definition}
          isActive={route.name === activeRouteName}
          onPress={() => selectTab(route)}
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
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={{
        minWidth: MINIMUM_TOUCH_TARGET,
        minHeight: MINIMUM_TOUCH_TARGET,
        alignItems: 'center',
        gap: theme.spacing.xs,
      }}
    >
      <TockyIcon
        name={tab.icon}
        color={isActive ? theme.color.accent : theme.color.textSecondary}
        size={TAB_ICON_SIZE}
      />
      <Text variant="tabLabel" color={isActive ? 'accent' : 'textSecondary'}>
        {tab.label}
      </Text>
    </PressableScale>
  );
}
