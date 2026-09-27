import urllib.request
import json
import os
import sys
from collections import defaultdict
from datetime import datetime

TOKEN = os.environ.get('GARAGE61_TOKEN') or os.environ.get('G61_PAT') or 'ZTLHNDQWYZATNMJHMC0ZOWQ5LTLKOTUTYTZJYZG0ZGJKOGU5'
HEADERS = {'Authorization': f'Bearer {TOKEN}', 'User-Agent': 'GRiD-UP-Telemetry/1.0'}
TEAM_ID = '01J4FHVP9N8APEV93B13HS16R8' # Grid Up Sim Racing

def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def sync():
    print("=== Fetching Garage61 Data for GRiD UP Sim Racing ===")
    
    # 1. Cars
    print("1. Fetching cars catalogue...")
    cars_raw = fetch_json('https://garage61.net/api/v1/cars').get('items', [])
    cars_map = {c['id']: c['name'] for c in cars_raw}
    
    # 2. Tracks
    print("2. Fetching tracks catalogue...")
    tracks_raw = fetch_json('https://garage61.net/api/v1/tracks').get('items', [])
    tracks_map = {t['id']: f"{t['name']}{(' - ' + t['variant']) if t.get('variant') else ''}" for t in tracks_raw}
    
    # 3. Team members
    print("3. Fetching team members...")
    team_data = fetch_json(f'https://garage61.net/api/v1/teams/{TEAM_ID}')
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
            'slug': slug
        }
    
    # 4. Driving statistics
    print("4. Fetching team driving statistics...")
    stats_data = fetch_json(f'https://garage61.net/api/v1/teams/{TEAM_ID}/statistics')
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
            m_info = members_map.get(u, {'name': u.replace('-', ' ').title(), 'slug': u, 'firstName': '', 'lastName': ''})
            drivers[u] = {
                'slug': u,
                'name': m_info['name'],
                'firstName': m_info.get('firstName', ''),
                'lastName': m_info.get('lastName', ''),
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
                'recentDays': defaultdict(int) # day -> laps for recent 30-day view
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
    
    # Write to target data file in repo
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    target_dir = os.path.join(repo_root, 'data')
    os.makedirs(target_dir, exist_ok=True)
    target_file = os.path.join(target_dir, 'garage61-stats.json')
    with open(target_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    print(f"\n[SUCCESS] Saved driver statistics to {target_file}")
    print(f"Summary: {len(driver_list)} drivers, {team_total_laps:,} total laps, {team_hours:,} total hours.")
    
if __name__ == '__main__':
    sync()
