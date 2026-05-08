/* ======================================
   ASTRALYXPVP JAVASCRIPT
   ====================================== */

// ======== HOME PAGE - IP COPY FUNCTION ========
function copyIP(){
  const ip = document.getElementById('server-ip').innerText;
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(ip).then(() => alert('Server IP copied: ' + ip)).catch(() => alert('Server IP: ' + ip));
  } else {
    alert('Server IP: ' + ip);
  }
}

// ======== LEADERBOARD PAGE - UTILITY FUNCTIONS ========
function escapeHtml(s){
  return (s ?? '').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function loadGamemodes(){
  const select = document.getElementById('gm');
  if(!select) return;
  select.innerHTML = '';
  try{
    const res = await fetch('https://astralyxpvp.chessmrbeaston.workers.dev/api?gamemodes=true');
    const data = await res.json();
    const gms = (data && data.gamemodes) ? data.gamemodes : [];
    if(!gms.length){
      select.innerHTML = '<select id="gm"><option value="macepvpffa1">macepvpffa1</option><option value="netheritepotffa1">netheritepotffa1</option><option value="swordffa1">swordffa1</option></select>';
      return;
    }
    for(const gm of gms){
      const opt = document.createElement('option');
      opt.value = gm;
      opt.textContent = gm;
      select.appendChild(opt);
    }
    const pref = gms.includes('swordffa') ? 'swordffa' : (gms.includes('swordffa1') ? 'swordffa1' : gms[0]);
    select.value = pref;
    const q = (new URL(location.href).searchParams.get('gamemode') || '').toLowerCase();
    if(q && gms.includes(q)) select.value = q;
  }catch{
    select.innerHTML = '<select id="gm"><option value="macepvpffa1">macepvpffa1</option><option value="netheritepotffa1">netheritepotffa1</option><option value="swordffa1">swordffa1</option></select>';
  }
}

async function refreshLB(){
  const gmSelect = document.getElementById('gm');
  if(!gmSelect) return;
  const gm = gmSelect.value;
  const out = document.getElementById('lb');
  out.innerHTML = '<div style="text-align:center;color:var(--muted);padding:14px 0">Loading leaderboard...</div>';
  try{
    const res = await fetch('https://astralyxpvp.chessmrbeaston.workers.dev/api?gamemode=' + encodeURIComponent(gm) + '&leaderboard=true');
    const data = await res.json();
    if(!Array.isArray(data) || data.length === 0){
      out.innerHTML = '<div style="text-align:center;color:var(--muted);padding:14px 0">No data found for this gamemode.</div>';
      return;
    }

    let html = '<table><thead><tr><th>Rank</th><th>Player</th><th>ELO</th></tr></thead><tbody>';
    data.slice(0, 100).forEach((p, i) => {
      const name = escapeHtml(p.username);
      const elo = escapeHtml(p.elo);
      html += '<tr><td class="rank">#' + (i+1) + '</td><td><img src="https://minotar.net/helm/' + encodeURIComponent(p.username) + '/24.png" style="vertical-align:middle;margin-right:10px;border-radius:3px"> ' + name + '</td><td>' + elo + '</td></tr>';
    });
    html += '</tbody></table>';
    out.innerHTML = html;

    const u = new URL(location.href);
    u.searchParams.set('gamemode', gm);
    history.replaceState({}, '', u.toString());
  }catch{
    out.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:14px 0">Error loading leaderboard. If you do see the table this is a bug!</div>';
  }
}

// Leaderboard initialization
(async () => {
  if(document.getElementById('gm')){
    await loadGamemodes();
    await refreshLB();
    document.getElementById('gm').addEventListener('change', refreshLB);
  }
})();

// ======== NAVIGATION STATUS - ALL PAGES ========
async function updateNavStatus(){
  const el = document.getElementById('nav-status');
  if(!el) return;
  try{
    const r = await fetch('https://astralyxpvp.chessmrbeaston.workers.dev/api?serverStatus=true');
    const s = await r.json();
    if(s.online){
      el.classList.add('online');
      el.classList.remove('offline');
      el.textContent = '🟢 ' + s.current + '/' + s.max + ' Online';
    } else {
      el.classList.add('offline');
      el.classList.remove('online');
      el.textContent = '🔴 Offline';
    }
  } catch {
    el.classList.add('offline');
    el.classList.remove('online');
    el.textContent = '🔴 Offline';
  }
}

updateNavStatus();
setInterval(updateNavStatus, 20000);

// ======== PAGE TRANSITION NAVIGATION - ALL PAGES ========
(function(){
  document.body.classList.add('page-enter');
  document.addEventListener('click', function(e){
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href') || '';
    const target = a.getAttribute('target');

    // Skip if link is external, a mail link, or opens in a new tab
    if(target === '_blank' || href.startsWith('mailto:') || href.startsWith('http')) return;
    
    // Skip if it's just a placeholder link
    if(!href || href === '#') return;

    e.preventDefault();
    document.body.classList.add('page-exit');
    setTimeout(() => { window.location.href = href; }, 180);
  });
})();