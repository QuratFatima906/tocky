import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/renderWithProviders';

import HomeScreen from '../index';

describe('HomeScreen', () => {
  it('renders the app name as a header', async () => {
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByRole('header', { name: 'Tocky' })).toBeTruthy();
  });

  it('offers a route into the design gallery while developing', async () => {
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Open design gallery')).toBeTruthy();
  });
});
