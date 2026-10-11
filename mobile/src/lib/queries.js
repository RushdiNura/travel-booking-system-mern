import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from './api.js';

const clean = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== '' && v !== null));

/* ── Destinations ─────────────────────────────────────────────────── */

export function useDestinations(params = {}) {
  return useQuery({
    queryKey: ['destinations', params],
    queryFn: async () => (await api.get('/destinations', { params: clean(params) })).data,
  });
}

/* ── Flights ──────────────────────────────────────────────────────── */

export function useFlightSearch(params) {
  return useQuery({
    queryKey: ['flights', params],
    queryFn: async () => (await api.get('/flights', { params: clean(params) })).data,
    enabled: Boolean(params.origin && params.destination),
  });
}

/* ── Hotels ───────────────────────────────────────────────────────── */

export function useHotelSearch(params) {
  return useQuery({
    queryKey: ['hotels', params],
    queryFn: async () => (await api.get('/hotels', { params: clean(params) })).data,
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

/* ── Packages ─────────────────────────────────────────────────────── */

export function usePackageSearch(params = {}) {
  return useQuery({
    queryKey: ['packages', params],
    queryFn: async () => (await api.get('/packages', { params: clean(params) })).data,
  });
}

export function usePackage(id) {
  return useQuery({
    queryKey: ['package', id],
    queryFn: async () => (await api.get(`/packages/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

/* ── Bookings ─────────────────────────────────────────────────────── */

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

export function useMyBookings(params = {}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => (await api.get('/bookings', { params: clean(params) })).data,
  });
}

export function useCancelBooking() {
  return useMutation({
    mutationFn: async ({ id, reason }) => (await api.post(`/bookings/${id}/cancel`, { reason })).data.data,
  });
}

/* ── Payments ─────────────────────────────────────────────────────── */

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (bookingId) => (await api.post('/payments/create-intent', { bookingId })).data.data,
  });
}

/* ── Profile ──────────────────────────────────────────────────────── */

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (payload) => (await api.patch('/auth/me', payload)).data.data.user,
  });
}
