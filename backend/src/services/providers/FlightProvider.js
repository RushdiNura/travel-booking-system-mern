import { Flight } from '../../models/Flight.js';

/**
 * Abstraction over "where flight inventory comes from". Today the only
 * implementation is internal managed inventory in MongoDB. To integrate a
 * real GDS/NDC provider later (Amadeus, Duffel, Sabre...), add a new class
 * implementing the same shape and select it here — nothing in the
 * controllers/routes needs to change.
 */
class InternalFlightProvider {
  source = 'internal';

  async search({ originCode, destinationCode, departureDate, cabin, page = 1, limit = 20, sort = 'recommended' }) {
    const query = { isActive: true, status: { $ne: 'cancelled' } };
    if (originCode) query['origin.code'] = originCode.toUpperCase();
    if (destinationCode) query['destination.code'] = destinationCode.toUpperCase();
    if (departureDate) {
      const start = new Date(`${departureDate}T00:00:00.000Z`);
      const end = new Date(`${departureDate}T23:59:59.999Z`);
      query.departureTime = { $gte: start, $lte: end };
    }
    if (cabin) query['cabinClasses.cabin'] = cabin;

    const sortMap = {
      cheapest: { 'cabinClasses.0.price': 1 },
      fastest: { durationMinutes: 1 },
      departure: { departureTime: 1 },
      recommended: { departureTime: 1 },
    };

    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      Flight.find(query)
        .sort(sortMap[sort] || sortMap.recommended)
        .skip(skip)
        .limit(limit)
        .lean(),
      Flight.countDocuments(query),
    ]);

    return { results, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id) {
    return Flight.findById(id);
  }
}

export const flightProvider = new InternalFlightProvider();
