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
        console.log("Querying reports...");
        const reportsSnap = await db.collection("reports").get();
        console.log(`Found ${reportsSnap.size} reports.`);
        
        reportsSnap.forEach(doc => {
            const data = doc.data();
            console.log(`- Doc ID: ${doc.id} | Title: ${data.title} | Slug: ${data.slug} | Date: ${data.date}`);
        });
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
