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
    window.db = db;
    window.auth = auth;
}

// Global Auth State
let AUTH_USER = null;
let IS_ADMIN = false;
let IS_VERIFIED = false;
let PORTAL_HAS_UNREAD = false;
let appNotificationUnsub = null;

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

        if (user) {
            // Check if user.displayName is generic/empty, and try to retrieve the real username from the token claims
            if (!user.displayName || user.displayName === 'Discord User' || user.displayName === 'Unknown Driver') {
                try {
                    const tokenResult = await user.getIdTokenResult();
                    const claims = tokenResult.claims;
                    const realUsername = claims.preferred_username || claims.username || claims.name;
                    if (realUsername && realUsername !== user.displayName) {
                        await user.updateProfile({ displayName: realUsername });
                        console.log("GRiD UP Auth: Successfully updated displayName to:", realUsername);
                        // Refresh the user object reference
                        user = auth.currentUser;
                    }
                } catch (e) {
                    console.error("GRiD UP Auth: Error auto-resolving Discord username:", e);
                }
            }

            // Sync basic user info to Firestore users collection
            try {
                if (db) {
                    const tokenResult = await user.getIdTokenResult().catch(() => null);
                    await db.collection("users").doc(user.uid).set({
                        discordName: user.displayName || null,
                        photoURL: user.photoURL || null,
                        email: user.email || null,
                        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                        debugInfo: {
                            displayName: user.displayName || null,
                            email: user.email || null,
                            photoURL: user.photoURL || null,
                            providerData: user.providerData.map(p => ({
                                providerId: p.providerId,
                                uid: p.uid,
                                displayName: p.displayName || null,
                                email: p.email || null,
                                photoURL: p.photoURL || null
                            })),
                            claims: tokenResult ? tokenResult.claims : null
                        }
                    }, { merge: true });
                }
            } catch (e) {
                console.warn("GRiD UP Auth: Failed to sync user to Firestore:", e);
            }
        }

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

            // 3. Watch for application notifications
            watchApplicationNotification(user);
        } else {
            if (appNotificationUnsub) {
                appNotificationUnsub();
                appNotificationUnsub = null;
            }
            PORTAL_HAS_UNREAD = false;
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
        const path = window.location.pathname;
        let basePath = '';
        if (path.includes('/events/past/')) {
            basePath = '../../';
        } else if (path.includes('/events/') || path.includes('/drivers/')) {
            basePath = '../';
        }
        window.location.href = basePath + "login.html";
    }
}

