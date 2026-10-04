import urllib.request
import json
import time
import os

print("Fetching drivers from Firestore REST API...")
url = 'https://firestore.googleapis.com/v1/projects/grid-up/databases/(default)/documents/drivers?pageSize=100'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode())
    docs = data.get('documents', [])

stats_path = 'driver_stats_2.json'
existing_stats = {}
if os.path.exists(stats_path):
    with open(stats_path, 'r', encoding='utf-8') as f:
        existing_stats = json.load(f)

def parse_sr(sr_val, lic_lvl):
    if lic_lvl is None:
        return 'R 2.50'
    try:
        lvl = int(lic_lvl)
        letter = 'R' if lvl <= 4 else ('D' if lvl <= 8 else ('C' if lvl <= 12 else ('B' if lvl <= 16 else ('A' if lvl <= 20 else 'P'))))
    except:
        letter = 'R'
    try:
        return f"{letter} {float(sr_val):.2f}"
    except:
        return f"{letter} 2.50"

def parse_ir(ir_obj):
    if isinstance(ir_obj, dict):
        return ir_obj.get('value')
    if isinstance(ir_obj, (int, float)):
        return int(ir_obj)
    return None

success_count = 0
for doc in docs:
    f = doc.get('fields', {})
    name = f.get('name', {}).get('stringValue', '').strip()
    cid = f.get('iracingId', {}).get('stringValue')
    if not name or not cid or not cid.isdigit():
        continue

    api_url = f'https://iracing6-backend.herokuapp.com/api/member-career-stats/career/{cid}'
    try:
        r2 = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(r2, timeout=6) as resp2:
            if resp2.status == 200:
                api_data = json.loads(resp2.read().decode())
                if 'sports_car' in api_data:
                    sc = api_data.get('sports_car', {})
                    fc = api_data.get('formula_car', {})
                    ov = api_data.get('oval', {})
                    dr = api_data.get('dirt_road', {})
                    do = api_data.get('dirt_oval', {})
                    rd = api_data.get('road', {})

                    entry = {
                        'Sports Car': {'irating': parse_ir(sc.get('iRating')), 'sr': parse_sr(sc.get('safety_rating'), sc.get('license_level'))},
                        'Formula Car': {'irating': parse_ir(fc.get('iRating')), 'sr': parse_sr(fc.get('safety_rating'), fc.get('license_level'))},
                        'Oval': {'irating': parse_ir(ov.get('iRating')), 'sr': parse_sr(ov.get('safety_rating'), ov.get('license_level'))},
                        'Dirt Road': {'irating': parse_ir(dr.get('iRating')), 'sr': parse_sr(dr.get('safety_rating'), dr.get('license_level'))},
                        'Dirt Oval': {'irating': parse_ir(do.get('iRating')), 'sr': parse_sr(do.get('safety_rating'), do.get('license_level'))},
                        'Road': {'irating': parse_ir(rd.get('iRating')), 'sr': parse_sr(rd.get('safety_rating'), rd.get('license_level'))}
                    }
                    existing_stats[name] = entry
                    # Also map with middle initial variants if applicable (e.g. Andrew B Fabian)
                    parts = name.split()
                    if len(parts) >= 2:
                        existing_stats[f"{parts[0]} B {parts[-1]}"] = entry
                    success_count += 1
                    sc_info = entry['Sports Car']
                    print(f"[OK] {name}: Sports iR {sc_info['irating']}, SR {sc_info['sr']}")
    except Exception as e:
        print(f"[FAIL] {name} ({cid}): {e}")
    time.sleep(0.3)

with open(stats_path, 'w', encoding='utf-8') as f:
    json.dump(existing_stats, f, indent=2)

print(f"\nFinished updating {stats_path}! Successfully updated {success_count} drivers.")
