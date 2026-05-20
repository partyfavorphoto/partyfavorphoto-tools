#!/usr/bin/env node
/**
 * PFP Contract Generator
 * Usage: node contracts/generate.mjs
 * 
 * Generates all 10 contract templates (2-6hr, Standard + Premium).
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = JSON.parse(readFileSync(join(ROOT, 'data', 'pfp-data.json'), 'utf8'));
const ASSETS = join(ROOT, 'assets');
const OUT = join(ROOT, 'contracts');
mkdirSync(OUT, { recursive: true });

const C = { red: rgb(0.82, 0.18, 0.20), dark: rgb(0.15, 0.15, 0.15), gray: rgb(0.50, 0.50, 0.50), lg: rgb(0.92, 0.92, 0.92), gold: rgb(0.85, 0.65, 0.13) };

async function build(hours, premium) {
  const tier = premium ? 'premium' : 'standard';
  const rate = DATA.rates[tier].rate;
  const tot = rate * hours;
  const disc = tot - DATA.maxDiscount;
  const label = DATA.rates[tier].label;
  const incs = DATA.inclusions[tier];
  const fname = `PFP-${hours}hr-${premium ? 'Premium' : 'Standard'}-Contract.pdf`;

  const doc = await PDFDocument.create();
  const h = await doc.embedFont(StandardFonts.HelveticaBold);
  const t = await doc.embedFont(StandardFonts.TimesRoman);
  const tb = await doc.embedFont(StandardFonts.TimesRomanBold);
  const M = 50, W = 512;
  let pg, y = 0;
  function NP() { pg = doc.addPage([612, 950]); y = 880; }
  NP();

  function TXT(text, opts = {}) {
    const { sz = 11, color = C.dark, font = t, indent = 0, after = 0, align = 'left' } = opts;
    const lead = sz + 5;
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (font.widthOfTextAtSize(test, sz) > W - indent && line) {
        if (y < 55) NP();
        pg.drawText(line, { x: align === 'right' ? 562 - font.widthOfTextAtSize(line, sz) : M + indent, y, size: sz, font, color });
        y -= lead; line = w;
      } else { line = test; }
    }
    if (line) {
      if (y < 55) NP();
      pg.drawText(line, { x: align === 'right' ? 562 - font.widthOfTextAtSize(line, sz) : M + indent, y, size: sz, font, color });
      y -= lead;
    }
    if (after) y -= after;
  }
  function HR(thick = 1) { if (y < 80) NP(); pg.drawLine({ start: { x: M, y: y + 6 }, end: { x: 562, y: y + 6 }, thickness: thick, color: C.red }); y -= 18; }
  function SEC(num, title) { if (y < 180) NP(); TXT('', { after: 10 }); TXT(`${num}. ${title}`, { sz: 14, font: h, color: C.red, after: 6 }); HR(1.5); }
  function FLD(l, v) { TXT(l, { sz: 11, font: tb, after: 1 }); TXT(v, { sz: 11, color: C.gray, after: 4 }); }

  // Header
  if (existsSync(join(ASSETS, 'logo.png'))) {
    const li = await doc.embedPng(readFileSync(join(ASSETS, 'logo.png')));
    pg.drawImage(li, { x: M, y: y - 44, width: 140, height: Math.round(140 / (li.width / li.height)) });
  }
  TXT('PARTY FAVOR PHOTO CONTRACT', { sz: 22, font: h, color: C.red, align: 'right', after: 2 });
  TXT(`${hours}-Hour ${premium ? 'Premium' : 'Standard'} Package`, { sz: 14, color: C.gray, align: 'right', after: 1 });
  TXT(`${label} - $${rate}/hr = $${tot}`, { sz: 11, color: C.gray, align: 'right', after: 1 });
  TXT(`Discounted: $${disc} (save $${DATA.maxDiscount} with military/school/pay-in-full)`, { sz: 9, color: C.gold, align: 'right', after: 6 });
  HR(1.5);

  // Parties
  TXT('THIS AGREEMENT is made on ____________________, 20____', { after: 4 });
  TXT('between:', { sz: 11, font: tb, color: C.red, after: 4 });
  y -= 6;
  pg.drawRectangle({ x: M, y: y - 50, width: W, height: 50, color: C.lg });
  TXT('PARTY FAVOR PHOTO ("Provider")', { sz: 11, font: h, indent: 10 }); y += 4;
  TXT(`Joe Lee, Owner`, { sz: 10, indent: 10 }); y += 3;
  TXT(`bookings@partyfavorphoto.com | (202) 798-0610 | partyfavorphoto.com`, { sz: 10, indent: 10, color: C.red }); y += 3;
  TXT(`Licensed & Insured - $${DATA.insurance.replace(/[^0-9A-Za-z $]/g, '')}`, { sz: 9, indent: 10, color: C.gray });
  y = y - 50 - 10;
  TXT('and', { after: 4 }); y -= 6;
  pg.drawRectangle({ x: M, y: y - 40, width: W, height: 40, color: C.lg });
  TXT('_________________________________ ("Client")', { sz: 11, indent: 10 }); y += 4;
  TXT('Event: ___________________________     Date(s): ____________________', { sz: 10, indent: 10 });
  y = y - 40 - 14;

  SEC('2', 'EVENT DETAILS');
  for (const [l, v] of [['Event Name:','_________________________________'],['Event Date:','_________________________________'],['Event Location:','_________________________________'],['Setup Time:','_____ (2 hours before event start)'],['Event Hours:', `_____ (${hours} hours)`],['Contact Person:','_________________________________'],['Contact Phone:','_________________________________'],['Number of Guests Expected:','_________________________________']]) FLD(l, v);

  SEC('3', 'SERVICES');
  TXT(`The ${hours}-Hour ${premium ? 'Premium' : 'Standard'} StudioStation includes:`, { font: tb, after: 4 });
  for (const inc of incs) TXT(`   - ${inc}`, { sz: 10, indent: 16, after: 1 });
  TXT('', { after: 4 });
  TXT(`Total booked time: ${hours} hours at $${rate}/hr = $${tot}. Overtime: $${rate}/hr.`, { sz: 10, font: tb });

  SEC('4', 'PRICING & PAYMENT');
  TXT(`Service: ${hours}-Hour ${premium ? 'Premium' : 'Standard'} StudioStation - $${rate}/hr x ${hours}hrs = $${tot}`, { after: 1 });
  TXT(`Discount Type: [ ] Military  [ ] School/Education  [ ] Pay-in-Full`, { after: 4 });
  TXT(`TOTAL FEE: $${tot}`, { sz: 13, font: h, after: 2 });
  TXT(`Discounted: $${disc} (save $${DATA.maxDiscount})`, { sz: 10, color: C.gold, after: 6 });
  TXT('Additional Services:', { sz: 10, font: tb, after: 2 });
  TXT(`   [ ] Second Attendant - $${DATA.addOns.secondAttendant}`, { sz: 10, indent: 12, after: 1 });
  TXT(`   [ ] Social Media Content Reel - $${DATA.addOns.socialReel}`, { sz: 10, indent: 12, after: 1 });
  TXT(`   [ ] Premium Backdrop Upgrade - $${DATA.addOns.backdropUpgrade}`, { sz: 10, indent: 12, after: 4 });
  TXT(`Deposit Due (50%): $${Math.round(tot / 2)}`, { sz: 12, font: h, after: 2 });
  TXT('Balance Due (7 days before event): $____________________', { after: 6 });
  TXT('Cancellation Policy:', { sz: 10, font: tb, after: 2 });
  TXT('   - 14+ days: Full refund less $50 fee', { sz: 10, indent: 12, after: 1 });
  TXT('   - 7-13 days: 50% refund', { sz: 10, indent: 12, after: 1 });
  TXT('   - Less than 7 days: No refund', { sz: 10, indent: 12, after: 1 });

  SEC('5', 'TERMS & CONDITIONS');
  for (const [num, title, body] of [
    ['5.1','Space Requirements','Client shall provide a clean, dry 10x10 ft (minimum) covered area. Provider requires access 2 hours before start. Outdoor events require overhead cover.'],
    ['5.2','Power','StudioStation runs on internal battery for up to 4 hours. For longer sessions, Client provides 120V outlet within 50 ft.'],
    ['5.3','Insurance','Provider carries $1M general liability. Provider not responsible for guest injuries. Client ensures venue liability coverage.'],
    ['5.4','Photo Usage','Provider may use photos for portfolio/marketing unless opted out in writing. Guests get unlimited personal usage rights.'],
    ['5.5','Damages','Client responsible for damage to Provider equipment by guests beyond normal wear. Pre-existing condition documented before setup.'],
    ['5.6','Discounts','Flat $100 off total fee. One discount per booking. Must be claimed at deposit.'],
    ['5.7','Force Majeure','Neither party liable for failure due to causes beyond reasonable control.'],
    ['5.8','Governing Law','This agreement is governed by the laws of the District of Columbia.'],
  ]) { TXT(`${num} ${title}.`, { sz: 10, font: tb, after: 1 }); TXT(`     ${body}`, { sz: 10, indent: 8, after: 4 }); }

  // Signatures
  if (y < 220) NP();
  SEC('6', 'SIGNATURES');
  const sbt = y;
  pg.drawRectangle({ x: M, y: y - 85, width: W, height: 85, color: C.lg });
  if (existsSync(join(ASSETS, 'signature.png'))) {
    const si = await doc.embedPng(readFileSync(join(ASSETS, 'signature.png')));
    pg.drawImage(si, { x: M + 14, y: sbt - 14 - Math.round(130 / (si.width / si.height)), width: 130, height: Math.round(130 / (si.width / si.height)) });
    y = sbt - 14 - Math.round(130 / (si.width / si.height)) - 4;
  }
  TXT('Joe Lee - Owner, Party Favor Photo', { sz: 11, font: tb, indent: 10 }); y += 4;
  TXT('Date: ____________________', { sz: 10, indent: 10 });
  y = sbt - 85 - 16;
  pg.drawRectangle({ x: M, y: y - 55, width: W, height: 55, color: C.lg });
  TXT('Client Signature: ___________________________', { sz: 11, indent: 10 }); y += 4;
  TXT('Printed Name: _____________________________', { sz: 10, indent: 10 }); y += 3;
  TXT('Date: ____________________', { sz: 10, indent: 10 });
  y = y - 55 - 14;

  HR(1);
  TXT('Party Favor Photo - bookings@partyfavorphoto.com - (202) 798-0610 - partyfavorphoto.com', { sz: 8, color: C.gray, after: 1 });
  TXT(`Contract v1.3 - Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { sz: 7, color: C.gray });

  const bytes = await doc.save();
  writeFileSync(join(OUT, fname), bytes);
  console.log(`  ${fname} (${(bytes.length / 1024).toFixed(0)}KB, ${doc.getPageCount()}p)`);
}

console.log('\\nGenerating PFP Contracts\\n');
for (const h of [2, 3, 4, 5, 6]) {
  console.log(`${h}hr:`);
  await build(h, false);
  await build(h, true);
}
console.log('\\nDone\\n');
