// Grid Up - Authentication & Profile Claiming Engine
// Powered by Firebase

// NOTE: Replace these with your actual Firebase project config from the Firebase Console
// Official Grid Up Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAomPdMD_IrBw52m0Nc2l-cuDKNmH_qqAk",
  authDomain: "grid-up.firebaseapp.com",
  projectId: "grid-up",
  storageBucket: "grid-up.firebasestorage.app",
  messagingSenderId: "649006432736",
  appId: "1:649006432736:web:5220f500a5e53cb7276b85",
  measurementId: "G-956CFQ680Q"
};

// Initialize Firebase (will be loaded via CDN in HTML)
let app, auth, db;

function initAuth() {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();

        // Listen for Auth State changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("Logged in as:", user.displayName);
                updateAuthUI(user);
            } else {
                console.log("No user logged in.");
                updateAuthUI(null);
            }
        });
    }
}

// Discord Login Flow
function loginWithDiscord() {
    // Discord is configured as an OIDC provider in the Firebase Console
    const provider = new firebase.auth.OAuthProvider('oidc.discord');
    auth.signInWithPopup(provider).then((result) => {
        // Successful login
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Login Error:", error);
        alert("Authentication failed: " + error.message);
    });
}

// Update UI based on Login State
function updateAuthUI(user) {
    const loginBtn = document.getElementById('login-link');
    const claimSection = document.getElementById('claim-section');

    if (user) {
        if (loginBtn) {
            loginBtn.innerHTML = `<span style="display:flex; align-items:center; gap:8px;"><img src="${user.photoURL}" style="width: 20px; border-radius: 50%;"> ${user.displayName.split(' ')[0]} (Logout)</span>`;
            loginBtn.onclick = () => {
                if(confirm("Logout?")) auth.signOut();
            };
            loginBtn.removeAttribute('href');
            loginBtn.style.cursor = 'pointer';
        }
        // Show claim section if authenticated
        if (claimSection) claimSection.style.display = 'block';
    } else {
        if (loginBtn) {
            loginBtn.textContent = "Login";
            loginBtn.href = "login.html";
            loginBtn.onclick = null;
        }
        // Hide claim section if not authenticated
        if (claimSection) claimSection.style.display = 'none';
    }
}

// Profile Claiming Logic
async function claimProfile(driverName, iracingId) {
    const user = auth.currentUser;
    if (!user) return alert("Please login first.");

    try {
        await db.collection("claims").doc(driverName).set({
            discordId: user.uid,
            discordName: user.displayName,
            avatar: user.photoURL,
            iracingId: iracingId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "pending"
        });
        alert("Claim request sent! An admin will verify your identity shortly.");
    } catch (error) {
        console.error("Error claiming profile:", error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuth);
