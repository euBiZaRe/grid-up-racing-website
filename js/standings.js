// GT Challenge Championship Standings Calculator

// Teams excluded from championship standings (house/broadcast entries)
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
    const standings = {
        'GT3': { teams: {}, drivers: {} },
        'GT4': { teams: {}, drivers: {} }
    };

    function getTeamSoloPenalty(soloRaceCount) {
        let penalty = 0;
        if (soloRaceCount >= 2) penalty += 5;
        if (soloRaceCount >= 3) penalty += 10;
        for (let i = 4; i <= soloRaceCount; i++) penalty += 20;
        return penalty;
    }

    resultsData.forEach(res => {
        const teamName = res.teamName || 'Unknown Team';
        if (isExcluded(teamName)) return;

        const carClass = (res.car || '').toUpperCase().includes('GT4') ? 'GT4' : 'GT3';
        const s = standings[carClass];
        const pos = parsePosition(res.finish);
        let basePts = getBasePoints(pos);

        if (res.polePosition === true) basePts += 1;
        if (res.fastestLap === true) basePts += 1;
        if (res.fewestIncidents === true) basePts += 1;

        const incidents = parseInt(res.incidents) || 0;
        const earnedPts = basePts - Math.floor(incidents / 10);

        const drivers = Array.isArray(res.drivers) ? res.drivers : (res.drivers ? res.drivers.split(',').map(d => d.trim()) : []);

        // TEAM STANDINGS
        if (!s.teams[teamName]) {
            s.teams[teamName] = { name: teamName, points: 0, wins: 0, podiums: 0, soloRaces: 0 };
        }
        const t = s.teams[teamName];
        t.points += earnedPts;
        if (pos === 1) t.wins += 1;
        if (pos <= 3) t.podiums += 1;
        if (drivers.length === 1) t.soloRaces += 1;

        // DRIVER STANDINGS
        drivers.forEach(driverName => {
            if (!driverName) return;
            if (!s.drivers[driverName]) {
                s.drivers[driverName] = { name: driverName, points: 0, wins: 0, podiums: 0 };
            }
            const d = s.drivers[driverName];
            d.points += earnedPts;
            if (pos === 1) d.wins += 1;
            if (pos <= 3) d.podiums += 1;
        });
    });

    // Apply Team Solo Penalties
    for (const cc of ['GT3', 'GT4']) {
        Object.values(standings[cc].teams).forEach(t => {
            if (t.soloRaces > 0) t.points -= getTeamSoloPenalty(t.soloRaces);
        });
        standings[cc].teams = Object.values(standings[cc].teams).sort((a, b) => b.points - a.points);
        standings[cc].drivers = Object.values(standings[cc].drivers).sort((a, b) => b.points - a.points);
    }

    return standings;
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
        renderStandingsTable('GT3', 'teams');
    } catch (e) {
        console.error("Error loading standings:", e);
        container.innerHTML = '<p style="color: #ff3c3c; text-align: center;">Failed to load standings.</p>';
    }
}

function renderStandingsTable(carClass, type) {
    const container = document.getElementById('standings-container');
    if (!container || !window.leagueStandings) return;

    const data = window.leagueStandings[carClass][type];
    const isCompact = container.closest('.hero-standings-card') !== null;

    // Sync button states
    document.querySelectorAll('.st-class-btn').forEach(btn => btn.classList.remove('active'));
    const gt3Btn = document.getElementById('st-btn-gt3');
    const gt4Btn = document.getElementById('st-btn-gt4');
    if (carClass === 'GT3' && gt3Btn) gt3Btn.classList.add('active');
    if (carClass === 'GT4' && gt4Btn) gt4Btn.classList.add('active');

    document.querySelectorAll('.st-type-btn').forEach(btn => btn.classList.remove('active'));
    const teamsBtn = document.getElementById('st-btn-teams');
    const driversBtn = document.getElementById('st-btn-drivers');
    if (type === 'teams' && teamsBtn) teamsBtn.classList.add('active');
    if (type === 'drivers' && driversBtn) driversBtn.classList.add('active');

    if (data.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No ${type} data for ${carClass}.</p>`;
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
            html += `<div class="st-row">
                <div style="text-align:center;">${medal}</div>
                <div style="font-size:0.8rem;font-weight:700;color:#fff;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${row.name}</div>
                <div style="font-size:0.9rem;font-weight:900;color:var(--primary);">${row.points} <span style="font-size:0.65rem;color:var(--text-muted);">pts</span></div>
            </div>`;
        });
        container.innerHTML = html;
        return;
    }

    // Full table (standings.html)
    let html = `<table class="claims-table" style="width:100%;text-align:left;border-collapse:separate;border-spacing:0 8px;">
        <thead>
            <tr style="color:var(--text-muted);font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;">
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);">Pos</th>
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);">${type === 'teams' ? 'Team' : 'Driver'}</th>
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);text-align:center;">Pts</th>
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);text-align:center;">Wins</th>
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);text-align:center;">Podiums</th>
            </tr>
        </thead>
        <tbody>`;

    data.forEach((row, index) => {
        const pos = index + 1;
        let posDisplay = pos;
        if (pos === 1) posDisplay = '&#x1F947;';
        else if (pos === 2) posDisplay = '&#x1F948;';
        else if (pos === 3) posDisplay = '&#x1F949;';
        html += `<tr style="background:rgba(255,255,255,0.02);transition:background 0.2s;">
            <td style="padding:1rem;font-weight:800;border-radius:8px 0 0 8px;width:60px;text-align:center;">${posDisplay}</td>
            <td style="padding:1rem;font-weight:700;color:#fff;">${row.name}</td>
            <td style="padding:1rem;font-weight:900;color:var(--primary);text-align:center;font-size:1.1rem;">${row.points}</td>
            <td style="padding:1rem;text-align:center;color:var(--text-muted);">${row.wins}</td>
            <td style="padding:1rem;border-radius:0 8px 8px 0;text-align:center;color:var(--text-muted);">${row.podiums}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Global hook for tab buttons
window.switchStandingsView = function(carClass, type) {
    if (!carClass) {
        const active = document.querySelector('.st-class-btn.active');
        carClass = (active && active.id.includes('gt4')) ? 'GT4' : 'GT3';
    }
    if (!type) {
        const active = document.querySelector('.st-type-btn.active');
        type = (active && active.id.includes('drivers')) ? 'drivers' : 'teams';
    }
    renderStandingsTable(carClass, type);
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('standings-container')) {
        loadAndRenderStandings();
    }
});
