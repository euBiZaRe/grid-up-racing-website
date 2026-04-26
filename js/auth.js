// GRiD UP - Authentication & Profile Claiming Engine
// Powered by Firebase

const firebaseConfig = {
  apiKey: "AIzaSyAomPdMD_IrBw52m0Nc2l-cuDKNmH_qqAk",
  authDomain: "grid-up.firebaseapp.com",
  projectId: "grid-up",
  storageBucket: "grid-up.firebasestorage.app",
  messagingSenderId: "649006432736",
  appId: "1:649006432736:web:5220f500a5e53cb7276b85",
  measurementId: "G-956CFQ680Q"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    var auth = firebase.auth();
    var db = firebase.firestore();
}

// Global Auth State
let AUTH_USER = null;
let IS_ADMIN = false;
let IS_VERIFIED = false;

// FAST-PATH: Restore UI from cache immediately to prevent flash
(function restoreCachedUI() {
    try {
        const cached = localStorage.getItem('gridup_auth_cache');
        if (cached) {
            const data = JSON.parse(cached);
            // Wait for DOM to be ready to update UI safely
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    IS_ADMIN = data.isAdmin;
                    IS_VERIFIED = data.isVerified;
                    updateAuthUI(data.user, true);
                });
            } else {
                IS_ADMIN = data.isAdmin;
                IS_VERIFIED = data.isVerified;
                updateAuthUI(data.user, true);
            }
        } else {
            // No cache: hide login link by default to prevent flash if we might be logged in
            const style = document.createElement('style');
            style.id = 'auth-flash-prevention';
            style.textContent = '#login-link { visibility: hidden !important; }';
            document.head.appendChild(style);
        }
    } catch (e) { console.error("Cache Restore Error:", e); }
})();

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
    console.log("GRiD UP Auth: Initializing Listener...");
    auth.onAuthStateChanged(async (user) => {
        console.log("Auth State Changed. User:", user ? user.uid : "None");
        
        // Remove flash prevention once we know the actual state
        const flashStyle = document.getElementById('auth-flash-prevention');
        if (flashStyle) flashStyle.remove();

        AUTH_USER = user;
        
        if (user) {
            // Update cache with basic user info
            const cached = JSON.parse(localStorage.getItem('gridup_auth_cache') || '{}');
            localStorage.setItem('gridup_auth_cache', JSON.stringify({
                user: { uid: user.uid, photoURL: user.photoURL, displayName: user.displayName },
                isAdmin: cached.isAdmin || false,
                isVerified: cached.isVerified || false
            }));

            // 1. Immediate UI update
            updateAuthUI(user);
            
            // 2. Background Enrichment (Admin/Verification)
            enrichAuthData(user);
        } else {
            localStorage.removeItem('gridup_auth_cache');
            updateAuthUI(null);
            handleLogOutRedirect();
        }

        // Trigger page-specific hooks if they exist
        if (typeof onAuthReady === 'function') {
            onAuthReady(user);
        }
    });
}

async function enrichAuthData(user) {
    // Check for Admin status (Master + Firestore)
    const MASTER_ADMIN = 'B0t4f4nqqpZIQKpT8Ed97xka5gM2';
    IS_ADMIN = (user.uid === MASTER_ADMIN);
    
    if (!IS_ADMIN && db) {
        try {
            const adminDoc = await db.collection("settings").doc("admins").get();
            if (adminDoc.exists) {
                const admins = adminDoc.data().uids || [];
                IS_ADMIN = admins.includes(user.uid);
            }
        } catch (e) { console.warn("Admin Check Error:", e); }
    }

    // Check for Verification
    try {
        const claimSnapshot = await db.collection("claims").where("discordId", "==", user.uid).get();
        if (!claimSnapshot.empty && claimSnapshot.docs[0].data().status === 'verified') {
            IS_VERIFIED = true;
        }
    } catch (e) { console.warn("Verification Check Error:", e); }

    // Re-update UI with enriched data
    updateAuthUI(user);

    // Save enriched state to cache
    localStorage.setItem('gridup_auth_cache', JSON.stringify({
        user: { uid: user.uid, photoURL: user.photoURL, displayName: user.displayName },
        isAdmin: IS_ADMIN,
        isVerified: IS_VERIFIED
    }));
    
    // Trigger page-specific data hooks
    if (typeof onAuthEnriched === 'function') {
        onAuthEnriched(user, { isAdmin: IS_ADMIN, isVerified: IS_VERIFIED });
    }
}

