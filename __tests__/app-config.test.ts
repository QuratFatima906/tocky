import config from '../app.config';

describe('app config', () => {
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
