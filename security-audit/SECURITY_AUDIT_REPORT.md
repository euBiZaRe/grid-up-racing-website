# Executive Security Report

**Target:** GRiD UP Sim Racing Web Application & Ecosystem (`gridup.online`)  
**Audit Date:** 2026-10-14  
**Auditor:** Senior Application Security Engineer & DevSecOps  
**Remediation Branch:** `security-audit-remediation`  
**Classification:** Internal Confidential / Security Documentation  

---

## 1. Executive Summary

A comprehensive, defense-in-depth application security audit and vulnerability remediation was conducted across the entire GRiD UP Sim Racing platform, spanning the static web client, administrative consoles, driver portal, Cloud Firestore and Realtime Database security rules, local Python telemetry bridge applications, background sync scripts, and third-party dependency trees.

The audit identified critical and high-severity vulnerabilities, predominantly consisting of:
1. **Blind Stored Cross-Site Scripting (XSS)** in administrative consoles when reviewing applicant submissions and chat logs.
2. **Stored Cross-Site Scripting (XSS)** within the Driver Portal team messaging channels and global navigation avatar rendering.
3. **Broken Access Control & Insecure Direct Object References (IDOR)** in Cloud Firestore rules allowing unauthorized modifications, overwrites, and state hijacking of team setups and telemetry jobs.
4. **Server-Side Request Forgery (SSRF) and Local File Inclusion (LFI)** in the local Telemetry Bridge setup installer client.
5. **Client-Side Authorization Spoofing** in the M2RC administrative interface.
6. **Missing Realtime Database Security Policies & Web Security Headers** exposing telemetry feeds and static pages to MIME-sniffing, clickjacking, and referrer leakage.
7. **Supply-Chain Dependency Vulnerabilities** in the JavaScript packaging ecosystem.

All confirmed remediable vulnerabilities within the codebase were fixed directly, tested using a 9-part regression test suite, verified with static syntax validators, and cross-checked against external penetration scanner findings.

---

## 2. Summary of Findings

| Severity | Discovered | Remediated & Verified | Residual / Mitigated | Open |
| :--- | :---: | :---: | :---: | :---: |
| **Critical** | 1 | 1 | 0 | 0 |
| **High** | 5 | 5 | 0 | 0 |
| **Medium** | 3 | 3 | 0 | 0 |
| **Low** | 1 | 1 | 0 | 0 |
| **Informational** | 1 | 1 | 0 | 0 |
| **Total** | **11** | **11** | **0** | **0** |

---

## 3. Technology Stack & Attack-Surface Summary

- **Frontend Application:** HTML5, CSS3, Vanilla ES6 JavaScript, Tailwind CSS (Stint Planner sub-app), Vite, React 18.
- **Authentication & Authorization:** Firebase Authentication (OIDC Discord OAuth Provider), Role-Based Access Control (RBAC) enforced via Cloud Firestore security rules and administrative UIDs registry.
- **Database & Storage:** Google Cloud Firestore (multi-region database), Firebase Realtime Database (RTDB telemetry streaming), Google Cloud Storage (iRacing `.sto` setups).
- **Backend / Integrations:** Node.js (Stint Planner Gateway, Express + WebSocket), Python 3.14 (Telemetry Bridge with iRacing SDK integration, Sheet synchronization, Garage61 REST API bridge).
- **Deployment & CDN:** GitHub Pages, Cloudflare CDN / DNS, Jekyll static site builder.

---

## 4. Key Security Improvements Implemented

1. **Complete XSS Sanitization in Admin & Portal:**
   All dynamic interpolations of user-supplied data (`iracingName`, `discordUsername`, `messages`, `availability`, `experience`, `location`, `customAvatarUrl`) now enforce rigorous character escaping via `escapeHtml()` and strict URL scheme verification (`sanitizeHttpUrl()`).

2. **Hardened Cloud Firestore Security Guardrails:**
   - Eliminated broad write permissions on `/race_lineups/{eventId}/teams/{teamId}/setups/{setupId}`.
   - Enforced owner-matching checks on setup creation (`uploaderUid == request.auth.uid`).
   - Fixed IDOR on `/setup_jobs/{docId}` updates by verifying existing document ownership (`resource.data.uid == request.auth.uid`).
   - Enforced caller identity verification on `/m2rc_registrations/{regId}`.

3. **Telemetry Bridge SSRF & Path Traversal Lockdown:**
   - Implemented `is_safe_download_url()` in `bridge_logic.py`, strictly enforcing `https://` protocol and rejecting loopback (`127.0.0.1`, `localhost`), link-local metadata (`169.254.169.254`), and private RFC 1918 networks (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`).
   - Added strict path containment assertions to ensure setup file writes cannot escape the user's iRacing setups root folder.

4. **Realtime Database Security Rules (`database.rules.json`):**
   Authored and registered dedicated RTDB security rules denying all public write permissions to root paths and restricting `setup_jobs` and telemetry streams to authenticated callers.

5. **HTTP Security Headers & Infrastructure Hardening:**
   Configured `_headers` and `firebase.json` headers with `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, and `Permissions-Policy`. Excluded internal audit assets from Jekyll static output.

6. **Supply Chain Resolution:**
   Remediated 10 known dependency vulnerabilities including critical issues in `websocket-driver` via `npm audit fix`.

---

## 5. Outstanding Work & Operational Recommendations

- **Cloudflare Edge Rules:** If Cloudflare CDN proxies `gridup.online`, ensure Cloudflare Transform Rules or Pages configuration applies the `_headers` directives at the edge.
- **Service Account Isolation:** Ensure `serviceAccountKey.json` is never placed into public web roots or committed to version control.
- **Ongoing Dependency Scanning:** Run automated Dependabot or npm audit scans periodically.