function handleLogOutRedirect() {
    const protectedPages = ['admin.html', 'portal.html', 'profile.html'];
    const pathParts = window.location.pathname.split('/');
    const currentPage = pathParts[pathParts.length - 1];
    
    if (protectedPages.includes(currentPage)) {
        // Handle subdirectory relative path
        const isSubdir = window.location.pathname.includes('/events/') || window.location.pathname.includes('/drivers/');
        const basePath = isSubdir ? "../" : "";
        window.location.href = basePath + "login.html";
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
async function updateAuthUI(user, isTentative = false) {
    const loginBtn = document.getElementById('login-link');
    const claimSection = document.getElementById('claim-section');
    const driverTitle = document.querySelector('h1.glow-text');

    // Auto-detect relative path prefix
    const isSubdir = window.location.pathname.includes('/events/') || window.location.pathname.includes('/drivers/');
    const basePath = isSubdir ? "../" : "";

    if (user) {
        let avatar = user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        
        // A. Handle Navbar UI
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

            const portalLink = (IS_VERIFIED || IS_ADMIN) ? `<a href="${basePath}portal.html" class="btn btn-primary" style="background: var(--secondary); padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-radius: 4px;">Portal</a>` : '';
            const profileLink = `<a href="${basePath}profile.html" class="btn btn-outline" style="padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-radius: 4px;">Profile</a>`;
            const logoutBtn = `<a href="#" onclick="if(confirm('Logout?')) firebase.auth().signOut()" class="btn btn-outline" style="padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-color: rgba(255,255,255,0.15); border-radius: 4px;"><img src="${avatar}" style="width: 16px; height: 16px; border-radius: 50%; vertical-align: middle; margin-right: 5px;"> Logout</a>`;

            container.innerHTML = `${portalLink}${profileLink}${logoutBtn}`;
            
            if (loginBtn) {
                loginBtn.replaceWith(container);
            } else if (!document.getElementById('navbar-user-ui')) {
                if (navLinks.tagName === 'UL' || navLinks.tagName === 'OL') {
                    const li = document.createElement('li');
                    li.id = "navbar-user-li";
                    li.appendChild(container);
                    navLinks.appendChild(li);
                } else {
                    navLinks.appendChild(container);
                }
            }
        }

        // B. Handle Profile Page Admin Button
        const adminProfileBtn = document.getElementById('admin-dashboard-btn');
        if (adminProfileBtn) {
            adminProfileBtn.style.display = IS_ADMIN ? 'inline-block' : 'none';
            adminProfileBtn.href = `${basePath}admin.html`;
        }
        
        // C. Profile Claim status check
        if (claimSection && driverTitle) {
            checkClaimStatus(driverTitle.textContent.trim(), user);
        }
    } else {
        // Logged Out State
        const userUI = document.getElementById('navbar-user-ui');
        const userLI = document.getElementById('navbar-user-li');
        if (userUI) userUI.remove();
        if (userLI) userLI.remove();

        const navLinks = document.querySelector('.nav-links');
        if (!document.getElementById('login-link') && navLinks) {
            const loginHtml = `<a href="${basePath}login.html" id="login-link" class="btn btn-outline" style="padding: 0.5rem 1.25rem; font-size: 0.8rem; margin-left: 1rem;">Login</a>`;
            if (navLinks.tagName === 'UL' || navLinks.tagName === 'OL') {
                const li = document.createElement('li');
                li.innerHTML = loginHtml;
                navLinks.appendChild(li);
            } else {
                navLinks.insertAdjacentHTML('beforeend', loginHtml);
            }
        }
        
        if (claimSection) claimSection.style.display = 'none';
    }
}

// Check if a profile is already claimed/pending
async function checkClaimStatus(driverName, user) {
    const claimSection = document.getElementById('claim-section');
    if (!claimSection) return;
    
    console.log("Checking claim status for:", driverName);

    if (!db) {
        setTimeout(() => checkClaimStatus(driverName, user), 500);
        return;
    }

    try {
        const docSnapshot = await db.collection("claims").doc(driverName).get();
        claimSection.style.display = 'block';
        
        if (docSnapshot.exists) {
            const data = docSnapshot.data();
            if (data.status === "verified") {
                claimSection.innerHTML = `<div class="badge-verified" style="background: rgba(0, 207, 255, 0.1); color: var(--primary); padding: 0.75rem 1.5rem; border: 1px solid var(--primary); border-radius: 4px; display: inline-block; font-weight: 700;">✓ VERIFIED TEAM MEMBER</div>`;
            } else {
                claimSection.innerHTML = `<div class="badge-pending" style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); padding: 0.75rem 1.5rem; border: 1px solid var(--glass-border); border-radius: 4px; display: inline-block;">CLAIM PENDING VERIFICATION</div>`;
            }
        } else {
            claimSection.innerHTML = `<button class="btn btn-outline claim-btn" onclick="openClaimModal()" style="font-size: 0.75rem; padding: 0.6rem 1.5rem;">Claim This Driver Profile</button>`;
        }
    } catch (error) {
        console.error("Error checking claim status:", error);
        claimSection.style.display = 'block';
        claimSection.innerHTML = `<button class="btn btn-outline claim-btn" onclick="openClaimModal()" style="font-size: 0.75rem; padding: 0.6rem 1.5rem;">Claim This Driver Profile</button>`;
    }
}

// Profile Claiming Logic
async function claimProfile(driverName, iracingId) {
    const user = auth.currentUser;
    if (!user) return alert("Please login first.");

    try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        const discordName = user.displayName || "Unknown Driver";
        const avatar = user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        const driverIdentity = userData.driverName || discordName;
        
        await db.collection("claims").doc(driverName).set({
            discordId: user.uid,
            discordName: discordName,
            driverIdentity: driverIdentity,
            avatar: avatar,
            iracingId: iracingId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "pending"
        });
        alert("Claim request sent! An admin will verify your identity shortly.");
        updateAuthUI(user);
    } catch (error) {
        console.error("Error claiming profile:", error);
        alert("Error sending claim: " + error.message);
    }
}

