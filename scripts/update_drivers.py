import json
import os
import re
import requests
import sys

# Configuration
DRIVERS_JSON = os.path.join(os.path.dirname(__file__), "drivers.json")
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "../drivers/driver-template.html")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../drivers")
G61_PAT = os.environ.get("G61_PAT")

def generate_filename(name):
    # Sanitize name for filename
    clean = name.lower().replace(" ", "-").replace("'", "").replace(".", "").replace("(", "").replace(")", "")
    return clean + ".html"

def get_license_class(license_str):
    if not license_str or license_str == "N/A" or license_str == "---":
        return "license-r"
    first_char = license_str[0].upper()
    return "license-" + first_char.lower()

def fetch_driver_data_api(slug):
    """Fetch driver data using the Garage 61 API."""
    if not G61_PAT:
        print("G61_PAT not set, skipping API fetch.")
        return None

    headers = {"Authorization": f"Bearer {G61_PAT}"}
    
    # Garage61 API Endpoints (estimated from community wrappers)
    # 1. Driver Info
    # 2. Driver Stats
    
    data = {"nickname": "", "memberSince": "N/A", "iRatings": {}, "licenseLevels": {}, "iRatingPercentages": {}, "totalLaps": "0", "cleanPercentage": "0", "timeOnTrack": "N/A"}
    
    try:
        # Fetch basic profile
        profile_url = f"https://api.garage61.net/v1/drivers/{slug}"
        resp = requests.get(profile_url, headers=headers)
        if resp.status_code == 200:
            profile = resp.json()
            data["nickname"] = profile.get("nickname", "")
            data["memberSince"] = profile.get("createdAt", "N/A").split("T")[0]
            
            # Connected accounts for iRacing stats
            for account in profile.get("connectedAccounts", []):
                if account.get("provider") == "iracing":
                    # iRacing data is often nested
                    # Note: API structure might vary, this is a best-guess based on public wrappers
                    stats = account.get("statistics", {})
                    
                    disciplines = {
                        "sports": "SPORTS",
                        "formula": "FORMULA",
                        "oval": "OVAL",
                        "dirt_oval": "DIRT"
                    }
                    
                    for api_key, internal_key in disciplines.items():
                        ir_data = stats.get(api_key, {})
                        ir_val = ir_data.get("iRating", 0)
                        lic_text = ir_data.get("license", {}).get("groupName", "R") + " " + str(ir_data.get("license", {}).get("safetyRating", "2.50"))
                        
                        data["iRatings"][internal_key] = ir_val
                        data["licenseLevels"][internal_key] = lic_text
                        data["iRatingPercentages"][internal_key] = min(100, round((ir_val / 6000) * 100, 2))

        # Fetch detailed stats
        stats_url = f"https://api.garage61.net/v1/drivers/{slug}/statistics"
        resp = requests.get(stats_url, headers=headers)
        if resp.status_code == 200:
            stats = resp.json()
            data["totalLaps"] = f"{stats.get('totalLaps', 0):,}"
            data["cleanPercentage"] = str(round(stats.get('cleanLapsPercentage', 0)))
            
            # Format time on track (seconds to h m s)
            seconds = stats.get('timeOnTrack', 0)
            h = seconds // 3600
            m = (seconds % 3600) // 60
            data["timeOnTrack"] = f"{h}h {m}m"

        return data
    except Exception as e:
        print(f"API Error for {slug}: {e}")
        return None

def update_profiles():
    # Load drivers
    if not os.path.exists(DRIVERS_JSON):
        print(f"Error: {DRIVERS_JSON} not found.")
        return

    with open(DRIVERS_JSON, "r") as f:
        drivers = json.load(f)
        
    # Load template
    if not os.path.exists(TEMPLATE_PATH):
        print(f"Error: {TEMPLATE_PATH} not found.")
        return

    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template = f.read()

    for driver in drivers:
        name = driver["name"]
        url = driver["url"]
        slug = url.split("/")[-1]
        
        print(f"Processing {name} ({slug})...")
        
        # Try API first
        stats = fetch_driver_data_api(slug)
        
        if not stats:
            print(f"Skipping {name} due to missing data.")
            continue
            
        # Hydrate template
        html = template
        html = html.replace("{{NAME}}", name)
        html = html.replace("{{NICKNAME}}", stats.get("nickname", ""))
        html = html.replace("{{MEMBER_SINCE}}", stats.get("memberSince", "N/A"))
        html = html.replace("{{G61_URL}}", url)
        
        for key in ["SPORTS", "FORMULA", "OVAL", "DIRT"]:
            ir = stats["iRatings"].get(key, 0)
            lic = stats["licenseLevels"].get(key, "R 2.50")
            pc = stats["iRatingPercentages"].get(key, 0)
            lic_class = get_license_class(lic)
            
            html = html.replace("{{IRATING_" + key + "}}", str(ir) if ir > 0 else "---")
            html = html.replace("{{IRATING_" + key + "_PC}}", str(pc))
            html = html.replace("{{LICENSE_" + key + "}}", lic)
            html = html.replace("{{LICENSE_CLASS_" + key + "}}", lic_class)
        
        html = html.replace("{{LAPS}}", stats.get("totalLaps", "0"))
        html = html.replace("{{CLEAN_LAP_PC}}", stats.get("cleanPercentage", "0"))
        html = html.replace("{{TIME_ON_TRACK}}", stats.get("timeOnTrack", "N/A"))
        
        # Write output
        filename = generate_filename(name)
        output_path = os.path.join(OUTPUT_DIR, filename)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Successfully updated {filename}")

if __name__ == "__main__":
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    update_profiles()
