# Party Favor Photo — Tave Replacement Architecture

## What Tave Did (Full Feature Inventory)

| Feature | Tave Name | Our Replacement |
|---------|-----------|----------------|
| Online booking/scheduling | Scheduling | Supabase Edge Functions + Relay |
| Lead capture forms | Contact Forms | resend-email + Supabase |
| Client portal | Client Portal | partyfavorphoto.vercel.app |
| Automated workflows | Workflows + Automations | Relay task runner + cron |
| Contracts + e-signatures | Contracts | Supabase + email |
| Quotes with packages | Quotes | Edge function API |
| Invoicing + payment plans | Invoicing | Stripe Edge Functions (already exist) |
| Online payments (Stripe) | Payments | Existing stripe-payment-webhook |
| Client questionnaires | Questionnaires | Supabase forms + email |
| Lead tracking/reporting | Reporting | Supabase queries |
| Text messaging | Text Messaging | Relay + Twilio (future) |
| Email delivery tracking | Email Tracking | Resend webhooks |
| Multi-user/team | Users | Supabase auth |
| Multi-brand | Brands | Supabase organizations |
| Template gallery | Templates | Pre-built Supabase workflows |
| Google Calendar sync | Calendar | Google Calendar API |
| Booking data for attendants | Job Details | Relay state + email to team |

---

## Phase 1 — Existing Infrastructure (Already Working)

### Email System ✅
- **resend-email edge function** — send via bookings@partyfavorphoto.com
- **Resend inbound** — receive all @partyfavorphoto.com emails
- **Webhook** → relay inbox for reply monitoring

### Website ✅
- partyfavorphoto.com (React/Vite via Lovable.dev)
- Booking API at /api/booking (availability, price calc, cart, checkout)
- Bilingual (EN/ES)

### Payments ✅ (Existing in Suite)
- stripe-payment-webhook edge function
- Stripe integration already deployed

---

## Phase 2 — Build Booking CRM (Today)

### 1. Booking Database (Supabase Table)
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Client info
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'StudioStation', 'Wedding', 'Corporate', 'Celebration'
  event_date DATE NOT NULL,
  event_time TIME,
  duration_hours INT NOT NULL DEFAULT 2,
  venue_name TEXT,
  venue_address TEXT,
  
  -- Package
  package_name TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  addons JSONB DEFAULT '[]',
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'lead', -- lead, quoted, contracted, deposit_paid, confirmed, completed, cancelled
  deposit_paid BOOLEAN DEFAULT false,
  balance_paid BOOLEAN DEFAULT false,
  
  -- Attachments
  notes TEXT,
  template_choice TEXT,
  custom_logo_url TEXT
);
```

### 2. Automated Email Workflows (Relay Cron)
Build these as cron-triggered tasks in the relay:

| Trigger | Action | Delay |
|---------|--------|-------|
| Lead captured | Send welcome + package info | Immediate |
| Quote sent | Follow-up if not opened | 48 hours |
| Deposit received | Send confirmation + questionnaire | Immediate |
| 14 days before event | Send final details confirmation | -14 days |
| 7 days before event | Send attendant instructions | -7 days |
| 1 day before event | Reminder to client | -1 day |
| Day after event | Thank you + review request | +1 day |

### 3. Client Questionnaires (Edge Function)
Create `pfp-questionnaire` edge function:
- Template style selection (radio buttons with images)
- Custom text for photo strips
- Upload logo/invitation
- Special requests
- Venue logistics (stairs, loading zone, parking)

### 4. Quote + Invoice System (Edge Function)
Create `pfp-quote` edge function:
- Generate itemized quotes for packages + addons
- Auto-calculate based on service type + hours
- Payment schedule: deposit (50%) + balance (14 days before)
- Stripe payment links generated automatically

### 5. Attendant Job Sheet (Email + State)
When a booking is confirmed:
- Auto-generate job sheet with: client name, venue, time, duration, template choice, logistics notes
- Email to assigned attendant
- Store in relay state for on-demand retrieval

### 6. Lead Tracking Dashboard (Relay Endpoint)
- `GET /pfp/leads` — list all leads with status
- `GET /pfp/upcoming` — upcoming events sorted by date
- `GET /pfp/revenue` — monthly revenue stats

---

## Phase 3 — Migration Steps

### Step 1: Deploy Booking Edge Function
```bash
cd zero-claw && npx supabase functions deploy pfp-booking --no-verify-jwt
```

### Step 2: Add Relay Endpoints
Add to `relay/server.js`:
- `/pfp/booking` — create booking (POST)
- `/pfp/booking/:id` — get booking details (GET)
- `/pfp/leads` — list all leads (GET)
- `/pfp/questionnaire` — submit questionnaire (POST)

### Step 3: Wire Website Booking Cart
The website already has a `BookingCart.tsx` component. Update it to POST to our relay endpoints instead of the old Tave API.

### Step 4: Set Up Daily Workflow Cron
Add to existing 8AM cron:
1. Check for unpaid balances due within 14 days → send reminder
2. Check for events tomorrow → send reminder + attendant sheet
3. Check for stale leads (no action 7 days) → send follow-up

---

## File Structure
```
relay/
  handlers/
    pfp-booking.mjs      -- booking CRUD
    pfp-quote.mjs        -- quote generation
    pfp-questionnaire.mjs -- client surveys
    pfp-automation.mjs   -- email workflows

zero-claw/
  supabase/functions/
    pfp-booking/         -- booking edge function
    pfp-quote/           -- quote/invoice edge function
    pfp-questionnaire/   -- client questionnaire

partyfavorphoto/
  src/
    api/                 -- new API routes
    components/
      BookingCart.tsx    -- updated to use relay
```

## Data Flow
```
Client (website)
  → BookingCart POST /pfp/booking
    → Relay stores in Supabase table
    → Auto-email: welcome + package info
    → Attendant job sheet generated
    → Lead tracked in dashboard

Client replies to email
  → Resend inbound webhook
    → Relay stores in inbox
    → Auto-response if questionnaire
    → Flag for human follow-up if question
```
