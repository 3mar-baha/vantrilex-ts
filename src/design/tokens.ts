export const colors = {
  canvas: '#faf9f5',
  primary: '#cc785c',
  primaryActive: '#a9583e',
  primaryDisabled: '#e6dfd8',
  ink: '#141413',
  body: '#3d3d3a',
  bodyStrong: '#252523',
  muted: '#6c6a64',
  mutedSoft: '#8e8b82',
  hairline: '#e6dfd8',
  hairlineSoft: '#ebe6df',
  surfaceSoft: '#f5f0e8',
  surfaceCard: '#efe9de',
  surfaceCreamStrong: '#e8e0d2',
  surfaceDark: '#181715',
  surfaceDarkElevated: '#252320',
  surfaceDarkSoft: '#1f1e1b',
  onPrimary: '#ffffff',
  onDark: '#faf9f5',
  onDarkSoft: '#a09d96',
  accentTeal: '#5db8a6',
  accentAmber: '#e8a55a',
  success: '#5db872',
  warning: '#d4a017',
  error: '#c64545'
} as const

export const typography = {
  displayXl: { fontFamily: 'Copernicus, Tiempos Headline, serif', fontSize: 64, fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.5 },
  displayLg: { fontFamily: 'Copernicus, Tiempos Headline, serif', fontSize: 48, fontWeight: 400, lineHeight: 1.1, letterSpacing: -1 },
  displayMd: { fontFamily: 'Copernicus, Tiempos Headline, serif', fontSize: 36, fontWeight: 400, lineHeight: 1.15, letterSpacing: -0.5 },
  displaySm: { fontFamily: 'Copernicus, Tiempos Headline, serif', fontSize: 28, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.3 },
  titleLg: { fontFamily: 'StyreneB, Inter, sans-serif', fontSize: 22, fontWeight: 500, lineHeight: 1.3, letterSpacing: 0 },
  titleMd: { fontFamily: 'StyreneB, Inter, sans-serif', fontSize: 18, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0 },
  bodyMd: { fontFamily: 'StyreneB, Inter, sans-serif', fontSize: 16, fontWeight: 400, lineHeight: 1.55, letterSpacing: 0 },
  bodySm: { fontFamily: 'StyreneB, Inter, sans-serif', fontSize: 14, fontWeight: 400, lineHeight: 1.55, letterSpacing: 0 },
  caption: { fontFamily: 'StyreneB, Inter, sans-serif', fontSize: 13, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0 },
  captionUppercase: { fontFamily: 'StyreneB, Inter, sans-serif', fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: 1.5 },
  code: { fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 14, fontWeight: 400, lineHeight: 1.6, letterSpacing: 0 },
  button: { fontFamily: 'StyreneB, Inter, sans-serif', fontSize: 14, fontWeight: 500, lineHeight: 1, letterSpacing: 0 }
} as const

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
  full: 9999
} as const

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 96
} as const

export const maxContentWidth = 1200
