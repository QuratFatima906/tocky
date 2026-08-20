export const fontFamily = {
  displayMedium: 'Fredoka_500Medium',
  displaySemiBold: 'Fredoka_600SemiBold',
  textRegular: 'Figtree_400Regular',
  textMedium: 'Figtree_500Medium',
  textSemiBold: 'Figtree_600SemiBold',
  textBold: 'Figtree_700Bold',
} as const;

export type TextVariant =
  | 'hero'
  | 'title'
  | 'heading'
  | 'sectionTitle'
  | 'screenTitle'
  | 'statHero'
  | 'timerHero'
  | 'timerLarge'
  | 'timerMedium'
  | 'timerSmall'
  | 'bodyLarge'
  | 'body'
  | 'bodyMedium'
  | 'bodySmall'
  | 'label'
  | 'labelSmall'
  | 'caption'
  | 'captionSmall'
  | 'eyebrow'
  | 'overline'
  | 'microLabel'
  | 'tabLabel'
  | 'numeric'
  | 'numericSmall';

export type VariantStyle = {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeightRatio: number;
  readonly letterSpacing?: number;
  readonly textTransform?: 'uppercase';
  readonly tabular?: true;
  readonly maxFontSizeMultiplier?: number;
};

const DISPLAY_SCALE_CAP = 1.5;
const NUMERAL_SCALE_CAP = 1.3;

export const textVariants: Record<TextVariant, VariantStyle> = {
  hero: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 44,
    lineHeightRatio: 1.1,
    letterSpacing: -0.44,
    maxFontSizeMultiplier: DISPLAY_SCALE_CAP,
  },
  title: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 30,
    lineHeightRatio: 1.15,
    letterSpacing: -0.3,
    maxFontSizeMultiplier: DISPLAY_SCALE_CAP,
  },
  heading: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, lineHeightRatio: 1.25 },
  sectionTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 19, lineHeightRatio: 1.3 },
  screenTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 17, lineHeightRatio: 1.3 },

  statHero: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 52,
    lineHeightRatio: 1.05,
    letterSpacing: -0.52,
    tabular: true,
    maxFontSizeMultiplier: NUMERAL_SCALE_CAP,
  },
  timerHero: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 72,
    lineHeightRatio: 1.06,
    letterSpacing: 0.72,
    tabular: true,
    maxFontSizeMultiplier: NUMERAL_SCALE_CAP,
  },
  timerLarge: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 50,
    lineHeightRatio: 1.05,
    letterSpacing: 0.5,
    tabular: true,
    maxFontSizeMultiplier: NUMERAL_SCALE_CAP,
  },
  timerMedium: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 26,
    lineHeightRatio: 1.15,
    tabular: true,
    maxFontSizeMultiplier: NUMERAL_SCALE_CAP,
  },
  timerSmall: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 22,
    lineHeightRatio: 1.15,
    tabular: true,
    maxFontSizeMultiplier: NUMERAL_SCALE_CAP,
  },

  bodyLarge: { fontFamily: fontFamily.textRegular, fontSize: 18, lineHeightRatio: 1.5 },
  body: { fontFamily: fontFamily.textRegular, fontSize: 16, lineHeightRatio: 1.5 },
  bodyMedium: { fontFamily: fontFamily.textMedium, fontSize: 15, lineHeightRatio: 1.45 },
  bodySmall: { fontFamily: fontFamily.textRegular, fontSize: 14, lineHeightRatio: 1.45 },

  label: { fontFamily: fontFamily.textSemiBold, fontSize: 15, lineHeightRatio: 1.35 },
  labelSmall: { fontFamily: fontFamily.textSemiBold, fontSize: 13, lineHeightRatio: 1.4 },
  caption: { fontFamily: fontFamily.textSemiBold, fontSize: 12.5, lineHeightRatio: 1.35 },
  captionSmall: { fontFamily: fontFamily.textSemiBold, fontSize: 11.5, lineHeightRatio: 1.35 },

  eyebrow: {
    fontFamily: fontFamily.textSemiBold,
    fontSize: 13,
    lineHeightRatio: 1.3,
    letterSpacing: 0.26,
    textTransform: 'uppercase',
  },
  overline: {
    fontFamily: fontFamily.textSemiBold,
    fontSize: 12,
    lineHeightRatio: 1.3,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
  microLabel: {
    fontFamily: fontFamily.textBold,
    fontSize: 11,
    lineHeightRatio: 1.3,
    letterSpacing: 1.32,
    textTransform: 'uppercase',
  },
  tabLabel: {
    fontFamily: fontFamily.textBold,
    fontSize: 10.5,
    lineHeightRatio: 1.25,
    maxFontSizeMultiplier: 1.2,
  },

  numeric: { fontFamily: fontFamily.textBold, fontSize: 15, lineHeightRatio: 1.35, tabular: true },
  numericSmall: {
    fontFamily: fontFamily.textBold,
    fontSize: 14,
    lineHeightRatio: 1.35,
    tabular: true,
  },
};
