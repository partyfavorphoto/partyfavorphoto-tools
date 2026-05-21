# PFP Contacts Registry

Master contact database for Party Favor Photo outreach campaigns.

## File: `contacts-registry.json`

| Field | Description |
|-------|-------------|
| `updated` | ISO timestamp of last update |
| `total_in_pool` | Total contacts in the outreach pool |
| `total_contacted_from_pool` | Contacts that have received at least one email |
| `total_untouched_in_pool` | Contacts never emailed |
| `total_sent_records_merged` | Total send records across all campaign logs |
| `contact_rate_pct` | Percentage of pool contacted |
| `contacts[]` | Array of all contacts with send status |

### Contact Object

```json
{
  "email": "contact@example.com",
  "source": "PTA scrape / Exa search / website booking",
  "region": "Washington DC",
  "topics": "venue, event space, festival",
  "added": "2026-05-20T12:00:00Z",
  "status": "pending",
  "contacted": true,
  "sent_count": 1
}
```

## Data Sources

- **Campaign pool:** `relay-data/campaign-contacts.json`
- **Sent log:** `relay-data/campaign-sent.json` (single source of truth, merged from `relay/relay-data/campaign-sent.json`)
- **PFP contacts (legacy):** `partyfavorphoto/data/pfp-contacts.json`

## Workflow

1. Scrape/add contacts → `campaign-contacts.json`
2. Send emails via campaign scripts → `campaign-sent.json` updated
3. Sync to this registry → `contacts-registry.json`
4. Commit to repo for fleet-wide visibility

Campaign scripts: `relay/tools/festival-campaign.mjs`, `relay/tools/pfp-festival-campaign.mjs`, `relay/tools/seasonal-scraper.mjs`
