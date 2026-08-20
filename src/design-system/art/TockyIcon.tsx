import { memo, type ReactNode } from 'react';
import Svg, { Circle, Defs, G, Mask, Path, Polygon, Rect } from 'react-native-svg';

import { DecorativeArtwork } from './DecorativeArtwork';

export const TOCKY_ICON_NAMES = [
  'work',
  'learning',
  'personal',
  'health',
  'creative',
  'social',
  'home',
  'history',
  'insights',
  'tasks',
  'start',
  'stop',
  'pause',
  'switch',
  'add',
  'edit',
] as const;

export type TockyIconName = (typeof TOCKY_ICON_NAMES)[number];

type TockyIconProps = {
  name: TockyIconName;
  color: string;
  size: number;
  testID?: string;
};

const VIEW_BOX = '0 0 24 24';

const MASK_SHOW = '#FFFFFF';
const MASK_HIDE = '#000000';

function CutoutGlyph({
  maskId,
  cutouts,
  children,
}: {
  maskId: string;
  cutouts: ReactNode;
  children: ReactNode;
}) {
  return (
    <G>
      <Defs>
        <Mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
          <Rect x={0} y={0} width={24} height={24} fill={MASK_SHOW} />
          {cutouts}
        </Mask>
      </Defs>
      <G mask={`url(#${maskId})`}>{children}</G>
    </G>
  );
}

