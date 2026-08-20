import { act, fireEvent, screen } from '@testing-library/react-native';

import { CATEGORY_PRESETS, OWL_EXPRESSIONS, TOCKY_ICON_NAMES } from '@/design-system';
import { INCLUDING_HIDDEN, renderWithProviders } from '@/test/renderWithProviders';

import { ArtGallery } from '../ArtGallery';

async function renderGallery() {
  await renderWithProviders(<ArtGallery />);
}

describe('ArtGallery', () => {
  it('shows every owl expression', async () => {
    await renderGallery();
    for (const expression of OWL_EXPRESSIONS) {
      expect(
        screen.getAllByTestId(`tocky-owl-${expression}`, INCLUDING_HIDDEN).length,
      ).toBeGreaterThan(0);
    }
  });

  it('shows every icon in the set', async () => {
    await renderGallery();
    for (const name of TOCKY_ICON_NAMES) {
      expect(screen.getAllByTestId(`tocky-icon-${name}`, INCLUDING_HIDDEN).length).toBeGreaterThan(
        0,
      );
    }
  });

  it('labels every category, so colour is never the only signal', async () => {
    await renderGallery();
    for (const preset of CATEGORY_PRESETS) {
      expect(screen.getAllByText(preset.name).length).toBeGreaterThan(0);
    }
  });

  it('switches theme when a scheme button is pressed', async () => {
    await renderGallery();
    const darkButton = screen.getByLabelText('Preview in dark theme');
    expect(darkButton.props.accessibilityState.selected).toBe(false);

    await act(async () => fireEvent.press(darkButton));

    expect(screen.getByLabelText('Preview in dark theme').props.accessibilityState.selected).toBe(
      true,
    );
  });
});
