import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fonts } from '../../theme.js';

const VARIANT_COLOR = {
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  neutral: colors.indigo700,
};

export default function Badge({ variant = 'neutral', children }) {
  const color = VARIANT_COLOR[variant] || VARIANT_COLOR.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <Text style={[styles.text, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
});
