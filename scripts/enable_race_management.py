import os
import re

ROOT_DIR = r"f:\Grid Up\Website"
EVENTS_DIR = os.path.join(ROOT_DIR, "events")

FIREBASE_SCRIPTS = """    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"></script>
"""

def update_event_page(filepath, slug):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "loadRaceLineup" in content:
        return False
    
    # 1. Add scripts and load call before </body>
    auth_js_path = "../js/auth.js"
    if "/past/" in filepath.replace("\\", "/"):
        auth_js_path = "../../js/auth.js"
    
    load_call = f"""    <script src="{auth_js_path}"></script>
    <script>
        window.addEventListener('load', () => {{
            if (typeof loadRaceLineup === 'function') {{
                loadRaceLineup('{slug}');
            }}
        }});
    </script>
"""
    
    # Check if firebase is already there
    scripts_to_add = ""
    if "firebase-app-compat.js" not in content:
        scripts_to_add += FIREBASE_SCRIPTS
    
    scripts_to_add += load_call
    content = content.replace("</body>", f"{scripts_to_add}</body>")
    
    # 2. Add Lineup Markers
    # Look for common lineup headers
    lineup_patterns = [
        r'<h3>Confirmed Lineup</h3>',
        r'<h3>Driver Lineup</h3>',
        r'<h2>Driver Lineup</h2>'
    ]
    
    updated_markers = False
    for pattern in lineup_patterns:
        if re.search(pattern, content):
            # Wrap the content following the header until the end of its parent or next header
            # For simplicity, we'll try to find a div or ul that follows
            marker_start = "<!-- LINEUP_START -->"
            marker_end = "<!-- LINEUP_END -->"
            
            # If it already has an ID confirmed-lineup, just wrap the content inside
            if 'id="confirmed-lineup"' in content:
                # content = re.sub(r'(id="confirmed-lineup">)', r'\1\n                        ' + marker_start, content)
                # content = re.sub(r'(</div>\s*</div>\s*</aside>)', marker_end + r'\n                    \1', content)
                pass # Already handled by manual edits potentially?
            else:
                # Add confirmed-lineup ID to the next div or the header's container
                content = re.sub(pattern, f'{pattern}\n                    <div id="confirmed-lineup">\n                        {marker_start}', content)
                # This is tricky because of different nesting. 
                # We'll just append the end marker after a reasonable chunk or at the end of the section
                # For safety, let's just do it manually for the complex ones if this fails
                content = content.replace("</section>", f"                        {marker_end}\n                    </div>\n                </section>", 1)
                updated_markers = True
            break

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return True

def main():
    count = 0
    for root, dirs, files in os.walk(EVENTS_DIR):
        for file in files:
            if file.endswith(".html"):
                slug = file.replace(".html", "")
                filepath = os.path.join(root, file)
                if update_event_page(filepath, slug):
                    print(f"Updated {filepath}")
                    count += 1
    print(f"Finished. Updated {count} files.")

if __name__ == "__main__":
    main()
