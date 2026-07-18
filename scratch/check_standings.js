const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyAomPdMD_IrBw52m0Nc2l-cuDKNmH_qqAk",
    authDomain: "grid-up.firebaseapp.com",
    projectId: "grid-up",
    storageBucket: "grid-up.firebasestorage.app",
    messagingSenderId: "649006432736",
    appId: "1:649006432736:web:5220f500a5e53cb7276b85",
    measurementId: "G-956CFQ680Q"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
    const teams = {};
    const drivers = {};
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

        if (teamName === 'Team Breakfast') {
            earnedPts = 50;
        }

        const driverList = Array.isArray(res.drivers)
            ? res.drivers
            : (res.drivers ? res.drivers.split(',').map(d => d.trim()) : []);

        const qPos = parseInt((res.qualy || '').replace(/[^0-9]/g, '')) || 999;

        // --- COMBINED TEAM ---
        if (!teams[teamName]) {
            teams[teamName] = { 
                name: teamName, 
                carClass, 
                points: 0, 
                wins: 0, 
                podiums: 0, 
                qualys: [],
                incidents: 0,
                incidentDeductions: 0,
                soloRaces: 0,
                soloPenalty: 0,
                poles: 0,
                fastestLapsCount: 0,
                fewestIncidentsCount: 0,
                totalBonusPoints: 0
            };
        }
        const t = teams[teamName];
        t.points += earnedPts;
        t.incidents += incidents;
        t.incidentDeductions += Math.floor(incidents / 10);
        if (pos === 1) t.wins += 1;
        if (pos <= 3) t.podiums += 1;
        if (qPos !== 999) t.qualys.push(qPos);

        if (res.polePosition === true) {
            t.poles += 1;
            t.totalBonusPoints += 1;
        }
        if (res.fastestLap === true || res.fastestLapBonus === true) {
            t.fastestLapsCount += 1;
            t.totalBonusPoints += 1;
        }
        if (res.fewestIncidents === true) {
            t.fewestIncidentsCount += 1;
            t.totalBonusPoints += 1;
        }

        if (!classTeams[carClass][teamName]) classTeams[carClass][teamName] = { soloRaces: 0 };
        if (driverList.length === 1) classTeams[carClass][teamName].soloRaces += 1;

        // --- COMBINED DRIVER ---
        driverList.forEach(driverName => {
            if (!driverName) return;
            if (!drivers[driverName]) {
                drivers[driverName] = { name: driverName, carClass, points: 0, wins: 0, podiums: 0, qualys: [], finishes: [] };
            }
            const d = drivers[driverName];
            d.points += earnedPts;
            if (pos === 1) d.wins += 1;
            if (pos <= 3) d.podiums += 1;
            if (qPos !== 999) d.qualys.push(qPos);
            if (pos !== 999) d.finishes.push(pos);
        });
    });

    // Apply solo-driver team penalties
    for (const cc of ['GT3', 'GT4']) {
        Object.entries(classTeams[cc]).forEach(([name, info]) => {
            if (info.soloRaces > 0 && teams[name]) {
                const penalty = getTeamSoloPenalty(info.soloRaces);
                teams[name].points -= penalty;
                teams[name].soloRaces = info.soloRaces;
                teams[name].soloPenalty = penalty;
            }
        });
    }

    const prepareList = (dict) => {
        return Object.values(dict).map(item => {
            let avg = '-';
            if (item.qualys && item.qualys.length > 0) {
                avg = 'P' + Math.round(item.qualys.reduce((a,b) => a+b, 0) / item.qualys.length);
            }
            item.avgStart = avg;
            if (item.finishes && item.finishes.length > 0) {
                item.avgFinish = 'P' + Math.round(item.finishes.reduce((a,b) => a+b, 0) / item.finishes.length);
            } else {
                item.avgFinish = '-';
            }
            return item;
        }).sort((a, b) => b.points - a.points);
    };

    return {
        teams: prepareList(teams),
        drivers: prepareList(drivers),
    };
}

async function main() {
    try {
        console.log("Fetching event_results from Firestore...");
        const snapshot = await db.collection("event_results").get();
        console.log(`Fetched ${snapshot.size} documents.`);
        
        const allResults = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.eventId === 'gtc-virginia-120' || data.eventId === 'gtc-glen-24' || data.eventId === 'gtc-spa-3h' || data.eventId === 'gtc-elkhart-120') {
                allResults.push(data);
            }
        });
        
        console.log(`\nFiltered ${allResults.length} results for Virginia, Glen, and Spa.`);
        const standings = calculateStandings(allResults);
        
        console.log("\n--- CALCULATED DRIVER STANDINGS ---");
        console.log("GT3 Class Drivers:");
        standings.drivers.filter(d => d.carClass === 'GT3').forEach((d, i) => {
            console.log(`${i+1}. ${d.name} | Pts: ${d.points} | Wins: ${d.wins} | Avg Start: ${d.avgStart} | Avg Finish: ${d.avgFinish}`);
        });
        
        console.log("\nGT4 Class Drivers:");
        standings.drivers.filter(d => d.carClass === 'GT4').forEach((d, i) => {
            console.log(`${i+1}. ${d.name} | Pts: ${d.points} | Wins: ${d.wins} | Avg Start: ${d.avgStart} | Avg Finish: ${d.avgFinish}`);
        });
        
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main();
