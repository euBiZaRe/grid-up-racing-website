import json
import math
from PIL import Image, ImageDraw

def parse_svg_path(d, num_samples=3000):
    # Split tokens
    import re
    tokens = re.findall(r'([a-df-z]|[-+]?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)', d, re.I)
    i = 0
    cmd = ''
    cur_x, cur_y = 0.0, 0.0
    points = []

    def next_num():
        nonlocal i
        if i >= len(tokens): return None
        try:
            val = float(tokens[i])
            i += 1
            return val
        except ValueError:
            return None

    while i < len(tokens):
        token = tokens[i]
        if re.match(r'^[a-df-z]$', token, re.I):
            cmd = token
            i += 1
        is_rel = cmd == cmd.lower()
        upper = cmd.upper()

        if upper == 'M' or upper == 'L':
            x = next_num()
            y = next_num()
            if x is None or y is None: break
            cur_x = cur_x + x if is_rel else x
            cur_y = cur_y + y if is_rel else y
            points.append((cur_x, cur_y))
            if upper == 'M': cmd = 'l' if is_rel else 'L'
        elif upper == 'H':
            x = next_num()
            if x is None: break
            cur_x = cur_x + x if is_rel else x
            points.append((cur_x, cur_y))
        elif upper == 'V':
            y = next_num()
            if y is None: break
            cur_y = cur_y + y if is_rel else y
            points.append((cur_x, cur_y))
        elif upper == 'C':
            x1, y1 = next_num(), next_num()
            x2, y2 = next_num(), next_num()
            x, y = next_num(), next_num()
            if x is None or y is None: break
            p1x = cur_x + x1 if is_rel else x1
            p1y = cur_y + y1 if is_rel else y1
            p2x = cur_x + x2 if is_rel else x2
            p2y = cur_y + y2 if is_rel else y2
            p3x = cur_x + x if is_rel else x
            p3y = cur_y + y if is_rel else y
            start_x, start_y = points[-1] if points else (cur_x, cur_y)
            # Sample bezier curve
            steps = 25
            for s in range(1, steps + 1):
                t = s / float(steps)
                bx = (1-t)**3 * start_x + 3*(1-t)**2*t*p1x + 3*(1-t)*t**2*p2x + t**3*p3x
                by = (1-t)**3 * start_y + 3*(1-t)**2*t*p1y + 3*(1-t)*t**2*p2y + t**3*p3y
                points.append((bx, by))
            cur_x, cur_y = p3x, p3y
        elif upper == 'S' or upper == 'Q':
            x1, y1 = next_num(), next_num()
            x, y = next_num(), next_num()
            if x is None or y is None: break
            cur_x = cur_x + x if is_rel else x
            cur_y = cur_y + y if is_rel else y
            points.append((cur_x, cur_y))
        elif upper == 'A':
            rx, ry, rot, laf, sf = next_num(), next_num(), next_num(), next_num(), next_num()
            x, y = next_num(), next_num()
            if x is None or y is None: break
            cur_x = cur_x + x if is_rel else x
            cur_y = cur_y + y if is_rel else y
            points.append((cur_x, cur_y))
        elif upper == 'Z':
            if points: points.append(points[0])
        else:
            i += 1
    return points

def render_track_to_png(svg_path, out_path, target_w=912, target_h=510, stroke_w=14, pad=35):
    pts = parse_svg_path(svg_path)
    if not pts:
        print('No points parsed for', out_path)
        return
    min_x = min(p[0] for p in pts)
    max_x = max(p[0] for p in pts)
    min_y = min(p[1] for p in pts)
    max_y = max(p[1] for p in pts)
    w = max_x - min_x
    h = max_y - min_y
    if w == 0 or h == 0: return

    # Scale factor
    scale = min((target_w - pad*2) / w, (target_h - pad*2) / h)
    offset_x = (target_w - w * scale) / 2.0 - min_x * scale
    offset_y = (target_h - h * scale) / 2.0 - min_y * scale

    # Supersample 4x for smooth anti-aliasing
    super_mult = 4
    super_w = target_w * super_mult
    super_h = target_h * super_mult
    super_stroke = stroke_w * super_mult

    img = Image.new('RGBA', (super_w, super_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    mapped_pts = [( (p[0] * scale + offset_x) * super_mult, (p[1] * scale + offset_y) * super_mult ) for p in pts]

    # Draw segments with round joins
    red_color = (255, 46, 77, 255)
    for i in range(len(mapped_pts) - 1):
        p1 = mapped_pts[i]
        p2 = mapped_pts[i+1]
        draw.line([p1, p2], fill=red_color, width=int(super_stroke))
        # Draw endcaps
        r = super_stroke / 2.0
        draw.ellipse([p1[0]-r, p1[1]-r, p1[0]+r, p1[1]+r], fill=red_color)

    # Downsample
    final_img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    final_img.save(out_path, 'PNG')
    print('Saved:', out_path, 'size:', final_img.size)

if __name__ == '__main__':
    with open('js/track-maps.json', 'r') as f:
        maps = json.load(f)

    # 1. Road Atlanta (ID 431)
    render_track_to_png(maps['431']['i'], 'assets/tracks/road-atlanta.png', target_w=912, target_h=510, stroke_w=14)
    # 2. Watkins Glen (ID 18)
    render_track_to_png(maps['18']['i'], 'assets/tracks/watkins-glen.png', target_w=912, target_h=510, stroke_w=14)
    # 3. Nurburgring (ID 252)
    render_track_to_png(maps['252']['i'], 'assets/tracks/nurburgring.png', target_w=912, target_h=510, stroke_w=14)
