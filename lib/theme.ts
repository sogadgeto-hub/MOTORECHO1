// Material Design 3 color tokens — exact from Stitch reference
export const MD3Colors = {
  // Primary
  primary: '#e1fdff',
  onPrimary: '#00363a',
  primaryContainer: '#00f2ff',
  onPrimaryContainer: '#006a71',
  primaryFixed: '#74f5ff',
  onPrimaryFixed: '#002022',
  primaryFixedDim: '#00dbe7',
  onPrimaryFixedVariant: '#004f54',
  inversePrimary: '#00696f',

  // Secondary
  secondary: '#afc6ff',
  onSecondary: '#002d6d',
  secondaryContainer: '#056ced',
  onSecondaryContainer: '#f8f8ff',
  secondaryFixed: '#d9e2ff',
  onSecondaryFixed: '#001944',
  secondaryFixedDim: '#afc6ff',
  onSecondaryFixedVariant: '#004299',

  // Tertiary
  tertiary: '#fff6e4',
  onTertiary: '#3b2f00',
  tertiaryContainer: '#fed83a',
  onTertiaryContainer: '#725e00',
  tertiaryFixed: '#ffe173',
  onTertiaryFixed: '#221b00',
  tertiaryFixedDim: '#e8c423',
  onTertiaryFixedVariant: '#554500',

  // Surface
  background: '#0d1515',
  onBackground: '#dce4e4',
  surface: '#0d1515',
  onSurface: '#dce4e4',
  surfaceVariant: '#2e3637',
  onSurfaceVariant: '#b9cacb',
  surfaceTint: '#00dbe7',
  surfaceDim: '#0d1515',
  surfaceBright: '#333b3b',
  surfaceContainerLowest: '#080f10',
  surfaceContainerLow: '#151d1e',
  surfaceContainer: '#192122',
  surfaceContainerHigh: '#232b2c',
  surfaceContainerHighest: '#2e3637',
  inverseSurface: '#dce4e4',
  inverseOnSurface: '#2a3232',

  // Outline
  outline: '#849495',
  outlineVariant: '#3a494b',

  // Error
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
} as const;

// Legacy aliases for backward compatibility
export const Colors = {
  background: MD3Colors.background,
  surface: MD3Colors.surface,
  surfaceElevated: MD3Colors.surfaceContainerHigh,
  surfaceCard: 'rgba(255,255,255,0.03)',
  surfaceGlass: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.05)',
  borderHighlight: 'rgba(255,255,255,0.05)',
  primary: MD3Colors.primaryFixedDim,
  primaryDark: '#004f54',
  primaryGlow: 'rgba(0,219,231,0.20)',
  primaryLight: 'rgba(0,219,231,0.08)',
  secondary: MD3Colors.secondary,
  secondaryGlow: 'rgba(175,198,255,0.15)',
  text: MD3Colors.onSurface,
  textSecondary: MD3Colors.onSurfaceVariant,
  textMuted: 'rgba(185,202,203,0.6)',
  textDisabled: 'rgba(185,202,203,0.4)',
  success: MD3Colors.primaryFixedDim,
  successBg: 'rgba(0,219,231,0.08)',
  successGlow: 'rgba(0,219,231,0.15)',
  warning: MD3Colors.tertiaryFixedDim,
  warningBg: 'rgba(232,196,35,0.08)',
  warningGlow: 'rgba(232,196,35,0.15)',
  danger: MD3Colors.error,
  dangerDark: '#C62828',
  dangerBg: 'rgba(255,180,171,0.05)',
  dangerGlow: 'rgba(255,180,171,0.15)',
  dangerSoft: '#FF8A80',
  recording: MD3Colors.error,
  info: MD3Colors.secondary,
  infoBg: 'rgba(175,198,255,0.08)',
  infoGlow: 'rgba(175,198,255,0.15)',
  onPrimary: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.55)',
  purple: MD3Colors.tertiaryFixed,
  purpleBg: 'rgba(254,216,58,0.08)',
};

/** Official semantic palette — use instead of hardcoded hex values. */
export const Palette = {
  primary: Colors.primary,
  primaryDark: Colors.primaryDark,
  secondary: Colors.secondary,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,
  onPrimary: Colors.onPrimary,
  onSurface: Colors.text,
  onSurfaceMuted: Colors.textMuted,
} as const;

export const Spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
  stackSm: 12,
  stackMd: 24,
  stackLg: 48,
  containerMobile: 20,
  containerDesktop: 40,
  gutter: 24,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

/** Transition durations (ms) — keep animations between 200–300 ms. */
export const Animation = {
  fast: 200,
  normal: 250,
  slow: 300,
} as const;

/** Lucide icon standards across the app. */
export const IconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const IconStroke = {
  thin: 1.5,
  default: 2,
  bold: 2.5,
} as const;

/** Minimum touch target (accessibility). */
export const TouchTarget = {
  min: 44,
} as const;

/** Unified card tokens — all cards should use these. */
export const Card = {
  borderRadius: Radii.md,
  padding: Spacing.lg,
  gap: Spacing.md,
  backgroundColor: Colors.surfaceCard,
  borderColor: Colors.border,
  borderWidth: 1,
} as const;

export const Typography = {
  display: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.02,
    color: Colors.text,
  },
  displayMobile: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.02,
    color: Colors.text,
  },
  h1: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 32,
    lineHeight: 40,
    color: Colors.text,
  },
  h2: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 24,
    lineHeight: 32,
    color: Colors.text,
  },
  h3: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: Colors.text,
  },
  headlineMd: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 24,
    lineHeight: 32,
    color: Colors.text,
  },
  body: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  bodyLarge: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 18,
    lineHeight: 28,
    color: Colors.textSecondary,
  },
  bodySmall: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textMuted,
  },
  caption: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  label: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  labelLarge: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.05,
    color: Colors.textSecondary,
  },
  button: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text,
  },
  /** Semantic aliases for UI hierarchy */
  title: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 24,
    lineHeight: 32,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  legend: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  price: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 36,
    lineHeight: 42,
    color: Colors.text,
  },
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  button: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 20,
  },
  successGlow: {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  bottomNav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
};
