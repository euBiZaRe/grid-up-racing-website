// GT Challenge Championship Standings Calculator

const POINT_SYSTEM = {
    1: 100, 2: 95, 3: 90, 4: 85, 5: 80,
    6: 75, 7: 72, 8: 69, 9: 66, 10: 63,
    11: 60, 12: 59, 13: 58, 14: 57, 15: 56,
    16: 55, 17: 54, 18: 53, 19: 52, 20: 51
};

function getBasePoints(position) {
    if (position >= 1 && position <= 20) return POINT_SYSTEM[position];
    if (position >= 21) return 50; // "Bad day 50 flat"
    return 0; // Invalid/DNF might be 0, but usually DNF is last place points. We assume position is parsed cleanly.
}

function parsePosition(posStr) {
    // Converts "P1", "1st", "1" to integer 1
    return parseInt((posStr || '').replace(/[^0-9]/g, '')) || 999;
}

function calculateStandings(resultsData) {
    // We maintain two separate leaderboards: GT3 and GT4
    // Inside each, we have Teams and Drivers
    const standings = {
        'GT3': { teams: {}, drivers: {} },
        'GT4': { teams: {}, drivers: {} }
    };

    // 1. Group results by Event and Team to calculate 1-driver penalties
    // To apply the scaling penalty, we need to process chronologically if possible,
    // but order of processing doesn't strictly matter for the *total* penalty if we just count total offenses.
    // Wait: If a team has 1 offense: 0 penalty. 2 offenses: 0 + (-5) = -5. 3 offenses: 0 + (-5) + (-10) = -15.
    // 4 offenses: 0 - 5 - 10 - 20 = -35.
    // Let's implement this exactly:
    function getTeamSoloPenalty(soloRaceCount) {
        let penalty = 0;
        if (soloRaceCount >= 2) penalty += 5;
        if (soloRaceCount >= 3) penalty += 10;
        for (let i = 4; i <= soloRaceCount; i++) {
            penalty += 20;
        }
        return penalty;
    }

    resultsData.forEach(res => {
        // Determine class based on car
        const carClass = (res.car || '').toUpperCase().includes('GT4') ? 'GT4' : 'GT3';
        const s = standings[carClass];

        const pos = parsePosition(res.finish);
        let basePts = getBasePoints(pos);

        // Bonuses
        if (res.polePosition) basePts += 1;
        if (res.fastestLap) basePts += 1;
        if (res.fewestIncidents) basePts += 1;

        // Incident Penalty: -1 point for every 10x
        const incidents = parseInt(res.incidents) || 0;
        const incPenalty = Math.floor(incidents / 10);
        const earnedPts = basePts - incPenalty;

        const teamName = res.teamName || 'Unknown Team';
        const drivers = Array.isArray(res.drivers) ? res.drivers : (res.drivers ? res.drivers.split(',').map(d=>d.trim()) : []);

        // --- TEAM STANDINGS ---
        if (!s.teams[teamName]) {
            s.teams[teamName] = { name: teamName, points: 0, wins: 0, podiums: 0, soloRaces: 0 };
        }
        const t = s.teams[teamName];
        t.points += earnedPts;
        if (pos === 1) t.wins += 1;
        if (pos <= 3) t.podiums += 1;

        if (drivers.length === 1) {
            t.soloRaces += 1;
        }

        // --- DRIVER STANDINGS ---
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
    for (const carClass of ['GT3', 'GT4']) {
        Object.values(standings[carClass].teams).forEach(t => {
            if (t.soloRaces > 0) {
                const penalty = getTeamSoloPenalty(t.soloRaces);
                t.points -= penalty;
            }
        });
    }

    // Convert objects to sorted arrays
    for (const carClass of ['GT3', 'GT4']) {
        standings[carClass].teams = Object.values(standings[carClass].teams).sort((a, b) => b.points - a.points);
        standings[carClass].drivers = Object.values(standings[carClass].drivers).sort((a, b) => b.points - a.points);
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
        // Fetch ALL event results. 
        // Note: For large leagues, we'd filter by season/league ID. 
        // Assuming we only have GT Challenge results right now.
        const snapshot = await db.collection("event_results").get();
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No standings available yet.</p>';
            return;
        }

        const allResults = [];
        snapshot.forEach(doc => allResults.push(doc.data()));

        const standings = calculateStandings(allResults);

        // Store globally for tab switching
        window.leagueStandings = standings;
        
        renderStandingsTable('GT3', 'teams');

    } catch (e) {
        console.error("Error loading standings:", e);
        container.innerHTML = '<p style="color: #ff3c3c; text-align: center;">Failed to load standings.</p>';
    }
}

function renderStandingsTable(carClass, type) {
    const container = document.getElementById('standings-container');
    if (!container || !window.leagueStandings) return;

    const data = window.leagueStandings[carClass][type]; // type is 'teams' or 'drivers'
    
    // Update active tab styles
    document.querySelectorAll('.st-class-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`st-btn-${carClass.toLowerCase()}`).classList.add('active');

    document.querySelectorAll('.st-type-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`st-btn-${type}`).classList.add('active');

    if (data.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No ${type} data for ${carClass}.</p>`;
        return;
    }

    let html = `
        <table class="claims-table" style="width: 100%; text-align: left; border-collapse: separate; border-spacing: 0 8px;">
            <thead>
                <tr style="color: var(--text-muted); font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase;">
                    <th style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">Pos</th>
                    <th style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">${type === 'teams' ? 'Team' : 'Driver'}</th>
                    <th style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: center;">Pts</th>
                    <th style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: center;">Wins</th>
                    <th style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: center;">Podiums</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach((row, index) => {
        const pos = index + 1;
        let posDisplay = pos;
        if (pos === 1) posDisplay = '🥇';
        else if (pos === 2) posDisplay = '🥈';
        else if (pos === 3) posDisplay = '🥉';

        html += `
            <tr style="background: rgba(255,255,255,0.02); transition: background 0.2s;">
                <td style="padding: 1rem; font-weight: 800; border-radius: 8px 0 0 8px; width: 60px; text-align: center;">${posDisplay}</td>
                <td style="padding: 1rem; font-weight: 700; color: #fff;">${row.name}</td>
                <td style="padding: 1rem; font-weight: 900; color: var(--primary); text-align: center; font-size: 1.1rem;">${row.points}</td>
                <td style="padding: 1rem; text-align: center; color: var(--text-muted);">${row.wins}</td>
                <td style="padding: 1rem; border-radius: 0 8px 8px 0; text-align: center; color: var(--text-muted);">${row.podiums}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Global hook for the UI
window.switchStandingsView = function(carClass, type) {
    if (!carClass) {
        // Find currently active class if only switching type
        carClass = document.querySelector('.st-class-btn.active').id.includes('gt3') ? 'GT3' : 'GT4';
    }
    if (!type) {
        // Find currently active type if only switching class
        type = document.querySelector('.st-type-btn.active').id.includes('teams') ? 'teams' : 'drivers';
    }
    renderStandingsTable(carClass, type);
};

// Initialize if on the right page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('standings-container')) {
        loadAndRenderStandings();
    }
});
