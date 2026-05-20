# Party Favor Photo - AI Booking API Documentation

This API is designed for programmatic interaction by AI agents to check availability, calculate pricing, and facilitate photo booth bookings.

## Base URL
`https://partyfavorphoto.vercel.app/api/booking`

## Endpoints

### 1. Check Availability
`GET https://partyfavorphoto.vercel.app/api/booking/availability`

**Parameters:**
- `date` (string, YYYY-MM-DD): The requested event date.
- `duration_hours` (number): Requested duration in hours.

**Response:**
```json
{
  "is_available": true,
  "unavailable_reason": null,
  "suggested_alternative_dates": []
}
```

### 2. Calculate Price
`POST https://partyfavorphoto.vercel.app/api/booking/calculate-price`

**Body:**
- `service_type` (string): "StudioStation", "WeddingPackage", "CorporateEvent", or "CelebrationPackage".
- `date` (string, YYYY-MM-DD): Event date.
- `duration_hours` (number): Total hours.
- `addons` (array of strings, optional): ["GuestBook", "CustomBackdrop", "ExtraAttendant", "SocialSharingStation"].

**Response:**
```json
{
  "total_price": 648,
  "breakdown": {
    "base_price": 498,
    "service_type": "StudioStation",
    "hours": 2,
    "addons": []
  },
  "currency": "USD"
}
```

### 3. Add to Cart / Initiate Session
`POST https://partyfavorphoto.vercel.app/api/booking/add-to-cart`

**Body:** Same as Calculate Price, plus:
- `customer_info` (object): `{ "name": "...", "email": "..." }`

**Response:**
```json
{
  "booking_session_id": "sess_abc123",
  "current_cart_contents": { ... },
  "status": "success"
}
```

### 4. Checkout / Finalize Booking
`POST https://partyfavorphoto.vercel.app/api/booking/checkout`

**Body:**
- `booking_session_id` (string): The ID returned from add-to-cart.
- `customer_info` (object): Full customer details.
- `payment_details` (object): Tokenized payment info.

**Response:**
```json
{
  "booking_status": "confirmed",
  "confirmation_number": "PFP-X123Y",
  "payment_link": "..."
}
```

## AI Discovery
AI agents can discover these endpoints via the `well-known` pattern or the `link` tags in the site's header.
