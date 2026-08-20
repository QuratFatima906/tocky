import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../index';

describe('HomeScreen', () => {
  it('renders the app name as a header', async () => {
    await render(<HomeScreen />);
    expect(screen.getByRole('header', { name: 'Tocky' })).toBeTruthy();
  });
});
