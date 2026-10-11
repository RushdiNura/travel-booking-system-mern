import { useState } from 'react';
import { Search, ArrowLeftRight } from 'lucide-react';

export default function FlightSearchForm({ initial = {}, onSearch }) {
  const [form, setForm] = useState({
    origin: initial.origin || '',
    destination: initial.destination || '',
    departureDate: initial.departureDate || '',
    travelers: initial.travelers || 1,
    cabin: initial.cabin || 'economy',
  });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const swap = () => setForm((f) => ({ ...f, origin: f.destination, destination: f.origin }));

  const submit = (e) => {
    e.preventDefault();
    onSearch(form);
  };

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-1">
          <label className="label" htmlFor="origin">From</label>
          <input
            id="origin"
            className="input uppercase"
            placeholder="JFK"
            maxLength={4}
            value={form.origin}
            onChange={update('origin')}
            required
          />
        </div>
        <div className="relative lg:col-span-1">
          <label className="label" htmlFor="destination">To</label>
          <input
            id="destination"
            className="input uppercase"
            placeholder="LIS"
            maxLength={4}
            value={form.destination}
            onChange={update('destination')}
            required
          />
          <button
            type="button"
            onClick={swap}
            aria-label="Swap origin and destination"
            className="absolute -left-3 top-8 hidden h-6 w-6 items-center justify-center rounded-full border border-border dark:border-indigo-800 bg-surface dark:bg-indigo-900 lg:flex"
          >
            <ArrowLeftRight className="h-3 w-3 text-muted dark:text-indigo-300" />
          </button>
        </div>
        <div className="lg:col-span-1">
          <label className="label" htmlFor="departureDate">Depart</label>
          <input
            id="departureDate"
            type="date"
            className="input"
            value={form.departureDate}
            onChange={update('departureDate')}
            required
          />
        </div>
        <div className="lg:col-span-1">
          <label className="label" htmlFor="travelers">Travelers</label>
          <input
            id="travelers"
            type="number"
            min={1}
            max={9}
            className="input"
            value={form.travelers}
            onChange={update('travelers')}
          />
        </div>
        <div className="lg:col-span-1">
          <label className="label" htmlFor="cabin">Cabin</label>
          <select id="cabin" className="input" value={form.cabin} onChange={update('cabin')}>
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </div>
        <div className="flex items-end lg:col-span-1">
          <button type="submit" className="btn-accent w-full">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
      </div>
    </form>
  );
}
