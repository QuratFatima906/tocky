import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/renderWithProviders';

import HomeScreen from '../app/index';

describe('HomeScreen', () => {
  it('renders the app name as a header', async () => {
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByRole('header', { name: 'Tocky' })).toBeTruthy();
  });
});
