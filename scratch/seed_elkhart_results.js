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

const ELKHART_RESULTS = [
    // GT3 Class
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Bite Point Racing | B",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P4",
        "finish": "P1",
        "drivers": ["Harrison Holliday"],
        "incidents": 15,
        "fastestLap": "2:03.048",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "juan",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P1",
        "finish": "P2",
        "drivers": ["Michael O'Dell"],
        "incidents": 16,
        "fastestLap": "2:03.039",
        "qualyTime": "-",
        "polePosition": true,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Tekkart Motorsport #306",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P5",
        "finish": "P3",
        "drivers": ["Damijan Horvatin"],
        "incidents": 28,
        "fastestLap": "2:03.676",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "F&F Racing",
        "car": "Ferrari 296 GT3",
        "qualy": "P14",
        "finish": "P4",
        "drivers": ["Alexander Cortez", "Matty Roberts"],
        "incidents": 19,
        "fastestLap": "2:02.975",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": true,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Depend for Men Motorsports",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P7",
        "finish": "P5",
        "drivers": ["Levi Wolfe"],
        "incidents": 5,
        "fastestLap": "2:04.726",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": true,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "BWE Racing-#346",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P6",
        "finish": "P6",
        "drivers": ["Heath Olinger"],
        "incidents": 13,
        "fastestLap": "2:04.174",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Dream Team",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P10",
        "finish": "P7",
        "drivers": ["Terry Cantwell"],
        "incidents": 21,
        "fastestLap": "2:04.997",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Team Wynn's",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P13",
        "finish": "P8",
        "drivers": ["Martyn Cook"],
        "incidents": 22,
        "fastestLap": "2:05.446",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Bite Point Racing - Solo",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P12",
        "finish": "P9",
        "drivers": ["Jason Holland"],
        "incidents": 22,
        "fastestLap": "2:04.915",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Savage Motorsports",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P11",
        "finish": "P10",
        "drivers": ["Kevin Miller"],
        "incidents": 10,
        "fastestLap": "2:04.610",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Sierra Motorsports",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P3",
        "finish": "P11",
        "drivers": ["Javi Sierra"],
        "incidents": 12,
        "fastestLap": "2:04.012",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "BWE Racing-#280",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P2",
        "finish": "P12",
        "drivers": ["Alex Claudio"],
        "incidents": 7,
        "fastestLap": "2:04.666",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Pocket Aces Motorsports",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P8",
        "finish": "P13",
        "drivers": ["Anthony Savignano III"],
        "incidents": 2,
        "fastestLap": "N/A",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Syndicate Racing",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P9",
        "finish": "P14",
        "drivers": ["Connor Sterghos", "Faraz Ebrahim"],
        "incidents": 3,
        "fastestLap": "2:05.615",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    
    // GT4 Class
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Tekkart Motorsport",
        "car": "Ford Mustang GT4",
        "qualy": "P17",
        "finish": "P1",
        "drivers": ["Pierre Poussi"],
        "incidents": 19,
        "fastestLap": "2:17.229",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Motohaus Black",
        "car": "Ford Mustang GT4",
        "qualy": "P21",
        "finish": "P2",
        "drivers": ["Xavier Williams"],
        "incidents": 17,
        "fastestLap": "2:17.452",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Apex Racing",
        "car": "Ford Mustang GT4",
        "qualy": "P18",
        "finish": "P3",
        "drivers": ["David Shreve", "Mark Prince"],
        "incidents": 16,
        "fastestLap": "2:17.445",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Angry Rooster Racing",
        "car": "Ford Mustang GT4",
        "qualy": "P19",
        "finish": "P4",
        "drivers": ["Andrew B Fabian"],
        "incidents": 21,
        "fastestLap": "2:17.029",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": true,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Grumpy Duck Racing",
        "car": "Ford Mustang GT4",
        "qualy": "P15",
        "finish": "P5",
        "drivers": ["Adam L. Jones"],
        "incidents": 16,
        "fastestLap": "2:17.647",
        "qualyTime": "-",
        "polePosition": true,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Rev Limit Racing",
        "car": "BMW M4 G82 GT4 Evo",
        "qualy": "P16",
        "finish": "P6",
        "drivers": ["A.J. Johnson"],
        "incidents": 9,
        "fastestLap": "2:18.403",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": true,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Motohaus White",
        "car": "BMW M4 G82 GT4 Evo",
        "qualy": "P20",
        "finish": "P7",
        "drivers": ["Daniel Tamminga"],
        "incidents": 36,
        "fastestLap": "2:18.925",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    },
    {
        "eventId": "gtc-elkhart-120",
        "teamName": "Savage Sim Racing - Team Yellow",
        "car": "Ford Mustang GT4",
        "qualy": "P22",
        "finish": "P8",
        "drivers": ["Brandon N Berg"],
        "incidents": 0,
        "fastestLap": "N/A",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-07-18T15:00:00Z"
    }
];

async function main() {
    try {
        console.log("Checking for existing Elkhart Lake 120 results in Firestore...");
        const colRef = db.collection("event_results");
        const snap = await colRef.where("eventId", "==", "gtc-elkhart-120").get();
        
        if (!snap.empty) {
            console.log(`Deleting ${snap.size} existing Elkhart Lake results...`);
            const deletePromises = snap.docs.map(doc => doc.ref.delete());
            await Promise.all(deletePromises);
            console.log("Deletion completed.");
        }
        
        console.log("Writing Elkhart Lake results...");
        const batch = db.batch();
        ELKHART_RESULTS.forEach(res => {
            const docRef = colRef.doc();
            const copy = { ...res };
            copy.timestamp = firebase.firestore.Timestamp.fromDate(new Date(res.timestamp));
            batch.set(docRef, copy);
            console.log(`Queued: ${res.teamName} - ${res.finish}`);
        });
        
        await batch.commit();
        console.log("SUCCESS: All Elkhart Lake results written to Firestore!");
        
    } catch(e) {
        console.error("Error seeding Elkhart Lake results:", e);
    }
    process.exit(0);
}

main();
