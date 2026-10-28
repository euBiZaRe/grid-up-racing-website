import urllib.request
import urllib.error
import json
import os
import sys
import time
from collections import defaultdict
from datetime import datetime

# Automatically load .env if present (project root or user home)
def load_env():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for p in [os.path.join(repo_root, '.env'), os.path.expanduser('~/.env')]:
        if os.path.exists(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            k, v = line.split('=', 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            if k not in os.environ and v:
                                os.environ[k] = v
            except Exception:
                pass

load_env()

DEFAULT_G61_PAT = 'ZTLHNDQWYZATNMJHMC0ZOWQ5LTLKOTUTYTZJYZG0ZGJKOGU5'
TOKEN = (
    os.environ.get('GARAGE61_TOKEN')
    or os.environ.get('G61_PAT')
    or os.environ.get('GARAGE61_API_KEY')
    or os.environ.get('GARAGE_61_KEY')
    or DEFAULT_G61_PAT
)

if not TOKEN:
    print("[ERROR] Garage61 API token missing.")
    print("Please set GARAGE61_TOKEN or G61_PAT in your environment, in a local .env file,")
    print("or in your GitHub repository Secrets (Settings > Secrets and variables > Actions).")
    sys.exit(1)

HEADERS = {
    'Authorization': f'Bearer {TOKEN}',
    'User-Agent': 'GRiD-UP-SimRacing-Updater/2.0',
    'Accept': 'application/json'
}
TEAM_ID = '01J4FHVP9N8APEV93B13HS16R8'  # Grid Up Sim Racing

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
TARGET_DATA_DIR = os.path.join(REPO_ROOT, 'data')
GARAGE61_STATS_FILE = os.path.join(TARGET_DATA_DIR, 'garage61-stats.json')
DRIVER_STATS_FILE = os.path.join(REPO_ROOT, 'driver_stats_2.json')
DRIVERS_JSON_FILE = os.path.join(REPO_ROOT, 'scripts', 'drivers.json')
DRIVERS_DIR = os.path.join(REPO_ROOT, 'drivers')
DRIVER_TEMPLATE_FILE = os.path.join(DRIVERS_DIR, 'driver-template.html')

def fetch_json(url, retries=2, timeout=15):
    """Fetches JSON from the Garage61 API with error handling and retry."""
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code in (404, 403, 401) and attempt == retries:
                return None
            time.sleep(1.0)
        except Exception as e:
            if attempt == retries:
                return None
            time.sleep(1.0)
    return None

def license_level_to_letter(lvl):
    if lvl is None or lvl == '':
        return 'R'
    try:
        val = int(lvl)
        if val <= 4: return 'R'
        elif val <= 8: return 'D'
        elif val <= 12: return 'C'
        elif val <= 16: return 'B'
        elif val <= 20: return 'A'
        else: return 'P'
    except (ValueError, TypeError):
        return 'R'

def format_sr(sr_val, lic_lvl):
    letter = license_level_to_letter(lic_lvl)
    if sr_val is None or sr_val == '' or sr_val == 'N/A':
        return f"{letter} 2.50"
    try:
        val = float(sr_val)
        return f"{letter} {val:.2f}"
    except (ValueError, TypeError):
        return f"{letter} 2.50"

def get_license_class(license_str):
    if not license_str or license_str in ("N/A", "---"):
        return "license-r"
    first_char = license_str.strip()[0].upper()
    if first_char in ['A', 'B', 'C', 'D', 'R', 'P']:
        return f"license-{first_char.lower()}"
    return "license-r"

def format_date_str(date_str):
    if not date_str:
        return "N/A"
    try:
        clean_date = str(date_str).split("T")[0]
        dt = datetime.strptime(clean_date, "%Y-%m-%d")
        return dt.strftime("%d %b %Y")
    except Exception:
        return str(date_str)

def sync():
    print("=== Fetching Garage61 Data for GRiD UP Sim Racing ===")
    
    # 1. Cars
    print("1. Fetching cars catalogue...")
    cars_data = fetch_json('https://garage61.net/api/v1/cars') or {}
    cars_raw = cars_data.get('items', [])
    cars_map = {c['id']: c['name'] for c in cars_raw}
    print(f"   Catalogued {len(cars_map)} cars.")
    
    # 2. Tracks
    print("2. Fetching tracks catalogue...")
    tracks_data = fetch_json('https://garage61.net/api/v1/tracks') or {}
    tracks_raw = tracks_data.get('items', [])
    tracks_map = {t['id']: f"{t['name']}{(' - ' + t['variant']) if t.get('variant') else ''}" for t in tracks_raw}
    print(f"   Catalogued {len(tracks_map)} tracks.")
    
    # 3. Team members
    print("3. Fetching team members...")
    team_data = fetch_json(f'https://garage61.net/api/v1/teams/{TEAM_ID}')
    if not team_data:
        raise SystemExit(f"[ERROR] Could not fetch team data for ID {TEAM_ID}. Check API token permissions.")
        
    team_name = team_data.get('name', 'GRiD UP Sim Racing')
    team_slug = team_data.get('slug', 'grid-up-simsport')
    members_raw = team_data.get('members', [])
    members_map = {}
    for m in members_raw:
        slug = m.get('slug')
        full_name = f"{m.get('firstName', '')} {m.get('lastName', '')}".strip()
        members_map[slug] = {
            'name': full_name,
            'firstName': m.get('firstName', ''),
            'lastName': m.get('lastName', ''),
            'role': m.get('role', 'Driver'),
            'slug': slug
        }
    print(f"   Found {len(members_map)} team members.")
    
    # 4. Driving statistics
    print("4. Fetching team driving statistics...")
    stats_data = fetch_json(f'https://garage61.net/api/v1/teams/{TEAM_ID}/statistics') or {}
    records = stats_data.get('drivingStatistics', [])
    print(f"   Downloaded {len(records)} telemetry statistics records.")
    
    drivers = {}
    team_total_laps = 0
    team_clean_laps = 0
    team_total_seconds = 0.0
    team_days = set()
    
    for r in records:
        u = r.get('user')
        if not u: continue
        
        if u not in drivers:
            m_info = members_map.get(u, {'name': u.replace('-', ' ').title(), 'slug': u, 'firstName': '', 'lastName': '', 'role': 'Driver'})
            drivers[u] = {
                'slug': u,
                'name': m_info['name'],
                'firstName': m_info.get('firstName', ''),
                'lastName': m_info.get('lastName', ''),
                'role': m_info.get('role', 'Driver'),
                'totalLaps': 0,
                'cleanLaps': 0,
                'totalTimeSeconds': 0.0,
                'totalEvents': 0,
                'firstDay': r.get('day', ''),
                'lastDay': r.get('day', ''),
                'cars': {},
                'tracks': {},
                'sessions': {
                    'Practice': {'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0},
                    'Qualifying': {'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0},
                    'Race': {'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0},
                    'Other': {'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0}
                },
                'daysActive': set(),
                'recentDays': defaultdict(int)
            }
            
        d = drivers[u]
        laps = r.get('lapsDriven', 0)
        clean = r.get('cleanLapsDriven', 0)
        time_sec = r.get('timeOnTrack', 0.0)
        events = r.get('events', 0)
        day = r.get('day', '')
        car_id = r.get('car')
        track_id = r.get('track')
        stype = r.get('sessionType', 0)
        
        d['totalLaps'] += laps
        d['cleanLaps'] += clean
        d['totalTimeSeconds'] += time_sec
        d['totalEvents'] += events
        
        team_total_laps += laps
        team_clean_laps += clean
        team_total_seconds += time_sec
        if day:
            d['daysActive'].add(day)
            team_days.add(day)
            if not d['firstDay'] or day < d['firstDay']: d['firstDay'] = day
            if not d['lastDay'] or day > d['lastDay']: d['lastDay'] = day
            d['recentDays'][day] += laps
            
        # Car aggregation
        car_name = cars_map.get(car_id, f"Car #{car_id}")
        if car_name not in d['cars']:
            d['cars'][car_name] = {'name': car_name, 'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0}
        d['cars'][car_name]['laps'] += laps
        d['cars'][car_name]['cleanLaps'] += clean
        d['cars'][car_name]['timeSeconds'] += time_sec
        
        # Track aggregation
        track_name = tracks_map.get(track_id, f"Track #{track_id}")
        if track_name not in d['tracks']:
            d['tracks'][track_name] = {'name': track_name, 'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0}
        d['tracks'][track_name]['laps'] += laps
        d['tracks'][track_name]['cleanLaps'] += clean
        d['tracks'][track_name]['timeSeconds'] += time_sec
        
        # Session type
        stype_label = {1: 'Practice', 2: 'Qualifying', 3: 'Race'}.get(stype, 'Other')
        d['sessions'][stype_label]['laps'] += laps
        d['sessions'][stype_label]['cleanLaps'] += clean
        d['sessions'][stype_label]['timeSeconds'] += time_sec

    # Include team members who haven't logged telemetry yet
    for slug, m_info in members_map.items():
        if slug not in drivers:
            drivers[slug] = {
                'slug': slug,
                'name': m_info['name'],
                'firstName': m_info.get('firstName', ''),
                'lastName': m_info.get('lastName', ''),
                'role': m_info.get('role', 'Driver'),
                'totalLaps': 0,
                'cleanLaps': 0,
                'totalTimeSeconds': 0.0,
                'totalEvents': 0,
                'firstDay': '',
                'lastDay': '',
                'cars': {},
                'tracks': {},
                'sessions': {
                    'Practice': {'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0},
                    'Qualifying': {'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0},
                    'Race': {'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0},
                    'Other': {'laps': 0, 'cleanLaps': 0, 'timeSeconds': 0.0}
                },
                'daysActive': set(),
                'recentDays': defaultdict(int)
            }

    # Post-process drivers list
    driver_list = []
    for u, d in drivers.items():
        total_l = d['totalLaps']
        clean_l = d['cleanLaps']
        clean_pct = round((clean_l / total_l * 100), 1) if total_l > 0 else 0.0
        hours = round(d['totalTimeSeconds'] / 3600, 1)
        
        # Sort top cars (descending by laps)
        sorted_cars = sorted(d['cars'].values(), key=lambda x: x['laps'], reverse=True)
        top_cars = []
        for c in sorted_cars[:10]:
            top_cars.append({
                'name': c['name'],
                'laps': c['laps'],
                'cleanLaps': c['cleanLaps'],
                'cleanPct': round((c['cleanLaps'] / c['laps'] * 100), 1) if c['laps'] > 0 else 0.0,
                'hours': round(c['timeSeconds'] / 3600, 1)
            })
            
        # Sort top tracks (descending by laps)
        sorted_tracks = sorted(d['tracks'].values(), key=lambda x: x['laps'], reverse=True)
        top_tracks = []
        for t in sorted_tracks[:10]:
            top_tracks.append({
                'name': t['name'],
                'laps': t['laps'],
                'cleanLaps': t['cleanLaps'],
                'cleanPct': round((t['cleanLaps'] / t['laps'] * 100), 1) if t['laps'] > 0 else 0.0,
                'hours': round(t['timeSeconds'] / 3600, 1)
            })
            
        # Recent 30 days active laps
        recent_sorted = sorted(d['recentDays'].items(), reverse=True)[:30]
        recent_activity = [{'day': day, 'laps': laps} for day, laps in recent_sorted]
        
        # Format session stats
        sessions_summary = {}
        for sname, sdata in d['sessions'].items():
            if sdata['laps'] > 0 or sdata['timeSeconds'] > 0:
                sessions_summary[sname] = {
                    'laps': sdata['laps'],
                    'cleanLaps': sdata['cleanLaps'],
                    'cleanPct': round((sdata['cleanLaps'] / sdata['laps'] * 100), 1) if sdata['laps'] > 0 else 0.0,
                    'hours': round(sdata['timeSeconds'] / 3600, 1)
                }

        driver_list.append({
            'slug': u,
            'name': d['name'],
            'role': d.get('role', 'Driver'),
            'totalLaps': total_l,
            'cleanLaps': clean_l,
            'cleanPct': clean_pct,
            'hours': hours,
            'totalEvents': d['totalEvents'],
            'firstDay': d['firstDay'],
            'lastDay': d['lastDay'],
            'activeDaysCount': len(d['daysActive']),
            'favoriteCar': top_cars[0]['name'] if top_cars else 'None',
            'favoriteTrack': top_tracks[0]['name'] if top_tracks else 'None',
            'topCars': top_cars,
            'topTracks': top_tracks,
            'sessions': sessions_summary,
            'recentActivity': recent_activity
        })
        
    # Sort entire roster by total laps descending
    driver_list.sort(key=lambda x: x['totalLaps'], reverse=True)
    
    # Assign ranks
    for rank, d in enumerate(driver_list, start=1):
        d['rank'] = rank
        
    team_clean_pct = round((team_clean_laps / team_total_laps * 100), 1) if team_total_laps > 0 else 0.0
    team_hours = round(team_total_seconds / 3600, 1)
    
    output_data = {
        'syncedAt': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'team': {
            'name': team_name,
            'slug': team_slug,
            'totalDrivers': len(driver_list),
            'totalLaps': team_total_laps,
            'cleanLaps': team_clean_laps,
            'cleanPct': team_clean_pct,
            'totalHours': team_hours,
            'activeDays': len(team_days)
        },
        'drivers': driver_list
    }
    
    # 5. Save garage61-stats.json
    os.makedirs(TARGET_DATA_DIR, exist_ok=True)
    with open(GARAGE61_STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    print(f"\n[OK] Saved team telemetry to {GARAGE61_STATS_FILE}")

    # 6. Synchronize drivers.json list
    existing_drivers_list = []
    if os.path.exists(DRIVERS_JSON_FILE):
        try:
            with open(DRIVERS_JSON_FILE, 'r', encoding='utf-8') as f:
                existing_drivers_list = json.load(f)
        except Exception:
            pass

    existing_slugs = {
        (d.get('url', '').split('/')[-1].lower() if 'url' in d else d.get('slug', '').lower()): d
        for d in existing_drivers_list
    }
    
    updated_drivers_manifest = []
    for d in driver_list:
        slug = d['slug']
        url = f"https://garage61.net/app/drivers/{slug}"
        prev_role = existing_slugs.get(slug.lower(), {}).get('role')
        role = prev_role if prev_role else d.get('role', 'Driver')
        updated_drivers_manifest.append({
            'name': d['name'],
            'url': url,
            'role': role
        })

    # Preserve any existing drivers that may not be on G61 team yet
    for prev_slug, prev_d in existing_slugs.items():
        if not any(d['slug'].lower() == prev_slug for d in driver_list):
            updated_drivers_manifest.append(prev_d)

    updated_drivers_manifest.sort(key=lambda x: x.get('name', ''))
    with open(DRIVERS_JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated_drivers_manifest, f, indent=2, ensure_ascii=False)
    print(f"[OK] Updated roster manifest in {DRIVERS_JSON_FILE} ({len(updated_drivers_manifest)} drivers)")

    # 7. Update driver_stats_2.json (Driver Ratings cache)
    existing_stats = {}
    if os.path.exists(DRIVER_STATS_FILE):
        try:
            with open(DRIVER_STATS_FILE, 'r', encoding='utf-8') as f:
                existing_stats = json.load(f)
        except Exception:
            pass

    print("5. Syncing driver profile stats and ratings via Garage61 Team API...")
    updated_ratings_count = 0
    disc_cat_map = {
        'sports_car': 'Sports Car',
        'formula_car': 'Formula Car',
        'oval': 'Oval',
        'dirt_road': 'Dirt Road',
        'dirt_oval': 'Dirt Oval',
        'road': 'Road'
    }

    for m in members_raw:
        name = f"{m.get('firstName', '')} {m.get('lastName', '')}".strip()
        if not name:
            continue
        accounts = m.get('accounts', [])
        ir_acc = next((a for a in accounts if a.get('platform') == 'iracing'), None)
        if not ir_acc:
            continue
        ratings_list = ir_acc.get('ratings', [])
        if not ratings_list:
            continue

        entry = existing_stats.get(name, {
            'Sports Car': {'irating': None, 'sr': 'R 2.50'},
            'Formula Car': {'irating': None, 'sr': 'R 2.50'},
            'Oval': {'irating': None, 'sr': 'R 2.50'},
            'Dirt Road': {'irating': None, 'sr': 'R 2.50'},
            'Dirt Oval': {'irating': None, 'sr': 'R 2.50'},
            'Road': {'irating': None, 'sr': 'R 2.50'}
        })

        matched_any = False
        for r in ratings_list:
            cat = r.get('category')
            rtype = r.get('type')
            val = r.get('rating')
            disp = r.get('ratingDisplayAs')
            lic_class = r.get('licenseClass')
            target_cat = disc_cat_map.get(cat)
            if not target_cat:
                continue
            if target_cat not in entry:
                entry[target_cat] = {'irating': None, 'sr': 'R 2.50'}
            if rtype == 'irating' and val is not None and val > 0:
                entry[target_cat]['irating'] = int(val)
                matched_any = True
            elif rtype == 'safety_rating':
                if disp:
                    entry[target_cat]['sr'] = disp
                else:
                    entry[target_cat]['sr'] = format_sr(val, lic_class)
                matched_any = True

        if matched_any:
            existing_stats[name] = entry
            updated_ratings_count += 1

    # Save updated driver_stats_2.json
    with open(DRIVER_STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(existing_stats, f, indent=2, ensure_ascii=False)
    print(f"[OK] Saved driver stats & ratings to {DRIVER_STATS_FILE} (Updated {updated_ratings_count} drivers)")

    # 8. Render individual driver HTML profile pages
    if os.path.exists(DRIVER_TEMPLATE_FILE) and os.path.exists(DRIVERS_DIR):
        print(f"6. Updating individual driver HTML profiles in {DRIVERS_DIR}...")
        try:
            with open(DRIVER_TEMPLATE_FILE, 'r', encoding='utf-8') as tf:
                template = tf.read()

            disciplines_meta = [
                {"internal_key": "SPORTS", "display_name": "Sports Car"},
                {"internal_key": "FORMULA", "display_name": "Formula Car"},
                {"internal_key": "OVAL", "display_name": "Oval"},
                {"internal_key": "DIRT_ROAD", "display_name": "Dirt Road"},
                {"internal_key": "DIRT_OVAL", "display_name": "Dirt Oval"},
                {"internal_key": "ROAD", "display_name": "Road"}
            ]

            now_formatted = datetime.now().strftime("%d %b %Y")
            rendered_count = 0

            # Combine all drivers from driver_list and members_raw
            render_targets = {}
            for d in driver_list:
                render_targets[d['slug']] = {
                    'slug': d['slug'],
                    'name': d['name'],
                    'role': d.get('role', 'Driver'),
                    'totalLaps': d.get('totalLaps', 0),
                    'cleanPct': d.get('cleanPct', 0.0),
                    'hours': d.get('hours', 0.0)
                }
            for m in members_raw:
                slug = m.get('slug')
                if slug and slug not in render_targets:
                    name = f"{m.get('firstName', '')} {m.get('lastName', '')}".strip()
                    render_targets[slug] = {
                        'slug': slug,
                        'name': name,
                        'role': m.get('role', 'Driver'),
                        'totalLaps': 0,
                        'cleanPct': 0.0,
                        'hours': 0.0
                    }

            for slug, d in render_targets.items():
                name = d.get('name')
                if not slug or not name:
                    continue

                html = template
                url = f"https://garage61.net/app/drivers/{slug}"
                driver_ratings = existing_stats.get(name, {})

                html = html.replace("{{NAME}}", name)
                html = html.replace("{{NICKNAME}}", "")
                html = html.replace("{{MEMBER_SINCE}}", "N/A")
                html = html.replace("{{ROLE}}", d.get("role", "Driver") or "Driver")
                html = html.replace("{{G61_URL}}", url)
                html = html.replace("{{LAST_CHECKED}}", now_formatted)

                for disc in disciplines_meta:
                    int_key = disc["internal_key"]
                    disp_name = disc["display_name"]
                    cat_info = driver_ratings.get(disp_name, {})
                    ir_val = cat_info.get("irating")
                    lic = cat_info.get("sr", "R 2.50")
                    lic_class = get_license_class(lic)
                    pc = min(100, round((int(ir_val) / 6000) * 100, 2)) if ir_val and ir_val > 0 else 0

                    html = html.replace(f"{{{{IRATING_{int_key}}}}}", str(ir_val) if ir_val and ir_val > 0 else "---")
                    html = html.replace(f"{{{{IRATING_{int_key}_PC}}}}", str(pc))
                    html = html.replace(f"{{{{LICENSE_{int_key}}}}}", lic)
                    html = html.replace(f"{{{{LICENSE_CLASS_{int_key}}}}}", lic_class)
                    html = html.replace(f"{{{{RATING_DATE_{int_key}}}}}", f"({now_formatted})" if ir_val else "")

                html = html.replace("{{LAPS}}", str(d.get("totalLaps", "0")))
                html = html.replace("{{CLEAN_LAP_PC}}", str(d.get("cleanPct", "0")))
                hours_val = d.get("hours", 0)
                html = html.replace("{{TIME_ON_TRACK}}", f"{hours_val} hrs" if hours_val else "N/A")

                file_path = os.path.join(DRIVERS_DIR, f"{slug.lower()}.html")
                with open(file_path, "w", encoding="utf-8") as hf:
                    hf.write(html)
                rendered_count += 1

            print(f"[OK] Generated {rendered_count} driver HTML profiles.")
        except Exception as te:
            print(f"[WARN] Error updating driver HTML profiles: {te}")

    # Automatically stage generated data files for Git commit in CI/Actions
    try:
        import subprocess
        subprocess.run(['git', 'add', GARAGE61_STATS_FILE, DRIVER_STATS_FILE, DRIVERS_JSON_FILE, DRIVERS_DIR], cwd=REPO_ROOT, check=False)
    except Exception:
        pass

    print(f"\n[COMPLETE] Successfully synchronized all driver statistics!")
    print(f"Summary: {len(driver_list)} drivers, {team_total_laps:,} total laps, {team_hours:,} total hours.")

if __name__ == '__main__':
    sync()
