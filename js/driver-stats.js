/**
 * Driver Stats & Telemetry Hub Engine
 * GRiD UP Sim Racing
 * Powered by Garage61 Telemetry Data
 */

let STATS_DATA = null;
let CURRENT_SEARCH = '';
let CURRENT_FILTER = 'all';
let CURRENT_SORT = 'laps-desc';
let CURRENT_VIEW = 'grid'; // 'grid' or 'table'

document.addEventListener('DOMContentLoaded', () => {
    initDriverStats();
});

async function initDriverStats() {
    setupEventListeners();
    await loadStatsData();
    handleUrlHash();
}

/**
 * Fetch pre-aggregated telemetry data from JSON
 */
async function loadStatsData() {
    const grid = document.getElementById('drivers-container');
    if (grid) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);"><p>Loading driver telemetry from Garage 61...</p></div>';
    }

    try {
        const resp = await fetch('/data/garage61-stats.json?v=' + Date.now());
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        STATS_DATA = await resp.json();
        
        renderTeamKPIs(STATS_DATA.team, STATS_DATA.syncedAt);
        renderDrivers();
    } catch (err) {
        console.error("Failed to load telemetry stats:", err);
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <p style="color: #ef4444; font-weight: 700; margin-bottom: 0.5rem;">Could not load driver telemetry.</p>
                    <p style="font-size: 0.85rem;">Make sure data/garage61-stats.json is available.</p>
                </div>
            `;
        }
    }
}

/**
 * Render Header KPIs
 */
function renderTeamKPIs(team, syncedAt) {
    if (!team) return;

    const elLaps = document.getElementById('kpi-total-laps');
    const elHours = document.getElementById('kpi-total-hours');
    const elClean = document.getElementById('kpi-clean-pct');
    const elDrivers = document.getElementById('kpi-total-drivers');
    const elSyncTime = document.getElementById('sync-timestamp');

    if (elLaps) elLaps.textContent = (team.totalLaps || 0).toLocaleString();
    if (elHours) elHours.textContent = Math.round(team.totalHours || 0).toLocaleString() + 'h';
    if (elClean) elClean.textContent = (team.cleanPct || 0).toFixed(1) + '%';
    if (elDrivers) elDrivers.textContent = (team.totalDrivers || 0);

    if (elSyncTime && syncedAt) {
        const d = new Date(syncedAt);
        if (!isNaN(d.getTime())) {
            elSyncTime.textContent = 'Synced: ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }
}

/**
 * Filter & Sort Drivers List
 */
function getProcessedDrivers() {
    if (!STATS_DATA || !Array.isArray(STATS_DATA.drivers)) return [];

    let list = [...STATS_DATA.drivers];

    // Search filter
    if (CURRENT_SEARCH.trim()) {
        const q = CURRENT_SEARCH.toLowerCase().trim();
        list = list.filter(d => 
            d.name.toLowerCase().includes(q) || 
            d.slug.toLowerCase().includes(q) ||
            (d.favoriteCar && d.favoriteCar.toLowerCase().includes(q))
        );
    }

    // Category filter chips
    if (CURRENT_FILTER === 'mileage') {
        list = list.filter(d => d.totalLaps >= 10000);
    } else if (CURRENT_FILTER === 'clean') {
        list = list.filter(d => d.cleanPct >= 85.0 && d.totalLaps >= 1000);
    } else if (CURRENT_FILTER === 'active') {
        list = list.filter(d => d.activeDaysCount >= 300);
    }

    // Sort order
    list.sort((a, b) => {
        if (CURRENT_SORT === 'laps-desc') return b.totalLaps - a.totalLaps;
        if (CURRENT_SORT === 'hours-desc') return b.hours - a.hours;
        if (CURRENT_SORT === 'clean-desc') return b.cleanPct - a.cleanPct;
        if (CURRENT_SORT === 'days-desc') return b.activeDaysCount - a.activeDaysCount;
        if (CURRENT_SORT === 'name-asc') return a.name.localeCompare(b.name);
        return b.totalLaps - a.totalLaps;
    });

    return list;
}

/**
 * Render Drivers Roster
 */
function renderDrivers() {
    const container = document.getElementById('drivers-container');
    if (!container) return;

    const drivers = getProcessedDrivers();

    const countBadge = document.getElementById('filtered-count-badge');
    if (countBadge) {
        countBadge.textContent = `${drivers.length} Driver${drivers.length === 1 ? '' : 's'}`;
    }

    if (drivers.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                <p style="font-size: 1.1rem; color: #ffffff; margin-bottom: 0.5rem;">No drivers found</p>
                <p style="font-size: 0.85rem;">Try adjusting your search or active filter.</p>
            </div>
        `;
        return;
    }

    if (CURRENT_VIEW === 'grid') {
        container.className = 'drivers-grid';
        container.innerHTML = drivers.map(d => createDriverCardHTML(d)).join('');
    } else {
        container.className = 'leaderboard-table-container';
        container.innerHTML = createDriverTableHTML(drivers);
    }
}

