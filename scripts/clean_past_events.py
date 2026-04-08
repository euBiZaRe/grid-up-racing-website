import os
import re

ROOT_DIR = r"f:\Grid Up\Website"
PAST_EVENTS_DIR = os.path.join(ROOT_DIR, "events", "past")

FILES_TO_CLEAN = []
for file in os.listdir(PAST_EVENTS_DIR):
    if file.endswith(".html"):
        FILES_TO_CLEAN.append(os.path.join(PAST_EVENTS_DIR, file))

def clean_past_event(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Remove the sidebar block
    aside_pattern = r'\s*<aside class="event-sidebar">.*?</aside>'
    content = re.sub(aside_pattern, "", content, flags=re.DOTALL)

    # 2. Fix the grid layout
    # Current: <div class="event-details-grid">\s*<div class="event-main">
    grid_start_pattern = r'<div class="event-details-grid">\s*<div class="event-main">'
    content = re.sub(grid_start_pattern, r'<div style="max-width: 1000px; margin: 0 auto;">', content)

    # We removed the aside, so there was a closing </div> for event-main and one for event-details-grid.
    # Now we only have one <div> to close.
    # Find the closing part that was after the aside.
    # Since we removed the aside, we might have two </div></div> hanging around or one.
    
    # Actually, let's just find the pattern of the bottom.
    # Before: </div>\s*</main>
    # Wait, the event-main closed at line 80, aside closed at 120, grid closed at 121.
    # So after removing aside, we have:
    # </div> (line 80)
    # (newline)
    # </div> (line 121)
    
    # We want to replace these two with one.
    double_div_pattern = r'</div>\s*</div>\s*<div style="text-align: center;'
    content = re.sub(double_div_pattern, r'</div>\n\n        <div style="text-align: center;', content)

    # 3. Remove the loadRaceLineup script
    script_pattern = r'<script>\s*window\.addEventListener\(\'load\', \(\) => \{.*?loadRaceLineup\(.*?\);.*?\}\);\s*</script>'
    content = re.sub(script_pattern, "", content, flags=re.DOTALL)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return True

def main():
    count = 0
    for f in FILES_TO_CLEAN:
        if clean_past_event(f):
            print(f"Cleaned past event: {os.path.basename(f)}")
            count += 1
    print(f"Finished. Cleaned {count} files.")

if __name__ == "__main__":
    main()
