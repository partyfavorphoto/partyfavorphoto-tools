#!/bin/bash
# Test gossip-hub edge function

ENDPOINT="https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub"

echo "=== GOSSIP HUB TEST SUITE ==="
echo ""

# Test 1: Health check
echo "1. Health Check:"
curl -s "$ENDPOINT/health" | python3 -m json.tool
echo ""

# Test 2: List topics (should be empty initially)
echo "2. List Topics:"
curl -s "$ENDPOINT/topics" | python3 -m json.tool
echo ""

# Test 3: Publish a message
echo "3. Publish Message:"
curl -s -X POST "$ENDPOINT/publish" \
  -H "Content-Type: application/json" \
  -d "{\"topic\":\"fleet-broadcast\",\"from\":\"hermes-test\",\"message\":\"🦑 Gossip hub test message from Hermes on Android/Termux\",\"timestamp\":\"$(date -Iseconds)\"}" | python3 -m json.tool
echo ""

# Test 4: Subscribe to messages
echo "4. Subscribe to fleet-broadcast:"
curl -s -X POST "$ENDPOINT/subscribe" \
  -H "Content-Type: application/json" \
  -d "{\"topic\":\"fleet-broadcast\",\"limit\":10}" | python3 -m json.tool
echo ""

# Test 5: Get history
echo "5. Get History:"
curl -s -X POST "$ENDPOINT/history" \
  -H "Content-Type: application/json" \
  -d "{\"topic\":\"fleet-broadcast\",\"limit\":10}" | python3 -m json.tool
echo ""

# Test 6: List topics again (should have fleet-broadcast now)
echo "6. List Topics (after publish):"
curl -s "$ENDPOINT/topics" | python3 -m json.tool
echo ""

# Test 7: Publish to multiple topics
echo "7. Publish to agent-heartbeat:"
curl -s -X POST "$ENDPOINT/publish" \
  -H "Content-Type: application/json" \
  -d "{\"topic\":\"agent-heartbeat\",\"from\":\"hermes\",\"message\":\"heartbeat:online\",\"timestamp\":\"$(date -Iseconds)\"}" | python3 -m json.tool
echo ""

# Test 8: Final topic list
echo "8. Final Topic List:"
curl -s "$ENDPOINT/topics" | python3 -m json.tool
echo ""

echo "=== TEST COMPLETE ==="
