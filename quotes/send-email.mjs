#!/usr/bin/env node
/**
 * PFP Quote Email Sender
 * Usage: node quotes/send-email.mjs <to> <client> <event> <hours> [standard|premium]
 * 
 * Sends a branded HTML quote email via Supabase/Resend edge function.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = JSON.parse(readFileSync(join(ROOT, 'data', 'pfp-data.json'), 'utf8'));

const KEY = (() => {
  try {
    const env = readFileSync(join(ROOT, '.env'), 'utf8');
    const m = env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
})();

if (!KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }

const to = process.argv[2];
const client = process.argv[3] || 'Client';
const event = process.argv[4] || 'Event';
const hours = parseInt(process.argv[5]) || 4;
const premium = process.argv[6] === 'premium';
const tier = premium ? 'premium' : 'standard';
const rate = DATA.rates[tier].rate;
const total = rate * hours;
const disc = total - DATA.maxDiscount;
const label = DATA.rates[tier].label;
const stripeLink = DATA.stripeLinks[String(hours)] || DATA.stripeLinks['4'];

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
body{font-family:Georgia,'Times New Roman',serif;color:#222;max-width:600px;margin:0 auto;padding:20px}
h1{color:#d12e2e;font-size:28px;border-bottom:3px solid #d12e2e;padding-bottom:10px}
h2{color:#d12e2e;font-size:20px;margin-top:30px}
.name{font-size:22px;font-weight:bold;color:#d12e2e;text-align:right}
.tag{font-size:13px;color:#888;text-align:right}
.price{font-size:26px;font-weight:bold;color:#d12e2e}
.sub{font-size:14px;color:#888}
.box{background:#f5f5f5;padding:18px;border-radius:8px;margin:18px 0}
ul{list-style:none;padding:0}
li{padding:4px 0;font-size:14px;line-height:1.5}
li:before{content:"\\2022 ";color:#d12e2e;font-weight:bold}
.cta{background:#d12e2e;color:#fff;padding:20px;text-align:center;border-radius:8px;margin:25px 0}
.cta a{color:#fff;font-weight:bold}
.footer{font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:12px;margin-top:30px}
.disc{color:#b8860b;font-weight:bold}
hr{border:none;border-top:1px solid #eee;margin:20px 0}
</style></head><body>

<div class="name">PARTY FAVOR PHOTO</div>
<div class="tag">Premium StudioStation Photo Experience</div>

<h1>Proposal &amp; Quote</h1>
<p style="font-size:15px;color:#555;">
  Prepared for <strong>${client}</strong><br>
  Event: <strong>${event}</strong><br>
  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
</p>
<hr>

<h2>Recommended Package</h2>
<div class="box">
  <h3 style="margin-top:0;color:#d12e2e;">${hours}-Hour StudioStation</h3>
  <p style="font-size:14px;color:#666;">${label} at $${rate}/hr</p>
  <p style="font-weight:bold;margin-top:16px;">What's included:</p>
  <ul>
    ${DATA.inclusions[tier].map(i => '<li>' + i + '</li>').join('\\n    ')}
  </ul>
</div>

<h2>Pricing Summary</h2>
<div class="box" style="text-align:center;">
  <div class="price">$${total}</div>
  <div class="sub">$${rate}/hr &times; ${hours} hours</div>
  <hr style="width:100px;margin:12px auto;">
  <div class="disc">With discount: $${disc}</div>
  <div class="sub">Military, school, or pay-in-full (save $${DATA.maxDiscount})</div>
</div>

<p style="font-size:14px;"><strong>Optional Add-Ons:</strong></p>
<ul>
  <li>Second Attendant &mdash; $${DATA.addOns.secondAttendant}</li>
  <li>Social Media Content Reel &mdash; $${DATA.addOns.socialReel}</li>
  <li>Premium Backdrop Upgrade &mdash; $${DATA.addOns.backdropUpgrade}</li>
</ul>
<hr>

<h2>Next Steps</h2>
<ol style="font-size:14px;line-height:1.8;">
  <li>Reply to this email or call <strong>(202) 798-0610</strong></li>
  <li>Choose your package and any add-ons</li>
  <li>Pay 50% deposit to lock in your booking</li>
  <li>Sign the contract (we will send it over)</li>
</ol>

<div class="cta">
  <p><strong>Book Instantly</strong></p>
  <p><a href="${stripeLink}" style="color:#fff;">Click here to book online &rarr;</a></p>
</div>

<div class="footer">
  <p>Party Favor Photo &mdash; bookings@partyfavorphoto.com &mdash; (202) 798-0610 &mdash; partyfavorphoto.com</p>
  <p>Licensed &amp; Insured &mdash; $1M General Liability Coverage</p>
</div>

</body></html>`;

const text = `Party Favor Photo Quote for ${event}\\n\\n${hours}-Hour StudioStation\\n${label} at $${rate}/hr = $${total}\\nDiscounted: $${disc} (save $${DATA.maxDiscount})\\n\\nBook: ${stripeLink}\\nCall: (202) 798-0610`;

const res = await fetch('https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/resend-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
  body: JSON.stringify({ to, subject: `Party Favor Photo Quote - ${event} (${hours}hr)`, html, text }),
});
const result = await res.json();
if (result.status === 'sent') console.log(`Quote emailed to ${to} (id: ${result.id})`);
else console.error('Failed:', JSON.stringify(result));
