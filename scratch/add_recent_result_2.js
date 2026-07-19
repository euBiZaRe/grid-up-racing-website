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

const RESULT_DATA = {
    rawUrl: "assets/results/July1126(1).png",
    teamAsset: "assets/results/July1126(1).png",
    type: "cinematic-poster",
    timestamp: "2026-07-11T12:00:01Z"
};

async function main() {
    try {
        console.log("Writing second July 11 recent result card to Firestore...");
        await db.collection("race_results").doc("July1126_1").set(RESULT_DATA);
        console.log("SUCCESS: Second July 11 recent result card added to Firestore!");
    } catch(e) {
        console.error("Error adding recent result:", e);
    }
    process.exit(0);
}

main();
