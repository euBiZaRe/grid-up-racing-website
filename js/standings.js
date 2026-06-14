// GT Challenge Championship Standings Calculator

const EXCLUDED_TEAMS = [
    'GRID UP SIM RACING', 'GRID UP BLACK', 'GRID UP BLUE', 'GRID UP WHITE', 'GRID UP RED',
    'GRiD UP Sim Racing', 'GRiD UP Black', 'GRiD UP Blue', 'GRiD UP White', 'GRiD UP Red',
    'Koch Motorsports',
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
        if (res.fastestLap === true || res.fastestLapBonus === true) basePts += 1;
        if (res.fewestIncidents === true) basePts += 1;

        const incidents = parseInt(res.incidents) || 0;
        let earnedPts = basePts - Math.floor(incidents / 10);

        // Exemption for Team Breakfast to keep them on exactly 50 points flat as requested by the organizer
        if (teamName === 'Team Breakfast') {
            earnedPts = 50;
        }

        const driverList = Array.isArray(res.drivers)
            ? res.drivers
            : (res.drivers ? res.drivers.split(',').map(d => d.trim()) : []);

        const qPos = parseInt((res.qualy || '').replace(/[^0-9]/g, '')) || 999;

        // --- COMBINED TEAM ---
        if (!teams[teamName]) {
            teams[teamName] = { name: teamName, carClass, points: 0, wins: 0, podiums: 0, qualys: [] };
        }
        const t = teams[teamName];
        t.points += earnedPts;
        if (pos === 1) t.wins += 1;
        if (pos <= 3) t.podiums += 1;
        if (qPos !== 999) t.qualys.push(qPos);

        // Track per-class solo races for penalty
        if (!classTeams[carClass][teamName]) classTeams[carClass][teamName] = { soloRaces: 0 };
        if (driverList.length === 1) classTeams[carClass][teamName].soloRaces += 1;

        // --- COMBINED DRIVER ---
        driverList.forEach(driverName => {
            if (!driverName) return;
            if (!drivers[driverName]) {
                drivers[driverName] = { name: driverName, carClass, points: 0, wins: 0, podiums: 0, qualys: [] };
            }
            const d = drivers[driverName];
            d.points += earnedPts;
            if (pos === 1) d.wins += 1;
            if (pos <= 3) d.podiums += 1;
            if (qPos !== 999) d.qualys.push(qPos);
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

    const prepareList = (dict) => {
        return Object.values(dict).map(item => {
            let avg = '-';
            if (item.qualys.length > 0) {
                avg = 'P' + (item.qualys.reduce((a,b) => a+b, 0) / item.qualys.length).toFixed(1);
                if (avg.endsWith('.0')) avg = avg.slice(0, -2);
            }
            item.avgStart = avg;
            return item;
        }).sort((a, b) => b.points - a.points);
    };

    return {
        teams: prepareList(teams),
        drivers: prepareList(drivers),
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
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.eventId === 'gtc-virginia-120') {
                allResults.push(data);
            }
        });
        window.leagueStandings = calculateStandings(allResults);
        renderStandingsTable('teams');

        // Render extra stats section if present
        const extraContainer = document.getElementById('extra-stats-container');
        if (extraContainer) {
            renderExtraStats(allResults);
        }
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
            if (pos === 1) medal = '<span style="font-size:1rem;">🥇</span>';
            else if (pos === 2) medal = '<span style="font-size:1rem;">🥈</span>';
            else if (pos === 3) medal = '<span style="font-size:1rem;">🥉</span>';
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
                <th style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.1);text-align:center;">Avg Start</th>
            </tr>
        </thead>
        <tbody>`;

    data.forEach((row, index) => {
        const pos = index + 1;
        let posD = pos;
        if (pos === 1) posD = '🥇';
        else if (pos === 2) posD = '🥈';
        else if (pos === 3) posD = '🥉';
        const badge = row.carClass ? CLASS_BADGE[row.carClass] || '' : '';
        html += `<tr style="background:rgba(255,255,255,0.02);">
            <td style="padding:1rem;font-weight:800;border-radius:8px 0 0 8px;width:60px;text-align:center;">${posD}</td>
            <td style="padding:1rem;font-weight:700;color:#fff;">${row.name}</td>
            <td style="padding:1rem;text-align:center;">${badge}</td>
            <td style="padding:1rem;font-weight:900;color:var(--primary);text-align:center;font-size:1.1rem;">${row.points}</td>
            <td style="padding:1rem;text-align:center;color:var(--text-muted);">${row.wins}</td>
            <td style="padding:1rem;text-align:center;color:var(--text-muted);">${row.podiums}</td>
            <td style="padding:1rem;border-radius:0 8px 8px 0;font-weight:800;color:var(--text-muted);text-align:center;">${row.avgStart || '-'}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function renderExtraStats(allResults) {
    const extraContainer = document.getElementById('extra-stats-container');
    if (!extraContainer) return;

    // Filter for Virginia 120 results and non-excluded teams
    const virginiaResults = allResults.filter(res => res.eventId === 'gtc-virginia-120' && !isExcluded(res.teamName));
    if (virginiaResults.length === 0) {
        extraContainer.style.display = 'none';
        return;
    }
    extraContainer.style.display = 'block';

    // Group by class
    const gt3Results = virginiaResults.filter(res => !(res.car || '').toUpperCase().includes('GT4'));
    const gt4Results = virginiaResults.filter(res => (res.car || '').toUpperCase().includes('GT4'));

    // --- 1. QUALIFYING POSITIONS ---
    const parseQualy = (q) => parseInt((q || '').replace(/[^0-9]/g, '')) || 999;
    
    const sortedGT3Qualy = [...gt3Results].sort((a, b) => parseQualy(a.qualy) - parseQualy(b.qualy));
    const sortedGT4Qualy = [...gt4Results].sort((a, b) => parseQualy(a.qualy) - parseQualy(b.qualy));

    const gt3QualyMin = Math.min(...sortedGT3Qualy.map(r => parseQualy(r.qualy)));
    const gt4QualyMin = Math.min(...sortedGT4Qualy.map(r => parseQualy(r.qualy)));

    // --- 2. AVERAGE STARTING POSITION ---
    const teamQualys = {};
    allResults.forEach(res => {
        const teamName = res.teamName;
        if (!teamName || isExcluded(teamName)) return;

        const carClass = (res.car || '').toUpperCase().includes('GT4') ? 'GT4' : 'GT3';
        const qPos = parseQualy(res.qualy);
        if (qPos === 999) return; // Skip invalid qualy

        if (!teamQualys[teamName]) {
            teamQualys[teamName] = { name: teamName, carClass, qualys: [] };
        }
        teamQualys[teamName].qualys.push(qPos);
    });

    const avgStartList = Object.values(teamQualys).map(t => {
        const sum = t.qualys.reduce((a, b) => a + b, 0);
        const avg = sum / t.qualys.length;
        return {
            name: t.name,
            carClass: t.carClass,
            avgStart: avg
        };
    });

    const sortedGT3AvgStart = avgStartList.filter(t => t.carClass === 'GT3').sort((a, b) => a.avgStart - b.avgStart);
    const sortedGT4AvgStart = avgStartList.filter(t => t.carClass === 'GT4').sort((a, b) => a.avgStart - b.avgStart);

    const gt3AvgMin = sortedGT3AvgStart.length > 0 ? Math.min(...sortedGT3AvgStart.map(t => t.avgStart)) : Infinity;
    const gt4AvgMin = sortedGT4AvgStart.length > 0 ? Math.min(...sortedGT4AvgStart.map(t => t.avgStart)) : Infinity;

    // --- 3. FASTEST LAPS ---
    const parseLapTime = (timeStr) => {
        if (!timeStr || timeStr === 'N/A' || timeStr === true || timeStr === false || timeStr === '-') return Infinity;
        const parts = String(timeStr).split(':');
        if (parts.length === 2) {
            const mins = parseInt(parts[0]) || 0;
            const secs = parseFloat(parts[1]) || 0;
            return mins * 60 + secs;
        }
        return parseFloat(timeStr) || Infinity;
    };

    const sortedGT3FL = [...gt3Results].sort((a, b) => parseLapTime(a.fastestLap) - parseLapTime(b.fastestLap));
    const sortedGT4FL = [...gt4Results].sort((a, b) => parseLapTime(a.fastestLap) - parseLapTime(b.fastestLap));

    const gt3FLMin = Math.min(...sortedGT3FL.map(r => parseLapTime(r.fastestLap)));
    const gt4FLMin = Math.min(...sortedGT4FL.map(r => parseLapTime(r.fastestLap)));

    // --- 4. SAFETY / INCIDENTS ---
    const parseIncidents = (inc) => parseInt(inc) || 0;

    const sortedGT3Safety = [...gt3Results].sort((a, b) => parseIncidents(a.incidents) - parseIncidents(b.incidents));
    const sortedGT4Safety = [...gt4Results].sort((a, b) => parseIncidents(a.incidents) - parseIncidents(b.incidents));

    const gt3IncMin = Math.min(...sortedGT3Safety.map(r => parseIncidents(r.incidents)));
    const gt4IncMin = Math.min(...sortedGT4Safety.map(r => parseIncidents(r.incidents)));

    // Helper to render rows
    const renderQualyRow = (res, rank, isHighlight) => {
        const borderStyle = isHighlight 
            ? 'background: linear-gradient(135deg, rgba(0, 207, 255, 0.15), rgba(0, 207, 255, 0.03)); border: 1px solid rgba(0, 207, 255, 0.5); box-shadow: 0 0 15px rgba(0, 207, 255, 0.15);' 
            : 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);';
        const trophy = isHighlight ? '🏆 ' : '';
        const qualyText = res.qualy || 'P-';
        const timeText = res.qualyTime && res.qualyTime !== '-' && res.qualyTime !== 'N/A' ? ` (${res.qualyTime})` : '';
        const highlightStyle = isHighlight ? 'color: var(--primary); font-weight: 800;' : 'color: #fff;';
        
        return `
            <div style="${borderStyle} border-radius: 12px; padding: 0.8rem 1.2rem; margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease;">
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <span style="font-weight: 800; color: var(--text-muted); font-size: 0.75rem; width: 20px;">${rank}</span>
                    <span style="${highlightStyle} font-size: 0.85rem;">${trophy}${res.teamName}</span>
                </div>
                <div style="font-weight: 900; font-size: 0.95rem; color: ${isHighlight ? 'var(--primary)' : 'var(--text-muted)'};">${qualyText}${timeText}</div>
            </div>
        `;
    };

    const renderAvgStartRow = (res, rank, isHighlight) => {
        const borderStyle = isHighlight 
            ? 'background: linear-gradient(135deg, rgba(0, 207, 255, 0.15), rgba(0, 207, 255, 0.03)); border: 1px solid rgba(0, 207, 255, 0.5); box-shadow: 0 0 15px rgba(0, 207, 255, 0.15);' 
            : 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);';
        const trophy = isHighlight ? '🏁 ' : '';
        const highlightStyle = isHighlight ? 'color: var(--primary); font-weight: 800;' : 'color: #fff;';
        
        return `
            <div style="${borderStyle} border-radius: 12px; padding: 0.8rem 1.2rem; margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease;">
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <span style="font-weight: 800; color: var(--text-muted); font-size: 0.75rem; width: 20px;">${rank}</span>
                    <span style="${highlightStyle} font-size: 0.85rem;">${trophy}${res.name}</span>
                </div>
                <div style="font-weight: 900; font-size: 0.95rem; color: ${isHighlight ? 'var(--primary)' : 'var(--text-muted)'};">P${res.avgStart.toFixed(2)}</div>
            </div>
        `;
    };

    const renderFLRow = (res, rank, isHighlight) => {
        const timeVal = res.fastestLap || 'N/A';
        const borderStyle = isHighlight 
            ? 'background: linear-gradient(135deg, rgba(255, 170, 0, 0.15), rgba(255, 170, 0, 0.03)); border: 1px solid rgba(255, 170, 0, 0.5); box-shadow: 0 0 15px rgba(255, 170, 0, 0.15);' 
            : 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);';
        const bolt = isHighlight ? '⚡ ' : '';
        const highlightStyle = isHighlight ? 'color: #ffaa00; font-weight: 800;' : 'color: #fff;';
        
        return `
            <div style="${borderStyle} border-radius: 12px; padding: 0.8rem 1.2rem; margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <span style="font-weight: 800; color: var(--text-muted); font-size: 0.75rem; width: 20px;">${rank}</span>
                    <span style="${highlightStyle} font-size: 0.85rem;">${bolt}${res.teamName}</span>
                </div>
                <div style="font-weight: 900; font-size: 0.95rem; color: ${isHighlight ? '#ffaa00' : 'var(--text-muted)'};">${timeVal}</div>
            </div>
        `;
    };

    const renderSafetyRow = (res, rank, isHighlight) => {
        const incVal = res.incidents !== undefined ? `${res.incidents}x` : '-';
        const borderStyle = isHighlight 
            ? 'background: linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 255, 136, 0.03)); border: 1px solid rgba(0, 255, 136, 0.5); box-shadow: 0 0 15px rgba(0, 255, 136, 0.15);' 
            : 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);';
        const shield = isHighlight ? '🛡️ ' : '';
        const highlightStyle = isHighlight ? 'color: #00ff88; font-weight: 800;' : 'color: #fff;';
        
        return `
            <div style="${borderStyle} border-radius: 12px; padding: 0.8rem 1.2rem; margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <span style="font-weight: 800; color: var(--text-muted); font-size: 0.75rem; width: 20px;">${rank}</span>
                    <span style="${highlightStyle} font-size: 0.85rem;">${shield}${res.teamName}</span>
                </div>
                <div style="font-weight: 900; font-size: 0.95rem; color: ${isHighlight ? '#00ff88' : 'var(--text-muted)'};">${incVal}</div>
            </div>
        `;
    };

    extraContainer.innerHTML = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 3rem; margin-top: 3rem;">
            
            <!-- Qualifying Section -->
            <div class="stats-card" style="background: rgba(15, 18, 24, 0.5); border: 1px solid rgba(0, 207, 255, 0.12); border-radius: 24px; padding: 2.5rem; backdrop-filter: blur(10px);">
                <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 1rem;">
                    <span style="font-size: 1.8rem;">🏆</span>
                    <div>
                        <h3 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: #fff; letter-spacing: 1px;">Qualifying Grid</h3>
                        <p style="color: var(--text-muted); font-size: 0.65rem; margin: 0.2rem 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">Virginia 120 Starting Positions</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem;">
                    <!-- GT3 -->
                    <div>
                        <h4 style="color: var(--primary); font-size: 0.8rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                            GT3 CLASS <span style="font-size: 0.6rem; font-weight: 800; padding: 2px 7px; border-radius: 20px; background: rgba(0,207,255,0.15); border: 1px solid rgba(0,207,255,0.3); letter-spacing: 1px;">Quali Times</span>
                        </h4>
                        <div class="qualy-list-gt3">
                            ${sortedGT3Qualy.map((res, i) => renderQualyRow(res, i + 1, parseQualy(res.qualy) === gt3QualyMin)).join('')}
                        </div>
                    </div>
                    <!-- GT4 -->
                    <div>
                        <h4 style="color: #ffaa00; font-size: 0.8rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                            GT4 CLASS <span style="font-size: 0.6rem; font-weight: 800; padding: 2px 7px; border-radius: 20px; background: rgba(255,165,0,0.15); border: 1px solid rgba(255,165,0,0.3); letter-spacing: 1px; color: #ffaa00;">Quali Times</span>
                        </h4>
                        <div class="qualy-list-gt4">
                            ${sortedGT4Qualy.map((res, i) => renderQualyRow(res, i + 1, parseQualy(res.qualy) === gt4QualyMin)).join('')}
                        </div>
                    </div>
                </div>
            </div>



            <!-- Fastest Lap Section -->
            <div class="stats-card" style="background: rgba(15, 18, 24, 0.5); border: 1px solid rgba(0, 207, 255, 0.12); border-radius: 24px; padding: 2.5rem; backdrop-filter: blur(10px);">
                <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 1rem;">
                    <span style="font-size: 1.8rem;">⚡</span>
                    <div>
                        <h3 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: #fff; letter-spacing: 1px;">Fastest Laps</h3>
                        <p style="color: var(--text-muted); font-size: 0.65rem; margin: 0.2rem 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">Virginia 120 Speed Leaderboard</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem;">
                    <!-- GT3 -->
                    <div>
                        <h4 style="color: var(--primary); font-size: 0.8rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                            GT3 CLASS <span style="font-size: 0.6rem; font-weight: 800; padding: 2px 7px; border-radius: 20px; background: rgba(0,207,255,0.15); border: 1px solid rgba(0,207,255,0.3); letter-spacing: 1px;">Fastest Laps</span>
                        </h4>
                        <div class="fl-list-gt3">
                            ${sortedGT3FL.map((res, i) => renderFLRow(res, i + 1, parseLapTime(res.fastestLap) === gt3FLMin)).join('')}
                        </div>
                    </div>
                    <!-- GT4 -->
                    <div>
                        <h4 style="color: #ffaa00; font-size: 0.8rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                            GT4 CLASS <span style="font-size: 0.6rem; font-weight: 800; padding: 2px 7px; border-radius: 20px; background: rgba(255,165,0,0.15); border: 1px solid rgba(255,165,0,0.3); letter-spacing: 1px; color: #ffaa00;">Fastest Laps</span>
                        </h4>
                        <div class="fl-list-gt4">
                            ${sortedGT4FL.map((res, i) => renderFLRow(res, i + 1, parseLapTime(res.fastestLap) === gt4FLMin)).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Safety Leaderboard Section -->
            <div class="stats-card" style="background: rgba(15, 18, 24, 0.5); border: 1px solid rgba(0, 207, 255, 0.12); border-radius: 24px; padding: 2.5rem; backdrop-filter: blur(10px);">
                <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 1rem;">
                    <span style="font-size: 1.8rem;">🛡️</span>
                    <div>
                        <h3 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: #fff; letter-spacing: 1px;">Safety Leaderboard</h3>
                        <p style="color: var(--text-muted); font-size: 0.65rem; margin: 0.2rem 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">Virginia 120 Fewest Incidents</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem;">
                    <!-- GT3 -->
                    <div>
                        <h4 style="color: var(--primary); font-size: 0.8rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                            GT3 CLASS <span style="font-size: 0.6rem; font-weight: 800; padding: 2px 7px; border-radius: 20px; background: rgba(0,255,136,0.15); border: 1px solid rgba(0,255,136,0.3); letter-spacing: 1px; color: #00ff88;">Fewest Incidents</span>
                        </h4>
                        <div class="safety-list-gt3">
                            ${sortedGT3Safety.map((res, i) => renderSafetyRow(res, i + 1, parseIncidents(res.incidents) === gt3IncMin)).join('')}
                        </div>
                    </div>
                    <!-- GT4 -->
                    <div>
                        <h4 style="color: #ffaa00; font-size: 0.8rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                            GT4 CLASS <span style="font-size: 0.6rem; font-weight: 800; padding: 2px 7px; border-radius: 20px; background: rgba(0,255,136,0.15); border: 1px solid rgba(0,255,136,0.3); letter-spacing: 1px; color: #00ff88;">Fewest Incidents</span>
                        </h4>
                        <div class="safety-list-gt4">
                            ${sortedGT4Safety.map((res, i) => renderSafetyRow(res, i + 1, parseIncidents(res.incidents) === gt4IncMin)).join('')}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `;
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
