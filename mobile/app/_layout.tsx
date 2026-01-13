// Polyfills are now loaded in index.js entry point before routes are evaluated
// This ensures Buffer is available when api.ts imports @solana/spl-token

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';

import "../global.css";
import { WalletProvider } from '../contexts/WalletContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    console.log('RootLayout mounted, fonts loaded:', loaded, 'error:', error);
  }, [loaded, error]);

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      // Don't throw, just log and continue
    }
  }, [error]);

  useEffect(() => {
    async function prepare() {
      if (loaded || error) {
        console.log('Hiding splash screen...');
        try {
          await SplashScreen.hideAsync();
          console.log('Splash screen hidden');
        } catch (e) {
          console.error('Error hiding splash:', e);
        }
        setAppReady(true);
      }
    }
    prepare();
  }, [loaded, error]);

  if (!appReady) {
    console.log('App not ready yet, showing loading...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001800' }}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    );
  }

  console.log('Rendering RootLayoutNav');
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  console.log('RootLayoutNav rendering');
  return (
    <WalletProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal',
              title: 'About Hellcoin',
            }} 
          />
        </Stack>
      </ThemeProvider>
    </WalletProvider>
  );
}
