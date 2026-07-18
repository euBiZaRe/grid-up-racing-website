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
        console.log("Searching for 'Apex Junky Motorsports' in event_results...");
        const resultsSnap = await db.collection("event_results")
            .where("teamName", "==", "Apex Junky Motorsports")
            .get();
        console.log(`Found ${resultsSnap.size} matches in event_results.`);
        resultsSnap.forEach(doc => {
            console.log(`Document ID: ${doc.id}, Event: ${doc.data().eventId}, Drivers: ${JSON.stringify(doc.data().drivers)}`);
        });

        console.log("\nSearching for 'Apex Junky Motorsports' in roster/registrations...");
        // Search across all leagues registrations
        const leaguesSnap = await db.collection("leagues").get();
        for (const leagueDoc of leaguesSnap.docs) {
            const regsSnap = await leagueDoc.ref.collection("registrations")
                .where("teamName", "==", "Apex Junky Motorsports")
                .get();
            if (!regsSnap.empty) {
                console.log(`Found ${regsSnap.size} registrations in league ${leagueDoc.id}`);
                regsSnap.forEach(doc => {
                    console.log(`  Reg ID: ${doc.id}, Drivers: ${JSON.stringify(doc.data().drivers || doc.data().driverName)}`);
                });
            }
        }
        
        console.log("\nSearch completed.");
    } catch(e) {
        console.error("Error searching:", e);
    }
    process.exit(0);
}

main();
