import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.efi.crm',
  appName: 'Efi',
  webDir: 'apps/web/dist',
  server: {
    // During development, point to Railway so the app uses the live backend.
    // Comment this out when building for production app store releases
    // (the built frontend will be bundled into the native app instead).
    // url: 'https://efidesk.com',
    // allowNavigation: ['efidesk.com'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false, // hidden manually via SplashScreen.hide() to control timing
      backgroundColor: '#09090b',
      // Android: place splash.png files in each drawable-port-* density folder:
      //   drawable-port-ldpi/splash.png    (200×320)
      //   drawable-port-mdpi/splash.png    (320×480)
      //   drawable-port-hdpi/splash.png    (480×800)
      //   drawable-port-xhdpi/splash.png   (720×1280)
      //   drawable-port-xxhdpi/splash.png  (960×1600)
      //   drawable-port-xxxhdpi/splash.png (1280×1920)
      // Background: #09090b with the Efi logo centered.
      // iOS: place images in ios/App/App/Assets.xcassets/Splash.imageset/
      //   splash-2732x2732.png (1×), splash-2732x2732-2.png (2×), splash-2732x2732-1.png (3×)
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
