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
            console.log("Auth State Changed. User:", user ? user.uid : "None");
            if (user) {
                updateAuthUI(user);
            } else {
                updateAuthUI(null);
            }
        });
    } else {
        console.error("Firebase SDK not detected!");
    }
}

// Discord Login Flow
function loginWithDiscord() {
    console.log("Starting Discord Login...");
    const provider = new firebase.auth.OAuthProvider('oidc.discord');
    auth.signInWithPopup(provider).then((result) => {
        console.log("Login Success:", result.user.displayName);
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Login Error:", error.code, error.message);
        alert("Authentication failed: " + error.message);
    });
}

// Update UI based on Login State
async function updateAuthUI(user) {
    const loginBtn = document.getElementById('login-link');
    const claimSection = document.getElementById('claim-section');
    const driverTitle = document.querySelector('h1.glow-text');

    if (user) {
        console.log("Updating UI for logged-in user:", user.uid);
        if (loginBtn) {
            const displayName = user.displayName || "";
            const name = displayName ? displayName.split(' ')[0] : "Driver";
            const avatar = user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
            
            // Check for Admin
            const ADMIN_UIDS = ['B0t4f4nqqpZIQKpT8Ed97xka5gM2'];
            const isAdmin = ADMIN_UIDS.includes(user.uid);
            const adminLink = isAdmin ? `<a href="${window.location.pathname.includes('/drivers/') ? '../' : ''}admin.html" style="color: var(--primary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; margin-right: 15px; font-weight: 700;">Admin Console</a>` : '';

            loginBtn.innerHTML = `<span style="display:flex; align-items:center; gap:10px;">${adminLink}<img src="${avatar}" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--primary);"> ${name} (Logout)</span>`;
            loginBtn.onclick = (e) => {
                e.preventDefault();
                if(confirm("Logout?")) auth.signOut();
            };
            loginBtn.removeAttribute('href');
            loginBtn.style.cursor = 'pointer';
        }
        
        // Handle Driver Profile Page logic
        if (claimSection && driverTitle) {
            const driverName = driverTitle.textContent.trim();
            checkClaimStatus(driverName, user);
        }
    } else {
        if (loginBtn) {
            loginBtn.textContent = "Login";
            const isSubdir = window.location.pathname.includes('/drivers/') || window.location.pathname.includes('/events/');
            loginBtn.href = isSubdir ? "../login.html" : "login.html";
            loginBtn.onclick = null;
        }
        if (claimSection) claimSection.style.display = 'none';
    }
}

// Check if a profile is already claimed/pending
async function checkClaimStatus(driverName, user) {
    const claimSection = document.getElementById('claim-section');
    if (!claimSection) return;
    
    console.log("Checking claim status for:", driverName);

    // Ensure db is initialized (it should be, but let's be safe)
    if (!db) {
        console.warn("Firestore not ready, retrying in 500ms...");
        setTimeout(() => checkClaimStatus(driverName, user), 500);
        return;
    }

    try {
        const docSnapshot = await db.collection("claims").doc(driverName).get();
        console.log("Claim Doc Exists:", docSnapshot.exists);
        
        claimSection.style.display = 'block';
        
        if (docSnapshot.exists) {
            const data = docSnapshot.data();
            console.log("Claim Status:", data.status);
            
            if (data.status === "verified") {
                claimSection.innerHTML = `<div class="badge-verified" style="background: rgba(0, 207, 255, 0.1); color: var(--primary); padding: 0.75rem 1.5rem; border: 1px solid var(--primary); border-radius: 4px; display: inline-block; font-weight: 700;">✓ VERIFIED TEAM MEMBER</div>`;
            } else {
                claimSection.innerHTML = `<div class="badge-pending" style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); padding: 0.75rem 1.5rem; border: 1px solid var(--glass-border); border-radius: 4px; display: inline-block;">CLAIM PENDING VERIFICATION</div>`;
            }
        } else {
            // No claim exists, show the button
            console.log("Showing claim button for:", driverName);
            claimSection.innerHTML = `<button class="btn btn-outline claim-btn" onclick="openClaimModal()" style="font-size: 0.75rem; padding: 0.6rem 1.5rem;">Claim This Driver Profile</button>`;
        }
    } catch (error) {
        console.error("Error checking claim status:", error);
        // Fallback to showing the button if error
        claimSection.style.display = 'block';
        claimSection.innerHTML = `<button class="btn btn-outline claim-btn" onclick="openClaimModal()" style="font-size: 0.75rem; padding: 0.6rem 1.5rem;">Claim This Driver Profile</button>`;
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
        // Refresh UI state
        updateAuthUI(user);
    } catch (error) {
        console.error("Error claiming profile:", error);
        alert("Error sending claim: " + error.message);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuth);
