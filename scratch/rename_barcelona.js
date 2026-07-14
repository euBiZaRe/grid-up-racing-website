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

const NEW_EVENT_DATA = {
    id: 'gtc-barcelona-15',
    name: 'GT Challenge: Barcelona 1.5',
    track: 'Circuit de Barcelona-Catalunya',
    carClass: 'GT3 // GT4',
    description: 'Technical endurance racing in Spain. 1.5 hours of strategic multiclass battle.',
    schedule: 'August 8th // 4:00 PM EST',
    dateDisplay: 'August 8, 2026',
    startDate: '2026-08-08T20:00:00Z',
    format: '90m Endurance',
    registrationStatus: 'open'
};

async function main() {
    try {
        console.log("Renaming gtc-barcelona-120 to gtc-barcelona-15 in Firestore...");
        
        // 1. Delete the old document if it exists
        const oldDocRef = db.collection("leagues").doc("gtc-barcelona-120");
        const oldDoc = await oldDocRef.get();
        if (oldDoc.exists) {
            console.log("Found old gtc-barcelona-120 document, deleting it...");
            await oldDocRef.delete();
            console.log("Old document deleted successfully.");
        } else {
            console.log("No old gtc-barcelona-120 document found.");
        }
        
        // 2. Set the new document
        const newDocRef = db.collection("leagues").doc("gtc-barcelona-15");
        console.log("Saving new gtc-barcelona-15 document...");
        await newDocRef.set(NEW_EVENT_DATA);
        console.log("New document saved successfully.");
        
        // 3. Double check registrations subcollection
        console.log("Checking registrations subcollection for old event...");
        const oldRegs = await oldDocRef.collection("registrations").get();
        if (!oldRegs.empty) {
            console.log(`Found ${oldRegs.size} registrations under gtc-barcelona-120. Copying them to gtc-barcelona-15...`);
            const batch = db.batch();
            oldRegs.forEach(regDoc => {
                const newRegRef = newDocRef.collection("registrations").doc(regDoc.id);
                batch.set(newRegRef, regDoc.data());
                batch.delete(regDoc.ref);
            });
            await batch.commit();
            console.log("Registrations moved successfully.");
        } else {
            console.log("No registrations to move.");
        }
        
        console.log("Firestore update completed successfully.");
    } catch(e) {
        console.error("Error updating Firestore:", e);
    }
    process.exit(0);
}

main();
