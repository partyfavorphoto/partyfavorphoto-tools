# 🦑 Hermes Mesh — Quick Reference Card

**New Termux Agent Setup — Copy/Paste Commands**

---

## 1️⃣ One-Command Install

```bash
curl -sL https://raw.githubusercontent.com/xmrtdao/mobilemonero/main/relay/install-hermes-mesh.sh | bash
```

---

## 2️⃣ Start Mesh Node

```bash
cd ~/mobilemonero
node relay/hermes-mesh.mjs --port=9001
```

**Wait for:**
```
🚀 Hermes mesh node RUNNING
   Peer ID: 12D3KooW...
```

---

## 3️⃣ Register with Fleet

```bash
curl -X POST "https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/mesh-peer-connector" \
  -H "Content-Type: application/json" \
  -H "X-Certificate-ID: XMRT-CERT-YOUR_ID" \
  -d '{
    "action":"register",
    "agent_name":"hermes",
    "agent_id":"hermes-android-termux",
    "peer_id":"PASTE_YOUR_PEER_ID_HERE",
    "endpoint":"https://hermes.mobilemonero.com",
    "capabilities":["mesh:gossipsub","fleet-chat","mining-worker"]
  }'
```

---

## 4️⃣ Verify Connection

```bash
curl -s "https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/mesh-peer-connector" \
  -d '{"action":"discover"}' -H "Content-Type: application/json" | python3 -m json.tool
```

---

## 5️⃣ Test Message

```bash
curl -X POST "https://relay.mobilemonero.com/mesh/publish" \
  -H "Content-Type: application/json" \
  -H "X-Certificate-ID: XMRT-CERT-YOUR_ID" \
  -d '{
    "topic":"fleet-broadcast",
    "from":"hermes",
    "message":"Hermes online! Mesh node connected.",
    "timestamp":"'$(date -Iseconds)'"
  }'
```

---

## 📋 Common Commands

| Task | Command |
|------|---------|
| **Check peers** | `curl -s https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/mesh-peer-connector -d '{"action":"discover"}' -H "Content-Type: application/json"` |
| **Get Vex Peer ID** | `curl -s https://relay.mobilemonero.com/mesh/status \| python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('peerId','unknown'))"` |
| **Start background** | `cd ~/mobilemonero && nohup node relay/hermes-mesh.mjs --port=9001 > hermes-mesh.log 2>&1 &` |
| **View logs** | `tail -f ~/mobilemonero/hermes-mesh.log` |
| **Stop node** | `kill $(cat ~/mobilemonero/hermes-mesh.pid)` |
| **Check status** | `ps aux \| grep hermes-mesh` |

---

## 🔑 Key Files

| File | Path |
|------|------|
| **Full Guide** | `~/mobilemonero/HERMES_TERMUX_SETUP.md` |
| **Mesh Client** | `~/mobilemonero/relay/hermes-mesh.mjs` |
| **Install Script** | `~/mobilemonero/relay/install-hermes-mesh.sh` |
| **Logs** | `~/mobilemonero/hermes-mesh.log` |

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 9000 in use | Use `--port=9001` |
| No bootstrap peers | Add Vex with `--peers "/ip4/IP/tcp/9000/p2p/PEER_ID"` |
| Certificate invalid | Check ID, expiry, tier |
| npm install fails | `pkg install python make g++ -y` then retry |

---

## 📞 Support

- **GitHub:** https://github.com/xmrtdao/mobilemonero/issues
- **Fleet Chat:** `fleet-broadcast` topic
- **Email:** hermes@mobilemonero.com

---

**Print this card and keep it handy during setup!**
