import PDFDocument from 'pdfkit';

const INDIGO = '#0B1E3D';
const GOLD = '#F4A340';
const MUTED = '#5B6B8C';
const BORDER = '#E7E1D4';
const TEXT = '#1C2B4A';

function divider(doc) {
  doc.moveDown(0.6);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(BORDER).lineWidth(1).stroke();
  doc.moveDown(0.6);
}

function sectionHeading(doc, text) {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(INDIGO).text(text);
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor(TEXT);
}

/**
 * Streams a booking confirmation PDF directly to the response. Only meant
 * to be called for CONFIRMED/COMPLETED bookings — the controller enforces
 * that before this runs, since a "confirmation" for an unpaid hold would
 * be misleading.
 */
export function streamBookingConfirmationPDF(booking, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Aerlume-${booking.bookingReference}.pdf"`);
  doc.pipe(res);

  // Header band
  doc.rect(0, 0, doc.page.width, 96).fill(INDIGO);
  doc.fillColor('#FAF8F3').fontSize(22).font('Helvetica-Bold').text('AERLUME', 50, 32);
  doc.fillColor(GOLD).fontSize(10).font('Helvetica').text('BOOKING CONFIRMATION', 50, 60);
  doc.rect(50, 78, 48, 2).fill(GOLD); // horizon-line motif, echoed in the PDF

  doc.moveDown(5.5);
  doc.fillColor(INDIGO).fontSize(17).font('Helvetica-Bold').text(`Reference: ${booking.bookingReference}`);
  doc.moveDown(0.2);
  doc.fontSize(10).font('Helvetica').fillColor(MUTED).text(
    `Status: ${booking.status}   |   Payment: ${booking.paymentStatus}   |   Booked: ${new Date(booking.createdAt).toLocaleDateString()}`
  );

  divider(doc);

  sectionHeading(doc, 'Trip details');
  if (booking.bookingType === 'flight') {
    const f = booking.flight?.flightRef;
    doc.text(`${f?.airline?.name || 'Airline'} ${f?.flightNumber || ''}`);
    doc.text(`${f?.origin?.city || f?.origin?.code || ''} (${f?.origin?.code || ''}) → ${f?.destination?.city || f?.destination?.code || ''} (${f?.destination?.code || ''})`);
    if (f?.departureTime) doc.text(`Departs: ${new Date(f.departureTime).toLocaleString()}`);
    if (f?.arrivalTime) doc.text(`Arrives: ${new Date(f.arrivalTime).toLocaleString()}`);
    doc.text(`Cabin: ${booking.flight.cabin}`);
    if (booking.flight.tripType === 'round_trip') doc.text('Trip type: Round trip');
  } else if (booking.bookingType === 'hotel') {
    const h = booking.hotel?.hotelRef;
    doc.text(`${h?.name || 'Hotel'}`);
    if (h?.address) doc.text(`${h.address.line1 || ''} ${h.address.city || ''}, ${h.address.country || ''}`.trim());
    doc.text(`Check-in: ${booking.hotel.checkIn}    Check-out: ${booking.hotel.checkOut}`);
    doc.text(`${booking.hotel.nights} night(s) · ${booking.hotel.roomsBooked} room(s)`);
  } else if (booking.bookingType === 'package') {
    const p = booking.package?.packageRef;
    doc.text(`${p?.title || 'Package'}`);
    doc.text(`Departure date: ${booking.package.startDate}`);
    doc.text(`Travelers: ${booking.package.travelerSlots}`);
  }

  divider(doc);

  sectionHeading(doc, 'Travelers');
  for (const t of booking.travelers) {
    doc.text(`${t.firstName} ${t.lastName}${t.type ? ` (${t.type})` : ''}`);
  }
  doc.moveDown(0.2);
  doc.fontSize(9).fillColor(MUTED).text(`Contact: ${booking.contactEmail}${booking.contactPhone ? ` · ${booking.contactPhone}` : ''}`);

  divider(doc);

  sectionHeading(doc, 'Payment summary');
  const p = booking.pricing;
  doc.text(`Base price: ${p.currency} ${p.basePrice.toFixed(2)}`);
  if (p.discount > 0) doc.text(`Discount${p.couponCode ? ` (${p.couponCode})` : ''}: -${p.currency} ${p.discount.toFixed(2)}`);
  doc.text(`Taxes: ${p.currency} ${p.taxes.toFixed(2)}`);
  doc.text(`Fees: ${p.currency} ${p.fees.toFixed(2)}`);
  doc.moveDown(0.3);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(INDIGO).text(`Total paid: ${p.currency} ${p.total.toFixed(2)}`);

  divider(doc);

  doc.fontSize(9).font('Helvetica').fillColor(MUTED).text(
    'Cancellation policy: eligible bookings may be cancelled from your Aerlume dashboard up to 48 hours before ' +
      'travel. Refunds, where applicable, are processed to your original payment method and may take 5–10 ' +
      'business days to appear on your statement.',
    { width: 495 }
  );
  doc.moveDown(0.6);
  doc.text('Please retain this document for your records. Questions? Contact support through your Aerlume dashboard.', { width: 495 });

  doc.end();
}
