import { CATEGORY_PRESETS } from '@/design-system';
import type { Category } from '@/domain';

export const DEFAULT_CATEGORIES: readonly Category[] = CATEGORY_PRESETS.map((preset) => ({
  id: preset.icon,
  name: preset.name,
  icon: preset.icon,
  color: preset.hue,
  isArchived: false,
}));
