import json
import os
from PySide6.QtGui import QImage, QPainter
from PySide6.QtSvg import QSvgRenderer
from PySide6.QtCore import QByteArray

def main():
    tracks_json_path = os.path.join(os.path.dirname(__file__), 'track_outlines.json')
    with open(tracks_json_path, 'r', encoding='utf-8') as f:
        tracks = json.load(f)

    out_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'tracks')
    os.makedirs(out_dir, exist_ok=True)

    for key, t in tracks.items():
        vb = t['viewBox']
        parts = [float(x) for x in vb.split()]
        vw, vh = parts[2], parts[3]
        
        # Calculate aspect ratio
        aspect = vw / vh if vh > 0 else 1.0
        
        target_w = 900
        target_h = int(target_w / aspect)
        if target_h > 900:
            target_h = 900
            target_w = int(target_h * aspect)
            
        # Target stroke width proportional to viewBox
        stroke_width = max(14, int(max(vw, vh) * 0.015))

        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">
<path d="{t['svgPath']}" fill="none" stroke="#ff2e4d" stroke-width="{stroke_width}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

        # Also write the raw SVG file so we have vector versions too
        svg_filename = f"{key}.svg"
        with open(os.path.join(out_dir, svg_filename), 'w', encoding='utf-8') as svg_f:
            svg_f.write(svg)

        renderer = QSvgRenderer(QByteArray(svg.encode('utf-8')))
        img = QImage(target_w, target_h, QImage.Format_ARGB32_Premultiplied)
        img.fill(0)
        
        painter = QPainter(img)
        renderer.render(painter)
        painter.end()

        png_filename = f"{key}.png"
        img.save(os.path.join(out_dir, png_filename))
        print(f"Rendered {png_filename} ({target_w}x{target_h}, stroke={stroke_width})")

    # Also create specific alias names for iRacing track matching
    aliases = {
        'nurburgring-combined.png': 'nurburgring.png',
        'nurburgring-vln.png': 'nurburgring.png',
        'nurburgring-24h.png': 'nurburgring.png',
        'nordschleife.png': 'nurburgring.png',
        'spa-francorchamps.png': 'spa.png',
        'mount-panorama.png': 'bathurst.png',
        'road-atlanta-full.png': 'road-atlanta.png',
        'watkins-glen-boot.png': 'watkins-glen.png',
    }
    for alias, src in aliases.items():
        src_path = os.path.join(out_dir, src)
        alias_path = os.path.join(out_dir, alias)
        if os.path.exists(src_path):
            with open(src_path, 'rb') as sf, open(alias_path, 'wb') as df:
                df.write(sf.read())
            print(f"Created alias: {alias} -> {src}")

if __name__ == '__main__':
    main()
