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

// Initialize Firebase (Immediately)
console.log("Grid Up Auth: Initializing Firebase...");
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        var auth = firebase.auth();
        var db = firebase.firestore();
        console.log("Grid Up Auth: Firebase initialized successfully.");
    } else {
        console.error("Grid Up Auth: Firebase SDK NOT FOUND!");
    }
} catch (e) {
    console.error("Grid Up Auth: Initialization Error", e);
}

function initAuth() {
    // Listen for Auth State changes
    auth.onAuthStateChanged((user) => {
        console.log("Auth State Changed. User:", user ? user.uid : "None");
        if (user) {
            updateAuthUI(user);
        } else {
            updateAuthUI(null);
        }
    });
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
            const avatar = user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
            
            // Check for Admin (Master Admin + Firestore Settings)
            const MASTER_ADMIN = 'B0t4f4nqqpZIQKpT8Ed97xka5gM2';
            let isAdmin = (user.uid === MASTER_ADMIN);
            
            if (!isAdmin && db) {
                try {
                    const adminDoc = await db.collection("settings").doc("admins").get();
                    if (adminDoc.exists) {
                        const adminList = adminDoc.data().uids || [];
                        isAdmin = adminList.includes(user.uid);
                    }
                } catch (e) {
                    console.error("Error reading admin settings:", e);
                }
            }
            
            // Check for Verification (to show Team Portal link)
            let isVerified = false;
            try {
                const claimSnapshot = await db.collection("claims").where("discordId", "==", user.uid).get();
                if (!claimSnapshot.empty && claimSnapshot.docs[0].data().status === 'verified') {
                    isVerified = true;
                }
            } catch (e) {
                console.error("Error checking verification for UI:", e);
            }
            
            const isSubdir = window.location.pathname.includes('/drivers/') || window.location.pathname.includes('/events/');
            const basePath = isSubdir ? "../" : "";
            
            // Replace the anchor with a div to avoid nested anchor issues
            const container = document.createElement('div');
            container.id = "login-link";
            container.style.marginLeft = "1.5rem";
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.gap = "8px";

            const adminLink = isAdmin ? `<a href="${basePath}admin.html" class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-radius: 4px;">Admin</a>` : '';
            const portalLink = isVerified ? `<a href="${basePath}portal.html" class="btn btn-primary" style="background: var(--secondary); padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-radius: 4px;">Portal</a>` : '';
            const profileLink = `<a href="${basePath}profile.html" class="btn btn-outline" style="padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-radius: 4px;">Profile</a>`;
            const logoutBtn = `<a href="#" onclick="if(confirm('Logout?')) firebase.auth().signOut()" class="btn btn-outline" style="padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-color: rgba(255,255,255,0.15); border-radius: 4px;"><img src="${avatar}" style="width: 16px; height: 16px; border-radius: 50%; vertical-align: middle; margin-right: 5px;"> Logout</a>`;

            container.innerHTML = `${adminLink}${portalLink}${profileLink}${logoutBtn}`;
            loginBtn.replaceWith(container);
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
                const displayName = data.discordName || "Verified Driver";
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
        // Fetch current profile data to get the custom driverName
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        const discordName = user.displayName || "Unknown Driver";
        const avatar = user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        const driverIdentity = userData.driverName || discordName;
        
        await db.collection("claims").doc(driverName).set({
            discordId: user.uid,
            discordName: discordName,
            driverIdentity: driverIdentity, // Store the custom name if set
            avatar: avatar,
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

// Race Lineup Dynamic Loading
async function loadRaceLineup(slug) {
    const container = document.querySelector('<!-- LINEUP_START -->').parentElement; // This is a bit hacky, better to use a specific ID if possible
    // Actually, I'll use a better approach: search for the markers in the DOM
    
    console.log("Loading race lineup for:", slug);
    if (!db) {
        setTimeout(() => loadRaceLineup(slug), 500);
        return;
    }

    try {
        const doc = await db.collection("race_lineups").doc(slug).get();
        if (doc.exists && doc.data().teams) {
            const teams = doc.data().teams;
            console.log("Firestore override found for:", slug);
            
            // Find the LINEUP_START and LINEUP_END markers to replace content
            // However, in the DOM, these are comment nodes.
            const iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT);
            let startNode, endNode;
            let node = iterator.nextNode();
            while (node) {
                if (node.textContent.trim() === "LINEUP_START") startNode = node;
                if (node.textContent.trim() === "LINEUP_END") endNode = node;
                node = iterator.nextNode();
            }

            if (startNode && endNode) {
                // Clear content between markers
                let current = startNode.nextSibling;
                while (current && current !== endNode) {
                    let next = current.nextSibling;
                    current.remove();
                    current = next;
                }

                // Insert new HTML
                const fragment = document.createDocumentFragment();
                const tempDiv = document.createElement('div');
                
                if (teams.length === 0) {
                    // Show placeholders for the 5 standard teams
                    const standardTeams = ["GRiD UP Sim Racing", "GRiD UP Black", "GRiD UP White", "GRiD UP Blue", "GRiD UP Red"];
                    let html = "";
                    standardTeams.forEach(name => {
                        html += `
                            <div class="lineup-item" style="margin-top: 1rem;">
                                <span style="color: var(--primary); font-weight: 600;">${name}</span>
                            </div>
                        `;
                    });
                    tempDiv.innerHTML = html;
                } else {
                    const standardTeams = ["GRiD UP Sim Racing", "GRiD UP Black", "GRiD UP White", "GRiD UP Blue", "GRiD UP Red"];
                    let html = "";
                    
                    // Create a map of existing teams
                    const teamMap = {};
                    teams.forEach(t => teamMap[t.name] = t);
                    
                    standardTeams.forEach(name => {
                        const team = teamMap[name];
                        if (team) {
                            html += `
                                <div class="lineup-item" style="margin-top: 1rem;">
                                    <span style="color: var(--primary); font-weight: 600;">${team.name}</span><br>
                                    <span style="font-size: 0.9rem; color: var(--text-muted);">${team.car_class || ""}</span>
                                </div>
                                <ul style="list-style: none; margin-top: 0.5rem; padding-left: 1rem; border-left: 2px solid var(--primary);">
                            `;
                            if (team.captain) html += `<li>${team.captain} (C)</li>`;
                            if (team.drivers) {
                                team.drivers.forEach(driver => {
                                    if (driver !== team.captain) html += `<li>${driver}</li>`;
                                });
                            }
                            html += `</ul>`;
                        } else {
                            // Empty placeholder
                            html += `
                                <div class="lineup-item" style="margin-top: 1rem;">
                                    <span style="color: var(--primary); font-weight: 600;">${name}</span>
                                </div>
                            `;
                        }
                    });
                    tempDiv.innerHTML = html;
                }

                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                startNode.parentNode.insertBefore(fragment, endNode);
            }
        }
    } catch (error) {
        console.error("Error loading lineup from Firestore:", error);
    }
}

// Initialize on page load
initAuth();
