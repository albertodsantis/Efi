import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.efi.crm',
  appName: 'Efi',
  webDir: 'apps/web/dist',
  server: {
    // During development, point to Railway so the app uses the live backend.
    // Comment this out when building for production app store releases
    // (the built frontend will be bundled into the native app instead).
    // url: 'https://efi.up.railway.app',
    // allowNavigation: ['efi.up.railway.app'],
  },
};

export default config;
