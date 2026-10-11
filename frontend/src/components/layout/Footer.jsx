import { Link } from 'react-router-dom';
import { Compass, Instagram, Twitter, Facebook } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { to: '/destinations', label: 'Destinations' },
      { to: '/flights', label: 'Flights' },
      { to: '/hotels', label: 'Hotels' },
      { to: '/packages', label: 'Packages' },
    ],
  },
  {
    title: 'Support',
    links: [
      { to: '/help', label: 'Help center' },
      { to: '/contact', label: 'Contact us' },
      { to: '/cancellation-policy', label: 'Cancellation policy' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About Aerlume' },
      { to: '/terms', label: 'Terms of service' },
      { to: '/privacy', label: 'Privacy policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-indigo-900 text-ivory">
      <div className="container-page py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 font-display text-xl tracking-wide">
              <Compass className="h-5 w-5 text-gold" aria-hidden="true" />
              AERLUME
            </Link>
            <div className="horizon-rule mt-4" />
            <p className="mt-4 max-w-xs text-sm text-indigo-200">
              A clearer way to plan and book trips — flights, hotels, and curated journeys in one place.
            </p>
            <div className="mt-5 flex gap-4">
              <a href="#" aria-label="Aerlume on Instagram" className="text-indigo-300 hover:text-gold"><Instagram className="h-5 w-5" /></a>
              <a href="#" aria-label="Aerlume on Twitter" className="text-indigo-300 hover:text-gold"><Twitter className="h-5 w-5" /></a>
              <a href="#" aria-label="Aerlume on Facebook" className="text-indigo-300 hover:text-gold"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gold">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-indigo-200 hover:text-ivory">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-indigo-700 pt-6 text-xs text-indigo-300">
          © {new Date().getFullYear()} Aerlume Travel. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
