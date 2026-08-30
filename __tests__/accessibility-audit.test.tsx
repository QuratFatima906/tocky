import { screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { Button, IconButton, PressableScale } from '@/design-system';
import { findAccessibilityGaps } from '@/test/accessibility';
import { renderWithProviders } from '@/test/renderWithProviders';

/**
 * The audit runs after every test in the suite, so it has to be held to
 * catching something. It has already been silently right about nothing twice:
 * once written against a testing-library version that no longer had the method
 * it called, and once registered to run after the tree it audits was torn down.
 */

async function auditOf(element: React.ReactElement) {
  await renderWithProviders(element);
  const gaps = findAccessibilityGaps();
  // The global audit would fail this test over the gaps it was handed on purpose.
  await screen.unmount();

  return gaps;
}

describe('what the audit catches', () => {
  it('names a pressable that VoiceOver would announce as nothing', async () => {
    expect(
      await auditOf(
        <PressableScale onPress={jest.fn()}>
          <Text>Tap</Text>
        </PressableScale>,
      ),
    ).toContainEqual({ what: '<View role=undefined>', problem: 'no label' });
  });

  it('names a labelled control that carries no trait', async () => {
    expect(
      await auditOf(
        <PressableScale accessibilityLabel="Dismiss" onPress={jest.fn()}>
          <Text>×</Text>
        </PressableScale>,
      ),
    ).toContainEqual({ what: 'Dismiss', problem: 'no role' });
  });

  it('names a target pinned smaller than a thumb', async () => {
    expect(
      await auditOf(
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Tiny"
          onPress={jest.fn()}
          style={{ width: 20, height: 20 }}
        />,
      ),
    ).toContainEqual({ what: 'Tiny', problem: 'target under 44pt' });
  });

  it('counts hit slop towards the target, since a thumb cannot tell', async () => {
    expect(
      await auditOf(
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Small but reachable"
          onPress={jest.fn()}
          hitSlop={12}
          style={{ width: 20, height: 20 }}
        />,
      ),
    ).toEqual([]);
  });

  it('says nothing about a control sized by what is inside it', async () => {
    expect(
      await auditOf(
        <PressableScale accessibilityRole="button" accessibilityLabel="Grown" onPress={jest.fn()}>
          <Text>Wide enough</Text>
        </PressableScale>,
      ),
    ).toEqual([]);
  });
});

describe('what the audit leaves alone', () => {
  it('passes the design system, which carries labels and traits itself', async () => {
    expect(
      await auditOf(
        <View>
          <Button label="Save" onPress={jest.fn()} />
          <IconButton icon="delete" accessibilityLabel="Delete" onPress={jest.fn()} />
        </View>,
      ),
    ).toEqual([]);
  });

  it('ignores a control hidden from VoiceOver, which cannot be reached', async () => {
    expect(
      await auditOf(
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <PressableScale onPress={jest.fn()} style={{ width: 20, height: 20 }} />
        </View>,
      ),
    ).toEqual([]);
  });

  it('has nothing to say before anything is rendered', () => {
    expect(findAccessibilityGaps()).toEqual([]);
  });
});
