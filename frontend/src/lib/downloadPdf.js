import { api } from './api.js';

export async function downloadBookingConfirmationPdf(bookingId, bookingReference) {
  const response = await api.get(`/bookings/${bookingId}/confirmation-pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `Aerlume-${bookingReference || bookingId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
