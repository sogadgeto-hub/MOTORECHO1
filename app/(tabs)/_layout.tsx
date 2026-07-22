import { Tabs } from 'expo-router';
import { Car, Mic, BarChart3, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MD3Colors } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { TAB_BAR_BODY_HEIGHT } from '@/hooks/useScreenInsets';

export default function TabLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_BODY_HEIGHT + insets.bottom + 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(8,15,16,0.98)',
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.5,
          shadowRadius: 30,
          elevation: 20,
        },
        tabBarActiveTintColor: MD3Colors.primaryFixed,
        tabBarInactiveTintColor: MD3Colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: 'HankenGrotesk-Medium',
          fontSize: 11,
          lineHeight: 16,
        },
        tabBarActiveBackgroundColor: 'rgba(0,242,255,0.08)',
        tabBarItemStyle: {
          borderRadius: 999,
          marginHorizontal: 4,
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.garage,
          tabBarIcon: ({ size, color }) => <Car size={size} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: t.tabs.scan,
          tabBarIcon: ({ size, color }) => <Mic size={size} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.tabs.history,
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}
