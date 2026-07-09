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
import { View, ActivityIndicator } from 'react-native';
import { MD3Colors } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: MD3Colors.background }}>
        <ActivityIndicator size="large" color={MD3Colors.primaryFixedDim} />
      </View>
    );
  }

  // Not authenticated — splash → plans → auth flow
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="plans" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    );
  }

  // Authenticated but needs vehicle setup
  if (profile && !profile.onboarding_completed) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="payment" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="vehicle-setup" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    );
  }

  // Fully authenticated and onboarded
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="recording" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="processing" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="result" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="premium" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="add-vehicle" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
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
