#!/usr/bin/env node
/**
 * PFP Quote Generator
 * Usage: node quotes/generate.mjs "Client" "Event" Hours [standard|premium]
 * 
 * Creates a branded PDF quote with setup photo, pricing, and CTA.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'assets');
const DATA = JSON.parse(readFileSync(join(ROOT, 'data', 'pfp-data.json'), 'utf8'));
const OUT = join(ROOT, 'quotes');

const client = process.argv[2] || 'Client';
const event = process.argv[3] || 'Event';
const hours = parseInt(process.argv[4]) || 4;
const premium = process.argv[5] === 'premium';
const tier = premium ? 'premium' : 'standard';
const rate = DATA.rates[tier].rate;
const total = rate * hours;
const disc = total - DATA.maxDiscount;
const label = DATA.rates[tier].label;
const stripeLink = DATA.stripeLinks[String(hours)] || DATA.stripeLinks['4'];
const fname = `PFP-Quote-${event.replace(/[^a-zA-Z0-9]/g, '-')}-${hours}hr.pdf`;

const C = { red: rgb(0.82, 0.18, 0.20), dark: rgb(0.15, 0.15, 0.15), gray: rgb(0.50, 0.50, 0.50), lg: rgb(0.92, 0.92, 0.92), gold: rgb(0.85, 0.65, 0.13) };

const doc = await PDFDocument.create();
const h = await doc.embedFont(StandardFonts.HelveticaBold);
const t = await doc.embedFont(StandardFonts.TimesRoman);
const tb = await doc.embedFont(StandardFonts.TimesRomanBold);

let pg, y = 0;
function NP() { pg = doc.addPage([612, 950]); y = 880; }
NP();
const M = 50, W = 512;

function TXT(text, opts = {}) {
  const { sz = 11, color = C.dark, font = t, indent = 0, after = 0, align = 'left' } = opts;
  const lead = sz + 5;
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(test, sz) > W - indent && line) {
      if (y < 55) NP();
      pg.drawText(line, { x: (align === 'right' ? 562 - font.widthOfTextAtSize(line, sz) : M + indent), y, size: sz, font, color });
      y -= lead; line = w;
    } else { line = test; }
  }
  if (line) {
    if (y < 55) NP();
    pg.drawText(line, { x: (align === 'right' ? 562 - font.widthOfTextAtSize(line, sz) : M + indent), y, size: sz, font, color });
    y -= lead;
  }
  if (after) y -= after;
}
function HR() { if (y < 70) NP(); pg.drawLine({ start: { x: M, y: y + 6 }, end: { x: 562, y: y + 6 }, thickness: 1, color: C.red }); y -= 14; }

// Logo
if (existsSync(join(ASSETS, 'logo.png'))) {
  const li = await doc.embedPng(readFileSync(join(ASSETS, 'logo.png')));
  const asp = li.width / li.height;
  pg.drawImage(li, { x: M, y: y - 50, width: 140, height: Math.round(140 / asp) });
}
TXT('', { after: 60 });

// Header
TXT('PROPOSAL & QUOTE', { sz: 22, font: h, color: C.red, align: 'right', after: 2 });
TXT(`Prepared for: ${client}`, { sz: 13, align: 'right', after: 1 });
TXT(`Event: ${event}`, { sz: 13, align: 'right', after: 1 });
TXT(`${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { sz: 11, color: C.gray, align: 'right', after: 6 });
HR();

// About
TXT('About Party Favor Photo', { sz: 16, font: h, color: C.red, after: 4 });
TXT('We provide premium StudioStation photo experiences for festivals, conferences, weddings, and special events across Washington DC and Dallas/Fort Worth. Our professional bounce-diffused strobe lighting and DSLR cameras deliver editorial-quality photos that make every guest feel like a celebrity.', { after: 4 });

// Setup photo
const photoPaths = [join(ASSETS, 'setup-photos', 'setuppfp.png'), join(ASSETS, 'setup-photos', 'outdoorsetuppfp.png')];
for (const p of photoPaths) {
  if (existsSync(p)) {
    try {
      const d = readFileSync(p); const isJpg = d[0] === 0xFF && d[1] === 0xD8;
      const img = isJpg ? await doc.embedJpg(d) : await doc.embedPng(d);
      const asp = img.width / img.height;
      if (y < 200) NP();
      pg.drawImage(img, { x: M, y: y - Math.round(W / asp), width: W, height: Math.round(W / asp) });
      y -= Math.round(W / asp) + 6;
    } catch {} break;
  }
}

// Recommendation
NP();
TXT('Recommended Package', { sz: 16, font: h, color: C.red, after: 6 });
TXT(`${hours}-Hour StudioStation`, { sz: 14, font: tb, after: 2 });
TXT(`${label} at $${rate}/hr`, { sz: 11, color: C.gray, after: 4 });
TXT("What's included:", { sz: 11, font: tb, after: 2 });
for (const inc of DATA.inclusions[tier]) TXT(`   - ${inc}`, { sz: 10, indent: 12, after: 1 });
TXT('', { after: 6 });

// Pricing
TXT('Pricing Summary', { sz: 16, font: h, color: C.red, after: 4 });
const pb = y - 100;
pg.drawRectangle({ x: M, y: pb, width: W, height: 100, color: C.lg });
TXT(`Package Total: $${total}`, { sz: 18, font: h, indent: 12 }); y += 4;
TXT(`$${rate}/hr x ${hours} hours`, { sz: 11, color: C.gray, indent: 12 }); y += 3;
TXT('', { indent: 12 }); y += 3;
TXT(`Discounted Rate: $${disc}`, { sz: 14, font: tb, indent: 12 });
TXT(`With military, school, or pay-in-full discount (-$${DATA.maxDiscount})`, { sz: 9, color: C.gray, indent: 12 });
y = pb - 12;

TXT('', { after: 4 });
TXT('Optional Add-Ons:', { sz: 11, font: tb, after: 2 });
TXT(`   Second Attendant - $${DATA.addOns.secondAttendant}`, { sz: 10, indent: 12, after: 1 });
TXT(`   Social Media Content Reel - $${DATA.addOns.socialReel}`, { sz: 10, indent: 12, after: 1 });
TXT(`   Premium Backdrop Upgrade - $${DATA.addOns.backdropUpgrade}`, { sz: 10, indent: 12, after: 6 });

// CTA
TXT('Next Steps', { sz: 16, font: h, color: C.red, after: 4 });
TXT('To accept this proposal and secure your date:', { after: 2 });
TXT('   1. Reply to this email or call (202) 798-0610', { sz: 10, indent: 12, after: 1 });
TXT('   2. Choose your package and any add-ons', { sz: 10, indent: 12, after: 1 });
TXT('   3. Pay 50% deposit to lock in your booking', { sz: 10, indent: 12, after: 1 });
TXT('   4. Sign the contract (we will send it over)', { sz: 10, indent: 12, after: 4 });
TXT('Book instantly:', { sz: 11, font: tb, after: 1 });
TXT(`   ${stripeLink}`, { sz: 10, indent: 12, color: C.red, after: 6 });

// Footer
HR();
TXT(`Party Favor Photo - bookings@partyfavorphoto.com - (202) 798-0610 - partyfavorphoto.com`, { sz: 8, color: C.gray, after: 1 });
TXT(`Licensed & Insured - $1M General Liability Coverage`, { sz: 8, color: C.gray });

const bytes = await doc.save();
writeFileSync(join(OUT, fname), bytes);
console.log(`Quote saved: ${fname} (${(bytes.length / 1024).toFixed(0)}KB, ${doc.getPageCount()}p)`);
