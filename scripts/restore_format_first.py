import os
import re

ROOT_DIR = r"f:\Grid Up\Website"
EVENTS_DIR = os.path.join(ROOT_DIR, "events")

FILES_TO_UPDATE = []
for root, dirs, files in os.walk(EVENTS_DIR):
    for file in files:
        if file.endswith(".html"):
            FILES_TO_UPDATE.append(os.path.join(root, file))

# Standard teams to include if not overridden
DEFAULT_LINEUP = """
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
                        </div>"""

def fix_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Pattern for the sidebar with cards in the CURRENT order (Lineup first, then Format)
    # Note: Regex needs to be flexible enough to handle the manual edits I made too.
    
    # We'll search for the card headings and swap their containing divs.
    
    # 1. Capture the three cards
    # Card: Confirmed Lineup
    lineup_match = re.search(r'(<div class="glass sidebar-card">\s*<h3>Confirmed Lineup</h3>.*?</div>\s*</div>)', content, re.DOTALL)
    # Card: Race Format
    format_match = re.search(r'(<div class="glass sidebar-card">\s*<h3>Race Format</h3>.*?</div>\s*</div>)', content, re.DOTALL)
    # Card: Join the Team
    join_match = re.search(r'(<div class="glass sidebar-card" style="border-color: var(--secondary);">\s*<h3>Join the Team</h3>.*?</div>\s*</div>)', content, re.DOTALL)
    
    if lineup_match and format_match and join_match:
        lineup_block = lineup_match.group(1).strip()
        format_block = format_match.group(1).strip()
        join_block = join_match.group(1).strip()
        
        # 2. Update lineup content if it only has one team
        if 'GRiD UP Black' not in lineup_block:
             # Just swap the markers content for a more complete default if desired?
             # User said "with all team names".
             lineup_block = re.sub(r'<!-- LINEUP_START -->.*?<!-- LINEUP_END -->', f'<!-- LINEUP_START -->{DEFAULT_LINEUP}\n                        <!-- LINEUP_END -->', lineup_block, flags=re.DOTALL)
        
        new_sidebar_inner = f"""\n                {format_block}\n\n                {lineup_block}\n\n                {join_block}\n            """
        
        # Replace the whole sequence in the aside
        # First, find the aside start
        aside_start = re.search(r'<aside class="event-sidebar">', content)
        if aside_start:
             # Find aside end
             aside_end = content.find("</aside>", aside_start.start())
             
             if aside_end > -1:
                  content = content[:aside_start.end()] + new_sidebar_inner + content[aside_end:]
                  
                  with open(filepath, "w", encoding="utf-8") as f:
                      f.write(content)
                  return True
    return False

def main():
    count = 0
    for f in FILES_TO_UPDATE:
        if fix_file(f):
            print(f"Fixed {os.path.basename(f)}")
            count += 1
    print(f"Finished. Fixed {count} files.")

if __name__ == "__main__":
    main()
