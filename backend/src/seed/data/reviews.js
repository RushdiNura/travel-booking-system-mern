// Each entry pairs a review with the target it belongs to. The seed
// runner creates a matching COMPLETED booking for the reviewing user so
// the review satisfies the same "must have an eligible completed booking"
// rule that applies to real user-submitted reviews — seed data shouldn't
// bypass rules the live app enforces.
export const reviewsSeed = [
  {
    userEmail: 'amara.chen@example.com',
    targetType: 'hotel',
    hotelSlug: 'casa-do-horizonte-lisbon',
    rating: 5,
    title: 'Rooftop breakfast made the trip',
    comment:
      'Small enough to feel personal, big enough to have a proper rooftop terrace. Staff arranged a fado reservation for us on our first night without being asked twice.',
  },
  {
    userEmail: 'diego.fernandes@example.com',
    targetType: 'hotel',
    hotelSlug: 'kyoto-machiya-inn',
    rating: 5,
    title: 'Quiet in the middle of the city',
    comment:
      'The garden room looks out onto a tiny interior courtyard and you genuinely forget you are in Kyoto. The onsen bath after a full day of temples was exactly what we needed.',
  },
  {
    userEmail: 'priya.nair@example.com',
    targetType: 'hotel',
    hotelSlug: 'baraza-zanzibar-resort',
    rating: 4,
    title: 'Stunning beach, book the pool villa',
    comment:
      'Sand is genuinely as white as the photos. We had the beachfront bungalow which was lovely, though I would upgrade to the pool villa next time for a bit more shade and privacy.',
  },
  {
    userEmail: 'amara.chen@example.com',
    targetType: 'package',
    packageSlug: 'lisbon-sintra-hills',
    rating: 5,
    title: 'Sintra day trip alone is worth it',
    comment:
      'Having a private driver for Sintra meant we skipped the tour-bus queues entirely at Pena Palace. The pace of the whole six days felt unrushed, which is rare for a packaged trip.',
  },
  {
    userEmail: 'priya.nair@example.com',
    targetType: 'package',
    packageSlug: 'kyoto-temples-and-tea',
    rating: 5,
    title: 'Fushimi Inari before sunrise, no crowds',
    comment:
      'The early-entry guide for Fushimi Inari was the highlight — we had the upper torii gates almost entirely to ourselves. The tea ceremony felt genuine rather than staged for tourists.',
  },
  {
    userEmail: 'diego.fernandes@example.com',
    targetType: 'package',
    packageSlug: 'zanzibar-island-escape',
    rating: 4,
    title: 'Great mix of culture and beach',
    comment:
      'Two nights in Stone Town was the right amount before heading to the coast. The sunset dhow cruise dinner was a nice touch, though the boat was a bit crowded with two other groups.',
  },
];
