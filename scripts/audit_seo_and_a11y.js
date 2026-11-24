const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));

const seoAudit = [];
const a11yAudit = [];

files.forEach(f => {
    const c = fs.readFileSync(path.join(root, f), 'utf8');

    const hasDesc = /<meta\s+name=["']description["']/i.test(c);
    const hasOgTitle = /<meta\s+property=["']og:title["']/i.test(c);
    const hasOgImage = /<meta\s+property=["']og:image["']/i.test(c);
    const hasFavicon = /<link\s+[^>]*rel=["'](?:shortcut )?icon["']/i.test(c);
    const hasViewport = /<meta\s+name=["']viewport["']/i.test(c);
    const hasLang = /<html[^>]*\blang=["'][a-z-]+["']/i.test(c);

    // Check headings hierarchy
    const h1s = [...c.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    const h1Count = h1s.length;

    // Check images missing alt
    const rawImgs = [...c.matchAll(/<img\s+([^>]*?)>/gi)];
    const missingAltCount = rawImgs.filter(m => !/\balt\s*=/i.test(m[1])).length;

    // Check icon buttons missing aria-label / title
    const rawButtons = [...c.matchAll(/<button\s+([^>]*?)>([\s\S]*?)<\/button>/gi)];
    const missingBtnLabelCount = rawButtons.filter(m => {
        const text = m[2].replace(/<[^>]*>/g, '').trim();
        const attrs = m[1];
        const hasAria = /aria-label\s*=/i.test(attrs) || /title\s*=/i.test(attrs);
        return !text && !hasAria;
    }).length;

    seoAudit.push({
        file: f,
        hasLang,
        hasViewport,
        hasDesc,
        hasOgTitle,
        hasOgImage,
        hasFavicon,
        h1Count
    });

    if (missingAltCount > 0 || missingBtnLabelCount > 0 || !hasLang || h1Count === 0 || h1Count > 1) {
        a11yAudit.push({
            file: f,
            hasLang,
            h1Count,
            missingAltCount,
            missingBtnLabelCount
        });
    }
});

console.log('--- SEO & A11Y SUMMARY ---');
console.log('Total HTML pages audited:', files.length);
console.log('Pages missing lang attribute:', seoAudit.filter(s => !s.hasLang).map(s => s.file));
console.log('Pages missing meta description:', seoAudit.filter(s => !s.hasDesc).map(s => s.file));
console.log('Pages missing favicon link:', seoAudit.filter(s => !s.hasFavicon).map(s => s.file));
console.log('Pages with accessibility concerns:', a11yAudit.length);

fs.writeFileSync(path.join(root, 'scripts', 'seo_a11y_report.json'), JSON.stringify({ seoAudit, a11yAudit }, null, 2));
