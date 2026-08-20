export const fontFamily = {
  displayRegular: 'Fredoka_400Regular',
  displayMedium: 'Fredoka_500Medium',
  displaySemiBold: 'Fredoka_600SemiBold',
  textRegular: 'Figtree_400Regular',
  textMedium: 'Figtree_500Medium',
  textSemiBold: 'Figtree_600SemiBold',
  textBold: 'Figtree_700Bold',
  textExtraBold: 'Figtree_800ExtraBold',
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
  | 'bodySmall'
  | 'label'
  | 'labelSmall'
  | 'caption'
  | 'overline'
  | 'tabLabel'
  | 'numeric'
  | 'numericSmall';

type VariantStyle = {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing?: number;
  readonly textTransform?: 'uppercase';
  readonly tabular?: true;
};

export const textVariants: Record<TextVariant, VariantStyle> = {
  hero: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.44,
  },
  title: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  heading: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, lineHeight: 27 },
  sectionTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 19, lineHeight: 24 },
  screenTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 17, lineHeight: 22 },

  statHero: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -0.52,
    tabular: true,
  },
  timerHero: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 72,
    lineHeight: 76,
    letterSpacing: 0.72,
    tabular: true,
  },
  timerLarge: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 50,
    lineHeight: 52,
    letterSpacing: 0.5,
    tabular: true,
  },
  timerMedium: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 26,
    lineHeight: 30,
    tabular: true,
  },
  timerSmall: { fontFamily: fontFamily.displayMedium, fontSize: 22, lineHeight: 25, tabular: true },

  bodyLarge: { fontFamily: fontFamily.textRegular, fontSize: 18, lineHeight: 27 },
  body: { fontFamily: fontFamily.textRegular, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: fontFamily.textRegular, fontSize: 14, lineHeight: 20 },

  label: { fontFamily: fontFamily.textSemiBold, fontSize: 15, lineHeight: 20 },
  labelSmall: { fontFamily: fontFamily.textSemiBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.textSemiBold, fontSize: 12.5, lineHeight: 17 },
  overline: {
    fontFamily: fontFamily.textBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.32,
    textTransform: 'uppercase',
  },
  tabLabel: { fontFamily: fontFamily.textBold, fontSize: 10.5, lineHeight: 13 },

  numeric: { fontFamily: fontFamily.textBold, fontSize: 15, lineHeight: 20, tabular: true },
  numericSmall: { fontFamily: fontFamily.textBold, fontSize: 14, lineHeight: 19, tabular: true },
};

export const MAXIMUM_FONT_SCALE = 1.6;
