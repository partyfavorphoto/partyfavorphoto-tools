# Party Favor Photo Booking API

## Base URL
```
https://partyfavorphoto.com/api/booking
```

## Endpoints

### POST /api/booking
Submit a new booking request.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "eventType": "wedding|corporate|party",
  "eventDate": "2026-06-15",
  "eventTime": "18:00",
  "venue": "Venue Name",
  "address": "123 Main St, Washington, DC 20001",
  "package": "wedding|corporate|party",
  "addons": ["guest_book", "custom_template"],
  "message": "Special requests or notes"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "bookingId": "PFP-2026-0001",
  "message": "Booking request received. We will contact you within 24 hours.",
  "nextSteps": [
    "Review your request",
    "Send contract via email",
    "Collect deposit via Stripe",
    "Confirm booking"
  ]
}
```

### GET /api/availability
Check availability for a date.

**Query Parameters:**
- `date` (required): Event date in YYYY-MM-DD format

**Response (200 OK):**
```json
{
  "date": "2026-06-15",
  "available": true,
  "slots": ["morning", "afternoon", "evening"]
}
```

**Response (409 Conflict):**
```json
{
  "date": "2026-06-15",
  "available": false,
  "reason": "Already booked",
  "alternativeDates": ["2026-06-14", "2026-06-16", "2026-06-21"]
}
```

### GET /api/business-data.json
Get complete business information (services, pricing, contact info).

**Response (200 OK):**
```json
{
  "business": {...},
  "services": [...],
  "paymentMethods": [...],
  "bookingUrl": "..."
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Missing required field: email",
  "field": "email"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Validation failed",
  "fields": {
    "email": "Invalid email format",
    "phone": "Phone number must be in format (XXX) XXX-XXXX"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error",
  "message": "Unable to process request. Please try again later.",
  "contact": "bookings@partyfavorphoto.com"
}
```

## Rate Limits
- 10 requests per minute per IP
- 100 requests per hour per IP

## Contact
- Email: bookings@partyfavorphoto.com
- Phone: (202) 798-0610
- Hours: Mon-Thu 9AM-9PM, Fri-Sat 9AM-11PM, Sun 10AM-8PM
