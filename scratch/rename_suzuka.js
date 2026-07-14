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
    id: 'gtc-suzuka-120',
    name: 'GT Challenge: Suzuka 120',
    track: 'Suzuka International Racing Course',
    carClass: 'GT3 // GT4',
    description: 'The figure-eight challenge. 2 hours of endurance at Japan\'s premier circuit.',
    schedule: 'Sept 5th // 4:00 PM EST',
    dateDisplay: 'Sept 5, 2026',
    startDate: '2026-09-05T20:00:00Z',
    format: '120m Endurance',
    registrationStatus: 'open'
};

async function main() {
    try {
        console.log("Renaming gtc-suzuka-24 to gtc-suzuka-120 in Firestore...");
        
        // 1. Delete the old document if it exists
        const oldDocRef = db.collection("leagues").doc("gtc-suzuka-24");
        const oldDoc = await oldDocRef.get();
        if (oldDoc.exists) {
            console.log("Found old gtc-suzuka-24 document, deleting it...");
            await oldDocRef.delete();
            console.log("Old document deleted successfully.");
        } else {
            console.log("No old gtc-suzuka-24 document found.");
        }
        
        // 2. Set the new document
        const newDocRef = db.collection("leagues").doc("gtc-suzuka-120");
        console.log("Saving new gtc-suzuka-120 document...");
        await newDocRef.set(NEW_EVENT_DATA);
        console.log("New document saved successfully.");
        
        // 3. Double check registrations subcollection
        console.log("Checking registrations subcollection for old event...");
        const oldRegs = await oldDocRef.collection("registrations").get();
        if (!oldRegs.empty) {
            console.log(`Found ${oldRegs.size} registrations under gtc-suzuka-24. Copying them to gtc-suzuka-120...`);
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
