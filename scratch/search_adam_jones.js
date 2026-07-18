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
        console.log("Searching in users...");
        const usersSnap = await db.collection("users").get();
        usersSnap.forEach(doc => {
            const data = doc.data();
            const name = (data.displayName || data.realName || "").toLowerCase();
            if (name.includes("adam")) {
                console.log(`User: ${doc.id} -> ${JSON.stringify(data)}`);
            }
        });

        console.log("Searching in event_results...");
        const resultsSnap = await db.collection("event_results").get();
        resultsSnap.forEach(doc => {
            const data = doc.data();
            const drivers = data.drivers || [];
            drivers.forEach(d => {
                if (d.toLowerCase().includes("adam")) {
                    console.log(`Result in ${data.eventId}: Doc ${doc.id} -> ${d} (Team: ${data.teamName})`);
                }
            });
        });
        
        console.log("Completed search.");
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
