import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Plane, Hotel, Utensils, MapPin as PinIcon, Bus, StickyNote } from 'lucide-react';
import { useItineraries, useItinerary, useCreateItinerary, useDeleteItinerary, useAddItineraryItem, useDeleteItineraryItem } from '../../lib/queries.js';
import { Skeleton, EmptyState, ErrorState } from '../ui/Surfaces.jsx';
import Button from '../ui/Button.jsx';

const TYPE_ICON = { flight: Plane, hotel: Hotel, activity: PinIcon, meal: Utensils, transport: Bus, note: StickyNote };

export default function ItineraryTab() {
  const { data: itineraries, isLoading, isError, refetch } = useItineraries();
  const [selectedId, setSelectedId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const activeId = selectedId || itineraries?.[0]?._id;

  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (isError) return <ErrorState description="Couldn't load itineraries." onRetry={refetch} />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
      <div>
        <Button variant="outline" className="w-full" onClick={() => setShowNewForm((s) => !s)}>
          <Plus className="h-4 w-4" /> New itinerary
        </Button>
        {showNewForm && <NewItineraryForm onCreated={(it) => { setSelectedId(it._id); setShowNewForm(false); }} />}

        <div className="mt-4 space-y-1">
          {itineraries?.map((it) => (
            <button
              key={it._id}
              onClick={() => setSelectedId(it._id)}
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                it._id === activeId ? 'bg-indigo-900 text-ivory' : 'text-indigo-900 dark:text-ivory hover:bg-indigo-50 dark:hover:bg-indigo-800'
              }`}
            >
              {it.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        {!activeId && (
          <EmptyState title="No itineraries yet" description="Create one to start planning your trip day by day." />
        )}
        {activeId && <ItineraryDetail id={activeId} onDeleted={() => setSelectedId(null)} />}
      </div>
    </div>
  );
}

function NewItineraryForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { mutate: create, isPending } = useCreateItinerary();
  const qc = useQueryClient();

  const submit = (e) => {
    e.preventDefault();
    create(
      { title, startDate: startDate || undefined, endDate: endDate || undefined },
      { onSuccess: (it) => { qc.invalidateQueries({ queryKey: ['itineraries'] }); onCreated(it); setTitle(''); } }
    );
  };

  return (
    <form onSubmit={submit} className="card mt-3 space-y-2 p-3">
      <input className="input text-sm" placeholder="Trip title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <div className="flex gap-2">
        <input type="date" className="input text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="input text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <Button type="submit" variant="accent" loading={isPending} className="w-full text-sm">Create</Button>
    </form>
  );
}

function ItineraryDetail({ id, onDeleted }) {
  const { data: itinerary, isLoading, refetch } = useItinerary(id);
  const { mutate: deleteItinerary } = useDeleteItinerary();
  const { mutate: addItem, isPending: adding } = useAddItineraryItem();
  const { mutate: deleteItem } = useDeleteItineraryItem();
  const [newItem, setNewItem] = useState({ day: 1, type: 'activity', title: '', time: '', location: '' });
  const qc = useQueryClient();

  if (isLoading || !itinerary) return <Skeleton className="h-64 w-full" />;

  const days = [...new Set(itinerary.items.map((i) => i.day))].sort((a, b) => a - b);
  const maxDay = Math.max(1, ...itinerary.items.map((i) => i.day));

  const submitItem = (e) => {
    e.preventDefault();
    addItem(
      { itineraryId: id, ...newItem, day: Number(newItem.day) },
      { onSuccess: () => { refetch(); setNewItem({ day: newItem.day, type: 'activity', title: '', time: '', location: '' }); } }
    );
  };

  const handleDelete = () => {
    if (!confirm('Delete this itinerary?')) return;
    deleteItinerary(id, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['itineraries'] }); onDeleted(); } });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">{itinerary.title}</h3>
        <button onClick={handleDelete} className="btn-ghost text-xs text-error hover:bg-error/5">
          <Trash2 className="h-3.5 w-3.5" /> Delete trip
        </button>
      </div>

      <form onSubmit={submitItem} className="card mt-4 grid grid-cols-2 gap-2 p-4 sm:grid-cols-6">
        <input type="number" min={1} className="input text-sm" value={newItem.day} onChange={(e) => setNewItem((f) => ({ ...f, day: e.target.value }))} placeholder="Day" />
        <select className="input text-sm" value={newItem.type} onChange={(e) => setNewItem((f) => ({ ...f, type: e.target.value }))}>
          <option value="activity">Activity</option>
          <option value="flight">Flight</option>
          <option value="hotel">Hotel</option>
          <option value="meal">Meal</option>
          <option value="transport">Transport</option>
          <option value="note">Note</option>
        </select>
        <input className="input text-sm sm:col-span-2" placeholder="Title" value={newItem.title} onChange={(e) => setNewItem((f) => ({ ...f, title: e.target.value }))} required />
        <input className="input text-sm" placeholder="Time" value={newItem.time} onChange={(e) => setNewItem((f) => ({ ...f, time: e.target.value }))} />
        <Button type="submit" variant="accent" loading={adding} className="text-sm">Add</Button>
      </form>

      <div className="mt-6 space-y-6">
        {days.length === 0 && <p className="text-sm text-muted dark:text-indigo-300">No items yet — add your first stop above.</p>}
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => {
          const dayItems = itinerary.items.filter((i) => i.day === day).sort((a, b) => a.order - b.order);
          if (dayItems.length === 0) return null;
          return (
            <div key={day}>
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted dark:text-indigo-300">Day {day}</h4>
              <div className="mt-2 space-y-2">
                {dayItems.map((item) => {
                  const Icon = TYPE_ICON[item.type] || PinIcon;
                  return (
                    <div key={item._id} className="flex items-center justify-between rounded border border-border dark:border-indigo-800 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gold" />
                        <div>
                          <p className="text-sm text-indigo-900 dark:text-ivory">{item.title}</p>
                          {item.time && <p className="text-xs text-muted dark:text-indigo-300">{item.time}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem({ itineraryId: id, itemId: item._id }, { onSuccess: () => refetch() })}
                        className="text-muted dark:text-indigo-300 hover:text-error"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
