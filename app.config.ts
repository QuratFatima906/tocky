import type { ExpoConfig } from 'expo/config';

const NATIVE_SURFACES = {
  paper: '#FBFAF8',
  night: '#191720',
} as const;

const config: ExpoConfig = {
  name: 'Tocky',
  slug: 'tocky',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'tocky',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['assets/**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.tocky.app',
    buildNumber: '1',
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
    },
  },
  android: {
    package: 'com.tocky.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: NATIVE_SURFACES.paper,
    },
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-sqlite',
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: NATIVE_SURFACES.paper,
        dark: { image: './assets/splash-icon.png', backgroundColor: NATIVE_SURFACES.night },
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;

export { NATIVE_SURFACES };