function IconGlyph({ name, color }: { name: TockyIconName; color: string }) {
  switch (name) {
    case 'work':
      return (
        <CutoutGlyph
          maskId="work"
          cutouts={
            <>
              <Rect x={10.7} y={6.7} width={2.6} height={3.3} rx={1.3} fill={MASK_HIDE} />
              <Rect x={10.4} y={12.3} width={3.2} height={3} rx={1.3} fill={MASK_HIDE} />
            </>
          }
        >
          <Rect x={8.5} y={4.5} width={7} height={5.5} rx={2.5} fill={color} />
          <Rect x={3} y={8} width={18} height={12} rx={3.4} fill={color} />
        </CutoutGlyph>
      );
    case 'learning':
      return (
        <CutoutGlyph
          maskId="learning"
          cutouts={
            <>
              <Rect x={8.4} y={7.4} width={8.4} height={1.7} rx={0.85} fill={MASK_HIDE} />
              <Rect x={8.4} y={10.6} width={8.4} height={1.7} rx={0.85} fill={MASK_HIDE} />
              <Rect x={8.4} y={13.8} width={5} height={1.7} rx={0.85} fill={MASK_HIDE} />
            </>
          }
        >
          <Rect x={5} y={4} width={14} height={16} rx={2.6} fill={color} />
        </CutoutGlyph>
      );
    case 'personal':
      return (
        <G>
          <Circle cx={12} cy={8} r={3.7} fill={color} />
          <Path d="M4.5 20 Q4.5 13.4 12 13.4 Q19.5 13.4 19.5 20 Z" fill={color} />
        </G>
      );
    case 'health':
      return (
        <Path
          d="M12 20.6 C4 15 3 9.6 6.6 7 C9.1 5.2 11 6.9 12 8.7 C13 6.9 14.9 5.2 17.4 7 C21 9.6 20 15 12 20.6 Z"
          fill={color}
        />
      );
    case 'creative':
      return (
        <Path
          d="M12 2.5 C12.8 8 16 11.2 21.5 12 C16 12.8 12.8 16 12 21.5 C11.2 16 8 12.8 2.5 12 C8 11.2 11.2 8 12 2.5 Z"
          fill={color}
        />
      );
    case 'social':
      return (
        <G>
          <CutoutGlyph
            maskId="social"
            cutouts={<Rect x={9.5} y={9.5} width={12.5} height={9.5} rx={3.4} fill={MASK_HIDE} />}
          >
            <Path
              d="M3 8.5 Q3 5 6.5 5 L13.5 5 Q17 5 17 8.5 L17 11 Q17 14.5 13.5 14.5 L8.5 14.5 L5.5 17.2 L5.5 14.5 Q3 14.3 3 11 Z"
              fill={color}
            />
          </CutoutGlyph>
          <Path
            d="M11 12 Q11 10.2 12.8 10.2 L18.6 10.2 Q20.4 10.2 20.4 12 L20.4 14.4 Q20.4 16.2 18.6 16.2 L16 16.2 L18.6 18.6 L18.6 16.2 Q11 16.2 11 14.4 Z"
            fill={color}
          />
        </G>
      );
    case 'home':
      return (
        <CutoutGlyph
          maskId="home"
          cutouts={<Rect x={10} y={14} width={4} height={6} rx={1.2} fill={MASK_HIDE} />}
        >
          <Path
            d="M12 3 L21 11.2 L18.4 11.2 L18.4 20 L5.6 20 L5.6 11.2 L3 11.2 Z"
            fill={color}
            stroke={color}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </CutoutGlyph>
      );
    case 'history':
      return (
        <CutoutGlyph
          maskId="history"
          cutouts={
            <>
              <Rect x={11.2} y={6.5} width={1.7} height={6.4} rx={0.85} fill={MASK_HIDE} />
              <Rect x={12} y={11.2} width={5} height={1.7} rx={0.85} fill={MASK_HIDE} />
              <Circle cx={12} cy={12} r={1.5} fill={MASK_HIDE} />
            </>
          }
        >
          <Circle cx={12} cy={12} r={9} fill={color} />
        </CutoutGlyph>
      );
    case 'insights':
      return (
        <G>
          <Rect x={4} y={12} width={4} height={8} rx={2} fill={color} />
          <Rect x={10} y={8} width={4} height={12} rx={2} fill={color} />
          <Rect x={16} y={4} width={4} height={16} rx={2} fill={color} />
        </G>
      );
    case 'tasks':
      return (
        <CutoutGlyph
          maskId="tasks"
          cutouts={
            <Path
              d="M7.8 12.4 L10.8 15.4 L16.4 9"
              fill="none"
              stroke={MASK_HIDE}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          }
        >
          <Circle cx={12} cy={12} r={9} fill={color} />
        </CutoutGlyph>
      );
    case 'start':
      return (
        <Polygon
          points="8,5.5 19,12 8,18.5"
          fill={color}
          stroke={color}
          strokeWidth={2.6}
          strokeLinejoin="round"
        />
      );
    case 'stop':
      return <Rect x={6} y={6} width={12} height={12} rx={3.6} fill={color} />;
    case 'pause':
      return (
        <G>
          <Rect x={7} y={5} width={3.6} height={14} rx={1.8} fill={color} />
          <Rect x={13.4} y={5} width={3.6} height={14} rx={1.8} fill={color} />
        </G>
      );
    case 'switch':
      return (
        <G
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M4 9 L17 9" />
          <Path d="M14 6 L17 9 L14 12" />
          <Path d="M20 15 L7 15" />
          <Path d="M10 12 L7 15 L10 18" />
        </G>
      );
    case 'add':
      return (
        <G>
          <Rect x={10.7} y={4} width={2.6} height={16} rx={1.3} fill={color} />
          <Rect x={4} y={10.7} width={16} height={2.6} rx={1.3} fill={color} />
        </G>
      );
    case 'edit':
      return (
        <CutoutGlyph
          maskId="edit"
          cutouts={
            <Rect
              x={13.4}
              y={6.2}
              width={4.2}
              height={1.7}
              rx={0.85}
              fill={MASK_HIDE}
              transform="rotate(45 15.5 7)"
            />
          }
        >
          <Polygon
            points="5,19 5,15.4 15.6,4.8 18.6,7.8 8,18.4"
            fill={color}
            stroke={color}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </CutoutGlyph>
      );
  }
}

export const TockyIcon = memo(function TockyIcon({
  name,
  color,
  size,
  testID = `tocky-icon-${name}`,
}: TockyIconProps) {
  return (
    <DecorativeArtwork width={size} height={size} testID={testID}>
      <Svg width={size} height={size} viewBox={VIEW_BOX}>
        <IconGlyph name={name} color={color} />
      </Svg>
    </DecorativeArtwork>
  );
});
