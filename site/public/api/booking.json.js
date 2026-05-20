/**
 * Party Favor Photo - AI Booking API
 * This file provides a mock implementation of the requested booking endpoints.
 * In a real production environment, these would be handled by a server-side framework.
 */

const BASE_PRICE_2HRS = 498;
const HOURLY_RATE = 249;

const SERVICES = {
  "StudioStation": { base: 498, hourly: 249, minHours: 2 },
  "WeddingPackage": { base: 998, hourly: 249, minHours: 4 },
  "CorporateEvent": { base: 750, hourly: 249, minHours: 3 },
  "CelebrationPackage": { base: 595, hourly: 150, minHours: 3 }
};

const ADDONS = {
  "GuestBook": 150,
  "CustomBackdrop": 200,
  "ExtraAttendant": 250,
  "SocialSharingStation": 100
};

export const handleRequest = async (path, method, params) => {
  switch (path) {
    case '/api/booking/availability':
      return checkAvailability(params);
    case '/api/booking/calculate-price':
      return calculatePrice(params);
    case '/api/booking/add-to-cart':
      return addToCart(params);
    case '/api/booking/checkout':
      return checkout(params);
    default:
      return { error: "Endpoint not found" };
  }
};

function checkAvailability({ date, duration_hours }) {
  if (!date || !duration_hours) {
    return { error: "Missing required parameters: date, duration_hours" };
  }
  
  // Mock availability logic: Weekends are busy, weekdays are usually free
  const day = new Date(date).getDay();
  const isWeekend = (day === 0 || day === 6);
  const isAvailable = Math.random() > (isWeekend ? 0.4 : 0.1);

  return {
    is_available: isAvailable,
    unavailable_reason: isAvailable ? null : "Fully booked for this date",
    suggested_alternative_dates: isAvailable ? [] : [
      new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0],
      new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0]
    ]
  };
}

function calculatePrice({ service_type, date, duration_hours, addons = [] }) {
  const service = SERVICES[service_type] || SERVICES["StudioStation"];
  const hours = Math.max(duration_hours || 0, service.minHours);
  
  let basePrice = service.base;
  if (hours > service.minHours) {
    basePrice += (hours - service.minHours) * service.hourly;
  }

  const addonCosts = addons.map(addon => ({
    name: addon,
    price: ADDONS[addon] || 0
  }));

  const totalAddons = addonCosts.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = basePrice + totalAddons;

  return {
    total_price: totalPrice,
    breakdown: {
      base_price: basePrice,
      service_type: service_type,
      hours: hours,
      addons: addonCosts
    },
    currency: "USD"
  };
}

function addToCart(params) {
  const priceData = calculatePrice(params);
  const sessionId = "sess_" + Math.random().toString(36).substr(2, 9);
  
  return {
    booking_session_id: sessionId,
    current_cart_contents: {
      items: [{
        ...priceData.breakdown,
        total: priceData.total_price
      }],
      total_price: priceData.total_price
    },
    status: "success"
  };
}

function checkout({ booking_session_id, customer_info }) {
  if (!booking_session_id || !customer_info) {
    return { error: "Missing session ID or customer info" };
  }

  return {
    booking_status: "confirmed",
    confirmation_number: "PFP-" + Math.random().toString(36).toUpperCase().substr(2, 6),
    message: "Booking confirmed! A representative will contact you shortly.",
    payment_status: "pending_invoice",
    payment_link: "https://partyfavorphoto.com/payments/invoice_" + booking_session_id
  };
}
