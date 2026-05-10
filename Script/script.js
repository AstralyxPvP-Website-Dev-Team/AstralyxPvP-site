/* ======================================
   ASTRALYXPVP JAVASCRIPT
   ====================================== */

// for Dreamlong by Indiancoder3: bro ik u used ai

const API_BASE = "https://astralyxpvpweb.pages.dev/api/";
const IP = "none-subscribe.gl.joinmc.link"

// ======== IMPROVED DEPENDENCY LOADING ========
(function() {
    if (typeof Toastify === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/toastify-js";
        script.id = "toastify-script"; // Added ID to track it
        script.async = true;
        document.head.appendChild(script);
    }
})();

// ======== HOME PAGE - IP COPY FUNCTION ========
function copyIP() {
    navigator.clipboard.writeText(IP).then(() => {
        // Function to actually trigger the toast
        const showToast = () => {
            Toastify({
                text: "🔥 Server IP copied: " + IP,
                duration: 3000,
                gravity: "bottom", 
                position: "center",
                stopOnFocus: true, 
                style: {
                    background: "linear-gradient(to right, #ff5f6d, #ffc371)", 
                    borderRadius: "8px",
                    fontWeight: "bold",
                    boxShadow: "0 4px 15px rgba(255, 95, 109, 0.3)"
                }
            }).showToast();
        };

        if (typeof Toastify !== 'undefined') {
            showToast();
        } else {
            // If Toastify isn't ready, wait for the script to load
            const script = document.getElementById('toastify-script');
            if (script) {
                script.addEventListener('load', showToast);
                // Fallback: If it takes too long (e.g. 2 seconds), just use alert
                setTimeout(() => {
                   if (typeof Toastify === 'undefined') alert('🔥 Server IP copied: ' + IP);
                }, 2000);
            } else {
                alert('🔥 Server IP copied: ' + IP);
            }
        }
    }).catch((err) => {
        console.error("Copy failed", err);
        alert('Server IP: ' + IP);
    });
}
// ======== LEADERBOARD PAGE - UTILITY FUNCTIONS ========
function escapeHtml(s) {
  return (s ?? '').toString().replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function loadGamemodes() {
  const select = document.getElementById('gm');
  if (!select) return;

  try {
    // Fixed URL: changed 'gamemodes' to 'gamemode' per your API spec
    const res = await fetch(`${API_BASE}?gamemode=true`);
    const data = await res.json();
    
    // Extract gamemodes array
    const gms = (data && Array.isArray(data.gamemodes)) ? data.gamemodes : [];

    if (gms.length > 0) {
      select.innerHTML = ''; // Clear fallback options if API succeeds
      
      gms.forEach(gm => {
        const opt = document.createElement('option');
        opt.value = gm;
        opt.textContent = gm;
        select.appendChild(opt);
      });

      // Logic to pick the default active gamemode
      const urlParams = new URLSearchParams(window.location.search);
      const queryGm = urlParams.get('gamemode')?.toLowerCase();

      if (queryGm && gms.includes(queryGm)) {
        select.value = queryGm;
      } else {
        // Preference: swordffa1 > swordffa > first item in list
        const defaultChoice = gms.includes('swordffa1') ? 'swordffa1' : 
                             (gms.includes('swordffa') ? 'swordffa' : gms[0]);
        select.value = defaultChoice;
      }
    }
  } catch (err) {
    console.error("Failed to load gamemodes from API, using fallback UI.", err);
    // Keep existing fallback options if the API fails
  }
}

async function refreshLB() {
  const gmSelect = document.getElementById('gm');
  const out = document.getElementById('lb');
  if (!gmSelect || !out) return;

  const gm = gmSelect.value;
  out.innerHTML = '<div style="text-align:center;color:var(--muted);padding:14px 0">Loading leaderboard...</div>';

  try {
    const res = await fetch(`${API_BASE}?gamemode=${encodeURIComponent(gm)}&leaderboard=true`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      out.innerHTML = '<div style="text-align:center;color:var(--muted);padding:14px 0">No data found for this gamemode.</div>';
      return;
    }

    let html = '<table><thead><tr><th>Rank</th><th>Player</th><th>ELO</th></tr></thead><tbody>';
    data.slice(0, 100).forEach((p, i) => {
      const name = escapeHtml(p.username);
      const elo = escapeHtml(p.elo);
      html += `<tr>
        <td class="rank">#${i + 1}</td>
        <td>
          <img src="https://minotar.net/helm/${encodeURIComponent(p.username)}/24.png" style="vertical-align:middle;margin-right:10px;border-radius:3px">
          ${name}
        </td>
        <td>${elo}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    out.innerHTML = html;

    // Update URL without refreshing page
    const u = new URL(location.href);
    u.searchParams.set('gamemode', gm);
    history.replaceState({}, '', u.toString());

  } catch (err) {
    out.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:14px 0">Error loading leaderboard data.</div>';
  }
}

// Initialization
(async () => {
  const gmSelect = document.getElementById('gm');
  if (gmSelect) {
    await loadGamemodes();
    await refreshLB();
    gmSelect.addEventListener('change', refreshLB);
  }
})();

// ======== NAVIGATION STATUS - ALL PAGES ========
async function updateNavStatus(){
  const el = document.getElementById('nav-status');
  if(!el) return;
  try{
    const r = await fetch('${API_BASE}?serverStatus=true');
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


function positionContextMenu(event) {
    event.preventDefault();
    const menuWidth = 230;
    const menuHeight = 230;
    const left = Math.min(event.clientX, window.innerWidth - menuWidth - 12);
    const top = Math.min(event.clientY, window.innerHeight - menuHeight - 12);

    contextMenu.style.left = left + "px";
    contextMenu.style.top = top + "px";
    contextMenu.classList.add("show");
    contextMenu.setAttribute("aria-hidden", "false");
}
const contextMenu = document.getElementById("contextMenu");

// Standard Copy function
function hideContextMenu() {
    contextMenu.classList.remove("show");
    contextMenu.setAttribute("aria-hidden", "true");
}
const menu = document.getElementById('contextMenu');

// Event Listeners
document.addEventListener("contextmenu", positionContextMenu);
document.addEventListener("click", e => {
    if (!contextMenu.contains(e.target)) hideContextMenu();
});

window.addEventListener("hashchange", () => openRoute(location.hash));
document.addEventListener("contextmenu", positionContextMenu);
document.addEventListener("click", event => {
    if (!contextMenu.contains(event.target)) hideContextMenu();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        hideContextMenu();
        closeMobileMenu();
    }
});

// Copy Button Listener
document.querySelectorAll("[data-menu-copy]").forEach(btn => {
    btn.addEventListener("click", copyIP); // FUCK YA NO WONDAR
});

// Note for Dreamlong by IndianCoder3: f*** you bro, jking chill bruh whats my fault LOL!?
