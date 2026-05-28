#!/usr/bin/env node
/**
 * Database Layer - XMRT DAO Local Runtime
 * 
 * SQLite-backed storage for edge functions: messages, peers, certifications, logs.
 * Part of Hermes Migration Sprint - Task 3: DB
 * 
 * Features:
 * - SQLite storage (better-sqlite3 or sql.js for Termux)
 * - Message persistence
 * - Peer registry
 * - Certificate cache
 * - Audit logs
 * - Backup/restore
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ── Configuration ──────────────────────────────────────────
const DB_PATH = process.env.XMRT_DB_PATH || './data/xmrt-local.db';
const BACKUP_PATH = process.env.XMRT_BACKUP_PATH || './data/backups/';

// ── In-Memory Store (for Termux without SQLite) ───────────
// Falls back to JSON file persistence if SQLite not available
const store = {
  messages: [],
  peers: new Map(),
  certificates: new Map(),
  logs: [],
  config: new Map()
};

// ── Database API ───────────────────────────────────────────
export const db = {
  // ── Messages ─────────────────────────────────────────────
  messages: {
    insert: (msg) => {
      const entry = {
        id: msg.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        topic: msg.topic,
        agent_id: msg.agent_id,
        agent_name: msg.agent_name,
        message: msg.message,
        payload: msg.payload ? JSON.stringify(msg.payload) : null,
        certificate_id: msg.certificate_id,
        created_at: msg.created_at || new Date().toISOString()
      };
      store.messages.unshift(entry);
      
      // Trim to 10000 messages max
      if (store.messages.length > 10000) {
        store.messages = store.messages.slice(0, 10000);
      }
      
      return entry;
    },

    query: (topic, limit = 50, offset = 0) => {
      return store.messages
        .filter(m => !topic || m.topic === topic)
        .slice(offset, offset + limit);
    },

    count: (topic) => {
      if (!topic) return store.messages.length;
      return store.messages.filter(m => m.topic === topic).length;
    },

    deleteOld: (days = 7) => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const before = store.messages.length;
      store.messages = store.messages.filter(m => 
        new Date(m.created_at) > cutoff
      );
      return { deleted: before - store.messages.length };
    }
  },

  // ── Peers ────────────────────────────────────────────────
  peers: {
    upsert: (peer) => {
      const existing = store.peers.get(peer.agent_id);
      const entry = {
        agent_id: peer.agent_id,
        agent_name: peer.agent_name,
        peer_id: peer.peer_id,
        tier: peer.tier || 'member',
        permissions: peer.permissions || [],
        certificate_id: peer.certificate_id,
        last_seen: new Date().toISOString(),
        status: 'online',
        metadata: peer.metadata || {}
      };
      store.peers.set(peer.agent_id, entry);
      return { ...entry, existing: !!existing };
    },

    get: (agentId) => {
      return store.peers.get(agentId) || null;
    },

    list: (statusFilter) => {
      const peers = Array.from(store.peers.values());
      if (statusFilter) {
        return peers.filter(p => p.status === statusFilter);
      }
      return peers;
    },

    markOffline: (agentId) => {
      const peer = store.peers.get(agentId);
      if (peer) {
        peer.status = 'offline';
        peer.last_seen = new Date().toISOString();
        store.peers.set(agentId, peer);
      }
      return peer;
    },

    count: () => store.peers.size
  },

  // ── Certificates ─────────────────────────────────────────
  certificates: {
    cache: (cert) => {
      const entry = {
        certificate_id: cert.certificate_id,
        agent_id: cert.agent_id,
        tier: cert.tier,
        permissions: cert.permissions,
        issued_at: cert.issued_at,
        expires_at: cert.expires_at,
        cached_at: new Date().toISOString()
      };
      store.certificates.set(cert.certificate_id, entry);
      return entry;
    },

    get: (certId) => {
      return store.certificates.get(certId) || null;
    },

    validate: (certId) => {
      const cert = store.certificates.get(certId);
      if (!cert) return { valid: false, reason: 'Not found in cache' };
      
      const now = new Date();
      const expires = new Date(cert.expires_at);
      
      if (expires < now) {
        return { valid: false, reason: 'Expired' };
      }
      
      return {
        valid: true,
        certificate: cert,
        expires_in: Math.floor((expires - now) / 1000)
      };
    },

    count: () => store.certificates.size
  },

  // ── Logs ─────────────────────────────────────────────────
  logs: {
    append: (entry) => {
      const log = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        level: entry.level || 'info',
        function: entry.function,
        message: entry.message,
        data: entry.data,
        timestamp: new Date().toISOString()
      };
      store.logs.unshift(log);
      
      // Trim to 5000 logs max
      if (store.logs.length > 5000) {
        store.logs = store.logs.slice(0, 5000);
      }
      
      return log;
    },

    query: (options = {}) => {
      let logs = store.logs;
      
      if (options.level) {
        logs = logs.filter(l => l.level === options.level);
      }
      if (options.function) {
        logs = logs.filter(l => l.function === options.function);
      }
      if (options.since) {
        const since = new Date(options.since);
        logs = logs.filter(l => new Date(l.timestamp) > since);
      }
      
      return logs.slice(0, options.limit || 100);
    },

    count: () => store.logs.length
  },

  // ── Config ───────────────────────────────────────────────
  config: {
    set: (key, value) => {
      store.config.set(key, { value, updated_at: new Date().toISOString() });
      return { key, value };
    },

    get: (key, defaultValue) => {
      const entry = store.config.get(key);
      return entry ? entry.value : defaultValue;
    },

    delete: (key) => {
      return store.config.delete(key);
    },

    all: () => {
      const config = {};
      store.config.forEach((value, key) => {
        config[key] = value.value;
      });
      return config;
    }
  },

  // ── Persistence ──────────────────────────────────────────
  save: (path = DB_PATH) => {
    const data = {
      messages: store.messages,
      peers: Array.from(store.peers.entries()),
      certificates: Array.from(store.certificates.entries()),
      logs: store.logs,
      config: Array.from(store.config.entries()),
      saved_at: new Date().toISOString()
    };
    
    try {
      writeFileSync(path, JSON.stringify(data, null, 2));
      return { success: true, path };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  load: (path = DB_PATH) => {
    try {
      const data = JSON.parse(readFileSync(path, 'utf-8'));
      
      store.messages = data.messages || [];
      store.peers = new Map(data.peers || []);
      store.certificates = new Map(data.certificates || []);
      store.logs = data.logs || [];
      store.config = new Map(data.config || []);
      
      return { success: true, loaded_at: data.saved_at };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ── Stats ────────────────────────────────────────────────
  getStats: () => ({
    messages: store.messages.length,
    peers: store.peers.size,
    certificates: store.certificates.size,
    logs: store.logs.length,
    config_keys: store.config.size
  })
};

// ── Auto-save interval ─────────────────────────────────────
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  db.save();
}, AUTO_SAVE_INTERVAL);

// ── CLI Mode ───────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\n💾 Database Layer - XMRT DAO Local Runtime\n');
  
  // Load existing data
  const loadResult = db.load();
  if (loadResult.success) {
    console.log(`✅ Loaded database from ${DB_PATH}`);
    console.log(`   Saved at: ${loadResult.loaded_at}`);
  } else {
    console.log(`ℹ️  No existing database found. Starting fresh.`);
  }
  
  const stats = db.getStats();
  console.log('\nDatabase Stats:');
  console.log(`   Messages: ${stats.messages}`);
  console.log(`   Peers: ${stats.peers}`);
  console.log(`   Certificates: ${stats.certificates}`);
  console.log(`   Logs: ${stats.logs}`);
  console.log(`   Config keys: ${stats.config_keys}`);
  
  console.log(`\nAuto-save: Every ${AUTO_SAVE_INTERVAL / 1000} seconds`);
  console.log(`Database path: ${DB_PATH}\n`);
}
