const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const path = require('path');

const SA_PATH = 'Y:/grid-up-firebase-adminsdk-fbsvc-11d85f59be.json';
const STATS_PATH = path.join(__dirname, '..', 'driver_stats_2.json');

async function getAccessToken() {
  const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + payload);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = header + '.' + payload + '.' + signature;
  const postData = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt;

  return new Promise((resolve, reject) => {
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const d = JSON.parse(body);
        if (d.access_token) resolve(d.access_token);
        else reject(new Error('Failed to obtain token: ' + body));
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function normalizeName(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b[a-z]\b/g, '')
    .replace(/\d+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findDriverStats(name, localStats) {
  if (!name || !localStats) return null;
  const raw = String(name).trim();
  if (localStats[raw]) return localStats[raw];

  const norm = raw.toLowerCase();
  if (localStats[norm]) return localStats[norm];

  const cleaned = normalizeName(raw);
  if (cleaned && localStats[cleaned]) return localStats[cleaned];

  const keys = Object.keys(localStats);
  for (const k of keys) {
    if (k.toLowerCase() === norm) return localStats[k];
    const kClean = normalizeName(k);
    if (kClean && (kClean === cleaned || kClean === norm)) return localStats[k];
  }

  const parts = norm.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const fName = parts[0];
    const lName = parts[parts.length - 1].replace(/\d+$/, '');
    for (const k of keys) {
      const kParts = k.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      if (kParts.length >= 2) {
        const kFirst = kParts[0];
        const kLast = kParts[kParts.length - 1].replace(/\d+$/, '');
        if (kFirst === fName && kLast === lName) {
          return localStats[k];
        }
      }
    }
  }

  return null;
}

function httpsRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('1. Loading driver_stats_2.json...');
    const localStats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));

    console.log('2. Requesting Google OAuth2 Access Token...');
    const token = await getAccessToken();
    console.log('Token successfully obtained!');

    console.log('3. Fetching drivers list from Firestore REST API...');
    const listRes = await httpsRequest({
      hostname: 'firestore.googleapis.com',
      path: '/v1/projects/grid-up/databases/(default)/documents/drivers?pageSize=100',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const docs = listRes.body?.documents || [];
    console.log(`Found ${docs.length} driver documents in Firestore.`);

    let updatedCount = 0;
    const nowIso = new Date().toISOString();

    for (const doc of docs) {
      const docName = doc.name; // projects/grid-up/databases/(default)/documents/drivers/<docId>
      const docId = docName.split('/').pop();
      const fields = doc.fields || {};
      const driverName = fields.name?.stringValue;

      if (!driverName) continue;

      const stats = findDriverStats(driverName, localStats);
      if (!stats) {
        console.log(`- Skipping ${driverName} (no entry in stats cache)`);
        continue;
      }

      const sc = stats['Sports Car'] || {};
      const fc = stats['Formula Car'] || {};
      const ov = stats['Oval'] || {};
      const dr = stats['Dirt Road'] || {};
      const doval = stats['Dirt Oval'] || {};
      const rd = stats['Road'] || {};

      const sportsIr = sc.irating || 0;
      const sportsSr = sc.sr || 'R 2.50';
      const formulaIr = fc.irating || 0;
      const formulaSr = fc.sr || 'R 2.50';
      const ovalIr = ov.irating || 0;
      const ovalSr = ov.sr || 'R 2.50';
      const dirtRoadIr = dr.irating || 0;
      const dirtRoadSr = dr.sr || 'R 2.50';
      const dirtOvalIr = doval.irating || 0;
      const dirtOvalSr = doval.sr || 'R 2.50';
      const roadIr = rd.irating || 0;
      const roadSr = rd.sr || 'R 2.50';

      const updatePayload = {
        fields: {
          ...fields,
          irating: { integerValue: String(sportsIr) },
          lastUpdated: { timestampValue: nowIso },
          stats: {
            mapValue: {
              fields: {
                iRatings: {
                  mapValue: {
                    fields: {
                      SPORTS: { integerValue: String(sportsIr) },
                      FORMULA: { integerValue: String(formulaIr) },
                      OVAL: { integerValue: String(ovalIr) },
                      DIRT_ROAD: { integerValue: String(dirtRoadIr) },
                      DIRT_OVAL: { integerValue: String(dirtOvalIr) },
                      ROAD: { integerValue: String(roadIr || sportsIr) }
                    }
                  }
                },
                licenseLevels: {
                  mapValue: {
                    fields: {
                      SPORTS: { stringValue: sportsSr },
                      FORMULA: { stringValue: formulaSr },
                      OVAL: { stringValue: ovalSr },
                      DIRT_ROAD: { stringValue: dirtRoadSr },
                      DIRT_OVAL: { stringValue: dirtOvalSr },
                      ROAD: { stringValue: roadSr || sportsSr }
                    }
                  }
                },
                iRatingPercentages: {
                  mapValue: {
                    fields: {
                      SPORTS: { doubleValue: Math.min(100, Number((sportsIr / 6000 * 100).toFixed(2))) },
                      FORMULA: { doubleValue: Math.min(100, Number((formulaIr / 6000 * 100).toFixed(2))) },
                      OVAL: { doubleValue: Math.min(100, Number((ovalIr / 6000 * 100).toFixed(2))) },
                      DIRT_ROAD: { doubleValue: Math.min(100, Number((dirtRoadIr / 6000 * 100).toFixed(2))) },
                      DIRT_OVAL: { doubleValue: Math.min(100, Number((dirtOvalIr / 6000 * 100).toFixed(2))) },
                      ROAD: { doubleValue: Math.min(100, Number(((roadIr || sportsIr) / 6000 * 100).toFixed(2))) }
                    }
                  }
                }
              }
            }
          },
          iracing: {
            mapValue: {
              fields: {
                customerId: fields.iracing?.mapValue?.fields?.customerId || { integerValue: fields.iracingId?.stringValue || "0" },
                lastChecked: { stringValue: nowIso },
                ratings: {
                  mapValue: {
                    fields: {
                      sportsCar: { mapValue: { fields: { value: { integerValue: String(sportsIr) }, updated: { stringValue: nowIso.slice(0, 10) } } } },
                      formulaCar: { mapValue: { fields: { value: { integerValue: String(formulaIr) }, updated: { stringValue: nowIso.slice(0, 10) } } } },
                      oval: { mapValue: { fields: { value: { integerValue: String(ovalIr) }, updated: { stringValue: nowIso.slice(0, 10) } } } },
                      dirtRoad: { mapValue: { fields: { value: { integerValue: String(dirtRoadIr) }, updated: { stringValue: nowIso.slice(0, 10) } } } },
                      dirtOval: { mapValue: { fields: { value: { integerValue: String(dirtOvalIr) }, updated: { stringValue: nowIso.slice(0, 10) } } } },
                      road: { mapValue: { fields: { value: { integerValue: String(roadIr || sportsIr) }, updated: { stringValue: nowIso.slice(0, 10) } } } }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const patchPath = `/v1/${docName}?updateMask.fieldPaths=stats&updateMask.fieldPaths=iracing&updateMask.fieldPaths=irating&updateMask.fieldPaths=lastUpdated`;
      const postBody = JSON.stringify(updatePayload);

      const patchRes = await httpsRequest({
        hostname: 'firestore.googleapis.com',
        path: patchPath,
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postBody)
        }
      }, postBody);

      if (patchRes.status === 200) {
        updatedCount++;
        console.log(`[OK] Updated ${driverName} -> Sports: ${sportsIr} iR | ${sportsSr}`);
      } else {
        console.error(`[FAIL] ${driverName} (${patchRes.status}):`, JSON.stringify(patchRes.body || patchRes.raw));
      }
    }

    console.log(`\n========================================`);
    console.log(`Successfully updated ${updatedCount} drivers in Firestore!`);
    console.log(`========================================`);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
})();
