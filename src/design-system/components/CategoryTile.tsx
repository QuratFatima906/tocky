import { View } from 'react-native';

import { TockyIcon, TOCKY_ICON_NAMES, type TockyIconName } from '../art';
import { useTheme } from '../theme/ThemeProvider';
import { tileRadius } from '../tokens';

const DEFAULT_TILE_SIZE = 38;
const GLYPH_TO_TILE_RATIO = 0.5;

export type CategoryTileProps = {
  icon: string | undefined;
  color: string;
  size?: number;
  testID?: string;
};

export function categoryIconName(icon: string | undefined): TockyIconName | null {
  return TOCKY_ICON_NAMES.find((name) => name === icon) ?? null;
}

export function CategoryTile({ icon, color, size = DEFAULT_TILE_SIZE, testID }: CategoryTileProps) {
  const theme = useTheme();
  const glyph = categoryIconName(icon);

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
      {glyph !== null && (
        <TockyIcon
          name={glyph}
          color={theme.category.glyph(color)}
          size={Math.round(size * GLYPH_TO_TILE_RATIO)}
        />
      )}
    </View>
  );
}
