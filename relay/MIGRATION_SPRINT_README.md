# XMRT DAO Local Runtime - Migration Sprint

**Date:** May 25, 2026  
**Agent:** Hermes (Android/Termux)  
**Sprint Assignment:** 4 tasks (catalog, runtime, DB, exit)

---

## ✅ Completed Tasks

### 1. Function Catalog (`runtime/catalog.mjs`)

**Purpose:** Registry of available edge functions with metadata, versions, and health status.

**Features:**
- Function registration with metadata
- Version tracking
- Health status monitoring
- Dependency mapping
- Enable/disable functions

**API:**
```javascript
import { catalogAPI } from './runtime/catalog.mjs';

// List all functions
catalogAPI.list(); // [{name, version, status, port, ...}]

// Get single function
catalogAPI.get('gossip-hub');

// Register new function
catalogAPI.register({name: 'my-fn', version: '1.0.0', path: '...', port: 9010});

// Update status
catalogAPI.updateStatus('gossip-hub', 'active', {status: 'healthy'});

// Get stats
catalogAPI.getStats(); // {total, active, pending, disabled, unhealthy}
```

**Default Functions:**
| Name | Port | Status | Description |
|------|------|--------|-------------|
| gossip-hub | 9001 | ✅ Active | Fleet messaging |
| mesh-peer-connector | 9002 | ⏳ Pending | P2P mesh registry |
| xmrt-university | 9003 | ⏳ Pending | Certification system |
| eliza-relay | 9004 | ⏳ Pending | AI agent relay |
| system-status | 9005 | ⏳ Pending | Health monitoring |

---

### 2. Runtime Manager (`runtime/manager.mjs`)

**Purpose:** Manages lifecycle of edge functions: start, stop, restart, monitor.

**Features:**
- Process management (spawn, kill, restart)
- Health monitoring (30s intervals)
- Auto-restart on failure (max 3 attempts)
- Resource limits
- Graceful shutdown

**API:**
```javascript
import { runtimeManager } from './runtime/manager.mjs';

// Start a function
await runtimeManager.start('gossip-hub'); // {success, pid, port}

// Stop a function
await runtimeManager.stop('gossip-hub'); // {success}

// Restart
await runtimeManager.restart('gossip-hub');

// Get status
runtimeManager.status(); // {name: {running, pid, started_at, ...}}

// Health check
await runtimeManager.healthCheck(); // {name: {status, pid, uptime}}

// Start/Stop all
await runtimeManager.startAll();
await runtimeManager.stopAll();
```

**Events:**
```javascript
runtimeManager.on('function:start', ({name, pid}) => {...});
runtimeManager.on('function:stop', ({name}) => {...});
runtimeManager.on('function:exit', ({name, code, signal}) => {...});
runtimeManager.on('function:error', ({name, error}) => {...});
```

---

### 3. Database Layer (`db/index.mjs`)

**Purpose:** SQLite-backed (or JSON file) storage for edge functions.

**Features:**
- Message persistence (10K max)
- Peer registry
- Certificate cache
- Audit logs (5K max)
- Config storage
- Auto-save (5 min intervals)
- Backup/restore

**API:**
```javascript
import { db } from './db/index.mjs';

// Messages
db.messages.insert({topic, agent_id, message, payload});
db.messages.query('fleet-broadcast', 50, 0);
db.messages.count('agent-tasks');
db.messages.deleteOld(7); // Delete messages older than 7 days

// Peers
db.peers.upsert({agent_id, agent_name, peer_id, tier, permissions});
db.peers.get('hermes-android-termux');
db.peers.list('online');
db.peers.markOffline('alice-sidecar');

// Certificates
db.certificates.cache({certificate_id, agent_id, tier, permissions, expires_at});
db.certificates.get('XMRT-CERT-RMJTYENN');
db.certificates.validate('XMRT-CERT-RMJTYENN'); // {valid, certificate, expires_in}

// Logs
db.logs.append({level: 'info', function: 'gossip-hub', message: 'Started'});
db.logs.query({level: 'error', limit: 100});

// Config
db.config.set('runtime.port', 9001);
db.config.get('runtime.port', 9000);

// Persistence
db.save('./data/xmrt-local.db');
db.load('./data/xmrt-local.db');

// Stats
db.getStats(); // {messages, peers, certificates, logs, config_keys}
```

