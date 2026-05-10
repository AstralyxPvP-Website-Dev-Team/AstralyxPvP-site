(async function() {
    const API_BASE = "https://astralyxpvpweb.pages.dev/api/";
    const IP = "none-subscribe.gl.joinmc.link";

    // --- HELPER FUNCTIONS ---
    const escapeHtml = (s) => (s ?? '').toString().replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    // --- NAVBAR & STATUS ---
    async function initNavbar() {
        const container = document.getElementById('navbar-placeholder');
        if (!container) return;
      
        try {
            const response = await fetch('https://astralyxpvp.pages.dev/Assets/navbar.html');
            if (!response.ok) throw new Error('Navbar missing');
            
            const html = await response.text();
            container.innerHTML = html;

            // Highlight Active Link
            const currentPath = window.location.pathname.split("/").pop() || "index.html";
            container.querySelectorAll('.nav-links a').forEach(link => {
                if(link.getAttribute('href') === currentPath) link.classList.add('active');
            });

            // Adjust layout height
            const nav = container.querySelector('nav');
            const mainContent = document.querySelector('.page-content');
            if (nav && mainContent) {
                requestAnimationFrame(() => {
                    mainContent.style.marginTop = nav.offsetHeight + "px";
                });
            }

            // Initial status update
            updateNavStatus();
        } catch (error) {
            console.error('Navbar error:', error);
        }
    }

    async function updateNavStatus() {
        const el = document.getElementById('nav-status');
        if (!el) return;

        try {
            const response = await fetch(`${API_BASE}?serverStatus=true`);
            const data = await response.json();

            if (data.online) {
                el.className = 'server-pill online';
                el.textContent = `🟢 ${data.current}/${data.max} Online`;
            } else {
                el.className = 'server-pill offline'; el.textContent = '🔴 Offline';
            }
        } catch (error) {
            el.className = 'server-pill offline'; el.textContent = '🔴 Offline';
        }
    }

    // --- LEADERBOARD ---
    async function initLeaderboard() {
        const select = document.getElementById('gm');
        if (!select) return;

        // 1. Load Gamemodes
        try {
            const res = await fetch(`${API_BASE}?gamemode=true`);
            const data = await res.json();
            const gms = data?.gamemodes || [];

            if (gms.length > 0) {
                select.innerHTML = gms.map(gm => `<option value="${gm}">${gm}</option>`).join('');
                
                // Check URL params for gamemode
                const urlGm = new URLSearchParams(window.location.search).get('gamemode');
                if (urlGm && gms.includes(urlGm)) select.value = urlGm;
            }
        } catch (err) { console.error("GM Load Error:", err); }

        // 2. Attach Event Listener
        select.addEventListener('change', refreshLB);
        
        // 3. Initial Load
        refreshLB();
    }

    async function refreshLB() {
        const gmSelect = document.getElementById('gm');
        const out = document.getElementById('lb');
        if (!gmSelect || !out) return;

        out.innerHTML = '<div style="text-align:center;color:var(--muted);padding:14px 0">Loading...</div>';

        try {
            const res = await fetch(`${API_BASE}?gamemode=${encodeURIComponent(gmSelect.value)}&leaderboard=true`);
            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                out.innerHTML = '<div style="text-align:center;padding:14px 0">No data found.</div>';
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

            // Sync URL
            const u = new URL(location.href);
            u.searchParams.set('gamemode', gmSelect.value);
            history.replaceState({}, '', u.toString());
        } catch (err) {
            out.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:14px 0">Error loading leaderboard.</div>';
        }
    }

    // --- INITIALIZE EVERYTHING ---
    document.body.classList.add('page-enter');
    
    await initNavbar();      // Load nav first
    await initLeaderboard(); // Then load leaderboard logic

    setInterval(updateNavStatus, 20000);

    // Global click listener for transitions
    document.addEventListener('click', e => {
        const a = e.target.closest('a');
        if(!a || a.target === '_blank' || a.href.startsWith('http') || a.hash) return;
        e.preventDefault();
        document.body.classList.add('page-exit');
        setTimeout(() => { window.location.href = a.href; }, 180);
    });
})();