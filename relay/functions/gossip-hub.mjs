#!/usr/bin/env node
/**
 * Gossip Hub - Local Runtime Version
 * 
 * Ported from Supabase edge function to native Node.js
 * Part of XMRT DAO Migration Sprint - Hermes Assignment
 * 
 * Features:
 * - Publish/Subscribe messaging
 * - Topic-based routing (fleet-broadcast, agent-tasks, agent-heartbeat, agent-discovery)
 * - Message history (last 1000 per topic)
 * - XMRT University certificate authentication
 * - REST API endpoints
 * 
 * Usage:
 *   node gossip-hub.mjs [--port 9001]
 */

import http from 'http';
import { URL } from 'url';

// ── Configuration ──────────────────────────────────────────
const PORT = parseInt(process.argv.find(a => a.startsWith('--port='))?.split('=')[1]) || 9001;
const XMRT_CERT_HEADER = 'x-certificate-id';
const MAX_MESSAGES_PER_TOPIC = 1000;
const MAX_MESSAGE_SIZE = 1024; // 1KB

// ── State ──────────────────────────────────────────────────
const messageStore = new Map(); // topic -> [{id, agent_id, agent_name, message, payload, timestamp}]
const subscribers = new Map(); // topic -> Set of callback functions
let startTime = Date.now();
let totalMessages = 0;

// ── Valid Topics ───────────────────────────────────────────
const VALID_TOPICS = [
  'fleet-broadcast',
  'agent-tasks', 
  'agent-heartbeat',
  'agent-discovery'
];

// ── Helper Functions ───────────────────────────────────────
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function validateCertificate(certId) {
  // Basic validation - XMRT-CERT-XXXXXXXX format (8 alphanumeric chars)
  return /^XMRT-CERT-[A-Z0-9]{8}$/.test(certId);
}

function getTopicMessages(topic, limit = 50) {
  const messages = messageStore.get(topic) || [];
  return messages.slice(0, limit);
}

function getAllTopics() {
  return Array.from(messageStore.keys()).map(topic => ({
    topic,
    count: messageStore.get(topic).length
  }));
}

// ── Request Handlers ───────────────────────────────────────
const handlers = {
  // GET /health - Health check
  'GET /health': (req, res) => {
    res.json({
      status: 'online',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      total_messages: totalMessages,
      topics: messageStore.size
    });
  },

  // GET /topics - List all topics
  'GET /topics': (req, res, cert) => {
    if (!cert) {
      return res.error(401, 'x-certificate-id header required');
    }
    res.json({
      success: true,
      topics: getAllTopics()
    });
  },

  // POST /publish - Publish message to topic
  'POST /publish': (req, res, cert, body) => {
    if (!cert) {
      return res.error(401, 'x-certificate-id header required');
    }
    if (!validateCertificate(cert)) {
      return res.error(403, 'Invalid certificate format');
    }

    const { topic, from, message, payload } = body || {};
    
    if (!topic || !VALID_TOPICS.includes(topic)) {
      return res.error(400, `Invalid topic. Must be one of: ${VALID_TOPICS.join(', ')}`);
    }
    if (!message && !payload) {
      return res.error(400, 'message or payload required');
    }
    if (message && message.length > MAX_MESSAGE_SIZE) {
      return res.error(413, `Message exceeds ${MAX_MESSAGE_SIZE} char limit`);
    }

    const msg = {
      id: generateId(),
      topic,
      agent_id: from || 'unknown',
      agent_name: from || 'unknown',
      message: message || '',
      payload: payload || null,
      certificate_id: cert,
      created_at: new Date().toISOString()
    };

    // Store message
    if (!messageStore.has(topic)) {
      messageStore.set(topic, []);
    }
    messageStore.get(topic).unshift(msg);
    
    // Trim to max size
    if (messageStore.get(topic).length > MAX_MESSAGES_PER_TOPIC) {
      messageStore.get(topic).pop();
    }

    totalMessages++;

    // Notify subscribers
    if (subscribers.has(topic)) {
      subscribers.get(topic).forEach(cb => cb(msg));
    }

    res.json({
      success: true,
      published: true,
      topic,
      agent: from,
      message_id: msg.id
    });
  },

  // POST /subscribe - Subscribe to topic (returns current messages)
  'POST /subscribe': (req, res, cert, body) => {
    if (!cert) {
      return res.error(401, 'x-certificate-id header required');
    }

    const { topic, limit = 50 } = body || {};
    
    if (!topic) {
      return res.error(400, 'topic required');
    }

    const messages = getTopicMessages(topic, limit);
    res.json({
      success: true,
      topic,
      messages,
      count: messages.length
    });
  },

  // POST /history - Get message history for topic
  'POST /history': (req, res, cert, body) => {
    if (!cert) {
      return res.error(401, 'x-certificate-id header required');
    }

    const { topic, limit = 50 } = body || {};
    
    if (!topic) {
      return res.error(400, 'topic required');
    }

    const messages = getTopicMessages(topic, limit);
    res.json({
      success: true,
      topic,
      messages,
      count: messages.length
    });
  },

  // GET /stats - Get server statistics
  'GET /stats': (req, res, cert) => {
    if (!cert) {
      return res.error(401, 'x-certificate-id header required');
    }
    res.json({
      success: true,
      stats: {
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
        total_messages: totalMessages,
        topics: messageStore.size,
        topics_list: getAllTopics(),
        memory_usage: process.memoryUsage()
      }
    });
  }
};

