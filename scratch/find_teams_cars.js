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

const searchDrivers = [
    "Alexander Cortez", "Alex Claudio", "Harrison Holliday", "Timothy Schaefer",
    "Scott Mowry", "Michael T Anderson", "Jason Holland", "Chandler English",
    "Kevin Miller26", "Heath Olinger", "Terry Cantwell", "Omette Ohm",
    "Stephen Smalley2", "Marsalis Simms2", "Andrew B Fabian", "Mark Prince",
    "David Shreve2", "Adam L Jones", "Michael Graham7", "A.J. Johnson"
];

const searchTeams = [
    "F&F Racing", "BWE Racing-#346", "Bite Point Racing | B", "Bite Point Racing | C",
    "Bite Point Racing", "100% Serious 100% of the Time", "Savage Motorsports",
    "BWE Racing-#415", "Dream Team", "Breakfast: Pudding Division",
    "Wildcats Racing", "Sal Simms Racing", "Angry Rooster Racing", "Apex Racing",
    "Grumpy Duck Racing", "Blackhawk Racing Powered by GridUp - Car 1", "Rev Limit Racing"
];

async function main() {
    try {
        console.log("=== DRIVERS IN FIRESTORE ===");
        const drSnap = await db.collection("drivers").get();
        drSnap.forEach(doc => {
            const d = doc.data();
            const match = searchDrivers.some(name => d.name && d.name.toLowerCase().includes(name.toLowerCase().replace(/[0-9]/g, '').trim()));
            if (match || searchDrivers.some(name => name.toLowerCase().includes(d.name.toLowerCase()))) {
                console.log(`- Driver: ${d.name} | docId: ${doc.id} | Team: ${d.team} | Car: ${d.car} | Class: ${d.carClass || d.class}`);
            }
        });
        
        console.log("\n=== TEAMS IN FIRESTORE ===");
        const teamSnap = await db.collection("teams").get();
        teamSnap.forEach(doc => {
            const t = doc.data();
            const match = searchTeams.some(name => t.name && t.name.toLowerCase().includes(name.toLowerCase().replace(/-#.*/g, '').trim()));
            if (match) {
                console.log(`- Team: ${t.name} | docId: ${doc.id} | Class: ${t.carClass || t.class} | Drivers: ${t.drivers ? t.drivers.join(', ') : ''} | Car: ${t.car}`);
            }
        });
        
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
