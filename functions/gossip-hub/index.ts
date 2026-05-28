import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface Message {
  topic: string;
  from: string;
  message: string;
  timestamp: string;
  seq?: number;
}

interface PublishRequest {
  topic: string;
  from: string;
  message: string;
  timestamp: string;
}

interface SubscribeRequest {
  topic: string;
  since?: string;
  limit?: number;
}

// In-memory message buffer (last 1000 messages per topic)
const messageBuffer = new Map<string, Message[]>();
const MAX_MESSAGES_PER_TOPIC = 1000;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // No auth required - this is a public gossip hub
    // Rate limiting and spam prevention handled by message size limits

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "publish") {
        return await handlePublish(body);
      } else if (action === "subscribe") {
        return await handleSubscribe(body);
      } else if (action === "history") {
        return await handleHistory(body);
      }
    } else if (req.method === "GET") {
      if (action === "topics") {
        return await handleTopics();
      } else if (action === "health") {
        return await handleHealth();
      }
    }

    return new Response(
      JSON.stringify({ error: "Unknown action", available_actions: ["publish", "subscribe", "history", "topics", "health"] }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Gossip hub error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handlePublish(body: PublishRequest): Promise<Response> {
  const { topic, from, message, timestamp } = body;

  if (!topic || !from || !message) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: topic, from, message" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Enforce message size limit (1KB to prevent abuse)
  if (message.length > 1024) {
    return new Response(
      JSON.stringify({ error: "Message too long (max 1024 chars)", truncated: message.substring(0, 100) + "..." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get or create topic buffer
  if (!messageBuffer.has(topic)) {
    messageBuffer.set(topic, []);
  }
  const topicMessages = messageBuffer.get(topic)!;

  // Create message with sequence number
  const msg: Message = {
    topic,
    from,
    message,
    timestamp: timestamp || new Date().toISOString(),
    seq: topicMessages.length + 1,
  };

  // Add to buffer, enforce max size
  topicMessages.push(msg);
  if (topicMessages.length > MAX_MESSAGES_PER_TOPIC) {
    topicMessages.shift(); // Remove oldest
  }

  console.log(`[GOSSIP] Published to ${topic} from ${from}: ${message.substring(0, 50)}...`);

  return new Response(
    JSON.stringify({ success: true, message: msg }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleSubscribe(body: SubscribeRequest): Promise<Response> {
  const { topic, since, limit = 50 } = body;

  if (!topic) {
    return new Response(
      JSON.stringify({ error: "Missing required field: topic" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const topicMessages = messageBuffer.get(topic) || [];

  // Filter by timestamp if provided
  let messages = topicMessages;
  if (since) {
    messages = topicMessages.filter(m => m.timestamp > since);
  }

  // Return most recent messages
  const result = messages.slice(-limit);

  return new Response(
    JSON.stringify({ success: true, topic, messages: result, count: result.length }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleHistory(body: { topic: string; limit?: number }): Promise<Response> {
  const { topic, limit = 100 } = body;

  if (!topic) {
    return new Response(
      JSON.stringify({ error: "Missing required field: topic" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const topicMessages = messageBuffer.get(topic) || [];
  const result = topicMessages.slice(-limit);

  return new Response(
    JSON.stringify({ success: true, topic, messages: result, count: result.length }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleTopics(): Promise<Response> {
  const topics = Array.from(messageBuffer.keys()).map(topic => ({
    topic,
    message_count: messageBuffer.get(topic)?.length || 0,
  }));

  return new Response(
    JSON.stringify({ success: true, topics }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleHealth(): Promise<Response> {
  const totalMessages = Array.from(messageBuffer.values()).reduce((sum, msgs) => sum + msgs.length, 0);
  const topicCount = messageBuffer.size;

  return new Response(
    JSON.stringify({
      status: "healthy",
      topics: topicCount,
      total_messages: totalMessages,
      uptime: "edge-function",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
