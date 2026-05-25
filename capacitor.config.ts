import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kcal.tracker',
  appName: 'Kcal Tracker',
  // webDir wskazuje na pusty folder placeholder — używamy server.url do wskazania produkcyjnej apki
  webDir: 'capacitor-www',
  // Aplikacja działa jako webview ładujący zdalny URL.
  // Zmień przed buildem produkcyjnym na: https://twoja-domena.com
  server: {
    // url: 'https://kcal-tracker.vercel.app',
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#FFFFFF',
    // limitsNavigationsToAppBoundDomains: true wymusza WKAppBoundDomains z Info.plist
    limitsNavigationsToAppBoundDomains: false,
    scheme: 'KcalTracker',
  },
  // Splash screen settings (configured via @capacitor/splash-screen plugin if installed)
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      iosSpinnerStyle: 'small',
      spinnerColor: '#0A0A0A',
    },
  },
};

export default config;
