import json
import os
import re
import sys
import time
from datetime import datetime, timezone
import requests
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    firebase_admin = None
    credentials = None
    firestore = None

# File paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Automatically load .env if present
def load_env():
    for p in [os.path.join(BASE_DIR, '.env'), os.path.expanduser('~/.env')]:
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
DRIVERS_JSON = os.path.join(BASE_DIR, "scripts", "drivers.json")
DRIVER_STATS_JSON = os.path.join(BASE_DIR, "driver_stats_2.json")
GARAGE61_STATS_JSON = os.path.join(BASE_DIR, "data", "garage61-stats.json")
TEMPLATE_PATH = os.path.join(BASE_DIR, "drivers", "driver-template.html")
DRIVERS_DIR = os.path.join(BASE_DIR, "drivers")

API_BASE_URL = "https://iracing6-backend.herokuapp.com/api/member-career-stats/career"

DEFAULT_G61_PAT = "ZTLHNDQWYZATNMJHMC0ZOWQ5LTLKOTUTYTZJYZG0ZGJKOGU5"
G61_PAT = (
    os.environ.get("G61_PAT")
    or os.environ.get("GARAGE61_TOKEN")
    or os.environ.get("GARAGE61_API_KEY")
    or DEFAULT_G61_PAT
)
G61_TEAM_IDS = [
    "01J4FHVP9N8APEV93B13HS16R8",  # Grid Up Sim Racing
    "01M3FAG0DM8WY94935B01AVP1P",  # GRiD UP Endurance Team
    "01K66T1F5FMEA2N9V2MC27EB7T",  # Refined Motorsport
]

DISCIPLINES = [
    {"api_key": "sports_car", "internal_key": "SPORTS", "display_name": "Sports Car", "short_name": "Sports Car", "iracing_key": "sportsCar"},
    {"api_key": "formula_car", "internal_key": "FORMULA", "display_name": "Formula Car", "short_name": "Formula", "iracing_key": "formulaCar"},
    {"api_key": "oval", "internal_key": "OVAL", "display_name": "Oval", "short_name": "Oval", "iracing_key": "oval"},
    {"api_key": "dirt_road", "internal_key": "DIRT_ROAD", "display_name": "Dirt Road", "short_name": "Dirt Road", "iracing_key": "dirtRoad"},
    {"api_key": "dirt_oval", "internal_key": "DIRT_OVAL", "display_name": "Dirt Oval", "short_name": "Dirt Oval", "iracing_key": "dirtOval"},
    {"api_key": "road", "internal_key": "ROAD", "display_name": "Road", "short_name": "Road", "iracing_key": "road"}
]

