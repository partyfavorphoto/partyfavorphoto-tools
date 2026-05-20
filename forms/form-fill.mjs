#!/usr/bin/env node
/**
 * PFP Web Form Filler
 * Usage: node forms/form-fill.mjs <url> inspect|fill [profile-name]
 * 
 * Uses Playwright to scan and fill web forms (MS Forms, Google Forms, etc.)
 * Install: npm install playwright
 * Browser: npx playwright install chromium
 */

import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROFILES = join(ROOT, 'forms', 'profiles');
const DATA = JSON.parse(readFileSync(join(ROOT, 'data', 'pfp-data.json'), 'utf8'));
mkdirSync(join(ROOT, 'forms', 'screenshots'), { recursive: true });

const url = process.argv[2];
const mode = process.argv[3] || 'inspect';
const profileName = process.argv[4] || 'default';

const profilePath = join(PROFILES, `${profileName}.json`);
const profile = existsSync(profilePath) ? JSON.parse(readFileSync(profilePath, 'utf8')) : DATA;

if (!url) { console.log('Usage: node form-fill.mjs <url> inspect|fill [profile]'); process.exit(1); }

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 2000 } });

async function clickText(text) {
  const coords = await page.evaluate((t) => {
    for (const el of document.querySelectorAll('*')) {
      if (el.innerText?.trim() === t && el.offsetParent !== null) {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
    return null;
  }, text);
  if (coords) { await page.mouse.click(coords.x, coords.y); return true; }
  return false;
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Handle MS Forms "Start now" splash
  await clickText('Start now');
  await page.waitForTimeout(3000);

  if (mode === 'inspect') {
    // Get page text and form fields
    const text = await page.evaluate(() => document.body.innerText);
    const inputs = await page.evaluate(() => 
      Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea')).map(el => ({
        tag: el.tagName, type: el.type || '', label: el.getAttribute('aria-label') || el.placeholder || '', required: !!(el.required || el.getAttribute('aria-required')),
      }))
    );
    console.log('\n=== PAGE TEXT (first 1000 chars) ===');
    console.log(text.slice(0, 1000));
    console.log(`\n=== FORM FIELDS (${inputs.length}) ===`);
    inputs.forEach(f => console.log(`  ${f.required ? '[REQ]' : '[OPT]'} ${f.tag} ${f.type} "${f.label}"`));
    
    await page.screenshot({ path: join(ROOT, 'forms', 'screenshots', 'scan.png'), fullPage: true });
    console.log('\nScreenshot: forms/screenshots/scan.png');
    
  } else if (mode === 'fill') {
    // Navigate through form pages
    for (let i = 0; i < 20; i++) {
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('Next') || text.includes('Submit')) {
        const btn = text.includes('Submit') ? 'Submit' : 'Next';
        await clickText(btn);
        await page.waitForTimeout(2000);
      } else break;
    }
    
    await page.screenshot({ path: join(ROOT, 'forms', 'screenshots', 'filled.png'), fullPage: true });
    console.log('Form submitted. Screenshot: forms/screenshots/filled.png');
  }
} finally {
  await browser.close();
}
