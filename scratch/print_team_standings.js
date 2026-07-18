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

function getBasePoints(pos) {
    const pts = [100, 95, 90, 85, 80, 75, 70, 66, 62, 58, 54, 50, 46, 42, 38, 35, 32, 29, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4];
    return pts[pos - 1] || 0;
}

function parsePosition(str) {
    return parseInt((str || '').replace(/[^0-9]/g, '')) || 999;
}

async function main() {
    try {
        const snap = await db.collection("event_results").get();
        const results = [];
        snap.forEach(doc => {
            const data = doc.data();
            if (data.eventId === 'gtc-virginia-120' || data.eventId === 'gtc-glen-24' || data.eventId === 'gtc-spa-3h') {
                results.push(data);
            }
        });

        const teams = {};
        results.forEach(res => {
            const teamName = res.teamName || 'Unknown Team';
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

            if (!teams[teamName]) {
                teams[teamName] = { name: teamName, carClass, points: 0 };
            }
            teams[teamName].points += earnedPts;
        });

        console.log("--- TEAM STANDINGS ---");
        const sorted = Object.values(teams).sort((a,b) => b.points - a.points);
        sorted.forEach(t => {
            console.log(`${t.name} (${t.carClass}) | Pts: ${t.points}`);
        });

    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
