import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, BadgePercent, Compass } from 'lucide-react';
import Seo from '../components/Seo.jsx';

const WHY_ITEMS = [
  { icon: ShieldCheck, title: 'Secure by design', text: 'Payments verified server-side; card data never touches our database.' },
  { icon: Clock, title: '24/7 support', text: 'Real people, reachable any hour, for anything from a booking change to a cancelled flight.' },
  { icon: BadgePercent, title: 'Transparent pricing', text: 'Base fare, taxes, and fees shown before you pay — never a surprise total.' },
];

export default function Home() {
  return (
    <div>
      <Seo
        title="Travel, considered"
        description="Search flights, hotels, and curated holiday packages against real availability, and book knowing exactly what you're paying for."
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-indigo-900 text-ivory">
        <div className="container-page py-24 sm:py-32">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-gold">
              <Compass className="h-4 w-4" /> Travel, considered
            </p>
            <h1 className="text-ivory mt-5 font-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              Plan the trip.
              <br />
              Not the logistics.
            </h1>
            <div className="horizon-rule mt-6" />
            <p className="mt-6 max-w-lg text-lg text-indigo-100">
              Search flights, hotels, and curated journeys against real
              availability — and book knowing exactly what you're paying for,
              before you pay it.
            </p>
          </div>

          {/* Unified search card */}
          <div className="card mt-10 max-w-4xl bg-surface dark:bg-indigo-900 p-5 sm:p-6">
            <div className="flex gap-1 border-b border-border dark:border-indigo-800 pb-4">
              {["Flights", "Hotels", "Packages"].map((tab, i) => (
                <button
                  key={tab}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                    i === 0
                      ? "bg-indigo-900 text-ivory"
                      : "text-muted dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label">From</label>
                <input className="input" placeholder="Origin city or airport" />
              </div>
              <div>
                <label className="label">To</label>
                <input className="input" placeholder="Destination" />
              </div>
              <div>
                <label className="label">Depart</label>
                <input type="date" className="input" />
              </div>
              <div>
                <label className="label">Travelers</label>
                <input className="input" placeholder="1 adult" />
              </div>
            </div>
            <Link to="/flights" className="btn-accent mt-5 w-full sm:w-auto">
              Search flights
            </Link>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="container-page py-20">
        <h2 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">
          Why travelers book with Aerlume
        </h2>
        <div className="horizon-rule mt-3" />
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {WHY_ITEMS.map((item) => (
            <div key={item.title}>
              <item.icon className="h-6 w-6 text-gold" aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg text-indigo-900 dark:text-ivory">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted dark:text-indigo-300">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

