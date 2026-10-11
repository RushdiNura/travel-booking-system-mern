import { Trash2, UserPlus } from 'lucide-react';

export default function TravelerForm({ travelers, onChange, minTravelers = 1, maxTravelers = 9 }) {
  const update = (index, field, value) => {
    const next = travelers.map((t, i) => (i === index ? { ...t, [field]: value } : t));
    onChange(next);
  };

  const addTraveler = () => {
    if (travelers.length >= maxTravelers) return;
    onChange([...travelers, { firstName: '', lastName: '', type: 'adult' }]);
  };

  const removeTraveler = (index) => {
    if (travelers.length <= minTravelers) return;
    onChange(travelers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {travelers.map((traveler, i) => (
        <div key={i} className="rounded border border-border dark:border-indigo-800 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-indigo-900 dark:text-ivory">Traveler {i + 1}</p>
            {travelers.length > minTravelers && (
              <button
                type="button"
                onClick={() => removeTraveler(i)}
                className="text-muted dark:text-indigo-300 hover:text-error"
                aria-label={`Remove traveler ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">First name</label>
              <input
                className="input"
                value={traveler.firstName}
                onChange={(e) => update(i, 'firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Last name</label>
              <input
                className="input"
                value={traveler.lastName}
                onChange={(e) => update(i, 'lastName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={traveler.type} onChange={(e) => update(i, 'type', e.target.value)}>
                <option value="adult">Adult</option>
                <option value="child">Child</option>
                <option value="infant">Infant</option>
              </select>
            </div>
            <div>
              <label className="label">Date of birth (optional)</label>
              <input
                type="date"
                className="input"
                value={traveler.dateOfBirth || ''}
                onChange={(e) => update(i, 'dateOfBirth', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      {travelers.length < maxTravelers && (
        <button type="button" onClick={addTraveler} className="btn-ghost">
          <UserPlus className="h-4 w-4" /> Add another traveler
        </button>
      )}
    </div>
  );
}
