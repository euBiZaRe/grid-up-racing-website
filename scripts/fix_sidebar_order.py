import os
import re

ROOT_DIR = r"f:\Grid Up\Website"
EVENTS_DIR = os.path.join(ROOT_DIR, "events")

# Identify files to update
FILES_TO_UPDATE = []
for root, dirs, files in os.walk(EVENTS_DIR):
    for file in files:
        if file.endswith(".html"):
            FILES_TO_UPDATE.append(os.path.join(root, file))

def fix_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Pattern for the sidebar with cards in the WRONG order (Format first, then Lineup)
    # We want to match the whole sidebar block or at least the two cards
    
    pattern = r'(<aside class="event-sidebar">.*?)(\s*<div class="glass sidebar-card">\s*<h3>Race Format</h3>.*?</div>)\s*(<div class="glass sidebar-card">\s*<h3>Confirmed Lineup</h3>.*?</div>)(.*?</aside>)'
    
    if re.search(pattern, content, re.DOTALL):
        # Found the wrong order
        replacement = r'\1\3\n\2\4'
        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
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
