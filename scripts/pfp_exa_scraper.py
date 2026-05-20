#!/usr/bin/env python3
"""
PFP Exa Scraper — Hourly City Rotation

Picks a new US city from the rotation list each run,
scrapes venue/event contacts via Exa search (Supabase edge function),
extracts emails, dedupes, and sends results to Vex via fleet chat.

Deliver: hermes.mobilemonero.com/fleet/broadcast
State: ~/tmp/pfp_scraper/scraper_state.json
Output: ~/tmp/pfp_scraper/<city>.json
"""

import json, os, re, subprocess, sys, time, urllib.request

CITIES = [
    "Washington DC", "Baltimore, Maryland", "Richmond, Virginia",
    "Philadelphia, Pennsylvania", "Austin, Texas", "Houston, Texas",
    "San Antonio, Texas", "New Orleans, Louisiana", "Atlanta, Georgia",
    "Charlotte, North Carolina", "Nashville, Tennessee", "Chicago, Illinois",
    "Denver, Colorado", "Phoenix, Arizona", "Los Angeles, California",
    "San Diego, California", "San Francisco, California", "Seattle, Washington",
    "Miami, Florida", "Orlando, Florida", "Tampa, Florida",
    "Las Vegas, Nevada", "Portland, Oregon", "Kansas City, Missouri",
    "St. Louis, Missouri", "Cincinnati, Ohio", "Cleveland, Ohio",
    "Indianapolis, Indiana", "Detroit, Michigan", "Minneapolis, Minnesota",
    "Milwaukee, Wisconsin", "Memphis, Tennessee", "Oklahoma City, Oklahoma",
    "Salt Lake City, Utah", "Albuquerque, New Mexico", "Sacramento, California",
]

QUERIES = [
    "{city} wedding venue contact email",
    "{city} event spaces corporate events contact",
    "{city} hotel banquet event manager contact",
    "{city} museum art gallery private event contact",
    "{city} country club wedding contact email",
    "{city} nonprofit event venue contact",
    "{city} festival event space contact email",
    "{city} outdoor wedding venue contact",
    "{city} special events venue coordinator email",
    "{city} convention center event services contact",
    "{city} rooftop event space contact",
    "{city} photo booth event rental contact",
]

ENDPOINT = "https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/exa-search-function"
# Key is injected separately via env; fallback for testing local runs
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
HERMES_BASE = os.environ.get("HERMES_BASE", "https://hermes.mobilemonero.com")

EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
BAD_PATTERNS = ("noreply", "no-reply", "example", "test@", "cloudflare", "github",
                "w3.org", "ietf", "iana", "icann", "microsoft", "domain", "email@",
                "your@", "name@", "info@example", "contact@example")

STATE_FILE = os.path.expanduser("~/tmp/pfp_scraper/scraper_state.json")
OUT_DIR = os.path.expanduser("~/tmp/pfp_scraper")


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"cursor": 0, "total_emails": 0, "runs": []}


def save_state(st):
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(st, f, indent=2)


def run_exa(query):
    if not KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set", file=sys.stderr)
        return []
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps({"query": query}).encode("utf-8"),
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("results", [])
    except Exception as e:
        print(f"ERROR querying Exa: {e}", file=sys.stderr)
        return []


def extract_emails(results):
    seen_urls = set()
    entries = []
    for r in results:
        url = r.get("url", "")
        if url in seen_urls:
            continue
        seen_urls.add(url)
        title = r.get("title", "")
        highlights = r.get("highlights", [])
        text = " ".join(highlights)
        emails = list(set(EMAIL_RE.findall(text)))
        cleaned = []
        for e in emails:
            el = e.lower()
            if any(b in el for b in BAD_PATTERNS):
                continue
            if el.endswith(".jpg") or el.endswith(".png") or ".css" in el:
                continue
            if len(e) > 60:
                continue
            cleaned.append(e)
        if cleaned:
            entries.append({"title": title, "url": url, "emails": cleaned})
    return entries


def dedupe_emails(entries):
    by_email = {}
    for entry in entries:
        for email in entry["emails"]:
            e = email.lower()
            if e not in by_email:
                by_email[e] = {"email": email, "venues": set(), "urls": set()}
            by_email[e]["venues"].add(entry["title"][:80])
            by_email[e]["urls"].add(entry["url"])
    clean = []
    for e, d in sorted(by_email.items()):
        clean.append({
            "email": d["email"],
            "venues": "; ".join(list(d["venues"])[:3]),
            "url": list(d["urls"])[0]
        })
    return clean


