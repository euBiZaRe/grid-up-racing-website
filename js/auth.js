// ===============================================================
// INSTANT MAINTENANCE INTERCEPTOR
// If maintenance mode is active, completely block website display
// and redirect visitor to maintenance.html
// ===============================================================
(function() {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (path.endsWith('maintenance.html') || path.endsWith('login.html')) return;

    try {
        const cached = JSON.parse(localStorage.getItem('gridup_auth_cache') || '{}');
        const uid = cached.user ? cached.user.uid : null;
        const admins = ['B0t4f4nqqpZIQKpT8Ed97xka5gM2', '8nojtKUFKUUKDFFpnU6EdueLhkN2', 'uYUa2WYZ5TPg98vle6jQzzrItR53', '2TfuhZVILNQerQK95YL1304jYp83'];
        if (uid && admins.includes(uid)) return;
    } catch(_) {}

    // 1. Instant Cache Interceptor
    if (localStorage.getItem('gridup_maint_active') === 'true') {
        document.documentElement.style.display = 'none';
        window.location.replace('maintenance.html');
        return;
    }

    // 2. Pre-flight REST API check
    try {
        fetch('https://firestore.googleapis.com/v1/projects/grid-up/databases/(default)/documents/settings/maintenance')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d && d.fields && d.fields.active && d.fields.active.booleanValue === true) {
                    localStorage.setItem('gridup_maint_active', 'true');
                    document.documentElement.style.display = 'none';
                    window.location.replace('maintenance.html');
                } else if (d && d.fields && d.fields.active && d.fields.active.booleanValue === false) {
                    localStorage.setItem('gridup_maint_active', 'false');
                }
            })
            .catch(() => {});
    } catch(_) {}
})();

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
    if (typeof firebase.storage === 'function') {
        window.storage = firebase.storage();
    }
}

// Hardcoded Verified Admin UIDs failsafe (guarantees access even if Firestore rules or network restricts settings/admins)
const MASTER_ADMIN = 'B0t4f4nqqpZIQKpT8Ed97xka5gM2'; // Matty Roberts (Protected Master)
const KNOWN_ADMIN_UIDS = Object.freeze([
    'B0t4f4nqqpZIQKpT8Ed97xka5gM2', // Matty Roberts (Master)
    'uYUa2WYZ5TPg98vle6jQzzrItR53', // Andrew Fabian (Team Admin)
    '8nojtKUFKUUKDFFpnU6EdueLhkN2', // Martyn Cook (Team Admin)
    '2TfuhZVILNQerQK95YL1304jYp83'  // Adam Jones (Team Admin)
]);
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'MASTER_ADMIN', { value: MASTER_ADMIN, writable: false, configurable: false });
    Object.defineProperty(window, 'KNOWN_ADMIN_UIDS', { value: KNOWN_ADMIN_UIDS, writable: false, configurable: false });
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
            const userUid = data.user ? data.user.uid : null;
            // SECURITY: Only pre-verify hardcoded known admin UIDs; never trust client-controlled data.isAdmin
            const resolvedIsAdmin = Boolean(userUid && KNOWN_ADMIN_UIDS.includes(userUid));
            // Wait for DOM to be ready to update UI safely
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    IS_ADMIN = resolvedIsAdmin;
                    IS_VERIFIED = Boolean(data.isVerified);
                    updateAuthUI(data.user, true);
                });
            } else {
                IS_ADMIN = resolvedIsAdmin;
                IS_VERIFIED = Boolean(data.isVerified);
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

// --- SECURITY SANITIZERS ---
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sanitizeHttpUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    try {
        const parsed = new URL(trimmed, window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (_) {}
    return '';
}

if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
    window.sanitizeHttpUrl = sanitizeHttpUrl;
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
                        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
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
            // SECURITY: Only trust known hardcoded admin UIDs on fast-path; full verification occurs in enrichAuthData
            const isInitialAdmin = KNOWN_ADMIN_UIDS.includes(user.uid);
            IS_ADMIN = isInitialAdmin;
            localStorage.setItem('gridup_auth_cache', JSON.stringify({
                user: { uid: user.uid, photoURL: user.photoURL, displayName: user.displayName },
                isAdmin: isInitialAdmin,
                isVerified: Boolean(cached.isVerified)
            }));

            // 1. Immediate UI update
            updateAuthUI(user);

            // 2. Fast-path hook execution for admins (instant unlock before network calls)
            if (isInitialAdmin && typeof onAuthEnriched === 'function') {
                try {
                    onAuthEnriched(user, { isAdmin: true, isVerified: Boolean(cached.isVerified) });
                } catch (eAuthHook) {
                    console.warn("Early onAuthEnriched error:", eAuthHook);
                }
            }
            
            // 3. Background Enrichment (Admin/Verification)
            enrichAuthData(user);

            // Re-evaluate maintenance mode now that user identity is confirmed
            checkPublicMaintenanceMode();

            // 4. Watch for application notifications
            watchApplicationNotification(user);
        } else {
            // Only clear cached credentials if not in a transient network/quota error state
            if (appNotificationUnsub) {
                appNotificationUnsub();
                appNotificationUnsub = null;
            }
            PORTAL_HAS_UNREAD = false;
            localStorage.removeItem('gridup_auth_cache');
            updateAuthUI(null);
            checkPublicMaintenanceMode();
            handleLogOutRedirect();
        }

        // Trigger page-specific hooks if they exist
        if (typeof onAuthReady === 'function') {
            onAuthReady(user);
        }
    });
}

