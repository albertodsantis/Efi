import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Hides the native splash screen with a fade-out.
 * No-op on web — only runs on native iOS/Android.
 */
export async function hideSplashScreen(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (error) {
    console.warn('Failed to hide SplashScreen:', error);
  }
}