def transform_for_vex(clean, city):
    """Convert raw scraper output to Vex campaign format."""
    out = []
    for item in clean:
        email = item["email"].strip()
        venues = item.get("venues", "")
        name = ""
        venue = ""
        if venues:
            parts = [p.strip() for p in venues.split(";") if p.strip()]
            if len(parts) >= 2:
                venue = parts[0]
                for p in parts[1:]:
                    if p and not name:
                        name = p
            elif len(parts) == 1:
                venue = parts[0]
        if not name:
            local = email.split("@")[0]
            local = " ".join(filter(None, re.split(r"[._-]", local)))
            name = local.title() if local else ""
        out.append({
            "email": email,
            "name": name,
            "venue": venue,
            "region": city
        })
    return out


def send_to_vex(city, total, unique, sample_lines):
    if not HERMES_BASE:
        print("WARNING: HERMES_BASE not set, skipping fleet delivery", file=sys.stderr)
        return False

    message = f"""Scraper update — {city}

Stats:
- Queries: {len(QUERIES)}
- Unique emails: {unique}

Top contacts:
{chr(10).join(sample_lines)}

Full list saved to ~/tmp/pfp_scraper/{city.replace("/", "_").replace(",", "").replace(" ", "_")}.json
"""

    payload = json.dumps({"from": "hermes", "to": "vex", "message": message, "type": "update"})
    cmd = [
        "curl", "-s", "--resolve", "hermes.mobilemonero.com:443:172.67.175.106",
        f"{HERMES_BASE}/from/hermes",
        "-X", "POST", "-H", "Content-Type: application/json",
        "-d", payload
    ]
    try:
        out = subprocess.check_output(cmd, encoding="utf-8", timeout=20)
        res = json.loads(out)
        return res.get("ok", False)
    except Exception as e:
        print(f"ERROR sending to Vex: {e}", file=sys.stderr)
        return False


def broadcast_fleet(city, unique):
    if not HERMES_BASE:
        return False
    payload = json.dumps({
        "from": "hermes",
        "message": f"PFP scraper: {city} — {unique} venue emails found. Results with Vex.",
        "type": "update"
    })
    cmd = [
        "curl", "-s", "--resolve", "hermes.mobilemonero.com:443:172.67.175.106",
        f"{HERMES_BASE}/fleet/broadcast",
        "-X", "POST", "-H", "Content-Type: application/json",
        "-d", payload
    ]
    try:
        out = subprocess.check_output(cmd, encoding="utf-8", timeout=20)
        res = json.loads(out)
        return res.get("ok", False)
    except Exception as e:
        print(f"ERROR broadcasting: {e}", file=sys.stderr)
        return False


def main():
    state = load_state()
    cursor = state.get("cursor", 0)
    city = CITIES[cursor % len(CITIES)]

    print(f"=== PFP Exa Scraper ===")
    print(f"City: {city}")
    print(f"Queries: {len(QUERIES)}")

    all_entries = []
    for i, qt in enumerate(QUERIES):
        q = qt.format(city=city)
        print(f"[{i+1}/{len(QUERIES)}] {q} ...", flush=True)
        results = run_exa(q)
        entries = extract_emails(results)
        all_entries.extend(entries)
        print(f"  Results={len(results)}, entries={len(entries)}, emails so far={sum(len(e['emails']) for e in all_entries)}")
        time.sleep(0.8)

    clean = dedupe_emails(all_entries)
    unique = len(clean)

    fname = city.replace("/", "_").replace(",", "").replace(" ", "_") + ".json"
    outpath = os.path.join(OUT_DIR, fname)
    raw = {
        "city": city,
        "queries": len(QUERIES),
        "unique_urls": len({e["url"] for e in all_entries}),
        "unique_emails": unique,
        "emails": clean
    }
    with open(outpath, "w") as f:
        json.dump(raw, f, indent=2)

    # Also write vex_format for partyfavorphoto repo
    vex_name = city.replace("/", "_").replace(",", "_").replace(" ", "_") + "_vex.json"
    vex_path = os.path.join(OUT_DIR, vex_name)
    vex_format = transform_for_vex(clean, city)
    with open(vex_path, "w") as f:
        json.dump(vex_format, f, indent=2)

    # Build sample for Vex (top 15)
    sample = []
    for item in clean[:15]:
        sample.append(f"  {item['email']:<42} | {item['venues'][:50]}")

    print(f"\nUnique emails: {unique}")
    print(f"Saved: {outpath}")

    ok1 = send_to_vex(city, len(QUERIES), unique, sample)
    ok2 = broadcast_fleet(city, unique)

    print(f"Sent to Vex: {ok1}")
    print(f"Broadcast: {ok2}")

    # Advance state
    state["cursor"] = (cursor + 1) % len(CITIES)
    state["total_emails"] = state.get("total_emails", 0) + unique
    state["runs"].append({"city": city, "emails": unique, "ts": int(time.time())})
    save_state(state)
    print(f"Next city: {CITIES[state['cursor']]}")


if __name__ == "__main__":
    main()
