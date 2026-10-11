import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from './api.js';

const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null));

export function useFlightSearch(params) {
  return useQuery({
    queryKey: ['flights', params],
    queryFn: async () => {
      const { data } = await api.get('/flights', { params: clean(params) });
      return data;
    },
    enabled: Boolean(params.origin && params.destination),
  });
}

export function useFlight(id) {
  return useQuery({
    queryKey: ['flight', id],
    queryFn: async () => (await api.get(`/flights/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/bookings', payload)).data.data.booking,
  });
}

export function useMyBooking(id) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => (await api.get(`/bookings/${id}`)).data.data,
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'PAYMENT_PENDING' ? 3000 : false),
  });
}

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (bookingId) => (await api.post('/payments/create-intent', { bookingId })).data.data,
  });
}

export function useMyBookings(params = {}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => (await api.get('/bookings', { params })).data,
  });
}

export function useCancelBooking() {
  return useMutation({
    mutationFn: async ({ id, reason }) => (await api.post(`/bookings/${id}/cancel`, { reason })).data.data,
  });
}

export function useSavedDestinations() {
  return useQuery({
    queryKey: ['saved-destinations'],
    queryFn: async () => (await api.get('/users/me/saved-destinations')).data.data,
  });
}

export function useSaveDestination() {
  return useMutation({
    mutationFn: async (destinationId) => (await api.post(`/users/me/saved-destinations/${destinationId}`)).data,
  });
}

export function useUnsaveDestination() {
  return useMutation({
    mutationFn: async (destinationId) => (await api.delete(`/users/me/saved-destinations/${destinationId}`)).data,
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (payload) => (await api.patch('/auth/me', payload)).data.data.user,
  });
}

/* ── Reviews ──────────────────────────────────────────────────────── */

export function useReviews(targetType, targetId) {
  return useQuery({
    queryKey: ['reviews', targetType, targetId],
    queryFn: async () => (await api.get('/reviews', { params: { targetType, targetId } })).data,
    enabled: Boolean(targetType && targetId),
  });
}

export function useCreateReview() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/reviews', payload)).data.data,
  });
}

/* ── Notifications ────────────────────────────────────────────────── */

export function useNotifications(params = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => (await api.get('/notifications', { params })).data,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: async (id) => (await api.patch(`/notifications/${id}/read`)).data,
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: async () => (await api.patch('/notifications/read-all')).data,
  });
}

/* ── Itineraries ──────────────────────────────────────────────────── */

export function useItineraries() {
  return useQuery({
    queryKey: ['itineraries'],
    queryFn: async () => (await api.get('/itineraries')).data.data,
  });
}

export function useItinerary(id) {
  return useQuery({
    queryKey: ['itinerary', id],
    queryFn: async () => (await api.get(`/itineraries/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useCreateItinerary() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/itineraries', payload)).data.data,
  });
}

export function useDeleteItinerary() {
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/itineraries/${id}`)).data,
  });
}

export function useAddItineraryItem() {
  return useMutation({
    mutationFn: async ({ itineraryId, ...payload }) => (await api.post(`/itineraries/${itineraryId}/items`, payload)).data.data,
  });
}

export function useDeleteItineraryItem() {
  return useMutation({
    mutationFn: async ({ itineraryId, itemId }) => (await api.delete(`/itineraries/${itineraryId}/items/${itemId}`)).data.data,
  });
}

export function useHotelSearch(params) {
  return useQuery({
    queryKey: ['hotels', params],
    queryFn: async () => {
      const { data } = await api.get('/hotels', { params: clean(params) });
      return data;
    },
  });
}

export function useHotel(id) {
  return useQuery({
    queryKey: ['hotel', id],
    queryFn: async () => (await api.get(`/hotels/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useRoomAvailability(hotelId, checkIn, checkOut, rooms) {
  return useQuery({
    queryKey: ['hotel-availability', hotelId, checkIn, checkOut, rooms],
    queryFn: async () =>
      (await api.get(`/hotels/${hotelId}/availability`, { params: { checkIn, checkOut, rooms } })).data.data,
    enabled: Boolean(hotelId && checkIn && checkOut),
  });
}

export function usePackageSearch(params) {
  return useQuery({
    queryKey: ['packages', params],
    queryFn: async () => {
      const { data } = await api.get('/packages', { params: clean(params) });
      return data;
    },
  });
}

export function usePackage(id) {
  return useQuery({
    queryKey: ['package', id],
    queryFn: async () => (await api.get(`/packages/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useDestinations(params = {}) {
  return useQuery({
    queryKey: ['destinations', params],
    queryFn: async () => (await api.get('/destinations', { params: clean(params) })).data,
  });
}

export function useDestination(slug) {
  return useQuery({
    queryKey: ['destination', slug],
    queryFn: async () => (await api.get(`/destinations/${slug}`)).data.data,
    enabled: Boolean(slug),
  });
}

export function useDestinationWeather(slug) {
  return useQuery({
    queryKey: ['destination-weather', slug],
    queryFn: async () => (await api.get(`/destinations/${slug}/weather`)).data.data,
    enabled: Boolean(slug),
  });
}

/* ── AI Trip Planner ──────────────────────────────────────────────── */

export function usePlannerStatus() {
  return useQuery({
    queryKey: ['ai-planner-status'],
    queryFn: async () => (await api.get('/ai/status')).data.data,
  });
}

export function useGenerateTripPlan() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/ai/trip-plan', payload)).data.data,
  });
}
