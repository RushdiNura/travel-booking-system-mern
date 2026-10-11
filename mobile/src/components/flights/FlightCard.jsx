import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Plane } from 'lucide-react-native';
import { colors, radius, fonts, spacing } from '../../theme.js';

const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDuration = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

export default function FlightCard({ flight, travelers = 1 }) {
  const router = useRouter();
  const cabin = flight.selectedCabin;

  const select = () => {
    router.push({
      pathname: '/checkout',
      params: {
        bookingType: 'flight',
        travelerCount: String(travelers),
        currency: flight.currency,
        priceEstimate: String(cabin.price * travelers),
        summaryTitle: `${flight.origin?.code} → ${flight.destination?.code}`,
        summarySubtitle: `${flight.airline?.name} ${flight.flightNumber} · ${cabin.cabin.replace('_', ' ')}`,
        bookingFields: JSON.stringify({ flightId: flight._id, cabin: cabin.cabin, tripType: 'one_way' }),
      },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Plane size={16} color={colors.indigo900} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.airline}>{flight.airline?.name} · {flight.flightNumber}</Text>
          <Text style={styles.times}>
            {fmtTime(flight.departureTime)} — {fmtTime(flight.arrivalTime)} ({fmtDuration(flight.durationMinutes)})
          </Text>
          <Text style={styles.meta}>
            {flight.origin?.code} → {flight.destination?.code} ·{' '}
            {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>{flight.currency} {cabin?.price?.toFixed(0)}</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={select} activeOpacity={0.8}>
          <Text style={styles.selectText}>Select</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.indigo50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airline: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.indigo900 },
  times: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: { fontFamily: fonts.display, fontSize: 18, color: colors.indigo900 },
  selectBtn: {
    backgroundColor: colors.gold400,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.sm,
  },
  selectText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.indigo950 },
});
