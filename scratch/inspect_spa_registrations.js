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
        console.log("Querying leagues...");
        const leaguesSnap = await db.collection("leagues").get();
        console.log(`Found ${leaguesSnap.size} league documents.`);
        
        for (const doc of leaguesSnap.docs) {
            console.log(`\nLeague Doc: ${doc.id}`);
            const regsSnap = await doc.ref.collection("registrations").get();
            console.log(`  Registrations count: ${regsSnap.size}`);
            
            regsSnap.forEach(rDoc => {
                const data = rDoc.data();
                console.log(`    - ID: ${rDoc.id} | TeamName: ${data.teamName} | Name: ${data.name} | Co-Drivers: ${data.coDrivers || data.drivers} | Car: ${data.car} | status: ${data.status}`);
            });
        }
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
