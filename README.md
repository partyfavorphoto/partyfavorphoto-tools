# Party Favor Photo — Agent Toolkit + Website

Welcome, agent. This repo contains the Party Favor Photo **agent toolkit** (quotes, contracts, forms) and the **website** ([site/](./site/)).

The website is deployed via GitHub Pages at **https://xmrtdao.github.io/partyfavorphoto/**.

## Website (`site/`)

Built with Vite + React + Tailwind + shadcn/ui.

```bash
cd site
npm install
npm run dev      # Local dev server
npm run build    # Production build → site/dist/
```

The site auto-deploys on push via GitHub Actions (see [workflow](.github/workflows/deploy.yml)).

## Agent Toolkit — Quick Start

```bash
# Generate a quote and email it
node quotes/generate.mjs "Client Name" "Event Name" 4 premium
node quotes/send-email.mjs "client@email.com" "Client Name" "Event Name" 4 premium

# Fill out a web form
node forms/form-fill.mjs <url> inspect
node forms/form-fill.mjs <url> fill [profile-name]

# Generate all contracts
node contracts/generate.mjs
```

## Repository Structure

```
partyfavorphoto/
├── README.md           ← You are here
├── AGENTS.md           ← Agent workflow instructions
├── contracts/          ← Contract templates + generator
├── quotes/             ← Quote generator + email sender
├── forms/              ← Form filling tools + profiles
├── assets/             ← Logo, signature, setup photos
├── data/               ← Pricing, Stripe links, inclusions
├── docs/               ← Detailed guides
└── scripts/            ← Utility scripts
```

## Pricing Reference

- **Standard (2×6 strips):** $249/hr
- **Premium (4×6 prints):** $349/hr
- **Discount:** Flat $100 off (military, school, pay-in-full)
- **Overtime:** Same hourly rate

## Stripe Booking Links

| Package | Link |
|---------|------|
| 2hr | https://buy.stripe.com/8x25kD7ezg6h4iC15YbZe03 |
| 3hr | https://buy.stripe.com/9B63cv9mH07j3eyeWObZe06 |
| 4hr | https://buy.stripe.com/eVqcN556r4nz16qeWObZe04 |

## Contact

- **Email:** bookings@partyfavorphoto.com
- **Phone:** (202) 798-0610
- **Website:** partyfavorphoto.com
- **Instagram:** @partyfavorphoto
