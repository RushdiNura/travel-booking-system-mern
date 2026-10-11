// Passwords are plaintext here only because the User model's pre-save
// hook hashes them on insert — never stored or logged in plaintext.
// These are clearly-marked development credentials, not production ones.
export const usersSeed = [
  {
    name: 'Aerlume Admin',
    email: 'admin@aerlume.dev',
    password: 'DevAdmin#2026',
    role: 'admin',
    phone: '+1-555-0100',
    emailVerified: true,
  },
  {
    name: 'Amara Chen',
    email: 'amara.chen@example.com',
    password: 'DevUser#2026',
    role: 'user',
    phone: '+1-555-0148',
    emailVerified: true,
    preferences: { currency: 'USD', newsletter: true },
    loyalty: { pointsBalance: 1250, tier: 'gold' },
  },
  {
    name: 'Diego Fernandes',
    email: 'diego.fernandes@example.com',
    password: 'DevUser#2026',
    role: 'user',
    phone: '+351-91-234-5678',
    emailVerified: true,
    preferences: { currency: 'EUR', newsletter: false },
    loyalty: { pointsBalance: 320, tier: 'silver' },
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    password: 'DevUser#2026',
    role: 'user',
    phone: '+44-20-7946-0958',
    emailVerified: true,
    preferences: { currency: 'GBP', newsletter: true },
    loyalty: { pointsBalance: 4100, tier: 'platinum' },
  },
];
