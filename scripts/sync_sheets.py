import requests
import csv
import os
import re

# Configuration
SHEET_ID = "181MOfjcifgL-UhEo-4PG3NjbKqa7XlbXnUtatjhASTw"
GIDS = {
    "imsa-classic-500.html": "549758646",
    "nurburgring-24h.html": "1805287380",
    "thruxton-4h.html": "901323614",
    "past/daytona-24.html": "0",
    "past/bathurst-12.html": "986051778",
    "past/sebring-12hr.html": "1508774965"
}

EVENT_DIR = os.path.join(os.path.dirname(__file__), "../events")

def fetch_csv(gid):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}"
    response = requests.get(url)
    response.raise_for_status()
    # Normalize line endings and return as list of lists
    return list(csv.reader(response.text.splitlines()))

def parse_registrations(rows):
    # Verified Structure:
    # Row 11 (Idx 10): Team Names (Col 0, 2, 4...)
    # Row 12 (Idx 11): Class (Col 1, 3, 5...)
    # Row 13 (Idx 12): Car (Col 1, 3, 5...)
    # Row 16 (Idx 15): Captain (Col 1, 3, 5...)
    # Row 17-21 (Idx 16-20): Drivers (Col 1, 3, 5...)
    
    if len(rows) < 11:
        return []
    
    teams = []
    header_row = rows[10]
    for col_idx in range(0, len(header_row), 2):
        team_name = header_row[col_idx].strip()
        if not team_name or team_name == "Team Registration":
            continue
            
        # Values are in the column to the right (col_idx + 1)
        val_col = col_idx + 1
        if val_col >= len(rows[11]): continue

        car_class = f"{rows[12][val_col].strip()} {rows[11][val_col].strip()}".strip()
        captain = rows[15][val_col].strip()
        
        drivers = []
        for row_idx in range(16, 21):
            if row_idx < len(rows) and val_col < len(rows[row_idx]):
                driver = rows[row_idx][val_col].strip()
                if driver:
                    drivers.append(driver)
        
        teams.append({
            "name": team_name,
            "car_class": car_class,
            "captain": captain,
            "drivers": drivers
        })
    return teams

def generate_html(teams):
    if not teams:
        return '\n                    <p style="color: var(--text-muted); font-size: 0.9rem;">No confirmed entries yet.</p>'
    
    html = ""
    for team in teams:
        html += f'''
                    <div class="lineup-item" style="margin-top: 1rem;">
                        <span style="color: var(--primary); font-weight: 600;">{team["name"]}</span><br>
                        <span style="font-size: 0.9rem; color: var(--text-muted);">{team["car_class"]}</span>
                    </div>
                    <ul style="list-style: none; margin-top: 0.5rem; padding-left: 1rem; border-left: 2px solid var(--primary);">
        '''
        if team["captain"]:
             html += f'                        <li>{team["captain"]} (C)</li>\n'
             
        for driver in team["drivers"]:
            if driver != team["captain"]:
                html += f'                        <li>{driver}</li>\n'
                
        html += '                    </ul>'
    return html

def update_event_files():
    for filename, gid in GIDS.items():
        print(f"Syncing {filename} (GID {gid})...")
        try:
            rows = fetch_csv(gid)
            teams = parse_registrations(rows)
            new_html = generate_html(teams)
            
            filepath = os.path.join(EVENT_DIR, filename)
            if not os.path.exists(filepath):
                print(f"Skipping {filename}: file not found at {filepath}")
                continue
                
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Use regex to find and replace between markers
            pattern = r"<!-- LINEUP_START -->.*?<!-- LINEUP_END -->"
            replacement = f"<!-- LINEUP_START -->{new_html}\n                    <!-- LINEUP_END -->"
            
            if re.search(pattern, content, re.DOTALL):
                new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {filename}")
            else:
                print(f"Markers not found in {filename}")
                
        except Exception as e:
            print(f"Error syncing {filename}: {e}")

if __name__ == "__main__":
    update_event_files()