// ── HTTP Server ────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-certificate-id');
  res.setHeader('Content-Type', 'application/json');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Helper response methods
  res.json = (data) => {
    res.writeHead(200);
    res.end(JSON.stringify(data, null, 2));
  };

  res.error = (code, message) => {
    res.writeHead(code);
    res.end(JSON.stringify({ error: message }));
  };

  // Get certificate from header
  const cert = req.headers[XMRT_CERT_HEADER];

  // Parse body for POST requests
  if (method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsed = null;
      try { parsed = body ? JSON.parse(body) : null; } catch (e) {}
      
      // Find handler
      const handlerKey = `${method} ${path}`;
      const handler = handlers[handlerKey];
      
      if (handler) {
        handler(req, res, cert, parsed);
      } else {
        res.error(404, `Endpoint not found: ${handlerKey}`);
      }
    });
  } else {
    // GET request
    const handlerKey = `${method} ${path}`;
    const handler = handlers[handlerKey];
    
    if (handler) {
      handler(req, res, cert, null);
    } else {
      res.error(404, `Endpoint not found: ${handlerKey}`);
    }
  }
});

// ── Start Server ───────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🦑 Gossip Hub - Local Runtime`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Topics: ${VALID_TOPICS.join(', ')}`);
  console.log(`   Max messages/topic: ${MAX_MESSAGES_PER_TOPIC}`);
  console.log(`   Auth: ${XMRT_CERT_HEADER} header`);
  console.log(`\n   Endpoints:`);
  console.log(`   GET  /health   - Health check`);
  console.log(`   GET  /topics   - List all topics`);
  console.log(`   POST /publish  - Publish message`);
  console.log(`   POST /subscribe - Get topic messages`);
  console.log(`   POST /history  - Get message history`);
  console.log(`   GET  /stats    - Server statistics`);
  console.log(`\n   Example:`);
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log(`   curl -X POST http://localhost:${PORT}/publish \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -H "x-certificate-id: XMRT-CERT-RMJTYENN" \\`);
  console.log(`     -d '{"topic":"fleet-broadcast","from":"hermes","message":"hello"}'`);
  console.log(`\n   Started: ${new Date().toISOString()}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🦑 Gossip Hub shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🦑 Gossip Hub interrupted...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
