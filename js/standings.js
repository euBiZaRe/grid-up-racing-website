// GT Challenge Championship Standings Calculator

const EXCLUDED_TEAMS = [
    'GRID UP SIM RACING', 'GRID UP BLACK', 'GRID UP BLUE', 'GRID UP WHITE', 'GRID UP RED',
    'GRiD UP Sim Racing', 'GRiD UP Black', 'GRiD UP Blue', 'GRiD UP White', 'GRiD UP Red',
];

function isExcluded(teamName) {
    if (!teamName) return false;
    return EXCLUDED_TEAMS.some(ex => ex.toUpperCase() === teamName.toUpperCase()) || /^grid\s*up/i.test(teamName);
}

const POINT_SYSTEM = {
    1: 100, 2: 95, 3: 90, 4: 85, 5: 80,
    6: 75, 7: 72, 8: 69, 9: 66, 10: 63,
    11: 60, 12: 59, 13: 58, 14: 57, 15: 56,
    16: 55, 17: 54, 18: 53, 19: 52, 20: 51
};

function getBasePoints(position) {
    if (position >= 1 && position <= 20) return POINT_SYSTEM[position];
    if (position >= 21) return 50;
    return 0;
}

function parsePosition(posStr) {
    return parseInt((posStr || '').replace(/[^0-9]/g, '')) || 999;
}

function calculateStandings(resultsData) {
    // Combined pool — both GT3 and GT4 together
    const teams = {};
    const drivers = {};

    // Per-class tracking for solo-driver penalty (still per-class)
    const classTeams = { GT3: {}, GT4: {} };

    function getTeamSoloPenalty(n) {
        let p = 0;
        if (n >= 2) p += 5;
        if (n >= 3) p += 10;
        for (let i = 4; i <= n; i++) p += 20;
        return p;
    }

    resultsData.forEach(res => {
        const teamName = res.teamName || 'Unknown Team';
        if (isExcluded(teamName)) return;

        const carClass = (res.car || '').toUpperCase().includes('GT4') ? 'GT4' : 'GT3';
        const pos = parsePosition(res.finish);
        let basePts = getBasePoints(pos);

        if (res.polePosition === true) basePts += 1;
        if (res.fastestLap === true) basePts += 1;
        if (res.fewestIncidents === true) basePts += 1;

        const incidents = parseInt(res.incidents) || 0;
        const earnedPts = basePts - Math.floor(incidents / 10);

        const driverList = Array.isArray(res.drivers)
            ? res.drivers
            : (res.drivers ? res.drivers.split(',').map(d => d.trim()) : []);

        // --- COMBINED TEAM ---
        if (!teams[teamName]) {
            teams[teamName] = { name: teamName, carClass, points: 0, wins: 0, podiums: 0 };
        }
        const t = teams[teamName];
        t.points += earnedPts;
        if (pos === 1) t.wins += 1;
        if (pos <= 3) t.podiums += 1;

        // Track per-class solo races for penalty
        if (!classTeams[carClass][teamName]) classTeams[carClass][teamName] = { soloRaces: 0 };
        if (driverList.length === 1) classTeams[carClass][teamName].soloRaces += 1;

        // --- COMBINED DRIVER ---
        driverList.forEach(driverName => {
            if (!driverName) return;
            if (!drivers[driverName]) {
                drivers[driverName] = { name: driverName, carClass, points: 0, wins: 0, podiums: 0 };
            }
            const d = drivers[driverName];
            d.points += earnedPts;
            if (pos === 1) d.wins += 1;
            if (pos <= 3) d.podiums += 1;
        });
    });

    // Apply solo-driver team penalties
    for (const cc of ['GT3', 'GT4']) {
        Object.entries(classTeams[cc]).forEach(([name, info]) => {
            if (info.soloRaces > 0 && teams[name]) {
                teams[name].points -= getTeamSoloPenalty(info.soloRaces);
            }
        });
    }

    return {
        teams: Object.values(teams).sort((a, b) => b.points - a.points),
        drivers: Object.values(drivers).sort((a, b) => b.points - a.points),
    };
}

async function loadAndRenderStandings() {
    const container = document.getElementById('standings-container');
    if (!container) return;

    if (typeof db === 'undefined') {
        setTimeout(loadAndRenderStandings, 500);
        return;
    }

    try {
        const snapshot = await db.collection("event_results").get();
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No standings available yet.</p>';
            return;
        }
        const allResults = [];
        snapshot.forEach(doc => allResults.push(doc.data()));
        window.leagueStandings = calculateStandings(allResults);
        renderStandingsTable('teams');
    } catch (e) {
        console.error("Error loading standings:", e);
        container.innerHTML = '<p style="color: #ff3c3c; text-align: center;">Failed to load standings.</p>';
    }
}

