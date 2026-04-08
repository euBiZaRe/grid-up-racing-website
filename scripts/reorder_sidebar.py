import os
import re

ROOT_DIR = r"f:\Grid Up\Website"
EVENTS_DIR = os.path.join(ROOT_DIR, "events")

# List all html files in events/ and events/past/
ALL_FILES = []
for root, dirs, files in os.walk(EVENTS_DIR):
    for file in files:
        if file.endswith(".html"):
            ALL_FILES.append(os.path.join(root, file))

def extract_stat(content, label):
    pattern = rf"<li><strong>{label}:?</strong>\s*(.*?)</li>"
    match = re.search(pattern, content, re.IGNORECASE)
    return match.group(1).strip() if match else "TBD"

def reorder_sidebar(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We want to identify the three cards and reorder them
    # Card 1: Race Format
    # Card 2: Confirmed Lineup
    # Card 3: Join the Team
    
    sidebar_match = re.search(r'<aside class="event-sidebar">(.*?)</aside>', content, re.DOTALL)
    if not sidebar_match:
        # If it's old layout, standardizing it first
        return False
        
    sidebar_inner = sidebar_match.group(1)
    
    # Extract Race Format card
    race_format_match = re.search(r'(<div class="glass sidebar-card">\s*<h3>Race Format</h3>.*?</div>\s*</div>)', sidebar_inner, re.DOTALL)
    # Extract Confirmed Lineup card
    lineup_match = re.search(r'(<div class="glass sidebar-card">\s*<h3>Confirmed Lineup</h3>.*?</div>\s*</div>)', sidebar_inner, re.DOTALL)
    # Extract Join the Team card
    join_team_match = re.search(r'(<div class="glass sidebar-card" style="border-color: var(--secondary);">\s*<h3>Join the Team</h3>.*?</div>\s*</div>)', sidebar_inner, re.DOTALL)
    
    if race_format_match and lineup_match and join_team_match:
        race_format_card = race_format_match.group(1).strip()
        lineup_card = lineup_match.group(1).strip()
        join_team_card = join_team_match.group(1).strip()
        
        new_sidebar = f"""\n                {lineup_card}\n\n                {race_format_card}\n\n                {join_team_card}\n            """
        new_content = content.replace(sidebar_inner, new_sidebar)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True
    return False

def main():
    count = 0
    for file in ALL_FILES:
        if reorder_sidebar(file):
            print(f"Reordered sidebar in {os.path.basename(file)}")
            count += 1
    print(f"Finished. Reordered {count} files.")

if __name__ == "__main__":
    main()
