import json
import os
import re

def hydrate_profiles():
    data_path = 'scripts/scraped_data.json'
    drivers_dir = 'drivers/'
    
    with open(data_path, 'r', encoding='utf-8') as f:
        scraped_data = json.load(f)
        
    for driver in scraped_data:
        name = driver['name']
        # Robust filename mapping
        filename = name.lower().replace(' ', '-').replace("'", "").replace(".", "") + '.html'
        if name == "Adam Jones": filename = "adam-jones.html"
        if name == "Jacob Reid": filename = "jacob-reid.html"
        if "Matthew Graham" in name: filename = "matthew-graham-4.html" # Fixed for Batch 2 name
        
        filepath = os.path.join(drivers_dir, filename)
        if not os.path.exists(filepath):
            print(f"File {filepath} not found for {name}. Skipping.")
            continue
            
        print(f"Hydrating {filename}...")
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 1. Member Since
        ms = driver.get('member_since', 'N/A')
        if ',' in ms: ms = ms.split(',')[0]
        content = content.replace("Member since N/A", f"Member since {ms}")
        
        # 2. iRatings & Licenses
        cat_map = {
            "sports_car": "Sports Car",
            "formula_car": "Formula",
            "oval": "Oval",
            "dirt_oval": "Dirt"
        }
        
        for key, disp in cat_map.items():
            ir = driver['iratings'].get(key, '---')
            lic = driver['licenses'].get(key, '---')
            
            # Use specific classes
            lic_class = "license-r"
            if lic.startswith('A'): lic_class = "license-a"
            elif lic.startswith('B'): lic_class = "license-b"
            elif lic.startswith('C'): lic_class = "license-c"
            elif lic.startswith('D'): lic_class = "license-d"
            
            # Surgical replacement for Info and iRating
            pattern = rf'<span>{disp} <span class="license-badge [^"]+">[^<]+</span></span>\s*<span>[^<]+</span>'
            replacement = f'<span>{disp} <span class="license-badge {lic_class}">{lic}</span></span>\n                        <span>{ir}</span>'
            content = re.sub(pattern, replacement, content)
            
            # Safety-first replacement for progress bars using \g<1>
            ir_val = 0
            try: ir_val = int(ir)
            except: pass
            width = min(100, int((ir_val / 4000) * 100)) if ir_val > 0 else 0
            
            bar_pattern = rf'(<span>{disp} .*?</span>\s*</div>\s*<div class="rating-bar-bg"><div class="rating-bar-fill" style="width: )0%(;"></div></div>)'
            content = re.sub(bar_pattern, rf'\g<1>{width}%\g<2>', content, flags=re.DOTALL)

        # 3. Career Stats
        laps = driver.get('laps_driven', driver.get('total_laps', '0'))
        clean = driver.get('clean_percent', '0%')
        time = driver.get('time_on_track', 'N/A')
        
        content = content.replace('<div class="big-stat">0</div>\n                            <div class="big-stat-label">Laps Driven</div>', 
                                  f'<div class="big-stat">{laps}</div>\n                            <div class="big-stat-label">Laps Driven</div>')
        content = content.replace('<div class="big-stat">0%</div>\n                            <div class="big-stat-label">Clean Laps</div>', 
                                  f'<div class="big-stat">{clean}</div>\n                            <div class="big-stat-label">Clean Laps</div>')
        content = content.replace('<div class="big-stat">N/A</div>\n                            <div class="big-stat-label">Total Time on Track</div>', 
                                  f'<div class="big-stat">{time}</div>\n                            <div class="big-stat-label">Total Time on Track</div>')

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == "__main__":
    hydrate_profiles()
