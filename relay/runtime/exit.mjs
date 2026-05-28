#!/usr/bin/env node
/**
 * Exit Plan - XMRT DAO Local Runtime
 * 
 * Graceful shutdown, state preservation, and recovery procedures.
 * Part of Hermes Migration Sprint - Task 4: exit
 * 
 * Features:
 * - Graceful shutdown handlers (SIGTERM, SIGINT)
 * - State snapshot before exit
 * - Crash recovery on restart
 * - Emergency shutdown procedures
 * - Health degradation protocols
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { EventEmitter } from 'events';

// ── Configuration ──────────────────────────────────────────
const STATE_PATH = process.env.XMRT_STATE_PATH || './data/runtime-state.json';
const CRASH_LOG_PATH = process.env.XMRT_CRASH_LOG || './data/crash-log.json';
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds max shutdown time

// ── State ──────────────────────────────────────────────────
const events = new EventEmitter();
let shutdownInProgress = false;
let shutdownStartTime = null;
const cleanupHandlers = [];

// ── Exit Plan API ──────────────────────────────────────────
export const exitPlan = {
  // Register cleanup handler
  onCleanup: (handler) => {
    cleanupHandlers.unshift(handler);
    return () => {
      const idx = cleanupHandlers.indexOf(handler);
      if (idx > -1) cleanupHandlers.splice(idx, 1);
    };
  },

  // Save state before exit
  saveState: async (state) => {
    const snapshot = {
      saved_at: new Date().toISOString(),
      uptime: state.uptime || 0,
      functions: state.functions || [],
      messages_count: state.messages_count || 0,
      peers_count: state.peers_count || 0,
      config: state.config || {},
      shutdown_reason: state.shutdown_reason || 'manual'
    };

    try {
      writeFileSync(STATE_PATH, JSON.stringify(snapshot, null, 2));
      events.emit('state:saved', snapshot);
      return { success: true, path: STATE_PATH };
    } catch (error) {
      events.emit('state:error', { action: 'save', error });
      return { success: false, error: error.message };
    }
  },

  // Load state after crash/restart
  loadState: () => {
    if (!existsSync(STATE_PATH)) {
      return { success: false, reason: 'No state file found' };
    }

    try {
      const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
      events.emit('state:loaded', state);
      return { success: true, state };
    } catch (error) {
      events.emit('state:error', { action: 'load', error });
      return { success: false, error: error.message };
    }
  },

  // Log crash for analysis
  logCrash: (error, context) => {
    const crash = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: context || {},
      uptime: shutdownStartTime ? Date.now() - shutdownStartTime : 0
    };

    // Read existing crash log
    let crashes = [];
    if (existsSync(CRASH_LOG_PATH)) {
      try {
        crashes = JSON.parse(readFileSync(CRASH_LOG_PATH, 'utf-8'));
      } catch (e) {}
    }

    // Add new crash, keep last 100
    crashes.unshift(crash);
    if (crashes.length > 100) crashes = crashes.slice(0, 100);

    try {
      writeFileSync(CRASH_LOG_PATH, JSON.stringify(crashes, null, 2));
      events.emit('crash:logged', crash);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Get crash history
  getCrashHistory: (limit = 10) => {
    if (!existsSync(CRASH_LOG_PATH)) {
      return [];
    }

    try {
      const crashes = JSON.parse(readFileSync(CRASH_LOG_PATH, 'utf-8'));
      return crashes.slice(0, limit);
    } catch (e) {
      return [];
    }
  },

  // Graceful shutdown
  shutdown: async (reason = 'manual', timeout = SHUTDOWN_TIMEOUT) => {
    if (shutdownInProgress) {
      return { success: false, error: 'Shutdown already in progress' };
    }

    shutdownInProgress = true;
    shutdownStartTime = Date.now();

    console.log(`\n🛑 Shutdown initiated: ${reason}`);
    console.log(`   Timeout: ${timeout}ms`);
    console.log(`   Cleanup handlers: ${cleanupHandlers.length}\n`);

    events.emit('shutdown:start', { reason, timeout });

    const results = [];
    const deadline = Date.now() + timeout;

    // Run cleanup handlers with timeout
    for (const handler of cleanupHandlers) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        console.log(`⚠️  Cleanup timeout reached. Skipping remaining handlers.`);
        break;
      }

      try {
        const result = await Promise.race([
          handler(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Handler timeout')), remaining)
          )
        ]);
        results.push({ handler: handler.name || 'anonymous', success: true, result });
        console.log(`✅ Cleanup: ${handler.name || 'anonymous'}`);
      } catch (error) {
        results.push({ handler: handler.name || 'anonymous', success: false, error: error.message });
        console.log(`❌ Cleanup: ${handler.name || 'anonymous'} - ${error.message}`);
      }
    }

    // Save final state
    await exitPlan.saveState({
      uptime: Date.now() - shutdownStartTime,
      shutdown_reason: reason,
      cleanup_results: results
    });

    shutdownInProgress = false;
    events.emit('shutdown:complete', { reason, results, duration: Date.now() - shutdownStartTime });

    return {
      success: true,
      reason,
      duration: Date.now() - shutdownStartTime,
      results
    };
  },

  // Emergency shutdown (immediate)
  emergencyShutdown: (reason) => {
    console.log(`\n🚨 EMERGENCY SHUTDOWN: ${reason}`);
    events.emit('shutdown:emergency', { reason });
    
    // Try to save minimal state
    try {
      writeFileSync(STATE_PATH, JSON.stringify({
        saved_at: new Date().toISOString(),
        emergency: true,
        reason
      }, null, 2));
    } catch (e) {}

    process.exit(1);
  },

  // Health degradation protocol
  degradeHealth: (level, reason) => {
    const levels = ['healthy', 'degraded', 'critical', 'shutdown'];
    const currentIdx = levels.indexOf(level);
    
    console.log(`\n⚠️  Health degradation: ${level} - ${reason}`);
    events.emit('health:degrade', { level, reason, currentIdx });

    if (level === 'shutdown') {
      exitPlan.shutdown(reason);
    }

    return { level, reason };
  },

  // Get shutdown status
  getStatus: () => ({
    shutdown_in_progress: shutdownInProgress,
    shutdown_start_time: shutdownStartTime,
    cleanup_handlers_count: cleanupHandlers.length,
    uptime: shutdownStartTime ? Date.now() - shutdownStartTime : null
  }),

  // Event subscription
  on: (event, callback) => {
    events.on(event, callback);
  }
};

// ── Signal Handlers ────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('\n📡 Received SIGTERM');
  await exitPlan.shutdown('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n📡 Received SIGINT');
  await exitPlan.shutdown('SIGINT');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error.message);
  exitPlan.logCrash(error, { type: 'uncaughtException' });
  
  // Don't exit immediately - let error handlers decide
  events.emit('runtime:exception', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled Rejection:', reason);
  exitPlan.logCrash(
    reason instanceof Error ? reason : new Error(String(reason)), 
    { type: 'unhandledRejection' }
  );
  
  events.emit('runtime:rejection', { reason, promise });
});

// ── Recovery Check on Startup ──────────────────────────────
export const checkRecovery = () => {
  const stateResult = exitPlan.loadState();
  const crashHistory = exitPlan.getCrashHistory(1);
  
  return {
    has_previous_state: stateResult.success,
    previous_state: stateResult.state,
    last_crash: crashHistory[0] || null,
    crash_count: exitPlan.getCrashHistory(100).length
  };
};

// ── CLI Mode ───────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\n🚪 Exit Plan - XMRT DAO Local Runtime\n');
  
  const recovery = checkRecovery();
  
  if (recovery.has_previous_state) {
    console.log('📋 Previous State Found:');
    console.log(`   Saved at: ${recovery.previous_state.saved_at}`);
    console.log(`   Shutdown reason: ${recovery.previous_state.shutdown_reason}`);
    console.log(`   Uptime: ${recovery.previous_state.uptime}ms`);
  } else {
    console.log('ℹ️  No previous state found. Clean start.');
  }

  if (recovery.last_crash) {
    console.log('\n💥 Last Crash:');
    console.log(`   Time: ${recovery.last_crash.timestamp}`);
    console.log(`   Error: ${recovery.last_crash.error.message}`);
    console.log(`   Total crashes: ${recovery.crash_count}`);
  }

  console.log('\n📋 Exit Plan Features:');
  console.log('   - Graceful shutdown (SIGTERM/SIGINT handlers)');
  console.log('   - State preservation before exit');
  console.log('   - Crash logging and analysis');
  console.log('   - Cleanup handler registration');
  console.log('   - Health degradation protocols');
  console.log('   - Emergency shutdown procedures');
  
  console.log(`\nState path: ${STATE_PATH}`);
  console.log(`Crash log: ${CRASH_LOG_PATH}\n`);
}
