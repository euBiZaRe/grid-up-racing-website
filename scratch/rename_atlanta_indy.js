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

const NEW_ATLANTA_DATA = {
    id: 'gtc-atlanta-15',
    name: 'GT Challenge: Atlanta 1.5',
    track: 'Road Atlanta',
    carClass: 'GT3 // GT4',
    description: 'Rolling hills and high speed at Road Atlanta. 1.5 hours of multiclass racing.',
    schedule: 'Sept 18th // 4:00 PM EST',
    dateDisplay: 'Sept 18, 2026',
    startDate: '2026-09-18T20:00:00Z',
    format: '90m Endurance',
    registrationStatus: 'open'
};

const NEW_INDY_DATA = {
    id: 'gtc-indy-120',
    name: 'GT Challenge: Indy 2 Hour',
    track: 'Indianapolis Motor Speedway',
    carClass: 'GT3 // GT4',
    description: 'Endurance at the Brickyard. 2 hours of multiclass action at the world capital of racing.',
    schedule: 'Oct 10th // 4:00 PM EST',
    dateDisplay: 'Oct 10, 2026',
    startDate: '2026-10-10T20:00:00Z',
    format: '120m Endurance',
    registrationStatus: 'open'
};

async function renameEvent(oldId, newId, newData) {
    console.log(`Renaming ${oldId} to ${newId} in Firestore...`);
    const oldDocRef = db.collection("leagues").doc(oldId);
    const oldDoc = await oldDocRef.get();
    
    if (oldDoc.exists) {
        console.log(`Found old ${oldId} document, deleting it...`);
        await oldDocRef.delete();
        console.log(`Old document ${oldId} deleted.`);
    } else {
        console.log(`No old document found for ${oldId}.`);
    }
    
    const newDocRef = db.collection("leagues").doc(newId);
    console.log(`Saving new ${newId} document...`);
    await newDocRef.set(newData);
    console.log(`New document ${newId} saved.`);
    
    console.log(`Checking registrations for ${oldId}...`);
    const regs = await oldDocRef.collection("registrations").get();
    if (!regs.empty) {
        console.log(`Found ${regs.size} registrations under ${oldId}. Copying them to ${newId}...`);
        const batch = db.batch();
        regs.forEach(regDoc => {
            const newRegRef = newDocRef.collection("registrations").doc(regDoc.id);
            batch.set(newRegRef, regDoc.data());
            batch.delete(regDoc.ref);
        });
        await batch.commit();
        console.log("Registrations moved successfully.");
    } else {
        console.log(`No registrations to move for ${oldId}.`);
    }
}

async function main() {
    try {
        await renameEvent("gtc-atlanta-120", "gtc-atlanta-15", NEW_ATLANTA_DATA);
        console.log("---");
        await renameEvent("gtc-indy-3h", "gtc-indy-120", NEW_INDY_DATA);
        console.log("\nFirestore update completed successfully for both events.");
    } catch(e) {
        console.error("Error updating Firestore:", e);
    }
    process.exit(0);
}

main();
