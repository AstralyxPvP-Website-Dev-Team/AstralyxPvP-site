(async function() {
    // --- CONFIGURATION ---
    const API_BASE = "https://astralyxpvpweb.pages.dev/api/";
    const IP = "none-subscribe.gl.joinmc.link";

    // --- HELPER FUNCTIONS ---
    function copyIP() {
        navigator.clipboard.writeText(IP).then(() => {
            alert('Copied Server IP to the ClipBoard: ' + IP);
        }).catch(err => console.error('Failed to copy: ', err));
    }

    function escapeHtml(s) {
        return (s ?? '').toString().replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // --- NAVBAR & STATUS LOGIC ---
    async function loadNavbar() {
        const container = document.getElementById('navbar-placeholder');
        if (!container) return;
      
        try {
            const response = await fetch('https://astralyxpvp.pages.dev/Assets/navbar.html');
            if (!response.ok) throw new Error('Navbar file not found');
            
            const html = await response.text();
            container.innerHTML = html;

            // 1. Re-run status update now that the element exists
            updateNavStatus();

            // 2. Set Active Link highlight
            const currentPath = window.location.pathname.split("/").pop() || "index.html";
            container.querySelectorAll('.nav-links a').forEach(link => {
                if(link.getAttribute('href') === currentPath) {
                    link.classList.add('active');
                }
            });

            // 3. Handle scripts inside the navbar
            const scripts = container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        } catch (error) {
            console.error('Error loading navbar:', error);
        }
    }

    async function updateNavStatus() {
        const el = document.getElementById('nav-status');
        if (!el) return; // Prevents "classList of null" error

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(`${API_BASE}?serverStatus=true`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();

            if (data.online) {
                el.className = 'server-pill online';
                el.textContent = `🟢 ${data.current}/${data.max} Online`;
            } else {
                el.className = 'server-pill offline';
                el.textContent = '🔴 Offline';
            }
        } catch (error) {
            el.className = 'server-pill offline';
            el.textContent = '🔴 Offline';
        }
    }

    // --- LEADERBOARD LOGIC ---
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
                select.value = (queryGm && gms.includes(queryGm)) ? queryGm : (gms.includes('swordffa1') ? 'swordffa1' : gms[0]);
            }
        } catch (err) { console.error("API Error:", err); }
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
                out.innerHTML = '<div style="text-align:center;color:var(--muted);padding:14px 0">No data found.</div>';
                return;
            }

            let html = '<table><thead><tr><th>Rank</th><th>Player</th><th>ELO</th></tr></thead><tbody>';
            data.slice(0, 100).forEach((p, i) => {
                html += `<tr>
                    <td class="rank">#${i + 1}</td>
                    <td>
                      <img src="https://minotar.net/helm/${encodeURIComponent(p.username)}/24.png" style="vertical-align:middle;margin-right:10px;border-radius:3px" loading="lazy">
                      ${escapeHtml(p.username)}
                    </td>
                    <td>${escapeHtml(p.elo)}</td>
                  </tr>`;
            });
            out.innerHTML = html + '</tbody></table>';

            const u = new URL(location.href);
            u.searchParams.set('gamemode', gm);
            history.replaceState({}, '', u.toString());
        } catch (err) {
            out.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:14px 0">Error loading data.</div>';
        }
    }

    // --- UI & TRANSITIONS ---
    function initTransitions() {
        if (document.body) document.body.classList.add('page-enter');
        
        document.addEventListener('click', function(e){
            const a = e.target.closest('a');
            if(!a) return;
            const href = a.getAttribute('href') || '';
            if(a.getAttribute('target') === '_blank' || href.startsWith('http') || !href || href === '#') return;

            e.preventDefault();
            document.body.classList.add('page-exit');
            setTimeout(() => { window.location.href = href; }, 180);
        });
    }

    // --- CONTEXT MENU ---
    const contextMenu = document.getElementById("contextMenu");
    function positionContextMenu(event) {
        if (!contextMenu) return;
        event.preventDefault();
        contextMenu.style.display = "block";
        const x = (event.clientX + 230 > window.innerWidth) ? event.clientX - 230 : event.clientX;
        const y = (event.clientY + 230 > window.innerHeight) ? event.clientY - 230 : event.clientY;
        contextMenu.style.left = `${Math.max(0, x)}px`;
        contextMenu.style.top = `${Math.max(0, y)}px`;
        requestAnimationFrame(() => contextMenu.classList.add("show"));
    }

    function hideContextMenu() {
        if (!contextMenu || !contextMenu.classList.contains("show")) return;
        contextMenu.classList.remove("show");
        contextMenu.classList.add("hide");
        contextMenu.addEventListener("animationend", () => {
            contextMenu.classList.remove("hide");
            contextMenu.style.display = "none";
        }, { once: true });
    }

    // --- INITIALIZATION ---
    initTransitions();
    await loadNavbar(); // Crucial: Wait for nav before running other things

    const gmSelect = document.getElementById('gm');
    if (gmSelect) {
        await loadGamemodes();
        await refreshLB();
        gmSelect.addEventListener('change', refreshLB);
    }

    document.addEventListener("contextmenu", positionContextMenu);
    document.addEventListener("mousedown", (e) => { if (contextMenu && !contextMenu.contains(e.target)) hideContextMenu(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideContextMenu(); });
    
    document.querySelectorAll("[data-menu-copy]").forEach(btn => {
        btn.addEventListener("click", () => { copyIP(); hideContextMenu(); });
    });

    setInterval(updateNavStatus, 20000);
})();