def normalize_name(name_str):
    if not name_str:
        return ""
    s = str(name_str).lower()
    s = re.sub(r"[^a-z0-9\s]", "", s)
    s = re.sub(r"\b[a-z]\b", "", s)
    s = re.sub(r"\d+$", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def fetch_garage61_team_ratings():
    """
    Fetches real-time member ratings for all team drivers across all Garage 61 teams.
    Returns dictionaries indexed by iracing customerId, driver name/normalized name, and member slug.
    """
    by_cid = {}
    by_name = {}
    by_slug = {}

    if not G61_PAT:
        return by_cid, by_name, by_slug

    headers = {
        "Authorization": f"Bearer {G61_PAT}",
        "User-Agent": "GRiD-UP-Rating-Updater/2.0",
        "Accept": "application/json"
    }

    cat_map = {
        "sports_car": "sportsCar",
        "formula_car": "formulaCar",
        "oval": "oval",
        "dirt_road": "dirtRoad",
        "dirt_oval": "dirtOval",
        "road": "road"
    }
    int_map = {
        "sportsCar": "SPORTS",
        "formulaCar": "FORMULA",
        "oval": "OVAL",
        "dirtRoad": "DIRT_ROAD",
        "dirtOval": "DIRT_OVAL",
        "road": "ROAD"
    }

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    now_formatted = datetime.now().strftime("%d %b %Y")
    total_members_seen = 0

    for team_id in G61_TEAM_IDS:
        url = f"https://garage61.net/api/v1/teams/{team_id}"
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code != 200:
                continue
            data = resp.json()
            members = data.get("members", [])
            for m in members:
                first = m.get("firstName", "")
                last = m.get("lastName", "")
                full_name = f"{first} {last}".strip()
                slug = m.get("slug", "").strip().lower()
                accounts = m.get("accounts", [])
                ir_acc = next((a for a in accounts if a.get("platform") == "iracing"), None)
                if not ir_acc:
                    continue

                cid = str(ir_acc.get("id", "")).strip()
                ir_acc_name = (ir_acc.get("name") or "").strip()
                ratings_list = ir_acc.get("ratings", [])
                if not ratings_list:
                    continue

                total_members_seen += 1
                parsed_data = {
                    "customerId": int(cid) if cid.isdigit() else cid,
                    "displayName": full_name or ir_acc_name,
                    "irAccountName": ir_acc_name,
                    "lastChecked": now_iso,
                    "ratings": {},
                    "licenseLevels": {},
                    "iRatings": {},
                    "iRatingPercentages": {}
                }

                # Initialize defaults
                for d in DISCIPLINES:
                    k = d["iracing_key"]
                    ik = d["internal_key"]
                    parsed_data["ratings"][k] = {"value": 0, "updated": None}
                    parsed_data["iRatings"][ik] = 0
                    parsed_data["licenseLevels"][ik] = "R 2.50"
                    parsed_data["iRatingPercentages"][ik] = 0

                for r in ratings_list:
                    cat = r.get("category")
                    rtype = r.get("type")
                    val = r.get("rating")
                    disp = r.get("ratingDisplayAs")
                    lic_class = r.get("licenseClass")

                    ir_key = cat_map.get(cat)
                    if not ir_key:
                        continue
                    int_key = int_map.get(ir_key)

                    if rtype == "irating" and val is not None and val > 0:
                        parsed_data["ratings"][ir_key]["value"] = int(val)
                        parsed_data["ratings"][ir_key]["updated"] = now_formatted
                        parsed_data["iRatings"][int_key] = int(val)
                        parsed_data["iRatingPercentages"][int_key] = min(100, round((int(val) / 6000) * 100, 2))
                    elif rtype == "safety_rating":
                        sr_text = disp if disp else format_safety_rating(val, lic_class)
                        parsed_data["licenseLevels"][int_key] = sr_text

                if cid and cid not in by_cid:
                    by_cid[cid] = parsed_data
                if full_name:
                    by_name[full_name.lower()] = parsed_data
                    norm_fn = normalize_name(full_name)
                    if norm_fn:
                        by_name[norm_fn] = parsed_data
                if ir_acc_name:
                    by_name[ir_acc_name.lower()] = parsed_data
                    norm_ir = normalize_name(ir_acc_name)
                    if norm_ir:
                        by_name[norm_ir] = parsed_data
                if slug and slug not in by_slug:
                    by_slug[slug] = parsed_data
        except Exception as e:
            print(f"[WARN] Garage 61 team fetch error ({team_id}): {e}")

    print(f"[OK] Loaded Garage 61 ratings across {len(G61_TEAM_IDS)} teams (Mapped {len(by_cid)} unique iRacing accounts, {len(by_slug)} slugs)")
    return by_cid, by_name, by_slug

def init_firebase():
    """Initializes Firebase Admin SDK using environment variable or local credential."""
    if not firebase_admin:
        return None
    sa_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    if sa_json:
        try:
            cred = credentials.Certificate(json.loads(sa_json))
            firebase_admin.initialize_app(cred)
            return firestore.client()
        except Exception as e:
            print(f"Firebase init via env failed: {e}")

    # Try local credentials path
    local_creds = [
        os.path.join(BASE_DIR, "..", "grid-up-firebase-adminsdk-fbsvc-11d85f59be.json"),
        os.path.join(BASE_DIR, "grid-up-firebase-adminsdk-fbsvc-11d85f59be.json"),
        r"F:\Grid Up\grid-up-firebase-adminsdk-fbsvc-11d85f59be.json"
    ]
    for p in local_creds:
        if os.path.exists(p):
            try:
                cred = credentials.Certificate(p)
                firebase_admin.initialize_app(cred)
                return firestore.client()
            except Exception as e:
                print(f"Firebase local init failed for {p}: {e}")
    return None

db = init_firebase()

def license_level_to_letter(license_level):
    """Converts iRacing license_level integer to letter code."""
    if license_level is None or license_level == "":
        return "R"
    try:
        lvl = int(license_level)
        if lvl <= 4:
            return "R"
        elif lvl <= 8:
            return "D"
        elif lvl <= 12:
            return "C"
        elif lvl <= 16:
            return "B"
        elif lvl <= 20:
            return "A"
        else:
            return "P"
    except (ValueError, TypeError):
        return "R"

def format_safety_rating(safety_rating, license_level):
    """Formats safety rating and license level into standard string e.g. 'B 3.67'."""
    letter = license_level_to_letter(license_level)
    if safety_rating is None or safety_rating == "" or safety_rating == "N/A":
        return f"{letter} 2.50"
    try:
        sr_val = float(safety_rating)
        return f"{letter} {sr_val:.2f}"
    except (ValueError, TypeError):
        return f"{letter} 2.50"

def get_license_class(license_str):
    """Returns CSS class for license badge (e.g. license-b)."""
    if not license_str or license_str == "N/A" or license_str == "---":
        return "license-r"
    first_char = license_str.strip()[0].upper()
    if first_char in ['A', 'B', 'C', 'D', 'R', 'P']:
        return f"license-{first_char.lower()}"
    return "license-r"

def format_date_str(date_str):
    """Formats ISO or YYYY-MM-DD date into friendly '19 Aug 2026' string."""
    if not date_str:
        return "N/A"
    try:
        clean_date = date_str.split("T")[0]
        dt = datetime.strptime(clean_date, "%Y-%m-%d")
        return dt.strftime("%d %b %Y")
    except Exception:
        return str(date_str)

def fetch_career_stats(customer_id, max_retries=2):
    """
    Fetches career statistics for a customer ID from the fallback iRacing career stats API.
    """
    url = f"{API_BASE_URL}/{customer_id}"
    headers = {
        "User-Agent": "GRiD-UP-Rating-Updater/1.0",
        "Accept": "application/json"
    }

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    return {"success": True, "data": data, "error": None}
                except Exception as e:
                    return {"success": False, "data": None, "error": f"JSON parse error: {e}"}
            elif resp.status_code == 202:
                if attempt < max_retries:
                    time.sleep(attempt * 2)
                    continue
                return {"success": False, "data": None, "error": "Queued by backend (202), retry on next run"}
            elif resp.status_code == 403:
                return {"success": False, "data": None, "error": "Profile private on iRacingData (opt-in required)"}
            elif resp.status_code == 404:
                return {"success": False, "data": None, "error": "Member not found (404)"}
            else:
                return {"success": False, "data": None, "error": f"HTTP {resp.status_code}"}
        except requests.exceptions.RequestException as e:
            if attempt < max_retries:
                time.sleep(attempt * 2)
                continue
            return {"success": False, "data": None, "error": str(e)}

    return {"success": False, "data": None, "error": "Max retries exceeded"}

def parse_career_data(api_data, customer_id):
    """
    Parses discipline ratings and metadata from the fallback API response.
    """
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    parsed = {
        "customerId": int(customer_id) if str(customer_id).isdigit() else customer_id,
        "displayName": api_data.get("display_name", ""),
        "lastChecked": now_iso,
        "ratings": {},
        "licenseLevels": {},
        "iRatings": {},
        "iRatingPercentages": {}
    }

    for disc in DISCIPLINES:
        api_key = disc["api_key"]
        internal_key = disc["internal_key"]
        iracing_key = disc["iracing_key"]

        disc_data = api_data.get(api_key)
        if disc_data and isinstance(disc_data, dict):
            ir_obj = disc_data.get("iRating")
            ir_val = None
            ir_when = None
            if isinstance(ir_obj, dict):
                ir_val = ir_obj.get("value")
                ir_when = ir_obj.get("when")
            elif isinstance(ir_obj, (int, float)):
                ir_val = int(ir_obj)

            sr = disc_data.get("safety_rating")
            lic_lvl = disc_data.get("license_level")
            lic_text = format_safety_rating(sr, lic_lvl)

            if ir_val is not None and ir_val > 0:
                parsed["ratings"][iracing_key] = {
                    "value": int(ir_val),
                    "updated": ir_when or format_date_str(api_data.get("last_update", ""))
                }
                parsed["iRatings"][internal_key] = int(ir_val)
                parsed["licenseLevels"][internal_key] = lic_text
                parsed["iRatingPercentages"][internal_key] = min(100, round((int(ir_val) / 6000) * 100, 2))
            else:
                parsed["ratings"][iracing_key] = {
                    "value": 0,
                    "updated": ir_when
                }
                parsed["iRatings"][internal_key] = 0
                parsed["licenseLevels"][internal_key] = lic_text
                parsed["iRatingPercentages"][internal_key] = 0
        else:
            parsed["ratings"][iracing_key] = {
                "value": 0,
                "updated": None
            }
            parsed["iRatings"][internal_key] = 0
            parsed["licenseLevels"][internal_key] = "R 2.50"
            parsed["iRatingPercentages"][internal_key] = 0

    return parsed

def generate_driver_html(driver, template):
    """
    Renders an individual driver's HTML profile page from template.
    """
    html = template
    name = driver.get("name", "")
    slug = driver.get("slug", "")
    url = f"https://garage61.net/app/drivers/{slug}" if slug else "https://garage61.net"

    stats = driver.get("stats", {})
    i_ratings = stats.get("iRatings", {})
    license_levels = stats.get("licenseLevels", {})
    percentages = stats.get("iRatingPercentages", {})
    iracing_data = driver.get("iracing", {})
    ratings_detail = iracing_data.get("ratings", {})
    last_checked = iracing_data.get("lastChecked", "")
    last_checked_formatted = format_date_str(last_checked) if last_checked else datetime.now().strftime("%d %b %Y")

    html = html.replace("{{NAME}}", name)
    html = html.replace("{{NICKNAME}}", driver.get("nickname", ""))
    html = html.replace("{{MEMBER_SINCE}}", driver.get("memberSince", "N/A"))
    html = html.replace("{{ROLE}}", driver.get("role", "Driver") or "Driver")
    html = html.replace("{{G61_URL}}", url)
    html = html.replace("{{LAST_CHECKED}}", last_checked_formatted)

    for disc in DISCIPLINES:
        int_key = disc["internal_key"]
        ir_key = disc["iracing_key"]

        ir_val = i_ratings.get(int_key, 0) or 0
        lic = license_levels.get(int_key, "R 2.50")
        pc = percentages.get(int_key, 0) if ir_val > 0 else 0
        lic_class = get_license_class(lic)

        r_info = ratings_detail.get(ir_key, {})
        when_str = r_info.get("updated") if isinstance(r_info, dict) else None
        when_formatted = f"({format_date_str(when_str)})" if (when_str and ir_val > 0) else (f"({last_checked_formatted})" if ir_val > 0 else "")

        html = html.replace(f"{{{{IRATING_{int_key}}}}}", str(ir_val) if ir_val > 0 else "---")
        html = html.replace(f"{{{{IRATING_{int_key}_PC}}}}", str(pc))
        html = html.replace(f"{{{{LICENSE_{int_key}}}}}", lic)
        html = html.replace(f"{{{{LICENSE_CLASS_{int_key}}}}}", lic_class)
        html = html.replace(f"{{{{RATING_DATE_{int_key}}}}}", when_formatted)

    html = html.replace("{{LAPS}}", str(driver.get("totalLaps", "0")))
    html = html.replace("{{CLEAN_LAP_PC}}", str(driver.get("cleanPercentage", "0")))
    html = html.replace("{{TIME_ON_TRACK}}", str(driver.get("timeOnTrack", "N/A")))

    return html

def main():
    print("=" * 60)
    print("GRiD UP — Automatic iRacing Rating Updater")
    print(f"Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 60)

    # 1. Load Drivers from Firestore (with fallbacks)
    drivers_list = []
    claims_map = {}
    users_map = {}
    firestore_docs_map = {}

    if db:
        try:
            print("Fetching claims and users for customer ID resolution...")
            claims_snap = db.collection("claims").get()
            for doc in claims_snap:
                d = doc.to_dict()
                if d and d.get("iracingId"):
                    claims_map[doc.id.strip().lower()] = str(d["iracingId"]).strip()
                    if d.get("driverIdentity"):
                        claims_map[d["driverIdentity"].strip().lower()] = str(d["iracingId"]).strip()

            users_snap = db.collection("users").get()
            for doc in users_snap:
                d = doc.to_dict()
                if d and d.get("iracingId"):
                    users_map[doc.id] = str(d["iracingId"]).strip()

            print("Fetching drivers collection from Firestore...")
            drivers_snap = db.collection("drivers").get()
            for doc in drivers_snap:
                data = doc.to_dict()
                firestore_docs_map[doc.id] = data
                data["_docId"] = doc.id
                drivers_list.append(data)
            print(f"Loaded {len(drivers_list)} drivers from Firestore via Admin SDK.")
        except Exception as e:
            print(f"Firestore Admin SDK error: {e}")

    # Fallback: Query Firestore REST API if no service account credential in GitHub Actions
    if not drivers_list:
        try:
            print("Fetching driver list from Firestore via REST API...")
            url = "https://firestore.googleapis.com/v1/projects/grid-up/databases/(default)/documents/drivers?pageSize=100"
            r = requests.get(url, timeout=15)
            if r.status_code == 200:
                docs = r.json().get("documents", [])

                def parse_val(v):
                    if not isinstance(v, dict):
                        return v
                    if "stringValue" in v:
                        return v["stringValue"]
                    if "integerValue" in v:
                        return int(v["integerValue"])
                    if "doubleValue" in v:
                        return float(v["doubleValue"])
                    if "booleanValue" in v:
                        return v["booleanValue"]
                    if "mapValue" in v:
                        sub_fields = v.get("mapValue", {}).get("fields", {})
                        return {k: parse_val(val) for k, val in sub_fields.items()}
                    if "arrayValue" in v:
                        sub_vals = v.get("arrayValue", {}).get("values", [])
                        return [parse_val(val) for val in sub_vals]
                    return None

                for doc in docs:
                    doc_path = doc.get("name", "")
                    doc_id = doc_path.split("/")[-1]
                    fields = doc.get("fields", {})
                    driver_dict = {k: parse_val(v) for k, v in fields.items()}
                    driver_dict["_docId"] = doc_id
                    drivers_list.append(driver_dict)
                print(f"Loaded {len(drivers_list)} drivers from Firestore via REST API.")

        except Exception as e:
            print(f"Firestore REST API fetch failed: {e}")

    # Fallback to local files if Firestore is not available
    if not drivers_list and os.path.exists(DRIVERS_JSON):
        print(f"Loading drivers from {DRIVERS_JSON}...")
        with open(DRIVERS_JSON, "r", encoding="utf-8") as f:
            drivers_list = json.load(f)

    if not drivers_list:
        print("ERROR: No drivers found to process.")
        sys.exit(1)

    # Load driver stats cache
    local_stats = {}
    if os.path.exists(DRIVER_STATS_JSON):
        try:
            with open(DRIVER_STATS_JSON, "r", encoding="utf-8") as f:
                local_stats = json.load(f)
        except Exception as e:
            print(f"Failed to load {DRIVER_STATS_JSON}: {e}")

    # Load garage61-stats.json telemetry summary for laps/cleanPct/hours
    g61_telemetry_by_slug = {}
    if os.path.exists(GARAGE61_STATS_JSON):
        try:
            with open(GARAGE61_STATS_JSON, "r", encoding="utf-8") as f:
                g61_tel = json.load(f)
                for td in g61_tel.get("drivers", []):
                    tslug = (td.get("slug") or "").strip().lower()
                    if tslug:
                        g61_telemetry_by_slug[tslug] = td
        except Exception as e:
            print(f"Failed to load {GARAGE61_STATS_JSON}: {e}")

    # Load template
    template = ""
    if os.path.exists(TEMPLATE_PATH):
        with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
            template = f.read()

    # Track metrics for GitHub Actions Summary
    processed_count = 0
    success_count = 0
    failed_count = 0
    ratings_count = {d["display_name"]: 0 for d in DISCIPLINES}
    failed_drivers = []
    changed_drivers = 0

    # Fetch team ratings from Garage 61 across all 3 teams as primary authoritative source
    g61_by_cid, g61_by_name, g61_by_slug = fetch_garage61_team_ratings()

    print(f"\nStarting processing for {len(drivers_list)} drivers...\n")

    for idx, driver in enumerate(drivers_list):
        if driver.get("active") is False:
            continue

        name = driver.get("name", "").strip()
        slug = driver.get("slug")
        if not slug and "url" in driver:
            slug = driver["url"].split("/")[-1].strip()
        if not slug and name:
            slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        if slug:
            driver["slug"] = slug

        # Hydrate laps / clean% / timeOnTrack from garage61-stats.json if available
        if slug and slug.lower() in g61_telemetry_by_slug:
            td = g61_telemetry_by_slug[slug.lower()]
            driver["totalLaps"] = td.get("totalLaps", 0)
            driver["cleanPercentage"] = td.get("cleanPct", 0.0)
            hours_val = td.get("hours", 0.0)
            driver["timeOnTrack"] = f"{hours_val} hrs" if hours_val else "N/A"

        # Find iRacing Customer ID
        name_key = name.lower()
        norm_key = normalize_name(name)
        cid = driver.get("iracingId") or driver.get("customerId") or driver.get("cust_id")
        if not cid and isinstance(driver.get("iracing"), dict):
            cid = driver["iracing"].get("customerId")

        if not cid and name_key in claims_map:
            cid = claims_map[name_key]
            driver["iracingId"] = str(cid)

        # Check Garage 61 mapping by name, normalized name, or slug if cid still missing
        if not cid:
            if name_key in g61_by_name:
                cid = g61_by_name[name_key].get("customerId")
            elif norm_key and norm_key in g61_by_name:
                cid = g61_by_name[norm_key].get("customerId")
            elif slug and slug.lower() in g61_by_slug:
                cid = g61_by_slug[slug.lower()].get("customerId")
            if cid:
                driver["iracingId"] = str(cid)

        cid_str = str(cid).strip() if cid else ""
        if (
            not cid_str
            and name_key not in g61_by_name
            and (not norm_key or norm_key not in g61_by_name)
            and (not slug or slug.lower() not in g61_by_slug)
        ):
            continue

        processed_count += 1
        print(f"[{processed_count}] Processing {name} (Cust ID: {cid_str or 'G61'})...")

        # 1. Check Garage 61 first
        parsed = None
        if cid_str and cid_str in g61_by_cid:
            parsed = g61_by_cid[cid_str]
            res = {"success": True, "data": parsed, "error": None}
        elif slug and slug.lower() in g61_by_slug:
            parsed = g61_by_slug[slug.lower()]
            if not cid_str:
                cid_str = str(parsed.get("customerId", ""))
                driver["iracingId"] = cid_str
            res = {"success": True, "data": parsed, "error": None}
        elif name_key in g61_by_name:
            parsed = g61_by_name[name_key]
            if not cid_str:
                cid_str = str(parsed.get("customerId", ""))
                driver["iracingId"] = cid_str
            res = {"success": True, "data": parsed, "error": None}
        elif norm_key and norm_key in g61_by_name:
            parsed = g61_by_name[norm_key]
            if not cid_str:
                cid_str = str(parsed.get("customerId", ""))
                driver["iracingId"] = cid_str
            res = {"success": True, "data": parsed, "error": None}
        elif cid_str:
            time.sleep(0.5)
            res = fetch_career_stats(cid_str)
            if res["success"]:
                parsed = parse_career_data(res["data"], cid_str)
        else:
            res = {"success": False, "data": None, "error": "No iRacing ID or Garage 61 account linked"}

        if res["success"] and parsed:
            success_count += 1

            # Detect changes against existing data
            existing_iracing = driver.get("iracing", {})
            existing_ratings = existing_iracing.get("ratings", {})
            has_change = False

            for disc in DISCIPLINES:
                ir_key = disc["iracing_key"]
                new_val = parsed["ratings"].get(ir_key, {}).get("value", 0)
                old_val = existing_ratings.get(ir_key, {}).get("value", 0) if isinstance(existing_ratings, dict) else 0
                if new_val > 0:
                    ratings_count[disc["display_name"]] += 1
                if new_val != old_val:
                    has_change = True

            if has_change:
                changed_drivers += 1

            # Update driver data structure
            driver["iracing"] = {
                "customerId": parsed["customerId"],
                "ratings": parsed["ratings"],
                "lastChecked": parsed["lastChecked"]
            }
            if cid_str:
                driver["iracingId"] = cid_str

            # Update stats object (overwrite all 6 disciplines cleanly so Rookie/0 clears old stale values)
            driver["stats"] = {
                "iRatings": {},
                "licenseLevels": {},
                "iRatingPercentages": {}
            }
            for disc in DISCIPLINES:
                ik = disc["internal_key"]
                ir_v = parsed["iRatings"].get(ik, 0) or 0
                sr_v = parsed["licenseLevels"].get(ik, "R 2.50") or "R 2.50"
                pc_v = parsed["iRatingPercentages"].get(ik, 0) if ir_v > 0 else 0
                driver["stats"]["iRatings"][ik] = ir_v
                driver["stats"]["licenseLevels"][ik] = sr_v
                driver["stats"]["iRatingPercentages"][ik] = pc_v

            # Build clean entry for local_stats (driver_stats_2.json)
            clean_entry = {}
            for disc in DISCIPLINES:
                disp_name = disc["display_name"]
                int_key = disc["internal_key"]
                ir_val = parsed["iRatings"].get(int_key, 0)
                sr_val = parsed["licenseLevels"].get(int_key, "R 2.50")
                clean_entry[disp_name] = {
                    "irating": int(ir_val) if (ir_val and ir_val > 0) else None,
                    "sr": sr_val or "R 2.50"
                }

            candidate_keys = {name}
            if parsed.get("displayName"):
                candidate_keys.add(parsed["displayName"])
            if parsed.get("irAccountName"):
                candidate_keys.add(parsed["irAccountName"])
            for existing_k in list(local_stats.keys()):
                if existing_k.lower() in {c.lower() for c in candidate_keys if c} or (norm_key and normalize_name(existing_k) == norm_key):
                    candidate_keys.add(existing_k)

            for ck in candidate_keys:
                if ck:
                    local_stats[ck] = json.loads(json.dumps(clean_entry))

            # Update Firestore if available
            doc_id = driver.get("_docId")
            if db and doc_id:
                try:
                    db.collection("drivers").document(doc_id).set({
                        "iracing": driver["iracing"],
                        "iracingId": cid_str,
                        "stats": driver["stats"],
                        "lastUpdated": firestore.SERVER_TIMESTAMP
                    }, merge=True)
                except Exception as fe:
                    print(f"  Firestore update warning for {name}: {fe}")

            print(f"  [OK] Updated ratings for {name}")
        else:
            failed_count += 1
            error_msg = res.get("error", "Unknown error")
            print(f"  [FAIL] Failed for {name} ({cid_str}): {error_msg}")
            failed_drivers.append(f"{name} — {error_msg}")

    # Update driver HTML files if template exists
    if template and os.path.exists(DRIVERS_DIR):
        print("\nUpdating individual driver HTML profiles...")
        for driver in drivers_list:
            if driver.get("active") is False:
                continue
            slug = driver.get("slug")
            name = driver.get("name")
            if not slug and name:
                slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
                driver["slug"] = slug

            if slug:
                filename = f"{slug.lower()}.html"
                file_path = os.path.join(DRIVERS_DIR, filename)

                # Merge local stats cache if available
                if name and name in local_stats:
                    if "stats" not in driver or not isinstance(driver["stats"], dict):
                        driver["stats"] = {"iRatings": {}, "licenseLevels": {}, "iRatingPercentages": {}}
                    for disc in DISCIPLINES:
                        disp_name = disc["display_name"]
                        int_key = disc["internal_key"]
                        if disp_name in local_stats[name]:
                            ir = local_stats[name][disp_name].get("irating")
                            sr = local_stats[name][disp_name].get("sr")
                            driver["stats"]["iRatings"][int_key] = ir if (ir and ir > 0) else 0
                            driver["stats"]["iRatingPercentages"][int_key] = min(100, round((ir / 6000) * 100, 2)) if (ir and ir > 0) else 0
                            if sr is not None:
                                driver["stats"]["licenseLevels"][int_key] = sr

                html_content = generate_driver_html(driver, template)
                with open(file_path, "w", encoding="utf-8") as hf:
                    hf.write(html_content)

    # Save local JSON files
    try:
        with open(DRIVER_STATS_JSON, "w", encoding="utf-8") as f:
            json.dump(local_stats, f, indent=2, ensure_ascii=False)
        print(f"Saved {DRIVER_STATS_JSON}")
    except Exception as e:
        print(f"Failed to save {DRIVER_STATS_JSON}: {e}")

    try:
        if os.path.exists(DRIVERS_JSON) and drivers_list:
            clean_manifest = []
            seen_manifest_slugs = set()
            for d in drivers_list:
                if d.get("active") is False:
                    continue
                d_name = d.get("name")
                d_slug = d.get("slug") or (d.get("url", "").split("/")[-1] if "url" in d else "")
                if not d_name or not d_slug:
                    continue
                s_low = d_slug.lower()
                if s_low in seen_manifest_slugs:
                    continue
                seen_manifest_slugs.add(s_low)
                clean_manifest.append({
                    "name": d_name,
                    "url": f"https://garage61.net/app/drivers/{d_slug}",
                    "role": d.get("role", "Driver") or "Driver"
                })
            clean_manifest.sort(key=lambda x: x["name"].lower())
            with open(DRIVERS_JSON, "w", encoding="utf-8") as f:
                json.dump(clean_manifest, f, indent=2, ensure_ascii=False)
            print(f"Saved {DRIVERS_JSON}")
    except Exception as e:
        print(f"Failed to save {DRIVERS_JSON}: {e}")


    # Build Summary
    summary_lines = [
        "## GRiD UP iRacing Rating Update Summary",
        "",
        f"- **Timestamp:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"- **Drivers Processed:** {processed_count}",
        f"- **Successful:** {success_count}",
        f"- **Failed:** {failed_count}",
        f"- **Drivers with Changed Ratings:** {changed_drivers}",
        "",
        "### Ratings Updated by Discipline:",
        f"- **Sports Car:** {ratings_count['Sports Car']}",
        f"- **Formula Car:** {ratings_count['Formula Car']}",
        f"- **Oval:** {ratings_count['Oval']}",
        f"- **Dirt Road:** {ratings_count['Dirt Road']}",
        f"- **Dirt Oval:** {ratings_count['Dirt Oval']}",
        f"- **Road:** {ratings_count['Road']}",
        ""
    ]

    if failed_drivers:
        summary_lines.append("### Failures / Warnings:")
        for fd in failed_drivers:
            summary_lines.append(f"- {fd}")
        summary_lines.append("")

    summary_text = "\n".join(summary_lines)
    print("\n" + summary_text)

    # Write to GitHub Step Summary if running in GitHub Actions
    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if step_summary:
        try:
            with open(step_summary, "a", encoding="utf-8") as sf:
                sf.write(summary_text + "\n")
        except Exception as e:
            print(f"Failed to write GITHUB_STEP_SUMMARY: {e}")

    print("Updater execution completed successfully.")

if __name__ == "__main__":
    main()
