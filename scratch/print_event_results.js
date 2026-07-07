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

async function main() {
    try {
        console.log("Querying event_results from Firestore...");
        const snapshot = await db.collection("event_results").get();
        
        const byEvent = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const eid = data.eventId || 'no-event';
            if (!byEvent[eid]) byEvent[eid] = [];
            byEvent[eid].push({ id: doc.id, ...data });
        });
        
        Object.entries(byEvent).forEach(([eid, list]) => {
            console.log(`\n========================================`);
            console.log(`EVENT: ${eid} (${list.length} results)`);
            console.log(`========================================`);
            list.forEach(res => {
                console.log(`- Team: ${res.teamName} | Finish: ${res.finish} | Drivers: ${res.drivers ? res.drivers.join(', ') : ''} | Car: ${res.car}`);
            });
        });
        
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