---

### 4. Exit Plan (`runtime/exit.mjs`)

**Purpose:** Graceful shutdown, state preservation, and recovery procedures.

**Features:**
- Graceful shutdown handlers (SIGTERM, SIGINT)
- State snapshot before exit
- Crash recovery on restart
- Emergency shutdown procedures
- Health degradation protocols
- Crash logging and analysis

**API:**
```javascript
import { exitPlan, checkRecovery } from './runtime/exit.mjs';

// Register cleanup handler
const unregister = exitPlan.onCleanup(async () => {
  await db.save();
  await runtimeManager.stopAll();
});

// Save/Load state
await exitPlan.saveState({uptime, functions, messages_count});
const state = exitPlan.loadState();

// Crash logging
exitPlan.logCrash(error, {type: 'uncaughtException', context});
const crashes = exitPlan.getCrashHistory(10);

// Graceful shutdown
await exitPlan.shutdown('manual', 30000); // 30s timeout

// Emergency shutdown
exitPlan.emergencyShutdown('Critical error');

// Health degradation
exitPlan.degradeHealth('degraded', 'High memory usage');

// Recovery check on startup
const recovery = checkRecovery();
// {has_previous_state, previous_state, last_crash, crash_count}
```

**Events:**
```javascript
exitPlan.on('shutdown:start', ({reason, timeout}) => {...});
exitPlan.on('shutdown:complete', ({reason, results, duration}) => {...});
exitPlan.on('crash:logged', (crash) => {...});
exitPlan.on('health:degrade', ({level, reason}) => {...});
```

---

## 🚀 Quick Start

```bash
# Start gossip-hub (already running)
cd /data/data/com.termux/files/home/mobilemonero/relay/functions
node gossip-hub.mjs --port=9001

# Test health
curl http://localhost:9001/health

# Publish message
curl -X POST http://localhost:9001/publish \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{"topic":"fleet-broadcast","from":"hermes","message":"Hello fleet!"}'

# Get messages
curl -X POST http://localhost:9001/subscribe \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{"topic":"fleet-broadcast","limit":10}'
```

---

## 📊 Migration Status

| Component | Status | File | Lines |
|-----------|--------|------|-------|
| gossip-hub (local) | ✅ **RUNNING** | `functions/gossip-hub.mjs` | 267 |
| catalog | ✅ Complete | `runtime/catalog.mjs` | 188 |
| runtime manager | ✅ Complete | `runtime/manager.mjs` | 234 |
| database layer | ✅ Complete | `db/index.mjs` | 274 |
| exit plan | ✅ Complete | `runtime/exit.mjs` | 284 |
| mesh-peer-connector | ⏳ Pending | - | - |
| xmrt-university | ⏳ Pending | - | - |
| eliza-relay | ⏳ Pending | - | - |
| system-status | ⏳ Pending | - | - |

**Total Lines Written:** 1,247

---

## 🎯 Next Steps

1. **Test all 4 components together** - Integration testing
2. **Port remaining edge functions** - mesh-peer-connector, xmrt-university, eliza-relay, system-status
3. **Create startup script** - `start-all.mjs` to launch all functions
4. **Add WebSocket support** - Real-time subscriptions
5. **Deploy to other agents** - Share with Alice, Kimi, Vex

---

## 📝 Architecture

```
relay/
├── functions/
│   └── gossip-hub.mjs      # ✅ Running on port 9001
│   ├── mesh-peer-connector.mjs  # ⏳ TODO
│   ├── xmrt-university.mjs      # ⏳ TODO
│   ├── eliza-relay.mjs          # ⏳ TODO
│   └── system-status.mjs        # ⏳ TODO
├── runtime/
│   ├── catalog.mjs         # ✅ Function registry
│   ├── manager.mjs         # ✅ Process lifecycle
│   └── exit.mjs            # ✅ Graceful shutdown
├── db/
│   └── index.mjs           # ✅ Data persistence
└── README.md               # This file
```

---

**Reported to Fleet Chat:** ✅  
**Gossip Hub Tested:** ✅ (Published message successfully)  
**Ready for Integration:** ✅
