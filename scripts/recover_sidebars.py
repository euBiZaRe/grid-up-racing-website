import os
import re

ROOT_DIR = r"f:\Grid Up\Website"
EVENTS_DIR = os.path.join(ROOT_DIR, "events")

FILES_TO_CLEAN = [
    "bathurst-1000.html",
    "brickyard-400.html",
    "firecracker-400.html",
    "indy-8h.html",
    "petit-le-mans.html",
    "road-america-6h.html",
    "spa-24hr.html",
    "suzuka-1000km.html"
]

def extract_stat(content, label):
    # More robust extraction
    pattern = rf'<strong>{label}:?</strong>\s*(.*?)(?:</li>|</ul>|</div>)'
    match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
    if match:
        val = match.group(1).strip()
        # Clean up any tags that might have been caught
        val = re.sub(r'<.*?>', '', val).strip()
        return val
    return "TBD"

def clean_file(filename):
    filepath = os.path.join(EVENTS_DIR, filename)
    if not os.path.exists(filepath):
        return False
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract format info BEFORE we wipe anything
    race_type = extract_stat(content, "Type")
    duration = extract_stat(content, "Distance")
    if duration == "TBD":
        duration = extract_stat(content, "Duration")
    classes = extract_stat(content, "Classes")
    if classes == "TBD":
        classes = extract_stat(content, "Qualifying") # For Indy

    # Now find the whole aside block
    aside_pattern = r'(<aside class="event-sidebar">.*?</aside>)'
    
    # If aside is broken, we'll try to find from the last </div> before the sidebar cards
    # Actually, a better way is to find from <aside to the end of the main aside block
    
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
                    <p style="margin-bottom: 1.5rem;">Interested in racing this event with GRiD UP? Join our Discord to register.</p>
                    <a href="https://discord.gg/gridup" class="btn" style="width: 100%; text-align: center;">Join Discord</a>
                </div>
            </aside>"""

    # Replace anything between the last </section> and </div>\s*</main>
    # Actually, let's just use the aside pattern if it exists, or look for specific card headings
    
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
            print(f"Cleaned {f}")
            count += 1
    print(f"Finished. Cleaned {count} files.")

if __name__ == "__main__":
    main()
