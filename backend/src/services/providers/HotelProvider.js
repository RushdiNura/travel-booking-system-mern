import { Hotel } from '../../models/Hotel.js';
import { RoomType } from '../../models/RoomType.js';

/**
 * Same rationale as FlightProvider: internal managed inventory today,
 * swappable for a real channel-manager/OTA API later without touching
 * controllers.
 */
class InternalHotelProvider {
  source = 'internal';

  async search({ destinationId, city, minPrice, maxPrice, starRating, amenities, page = 1, limit = 20, sort = 'recommended' }) {
    const query = { isActive: true };
    if (destinationId) query.destination = destinationId;
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (starRating) query.starRating = { $gte: Number(starRating) };
    if (amenities?.length) query.amenities = { $all: amenities };

    const sortMap = {
      rating: { ratingAverage: -1 },
      recommended: { isFeatured: -1, ratingAverage: -1 },
    };

    const skip = (page - 1) * limit;
    let hotels = await Hotel.find(query)
      .populate('destination', 'name slug country')
      .sort(sortMap[sort] || sortMap.recommended)
      .skip(skip)
      .limit(limit)
      .lean();

    // Price filtering happens against the cheapest active room type per
    // hotel, so it's applied after fetching room data rather than as a
    // Mongo query on Hotel (price lives on RoomType).
    if (minPrice || maxPrice) {
      const hotelIds = hotels.map((h) => h._id);
      const rooms = await RoomType.find({ hotel: { $in: hotelIds }, isActive: true })
        .select('hotel basePrice')
        .lean();
      const minPriceByHotel = new Map();
      for (const r of rooms) {
        const key = r.hotel.toString();
        if (!minPriceByHotel.has(key) || r.basePrice < minPriceByHotel.get(key)) {
          minPriceByHotel.set(key, r.basePrice);
        }
      }
      hotels = hotels.filter((h) => {
        const price = minPriceByHotel.get(h._id.toString());
        if (price == null) return false;
        if (minPrice && price < Number(minPrice)) return false;
        if (maxPrice && price > Number(maxPrice)) return false;
        return true;
      });
    }

    const total = await Hotel.countDocuments(query);
    return { results: hotels, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id) {
    return Hotel.findById(id).populate('destination', 'name slug country coordinates');
  }

  async getRoomTypes(hotelId) {
    return RoomType.find({ hotel: hotelId, isActive: true });
  }
}

export const hotelProvider = new InternalHotelProvider();