/**
 * Create Driver Card HTML
 */
function createDriverCardHTML(d) {
    const topClass = d.rank === 1 ? 'top-1' : (d.rank === 2 ? 'top-2' : (d.rank === 3 ? 'top-3' : ''));
    const cleanWidth = Math.min(100, Math.max(0, d.cleanPct));

    return `
        <article class="driver-telemetry-card" onclick="openDriverDossier('${d.slug}')">
            <div>
                <div class="driver-card-header">
                    <div class="driver-identity">
                        <h3>${escapeHtml(d.name)}</h3>
                        <span class="driver-slug">@${escapeHtml(d.slug)}</span>
                    </div>
                    <span class="driver-rank-badge ${topClass}">#${d.rank}</span>
                </div>

                <div class="driver-metrics-row">
                    <div class="metric-item">
                        <span class="lbl">Total Laps</span>
                        <span class="val cyan">${d.totalLaps.toLocaleString()}</span>
                    </div>
                    <div class="metric-item">
                        <span class="lbl">Track Time</span>
                        <span class="val purple">${Math.round(d.hours).toLocaleString()}h</span>
                    </div>
                </div>

                <div class="clean-bar-container">
                    <div class="clean-bar-labels">
                        <span>Clean Precision</span>
                        <span>${d.cleanPct.toFixed(1)}%</span>
                    </div>
                    <div class="clean-bar-track">
                        <div class="clean-bar-fill" style="width: ${cleanWidth}%;"></div>
                    </div>
                </div>

                <div class="driver-favs">
                    <div class="fav-badge" title="Top Car Driven">
                        <span>🏎️</span>
                        <span>Top Car: <strong>${escapeHtml(d.favoriteCar)}</strong></span>
                    </div>
                    <div class="fav-badge" title="Top Circuit Driven">
                        <span>🏁</span>
                        <span>Top Track: <strong>${escapeHtml(d.favoriteTrack)}</strong></span>
                    </div>
                </div>
            </div>

            <div class="driver-card-footer" onclick="event.stopPropagation()">
                <button class="btn-dossier" onclick="openDriverDossier('${d.slug}')">
                    View Dossier
                </button>
                <a href="${d.profileUrl}" target="_blank" rel="noopener" class="btn-external-g61" title="Open Garage 61 Profile">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
            </div>
        </article>
    `;
}

/**
 * Create Driver Table HTML
 */
function createDriverTableHTML(drivers) {
    return `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th style="width: 60px;">Rank</th>
                    <th>Driver</th>
                    <th>Total Laps</th>
                    <th>Track Time</th>
                    <th>Clean %</th>
                    <th>Top Car</th>
                    <th>Days Active</th>
                    <th style="text-align: right;">Action</th>
                </tr>
            </thead>
            <tbody>
                ${drivers.map(d => {
                    const topClass = d.rank === 1 ? 'top-1' : (d.rank === 2 ? 'top-2' : (d.rank === 3 ? 'top-3' : ''));
                    return `
                        <tr onclick="openDriverDossier('${d.slug}')">
                            <td><span class="driver-rank-badge ${topClass}">#${d.rank}</span></td>
                            <td>
                                <strong style="color: #ffffff; display: block;">${escapeHtml(d.name)}</strong>
                                <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">@${escapeHtml(d.slug)}</span>
                            </td>
                            <td><strong style="color: var(--primary); font-family: 'Orbitron', sans-serif;">${d.totalLaps.toLocaleString()}</strong></td>
                            <td>${d.hours.toLocaleString()} hrs</td>
                            <td><strong style="color: #34d399;">${d.cleanPct.toFixed(1)}%</strong></td>
                            <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(d.favoriteCar)}</td>
                            <td>${d.activeDaysCount} days</td>
                            <td style="text-align: right;" onclick="event.stopPropagation()">
                                <button class="btn-dossier" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="openDriverDossier('${d.slug}')">Report</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Open Driver Dossier Modal
 */
