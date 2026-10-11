import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, CalendarDays } from 'lucide-react-native';
import { colors, radius, fonts, spacing } from '../../theme.js';

export default function PackageCard({ pkg }) {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push(`/package/${pkg._id}`)}>
      <View style={styles.imageWrap}>
        {pkg.images?.[0] ? (
          <Image source={{ uri: pkg.images[0] }} style={styles.image} resizeMode="cover" />
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{pkg.title}</Text>
          {pkg.ratingAverage > 0 ? (
            <View style={styles.ratingRow}>
              <Star size={12} color={colors.gold400} fill={colors.gold400} />
              <Text style={styles.ratingText}>{pkg.ratingAverage.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.destination}>{pkg.destination?.name}, {pkg.destination?.country}</Text>
        <View style={styles.durationRow}>
          <CalendarDays size={11} color={colors.muted} />
          <Text style={styles.duration}>{pkg.durationDays} days / {pkg.durationNights} nights</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.fromLabel}>from</Text>
          <Text style={styles.price}>${pkg.price?.toFixed(0)} <Text style={styles.perTraveler}>/ traveler</Text></Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageWrap: { height: 150, backgroundColor: colors.indigo50 },
  image: { width: '100%', height: '100%' },
  body: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 16, color: colors.indigo900 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: spacing.sm },
  ratingText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.indigo900 },
  destination: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  duration: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.md },
  fromLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  price: { fontFamily: fonts.display, fontSize: 18, color: colors.indigo900 },
  perTraveler: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
});
