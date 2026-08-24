import { View } from 'react-native';

import { TockyIcon, TOCKY_ICON_NAMES, type TockyIconName } from '../art';
import { useTheme } from '../theme/ThemeProvider';
import { tileRadius } from '../tokens';

const FALLBACK_ICON: TockyIconName = 'work';
const GLYPH_TO_TILE_RATIO = 0.5;

export type CategoryTileProps = {
  icon: string;
  color: string;
  size: number;
  testID?: string;
};

export function categoryIconName(icon: string): TockyIconName {
  return TOCKY_ICON_NAMES.find((name) => name === icon) ?? FALLBACK_ICON;
}

export function CategoryTile({ icon, color, size, testID }: CategoryTileProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: tileRadius(size),
        backgroundColor: theme.category.surface(color),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TockyIcon
        name={categoryIconName(icon)}
        color={theme.category.glyph(color)}
        size={Math.round(size * GLYPH_TO_TILE_RATIO)}
      />
    </View>
  );
}