// Race Lineup Dynamic Loading
async function loadRaceLineup(slug) {
    if (!db) {
        setTimeout(() => loadRaceLineup(slug), 500);
        return;
    }

    try {
        const doc = await db.collection("race_lineups").doc(slug).get();
        if (doc.exists && doc.data().teams) {
            const teams = doc.data().teams;
            
            const allDriverNames = new Set();
            teams.forEach(t => {
                if (t.captain) allDriverNames.add(t.captain);
                if (t.drivers) t.drivers.forEach(d => allDriverNames.add(d));
            });
            
            const profileMap = {};
            if (allDriverNames.size > 0) {
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

            const searchRoot = document.getElementById('confirmed-lineup') || document.body;
            const iterator = document.createNodeIterator(searchRoot, NodeFilter.SHOW_COMMENT);
            let startNode, endNode;
            let node = iterator.nextNode();
            while (node) {
                if (node.textContent.trim() === "LINEUP_START") startNode = node;
                if (node.textContent.trim() === "LINEUP_END") endNode = node;
                node = iterator.nextNode();
            }

            if (startNode && endNode) {
                let current = startNode.nextSibling;
                while (current && current !== endNode) {
                    let next = current.nextSibling;
                    current.remove();
                    current = next;
                }

                const fragment = document.createDocumentFragment();
                const tempDiv = document.createElement('div');
                
                if (teams.length === 0) {
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
                    let html = "";
                    teams.forEach(team => {
                        html += `
                            <div class="lineup-item" style="margin-top: 1rem;">
                                <span style="color: var(--primary); font-weight: 600;">${team.name}</span><br>
                                <span style="font-size: 0.9rem; color: var(--text-muted);">${team.car_class || ""}</span>
                            </div>
                            <ul style="list-style: none; margin-top: 0.5rem; padding-left: 1rem; border-left: 2px solid var(--primary);">
                        `;
                        if (team.captain) html += `<li>${renderDriver(team.captain)} (C)</li>`;
                        if (team.drivers) {
                            team.drivers.forEach(driver => {
                                if (driver !== team.captain) html += `<li>${renderDriver(driver)}</li>`;
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
        }
    } catch (error) {
        console.error("Error loading lineup from Firestore:", error);
    }
}

// Initialize on page load
initAuth();
