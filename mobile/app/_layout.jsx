import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts } from 'expo-font';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import { colors } from '../src/theme.js';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60 * 1000 },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.ivory }} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
          <AuthProvider>
            <StatusBar style="dark" backgroundColor={colors.ivory} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" options={{ presentation: 'modal' }} />
              <Stack.Screen name="register" options={{ presentation: 'modal' }} />
              <Stack.Screen name="hotel/[id]" options={{ headerShown: true, title: '' }} />
              <Stack.Screen name="package/[id]" options={{ headerShown: true, title: '' }} />
              <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Review & confirm' }} />
              <Stack.Screen name="booking/[id]/hold" options={{ headerShown: true, title: 'Booking hold' }} />
              <Stack.Screen name="booking/[id]/pay" options={{ headerShown: true, title: 'Payment' }} />
              <Stack.Screen name="booking/[id]/confirmation" options={{ headerShown: true, title: 'Confirmation' }} />
            </Stack>
          </AuthProvider>
        </StripeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
