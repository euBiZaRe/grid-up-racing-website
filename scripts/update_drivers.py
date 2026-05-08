import json
import os
import re
import sys
import time
from playwright.sync_api import sync_playwright

# Configuration
DRIVERS_JSON = os.path.join(os.path.dirname(__file__), "drivers.json")
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "../drivers/driver-template.html")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../drivers")

def generate_filename(name):
    # Sanitize name for filename
    clean = name.lower().replace(" ", "-").replace("'", "").replace(".", "").replace("(", "").replace(")", "")
    return clean + ".html"

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
                        lic_text = cols[1].strip() # e.g. "A 4.99"
                        ir_val_str = cols[2].replace(',', '').strip() # e.g. "3863"
                        
                        try:
                            ir_val = int(ir_val_str)
                            # Only set if not already set (handles Formula vs Formula Car)
                            if internal_key not in data["iRatings"] or data["iRatings"][internal_key] == 0:
                                data["iRatings"][internal_key] = ir_val
                                data["licenseLevels"][internal_key] = lic_text
                                data["iRatingPercentages"][internal_key] = min(100, round((ir_val / 6000) * 100, 2))
                        except ValueError:
                            pass

            # 4. Scrape Total Laps / Time
            try:
                laps_val = page.locator("div:has-text('Total Laps')").locator("..").locator("div").first.text_content()
                if laps_val: data["totalLaps"] = laps_val.strip()
            except: pass
            
            try:
                clean_val = page.locator("div:has-text('Clean laps')").locator("..").locator("div").first.text_content()
                if clean_val: data["cleanPercentage"] = clean_val.replace('%', '').strip()
            except: pass
            
            try:
                time_val = page.locator("div:has-text('Time on track')").locator("..").locator("div").first.text_content()
                if time_val: data["timeOnTrack"] = time_val.strip()
            except: pass

            browser.close()
            return data
    except Exception as e:
        print(f"Scraping failed for {slug}: {e}")
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
        
        # Scrape data via Playwright
        stats = fetch_driver_data_scrape(slug)
        
        # Avoid rate limiting
        time.sleep(3)
        
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
