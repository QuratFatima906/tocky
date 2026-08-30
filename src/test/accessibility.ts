import { isHiddenFromAccessibility, screen } from '@testing-library/react-native';

import { MINIMUM_TOUCH_TARGET } from '@/design-system';

/**
 * What VoiceOver needs from anything a person can act on, read off the rendered
 * tree rather than the source. Screens compose from the design system, but the
 * places that build a pressable by hand are the ones that drift.
 *
 * Size is read from the style, not from layout, because nothing is laid out
 * under Jest. That catches a target pinned too small -- which is how they are
 * almost always written -- and says nothing about one sized by its content.
 */
export type AccessibilityGap = {
  readonly what: string;
  readonly problem: 'no label' | 'no role' | 'target under 44pt';
};

type RenderedElement = NonNullable<typeof screen.root>;

const INTERACTIVE_ROLES = new Set(['button', 'checkbox', 'link', 'radio', 'switch', 'tab']);

/**
 * `Pressable` keeps `onPress` to itself and hands the host view responder
 * handlers instead, so a pressable is recognised by those rather than by the
 * prop that was written.
 */
function isInteractive(element: RenderedElement): boolean {
  const { accessibilityRole, accessible, onStartShouldSetResponder, role } = element.props;
  const declaredRole: unknown = accessibilityRole ?? role;

  if (typeof declaredRole === 'string' && INTERACTIVE_ROLES.has(declaredRole)) return true;

  return typeof onStartShouldSetResponder === 'function' && accessible !== false;
}

function flattenedStyle(element: RenderedElement): Record<string, unknown> {
  const style: unknown = element.props.style;
  const parts: unknown[] = Array.isArray(style) ? style.flat(Infinity) : [style];

  return Object.assign({}, ...parts.filter((part) => typeof part === 'object' && part !== null));
}

/** A dimension pinned smaller than the minimum, once any hit slop is added. */
function pinnedTooSmall(element: RenderedElement): boolean {
  const style = flattenedStyle(element);
  const { hitSlop } = element.props as { hitSlop?: number };
  const slop = typeof hitSlop === 'number' ? hitSlop * 2 : 0;

  return (['width', 'height'] as const).some((side) => {
    const pinned = style[side] ?? style[side === 'width' ? 'minWidth' : 'minHeight'];
    return typeof pinned === 'number' && pinned + slop < MINIMUM_TOUCH_TARGET;
  });
}

function describeElement(element: RenderedElement): string {
  const { accessibilityLabel, accessibilityRole, testID } = element.props;
  const named: unknown = accessibilityLabel ?? testID;

  return typeof named === 'string' ? named : `<${element.type} role=${accessibilityRole}>`;
}

/** Nothing rendered, or rendered and unmounted again, leaves nothing to audit. */
function renderedTree(): RenderedElement | null {
  return screen.isDetached === true ? null : (screen.root ?? null);
}

export function findAccessibilityGaps(): readonly AccessibilityGap[] {
  const tree = renderedTree();
  if (tree === null) return [];

  const gaps: AccessibilityGap[] = [];

  for (const element of tree.queryAll(isInteractive)) {
    if (isHiddenFromAccessibility(element)) continue;

    const { accessibilityLabel, accessibilityRole, role } = element.props;
    const what = describeElement(element);

    if (typeof accessibilityLabel !== 'string' || accessibilityLabel.trim() === '') {
      gaps.push({ what, problem: 'no label' });
    }
    if (accessibilityRole === undefined && role === undefined) {
      gaps.push({ what, problem: 'no role' });
    }
    if (pinnedTooSmall(element)) gaps.push({ what, problem: 'target under 44pt' });
  }

  return gaps;
}

/** Reads as the list of what is wrong when it fails, rather than as `false`. */
export function expectNoAccessibilityGaps(): void {
  expect(findAccessibilityGaps()).toEqual([]);
}