const CLASS_BADGE = {
    GT3: '<span style="font-size:0.6rem;font-weight:800;padding:2px 7px;border-radius:20px;background:rgba(0,207,255,0.15);color:var(--primary);border:1px solid rgba(0,207,255,0.3);letter-spacing:1px;vertical-align:middle;margin-left:8px;">GT3</span>',
    GT4: '<span style="font-size:0.6rem;font-weight:800;padding:2px 7px;border-radius:20px;background:rgba(255,165,0,0.15);color:#ffaa00;border:1px solid rgba(255,165,0,0.3);letter-spacing:1px;vertical-align:middle;margin-left:8px;">GT4</span>',
};

function renderStandingsTable(type) {
    const container = document.getElementById('standings-container');
    if (!container || !window.leagueStandings) return;

    const data = window.leagueStandings[type];
    const isCompact = container.closest('.hero-standings-card') !== null;

    // Sync type buttons
    document.querySelectorAll('.st-type-btn').forEach(btn => btn.classList.remove('active'));
    const teamsBtn = document.getElementById('st-btn-teams');
    const driversBtn = document.getElementById('st-btn-drivers');
    if (type === 'teams' && teamsBtn) teamsBtn.classList.add('active');
    if (type === 'drivers' && driversBtn) driversBtn.classList.add('active');

    if (!data || data.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No ${type} data yet.</p>`;
        return;
    }

    if (isCompact) {
        let html = '';
        data.slice(0, 5).forEach((row, index) => {
            const pos = index + 1;
            let medal = `<span style="font-weight:800;color:var(--text-muted);font-size:0.8rem;">${pos}</span>`;
            if (pos === 1) medal = '<span style="font-size:1rem;">&#x1F947;</span>';
            else if (pos === 2) medal = '<span style="font-size:1rem;">&#x1F948;</span>';
            else if (pos === 3) medal = '<span style="font-size:1rem;">&#x1F949;</span>';
            const badge = row.carClass ? CLASS_BADGE[row.carClass] || '' : '';
            html += `<div class="st-row">
                <div style="text-align:center;">${medal}</div>
                <div style="font-size:0.75rem;font-weight:700;color:#fff;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${row.name}${badge}</div>
                <div style="font-size:0.9rem;font-weight:900;color:var(--primary);white-space:nowrap;">${row.points} <span style="font-size:0.6rem;color:var(--text-muted);">pts</span></div>
            </div>`;
        });
        container.innerHTML = html;
        return;
    }

    // Full table
    let html = `<table class="claims-table" style="width:100%;text-align:left;border-collapse:separate;border-spacing:0 8px;">
        <thead>
            <tr style="color:var(--text-muted);font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;">
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);">Pos</th>
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);">${type === 'teams' ? 'Team' : 'Driver'}</th>
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);text-align:center;">Class</th>
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);text-align:center;">Pts</th>
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);text-align:center;">Wins</th>
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);text-align:center;">Podiums</th>
            </tr>
        </thead>
        <tbody>`;

    data.forEach((row, index) => {
        const pos = index + 1;
        let posD = pos;
        if (pos === 1) posD = '&#x1F947;';
        else if (pos === 2) posD = '&#x1F948;';
        else if (pos === 3) posD = '&#x1F949;';
        const badge = row.carClass ? CLASS_BADGE[row.carClass] || '' : '';
        html += `<tr style="background:rgba(255,255,255,0.02);">
            <td style="padding:1rem;font-weight:800;border-radius:8px 0 0 8px;width:60px;text-align:center;">${posD}</td>
            <td style="padding:1rem;font-weight:700;color:#fff;">${row.name}</td>
            <td style="padding:1rem;text-align:center;">${badge}</td>
            <td style="padding:1rem;font-weight:900;color:var(--primary);text-align:center;font-size:1.1rem;">${row.points}</td>
            <td style="padding:1rem;text-align:center;color:var(--text-muted);">${row.wins}</td>
            <td style="padding:1rem;border-radius:0 8px 8px 0;text-align:center;color:var(--text-muted);">${row.podiums}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Global hook — type only now (no carClass arg needed)
window.switchStandingsView = function(type) {
    renderStandingsTable(type);
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('standings-container')) {
        loadAndRenderStandings();
    }
});
