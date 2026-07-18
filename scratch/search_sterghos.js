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
        console.log("Searching for Connor / Sterg in users...");
        const usersSnap = await db.collection("users").get();
        usersSnap.forEach(doc => {
            const data = doc.data();
            const name = (data.displayName || data.realName || "").toLowerCase();
            if (name.includes("connor") || name.includes("sterg")) {
                console.log(`User: ${doc.id} -> ${JSON.stringify(data)}`);
            }
        });

        console.log("Searching in roster/registrations...");
        const leaguesSnap = await db.collection("leagues").get();
        for (const leagueDoc of leaguesSnap.docs) {
            const regsSnap = await leagueDoc.ref.collection("registrations").get();
            regsSnap.forEach(doc => {
                const data = doc.data();
                const str = JSON.stringify(data).toLowerCase();
                if (str.includes("connor") || str.includes("sterg")) {
                    console.log(`Reg in ${leagueDoc.id}: ${doc.id} -> ${JSON.stringify(data)}`);
                }
            });
        }
        console.log("Completed search.");
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
