// destinationSlug is resolved to an ObjectId by the seed runner after
// destinations are inserted — keeps this file free of hardcoded ids.
export const hotelsSeed = [
  {
    name: 'Casa do Horizonte',
    slug: 'casa-do-horizonte-lisbon',
    destinationSlug: 'lisbon-portugal',
    propertyType: 'boutique',
    starRating: 4,
    description:
      'A restored 19th-century townhouse in Alfama with twelve rooms, a rooftop terrace looking over the Tagus, and a courtyard breakfast room that fills with the smell of fresh bread every morning. Walkable to the fado houses and tram 28.',
    shortDescription: 'Restored townhouse with rooftop river views in Alfama.',
    images: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427',
    ],
    address: { line1: 'Rua de São Tomé 42', city: 'Lisbon', country: 'Portugal' },
    coordinates: { lat: 38.7136, lng: -9.1294 },
    amenities: ['Free WiFi', 'Rooftop terrace', 'Breakfast included', 'Air conditioning', 'Concierge'],
    breakfastIncluded: true,
    freeCancellation: true,
    ratingAverage: 4.7,
    ratingCount: 214,
    isFeatured: true,
    nearbyAttractions: [
      { name: 'Sé de Lisboa Cathedral', distanceKm: 0.4 },
      { name: 'Miradouro das Portas do Sol', distanceKm: 0.3 },
    ],
  },
  {
    name: 'Kyoto Machiya Inn',
    slug: 'kyoto-machiya-inn',
    destinationSlug: 'kyoto-japan',
    propertyType: 'boutique',
    starRating: 4,
    description:
      'A converted machiya townhouse near the Philosopher\'s Path, blending tatami-floored rooms with quiet interior gardens. Staff arrange tea ceremonies and early-entry temple visits before the tour groups arrive.',
    shortDescription: 'Converted townhouse near the Philosopher\'s Path.',
    images: [
      'https://images.unsplash.com/photo-1545158535-c3f7168c28b6',
      'https://images.unsplash.com/photo-1522547902298-51566e4fb383',
    ],
    address: { line1: '3-Chome Shishigatani', city: 'Kyoto', country: 'Japan' },
    coordinates: { lat: 35.0272, lng: 135.7956 },
    amenities: ['Free WiFi', 'Tea ceremony', 'Garden', 'Onsen bath', 'Airport shuttle'],
    breakfastIncluded: true,
    freeCancellation: true,
    ratingAverage: 4.9,
    ratingCount: 168,
    isFeatured: true,
  },
  {
    name: 'Baraza Zanzibar Resort',
    slug: 'baraza-zanzibar-resort',
    destinationSlug: 'zanzibar-tanzania',
    propertyType: 'resort',
    starRating: 5,
    description:
      'Set directly on Bwejuu\'s white-sand beach, this Swahili-Arab styled resort has private plunge pools, an on-site spa built into a coral cave, and a beach bar that serves dinner with your feet in the sand.',
    shortDescription: 'Beachfront resort with private plunge pools.',
    images: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
    ],
    address: { line1: 'Bwejuu Beach', city: 'Zanzibar City', country: 'Tanzania' },
    coordinates: { lat: -6.3106, lng: 39.4728 },
    amenities: ['Private pool', 'Spa', 'Beachfront', 'All-inclusive option', 'Free WiFi', 'Water sports'],
    breakfastIncluded: true,
    freeCancellation: false,
    ratingAverage: 4.8,
    ratingCount: 302,
    isFeatured: true,
  },
  {
    name: 'Hotel Palacio Retiro',
    slug: 'hotel-palacio-retiro-buenos-aires',
    destinationSlug: 'buenos-aires-argentina',
    propertyType: 'hotel',
    starRating: 4,
    description:
      'A Belle Époque building in Recoleta with high ceilings, wrought-iron balconies, and a rooftop pool with skyline views. Ten minutes from Recoleta Cemetery and the city\'s best steakhouses.',
    shortDescription: 'Belle Époque elegance in Recoleta.',
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c',
    ],
    address: { line1: 'Av. Alvear 1690', city: 'Buenos Aires', country: 'Argentina' },
    coordinates: { lat: -34.5885, lng: -58.3931 },
    amenities: ['Rooftop pool', 'Free WiFi', 'Bar', 'Gym', 'Breakfast included'],
    breakfastIncluded: true,
    freeCancellation: true,
    ratingAverage: 4.5,
    ratingCount: 189,
  },
  {
    name: 'The Remarkables Lodge',
    slug: 'the-remarkables-lodge-queenstown',
    destinationSlug: 'queenstown-new-zealand',
    propertyType: 'lodge',
    starRating: 5,
    description:
      'A timber-and-stone lodge on the lower slopes of the Remarkables, with floor-to-ceiling windows over Lake Wakatipu and a wine cellar stocked entirely from Central Otago vineyards.',
    shortDescription: 'Alpine lodge with lake and mountain views.',
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c',
    ],
    address: { line1: 'Kawarau Falls Road', city: 'Queenstown', country: 'New Zealand' },
    coordinates: { lat: -45.0653, lng: 168.6952 },
    amenities: ['Mountain views', 'Wine cellar', 'Fireplace', 'Free WiFi', 'Airport shuttle'],
    breakfastIncluded: true,
    freeCancellation: true,
    ratingAverage: 4.9,
    ratingCount: 97,
    isFeatured: true,
  },
  {
    name: 'Riad Jardin Secret',
    slug: 'riad-jardin-secret-marrakech',
    destinationSlug: 'marrakech-morocco',
    propertyType: 'boutique',
    starRating: 4,
    description:
      'Behind an unmarked medina door, this eight-room riad centers on a citrus-scented courtyard with a plunge pool. The rooftop opens onto Atlas Mountain views at sunrise, weather permitting.',
    shortDescription: 'Medina riad with a citrus courtyard and rooftop views.',
    images: [
      'https://images.unsplash.com/photo-1548866429-a5dea330bbba',
      'https://images.unsplash.com/photo-1601701119533-3ddc47b1f4e0',
    ],
    address: { line1: 'Derb El Hammam, Medina', city: 'Marrakech', country: 'Morocco' },
    coordinates: { lat: 31.6285, lng: -7.9892 },
    amenities: ['Courtyard pool', 'Rooftop terrace', 'Breakfast included', 'Airport transfer', 'Hammam'],
    breakfastIncluded: true,
    freeCancellation: true,
    ratingAverage: 4.6,
    ratingCount: 143,
  },
];