function openDriverDossier(slug) {
    if (!STATS_DATA || !STATS_DATA.drivers) return;
    const d = STATS_DATA.drivers.find(x => x.slug === slug);
    if (!d) return;

    window.location.hash = d.slug;

    const modal = document.getElementById('driver-dossier-modal');
    const content = document.getElementById('dossier-modal-content');
    if (!modal || !content) return;

    const cleanWidth = Math.min(100, Math.max(0, d.cleanPct));

    content.innerHTML = `
        <div class="dossier-header">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                <div>
                    <h2>${escapeHtml(d.name)}</h2>
                    <div class="dossier-meta">
                        <span class="driver-rank-badge" style="font-size: 0.75rem;">Rank #${d.rank} in Team Mileage</span>
                        <span style="font-family: monospace;">@${escapeHtml(d.slug)}</span>
                        <span>• First Recorded: ${d.firstDay || 'N/A'}</span>
                        <span>• Latest Active: ${d.lastDay || 'N/A'}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <a href="${d.profileUrl}" target="_blank" rel="noopener" class="btn-sync" style="background: rgba(0,207,255,0.2); border-color: var(--primary);">
                        <span>View Garage 61 Profile</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                </div>
            </div>
        </div>

        <div class="dossier-stats-overview">
            <div class="dossier-stat-box">
                <div class="title">Total Laps Driven</div>
                <div class="number">${d.totalLaps.toLocaleString()}</div>
            </div>
            <div class="dossier-stat-box">
                <div class="title">Track Time Logged</div>
                <div class="number" style="color: #a78bfa;">${d.hours.toLocaleString()}h</div>
            </div>
            <div class="dossier-stat-box">
                <div class="title">Clean Lap Accuracy</div>
                <div class="number" style="color: #34d399;">${d.cleanPct.toFixed(1)}%</div>
            </div>
            <div class="dossier-stat-box">
                <div class="title">Active Driving Days</div>
                <div class="number" style="color: #f59e0b;">${d.activeDaysCount}</div>
            </div>
        </div>

        <!-- Session Distribution -->
        <h3 class="dossier-section-title">Session Distribution</h3>
        <div class="session-bars-grid">
            ${['Practice', 'Qualifying', 'Race'].map(stype => {
                const sdata = d.sessions && d.sessions[stype] ? d.sessions[stype] : { laps: 0, hours: 0, cleanPct: 0 };
                const pctOfTotal = d.totalLaps > 0 ? (sdata.laps / d.totalLaps * 100).toFixed(1) : 0;
                return `
                    <div class="session-bar-item">
                        <div class="name">${stype}</div>
                        <div style="font-family: 'Orbitron', sans-serif; font-size: 1.2rem; font-weight: 800; color: #ffffff; margin-bottom: 0.25rem;">
                            ${sdata.laps.toLocaleString()} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">laps (${pctOfTotal}%)</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
                            <span>Time: ${sdata.hours}h</span>
                            <span>Clean: ${sdata.cleanPct}%</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <!-- Top Vehicles Driven -->
        <h3 class="dossier-section-title">Top Vehicles Driven</h3>
        <div style="overflow-x: auto; margin-bottom: 1.5rem;">
            <table class="dossier-table">
                <thead>
                    <tr>
                        <th>Vehicle</th>
                        <th>Laps</th>
                        <th>Clean Laps</th>
                        <th>Clean Accuracy</th>
                        <th style="text-align: right;">Time on Track</th>
                    </tr>
                </thead>
                <tbody>
                    ${(d.topCars || []).map(c => `
                        <tr>
                            <td><strong style="color: #ffffff;">${escapeHtml(c.name)}</strong></td>
                            <td><span style="color: var(--primary); font-weight: 700;">${c.laps.toLocaleString()}</span></td>
                            <td>${c.cleanLaps.toLocaleString()}</td>
                            <td><span style="color: #34d399;">${c.cleanPct}%</span></td>
                            <td style="text-align: right; color: var(--text-muted);">${c.hours} hrs</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Top Circuits Driven -->
        <h3 class="dossier-section-title">Top Circuits Driven</h3>
        <div style="overflow-x: auto;">
            <table class="dossier-table">
                <thead>
                    <tr>
                        <th>Circuit</th>
                        <th>Laps</th>
                        <th>Clean Laps</th>
                        <th>Clean Accuracy</th>
                        <th style="text-align: right;">Time on Track</th>
                    </tr>
                </thead>
                <tbody>
                    ${(d.topTracks || []).map(t => `
                        <tr>
                            <td><strong style="color: #ffffff;">${escapeHtml(t.name)}</strong></td>
                            <td><span style="color: var(--primary); font-weight: 700;">${t.laps.toLocaleString()}</span></td>
                            <td>${t.cleanLaps.toLocaleString()}</td>
                            <td><span style="color: #34d399;">${t.cleanPct}%</span></td>
                            <td style="text-align: right; color: var(--text-muted);">${t.hours} hrs</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close Driver Dossier Modal
 */
function closeDriverDossier() {
    const modal = document.getElementById('driver-dossier-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (window.location.hash) {
        history.replaceState(null, null, ' ');
    }
}

/**
 * Handle URL hash for deep linking (e.g. #matty-roberts)
 */
function handleUrlHash() {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && STATS_DATA && Array.isArray(STATS_DATA.drivers)) {
        const found = STATS_DATA.drivers.find(d => d.slug.toLowerCase() === hash.toLowerCase());
        if (found) {
            openDriverDossier(found.slug);
        }
    }
}

/**
 * Client-Side Manual Sync with Garage61 Trigger
 */
async function syncFromGarage61() {
    const btn = document.getElementById('btn-sync-telemetry');
    if (btn) {
        btn.innerHTML = '<span class="stats-badge-pulse" style="display: inline-block;"></span> Refreshing...';
        btn.disabled = true;
    }

    try {
        await loadStatsData();
        alert("Telemetry synchronized! Driver stats and reports updated.");
    } catch (e) {
        console.error("Sync error:", e);
    } finally {
        if (btn) {
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                <span>Sync Live Data</span>
            `;
            btn.disabled = false;
        }
    }
}

/**
 * Set Up Event Listeners
 */
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('driver-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            CURRENT_SEARCH = e.target.value;
            renderDrivers();
        });
    }

    // Filter chips
    const chips = document.querySelectorAll('.chip[data-filter]');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            CURRENT_FILTER = chip.getAttribute('data-filter') || 'all';
            renderDrivers();
        });
    });

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            CURRENT_SORT = e.target.value;
            renderDrivers();
        });
    }

    // View toggle buttons
    const btnGrid = document.getElementById('btn-view-grid');
    const btnTable = document.getElementById('btn-view-table');
    if (btnGrid && btnTable) {
        btnGrid.addEventListener('click', () => {
            btnGrid.classList.add('active');
            btnTable.classList.remove('active');
            CURRENT_VIEW = 'grid';
            renderDrivers();
        });
        btnTable.addEventListener('click', () => {
            btnTable.classList.add('active');
            btnGrid.classList.remove('active');
            CURRENT_VIEW = 'table';
            renderDrivers();
        });
    }

    // Modal background close
    const modal = document.getElementById('driver-dossier-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDriverDossier();
        });
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDriverDossier();
    });

    // Hash change
    window.addEventListener('hashchange', handleUrlHash);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
