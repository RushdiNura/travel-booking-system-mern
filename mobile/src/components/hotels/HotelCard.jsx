import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, MapPin } from 'lucide-react-native';
import { colors, radius, fonts, spacing } from '../../theme.js';

export default function HotelCard({ hotel }) {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push(`/hotel/${hotel._id}`)}>
      <View style={styles.imageWrap}>
        {hotel.images?.[0] ? (
          <Image source={{ uri: hotel.images[0] }} style={styles.image} resizeMode="cover" />
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
          {hotel.ratingAverage > 0 ? (
            <View style={styles.ratingPill}>
              <Star size={11} color={colors.gold400} fill={colors.gold400} />
              <Text style={styles.ratingText}>{hotel.ratingAverage.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.locationRow}>
          <MapPin size={11} color={colors.muted} />
          <Text style={styles.location}>{hotel.address?.city}, {hotel.address?.country}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.fromLabel}>from</Text>
          <Text style={styles.price}>${hotel.fromPrice?.toFixed(0)} <Text style={styles.perNight}>/ night</Text></Text>
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
  name: { flex: 1, fontFamily: fonts.display, fontSize: 16, color: colors.indigo900 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.indigo900,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  ratingText: { color: colors.ivory, fontFamily: fonts.bodyMedium, fontSize: 11 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.md },
  fromLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  price: { fontFamily: fonts.display, fontSize: 18, color: colors.indigo900 },
  perNight: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
});
