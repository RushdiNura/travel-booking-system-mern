import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, fonts } from '../../theme.js';

const VARIANTS = {
  primary: { bg: colors.indigo900, text: colors.ivory, border: colors.indigo900 },
  accent: { bg: colors.gold400, text: colors.indigo950 || colors.indigo900, border: colors.gold400 },
  outline: { bg: 'transparent', text: colors.indigo900, border: colors.indigo900 },
  ghost: { bg: 'transparent', text: colors.indigo900, border: 'transparent' },
};

export default function Button({ variant = 'primary', loading = false, disabled = false, onPress, children, style }) {
  const palette = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : typeof children === 'string' ? (
        <Text style={[styles.text, { color: palette.text }]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
});
