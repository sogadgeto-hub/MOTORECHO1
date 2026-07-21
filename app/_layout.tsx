import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/lib/auth';
import { SubscriptionEngineProvider } from '@/lib/subscription-engine/context';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { Animation } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';
import { isBetaDiagnosticsEnabled } from '@/lib/beta-diagnostics';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading || (user && !profile)) {
    return <AppLoadingScreen />;
  }

  const stackOptions = {
    headerShown: false,
    animation: 'slide_from_right' as const,
    animationDuration: Animation.normal,
  };

  return (
    <SubscriptionEngineProvider userId={user?.id}>
      {!user ? (
        <Stack screenOptions={stackOptions}>
          <Stack.Screen name="splash" options={{ headerShown: false, animation: 'fade', animationDuration: Animation.normal }} />
          <Stack.Screen name="plans" options={{ headerShown: false, animation: 'fade', animationDuration: Animation.normal }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        </Stack>
      ) : profile && !profile.onboarding_completed ? (
        <Stack
          screenOptions={stackOptions}
          initialRouteName={
            isBetaDiagnosticsEnabled() || profile.plan_type === 'free'
              ? 'vehicle-setup'
              : 'payment'
          }
        >
          <Stack.Screen name="vehicle-setup" options={{ headerShown: false }} />
          <Stack.Screen name="payment" options={{ headerShown: false }} />
        </Stack>
      ) : (
        <Stack screenOptions={stackOptions}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade', animationDuration: Animation.fast }} />
          <Stack.Screen name="recording" options={{ headerShown: false }} />
          <Stack.Screen name="processing" options={{ headerShown: false, animation: 'fade', animationDuration: Animation.normal }} />
          <Stack.Screen name="result" options={{ headerShown: false }} />
          <Stack.Screen name="premium" options={{ headerShown: false }} />
          <Stack.Screen name="add-vehicle" options={{ headerShown: false }} />
          <Stack.Screen name="vehicle-health" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          {isBetaDiagnosticsEnabled() ? (
            <Stack.Screen name="beta-diagnostics" options={{ headerShown: false }} />
          ) : null}
          <Stack.Screen name="+not-found" />
        </Stack>
      )}
    </SubscriptionEngineProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'HankenGrotesk-Regular': HankenGrotesk_400Regular,
    'HankenGrotesk-Medium': HankenGrotesk_500Medium,
    'HankenGrotesk-SemiBold': HankenGrotesk_600SemiBold,
    'HankenGrotesk-Bold': HankenGrotesk_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <I18nProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </AuthProvider>
    </I18nProvider>
  );
}
