# Remediation Changelog

**Project:** GRiD UP Sim Racing Web Platform  
**Remediation Date:** 2026-10-14  

---

## 1. Summary of Changes

| Finding ID | Component | Change Description | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| **SEC-001** | `admin.html` | Wrapped all applicant fields and chat messages in `escapeHtml()`. Escaped JS arguments in inline event handlers. | Static syntax check (`node -c`), manual DOM review. |
| **SEC-002** | `portal.html` | Wrapped team message author, text body, and timestamps in `escapeHtml()`. | Static verification of message listener loop. |
| **SEC-003** | `js/auth.js` | Enforced `sanitizeHttpUrl()` and `escapeHtml()` on user avatar URLs in `updateAuthUI()` and driver profile loading. | Static syntax check (`node -c js/auth.js`), injection test. |
| **SEC-004** | `admin.html` | Escaped driver name, iRacing ID, and status badges in Claims table. Escaped arguments for `updateClaim` and `promoteUIDAsAdmin`. | Table render verification, escaping checks. |
| **SEC-005** | `firestore.rules` | Hardened setup permissions under `/race_lineups`, added caller uploader checks, split setup_jobs create/update rules to eliminate IDOR, and added UID verification on M2RC registrations. | Subagent `firestore-rules-author` review and rules diff verification. |
| **SEC-006** | `telemetry-app/bridge_logic.py` | Added `is_safe_download_url()` with HTTPS enforcement, private/loopback/metadata IP blocking, and strict directory containment check. | Python unit test suite: `tests/test_setup_library_and_installer.py` (9 tests passed). |
| **SEC-007** | `m2rc-admin.html` | Removed unverified client-side `localStorage` admin pre-verification; required verified Firebase Auth identity. | Verified DOM state on unauthenticated load. |
| **SEC-008** | `database.rules.json`, `firebase.json` | Authored Realtime Database rules restricting write access to authenticated callers and registered in `firebase.json`. | Validated JSON schema and syntax. |
| **SEC-009** | `_headers`, `firebase.json`, `_config.yml` | Created `_headers` configuring HSTS, nosniff, SAMEORIGIN, and Referrer-Policy. Added `_headers` to Jekyll inclusion list and excluded `security-audit/`. | Verified file configuration and Jekyll build rules. |
| **SEC-010** | `package-lock.json` | Executed `npm audit fix` resolving 10 vulnerabilities (including critical `websocket-driver` vulnerability). | `npm audit` verification scan. |
| **SEC-011** | `_config.yml` | Validated RFC 9116 `.well-known/security.txt` and `security.txt` inclusion. | File presence and accessibility check. |

---

## 2. Detailed File Diff Summary

### `admin.html`
- Sanitized `viewApplication()` applicant details and message thread rendering.
- Sanitized `loadClaims()` driver claim table rows and action button parameters.

### `portal.html`
- Sanitized real-time team message rendering in the driver portal communications panel.

### `js/auth.js`
- Validated and sanitized navbar avatar URL and profile avatar rendering.

### `m2rc-admin.html`
- Replaced unverified localStorage check with strict Firebase Auth verification.

### `firestore.rules`
- Hardened access control on team setups, global setups, setup jobs, and M2RC registrations.

### `telemetry-app/bridge_logic.py`
- Implemented `is_safe_download_url()` and path containment verification.

### `tests/test_setup_library_and_installer.py`
- Added 3 new security test cases covering insecure URL scheme rejection, loopback/SSRF rejection, and public HTTPS URL acceptance.

### `database.rules.json` (New File)
- Defined RTDB security rules denying unauthenticated writes.

### `_headers` (New File)
- Configured production security headers for static hosting.

### `_config.yml`
- Added `_headers` to `include:`. Excluded `security-audit/` and `database.rules.json` from public web builds.

### `package-lock.json`
- Remediated 10 vulnerable npm package versions.
