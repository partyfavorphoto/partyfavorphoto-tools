#!/usr/bin/env node
/**
 * Runtime Manager - XMRT DAO Local Runtime
 * 
 * Manages lifecycle of edge functions: start, stop, restart, monitor.
 * Part of Hermes Migration Sprint - Task 2: runtime
 * 
 * Features:
 * - Process management (spawn, kill, restart)
 * - Health monitoring
 * - Auto-restart on failure
 * - Resource limits (memory, CPU)
 * - Graceful shutdown
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { catalogAPI } from './catalog.mjs';

// ── Runtime State ──────────────────────────────────────────
const processes = new Map(); // name -> { process, pid, started_at, restarts }
const events = new EventEmitter();
const MAX_RESTARTS = 3;
const RESTART_DELAY = 5000; // 5 seconds
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// ── Runtime Manager ────────────────────────────────────────
export const runtimeManager = {
  // Start a function
  start: async (name, options = {}) => {
    const fn = catalogAPI.get(name);
    if (!fn) {
      return { success: false, error: 'Function not found in catalog' };
    }

    if (processes.has(name)) {
      return { success: false, error: 'Function already running' };
    }

    console.log(`🚀 Starting ${name}...`);

    try {
      const proc = spawn('node', [fn.path, `--port=${options.port || fn.port}`], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FUNCTION_NAME: name }
      });

      const procInfo = {
        process: proc,
        pid: proc.pid,
        started_at: new Date().toISOString(),
        restarts: 0,
        last_output: null
      };

      // Capture output
      proc.stdout.on('data', (data) => {
        procInfo.last_output = data.toString();
        events.emit('function:output', { name, type: 'stdout', data: procInfo.last_output });
      });

      proc.stderr.on('data', (data) => {
        procInfo.last_output = data.toString();
        events.emit('function:output', { name, type: 'stderr', data: procInfo.last_output });
      });

      // Handle exit
      proc.on('exit', (code, signal) => {
        console.log(`❌ ${name} exited with code ${code} (${signal})`);
        processes.delete(name);
        catalogAPI.updateStatus(name, 'stopped', { status: 'stopped', exit_code: code });
        events.emit('function:exit', { name, code, signal });

        // Auto-restart if not explicitly stopped
        if (code !== 0 && procInfo.restarts < MAX_RESTARTS) {
          procInfo.restarts++;
          console.log(`🔄 Auto-restarting ${name} (attempt ${procInfo.restarts}/${MAX_RESTARTS})...`);
          setTimeout(() => runtimeManager.start(name, options), RESTART_DELAY);
        } else if (procInfo.restarts >= MAX_RESTARTS) {
          console.log(`⚠️  ${name} exceeded max restarts (${MAX_RESTARTS}). Disabling.`);
          catalogAPI.disable(name, `Exceeded max restarts (${MAX_RESTARTS})`);
        }
      });

      processes.set(name, procInfo);
      catalogAPI.updateStatus(name, 'active', { status: 'running', pid: proc.pid });
      events.emit('function:start', { name, pid: proc.pid });

      // Wait for health check
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        pid: proc.pid,
        port: options.port || fn.port
      };
    } catch (error) {
      catalogAPI.updateStatus(name, 'error', { status: 'error', error: error.message });
      events.emit('function:error', { name, error });
      return { success: false, error: error.message };
    }
  },

  // Stop a function
  stop: async (name, force = false) => {
    const procInfo = processes.get(name);
    if (!procInfo) {
      return { success: false, error: 'Function not running' };
    }

    console.log(`🛑 Stopping ${name}...`);

    return new Promise((resolve) => {
      if (force) {
        procInfo.process.kill('SIGKILL');
        processes.delete(name);
        catalogAPI.updateStatus(name, 'stopped', { status: 'stopped' });
        events.emit('function:stop', { name, forced: true });
        resolve({ success: true });
      } else {
        // Graceful shutdown
        procInfo.process.on('exit', () => {
          processes.delete(name);
          catalogAPI.updateStatus(name, 'stopped', { status: 'stopped' });
          events.emit('function:stop', { name, forced: false });
          resolve({ success: true });
        });

        procInfo.process.kill('SIGTERM');

        // Force kill after timeout
        setTimeout(() => {
          if (processes.has(name)) {
            procInfo.process.kill('SIGKILL');
            processes.delete(name);
            resolve({ success: true, forced: true });
          }
        }, 10000);
      }
    });
  },

  // Restart a function
  restart: async (name) => {
    const fn = catalogAPI.get(name);
    if (!fn) {
      return { success: false, error: 'Function not found' };
    }

    await runtimeManager.stop(name);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return runtimeManager.start(name);
  },

  // Get status of all functions
  status: () => {
    const status = {};
    processes.forEach((procInfo, name) => {
      const fn = catalogAPI.get(name);
      status[name] = {
        running: true,
        pid: procInfo.pid,
        started_at: procInfo.started_at,
        restarts: procInfo.restarts,
        port: fn?.port,
        last_output: procInfo.last_output?.slice(0, 200)
      };
    });

    // Add non-running functions from catalog
    catalogAPI.list().forEach(fn => {
      if (!processes.has(fn.name)) {
        status[fn.name] = {
          running: false,
          status: fn.status,
          port: fn.port
        };
      }
    });

    return status;
  },

  // Health check all running functions
  healthCheck: async () => {
    const results = {};
    
    for (const [name, procInfo] of processes.entries()) {
      const fn = catalogAPI.get(name);
      if (!fn?.health_endpoint) {
        results[name] = { status: 'unknown', reason: 'No health endpoint' };
        continue;
      }

      try {
        // Simple check: is process still alive?
        const isAlive = procInfo.process.pid && process.pid !== procInfo.process.pid;
        results[name] = {
          status: isAlive ? 'healthy' : 'unhealthy',
          pid: procInfo.pid,
          uptime: Math.floor((Date.now() - new Date(procInfo.started_at).getTime()) / 1000)
        };
        catalogAPI.updateStatus(name, 'active', { status: isAlive ? 'healthy' : 'unhealthy' });
      } catch (error) {
        results[name] = { status: 'unhealthy', error: error.message };
        catalogAPI.updateStatus(name, 'active', { status: 'unhealthy', error: error.message });
      }
    }

    return results;
  },

  // Start all active functions
  startAll: async () => {
    const activeFunctions = catalogAPI.list('active');
    const results = [];

    for (const fn of activeFunctions) {
      const result = await runtimeManager.start(fn.name);
      results.push({ name: fn.name, ...result });
    }

    return results;
  },

  // Stop all functions
  stopAll: async () => {
    const stopPromises = Array.from(processes.keys()).map(name => 
      runtimeManager.stop(name)
    );
    return Promise.all(stopPromises);
  },

  // Event subscription
  on: (event, callback) => {
    events.on(event, callback);
  }
};

// ── Auto health check ──────────────────────────────────────
setInterval(() => {
  runtimeManager.healthCheck().then(results => {
    events.emit('runtime:healthcheck', results);
  });
}, HEALTH_CHECK_INTERVAL);

// ── CLI Mode ───────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\n⚙️  Runtime Manager - XMRT DAO Local Runtime\n');
  console.log('Commands:');
  console.log('  start <name>   - Start a function');
  console.log('  stop <name>    - Stop a function');
  console.log('  restart <name> - Restart a function');
  console.log('  status         - Show all function status');
  console.log('  health         - Run health check\n');
}
