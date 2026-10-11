import { Flight } from '../models/Flight.js';
import { RoomType } from '../models/RoomType.js';
import { TravelPackage } from '../models/TravelPackage.js';
import { ApiError } from '../utils/ApiError.js';
import { getStayNights } from '../utils/dateRange.js';

/* ── Flights ──────────────────────────────────────────────────────────
 * Seats for a cabin move through: availableSeats -> heldSeats -> (booked,
 * represented implicitly since availableSeats was already decremented).
 */

export async function holdFlightSeats(flightId, cabin, seats, session) {
  const flight = await Flight.findById(flightId).session(session);
  if (!flight) throw ApiError.notFound('Flight not found');

  const cabinEntry = flight.cabinClasses.find((c) => c.cabin === cabin);
  if (!cabinEntry) throw ApiError.badRequest(`This flight does not offer ${cabin} class`);
  if (cabinEntry.availableSeats < seats) {
    throw ApiError.conflict(`Only ${cabinEntry.availableSeats} seat(s) left in ${cabin} on this flight`);
  }

  cabinEntry.availableSeats -= seats;
  cabinEntry.heldSeats += seats;
  await flight.save({ session });
  return { unitPrice: cabinEntry.price, currency: flight.currency };
}

export async function releaseFlightSeats(flightId, cabin, seats, session) {
  const flight = await Flight.findById(flightId).session(session);
  if (!flight) return; // already gone; nothing to release
  const cabinEntry = flight.cabinClasses.find((c) => c.cabin === cabin);
  if (!cabinEntry) return;
  cabinEntry.availableSeats += seats;
  cabinEntry.heldSeats = Math.max(0, cabinEntry.heldSeats - seats);
  await flight.save({ session });
}

export async function confirmFlightSeats(flightId, cabin, seats, session) {
  const flight = await Flight.findById(flightId).session(session);
  if (!flight) throw ApiError.notFound('Flight not found');
  const cabinEntry = flight.cabinClasses.find((c) => c.cabin === cabin);
  if (!cabinEntry) throw ApiError.notFound('Cabin class not found');
  // availableSeats was already decremented at hold time; confirming just
  // clears the "held" marker since the seats are now permanently booked.
  cabinEntry.heldSeats = Math.max(0, cabinEntry.heldSeats - seats);
  await flight.save({ session });
}

/* ── Hotels ───────────────────────────────────────────────────────────
 * Availability is tracked per calendar night on the RoomType document.
 * A night with no explicit entry inherits `defaultQuantity`; holding a
 * room for such a night creates the entry.
 */

export async function holdHotelRooms(roomTypeId, checkIn, checkOut, rooms, session) {
  const roomType = await RoomType.findById(roomTypeId).session(session);
  if (!roomType) throw ApiError.notFound('Room type not found');
  if (!roomType.isActive) throw ApiError.conflict('This room type is no longer available');

  const nights = getStayNights(checkIn, checkOut);
  if (nights.length === 0) throw ApiError.badRequest('checkOut must be after checkIn');

  // Validate every night has capacity before mutating anything.
  for (const dateStr of nights) {
    const avail = roomType.getNightAvailability(dateStr);
    if (avail.available < rooms) {
      throw ApiError.conflict(`Not enough rooms available on ${dateStr} (${avail.available} left)`);
    }
  }

  // All nights confirmed available — now apply the hold to each.
  for (const dateStr of nights) {
    let entry = roomType.nights.find((n) => n.date === dateStr);
    if (!entry) {
      roomType.nights.push({ date: dateStr, total: roomType.defaultQuantity, held: rooms, booked: 0 });
    } else {
      entry.held += rooms;
    }
  }

  await roomType.save({ session });
  return { unitPrice: roomType.basePrice, currency: roomType.currency, nights: nights.length };
}

export async function releaseHotelRooms(roomTypeId, checkIn, checkOut, rooms, session) {
  const roomType = await RoomType.findById(roomTypeId).session(session);
  if (!roomType) return;

  const nights = getStayNights(checkIn, checkOut);
  for (const dateStr of nights) {
    const entry = roomType.nights.find((n) => n.date === dateStr);
    if (entry) entry.held = Math.max(0, entry.held - rooms);
  }
  await roomType.save({ session });
}

export async function confirmHotelRooms(roomTypeId, checkIn, checkOut, rooms, session) {
  const roomType = await RoomType.findById(roomTypeId).session(session);
  if (!roomType) throw ApiError.notFound('Room type not found');

  const nights = getStayNights(checkIn, checkOut);
  for (const dateStr of nights) {
    const entry = roomType.nights.find((n) => n.date === dateStr);
    if (entry) {
      entry.held = Math.max(0, entry.held - rooms);
      entry.booked += rooms;
    }
  }
  await roomType.save({ session });
}

/* ── Packages ─────────────────────────────────────────────────────────
 * Capacity lives per departure date on the TravelPackage document.
 */

export async function holdPackageSlots(packageId, departureDateId, slots, session) {
  const pkg = await TravelPackage.findById(packageId).session(session);
  if (!pkg) throw ApiError.notFound('Package not found');

  const dep = pkg.departureDates.id(departureDateId);
  if (!dep) throw ApiError.notFound('Departure date not found');

  const available = dep.totalSlots - dep.heldSlots - dep.bookedSlots;
  if (available < slots) {
    throw ApiError.conflict(`Only ${available} traveler slot(s) left for this departure date`);
  }

  dep.heldSlots += slots;
  await pkg.save({ session });
  return { unitPrice: pkg.price, currency: pkg.currency };
}

export async function releasePackageSlots(packageId, departureDateId, slots, session) {
  const pkg = await TravelPackage.findById(packageId).session(session);
  if (!pkg) return;
  const dep = pkg.departureDates.id(departureDateId);
  if (!dep) return;
  dep.heldSlots = Math.max(0, dep.heldSlots - slots);
  await pkg.save({ session });
}

export async function confirmPackageSlots(packageId, departureDateId, slots, session) {
  const pkg = await TravelPackage.findById(packageId).session(session);
  if (!pkg) throw ApiError.notFound('Package not found');
  const dep = pkg.departureDates.id(departureDateId);
  if (!dep) throw ApiError.notFound('Departure date not found');
  dep.heldSlots = Math.max(0, dep.heldSlots - slots);
  dep.bookedSlots += slots;
  await pkg.save({ session });
}
