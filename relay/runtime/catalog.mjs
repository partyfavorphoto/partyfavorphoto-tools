#!/usr/bin/env node
/**
 * Function Catalog - XMRT DAO Local Runtime
 * 
 * Registry of available edge functions with metadata, versions, and health status.
 * Part of Hermes Migration Sprint - Task 1: catalog
 * 
 * Features:
 * - Function registration with metadata
 * - Version tracking
 * - Health status monitoring
 * - Dependency mapping
 * - Enable/disable functions
 */

import { EventEmitter } from 'events';

// ── Catalog State ──────────────────────────────────────────
const catalog = new Map();
const events = new EventEmitter();

// ── Default Functions (XMRT DAO Core) ──────────────────────
const defaultFunctions = [
  {
    name: 'gossip-hub',
    version: '1.0.0',
    path: 'functions/gossip-hub.mjs',
    description: 'Fleet messaging - publish/subscribe via gossipsub',
    status: 'active',
    port: 9001,
    topics: ['fleet-broadcast', 'agent-tasks', 'agent-heartbeat', 'agent-discovery'],
    auth: 'x-certificate-id',
    health_endpoint: '/health',
    dependencies: []
  },
  {
    name: 'mesh-peer-connector',
    version: '1.0.0',
    path: 'functions/mesh-peer-connector.mjs',
    description: 'P2P mesh registry - peer discovery and status',
    status: 'pending',
    port: 9002,
    auth: 'x-certificate-id',
    health_endpoint: '/health',
    dependencies: []
  },
  {
    name: 'xmrt-university',
    version: '1.0.0',
    path: 'functions/xmrt-university.mjs',
    description: 'Certification system - enroll, quiz, graduate',
    status: 'pending',
    port: 9003,
    auth: 'x-certificate-id',
    health_endpoint: '/health',
    dependencies: []
  },
  {
    name: 'eliza-relay',
    version: '1.0.0',
    path: 'functions/eliza-relay.mjs',
    description: 'Eliza/Ollama integration - AI agent relay',
    status: 'pending',
    port: 9004,
    auth: 'x-certificate-id',
    health_endpoint: '/health',
    dependencies: ['gossip-hub']
  },
  {
    name: 'system-status',
    version: '1.0.0',
    path: 'functions/system-status.mjs',
    description: 'Fleet health monitoring - uptime, metrics, alerts',
    status: 'pending',
    port: 9005,
    auth: 'x-certificate-id',
    health_endpoint: '/health',
    dependencies: []
  }
];

// ── Initialize Catalog ─────────────────────────────────────
function initCatalog() {
  defaultFunctions.forEach(fn => {
    catalog.set(fn.name, {
      ...fn,
      registered_at: new Date().toISOString(),
      last_health_check: null,
      health_status: 'unknown',
      error_count: 0,
      restart_count: 0
    });
  });
  events.emit('catalog:init', catalog.size);
  return catalog.size;
}

// ── Catalog API ────────────────────────────────────────────
export const catalogAPI = {
  // List all functions
  list: (statusFilter) => {
    const functions = Array.from(catalog.values());
    if (statusFilter) {
      return functions.filter(fn => fn.status === statusFilter);
    }
    return functions;
  },

  // Get single function
  get: (name) => {
    return catalog.get(name) || null;
  },

  // Register new function
  register: (fn) => {
    if (!fn.name || !fn.version) {
      throw new Error('Function must have name and version');
    }
    
    const existing = catalog.get(fn.name);
    const entry = {
      ...fn,
      status: fn.status || 'pending',
      registered_at: new Date().toISOString(),
      last_health_check: null,
      health_status: 'unknown',
      error_count: 0,
      restart_count: 0
    };

    catalog.set(fn.name, entry);
    events.emit('function:register', entry);
    
    return {
      success: true,
      function: entry,
      existing: !!existing
    };
  },

  // Update function status
  updateStatus: (name, status, healthData) => {
    const fn = catalog.get(name);
    if (!fn) {
      return { success: false, error: 'Function not found' };
    }

    fn.status = status;
    fn.last_health_check = new Date().toISOString();
    fn.health_status = healthData?.status || 'unknown';
    
    if (healthData?.error) {
      fn.error_count++;
    } else {
      fn.error_count = 0;
    }

    events.emit('function:update', fn);
    return { success: true, function: fn };
  },

  // Enable function
  enable: (name) => {
    const fn = catalog.get(name);
    if (!fn) {
      return { success: false, error: 'Function not found' };
    }
    fn.status = 'active';
    events.emit('function:enable', fn);
    return { success: true, function: fn };
  },

  // Disable function
  disable: (name, reason) => {
    const fn = catalog.get(name);
    if (!fn) {
      return { success: false, error: 'Function not found' };
    }
    fn.status = 'disabled';
    fn.disable_reason = reason;
    events.emit('function:disable', fn);
    return { success: true, function: fn };
  },

  // Get functions by dependency
  getDependents: (name) => {
    return Array.from(catalog.values()).filter(fn => 
      fn.dependencies?.includes(name)
    );
  },

  // Get catalog stats
  getStats: () => {
    const functions = Array.from(catalog.values());
    return {
      total: functions.length,
      active: functions.filter(fn => fn.status === 'active').length,
      pending: functions.filter(fn => fn.status === 'pending').length,
      disabled: functions.filter(fn => fn.status === 'disabled').length,
      unhealthy: functions.filter(fn => fn.health_status === 'unhealthy').length
    };
  },

  // Event subscription
  on: (event, callback) => {
    events.on(event, callback);
  }
};

// ── CLI Mode (if run directly) ─────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\n📦 Function Catalog - XMRT DAO Local Runtime');
  console.log('   Initializing...\n');
  
  initCatalog();
  
  const stats = catalogAPI.getStats();
  console.log('Catalog Stats:');
  console.log(`   Total functions: ${stats.total}`);
  console.log(`   Active: ${stats.active}`);
  console.log(`   Pending: ${stats.pending}`);
  console.log(`   Disabled: ${stats.disabled}`);
  console.log(`   Unhealthy: ${stats.unhealthy}`);
  
  console.log('\nRegistered Functions:');
  catalogAPI.list().forEach(fn => {
    console.log(`   - ${fn.name} v${fn.version} [${fn.status}]`);
    console.log(`     ${fn.description}`);
    console.log(`     Port: ${fn.port}, Path: ${fn.path}`);
    if (fn.dependencies?.length > 0) {
      console.log(`     Dependencies: ${fn.dependencies.join(', ')}`);
    }
    console.log('');
  });
}
