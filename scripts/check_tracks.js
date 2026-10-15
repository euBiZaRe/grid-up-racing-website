const fs = require('fs');

function getPathPoints(d) {
    const points = [];
    let curX = 0, curY = 0;
    const tokens = d.match(/([a-df-z]|[-+]?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)/gi) || [];
    let i = 0;
    let cmd = '';
    
    function nextNum() {
        if (i >= tokens.length) return 0;
        const val = parseFloat(tokens[i]);
        if (isNaN(val)) return null;
        i++;
        return val;
    }
    
    while (i < tokens.length) {
        const token = tokens[i];
        if (/^[a-df-z]$/i.test(token)) {
            cmd = token;
            i++;
        }
        const isRel = cmd === cmd.toLowerCase();
        const upper = cmd.toUpperCase();
        
        if (upper === 'M' || upper === 'L') {
            const x = nextNum();
            const y = nextNum();
            if (x === null || y === null) break;
            curX = isRel ? curX + x : x;
            curY = isRel ? curY + y : y;
            points.push({ x: curX, y: curY });
            if (upper === 'M') cmd = isRel ? 'l' : 'L';
        } else if (upper === 'H') {
            const x = nextNum();
            if (x === null) break;
            curX = isRel ? curX + x : x;
            points.push({ x: curX, y: curY });
        } else if (upper === 'V') {
            const y = nextNum();
            if (y === null) break;
            curY = isRel ? curY + y : y;
            points.push({ x: curX, y: curY });
        } else if (upper === 'C') {
            const x1 = nextNum(), y1 = nextNum();
            const x2 = nextNum(), y2 = nextNum();
            const x = nextNum(), y = nextNum();
            if (x === null || y === null) break;
            const p1x = isRel ? curX + x1 : x1;
            const p1y = isRel ? curY + y1 : y1;
            const p2x = isRel ? curX + x2 : x2;
            const p2y = isRel ? curY + y2 : y2;
            const startX = points[points.length-1].x;
            const startY = points[points.length-1].y;
            curX = isRel ? curX + x : x;
            curY = isRel ? curY + y : y;
            for (let t = 0; t <= 1; t += 0.05) {
                const bx = (1-t)**3 * startX + 3*(1-t)**2*t*p1x + 3*(1-t)*t**2*p2x + t**3*curX;
                const by = (1-t)**3 * startY + 3*(1-t)**2*t*p1y + 3*(1-t)*t**2*p2y + t**3*curY;
                points.push({ x: bx, y: by });
            }
        } else if (upper === 'S' || upper === 'Q') {
            const x1 = nextNum(), y1 = nextNum();
            const x = nextNum(), y = nextNum();
            if (x === null || y === null) break;
            curX = isRel ? curX + x : x;
            curY = isRel ? curY + y : y;
            points.push({ x: curX, y: curY });
        } else if (upper === 'A') {
            const rx = nextNum(), ry = nextNum(), rot = nextNum(), laf = nextNum(), sf = nextNum();
            const x = nextNum(), y = nextNum();
            if (x === null || y === null) break;
            curX = isRel ? curX + x : x;
            curY = isRel ? curY + y : y;
            points.push({ x: curX, y: curY });
        } else {
            i++;
        }
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

const code = fs.readFileSync('js/trophy-data-v3.js', 'utf8');
const trackOutlinesMatch = code.match(/window\.TRACK_OUTLINES\s*=\s*(\{[\s\S]*?\n\};)/);
const outlines = eval('(' + trackOutlinesMatch[1].replace(/;\s*$/, '') + ')');

for (const [key, track] of Object.entries(outlines)) {
    if (!track.svgPath) continue;
    const b = getPathPoints(track.svgPath);
    const vbParts = track.viewBox.split(/\s+/).map(Number);
    const vx = vbParts[0], vy = vbParts[1], vw = vbParts[2], vh = vbParts[3];
    
    const leftMargin = b.minX - vx;
    const topMargin = b.minY - vy;
    const rightMargin = (vx + vw) - b.maxX;
    const bottomMargin = (vy + vh) - b.maxY;
    
    const isClipped = leftMargin < -1 || topMargin < -1 || rightMargin < -1 || bottomMargin < -1;
    console.log(`${key}: ${isClipped ? 'CLIPPED!' : 'OK'} (left: ${Math.round(leftMargin)}, top: ${Math.round(topMargin)}, right: ${Math.round(rightMargin)}, bottom: ${Math.round(bottomMargin)})`);
}
