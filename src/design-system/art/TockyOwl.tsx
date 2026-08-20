import { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Text as SvgText } from 'react-native-svg';

import { DecorativeArtwork } from './DecorativeArtwork';
import { shade } from '../tokens/contrast';
import { palette } from '../tokens/palette';

export const OWL_EXPRESSIONS = ['curious', 'happy', 'sleepy', 'surprised', 'wink'] as const;

export type OwlExpression = (typeof OWL_EXPRESSIONS)[number];

type TockyOwlProps = {
  expression?: OwlExpression;
  bodyColor?: string;
  accentColor?: string;
  beakColor?: string;
  size: number;
  testID?: string;
};

const ASPECT_RATIO = 134 / 128;
const PUPIL_COLOR = '#403A4D';
const EYE_WHITE = '#FFFFFF';

const BODY_DARK_AMOUNT = -0.16;
const BELLY_AMOUNT = 0.58;
const EYE_RING_AMOUNT = 0.42;
const BEAK_DARK_AMOUNT = -0.22;

export const TockyOwl = memo(function TockyOwl({
  expression = 'curious',
  bodyColor = palette.pinkPale,
  accentColor = palette.pink,
  beakColor = palette.warning,
  size,
  testID = `tocky-owl-${expression}`,
}: TockyOwlProps) {
  const bodyDark = shade(bodyColor, BODY_DARK_AMOUNT);
  const belly = shade(bodyColor, BELLY_AMOUNT);
  const eyeRing = shade(accentColor, EYE_RING_AMOUNT);
  const beakDark = shade(beakColor, BEAK_DARK_AMOUNT);

  const showsLeftPupil =
    expression === 'curious' || expression === 'surprised' || expression === 'wink';
  const showsRightPupil = expression === 'curious' || expression === 'surprised';

  return (
    <DecorativeArtwork width={size} height={size * ASPECT_RATIO} testID={testID}>
      <Svg width={size} height={size * ASPECT_RATIO} viewBox="0 0 128 134">
        <Ellipse cx={55} cy={119} rx={7.5} ry={5} fill={beakColor} />
        <Ellipse cx={73} cy={119} rx={7.5} ry={5} fill={beakColor} />

        <Path d="M40 34 Q45 12 53 34 Z" fill={bodyDark} />
        <Path d="M88 34 Q83 12 75 34 Z" fill={bodyDark} />

        <Ellipse cx={64} cy={74} rx={50} ry={48} fill={bodyColor} />

        <Ellipse cx={18} cy={80} rx={10} ry={21} fill={bodyDark} transform="rotate(13 18 80)" />
        <Ellipse cx={110} cy={80} rx={10} ry={21} fill={bodyDark} transform="rotate(-13 110 80)" />

        <Ellipse cx={64} cy={86} rx={29} ry={25} fill={belly} />

        <Circle cx={48} cy={61} r={18} fill={eyeRing} />
        <Circle cx={80} cy={61} r={18} fill={eyeRing} />
        <Circle cx={48} cy={61} r={14} fill={EYE_WHITE} />
        <Circle cx={80} cy={61} r={14} fill={EYE_WHITE} />

        {showsLeftPupil && (
          <G>
            <Circle cx={48} cy={61.5} r={6.8} fill={PUPIL_COLOR} />
            <Circle cx={45.4} cy={58.6} r={2.5} fill={EYE_WHITE} />
          </G>
        )}
        {showsRightPupil && (
          <G>
            <Circle cx={80} cy={61.5} r={6.8} fill={PUPIL_COLOR} />
            <Circle cx={77.4} cy={58.6} r={2.5} fill={EYE_WHITE} />
          </G>
        )}

        {expression === 'happy' && (
          <G fill="none" stroke={PUPIL_COLOR} strokeWidth={3.6} strokeLinecap="round">
            <Path d="M40,63 Q48,53 56,63" />
            <Path d="M72,63 Q80,53 88,63" />
          </G>
        )}

        {expression === 'sleepy' && (
          <G>
            <G fill="none" stroke={PUPIL_COLOR} strokeWidth={3.6} strokeLinecap="round">
              <Path d="M40,60 Q48,67 56,60" />
              <Path d="M72,60 Q80,67 88,60" />
            </G>
            <SvgText x={97} y={42} fontSize={11} fontWeight="700" fill={PUPIL_COLOR}>
              z
            </SvgText>
            <SvgText x={105} y={32} fontSize={7.5} fontWeight="700" fill={PUPIL_COLOR}>
              z
            </SvgText>
          </G>
        )}

        {expression === 'wink' && (
          <Path
            d="M72,61 Q80,68 88,61"
            fill="none"
            stroke={PUPIL_COLOR}
            strokeWidth={3.6}
            strokeLinecap="round"
          />
        )}

        {expression === 'surprised' && (
          <G fill="none" stroke={PUPIL_COLOR} strokeWidth={2.4} strokeLinecap="round">
            <Path d="M40,41 Q48,36 56,40" />
            <Path d="M72,40 Q80,36 88,41" />
          </G>
        )}

        <Path d="M59.5 74 Q64 72.5 68.5 74 Q65.5 82 64 83 Q62.5 82 59.5 74 Z" fill={beakColor} />
        {expression === 'surprised' && (
          <Ellipse cx={64} cy={87} rx={3.4} ry={4.2} fill={beakDark} />
        )}
      </Svg>
    </DecorativeArtwork>
  );
});
