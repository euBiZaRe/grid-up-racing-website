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

const SPA_RESULTS = [
    // GT3 Class
    {
        "eventId": "gtc-spa-3h",
        "teamName": "F&F Racing",
        "car": "Ferrari 296 GT3",
        "qualy": "P9",
        "finish": "P1",
        "drivers": ["Alexander Cortez"],
        "incidents": 12,
        "fastestLap": "2:18.102",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "BWE Racing-#346",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P3",
        "finish": "P2",
        "drivers": ["Alex Claudio"],
        "incidents": 9,
        "fastestLap": "2:17.442",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": true,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Bite Point Racing | B",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P2",
        "finish": "P3",
        "drivers": ["Harrison Holliday", "Timothy Schaefer"],
        "incidents": 17,
        "fastestLap": "2:16.559",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": true,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Bite Point Racing | C",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P8",
        "finish": "P4",
        "drivers": ["Scott Mowry"],
        "incidents": 40,
        "fastestLap": "2:19.043",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Bite Point Racing",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P1",
        "finish": "P5",
        "drivers": ["Michael T Anderson", "Jason Holland"],
        "incidents": 18,
        "fastestLap": "2:17.882",
        "qualyTime": "-",
        "polePosition": true,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "100% Serious 100% of the Time",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P4",
        "finish": "P6",
        "drivers": ["Chandler English"],
        "incidents": 22,
        "fastestLap": "2:18.990",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Savage Motorsports",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P6",
        "finish": "P7",
        "drivers": ["Kevin Miller"],
        "incidents": 22,
        "fastestLap": "2:19.450",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "BWE Racing-#415",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P7",
        "finish": "P8",
        "drivers": ["Heath Olinger"],
        "incidents": 22,
        "fastestLap": "2:20.123",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Dream Team",
        "car": "Porsche 911 GT3 R (992)",
        "qualy": "P5",
        "finish": "P9",
        "drivers": ["Terry Cantwell"],
        "incidents": 47,
        "fastestLap": "2:21.050",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Breakfast: Pudding Division",
        "car": "Audi R8 LMS EVO II GT3",
        "qualy": "P10",
        "finish": "P10",
        "drivers": ["Omette Ohm"],
        "incidents": 20,
        "fastestLap": "2:23.411",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    
    // GT4 Class
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Wildcats Racing",
        "car": "Ford Mustang GT4",
        "qualy": "P4",
        "finish": "P1",
        "drivers": ["Stephen Smalley"],
        "incidents": 15,
        "fastestLap": "2:31.450",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Sal Simms Racing",
        "car": "Ford Mustang GT4",
        "qualy": "P3",
        "finish": "P2",
        "drivers": ["Marsalis Simms"],
        "incidents": 16,
        "fastestLap": "2:30.985",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Angry Rooster Racing",
        "car": "Ford Mustang GT4",
        "qualy": "P1",
        "finish": "P3",
        "drivers": ["Andrew B Fabian"],
        "incidents": 22,
        "fastestLap": "2:29.970",
        "qualyTime": "-",
        "polePosition": true,
        "fewestIncidents": false,
        "fastestLapBonus": true,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Apex Racing",
        "car": "Ford Mustang GT4",
        "qualy": "P2",
        "finish": "P4",
        "drivers": ["Mark Prince", "David Shreve"],
        "incidents": 16,
        "fastestLap": "2:31.980",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Grumpy Duck Racing",
        "car": "Ford Mustang GT4",
        "qualy": "P6",
        "finish": "P5",
        "drivers": ["Adam L. Jones"],
        "incidents": 18,
        "fastestLap": "2:32.410",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Blackhawk Racing Powered by GridUp - Car 1",
        "car": "Ford Mustang GT4",
        "qualy": "P7",
        "finish": "P6",
        "drivers": ["Michael Graham7"],
        "incidents": 39,
        "fastestLap": "2:33.450",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": false,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    },
    {
        "eventId": "gtc-spa-3h",
        "teamName": "Rev Limit Racing",
        "car": "BMW M4 G82 GT4 Evo",
        "qualy": "P5",
        "finish": "P7",
        "drivers": ["A.J. Johnson"],
        "incidents": 6,
        "fastestLap": "2:34.992",
        "qualyTime": "-",
        "polePosition": false,
        "fewestIncidents": true,
        "fastestLapBonus": false,
        "timestamp": "2026-06-27T15:00:00Z"
    }
];

async function main() {
    try {
        console.log("Checking for existing Spa results in Firestore...");
        const colRef = db.collection("event_results");
        const snap = await colRef.where("eventId", "==", "gtc-spa-3h").get();
        
        if (!snap.empty) {
            console.log(`Deleting ${snap.size} existing Spa results...`);
            const deletePromises = snap.docs.map(doc => doc.ref.delete());
            await Promise.all(deletePromises);
            console.log("Deletion completed.");
        }
        
        console.log("Writing Spa results...");
        const batch = db.batch();
        SPA_RESULTS.forEach(res => {
            const docRef = colRef.doc();
            const copy = { ...res };
            copy.timestamp = firebase.firestore.Timestamp.fromDate(new Date(res.timestamp));
            batch.set(docRef, copy);
            console.log(`Queued: ${res.teamName} - ${res.finish}`);
        });
        
        await batch.commit();
        console.log("SUCCESS: All Spa results written to Firestore!");
        
    } catch(e) {
        console.error("Error seeding Spa results:", e);
    }
    process.exit(0);
}

main();
