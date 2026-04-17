// Grid Up - Authentication & Profile Claiming Engine
// Powered by Firebase

// NOTE: Replace these with your actual Firebase project config from the Firebase Console
// Official Grid Up Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAomPdMD_IrBw52m0Nc2l-cuDKNmH_qqAk",
  authDomain: "gridup.online",
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

// --- GLOBAL STYLES FOR SOCIALS ---
if (typeof document !== 'undefined' && !document.getElementById('social-styles')) {
    const style = document.createElement('style');
    style.id = 'social-styles';
    style.textContent = `
        .social-links-lineup { display: inline-flex; gap: 8px; margin-left: 12px; vertical-align: middle; }
        .social-icon-sm { width: 16px; height: 16px; opacity: 0.7; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); vertical-align: middle; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
        .social-icon-sm:hover { opacity: 1; transform: scale(1.2) translateY(-2px); }
        .live-pulse {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #ff0055;
            border-radius: 50%;
            margin-right: 6px;
            box-shadow: 0 0 0 rgba(255,0,85, 0.4);
            animation: pulse 1.5s infinite;
            vertical-align: middle;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255,0,85, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(255,0,85, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255,0,85, 0); }
        }
    `;
    document.head.appendChild(style);
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

    // Auto-detect relative path prefix based on depth
    const isSubdir = window.location.pathname.includes('/events/') || window.location.pathname.includes('/drivers/');
    const basePath = isSubdir ? "../" : "";

    if (user) {
        console.log("Updating UI for logged-in user:", user.uid);
        
        // Check for Admin status (Master + Firestore)
        const MASTER_ADMIN = 'B0t4f4nqqpZIQKpT8Ed97xka5gM2';
        let isAdmin = (user.uid === MASTER_ADMIN);
        if (!isAdmin && db) {
            try {
                const adminDoc = await db.collection("settings").doc("admins").get();
                if (adminDoc.exists) {
                    const admins = adminDoc.data().uids || [];
                    isAdmin = admins.includes(user.uid);
                }
            } catch (e) { console.warn("Admin Check Error:", e); }
        }

        // Check for Verification
        let isVerified = false;
        try {
            const claimSnapshot = await db.collection("claims").where("discordId", "==", user.uid).get();
            if (!claimSnapshot.empty && claimSnapshot.docs[0].data().status === 'verified') {
                isVerified = true;
            }
        } catch (e) { console.warn("Verification Check Error:", e); }

        let avatar = user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        
        // Fetch custom avatar from Firestore if it exists
        if (db) {
            try {
                const userDoc = await db.collection("users").doc(user.uid).get();
                if (userDoc.exists && userDoc.data().customAvatarUrl) {
                    avatar = userDoc.data().customAvatarUrl;
                }
            } catch (e) {
                console.warn("Auth: Error fetching custom avatar:", e);
            }
        }
        
        // A. Handle Navbar UI (Replace #login-link or Append to .nav-links)
        const navLinks = document.querySelector('.nav-links');
        if (loginBtn || navLinks) {
            let container = document.getElementById('navbar-user-ui');
            if (!container) {
                container = document.createElement('div');
                container.id = "navbar-user-ui";
                container.style.marginLeft = "1.5rem";
                container.style.display = "flex";
                container.style.alignItems = "center";
                container.style.gap = "8px";
            }

            // Construct Inner HTML (Admin is REMOVED from navbar, moved to Profile)
            const portalLink = (isVerified || isAdmin) ? `<a href="${basePath}portal.html" class="btn btn-primary" style="background: var(--secondary); padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-radius: 4px;">Portal</a>` : '';
            const profileLink = `<a href="${basePath}profile.html" class="btn btn-outline" style="padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-radius: 4px;">Profile</a>`;
            const logoutBtn = `<a href="#" onclick="if(confirm('Logout?')) firebase.auth().signOut()" class="btn btn-outline" style="padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-color: rgba(255,255,255,0.15); border-radius: 4px;"><img src="${avatar}" style="width: 16px; height: 16px; border-radius: 50%; vertical-align: middle; margin-right: 5px;"> Logout</a>`;

            container.innerHTML = `${portalLink}${profileLink}${logoutBtn}`;
            
            if (loginBtn) {
                loginBtn.replaceWith(container);
            } else if (navLinks && !document.getElementById('navbar-user-ui')) {
                // Check if navLinks is a list or a div
                if (navLinks.tagName === 'UL' || navLinks.tagName === 'OL') {
                    const li = document.createElement('li');
                    li.appendChild(container);
                    navLinks.appendChild(li);
                } else {
                    navLinks.appendChild(container);
                }
            }
        }

        // B. Handle Profile Page Admin Button
        const adminProfileBtn = document.getElementById('admin-dashboard-btn');
        if (adminProfileBtn && isAdmin) {
            adminProfileBtn.style.display = 'inline-block';
            adminProfileBtn.href = `${basePath}admin.html`;
        }
        
        // C. Handle Driver Profile logic (Claim checking)
        if (claimSection && driverTitle) {
            const driverName = driverTitle.textContent.trim();
            checkClaimStatus(driverName, user);
        }
    } else {
        // Logged Out State
        const navLinks = document.querySelector('.nav-links');
        const userUI = document.getElementById('navbar-user-ui');

        if (loginBtn) {
            loginBtn.textContent = "Login";
            loginBtn.href = `${basePath}login.html`;
            loginBtn.onclick = null;
        } else if (navLinks && !userUI) {
            if (navLinks.tagName === 'UL' || navLinks.tagName === 'OL') {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${basePath}login.html" id="login-link" class="btn btn-outline" style="padding: 0.5rem 1.25rem; font-size: 0.8rem; margin-left: 1rem;">Login</a>`;
                navLinks.appendChild(li);
            } else {
                const a = document.createElement('a');
                a.href = `${basePath}login.html`;
                a.id = "login-link";
                a.className = "btn btn-outline";
                a.style.padding = "0.5rem 1.25rem";
                a.style.fontSize = "0.8rem";
                a.style.marginLeft = "1rem";
                a.textContent = "Login";
                navLinks.appendChild(a);
            }
        }
        
        if (claimSection) claimSection.style.display = 'none';
        if (userUI) userUI.remove();
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
    console.log("Loading race lineup for:", slug);
    if (!db) {
        setTimeout(() => loadRaceLineup(slug), 500);
        return;
    }

    try {
        console.log("Auth: Fetching lineup for slug:", slug);
        const doc = await db.collection("race_lineups").doc(slug).get();
        if (doc.exists && doc.data().teams) {
            const teams = doc.data().teams;
            console.log("Auth: Lineup found! Team count:", teams.length);
            
            // Collect all unique driver names to fetch their profiles
            const allDriverNames = new Set();
            teams.forEach(t => {
                if (t.captain) allDriverNames.add(t.captain);
                if (t.drivers) t.drivers.forEach(d => allDriverNames.add(d));
            });
            
            const profileMap = {};
            if (allDriverNames.size > 0) {
                // Fetch profiles in batches of 10 (Firestore 'in' query limit)
                const nameArray = Array.from(allDriverNames);
                const batches = [];
                for (let i = 0; i < nameArray.length; i += 10) {
                    batches.push(nameArray.slice(i, i + 10));
                }
                
                for (const batch of batches) {
                    const snap = await db.collection("users").where("driverName", "in", batch).get();
                    snap.forEach(pDoc => {
                        const pData = pDoc.data();
                        profileMap[pData.driverName] = pData;
                    });
                }
            }
            
            // Helper to render driver with socials
            const renderDriver = (name) => {
                const p = profileMap[name];
                let socialHtml = `<span class="social-links-lineup">`;
                if (p) {
                    if (p.twitchUrl) {
                        socialHtml += `<a href="${p.twitchUrl}" target="_blank" title="Watch on Twitch"><span class="live-pulse"></span><img src="https://cdn-icons-png.flaticon.com/512/5968/5968819.png" class="social-icon-sm"></a>`;
                    }
                    if (p.tiktokUrl) {
                        socialHtml += `<a href="${p.tiktokUrl}" target="_blank" title="Follow on TikTok"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046124.png" class="social-icon-sm"></a>`;
                    }
                    if (p.youtubeUrl) {
                        socialHtml += `<a href="${p.youtubeUrl}" target="_blank" title="Subscribe on YouTube"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" class="social-icon-sm"></a>`;
                    }
                }
                socialHtml += `</span>`;
                return `${name}${socialHtml}`;
            };

            // Find the LINEUP_START and LINEUP_END markers to replace content
            const searchRoot = document.getElementById('confirmed-lineup') || document.body;
            const iterator = document.createNodeIterator(searchRoot, NodeFilter.SHOW_COMMENT);
            let startNode, endNode;
            let node = iterator.nextNode();
            while (node) {
                if (node.textContent.trim() === "LINEUP_START") startNode = node;
                if (node.textContent.trim() === "LINEUP_END") endNode = node;
                node = iterator.nextNode();
            }
            console.log("Auth: Markers found:", !!startNode, !!endNode);

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
                    // SHOW EVERYTHING: Iterate through all teams saved in Firestore
                    let html = "";
                    teams.forEach(team => {
                        html += `
                            <div class="lineup-item" style="margin-top: 1rem;">
                                <span style="color: var(--primary); font-weight: 600;">${team.name}</span><br>
                                <span style="font-size: 0.9rem; color: var(--text-muted);">${team.car_class || ""}</span>
                            </div>
                            <ul style="list-style: none; margin-top: 0.5rem; padding-left: 1rem; border-left: 2px solid var(--primary);">
                        `;
                        
                        // Render Captain
                        if (team.captain) {
                            html += `<li>${renderDriver(team.captain)} (C)</li>`;
                        }
                        
                        // Render Roster
                        if (team.drivers && team.drivers.length > 0) {
                            team.drivers.forEach(driver => {
                                // Don't duplicate if driver is also captain
                                if (driver !== team.captain) {
                                    html += `<li>${renderDriver(driver)}</li>`;
                                }
                            });
                        }
                        
                        html += `</ul>`;
                    });
                    tempDiv.innerHTML = html;
                }

                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                startNode.parentNode.insertBefore(fragment, endNode);
            }
        } else {
            console.warn("Auth: No lineup record exists for slug:", slug);
        }
    } catch (error) {
        console.error("Error loading lineup from Firestore:", error);
    }
}

// Initialize on page load
initAuth();
