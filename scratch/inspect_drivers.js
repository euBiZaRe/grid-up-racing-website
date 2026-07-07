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
        const snap = await db.collection("drivers").where("name", "==", "Alex Claudio").get();
        snap.forEach(doc => {
            console.log("Alex Claudio:", doc.data());
        });
        
        const snap2 = await db.collection("drivers").where("name", "==", "Harrison Holliday").get();
        snap2.forEach(doc => {
            console.log("Harrison Holliday:", doc.data());
        });

        const snap3 = await db.collection("drivers").where("name", "==", "Stephen Smalley").get();
        snap3.forEach(doc => {
            console.log("Stephen Smalley:", doc.data());
        });
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

main();