// Discord Login Flow
function loginWithDiscord() {
    console.log("Starting Discord Login...");
    const provider = new firebase.auth.OAuthProvider('oidc.discord');
    auth.signInWithPopup(provider).then(async (result) => {
        const profile = result.additionalUserInfo?.profile;
        console.log("Login Success. Profile:", profile);
        
        let discordUsername = 'Discord User';
        if (profile) {
            discordUsername = profile.preferred_username || profile.username || profile.name || result.user.displayName || 'Discord User';
        } else if (result.user.displayName) {
            discordUsername = result.user.displayName;
        }
        
        try {
            if (result.user) {
                await result.user.updateProfile({ displayName: discordUsername });
                console.log("Updated auth profile displayName to:", discordUsername);
            }
            
            if (db && result.user) {
                await db.collection("users").doc(result.user.uid).set({
                    discordName: discordUsername,
                    photoURL: result.user.photoURL || (profile ? (profile.picture || profile.avatar) : null),
                    email: result.user.email || (profile ? profile.email : null),
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                console.log("Synced user info to Firestore users collection");
            }
        } catch (err) {
            console.error("Error updating user info after login:", err);
        }
        
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
    const path = window.location.pathname;
    let basePath = '';
    if (path.includes('/events/past/')) {
        basePath = '../../';
    } else if (path.includes('/events/') || path.includes('/drivers/')) {
        basePath = '../';
    }

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

            const portalLink = `<a href="${basePath}portal.html" id="navbar-portal-btn" class="btn btn-primary" style="position: relative; padding: 0.4rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-radius: 4px;">Portal<span id="portal-badge" style="display: ${PORTAL_HAS_UNREAD ? 'block' : 'none'}; position: absolute; top: -4px; right: -4px; width: 8px; height: 8px; background-color: #ff3b30; border-radius: 50%; border: 1px solid #fff; box-shadow: 0 0 4px rgba(255,59,48,0.6);"></span></a>`;
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
    
    const cleanDriverName = String(driverName).trim();
    console.log("Checking claim status for:", cleanDriverName);

    if (!db) {
        setTimeout(() => checkClaimStatus(cleanDriverName, user), 500);
        return;
    }

    try {
        const docSnapshot = await db.collection("claims").doc(cleanDriverName).get();
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
async function claimProfile(driverName, iracingId = "") {
    const user = auth.currentUser;
    if (!user) return alert("Please login first.");

    const cleanDriverName = String(driverName).trim();

    try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        const discordName = user.displayName || "Unknown Driver";
        const avatar = user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        const driverIdentity = userData.driverName || discordName;
        
        await db.collection("claims").doc(cleanDriverName).set({
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

function watchApplicationNotification(user) {
    if (appNotificationUnsub) {
        appNotificationUnsub();
        appNotificationUnsub = null;
    }
    if (!db || !user) return;

    // Resolve the application document ID first, then watch it directly.
    // This avoids Firestore security rule issues with collection-level onSnapshot queries.
    resolveAndWatchApplication(user);
}

async function resolveAndWatchApplication(user) {
    let appDocId = null;

    try {
        // 1. Try by UID
        const snapUid = await db.collection('applications').where('discordUid', '==', user.uid).get();
        if (!snapUid.empty) {
            appDocId = snapUid.docs[0].id;
        }
    } catch (e) {
        console.warn("Notification: UID query failed:", e.message);
    }

    // 2. Fallback: try by display name
    if (!appDocId && user.displayName && user.displayName !== 'Discord User' && user.displayName !== 'Unknown Driver') {
        try {
            const snapName = await db.collection('applications').where('discordUsername', '==', user.displayName).get();
            if (!snapName.empty) {
                appDocId = snapName.docs[0].id;
                // Proactively link their UID for future lookups
                try {
                    await db.collection('applications').doc(appDocId).update({ discordUid: user.uid });
                } catch (linkErr) {
                    console.warn("Notification: Failed to link discordUid:", linkErr.message);
                }
            }
        } catch (e) {
            console.warn("Notification: Username query failed:", e.message);
        }
    }

    if (!appDocId) {
        console.log("Notification: No application found for user", user.uid);
        return;
    }

    console.log("Notification: Watching application doc:", appDocId);

    // 3. Watch the specific document by ID (not a collection query)
    const unsub = db.collection('applications').doc(appDocId)
        .onSnapshot(doc => {
            if (!doc.exists) {
                PORTAL_HAS_UNREAD = false;
                updateNotificationBadge();
                return;
            }
            const data = doc.data();
            PORTAL_HAS_UNREAD = !!data.unreadApplicant;
            updateNotificationBadge();
        }, err => {
            console.warn("Notification: Error watching application doc:", err.message);
        });

    appNotificationUnsub = unsub;
}

function updateNotificationBadge() {
    const badge = document.getElementById('portal-badge');
    if (badge) {
        badge.style.display = PORTAL_HAS_UNREAD ? 'block' : 'none';
    }
}

// Initialize on page load
initAuth();

// Initialize Bug/Suggestion Reporter
(function initBugReporter() {
    if (typeof document === 'undefined') return;

    // Helper to inject modal HTML, CSS and logic
    const setupReporter = () => {
        // Find or wait for footer container, fallback to footer itself
        let footerContainer = document.querySelector('footer .container');
        let fallback = false;
        if (!footerContainer) {
            footerContainer = document.querySelector('footer');
            fallback = true;
        }
        if (!footerContainer) return;

        // Check if already injected
        if (document.getElementById('bug-report-trigger')) return;

        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            .bug-report-footer-link {
                color: var(--text-muted);
                opacity: 0.6;
                text-decoration: none;
                font-size: 0.8rem;
                transition: opacity 0.3s ease, color 0.3s ease;
                cursor: pointer;
                display: inline-block;
                margin-top: 0.5rem;
            }
            .bug-report-footer-link:hover {
                opacity: 1;
                color: #ff0055;
            }
            .bug-modal-overlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.85);
                z-index: 10005;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .bug-modal-overlay.active {
                display: flex;
                opacity: 1;
            }
            .bug-modal-card {
                background: rgba(18, 18, 18, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                padding: 2rem;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 0, 85, 0.15);
                position: relative;
                transform: scale(0.9);
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .bug-modal-overlay.active .bug-modal-card {
                transform: scale(1);
            }
            .bug-modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                color: var(--text-muted);
                font-size: 1.5rem;
                cursor: pointer;
                transition: color 0.2s;
            }
            .bug-modal-close:hover {
                color: #fff;
            }
            .bug-form-group {
                margin-bottom: 1.25rem;
            }
            .bug-form-group label {
                display: block;
                color: #fff;
                font-size: 0.85rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .bug-form-input, .bug-form-textarea, .bug-form-select {
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #fff;
                padding: 0.75rem;
                border-radius: 6px;
                font-family: inherit;
                font-size: 0.9rem;
                transition: border-color 0.2s, background 0.2s;
            }
            .bug-form-input:focus, .bug-form-textarea:focus, .bug-form-select:focus {
                outline: none;
                border-color: #ff0055;
                background: rgba(255, 255, 255, 0.08);
            }
            .bug-form-textarea {
                height: 120px;
                resize: vertical;
            }
            .bug-submit-btn {
                background: #ff0055;
                color: #fff;
                border: none;
                padding: 0.75rem 1.5rem;
                font-weight: 700;
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.2s, transform 0.1s;
                width: 100%;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .bug-submit-btn:hover {
                background: #ff2a73;
            }
            .bug-submit-btn:active {
                transform: scale(0.98);
            }
            .bug-submit-btn:disabled {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-muted);
                cursor: not-allowed;
            }
            .bug-form-select option {
                background: #121212;
                color: #fff;
            }
        `;
        document.head.appendChild(style);

        // Inject Link to Footer
        const linkContainer = document.createElement('div');
        linkContainer.style.textAlign = 'center';
        linkContainer.style.marginTop = '0.5rem';
        
        const link = document.createElement('span');
        link.id = 'bug-report-trigger';
        link.className = 'bug-report-footer-link';
        link.textContent = 'Report a Bug / Suggestion';
        
        linkContainer.appendChild(link);
        
        // Find copyright para or append to footer container
        const copyrightPara = footerContainer.querySelector('p');
        if (copyrightPara) {
            copyrightPara.parentNode.insertBefore(linkContainer, copyrightPara.nextSibling);
        } else {
            footerContainer.appendChild(linkContainer);
        }

        // Create and Inject Modal HTML
        const modalHtml = `
            <div id="bug-report-modal" class="bug-modal-overlay">
                <div class="bug-modal-card">
                    <button class="bug-modal-close" id="bug-modal-close-btn">&times;</button>
                    <h3 style="color: #fff; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Report Bug / Suggestion</h3>
                    
                    <form id="bug-report-form">
                        <div class="bug-form-group">
                            <label for="bug-type">Type</label>
                            <select id="bug-type" class="bug-form-select" required>
                                <option value="Suggestion">Suggestion</option>
                                <option value="Bug Report">Bug Report</option>
                                <option value="Driver Profile Update">Driver Profile Update</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div class="bug-form-group">
                            <label for="bug-discord">Discord Username (Optional)</label>
                            <input type="text" id="bug-discord" class="bug-form-input" placeholder="e.g. username#1234">
                        </div>
                        
                        <div class="bug-form-group">
                            <label for="bug-message">Message</label>
                            <textarea id="bug-message" class="bug-form-textarea" placeholder="Provide details about your bug or suggestion..." required></textarea>
                        </div>
                        
                        <button type="submit" class="bug-submit-btn" id="bug-submit-btn">Submit Report</button>
                        
                        <div id="bug-feedback-msg" style="margin-top: 1rem; text-align: center; font-size: 0.85rem; display: none;"></div>
                    </form>
                </div>
            </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        document.body.appendChild(tempDiv.firstElementChild);

        // Modal Functionality
        const modal = document.getElementById('bug-report-modal');
        const closeBtn = document.getElementById('bug-modal-close-btn');
        const form = document.getElementById('bug-report-form');
        const feedbackMsg = document.getElementById('bug-feedback-msg');
        const submitBtn = document.getElementById('bug-submit-btn');

        const openModal = () => {
            modal.classList.add('active');
            // Pre-populate discord if user logged in
            if (AUTH_USER && AUTH_USER.displayName) {
                document.getElementById('bug-discord').value = AUTH_USER.displayName;
            }
        };

        const closeModal = () => {
            modal.classList.remove('active');
            form.reset();
            feedbackMsg.style.display = 'none';
        };

        link.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const type = document.getElementById('bug-type').value;
            const discord = document.getElementById('bug-discord').value.trim();
            const message = document.getElementById('bug-message').value.trim();
            
            if (!message) return;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            try {
                if (!window.db) {
                    throw new Error("Database not initialized yet.");
                }
                
                await window.db.collection('suggestions').add({
                    type,
                    discord,
                    message,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: AUTH_USER ? AUTH_USER.uid : null,
                    pageUrl: window.location.href,
                    status: 'new'
                });
                
                feedbackMsg.style.color = '#10B981';
                feedbackMsg.textContent = 'Thank you! Your feedback has been submitted successfully.';
                feedbackMsg.style.display = 'block';
                
                setTimeout(() => {
                    closeModal();
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Report';
                }, 3000);
                
            } catch (err) {
                console.error("Error submitting bug/suggestion:", err);
                feedbackMsg.style.color = '#EF4444';
                feedbackMsg.textContent = 'Failed to submit report. Please try again.';
                feedbackMsg.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Report';
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupReporter);
    } else {
        setupReporter();
    }
})();

async function loadDriverCustomInfo(driverName) {
    const dbInterval = setInterval(async () => {
        if (window.db) {
            clearInterval(dbInterval);
            try {
                const claimDoc = await window.db.collection("claims").doc(driverName).get();
                if (claimDoc.exists && claimDoc.data().status === 'verified') {
                    const discordId = claimDoc.data().discordId;
                    if (discordId) {
                        const userDoc = await window.db.collection("users").doc(discordId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            
                            if (userData.customAvatarUrl) {
                                const avatarEl = document.getElementById("driver-avatar-container") || document.querySelector(".driver-avatar-container");
                                if (avatarEl) {
                                    avatarEl.innerHTML = `<img src="${userData.customAvatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                                }
                            }
                            if (userData.age) {
                                const ageEl = document.getElementById("profile-age");
                                if (ageEl) ageEl.textContent = userData.age;
                            }
                            if (userData.country) {
                                const countryEl = document.getElementById("profile-country");
                                if (countryEl) countryEl.textContent = userData.country;
                            }
                            if (userData.favCar) {
                                const favCarEl = document.getElementById("profile-fav-car");
                                if (favCarEl) favCarEl.textContent = userData.favCar;
                            }
                            if (userData.favTrack) {
                                const favTrackEl = document.getElementById("profile-fav-track");
                                if (favTrackEl) favTrackEl.textContent = userData.favTrack;
                            }
                            if (userData.advice) {
                                const adviceEl = document.getElementById("profile-advice");
                                if (adviceEl) adviceEl.textContent = `"${userData.advice}"`;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Error loading driver custom info:", e);
            }
        }
    }, 100);
}

window.loadDriverCustomInfo = loadDriverCustomInfo;
