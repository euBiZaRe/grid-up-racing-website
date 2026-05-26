import json
import os
import re
import sys
import time
from playwright.sync_api import sync_playwright
import firebase_admin
from firebase_admin import credentials, firestore

# Configuration
DRIVERS_JSON = os.path.join(os.path.dirname(__file__), "drivers.json")
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "../drivers/driver-template.html")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../drivers")

# Initialize Firebase
def init_firebase():
    sa_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    if sa_json:
        try:
            cred = credentials.Certificate(json.loads(sa_json))
            firebase_admin.initialize_app(cred)
            return firestore.client()
        except Exception as e:
            print(f"Firebase init failed: {e}")
    return None

db = init_firebase()

def report_progress(current, total, driver_name):
    if db:
        try:
            db.collection('sync_requests').doc('update-profiles.yml').update({
                'currentStep': current,
                'totalSteps': total,
                'currentDriver': driver_name,
                'status': 'running'
            })
        except Exception as e:
            print(f"Failed to report progress: {e}")

def generate_filename(slug):
    return slug.lower() + ".html"

def get_license_class(license_str):
    if not license_str or license_str == "N/A" or license_str == "---":
        return "license-r"
    first_char = license_str[0].upper()
    return "license-" + first_char.lower()

def fetch_driver_data_scrape(slug):
    """Fetch driver data by scraping the public Garage 61 profile."""
    url = f"https://garage61.net/app/drivers/{slug}"
    
    data = {
        "nickname": "", 
        "memberSince": "N/A", 
        "iRatings": {}, 
        "licenseLevels": {}, 
        "iRatingPercentages": {}, 
        "totalLaps": "0", 
        "cleanPercentage": "0", 
        "timeOnTrack": "N/A"
    }

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            page = context.new_page()
            
            page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Wait for the statistics table to load
            page.wait_for_selector(".statistics", timeout=15000)
            
            # 1. Scrape Nickname
            nickname_element = page.locator("h1").first
            if nickname_element.count() > 0:
                data["nickname"] = nickname_element.text_content().strip()

            # 2. Scrape Member Since
            mem_since = page.locator("dt:has-text('Member since') + dd").first
            if mem_since.count() > 0:
                data["memberSince"] = mem_since.text_content().strip()

            # 3. Scrape iRatings and Licenses
            disciplines = {
                "Sports Car": "SPORTS",
                "Formula": "FORMULA",
                "Formula Car": "FORMULA", # fallback
                "Oval": "OVAL",
                "Dirt Oval": "DIRT"
            }
            
            for display_name, internal_key in disciplines.items():
                row = page.locator(f"tr:has-text('{display_name}')").first
                if row.count() > 0:
                    cols = row.locator("td").all_text_contents()
                    if len(cols) >= 3:
                        ir_val_str = cols[1].replace(',', '').strip() # e.g. "3863"
                        lic_text = cols[2].strip() # e.g. "A 4.99"
                        
                        try:
                            ir_val = int(ir_val_str)
                            # Only set if not already set (handles Formula vs Formula Car)
                            if internal_key not in data["iRatings"] or data["iRatings"][internal_key] == 0:
                                data["iRatings"][internal_key] = ir_val
                                data["licenseLevels"][internal_key] = lic_text
                                data["iRatingPercentages"][internal_key] = min(100, round((ir_val / 6000) * 100, 2))
                        except ValueError:
                            pass

            # 4. Scrape Career Stats (Table rows)
            try:
                laps_row = page.locator("tr:has-text('Laps driven')").first
                if laps_row.count() > 0:
                    laps_text = laps_row.locator("td").text_content().strip()
                    # Pattern: "328 (58% clean)"
                    match = re.search(r"(\d+)\s*\(([\d.]+)%\s*clean\)", laps_text)
                    if match:
                        data["totalLaps"] = match.group(1)
                        data["cleanPercentage"] = match.group(2)
                    else:
                        data["totalLaps"] = laps_text.split()[0]
            except: pass
            
            try:
                time_row = page.locator("tr:has-text('Time on track')").first
                if time_row.count() > 0:
                    data["timeOnTrack"] = time_row.locator("td").text_content().strip()
            except: pass

            browser.close()
            return data
    except Exception as e:
        print(f"Scraping failed for {slug}: {e}")
        return None

