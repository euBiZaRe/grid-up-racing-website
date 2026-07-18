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
        const docsToUpdate = ["6SSnZJBon3V1UKjvZPEK", "gQjsPrLeKvh9lqKLhRuq"];
        for (const docId of docsToUpdate) {
            console.log(`Fetching document ${docId} from event_results...`);
            const docRef = db.collection("event_results").doc(docId);
            const doc = await docRef.get();
            if (doc.exists) {
                const data = doc.data();
                const updatedDrivers = data.drivers.map(d => d === "Adam L Jones" ? "Adam L. Jones" : d);
                console.log(`Updating drivers for event ${data.eventId}: from ${JSON.stringify(data.drivers)} to ${JSON.stringify(updatedDrivers)}`);
                await docRef.update({ drivers: updatedDrivers });
                console.log(`Document ${docId} updated successfully.`);
            } else {
                console.log(`Document ${docId} not found.`);
            }
        }
        console.log("Done updating driver names.");
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
