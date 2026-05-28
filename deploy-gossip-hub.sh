#!/bin/bash
# Deploy gossip-hub edge function to Supabase
# Bypasses Cloudflare Access - uses Supabase auth only

set -e

PROJECT_REF="vawouugtzwmejxqkeqqj"
FUNCTION_NAME="gossip-hub"

echo "🦑 Deploying gossip-hub edge function..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with:"
    echo "   npm install -g supabase"
    echo "   OR"
    echo "   curl -fsSL https://supabase.com/install.sh | bash"
    exit 1
fi

# Navigate to functions directory
cd /data/data/com.termux/files/home/mobilemonero/functions

echo "📦 Deploying $FUNCTION_NAME to project $PROJECT_REF..."
supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_REF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Endpoint: https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub"
echo ""
echo "🧪 Test commands:"
echo ""
echo "# Health check:"
echo "curl -s https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub/health | jq"
echo ""
echo "# Publish a message:"
echo "curl -s -X POST https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub/publish \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"topic\":\"fleet-broadcast\",\"from\":\"hermes\",\"message\":\"🦑 Gossip hub is live!\",\"timestamp\":\"'$(date -Iseconds)'\"}' | jq"
echo ""
echo "# Subscribe to messages:"
echo "curl -s -X POST https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub/subscribe \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"topic\":\"fleet-broadcast\",\"limit\":10}' | jq"
echo ""
echo "# List all topics:"
echo "curl -s https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gossip-hub/topics | jq"
