/**
 * Returns an array of ISO date strings ('YYYY-MM-DD'), one per night of
 * stay, from checkIn (inclusive) to checkOut (exclusive) — i.e. a
 * checkIn=2026-06-01, checkOut=2026-06-03 stay covers nights
 * ["2026-06-01", "2026-06-02"].
 */
export function getStayNights(checkInStr, checkOutStr) {
  const nights = [];
  const current = new Date(`${checkInStr}T00:00:00.000Z`);
  const end = new Date(`${checkOutStr}T00:00:00.000Z`);

  while (current < end) {
    nights.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return nights;
}

export function daysBetween(checkInStr, checkOutStr) {
  return getStayNights(checkInStr, checkOutStr).length;
}
