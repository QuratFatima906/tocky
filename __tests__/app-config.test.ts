import { existsSync } from 'node:fs';

import config, { NATIVE_SURFACES } from '../app.config';
import { palette } from '../src/design-system/tokens/palette';

describe('app config', () => {
  it('keeps native surface colors in step with the design system palette', () => {
    expect(NATIVE_SURFACES.paper).toBe(palette.paper);
    expect(NATIVE_SURFACES.night).toBe(palette.night);
  });

  /**
   * `android.adaptiveIcon.foregroundImage` named a file that had never existed.
   * Nothing failed, because Android is out of scope -- a prebuild for it would
   * have been the first thing to notice.
   */
  it('names only image files that exist', () => {
    const named = [
      config.icon,
      config.android?.adaptiveIcon?.foregroundImage,
      config.android?.adaptiveIcon?.backgroundImage,
      config.android?.adaptiveIcon?.monochromeImage,
      ...config.plugins!.flatMap((plugin) =>
        Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
          ? [
              (plugin[1] as { image?: string }).image,
              (plugin[1] as { dark?: { image?: string } }).dark?.image,
            ]
          : [],
      ),
    ].filter((path): path is string => typeof path === 'string');

    expect(named.length).toBeGreaterThan(3);
    expect(named.filter((path) => !existsSync(path))).toEqual([]);
  });

  it('bundles only the assets directory', () => {
    expect(config.assetBundlePatterns).toEqual(['assets/**/*']);
  });

  it('declares a privacy manifest for every required-reason API it touches', () => {
    const declaredApiTypes = (config.ios?.privacyManifests?.NSPrivacyAccessedAPITypes ?? []).map(
      (entry) => entry.NSPrivacyAccessedAPIType,
    );
    expect(declaredApiTypes).toEqual(
      expect.arrayContaining([
        'NSPrivacyAccessedAPICategoryFileTimestamp',
        'NSPrivacyAccessedAPICategoryUserDefaults',
        'NSPrivacyAccessedAPICategorySystemBootTime',
        'NSPrivacyAccessedAPICategoryDiskSpace',
      ]),
    );
    expect(config.ios?.privacyManifests?.NSPrivacyTracking).toBe(false);
  });

  it('declares no background mode it cannot exercise', () => {
    expect(config.ios?.infoPlist?.UIBackgroundModes).toBeUndefined();
  });

  it('follows the system appearance so dark mode works', () => {
    expect(config.userInterfaceStyle).toBe('automatic');
  });
});
