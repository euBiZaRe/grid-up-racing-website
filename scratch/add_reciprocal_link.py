import os
import re

link_html = '<div style="font-size: 0.7rem; opacity: 0.4; margin-top: 0.5rem;"><a href="https://www.sigmatraffic.com?ref=328509" style="color: inherit; text-decoration: none;">Free website hits</a></div></footer>'
target_dir = "F:/Grid Up/Website"

count = 0
for root, dirs, files in os.walk(target_dir):
    # Skip git and github folders
    if '.git' in root or '.github' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Check if sigmatraffic link already exists
            if "sigmatraffic.com" in content:
                continue
                
            # Check if </footer> exists
            footer_regex = re.compile(r'</footer>', re.IGNORECASE)
            if footer_regex.search(content):
                content = footer_regex.sub(link_html, content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Added link to: {os.path.relpath(file_path, target_dir)}")
                count += 1

print(f"\nDone! Added reciprocal link to {count} HTML pages.")
