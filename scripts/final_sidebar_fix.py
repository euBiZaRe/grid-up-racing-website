import os
import re

ROOT_DIR = r"f:\Grid Up\Website"
EVENTS_DIR = os.path.join(ROOT_DIR, "events")

FILES_TO_UPDATE = [
    "bathurst-1000.html",
    "brickyard-400.html",
    "firecracker-400.html",
    "indy-8h.html",
    "petit-le-mans.html",
    "road-america-6h.html",
    "spa-24hr.html",
    "suzuka-1000km.html"
]

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

def fix_file(filename):
    filepath = os.path.join(EVENTS_DIR, filename)
    if not os.path.exists(filepath):
        return False
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the cards
    format_match = re.search(r'(<div class="glass sidebar-card">\s*<h3>Race Format</h3>.*?</div>\s*</div>)', content, re.DOTALL)
    lineup_match = re.search(r'(<div class="glass sidebar-card">\s*<h3>Confirmed Lineup</h3>.*?</div>\s*</div>)', content, re.DOTALL)
    join_match = re.search(r'(<div class="glass sidebar-card" style="border-color: var(--secondary);">\s*<h3>Join the Team</h3>.*?</div>\s*</div>)', content, re.DOTALL)
    
    if lineup_match and format_match and join_match:
        format_block = format_match.group(1).strip()
        lineup_block = lineup_match.group(1).strip()
        join_block = join_match.group(1).strip()
        
        # Ensure full team list
        lineup_block = re.sub(r'<!-- LINEUP_START -->.*?<!-- LINEUP_END -->', f'<!-- LINEUP_START -->{DEFAULT_LINEUP}\n                        <!-- LINEUP_END -->', lineup_block, flags=re.DOTALL)
        
        new_sidebar_inner = f"""\n                {format_block}\n\n                {lineup_block}\n\n                {join_block}\n            """
        
        aside_start = re.search(r'<aside class="event-sidebar">', content)
        if aside_start:
             aside_end = content.find("</aside>", aside_start.start())
             if aside_end > -1:
                  new_content = content[:aside_start.end()] + new_sidebar_inner + content[aside_end:]
                  with open(filepath, "w", encoding="utf-8") as f:
                      f.write(new_content)
                  return True
    return False

def main():
    count = 0
    for f in FILES_TO_UPDATE:
        if fix_file(f):
            print(f"Fixed {f}")
            count += 1
    print(f"Finished. Fixed {count} files.")

if __name__ == "__main__":
    main()
