let mockUuidCount = 0;

// expo-crypto's native module is auto-mocked to return undefined under Jest,
// which would hand every new session an undefined id without failing a thing.
jest.mock('expo-crypto', () => ({
  randomUUID: () => `00000000-0000-4000-8000-${String(++mockUuidCount).padStart(12, '0')}`,
}));

beforeEach(() => {
  mockUuidCount = 0;
});

export {};
