# Gossip Hub Deployment Guide

## Problem

Supabase CLI doesn't support Android/Termux. The gossip-hub edge function needs to be deployed from a laptop/desktop.

## Files Created

- `/data/data/com.termux/files/home/mobilemonero/functions/gossip-hub/index.ts` - Edge function code
- `/data/data/com.termux/files/home/mobilemonero/deploy-gossip-hub.sh` - Deployment script (laptop)
- `/data/data/com.termux/files/home/mobilemonero/test-gossip-hub.sh` - Test script (any device)

## Deployment Options

### Option 1: Deploy from Laptop (Recommended)

```bash
# On your laptop/desktop (not Android)
cd ~/mobilemonero/functions
supabase functions deploy gossip-hub --project-ref vawouugtzwmejxqkeqqj
```

### Option 2: Deploy via Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/vawouugtzwmejxqkeqqj
2. Navigate to **Edge Functions** → **New Function**
3. Name: `gossip-hub`
4. Paste the contents of `functions/gossip-hub/index.ts`
5. Click **Deploy**

### Option 3: Deploy via curl (API)

```bash
# First, get your Supabase access token
supabase login  # On laptop

# Then deploy via API
curl -X POST "https://api.supabase.com/v1/projects/vawouugtzwmejxqkeqqj/functions" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "gossip-hub",
    "slug": "gossip-hub",
    "body": "$(cat functions/gossip-hub/index.ts | base64 -w0)"
  }'
```

## Post-Deployment Test

```bash
# From any device (including Android/Termux)
curl -s https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub/health | python3 -m json.tool

# Expected response:
# {
#   "status": "healthy",
#   "topics": 0,
#   "total_messages": 0,
#   "uptime": "edge-function"
# }
```

## Usage Examples

### Publish a message
```bash
curl -s -X POST https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub/publish \
  -H "Content-Type: application/json" \
  -d '{"topic":"fleet-broadcast","from":"hermes","message":"🦑 Gossip hub is live!","timestamp":"2026-05-25T14:00:00Z"}'
```

### Subscribe to messages
```bash
curl -s -X POST https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub/subscribe \
  -H "Content-Type: application/json" \
  -d '{"topic":"fleet-broadcast","limit":10}'
```

### List all topics
```bash
curl -s https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub/topics
```

## Why Gossip Hub?

**Current Problem:** `relay.mobilemonero.com` is blocked by Cloudflare Access (403 Forbidden)

**Solution:** Gossip Hub runs on Supabase edge functions, which:
- ✅ Don't require Cloudflare Access configuration
- ✅ Work with any HTTP client (curl, fetch, etc.)
- ✅ Provide pub/sub messaging for fleet coordination
- ✅ Bypass the Cloudflare Access block entirely

**Topics:**
- `fleet-broadcast` - General announcements
- `agent-heartbeat` - Agent status updates
- `agent-tasks` - Task assignments
- `agent-discovery` - Peer discovery messages

## Next Steps

1. Deploy gossip-hub from laptop (Option 1 or 2 above)
2. Run test script to verify: `bash test-gossip-hub.sh`
3. Update fleet agents to use gossip-hub instead of relay.mobilemonero.com
4. (Optional) Fix Cloudflare Access policy for relay.mobilemonero.com long-term
