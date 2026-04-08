import os
import re

ROOT_DIR = r"f:\Grid Up\Website"
EVENTS_DIR = os.path.join(ROOT_DIR, "events")

# Every single HTML file in events/
FILES_TO_CLEAN = []
for root, dirs, files in os.walk(EVENTS_DIR):
    for f in files:
        if f.endswith(".html"):
            FILES_TO_CLEAN.append(os.path.join(root, f))

def extract_stat(content, label):
    pattern = rf'<strong>{label}:?</strong>\s*(.*?)(?:</li>|</ul>|</div>)'
    match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
    if match:
        val = match.group(1).strip()
        val = re.sub(r'<.*?>', '', val).strip()
        return val
    return "TBD"

def clean_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Special handling for Nurburgring/IMSA which might have lost their stats in the mess
    # We find them in the old text or keep TBD
    race_type = extract_stat(content, "Type")
    duration = extract_stat(content, "Distance")
    if duration == "TBD":
        duration = extract_stat(content, "Duration")
    classes = extract_stat(content, "Classes")
    if classes == "TBD":
        classes = extract_stat(content, "Qualifying")
    if classes == "TBD":
        classes = extract_stat(content, "License")

    # Hardcoded defaults for specific pages if TBD (since I know them)
    filename = os.path.basename(filepath)
    if "nurburgring" in filename:
        race_type = "Team Event (GT3 Only)"
        duration = "24 Hours"
        classes = "Class C/B and above"
    elif "imsa" in filename:
        race_type = "Team Event (Multi-class)"
        duration = "120 Minutes"
        classes = "Class C and above"
    elif "thruxton" in filename:
        race_type = "Team Event (TCR)"
        duration = "4 Hours"
        classes = "Class D/C and above"

    new_aside = f"""            <aside class="event-sidebar">
                <div class="glass sidebar-card">
                    <h3>Race Format</h3>
                    <ul style="list-style: none; margin-top: 1rem;">
                        <li style="margin-bottom: 0.5rem;"><strong style="color: var(--primary);">Type:</strong> {race_type}</li>
                        <li style="margin-bottom: 0.5rem;"><strong style="color: var(--primary);">Distance:</strong> {duration}</li>
                        <li style="margin-bottom: 0.5rem;"><strong style="color: var(--primary);">Classes:</strong> {classes}</li>
                    </ul>
                </div>

                <div class="glass sidebar-card">
                    <h3>Confirmed Lineup</h3>
                    <div id="confirmed-lineup">
                        <!-- LINEUP_START -->
                        <div class="lineup-item">
                            <span style="color: var(--primary); font-weight: 600;">GRiD UP Sim Racing</span>
                        </div>
                        <div class="lineup-item">
                            <span style="color: var(--primary); font-weight: 600;">GRiD UP Black</span>
                        </div>
                        <div class="lineup-item">
                            <span style="color: var(--primary); font-weight: 600;">GRiD UP White</span>
                        </div>
                        <div class="lineup-item">
                            <span style="color: var(--primary); font-weight: 600;">GRiD UP Blue</span>
                        </div>
                        <div class="lineup-item">
                            <span style="color: var(--primary); font-weight: 600;">GRiD UP Red</span>
                        </div>
                        <!-- LINEUP_END -->
                    </div>
                </div>

                <div class="glass sidebar-card" style="border-color: var(--secondary);">
                    <h3>Join the Team</h3>
                    <p style="margin-bottom: 1.5rem;">Interested in racing this event with Grid Up? Join our Discord to register.</p>
                    <a href="https://discord.gg/gridup" class="btn" style="width: 100%; text-align: center;">Join Discord</a>
                </div>
            </aside>"""

    aside_pattern = r'(<aside class="event-sidebar">.*?</aside>)'
    
    if re.search(aside_pattern, content, re.DOTALL):
        new_content = re.sub(aside_pattern, new_aside, content, flags=re.DOTALL)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True
    return False

def main():
    count = 0
    for f in FILES_TO_CLEAN:
        if clean_file(f):
            print(f"Cleaned {os.path.basename(f)}")
            count += 1
    print(f"Finished. Cleaned {count} files.")

if __name__ == "__main__":
    main()