// Room types per hotel, keyed by hotelSlug so the seed runner can attach
// the resolved Hotel _id.
export const roomTypesSeed = {
  'casa-do-horizonte-lisbon': [
    { name: 'Classic Double', capacity: { adults: 2, children: 1 }, beds: '1 Queen bed', sizeSqm: 18, basePrice: 145, defaultQuantity: 5, amenities: ['Air conditioning', 'En-suite bathroom'] },
    { name: 'Terrace Suite', capacity: { adults: 2, children: 2 }, beds: '1 King bed + sofa bed', sizeSqm: 32, basePrice: 265, defaultQuantity: 3, amenities: ['Private terrace', 'River view', 'Air conditioning'] },
  ],
  'kyoto-machiya-inn': [
    { name: 'Tatami Room', capacity: { adults: 2, children: 0 }, beds: 'Futon bedding', sizeSqm: 20, basePrice: 190, defaultQuantity: 4, amenities: ['Garden view', 'Tea set'] },
    { name: 'Garden Suite', capacity: { adults: 3, children: 1 }, beds: 'Futon bedding + tatami alcove', sizeSqm: 38, basePrice: 340, defaultQuantity: 2, amenities: ['Private garden access', 'Onsen bath'] },
  ],
  'baraza-zanzibar-resort': [
    { name: 'Beachfront Bungalow', capacity: { adults: 2, children: 2 }, beds: '1 King bed', sizeSqm: 45, basePrice: 420, defaultQuantity: 8, amenities: ['Private plunge pool', 'Beachfront', 'Outdoor shower'] },
    { name: 'Ocean Pool Villa', capacity: { adults: 4, children: 2 }, beds: '2 King beds', sizeSqm: 85, basePrice: 780, defaultQuantity: 3, amenities: ['Private pool', 'Butler service', 'Ocean view'] },
  ],
  'hotel-palacio-retiro-buenos-aires': [
    { name: 'Deluxe Room', capacity: { adults: 2, children: 1 }, beds: '1 Queen bed', sizeSqm: 24, basePrice: 155, defaultQuantity: 10, amenities: ['City view', 'Air conditioning'] },
    { name: 'Executive Suite', capacity: { adults: 2, children: 2 }, beds: '1 King bed', sizeSqm: 40, basePrice: 275, defaultQuantity: 4, amenities: ['Balcony', 'Living area', 'Rooftop pool access'] },
  ],
  'the-remarkables-lodge-queenstown': [
    { name: 'Alpine King', capacity: { adults: 2, children: 0 }, beds: '1 King bed', sizeSqm: 30, basePrice: 340, defaultQuantity: 6, amenities: ['Lake view', 'Fireplace'] },
    { name: 'Summit Suite', capacity: { adults: 4, children: 0 }, beds: '1 King bed + 2 Twin beds', sizeSqm: 58, basePrice: 610, defaultQuantity: 3, amenities: ['Mountain view', 'Private balcony', 'Fireplace'] },
  ],
  'riad-jardin-secret-marrakech': [
    { name: 'Courtyard Room', capacity: { adults: 2, children: 0 }, beds: '1 Queen bed', sizeSqm: 16, basePrice: 95, defaultQuantity: 5, amenities: ['Courtyard view'] },
    { name: 'Rooftop Suite', capacity: { adults: 2, children: 2 }, beds: '1 King bed + daybed', sizeSqm: 28, basePrice: 175, defaultQuantity: 3, amenities: ['Rooftop access', 'Atlas Mountain view'] },
  ],
};
