import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, AlertTriangle, Save } from 'lucide-react';
import { usePlannerStatus, useGenerateTripPlan, useCreateItinerary, useAddItineraryItem } from '../lib/queries.js';
import Seo from '../components/Seo.jsx';
import Button from '../components/ui/Button.jsx';

const INTEREST_OPTIONS = ['Food', 'Nature', 'History', 'Nightlife', 'Art & culture', 'Adventure', 'Relaxation', 'Shopping'];

export default function TripPlanner() {
  const { data: status, isLoading: statusLoading } = usePlannerStatus();
  const { mutate: generate, isPending: generating } = useGenerateTripPlan();
  const { mutate: createItinerary } = useCreateItinerary();
  const { mutate: addItem } = useAddItineraryItem();
  const navigate = useNavigate();

  const [form, setForm] = useState({ destination: '', durationDays: 5, budget: '', travelers: 2, travelStyle: '', interests: [] });
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleInterest = (interest) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest) ? f.interests.filter((i) => i !== interest) : [...f.interests, interest],
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setPlan(null);
    setSaved(false);
    generate(form, {
      onSuccess: setPlan,
      onError: (err) => setError(err.response?.data?.message || 'Could not generate a plan right now.'),
    });
  };

  const saveToItinerary = () => {
    setSaving(true);
    createItinerary(
      { title: plan.title },
      {
        onSuccess: async (itinerary) => {
          for (const day of plan.days) {
            for (const activity of day.activities) {
              // Sequential to respect array item ordering within each day.
              // eslint-disable-next-line no-await-in-loop
              await new Promise((resolve) => {
                addItem({ itineraryId: itinerary._id, day: day.day, type: 'activity', title: activity }, { onSettled: resolve });
              });
            }
          }
          setSaving(false);
          setSaved(true);
        },
        onError: () => setSaving(false),
      }
    );
  };

  return (
    <div className="container-page py-10">
      <Seo title="AI trip planner" description="Generate a personalized day-by-day trip plan based on your destination, budget, and interests." />
      <h1 className="flex items-center gap-2 font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">
        <Sparkles className="h-6 w-6 text-gold" /> AI trip planner
      </h1>
      <div className="horizon-rule mt-3" />

      {!statusLoading && !status?.configured && (
        <div className="card mt-6 flex items-start gap-3 border-warning/30 bg-warning/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-indigo-900 dark:text-ivory">The AI trip planner isn't configured yet</p>
            <p className="mt-1 text-sm text-muted dark:text-indigo-300">Set <code className="rounded bg-indigo-50 dark:bg-indigo-800 px-1.5 py-0.5 text-xs">AI_API_KEY</code> in the backend's environment to enable it.</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="card space-y-4 p-5">
          <div>
            <label className="label">Destination</label>
            <input className="input" placeholder="e.g. Nairobi" value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duration (days)</label>
              <input type="number" min={1} max={21} className="input" value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Travelers</label>
              <input type="number" min={1} className="input" value={form.travelers} onChange={(e) => setForm((f) => ({ ...f, travelers: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Budget (optional)</label>
            <input className="input" placeholder="e.g. budget-friendly, $150/day" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
          </div>
          <div>
            <label className="label">Travel style (optional)</label>
            <input className="input" placeholder="e.g. relaxed, packed, family-friendly" value={form.travelStyle} onChange={(e) => setForm((f) => ({ ...f, travelStyle: e.target.value }))} />
          </div>
          <div>
            <label className="label">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    form.interests.includes(interest) ? 'border-indigo-900 bg-indigo-900 text-ivory' : 'border-border dark:border-indigo-800 text-muted dark:text-indigo-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" variant="accent" loading={generating} className="w-full" disabled={!status?.configured}>
            {generating ? 'Generating...' : 'Generate plan'}
          </Button>
          {error && <p className="text-sm text-error">{error}</p>}
        </form>

        <div>
          {generating && (
            <div className="flex h-64 items-center justify-center text-muted dark:text-indigo-300">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {!generating && !plan && (
            <div className="flex h-64 items-center justify-center text-center text-sm text-muted dark:text-indigo-300">
              Fill in the form and generate a personalized day-by-day plan.
            </div>
          )}
          {plan && (
            <div>
              <h2 className="font-display text-xl text-indigo-900 dark:text-ivory">{plan.title}</h2>
              <p className="mt-1 text-sm text-muted dark:text-indigo-300">{plan.summary}</p>
              {plan.estimatedBudgetNote && <p className="mt-1 text-xs text-muted dark:text-indigo-300">{plan.estimatedBudgetNote}</p>}

              <ol className="mt-6 space-y-5 border-l border-border dark:border-indigo-800 pl-5">
                {plan.days.map((day) => (
                  <li key={day.day} className="relative">
                    <span className="absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-indigo-950">
                      {day.day}
                    </span>
                    <p className="font-medium text-indigo-900 dark:text-ivory">{day.title}</p>
                    <p className="mt-1 text-sm text-muted dark:text-indigo-300">{day.description}</p>
                    <ul className="mt-2 space-y-1">
                      {day.activities.map((activity, i) => (
                        <li key={i} className="text-sm text-indigo-900 dark:text-ivory">· {activity}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex items-center gap-3">
                <Button variant="outline" onClick={saveToItinerary} loading={saving} disabled={saved}>
                  <Save className="h-4 w-4" /> {saved ? 'Saved to itinerary' : 'Save to my itineraries'}
                </Button>
                {saved && (
                  <button onClick={() => navigate('/dashboard')} className="text-sm text-indigo-600 dark:text-gold hover:underline">
                    View in dashboard
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
