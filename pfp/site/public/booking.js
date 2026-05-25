// Simple booking API handler for Party Favor Photo
// This is a static fallback - production should use a backend service

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', handleBookingSubmit);
  }
});

async function handleBookingSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  
  // Validate required fields
  const required = ['name', 'email', 'phone', 'eventType', 'eventDate'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    alert('Por favor complete todos los campos requeridos: ' + missing.join(', '));
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    alert('Por favor ingrese un correo electrónico válido');
    return;
  }
  
  // In production, this would POST to a real backend
  // For now, we'll show a success message and log the data
  console.log('Booking request:', data);
  
  // Show success message
  const bookingId = 'PFP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  
  alert(`
    ✅ ¡Solicitud de reserva recibida!
    
    ID de reserva: ${bookingId}
    
    Nos pondremos en contacto con usted dentro de 24 horas.
    
    Próximos pasos:
    1. Revisaremos su solicitud
    2. Enviaremos contrato por correo electrónico
    3. Recopilaremos depósito vía Stripe
    4. Confirmaremos la reserva
    
    Gracias por elegir Party Favor Photo!
  `);
  
  // Reset form
  e.target.reset();
  
  // In production, send to backend:
  /*
  try {
    const response = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) {
      alert('¡Reserva enviada con éxito! ID: ' + result.bookingId);
    }
  } catch (error) {
    alert('Error al enviar la reserva. Por favor contacte bookings@partyfavorphoto.com');
  }
  */
}
