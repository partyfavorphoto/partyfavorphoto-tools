#!/usr/bin/env node
/**
 * send-contract.mjs — Customize and send a PFP contract to client
 * 
 * Usage: node send-contract.mjs <to> <client> <event> <hours> [standard|premium]
 * 
 * Example: node send-contract.mjs "hannah@dcjazzfest.org" "Hannah Kuhns" "DC JazzFest" 3
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, '..', 'partyfavorphoto-repo', 'assets');
const DATA = JSON.parse(readFileSync(join(ROOT, '..', 'partyfavorphoto-repo', 'data', 'pfp-data.json'), 'utf8'));
const OUT = join(ROOT, '..', 'reviews', 'custom-contracts');
mkdirSync(OUT, { recursive: true });

const to = process.argv[2];
const client = process.argv[3] || 'Client';
const eventName = process.argv[4] || 'Event';
const hours = parseInt(process.argv[5]) || 3;
const premium = process.argv[6] === 'premium';
const tier = premium ? 'premium' : 'standard';
const rate = DATA.rates[tier].rate;
const total = rate * hours;
const disc = total - DATA.maxDiscount;
const label = DATA.rates[tier].label;
const incs = DATA.inclusions[tier];
const stripeLink = DATA.stripeLinks[String(hours)] || DATA.stripeLinks['4'];
const deposit = Math.round(total / 2);

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// ── Generate customized contract PDF ────────────────────────
const doc = await PDFDocument.create();
const h = await doc.embedFont(StandardFonts.HelveticaBold);
const t = await doc.embedFont(StandardFonts.TimesRoman);
const tb = await doc.embedFont(StandardFonts.TimesRomanBold);
const M = 50, W = 512;
const C = { dark: rgb(0.15, 0.15, 0.15), gray: rgb(0.5, 0.5, 0.5), red: rgb(0.82, 0.18, 0.20), gold: rgb(0.85, 0.65, 0.13), lg: rgb(0.92, 0.92, 0.92) };
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
function FLD(l, v) { TXT(l, { sz: 11, font: tb, color: C.red, after: 1 }); TXT(`   ${v}`, { sz: 11, after: 4 }); }

// Header
if (existsSync(join(ASSETS, 'logo.png'))) {
  const li = await doc.embedPng(readFileSync(join(ASSETS, 'logo.png')));
  pg.drawImage(li, { x: M, y: y - 44, width: 140, height: Math.round(140 / (li.width / li.height)) });
}
TXT('PARTY FAVOR PHOTO CONTRACT', { sz: 22, font: h, color: C.red, align: 'right', after: 2 });
TXT(`${hours}-Hour ${premium ? 'Premium' : 'Standard'} Package`, { sz: 14, color: C.gray, align: 'right', after: 1 });
TXT(`${label} - $${rate}/hr = $${total}`, { sz: 11, color: C.gray, align: 'right', after: 1 });
TXT(`Discounted: $${disc} (save $${DATA.maxDiscount} with military/school/pay-in-full)`, { sz: 9, color: C.gold, align: 'right', after: 6 });
HR(1.5);

// Parties
TXT(`THIS AGREEMENT is made on ${today}`, { after: 4 });
TXT('between:', { sz: 11, font: tb, color: C.red, after: 4 });
y -= 6;
pg.drawRectangle({ x: M, y: y - 50, width: W, height: 50, color: C.lg });
TXT('PARTY FAVOR PHOTO ("Provider")', { sz: 11, font: h, indent: 10 }); y += 4;
TXT('Joe Lee, Owner', { sz: 10, indent: 10 }); y += 3;
TXT('bookings@partyfavorphoto.com | (202) 798-0610 | partyfavorphoto.com', { sz: 10, indent: 10, color: C.red }); y += 3;
TXT('Licensed & Insured - $1M General Liability Coverage', { sz: 9, indent: 10, color: C.gray });
y = y - 50 - 10;
TXT('and', { after: 4 }); y -= 6;
pg.drawRectangle({ x: M, y: y - 40, width: W, height: 40, color: C.lg });
TXT(`${client} ("Client")`, { sz: 11, font: h, indent: 10 }); y += 4;
TXT(`Event: ${eventName}     Date: ${today}`, { sz: 10, indent: 10 });
y = y - 40 - 14;

SEC('2', 'EVENT DETAILS');
FLD('Client:', client);
FLD('Event:', eventName);
FLD('Date:', today);
FLD('Location:', '_________________________________');
FLD('Duration:', `${hours} hours`);
FLD('Setup Time:', '2 hours before event start');

SEC('3', 'SERVICES');
TXT(`The ${hours}-Hour ${premium ? 'Premium' : 'Standard'} StudioStation includes:`, { font: tb, after: 4 });
for (const inc of incs) TXT(`   - ${inc}`, { sz: 10, indent: 16, after: 1 });
TXT('', { after: 4 });

SEC('4', 'PRICING & PAYMENT');
TXT(`Package: ${hours}-Hour ${premium ? 'Premium' : 'Standard'} StudioStation`, { after: 2 });
TXT(`Rate: $${rate}/hr`, { after: 2 });
TXT(`Total Fee: $${total}`, { sz: 13, font: h, after: 2 });
TXT(`Discounted Fee: $${disc} (save $${DATA.maxDiscount})`, { sz: 10, color: C.gold, after: 4 });
TXT(`Deposit Due (50%): $${deposit}`, { sz: 12, font: h, after: 4 });
TXT('Pay deposit: ' + stripeLink, { sz: 9, color: C.red, after: 4 });
TXT('Balance Due: 7 days before event', { after: 4 });
TXT('Cancellation: 14+ days full refund less $50 | 7-13 days 50% | Less than 7 days no refund', { sz: 9 });

SEC('5', 'TERMS & CONDITIONS');
for (const [num, title, body] of [
  ['5.1','Space','Client provides clean dry 10x10 ft area. Access 2 hours before.'],
  ['5.2','Power','Internal battery for 4hr. Longer sessions need 120V outlet within 50ft.'],
  ['5.3','Insurance','$1M liability. Provider not liable for guest injuries.'],
  ['5.4','Photos','Provider may use for portfolio. Guests get unlimited personal use.'],
  ['5.5','Damages','Client liable for damage by guests beyond normal wear.'],
  ['5.6','Discount','Flat $100 off. One per booking. Claim at deposit.'],
  ['5.7','Force Majeure','Neither liable for causes beyond reasonable control.'],
  ['5.8','Governing Law','District of Columbia.'],
]) { TXT(`${num} ${title}. ${body}`, { sz: 9, after: 3 }); }

SEC('6', 'SIGNATURES');
const sbt = y;
pg.drawRectangle({ x: M, y: y - 75, width: W, height: 75, color: C.lg });
if (existsSync(join(ASSETS, 'signature.png'))) {
  const si = await doc.embedPng(readFileSync(join(ASSETS, 'signature.png')));
  pg.drawImage(si, { x: M + 14, y: sbt - 14 - Math.round(130 / (si.width / si.height)), width: 130, height: Math.round(130 / (si.width / si.height)) });
  y = sbt - 14 - Math.round(130 / (si.width / si.height)) - 4;
}
TXT('Joe Lee - Owner, Party Favor Photo', { sz: 11, font: tb, indent: 10 }); y += 4;
TXT(`Date: ${today}`, { sz: 10, indent: 10 });
y = sbt - 75 - 16;
pg.drawRectangle({ x: M, y: y - 50, width: W, height: 50, color: C.lg });
TXT('Client Signature: ___________________________', { sz: 11, indent: 10 }); y += 4;
TXT(`Client Name: ${client}`, { sz: 10, indent: 10 }); y += 3;
TXT('Date: ____________________', { sz: 10, indent: 10 });
y = y - 50 - 14;

HR(1);
TXT('Party Favor Photo - bookings@partyfavorphoto.com - (202) 798-0610 - partyfavorphoto.com', { sz: 8, color: C.gray, after: 1 });

// Save
// Upload customized contract and build URL
const fileName = `PFP-Contract-${client.replace(/[^a-zA-Z0-9]/g, '-')}-${hours}hr.pdf`;
const filePath = join(OUT, fileName);
writeFileSync(filePath, await doc.save());
console.log(`Contract saved: ${fileName}`);

// Upload to GitHub
const KEY2 = (() => {
  const e = readFileSync(join(__dirname, '..', '.env'), 'utf8');
  const m = e.match(/^GITHUB_TOKEN=(.+)$/m);
  return m ? m[1].trim() : null;
})();

if (KEY2) {
  const pdfBytes2 = readFileSync(filePath);
  const b64 = pdfBytes2.toString('base64');
  const ghRes = await fetch(`https://api.github.com/repos/xmrtdao/partyfavorphoto/contents/contracts/custom/${encodeURIComponent(fileName)}`, {
    method: 'PUT',
    headers: { 'Authorization': `token ${KEY2}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `Add customized contract for ${client}`, content: b64, branch: 'main' }),
  });
  const ghData = await ghRes.json();
  if (ghData.content) console.log('Uploaded to GitHub');
  else console.log('GitHub upload:', ghData.message || 'OK');
}

const contractUrl = `https://raw.githubusercontent.com/xmrtdao/partyfavorphoto/main/contracts/custom/${encodeURIComponent(fileName)}`;

// Supabase key for sending email
const KEY = (() => {
  const e = readFileSync(join(__dirname, '..', '.env'), 'utf8');
  return e.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
})();

const res = await fetch('https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/resend-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
  body: JSON.stringify({
    to,
    subject: `Party Favor Photo - Your ${hours}hr StudioStation Contract`,
    html: `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;color:#222;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#d12e2e;border-bottom:2px solid #d12e2e;padding-bottom:10px">Ready to Book! Here is Your Contract</h1>
<p style="font-size:15px;">Hi ${client},</p>
<p style="font-size:15px;">Thanks for choosing Party Favor Photo for <strong>${eventName}</strong>!</p>
<p style="font-size:15px;">Your ${hours}-Hour StudioStation contract is ready. Please download, review, sign, and reply back.</p>
<div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;text-align:center;">
<a href="${contractUrl}" style="display:inline-block;background:#d12e2e;color:white;padding:14px 28px;border-radius:6px;font-size:16px;font-weight:bold;text-decoration:none;">Download Contract (PDF)</a>
</div>
<p style="font-size:15px;"><strong>Quick summary:</strong></p>
<table style="font-size:14px;width:100%;border-collapse:collapse;">
<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">Package</td><td style="padding:6px 10px;border-bottom:1px solid #eee;"><strong>${hours}-Hour StudioStation</strong></td></tr>
<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">Total</td><td style="padding:6px 10px;border-bottom:1px solid #eee;"><strong>$${total}</strong></td></tr>
<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">Deposit Due</td><td style="padding:6px 10px;border-bottom:1px solid #eee;"><strong>$${deposit}</strong></td></tr>
</table>
<div style="background:#d12e2e;color:white;padding:18px;text-align:center;border-radius:8px;margin:25px 0;">
<a href="${stripeLink}" style="color:white;font-size:16px;font-weight:bold;">Pay Deposit $${deposit} &rarr;</a>
</div>
<div style="font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:12px;margin-top:30px;">
Party Favor Photo - bookings@partyfavorphoto.com - (202) 798-0610</div>
</body></html>`,
    text: `Hi ${client},\n\nYour ${hours}hr StudioStation contract for ${eventName} is ready.\n\nDownload: ${contractUrl}\n\nTotal: $${total} | Deposit: $${deposit}\nPay: ${stripeLink}\n\nReview, sign, scan, and reply back.\n\n(202) 798-0610`,
  }),
});

const result = await res.json();
console.log('Email:', result.status === 'sent' ? 'sent successfully' : JSON.stringify(result));
