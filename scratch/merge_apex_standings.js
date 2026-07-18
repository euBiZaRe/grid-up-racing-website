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
        const docId = "s1mgK1AlTXxeElNKMxKd";
        console.log(`Fetching document ${docId} from event_results...`);
        const docRef = db.collection("event_results").doc(docId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            console.log("Found document. Current data:", JSON.stringify(doc.data()));
            console.log("Updating teamName to 'Apex Racing'...");
            await docRef.update({ teamName: "Apex Racing" });
            console.log("Document updated successfully!");
        } else {
            console.log(`Error: Document ${docId} not found in event_results.`);
        }
    } catch(e) {
        console.error("Error merging standings:", e);
    }
    process.exit(0);
}

main();
