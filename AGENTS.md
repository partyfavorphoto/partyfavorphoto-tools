# AGENTS.md — Party Favor Photo Complete Agent Workflows

This file tells you exactly how to handle any client interaction from start to finish.

---

## THE COMPLETE CLIENT LIFECYCLE

```
Inquiry → Quote → Approval → Contract → Deposit → Event → Follow-up
```

---

## 1. SENDING A QUOTE

**When a client asks about pricing or wants a proposal:**

```bash
node quotes/send-email.mjs "client@email.com" "Client Name" "Event Name" 4 premium
```

The HTML email includes full branding, service bullet points, pricing, and the correct Stripe booking link for the package duration. No attachment needed — the quote IS the email body.

**Example:**
```bash
node quotes/send-email.mjs "hannah@dcjazzfest.org" "Hannah Kuhns" "DC Jazz Fest" 4 premium
```

**Quote options:**
- Last arg `premium` = 4x6 prints at $349/hr
- Omit = 2x6 strips at $249/hr
- Hours: 2, 3, 4, 5, or 6

---

## 2. CLIENT APPROVES → SEND CUSTOMIZED CONTRACT

**When the client says "let's do it" or "send me the contract":**

```bash
node quotes/send-contract.mjs "client@email.com" "Client Name" "Event Name" 3
```

This does THREE things automatically:
1. **Generates a customized PDF contract** with client name, event, date, and pricing baked in (not a blank template)
2. **Uploads the customized PDF to GitHub** so it has a permanent URL
3. **Sends an HTML email** with a Download Contract button + Pay Deposit button

**What the client receives:**
- Professional HTML email with Party Favor Photo branding
- "Download Contract" button linking to their exact customized PDF
- Pricing summary table (package, total, deposit)
- "Pay Deposit" button with the correct Stripe link for their package
- Instructions: download → sign → scan → reply

**The contract PDF includes:**
- PFP logo header
- Client name and event name filled in (not blank underscores)
- Date of agreement filled in
- 9-11 service bullet points (Standard or Premium)
- Total fee and deposit amount
- Joe Lee's signature pre-signed
- Client signature line ready
- Full 8-section terms and conditions

**Arguments:**
```bash
node quotes/send-contract.mjs <to> <client> <event> <hours> [standard|premium]
```

**Examples:**
```bash
# Hannah - 3hr Standard for DC Jazz Fest
node quotes/send-contract.mjs "hannah@dcjazzfest.org" "Hannah Kuhns" "DC Jazz Fest" 3

# Corporate client - 4hr Premium for a gala
node quotes/send-contract.mjs "client@company.com" "John Smith" "Annual Gala" 4 premium

# School event - 2hr Standard with discount
node quotes/send-contract.mjs "principal@school.edu" "Westfield High" "Prom" 2
```

---

## 3. FILLING OUT A FORM (vendor applications, etc.)

### PDF forms from email attachments

On Hermes (Python/mobile device):
```bash
python3 pdf_form_processor.py auto-process --email-id <id>
```

### Web forms (MS Forms, Google Forms, custom)

On Vex (Node.js/Playwright):
```bash
node forms/form-fill.mjs <url> inspect     # See what fields exist
node forms/form-fill.mjs <url> fill [profile]  # Auto-fill from profile
```

Available profiles in `forms/profiles/`:
- `default.json` — Standard PFP business info
- Create new profiles for specific events as needed

### QC CHECKLIST — Always verify before sending ANY form or contract:

- [ ] Phone is (202) 798-0610 (reject any 555 numbers)
- [ ] Name is "Joe Lee" (not "Joseph Andrew Lee")
- [ ] Pricing: $249/hr standard or $349/hr premium
- [ ] Discount is flat $100 max (not percentage-based)
- [ ] Only one discount per booking
- [ ] Signature is an image, not just text
- [ ] Page size is US Letter for US events

---

## 4. GENERATING ALL CONTRACT TEMPLATES

When you need to refresh or update all 10 contract templates:

```bash
node contracts/generate.mjs
```

Output goes to `contracts/` directory:
`PFP-{hours}hr-{Standard|Premium}-Contract.pdf`

---

## 5. PRICING REFERENCE

| Hours | Standard ($249/hr) | Premium ($349/hr) |
|-------|--------------------|--------------------|
| 2     | $498 ($398 disc)   | $698 ($598 disc)   |
| 3     | $747 ($647 disc)   | $1,047 ($947 disc) |
| 4     | $996 ($896 disc)   | $1,396 ($1,296 disc) |
| 5     | $1,245 ($1,145 disc) | $1,745 ($1,645 disc) |
| 6     | $1,494 ($1,394 disc) | $2,094 ($1,994 disc) |

**Discount:** Flat $100 off for military, school/education, or pay-in-full. Max one per booking.

---

## 6. STRIPE BOOKING LINKS

| Package | Link |
|---------|------|
| 2hr | https://buy.stripe.com/8x25kD7ezg6h4iC15YbZe03 |
| 3hr | https://buy.stripe.com/9B63cv9mH07j3eyeWObZe06 |
| 4hr | https://buy.stripe.com/eVqcN556r4nz16qeWObZe04 |

Always match the Stripe link to the package hours being quoted.

---

## 7. BRANDING RULES (NEVER BREAK THESE)

| ❌ Never Say | ✅ Always Say |
|-------------|--------------|
| "photo booth" | "StudioStation" |
| "tablet kit" | "bounce-diffused strobe lighting" |
| "ring light" | "DSLR cameras" |
| "affordable option" | "premium experience" |
| "cheap" | "professional, editorial-quality" |

**The strobe flash is a crowd magnet.** It draws people in, creates energy, and makes every guest feel like a celebrity. Lead with this.

---

## 8. KEY DATA

| Item | Value |
|------|-------|
| Email | bookings@partyfavorphoto.com |
| Phone | (202) 798-0610 |
| Owner | Joe Lee |
| Insurance | $1M General Liability |
| Service area | Washington DC + Dallas/Fort Worth |
| Logo | `assets/logo.png` |
| Signature | `assets/signature.png` |
| GitHub | https://github.com/xmrtdao/partyfavorphoto |

---

## 9. REQUIRED ENVIRONMENT

Copy `.env.example` to `.env` and fill in:
- `SUPABASE_SERVICE_ROLE_KEY` — required for sending emails
- `RESEND_API_KEY` — for checking inbox and managing emails
- `GITHUB_TOKEN` — for uploading customized contracts

Install dependencies:
```bash
npm install
```
