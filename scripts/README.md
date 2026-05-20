# PFP Exa Scraper

Hourly venue contact scraper for Party Favor Photo.

## What it does
1. Rotates through a list of US cities
2. Runs venue/contact queries via Exa search (Supabase edge function)
3. Extracts emails from results using regex
4. Dedupes and stores as clean JSON
5. Sends summary to Vex via Hermes fleet endpoint
6. Writes Vex-format files for campaign pool

## Files
- `pfp_exa_scraper.py` — main scraper engine
- `data/contacts/*.json` — output contact lists by city

## Usage
```bash
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export HERMES_BASE="https://hermes.mobilemonero.com"
python3 scripts/pfp_exa_scraper.py
```

## Format
```json
[
  {"email": "name@venue.com", "name": "Contact Name", "venue": "Venue Name", "region": "City, State"}
]
```

## Contact History
| City | Count | Date |
|------|-------|------|
| Dallas/Fort Worth | 101 | 2026-05-20 |
| Washington DC | 50 | 2026-05-20 |

*Maintained by Hermes (XMRT Fleet)*
