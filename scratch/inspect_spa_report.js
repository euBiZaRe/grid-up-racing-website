const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");
const fs = require("fs");

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
        console.log("Fetching Spa report...");
        const doc = await db.collection("reports").doc("spa-3h-longest-2-4-hours").get();
        if (doc.exists) {
            const data = doc.data();
            fs.writeFileSync("spa_report_content.txt", data.content || "No content field", "utf-8");
            console.log("Content written to spa_report_content.txt successfully.");
        } else {
            console.log("Document not found!");
        }
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
