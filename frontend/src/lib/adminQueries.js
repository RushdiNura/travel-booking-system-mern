import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';

/* ── Overview & analytics ─────────────────────────────────────────── */

export function useAdminOverview() {
  return useQuery({ queryKey: ['admin-overview'], queryFn: async () => (await api.get('/admin/overview')).data.data });
}

export function useAdminRevenue(days = 30) {
  return useQuery({
    queryKey: ['admin-revenue', days],
    queryFn: async () => (await api.get('/admin/analytics/revenue', { params: { days } })).data.data,
  });
}

export function useAdminBookingsOverTime(days = 30) {
  return useQuery({
    queryKey: ['admin-bookings-over-time', days],
    queryFn: async () => (await api.get('/admin/analytics/bookings-over-time', { params: { days } })).data.data,
  });
}

export function useAdminPopularDestinations() {
  return useQuery({
    queryKey: ['admin-popular-destinations'],
    queryFn: async () => (await api.get('/admin/analytics/popular-destinations')).data.data,
  });
}

export function useAdminCancellationRate() {
  return useQuery({
    queryKey: ['admin-cancellation-rate'],
    queryFn: async () => (await api.get('/admin/analytics/cancellation-rate')).data.data,
  });
}

/* ── Users ────────────────────────────────────────────────────────── */

export function useAdminUsers(params = {}) {
  return useQuery({ queryKey: ['admin-users', params], queryFn: async () => (await api.get('/admin/users', { params })).data });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }) => (await api.patch(`/admin/users/${id}/status`, { isActive })).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }) => (await api.patch(`/admin/users/${id}/role`, { role })).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

/* ── Flights ──────────────────────────────────────────────────────── */

export function useAdminFlights(params = {}) {
  return useQuery({ queryKey: ['admin-flights', params], queryFn: async () => (await api.get('/admin/flights', { params })).data });
}

export function useCreateFlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/admin/flights', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-flights'] }),
  });
}

export function useUpdateFlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.patch(`/admin/flights/${id}`, payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-flights'] }),
  });
}

export function useDeactivateFlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/admin/flights/${id}/deactivate`)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-flights'] }),
  });
}

/* ── Hotels & rooms ───────────────────────────────────────────────── */

export function useAdminHotels(params = {}) {
  return useQuery({ queryKey: ['admin-hotels', params], queryFn: async () => (await api.get('/admin/hotels', { params })).data });
}

export function useCreateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/admin/hotels', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-hotels'] }),
  });
}

export function useUpdateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.patch(`/admin/hotels/${id}`, payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-hotels'] }),
  });
}

export function useDeactivateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/admin/hotels/${id}/deactivate`)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-hotels'] }),
  });
}

export function useCreateRoomType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ hotelId, ...payload }) => (await api.post(`/admin/hotels/${hotelId}/rooms`, payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-hotels'] }),
  });
}

/* ── Packages ─────────────────────────────────────────────────────── */

export function useAdminPackages(params = {}) {
  return useQuery({ queryKey: ['admin-packages', params], queryFn: async () => (await api.get('/admin/packages', { params })).data });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/admin/packages', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-packages'] }),
  });
}

export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.patch(`/admin/packages/${id}`, payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-packages'] }),
  });
}

export function useDeactivatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/admin/packages/${id}/deactivate`)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-packages'] }),
  });
}

/* ── Bookings (admin view) ────────────────────────────────────────── */

export function useAdminBookings(params = {}) {
  return useQuery({
    queryKey: ['admin-bookings', params],
    queryFn: async () => (await api.get('/bookings/admin/all', { params })).data,
  });
}
