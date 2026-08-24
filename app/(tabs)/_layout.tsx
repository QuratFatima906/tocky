import { Tabs, useRouter } from 'expo-router';
import { View } from 'react-native';

import { BottomChromeProvider } from '@/features/navigation/BottomChrome';
import { NowTrackingHost } from '@/features/navigation/NowTrackingHost';
import { TAB_DEFINITIONS, TockyTabBar } from '@/features/navigation/TockyTabBar';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <BottomChromeProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={({ state, navigation }) => (
            <TockyTabBar
              state={state}
              navigation={navigation}
              onStartSession={() => router.push('/new-session')}
            />
          )}
        >
          {TAB_DEFINITIONS.map((tab) => (
            <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
          ))}
        </Tabs>

        <NowTrackingHost onOpenTimer={() => router.push('/timer')} />
      </View>
    </BottomChromeProvider>
  );
}
