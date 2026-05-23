import json

with open('C:/Users/Mattys PC/Downloads/eventresult-85961711.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

race_session = None
for s in data['data']['session_results']:
    if s['simsession_type_name'] == 'Race':
        race_session = s
        break

if not race_session:
    print("No Race session found")
    exit(1)

results = race_session['results']

registrations = []
for idx, r in enumerate(results):
    car = r['car_name']
    if 'driver_results' in r and len(r['driver_results']) > 1:
        entryType = 'team'
        teamName = r['display_name']
        primary_driver = r['driver_results'][0]['display_name']
        coDrivers = ', '.join([d['display_name'] for d in r['driver_results'][1:]])
    elif 'driver_results' in r and len(r['driver_results']) == 1:
        entryType = 'solo'
        teamName = None
        primary_driver = r['driver_results'][0]['display_name']
        coDrivers = None
    else:
        entryType = 'solo'
        teamName = None
        primary_driver = r['display_name']
        coDrivers = None

    reg = {
        "name": primary_driver,
        "avatar": "",
        "status": "confirmed",
        "car": car,
        "entryType": entryType,
    }
    if entryType == 'team':
        reg["teamName"] = teamName
        reg["coDrivers"] = coDrivers
        
    registrations.append(reg)

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Seed Virginia 120 Entries</title>
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <!-- Our Auth Config -->
    <script src="js/auth.js"></script>
    
    <style>
        body { font-family: sans-serif; padding: 2rem; background: #0a0a0c; color: white; }
        button { padding: 1rem 2rem; background: #00cfff; border: none; color: black; font-weight: bold; cursor: pointer; border-radius: 4px; }
        #log { margin-top: 1rem; color: #00ff88; white-space: pre; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Seed Virginia 120 Entries</h1>
    <button onclick="seedDatabase()">Seed Entries</button>
    <div id="log"></div>

    <script>
        const EVENT_ID = 'gtc-virginia-120';
        const REGISTRATIONS = """ + json.dumps(registrations, indent=4) + """;

        async function seedDatabase() {
            const logDiv = document.getElementById('log');
            logDiv.innerHTML = "Starting batch insert...\\n";
            try {
                const batch = db.batch();
                REGISTRATIONS.forEach((reg, idx) => {
                    const docRef = db.collection('leagues').doc(EVENT_ID).collection('registrations').doc('entry_' + idx);
                    reg.timestamp = firebase.firestore.FieldValue.serverTimestamp();
                    batch.set(docRef, reg);
                    logDiv.innerHTML += `Queued: ${reg.name} \\n`;
                });
                await batch.commit();
                logDiv.innerHTML += "\\nSUCCESS: All entries seeded to Firestore!";
            } catch (e) {
                console.error(e);
                logDiv.innerHTML += `\\nERROR: ${e.message}`;
            }
        }
    </script>
</body>
</html>
"""

with open('F:/Grid Up/Website/seed_virginia_entries.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Generated seed_virginia_entries.html successfully.")
