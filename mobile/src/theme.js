// Mirrors frontend/tailwind.config.js so the mobile app matches the web
// brand exactly. Plain JS object rather than a styling framework — see
// the mobile README for why.
export const colors = {
  indigo50: '#EEF1F6',
  indigo100: '#D6DCE9',
  indigo200: '#AEB9D2',
  indigo300: '#8697BB',
  indigo400: '#5E74A3',
  indigo500: '#3C5486',
  indigo600: '#26396B',
  indigo700: '#1C2B4A',
  indigo800: '#13203A',
  indigo900: '#0B1E3D', // primary brand
  indigo950: '#060F20',

  gold50: '#FEF6EB',
  gold100: '#FDE9CB',
  gold200: '#FAD199',
  gold300: '#F7B968',
  gold400: '#F4A340', // accent
  gold500: '#E0872A',
  gold600: '#B76B20',
  gold700: '#8C511A',

  ivory: '#FAF8F3',
  surface: '#FFFFFF',
  border: '#E7E1D4',
  muted: '#5B6B8C',

  success: '#1E8E5A',
  warning: '#B8860B',
  error: '#C0392B',
  info: '#2E6BA8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
};

// Font family names registered in app/_layout.jsx via useFonts. Fall back
// to the system font until the fonts have finished loading.
export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
};

export const STATUS_COLOR = {
  PENDING: colors.muted,
  PAYMENT_PENDING: colors.warning,
  CONFIRMED: colors.success,
  CANCELLED: colors.error,
  COMPLETED: colors.info,
  EXPIRED: colors.error,
};

export const PAYMENT_COLOR = {
  UNPAID: colors.muted,
  PROCESSING: colors.warning,
  PAID: colors.success,
  FAILED: colors.error,
  REFUNDED: colors.info,
  PARTIALLY_REFUNDED: colors.info,
};
