# Residual Risk and Action Plan

**Project:** GRiD UP Sim Racing Web Platform  
**Date:** 2026-10-14  

---

## 1. Residual Risks & Technical Constraints

### 1.1 Inaccessible / Dashboard-Managed Configurations
Certain protections cannot be configured solely in repository source files and require administrative actions within third-party provider consoles:

1. **Cloudflare CDN Edge Headers:**
   - *Description:* While `_headers` has been added to the repository root, standard GitHub Pages may not automatically process `_headers` unless the site is deployed via Cloudflare Pages or Cloudflare Transform Rules (HTTP Response Header Modification) are enabled.
   - *Recommended Action:* Navigate to the Cloudflare Dashboard for `gridup.online` -> Rules -> Transform Rules -> Modify Response Header. Ensure `X-Content-Type-Options: nosniff` and `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` are enforced at the edge.
   - *Owner:* Domain / DNS Administrator.
   - *Priority:* Medium.

2. **Firebase Rules Deployment:**
   - *Description:* The hardened `firestore.rules` and `database.rules.json` files reside in the repository. They must be deployed to the live Firebase project using the Firebase CLI (`firebase deploy --only firestore:rules,database`) or the Firebase Console.
   - *Recommended Action:* Run `firebase deploy --only firestore:rules,database` from an authorized deployment machine.
   - *Owner:* Firebase Administrator.
   - *Priority:* High.

3. **Service Account Isolation:**
   - *Description:* `telemetry-app/bridge_logic.py` and `scripts/sync_firestore_drivers.js` reference service account credential files (`serviceAccountKey.json`).
   - *Recommended Action:* Ensure service account keys are stored exclusively in private local paths or secure environment variables (`FIREBASE_SERVICE_ACCOUNT`) and never committed into the repository or distributed with the client executable.
   - *Owner:* Lead Developer.
   - *Priority:* Critical.

### 1.2 Accepted Supply-Chain Findings
- **`@grpc/grpc-js` (via `firebase`):**
  - *Risk:* 4 High severity advisories in transitive dependency `@grpc/grpc-js` <= 1.13.5.
  - *Mitigation & Exposure:* The advisories target gRPC server implementations. The web application acts solely as an outgoing gRPC client to Google Cloud Firestore APIs. Resolving this would require a major breaking version bump to `firebase@9.14.0`, which breaks existing Firestore Modular SDK methods in the app.
  - *Disposition:* Accepted Risk with scheduled upgrade upon next planned architectural refactor.

---

## 2. Action Plan Summary

| Action Item | Recommended Command / Action | Responsible Party | Priority |
| :--- | :--- | :--- | :---: |
| Deploy Hardened Firestore Rules | `firebase deploy --only firestore:rules` | Firebase Admin | Immediate |
| Deploy Realtime Database Rules | `firebase deploy --only database` | Firebase Admin | Immediate |
| Verify Cloudflare Edge Headers | Check response headers via `curl -I https://gridup.online/` | Cloudflare Admin | High |
| Merge Security Branch | Review PR for `security-audit-remediation` and merge to `master` | Repository Owner | Immediate |
