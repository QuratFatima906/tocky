import { cleanup } from '@testing-library/react-native';

import { expectNoAccessibilityGaps } from '@/test/accessibility';

let mockUuidCount = 0;

// expo-crypto's native module is auto-mocked to return undefined under Jest,
// which would hand every new session an undefined id without failing a thing.
jest.mock('expo-crypto', () => ({
  randomUUID: () => `00000000-0000-4000-8000-${String(++mockUuidCount).padStart(12, '0')}`,
}));

beforeEach(() => {
  mockUuidCount = 0;
});

// Every rendered tree in the suite is held to what VoiceOver needs, so a
// control added without a label fails the test that rendered it rather than
// waiting for someone to write an accessibility test for that screen.
afterEach(async () => {
  expectNoAccessibilityGaps();
  await cleanup();
});

export {};
