const API_BASE = "https://astralyxpvpweb.pages.dev/api/";
const IP = "none-subscribe.gl.joinmc.link";

function copyIP() {
    navigator.clipboard.writeText(IP).then(() => {
        alert('Copied Server IP to the ClipBoard: ' + IP);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function escapeHtml(s) {
    return (s ?? '').toString().replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

async function loadGamemodes() {
    const select = document.getElementById('gm');
    if (!select) return;

    try {
        const res = await fetch(`${API_BASE}?gamemode=true`);
        const data = await res.json();
        const gms = (data && Array.isArray(data.gamemodes)) ? data.gamemodes : [];

        if (gms.length > 0) {
            select.innerHTML = ''; 
            gms.forEach(gm => {
                const opt = document.createElement('option');
                opt.value = gm;
                opt.textContent = gm;
                select.appendChild(opt);
            });

            const urlParams = new URLSearchParams(window.location.search);
            const queryGm = urlParams.get('gamemode')?.toLowerCase();

            if (queryGm && gms.includes(queryGm)) {
                select.value = queryGm;
            } else {
                const defaultChoice = gms.includes('swordffa1') ? 'swordffa1' : 
                                     (gms.includes('swordffa') ? 'swordffa' : gms[0]);
                select.value = defaultChoice;
            }
        }
    } catch (err) {
        console.error("API Error:", err);
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

        const u = new URL(location.href);
        u.searchParams.set('gamemode', gm);
        history.replaceState({}, '', u.toString());

    } catch (err) {
        out.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:14px 0">Error loading leaderboard data.</div>';
    }
}

(async () => {
    const gmSelect = document.getElementById('gm');
    if (gmSelect) {
        await loadGamemodes();
        await refreshLB();
        gmSelect.addEventListener('change', refreshLB);
    }
})();

async function updateNavStatus(){
    const el = document.getElementById('nav-status');
    if(!el) return;
    try {
        const r = await fetch(`${API_BASE}?serverStatus=true`);
        const s = await r.json();
        if(s.online){
            el.classList.add('online');
            el.classList.remove('offline');
            el.textContent = `🟢 ${s.current}/${s.max} Online`;
        } else {
            el.classList.add('offline');
            el.classList.remove('online');
            el.textContent = '🔴 Offline';
        }
    } catch {
        el.classList.add('offline');
        el.textContent = '🔴 Offline';
    }
}

updateNavStatus();
setInterval(updateNavStatus, 20000);

(function(){
    document.body.classList.add('page-enter');
    document.addEventListener('click', function(e){
        const a = e.target.closest('a');
        if(!a) return;
        const href = a.getAttribute('href') || '';
        const target = a.getAttribute('target');

        if(target === '_blank' || href.startsWith('mailto:') || href.startsWith('http') || !href || href === '#') return;

        e.preventDefault();
        document.body.classList.add('page-exit');
        setTimeout(() => { window.location.href = href; }, 180);
    });
})();

const contextMenu = document.getElementById("contextMenu");

function positionContextMenu(event) {
    if (!contextMenu) return;
    event.preventDefault();

    contextMenu.classList.remove("hide", "show");
    contextMenu.style.display = "block";
    contextMenu.setAttribute("aria-hidden", "false");

    const menuWidth = contextMenu.offsetWidth || 230;
    const menuHeight = contextMenu.offsetHeight || 230;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x = event.clientX;
    let y = event.clientY;

    if (x + menuWidth > windowWidth) x -= menuWidth;
    if (y + menuHeight > windowHeight) y -= menuHeight;

    contextMenu.style.left = `${Math.max(0, x)}px`;
    contextMenu.style.top = `${Math.max(0, y)}px`;

    requestAnimationFrame(() => {
        contextMenu.classList.add("show");
    });
}

function hideContextMenu() {
    // Only proceed if the menu is actually showing
    if (!contextMenu || !contextMenu.classList.contains("show")) return;

    contextMenu.classList.remove("show");
    contextMenu.classList.add("hide");

    const handleAnimationEnd = () => {
        contextMenu.classList.remove("hide");
        contextMenu.style.display = "none";
        contextMenu.setAttribute("aria-hidden", "true");
        contextMenu.removeEventListener("animationend", handleAnimationEnd);
    };

    contextMenu.addEventListener("animationend", handleAnimationEnd);
}

document.addEventListener("contextmenu", positionContextMenu);

document.addEventListener("mousedown", (e) => {
    if (contextMenu && contextMenu.classList.contains("show")) {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        hideContextMenu();
        if (typeof closeMobileMenu === 'function') closeMobileMenu();
    }
});
document.querySelectorAll("[data-menu-copy]").forEach(btn => {
    btn.addEventListener("click", () => {
        if (typeof copyIP === 'function') {
            copyIP();
        }
        hideContextMenu();
    });
});