def load_drivers_list():
    drivers = []
    
    # 1. Try Firestore SDK (with service account)
    if db:
        try:
            print("Fetching driver list from Firestore via Admin SDK...")
            docs = db.collection("drivers").get()
            for doc in docs:
                data = doc.to_dict()
                if data.get('active') != False and data.get('slug'):
                    drivers.append({
                        "name": data['name'],
                        "url": f"https://garage61.net/app/drivers/{data['slug']}"
                    })
            print(f"Loaded {len(drivers)} active drivers from Firestore via Admin SDK.")
        except Exception as e:
            print(f"Firestore Admin SDK fetch failed: {e}")

    # 2. Try Firestore REST API (without service account)
    if not drivers:
        try:
            print("Fetching driver list from Firestore via REST API...")
            import requests
            url = "https://firestore.googleapis.com/v1/projects/grid-up/databases/(default)/documents/drivers?pageSize=100"
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                docs = r.json().get('documents', [])
                for doc in docs:
                    fields = doc.get('fields', {})
                    active_field = fields.get('active', {})
                    active = active_field.get('booleanValue', True)
                    
                    name_field = fields.get('name', {})
                    name = name_field.get('stringValue')
                    
                    slug_field = fields.get('slug', {})
                    slug = slug_field.get('stringValue')
                    
                    if active != False and name and slug:
                        drivers.append({
                            "name": name,
                            "url": f"https://garage61.net/app/drivers/{slug}"
                        })
                print(f"Loaded {len(drivers)} active drivers from Firestore via REST API.")
        except Exception as e:
            print(f"Firestore REST API fetch failed: {e}")

    # 3. Fallback to local drivers.json
    if not drivers:
        if os.path.exists(DRIVERS_JSON):
            print("Falling back to local drivers.json...")
            with open(DRIVERS_JSON, "r") as f:
                drivers = json.load(f)
        else:
            print(f"Error: {DRIVERS_JSON} not found and Firestore query failed.")
            
    # Sort and update drivers.json if we got a valid list
    if drivers:
        drivers.sort(key=lambda x: x['name'].lower())
        try:
            with open(DRIVERS_JSON, "w", encoding="utf-8") as f:
                json.dump(drivers, f, indent=2)
            print(f"Synchronized local {DRIVERS_JSON} with Firestore.")
        except Exception as e:
            print(f"Failed to save drivers.json: {e}")
            
    return drivers

def update_profiles():
    # Load drivers
    drivers = load_drivers_list()
    if not drivers:
        print("No drivers to update.")
        return
        
    # Load template
    if not os.path.exists(TEMPLATE_PATH):
        print(f"Error: {TEMPLATE_PATH} not found.")
        return

    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template = f.read()

    total_drivers = len(drivers)
    active_filenames = set()

    for i, driver in enumerate(drivers):
        name = driver["name"]
        url = driver["url"]
        slug = url.split("/")[-1]
        
        print(f"Processing {name} ({slug})... ({i+1}/{total_drivers})")
        report_progress(i + 1, total_drivers, name)
        
        # Scrape data via Playwright
        stats = fetch_driver_data_scrape(slug)
        
        # Avoid rate limiting
        time.sleep(3)
        
        if not stats:
            print(f"Scraping failed for {slug}. Generating profile with default stats.")
            stats = {
                "nickname": "", 
                "memberSince": "N/A", 
                "iRatings": {}, 
                "licenseLevels": {}, 
                "iRatingPercentages": {}, 
                "totalLaps": "0", 
                "cleanPercentage": "0", 
                "timeOnTrack": "N/A"
            }
            
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
        filename = generate_filename(slug)
        active_filenames.add(filename)
        output_path = os.path.join(OUTPUT_DIR, filename)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Successfully updated {filename}")

    # Clean up inactive/deleted driver profiles
    try:
        for f in os.listdir(OUTPUT_DIR):
            if f.endswith(".html") and f != "driver-template.html":
                if f not in active_filenames:
                    file_to_delete = os.path.join(OUTPUT_DIR, f)
                    print(f"Removing inactive/deleted driver profile: {f}")
                    os.remove(file_to_delete)
    except Exception as e:
        print(f"Failed to clean up inactive driver profiles: {e}")

if __name__ == "__main__":
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    update_profiles()
