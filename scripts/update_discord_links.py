import os
import re

ROOT_DIR = r"f:\Grid Up\Website"
CORRECT_LINK = "https://discord.gg/gridup"

def update_links():
    count = 0
    # Search in root and events dir
    targets = [ROOT_DIR, os.path.join(ROOT_DIR, "events")]
    
    for target in targets:
        for root, dirs, files in os.walk(target):
            # Skip .git and other hidden dirs
            if ".git" in os.path.basename(root) or ".gemini" in os.path.basename(root):
                continue
                
            for file in files:
                if file.endswith(".html"):
                    filepath = os.path.join(root, file)
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # 1. Update existing "Join Discord" buttons (IMSA style)
                    pattern_btn = r'href="#"([^>]*>Join Discord</a>)'
                    content = re.sub(pattern_btn, f'href="{CORRECT_LINK}"\\1', content, flags=re.IGNORECASE)
                    
                    # 2. Add Discord to footer social-links if missing
                    # Pattern looks for the social-links div and adds Discord at the end
                    if 'class="social-links"' in content and 'discord.gg/gridup' not in content:
                        footer_pattern = r'(<div class="social-links">.*?)(</div>)'
                        content = re.sub(footer_pattern, r'\1    <a href="' + CORRECT_LINK + r'">Discord</a>\n            \2', content, flags=re.DOTALL)
                    
                    # 3. Fix the <span>DC</span> pattern in newer footers
                    if 'social-icons' in content and '<span>DC</span>' in content and CORRECT_LINK not in content:
                        icon_pattern = r'<span>DC</span>'
                        content = content.replace(icon_pattern, f'<a href="{CORRECT_LINK}" style="color: inherit; text-decoration: none;">DC</a>')

                    # 4. Any other placeholder links with "Discord" in text
                    pattern_misc = r'href="#"([^>]*>[^<]*Discord[^<]*</a>)'
                    content = re.sub(pattern_misc, f'href="{CORRECT_LINK}"\\1', content, flags=re.IGNORECASE)

                    if content != original_content:
                        with open(filepath, "w", encoding="utf-8") as f:
                            f.write(content)
                        print(f"Updated {filepath}")
                        count += 1

    print(f"Finished. Total files updated: {count}")

if __name__ == "__main__":
    update_links()
