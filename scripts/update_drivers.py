import json
import os
import re
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

def scrape_driver_data(page, url):
    print(f"Scraping {url}...")
    page.goto(url, wait_until="networkidle")
    
    data = {}
    
    try:
        # Basic Info
        data["nickname"] = page.locator("header .nickname").text_content(timeout=5000).strip()
    except:
        data["nickname"] = ""
        
    try:
        data["memberSince"] = page.locator("dt:has-text('Member since') + dd").text_content(timeout=5000).strip()
    except:
        data["memberSince"] = "N/A"
        
    # iRacing Stats
    # We find the table rows that contain the discipline names
    data["iRatings"] = {}
    data["licenseLevels"] = {}
    data["iRatingPercentages"] = {}
    
    disciplines = {
        "Sports Car": "SPORTS",
        "Formula": "FORMULA",
        "Oval": "OVAL",
        "Dirt Oval": "DIRT"
    }

    # Max iRating for percentage calculation (visual ceiling)
    MAX_IRATING = 6000

    for disp_name, internal_key in disciplines.items():
        try:
            # Find the row in the connected accounts table
            row = page.locator(f"tr:has-text('{disp_name}')")
            if row.count() > 0:
                ir_text = row.locator("td").nth(1).text_content().strip()
                lic_text = row.locator("td").nth(2).locator(".badge").text_content().strip()
                
                # Cleanup irating (remove comma)
                ir_val = int(ir_text.replace(",", "")) if ir_text.replace(",", "").isdigit() else 0
                
                data["iRatings"][internal_key] = ir_val
                data["licenseLevels"][internal_key] = lic_text
                data["iRatingPercentages"][internal_key] = min(100, round((ir_val / MAX_IRATING) * 100, 2))
            else:
                data["iRatings"][internal_key] = 0
                data["licenseLevels"][internal_key] = "R 2.50"
                data["iRatingPercentages"][internal_key] = 0
        except:
            data["iRatings"][internal_key] = 0
            data["licenseLevels"][internal_key] = "R 2.50"
            data["iRatingPercentages"][internal_key] = 0

    # Career Stats
    try:
        laps_text = page.locator("dt:has-text('Laps driven') + dd").text_content().strip()
        # Extract number and percentage
        # Format: "7,301 (76% clean)"
        match = re.search(r"([\d,]+)\s*\((\d+)% clean\)", laps_text)
        if match:
            data["totalLaps"] = match.group(1)
            data["cleanPercentage"] = match.group(2)
        else:
            data["totalLaps"] = laps_text
            data["cleanPercentage"] = "0"
    except:
        data["totalLaps"] = "0"
        data["cleanPercentage"] = "0"

    try:
        data["timeOnTrack"] = page.locator("dt:has-text('Time on track') + dd").first.text_content().strip()
    except:
        data["timeOnTrack"] = "N/A"
        
    return data

def update_profiles():
    # Load drivers
    with open(DRIVERS_JSON, "r") as f:
        drivers = json.load(f)
        
    # Load template
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template = f.read()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        for driver in drivers:
            name = driver["name"]
            url = driver["url"]
            
            try:
                stats = scrape_driver_data(page, url)
                
                # Hydrate template
                html = template
                html = html.replace("{{NAME}}", name)
                html = html.replace("{{NICKNAME}}", stats["nickname"])
                html = html.replace("{{MEMBER_SINCE}}", stats["memberSince"])
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
                
                html = html.replace("{{LAPS}}", stats["totalLaps"])
                html = html.replace("{{CLEAN_LAP_PC}}", stats["cleanPercentage"])
                html = html.replace("{{TIME_ON_TRACK}}", stats["timeOnTrack"])
                
                # Write output
                filename = generate_filename(name)
                output_path = os.path.join(OUTPUT_DIR, filename)
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(html)
                print(f"Successfully updated {filename}")
                
            except Exception as e:
                print(f"Error updating {name}: {e}")
                
        browser.close()

if __name__ == "__main__":
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    update_profiles()
