import fs from 'fs';

let html = fs.readFileSync('C:/Users/PureTrek/Desktop/DevGruGold/partyfavorphoto/site/index.html', 'utf8');

const chatWidget = `
  <!-- Chat Widget -->
  <div id="chat-bubble" style="position:fixed;bottom:120px;right:20px;width:56px;height:56px;background:#2563eb;color:#fff;border:none;border-radius:50%;cursor:pointer;font-size:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,99,235,0.4);z-index:999999999;transition:all 0.2s;">💬</div>
  <div id="chat-panel" style="display:none;position:fixed;bottom:190px;right:20px;width:340px;max-width:calc(100vw-40px);background:#1a1a2a;border:1px solid #2a2a3a;border-radius:12px;z-index:999999998;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.5);font-family:Inter,sans-serif;">
    <div style="background:#2563eb;color:#fff;padding:14px 16px;font-size:14px;font-weight:600;">Ask Our Team</div>
    <div style="padding:12px;">
      <div style="color:#8b8ba0;font-size:12px;margin-bottom:10px;">Tell us about your event</div>
      <input id="chat-input" type="text" placeholder="Your question..." style="width:100%;padding:10px 12px;border-radius:6px;border:1px solid #2a2a3a;background:#0d0d15;color:#e0e0f0;font-size:13px;outline:none;box-sizing:border-box;">
      <button id="chat-send" style="margin-top:6px;width:100%;padding:10px;border:none;border-radius:6px;background:#2563eb;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Send</button>
      <div id="chat-response" style="margin-top:8px;font-size:12px;display:none;"></div>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid #2a2a3a;font-size:11px;color:#6b6b80;text-align:center;">Or call <strong style="color:#e0e0f0;">(202) 798-0610</strong></div>
    </div>
  </div>
  <script>
    document.getElementById('chat-bubble').onclick = function() {
      var p = document.getElementById('chat-panel');
      p.style.display = (p.style.display === 'none') ? 'block' : 'none';
    };
    document.getElementById('chat-send').onclick = function() {
      var inp = document.getElementById('chat-input');
      var msg = inp.value.trim();
      if (!msg) return;
      var resp = document.getElementById('chat-response');
      resp.style.display = 'block'; resp.textContent = 'Sending...';
      fetch('https://relay.mobilemonero.com/api/fleet-chat/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agent:'vex',message:'WEBSITE: '+msg,channel:'all'})}).then(function(r){if(r.ok){resp.textContent='Sent! We will respond.';inp.value='';}else{resp.textContent='Call (202) 798-0610';}}).catch(function(){resp.textContent='Call (202) 798-0610';});
    };
    document.getElementById('chat-input').onkeydown = function(e) { if (e.key === 'Enter') document.getElementById('chat-send').click(); };
  </script>`;

// Find the last </script> and </body> tags
const lastScript = html.lastIndexOf('</script>');
const bodyClose = html.lastIndexOf('</body>');

if (lastScript > 0 && bodyClose > lastScript) {
  // Keep everything up to and including the last </script>
  const before = html.substring(0, lastScript + 9);
  // Keep the </body> and after
  const after = html.substring(bodyClose);
  // Replace everything between with our chat widget
  html = before + chatWidget + after;
  fs.writeFileSync('C:/Users/PureTrek/Desktop/DevGruGold/partyfavorphoto/site/index.html', html);
  console.log('Chat widget injected successfully');
} else {
  console.log('Could not find boundaries:', {lastScript, bodyClose});
}
