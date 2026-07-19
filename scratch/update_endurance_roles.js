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
        console.log("Fetching all drivers...");
        const snapshot = await db.collection("drivers").get();
        console.log(`Found ${snapshot.size} drivers in database.`);
        
        let updateCount = 0;
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const category = data.category || "";
            
            // Check case-insensitively for "grid up endurance"
            if (category.toLowerCase() === "grid up endurance") {
                console.log(`Updating role for ${data.name} (Current Role: "${data.role || ''}", Category: "${category}")`);
                await doc.ref.update({
                    role: "Endurance Team Driver"
                });
                updateCount++;
            }
        }
        
        console.log(`SUCCESS: Completed updates. Updated ${updateCount} drivers.`);
    } catch(e) {
        console.error("Error updating roles:", e);
    }
    process.exit(0);
}

main();