async function enrichAuthData(user) {
    // Check for Admin status:
    // 1. Static whitelist failsafe (zero chance of lockout)
    IS_ADMIN = KNOWN_ADMIN_UIDS.includes(user.uid);
    let finalAvatar = user.photoURL;
    let verifiedDriverName = null;
    
    if (db) {
        try {
            const isKnownHardcodedAdmin = KNOWN_ADMIN_UIDS.includes(user.uid);
            const [adminDoc, claimSnapshot, userDoc, maintDoc] = await Promise.all([
                !isKnownHardcodedAdmin ? db.collection("settings").doc("admins").get().catch(e => {
                    console.warn("Could not read settings/admins doc (rules/permissions):", e);
                    return null;
                }) : Promise.resolve(null),
                db.collection("claims").where("discordId", "==", user.uid).get().catch(() => null),
                db.collection("users").doc(user.uid).get().catch(() => null),
                db.collection("settings").doc("maintenance").get().catch(() => null)
            ]);

            // SECURITY: Authoritative Admin Verification ONLY via KNOWN_ADMIN_UIDS or settings/admins.
            // Never trust userDoc.isAdmin or userDoc.role (prevents self-promotion vulnerability).
            let isVerifiedAdmin = isKnownHardcodedAdmin;
            if (!isVerifiedAdmin && adminDoc && adminDoc.exists) {
                const admins = adminDoc.data().uids || [];
                isVerifiedAdmin = admins.includes(user.uid);
            }
            IS_ADMIN = isVerifiedAdmin;

            // Check Maintenance Mode
            if (maintDoc && maintDoc.exists && maintDoc.data().active === true) {
                window.GRIDUP_MAINTENANCE_ACTIVE = true;
                localStorage.setItem('gridup_maint_active', 'true');
                if (!IS_ADMIN) {
                    if (!window.location.pathname.endsWith('maintenance.html') && !window.location.pathname.endsWith('login.html')) {
                        document.documentElement.style.display = 'none';
                        window.location.replace('maintenance.html');
                        return;
                    }
                } else {
                    showAdminMaintenanceNotice();
                }
            } else if (maintDoc && maintDoc.exists && maintDoc.data().active === false) {
                localStorage.setItem('gridup_maint_active', 'false');
            }

            // Check Verification
            if (claimSnapshot && !claimSnapshot.empty && claimSnapshot.docs[0].data().status === 'verified') {
                IS_VERIFIED = true;
                verifiedDriverName = claimSnapshot.docs[0].id;

                // Auto-sync profile name and user record to verified team driver name
                if (verifiedDriverName) {
                    const currentDriverName = (userDoc && userDoc.exists) ? userDoc.data().driverName : null;
                    if (!currentDriverName || currentDriverName !== verifiedDriverName || currentDriverName === 'Discord User' || currentDriverName === 'Unknown Driver') {
                        db.collection("users").doc(user.uid).set({
                            driverName: verifiedDriverName,
                            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true }).catch(e => console.warn("Auto-sync driver name error:", e));
                    }
                    if (user.displayName !== verifiedDriverName) {
                        user.updateProfile({ displayName: verifiedDriverName }).catch(() => {});
                    }
                }
            }

            // Check Custom Avatar
            if (userDoc && userDoc.exists) {
                const userData = userDoc.data();
                if (userData.customAvatarUrl) {
                    finalAvatar = userData.customAvatarUrl;
                } else if (userData.photoURL) {
                    finalAvatar = userData.photoURL;
                }
            }
        } catch (e) {
            console.warn("Auth Enrichment Error:", e);
        }
    }

    // Update user object's photoURL and displayName with verified info so updateAuthUI and cache use it
    const enrichedUser = {
        uid: user.uid,
        photoURL: finalAvatar,
        displayName: verifiedDriverName || user.displayName
    };

    // Re-update UI with enriched data
    updateAuthUI(enrichedUser);

    // Save enriched state to cache
    localStorage.setItem('gridup_auth_cache', JSON.stringify({
        user: enrichedUser,
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
    return auth.signInWithPopup(provider).then(async (result) => {
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
        const errorDiv = document.getElementById('login-error-msg');
        if (error.code === 'auth/quota-exceeded' || (error.message && error.message.toLowerCase().includes('quota'))) {
            const quotaMsg = `<strong>Authentication Quota Limit (${escapeHtml(error.code)}):</strong><br><br>` +
                `Firebase reported: <em>${escapeHtml(error.message)}</em><br><br>` +
                `<strong>If your project is on the Blaze plan:</strong><br>` +
                `1. <strong>GCP Quota Caps:</strong> In Google Cloud Console &rarr; <em>IAM &amp; Admin</em> &rarr; <em>Quotas &amp; System Limits</em>, check <code>Identity Toolkit API</code> and ensure daily/per-minute request quotas are not capped by a safety limit or budget alert.<br>` +
                `2. <strong>Recent Upgrade Sync:</strong> If the Blaze plan was attached recently, Google Cloud takes up to 30&ndash;60 minutes to propagate billing changes across Identity Platform servers.<br>` +
                `3. <strong>Discord Rate Limits:</strong> Check Discord Developer Portal to ensure your OAuth2 app has not hit Discord's API rate limits.<br>` +
                `4. <strong>Authorized Domains:</strong> Verify that <code>gridup.online</code> is listed in Firebase Console &rarr; <em>Authentication</em> &rarr; <em>Settings</em> &rarr; <em>Authorized domains</em>.`;
            if (errorDiv) {
                errorDiv.innerHTML = quotaMsg;
                errorDiv.style.display = 'block';
            } else {
                alert("Firebase Authentication Quota Limit:\n\n" + error.message + "\n\nIf already on the Blaze plan, check Identity Toolkit API quotas in Google Cloud Console, or allow up to 30-60 minutes for recent billing upgrades to propagate.");
            }
        } else if (error.code === 'auth/popup-blocked') {
            const blockMsg = "Login popup was blocked by your browser. Please allow popups for this site and try again.";
            if (errorDiv) {
                errorDiv.textContent = blockMsg;
                errorDiv.style.display = 'block';
            } else {
                alert(blockMsg);
            }
        } else if (error.code === 'auth/popup-closed-by-user') {
            console.log("Login popup was closed before completing.");
        } else {
            const genericMsg = "Authentication failed: " + error.message;
            if (errorDiv) {
                errorDiv.textContent = genericMsg;
                errorDiv.style.display = 'block';
            } else {
                alert(genericMsg);
            }
        }
    });
}

// Update UI based on Login State
async function updateAuthUI(user, isTentative = false) {
    const loginBtn = document.getElementById('login-link');
    const claimSection = document.getElementById('claim-section');
    const driverTitle = document.getElementById('user-name') || document.querySelector('h1.driver-main-name') || document.querySelector('h1.glow-text');

    // Auto-detect relative path prefix
    const path = window.location.pathname;
    let basePath = '';
    if (path.includes('/events/past/')) {
        basePath = '../../';
    } else if (path.includes('/events/') || path.includes('/drivers/')) {
        basePath = '../';
    }

    // Ensure nav-actions container exists in nav-content
    const navContent = document.querySelector('.nav-content');
    let navActions = document.querySelector('.nav-actions');
    if (navContent && !navActions) {
        navActions = document.createElement('div');
        navActions.className = 'nav-actions';
        navContent.appendChild(navActions);
    }

    // Clean up any login button inside nav-links list to avoid duplicates/misalignment
    const loginLi = loginBtn ? loginBtn.closest('li') : null;
    if (loginLi) loginLi.remove();
    else if (loginBtn) loginBtn.remove();

    if (user) {
        const rawAvatar = user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        const avatar = sanitizeHttpUrl(rawAvatar) || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        
        if (navActions) {
            let container = document.getElementById('navbar-user-ui');
            if (!container) {
                container = document.createElement('div');
                container.id = "navbar-user-ui";
                container.style.display = "flex";
                container.style.alignItems = "center";
                container.style.gap = "8px";
            }

            const btnBase = "padding: 0.45rem 0.9rem; font-size: 0.72rem; font-family: 'Space Grotesk', sans-serif; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; text-decoration: none; border-radius: 6px; white-space: nowrap; transition: all 0.2s ease;";
            const adminUrl = path.includes('m2rc') ? `${basePath}m2rc-admin.html` : `${basePath}admin.html`;
            const adminLink = IS_ADMIN ? `<a href="${adminUrl}" id="navbar-admin-btn" style="${btnBase} background: rgba(255,59,48,0.12); border: 1px solid rgba(255,59,48,0.4); color: #FF6B6B;">Admin</a>` : '';
            const portalLink = `<a href="${basePath}portal.html" id="navbar-portal-btn" style="position: relative; ${btnBase} background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF;">Portal<span id="portal-badge" style="display: ${PORTAL_HAS_UNREAD ? 'block' : 'none'}; position: absolute; top: -4px; right: -4px; width: 8px; height: 8px; background-color: #ff3b30; border-radius: 50%; border: 1px solid #fff; box-shadow: 0 0 4px rgba(255,59,48,0.6);"></span></a>`;
            const profileLink = `<a href="${basePath}profile.html" style="${btnBase} background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF;">Profile</a>`;
            const logoutBtn = `<a href="#" onclick="if(confirm('Logout?')) firebase.auth().signOut()" style="${btnBase} background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.15); color: #E2E8F0; display: inline-flex; align-items: center; gap: 6px;"><img src="${escapeHtml(avatar)}" alt="User Avatar" style="width: 18px; height: 18px; border-radius: 50%; vertical-align: middle; object-fit: cover; border: 1px solid rgba(255,255,255,0.3);"> Logout</a>`;

            container.innerHTML = `${adminLink}${portalLink}${profileLink}${logoutBtn}`;
            navActions.innerHTML = '';
            navActions.appendChild(container);
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
        if (navActions) {
            navActions.innerHTML = `
                <a href="${basePath}login.html" id="login-link" class="btn-nav-login">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    LOGIN
                </a>
                <a href="https://discord.gg/gridup" target="_blank" rel="noopener" class="btn-nav-join">
                    <svg width="14" height="14" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.55,67.55,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>
                    JOIN THE TEAM
                </a>
            `;
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
                claimSection.innerHTML = `<div class="badge-verified" style="background: rgba(168, 85, 247, 0.1); color: var(--primary); padding: 0.75rem 1.5rem; border: 1px solid var(--primary); border-radius: 4px; display: inline-block; font-weight: 700;">✓ VERIFIED TEAM MEMBER</div>`;
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
    if (typeof window.renderEventDetailsLineup === 'function') {
        return window.renderEventDetailsLineup(slug);
    }
    if (!db) {
        setTimeout(() => loadRaceLineup(slug), 500);
        return;
    }

    const fallbackHtml = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
            <p style="font-size: 0.85rem; margin-bottom: 1rem;">Lineup is currently being finalized.</p>
            <a href="/portal.html" class="btn btn-outline" style="font-size: 0.75rem; padding: 0.4rem 0.8rem; border-radius: 6px;">Sign Up in Portal &rarr;</a>
        </div>
    `;

    try {
        const doc = await db.collection("race_lineups").doc(slug).get();
        const confirmedEl = document.getElementById('confirmed-lineup');

        if (doc.exists && doc.data().teams && doc.data().teams.length > 0) {
            const teams = doc.data().teams;
            
            const allDriverNames = new Set();
            teams.forEach(t => {
                if (t.captain) allDriverNames.add(t.captain);
                if (t.drivers && Array.isArray(t.drivers)) t.drivers.forEach(d => allDriverNames.add(d));
            });
            
            const profileMap = {};
            if (allDriverNames.size > 0) {
                try {
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
                } catch (userQueryErr) {
                    console.warn("Could not fetch user social profiles for lineup:", userQueryErr);
                }
            }
            
            const renderDriver = (name) => {
                const p = profileMap[name];
                let socialHtml = `<span class="social-links-lineup">`;
                if (p) {
                    const twitch = sanitizeHttpUrl(p.twitchUrl);
                    const tiktok = sanitizeHttpUrl(p.tiktokUrl);
                    const youtube = sanitizeHttpUrl(p.youtubeUrl);
                    if (twitch) {
                        socialHtml += `<a href="${twitch}" target="_blank" rel="noopener noreferrer" title="Watch on Twitch"><span class="live-pulse"></span><img src="https://cdn-icons-png.flaticon.com/512/5968/5968819.png" class="social-icon-sm" alt="Twitch"></a>`;
                    }
                    if (tiktok) {
                        socialHtml += `<a href="${tiktok}" target="_blank" rel="noopener noreferrer" title="Follow on TikTok"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046124.png" class="social-icon-sm" alt="TikTok"></a>`;
                    }
                    if (youtube) {
                        socialHtml += `<a href="${youtube}" target="_blank" rel="noopener noreferrer" title="Subscribe on YouTube"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" class="social-icon-sm" alt="YouTube"></a>`;
                    }
                }
                socialHtml += `</span>`;
                return `${escapeHtml(name)}${socialHtml}`;
            };

            let html = "";
            teams.forEach(team => {
                html += `
                    <div class="lineup-item" style="margin-top: 1rem;">
                        <span style="color: var(--primary); font-weight: 600;">${escapeHtml(team.name || team.teamName || 'GRiD UP Team')}</span><br>
                        <span style="font-size: 0.9rem; color: var(--text-muted);">${escapeHtml(team.car_class || team.carClass || "")}</span>
                    </div>
                    <ul style="list-style: none; margin-top: 0.5rem; padding-left: 1rem; border-left: 2px solid var(--primary);">
                `;
                if (team.captain) html += `<li>${renderDriver(team.captain)} (C)</li>`;
                if (team.drivers && Array.isArray(team.drivers)) {
                    team.drivers.forEach(driver => {
                        if (driver !== team.captain) html += `<li>${renderDriver(driver)}</li>`;
                    });
                }
                html += `</ul>`;
            });

            const searchRoot = confirmedEl || document.body;
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
                tempDiv.innerHTML = html;
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                startNode.parentNode.insertBefore(fragment, endNode);
            } else if (confirmedEl) {
                confirmedEl.innerHTML = html;
            }
        } else {
            // Lineup document not found or empty
            if (confirmedEl) {
                confirmedEl.innerHTML = fallbackHtml;
            } else {
                const iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT);
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
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = fallbackHtml;
                    while (tempDiv.firstChild) {
                        startNode.parentNode.insertBefore(tempDiv.firstChild, endNode);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error loading lineup from Firestore:", error);
        const confirmedEl = document.getElementById('confirmed-lineup');
        if (confirmedEl) {
            confirmedEl.innerHTML = fallbackHtml;
        }
    }
}

// ==========================================
// System Security & Maintenance Mode Control
// ==========================================
async function checkPublicMaintenanceMode() {
    const path = window.location.pathname;
    if (path.endsWith('maintenance.html') || path.endsWith('login.html')) return;

    // Check if current user is Master Admin or Known Admin
    const cached = JSON.parse(localStorage.getItem('gridup_auth_cache') || '{}');
    const currentUid = (window.auth && window.auth.currentUser) ? window.auth.currentUser.uid : (cached.user ? cached.user.uid : null);
    if (currentUid && (currentUid === MASTER_ADMIN || KNOWN_ADMIN_UIDS.includes(currentUid))) {
        removeMaintenanceLockStyle();
        showAdminMaintenanceNotice(true);
        const existingOverlay = document.getElementById('gridup-maintenance-overlay');
        if (existingOverlay) existingOverlay.remove();
        document.body.style.overflow = '';
        return;
    }

    if (!db) {
        setTimeout(checkPublicMaintenanceMode, 300);
        return;
    }
    try {
        const maintDoc = await db.collection("settings").doc("maintenance").get();
        if (maintDoc.exists && maintDoc.data().active === true) {
            window.GRIDUP_MAINTENANCE_ACTIVE = true;
            localStorage.setItem('gridup_maint_active', 'true');
            
            // Immediately hide page and redirect to maintenance.html
            document.documentElement.style.display = 'none';
            window.location.replace('maintenance.html');
            return;
        } else {
            window.GRIDUP_MAINTENANCE_ACTIVE = false;
            localStorage.setItem('gridup_maint_active', 'false');
            removeMaintenanceLockStyle();
            const overlay = document.getElementById('gridup-maintenance-overlay');
            if (overlay) overlay.remove();
            const notice = document.getElementById('admin-maint-notice');
            if (notice) notice.remove();
            document.body.style.overflow = '';
        }
    } catch (_) {}
}

function applyMaintenanceLockStyle() {
    if (window.location.pathname.endsWith('login.html')) return;
    let lockStyle = document.getElementById('maint-lock-style');
    if (!lockStyle) {
        lockStyle = document.createElement('style');
        lockStyle.id = 'maint-lock-style';
        lockStyle.textContent = 'body > *:not(#gridup-maintenance-overlay):not(#admin-maint-notice):not(#maint-unlocked-notice) { display: none !important; }';
        document.head.appendChild(lockStyle);
    }
}

function removeMaintenanceLockStyle() {
    const lockStyle = document.getElementById('maint-lock-style');
    if (lockStyle) lockStyle.remove();
}

function showAdminMaintenanceNotice(isMaster = false) {
    if (document.getElementById('admin-maint-notice')) return;
    const banner = document.createElement('div');
    banner.id = 'admin-maint-notice';
    banner.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;background:rgba(239,68,68,0.95);backdrop-filter:blur(10px);border:1px solid #ff4455;color:#fff;padding:8px 16px;border-radius:8px;font-size:0.75rem;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;font-family:system-ui,-apple-system,sans-serif;';
    banner.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#fff;"></span> EMERGENCY MAINTENANCE ACTIVE (${isMaster ? 'Master Admin Bypass' : 'Admin Bypass'})`;
    document.body.appendChild(banner);
}

function showUnlockedMaintenanceNotice() {
    if (document.getElementById('maint-unlocked-notice')) return;
    const banner = document.createElement('div');
    banner.id = 'maint-unlocked-notice';
    banner.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;background:rgba(16,185,129,0.95);backdrop-filter:blur(10px);border:1px solid #10b981;color:#fff;padding:8px 16px;border-radius:8px;font-size:0.75rem;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,0.5);display:flex;align-items:center;gap:12px;font-family:system-ui,-apple-system,sans-serif;';
    banner.innerHTML = `
        <span>🔑 MAINTENANCE ACCESS ACTIVE (Unlocked)</span>
        <button onclick="window.relockMaintenance()" style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.5);color:#fff;border-radius:4px;padding:2px 8px;font-size:0.7rem;cursor:pointer;font-weight:700;">Lock Site</button>
    `;
    document.body.appendChild(banner);
}

// SHA-256 Hash of access password (prevents plaintext password exposure in client code)
const MAINT_LOCK_SHA256 = 'ce50cdc0d9a7b64863b8bb98bdd2afa5689be68eb88a3643854887e134e2a29e';

async function computeSha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

window.unlockMaintenanceWithPassword = async function() {
    const input = document.getElementById('maint-password-input');
    const err = document.getElementById('maint-password-error');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    
    try {
        const hashedInput = await computeSha256(val);
        if (hashedInput === MAINT_LOCK_SHA256) {
            sessionStorage.setItem('gridup_maint_unlock', 'true');
            localStorage.setItem('gridup_maint_unlock', 'true');
            removeMaintenanceLockStyle();
            const overlay = document.getElementById('gridup-maintenance-overlay');
            if (overlay) overlay.remove();
            document.body.style.overflow = '';
            showUnlockedMaintenanceNotice();
        } else {
            if (err) {
                err.style.display = 'block';
                err.textContent = 'Incorrect access password. Please try again.';
            }
            input.value = '';
            input.focus();
        }
    } catch (e) {
        console.error("Hash calculation failed:", e);
    }
};

window.relockMaintenance = function() {
    sessionStorage.removeItem('gridup_maint_unlock');
    localStorage.removeItem('gridup_maint_unlock');
    const notice = document.getElementById('maint-unlocked-notice');
    if (notice) notice.remove();
    checkPublicMaintenanceMode();
};

// Secret background keyboard listener (typing 'griduptest' anywhere unlocks access)
let secretKeyBuffer = '';
window.addEventListener('keydown', (e) => {
    if (!window.GRIDUP_MAINTENANCE_ACTIVE) return;
    if (e.key && e.key.length === 1) {
        secretKeyBuffer += e.key.toLowerCase();
        if (secretKeyBuffer.length > 25) secretKeyBuffer = secretKeyBuffer.slice(-25);
        if (secretKeyBuffer.endsWith('griduptest')) {
            sessionStorage.setItem('gridup_maint_unlock', 'true');
            localStorage.setItem('gridup_maint_unlock', 'true');
            removeMaintenanceLockStyle();
            const overlay = document.getElementById('gridup-maintenance-overlay');
            if (overlay) overlay.remove();
            document.body.style.overflow = '';
            showUnlockedMaintenanceNotice();
            secretKeyBuffer = '';
        }
    }
});

function showMaintenanceScreen(data = {}) {
    // Never block login.html so Master Admin can log in
    if (window.location.pathname.endsWith('login.html')) return;
    
    let overlay = document.getElementById('gridup-maintenance-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'gridup-maintenance-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#05070f;overflow-y:auto;overflow-x:hidden;margin:0;padding:0;cursor:default;font-family:"Plus Jakarta Sans",system-ui,-apple-system,sans-serif;';
        document.body.appendChild(overlay);
    }
    
    const message = (data && data.message) ? data.message : "Our engineering crew is currently in the pit stall fine-tuning setups, swapping fresh rubber, and applying platform performance upgrades. We'll be back on track shortly!";
    const estimatedEnd = (data && data.estimatedEnd) ? data.estimatedEnd : "Shortly";
    
    overlay.innerHTML = `
        <div style="min-height:100vh;width:100%;display:flex;align-items:center;justify-content:center;position:relative;padding:2rem 1rem;box-sizing:border-box;background-image:linear-gradient(180deg, rgba(5,7,15,0.72) 0%, rgba(5,7,15,0.92) 100%), url('assets/maintenance.jpg');background-size:cover;background-position:center;background-repeat:no-repeat;">
            <div style="position:absolute;inset:0;background:radial-gradient(circle at center, rgba(0,207,255,0.08) 0%, rgba(5,7,15,0.85) 70%, #05070f 100%);pointer-events:none;"></div>
            <div style="position:relative;z-index:2;max-width:700px;width:100%;text-align:center;background:rgba(10,15,29,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(0,207,255,0.28);border-radius:24px;padding:3.25rem 2.25rem;box-shadow:0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(0,207,255,0.12);box-sizing:border-box;">
                
                <div style="display:inline-flex;align-items:center;justify-content:center;gap:12px;margin-bottom:1.5rem;">
                    <img src="assets/G_2.png" alt="GRID UP" style="width:44px;height:auto;filter:drop-shadow(0 0 16px rgba(0,207,255,0.45));">
                    <span style="font-family:'Orbitron',sans-serif;font-size:1.6rem;font-weight:900;letter-spacing:2.5px;color:#ffffff;">GRID <span style="color:#00cfff;text-shadow:0 0 15px rgba(0,207,255,0.45);">UP</span></span>
                </div>

                <div>
                    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(239,68,68,0.14);border:1px solid rgba(239,68,68,0.4);padding:6px 18px;border-radius:999px;font-size:0.76rem;font-weight:800;letter-spacing:1.5px;color:#fca5a5;text-transform:uppercase;margin-bottom:1.25rem;">
                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 10px #ef4444;"></span>
                        Box Box Box // Pit Lane Active
                    </div>
                </div>

                <h1 style="font-family:'Orbitron',sans-serif;font-size:clamp(1.75rem, 4.5vw, 2.35rem);font-weight:900;line-height:1.22;letter-spacing:0.5px;color:#ffffff;margin:0 0 1.15rem 0;text-transform:uppercase;">
                    Sorry, we are taking a <span style="background:linear-gradient(135deg, #00cfff 0%, #38bdf8 50%, #818cf8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">pitstop</span> right now!
                </h1>

                <p style="color:#cbd5e1;font-size:1.05rem;line-height:1.65;margin:0 auto 1.85rem auto;max-width:560px;font-weight:400;">
                    ${typeof escapeHtml === 'function' ? escapeHtml(message) : message}
                </p>

                <div style="background:rgba(15,23,42,0.7);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:0.95rem 1.25rem;margin-bottom:2.25rem;display:flex;align-items:center;justify-content:space-around;flex-wrap:wrap;gap:12px;font-size:0.82rem;color:#94a3b8;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="color:#10b981;font-weight:bold;">✔</span> Fresh Tires Fitted
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="color:#00cfff;font-weight:bold;">⚡</span> Refueling Rig Active
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="color:#eab308;font-weight:bold;">⏱</span> Back on Track: <strong style="color:#fff;margin-left:4px;">${typeof escapeHtml === 'function' ? escapeHtml(estimatedEnd) : estimatedEnd}</strong>
                    </div>
                </div>

                <div style="display:flex;justify-content:center;margin-bottom:0;">
                    <a href="https://discord.gg/gridup" target="_blank" rel="noopener noreferrer" style="background:linear-gradient(135deg, #5865F2 0%, #4752C4 100%);color:#fff;text-decoration:none;padding:0.85rem 1.85rem;border-radius:12px;font-size:0.88rem;font-weight:700;display:inline-flex;align-items:center;gap:10px;box-shadow:0 4px 18px rgba(88,101,242,0.35);">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                        Join Discord for Updates
                    </a>
                </div>

            </div>
        </div>
    `;
    document.body.style.overflow = 'hidden';
}

window.checkPublicMaintenanceMode = checkPublicMaintenanceMode;
window.showMaintenanceScreen = showMaintenanceScreen;
setTimeout(checkPublicMaintenanceMode, 300);

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
                                const safeAvatar = sanitizeHttpUrl(userData.customAvatarUrl);
                                if (safeAvatar) {
                                    const avatarEl = document.getElementById("driver-avatar-container") || document.querySelector(".driver-avatar-container");
                                    if (avatarEl) {
                                        avatarEl.innerHTML = `<img src="${escapeHtml(safeAvatar)}" alt="Driver Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                                    }
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

                // Also check and sync live ratings from drivers collection
                const dSnap = await window.db.collection("drivers").where("name", "==", driverName).limit(1).get();
                if (!dSnap.empty) {
                    const driverData = dSnap.docs[0].data();
                    const iracingObj = driverData.iracing || {};
                    const statsObj = driverData.stats || {};
                    const iRatings = statsObj.iRatings || {};
                    const licLevels = statsObj.licenseLevels || {};
                    const detailedRatings = iracingObj.ratings || {};

                    if (iracingObj.lastChecked) {
                        const lcEl = document.querySelector(".ratings-last-checked");
                        if (lcEl) {
                            try {
                                const d = new Date(iracingObj.lastChecked);
                                lcEl.textContent = `Checked: ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                            } catch(err){}
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
