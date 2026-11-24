const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
console.log('--- STARTING GRiD UP COMPREHENSIVE REPO AUDIT ---');
console.log('Project root:', root);

// 1. Inventory HTML files
const allFiles = fs.readdirSync(root);
const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
console.log(`Discovered ${htmlFiles.length} root HTML files.`);

// Subdirectories check
const subdirs = ['events', 'drivers', 'driver-stats', 'trophy-room', 'overlays', 'setup', 'stint-planner'];
const nestedHtml = [];
subdirs.forEach(sd => {
    const dirPath = path.join(root, sd);
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(f => {
            if (f.endsWith('.html')) {
                nestedHtml.push(path.join(sd, f));
            }
        });
    }
});
console.log(`Discovered ${nestedHtml.length} nested HTML files.`);

const totalHtmlList = [...htmlFiles, ...nestedHtml];

const auditResults = {
    pages: [],
    missingAssets: [],
    scriptSyntaxErrors: [],
    duplicateIds: [],
    brokenInternalLinks: [],
    securityWarnings: [],
    accessibilityIssues: []
};

// Check all JS files for syntax errors
function scanJsSyntax(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(e => {
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.git') {
            scanJsSyntax(fullPath);
        } else if (e.isFile() && e.name.endsWith('.js')) {
            try {
                const code = fs.readFileSync(fullPath, 'utf8');
                new Function(code);
            } catch (err) {
                auditResults.scriptSyntaxErrors.push({
                    file: path.relative(root, fullPath),
                    error: err.message
                });
            }
        }
    });
}
scanJsSyntax(root);

// Process each HTML file
totalHtmlList.forEach(relPath => {
    const fullPath = path.join(root, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const pageDir = path.dirname(fullPath);

    const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;

    // Check meta tags
    const hasViewport = /<meta\s+name=["']viewport["']/i.test(content);
    const hasCharset = /<meta\s+charset=/i.test(content);
    const hasDescription = /<meta\s+name=["']description["']/i.test(content);

    // Extract scripts
    const scriptSrcMatches = [...content.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    const scriptSrcMissing = [];
    scriptSrcMatches.forEach(src => {
        if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
            const clean = src.split('?')[0].replace(/^\//, '');
            const target = src.startsWith('/') ? path.join(root, clean) : path.join(pageDir, clean);
            if (!fs.existsSync(target)) {
                scriptSrcMissing.push(src);
                auditResults.missingAssets.push({ page: relPath, type: 'script', asset: src });
            }
        }
    });

    // Extract inline scripts and check syntax
    const inlineScripts = [...content.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)];
    const inlineSyntaxErrors = [];
    inlineScripts.forEach((m, idx) => {
        if (m[0].includes('application/ld+json')) return;
        try {
            new Function(m[1]);
        } catch (err) {
            inlineSyntaxErrors.push({ index: idx, error: err.message });
            auditResults.scriptSyntaxErrors.push({ file: `${relPath} [inline script ${idx}]`, error: err.message });
        }
    });

    // Extract stylesheets
    const cssMatches = [...content.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    const cssMissing = [];
    cssMatches.forEach(href => {
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
            const clean = href.split('?')[0].replace(/^\//, '');
            const target = href.startsWith('/') ? path.join(root, clean) : path.join(pageDir, clean);
            if (!fs.existsSync(target)) {
                cssMissing.push(href);
                auditResults.missingAssets.push({ page: relPath, type: 'stylesheet', asset: href });
            }
        }
    });

    // Extract images and check existence
    const imgMatches = [...content.matchAll(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    const imgMissing = [];
    imgMatches.forEach(src => {
        if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('${') && !src.startsWith('//')) {
            const clean = src.split('?')[0].replace(/^\//, '');
            const target = src.startsWith('/') ? path.join(root, clean) : path.join(pageDir, clean);
            if (!fs.existsSync(target)) {
                imgMissing.push(src);
                auditResults.missingAssets.push({ page: relPath, type: 'image', asset: src });
            }
        }
    });

    // Check images missing alt attribute
    const rawImgs = [...content.matchAll(/<img\s+([^>]*?)>/gi)];
    const imgsWithoutAlt = [];
    rawImgs.forEach(m => {
        const attrs = m[1];
        if (!/\balt\s*=/i.test(attrs)) {
            imgsWithoutAlt.push(m[0]);
        }
    });
    if (imgsWithoutAlt.length > 0) {
        auditResults.accessibilityIssues.push({
            page: relPath,
            issue: `${imgsWithoutAlt.length} <img> tags missing alt attributes.`
        });
    }

    // Check buttons missing accessible text or type
    const rawButtons = [...content.matchAll(/<button\s+([^>]*?)>([\s\S]*?)<\/button>/gi)];
    const buttonsWithoutAccessibleName = [];
    rawButtons.forEach(m => {
        const text = m[2].replace(/<[^>]*>/g, '').trim();
        const attrs = m[1];
        const hasAria = /aria-label\s*=/i.test(attrs) || /title\s*=/i.test(attrs);
        if (!text && !hasAria) {
            buttonsWithoutAccessibleName.push(m[0]);
        }
    });
    if (buttonsWithoutAccessibleName.length > 0) {
        auditResults.accessibilityIssues.push({
            page: relPath,
            issue: `${buttonsWithoutAccessibleName.length} <button> tags with icon only and no aria-label or title.`
        });
    }

    // Check internal links
    const linkMatches = [...content.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    const brokenLinks = [];
    linkMatches.forEach(href => {
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) return;
        if (href.includes('${')) return; // template literal inside inline JS string
        const cleanHref = href.split('?')[0].split('#')[0];
        if (!cleanHref) return;
        const target = cleanHref.startsWith('/') ? path.join(root, cleanHref.replace(/^\//, '')) : path.join(pageDir, cleanHref);
        if (!fs.existsSync(target) && !fs.existsSync(target + '.html')) {
            brokenLinks.push(href);
            auditResults.brokenInternalLinks.push({ page: relPath, href });
        }
    });

    // Check for duplicate HTML IDs
    const idMatches = [...content.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
    const idCounts = {};
    const dupIds = [];
    idMatches.forEach(id => {
        idCounts[id] = (idCounts[id] || 0) + 1;
        if (idCounts[id] === 2) dupIds.push(id);
    });
    if (dupIds.length > 0) {
        auditResults.duplicateIds.push({ page: relPath, duplicateIds: dupIds });
    }

    // Security checks in frontend
    if (content.includes('eval(')) {
        auditResults.securityWarnings.push({ page: relPath, warning: 'Uses eval()' });
    }
    if (content.includes('document.write(')) {
        auditResults.securityWarnings.push({ page: relPath, warning: 'Uses document.write()' });
    }

    auditResults.pages.push({
        file: relPath,
        title: title || 'MISSING TITLE',
        hasViewport,
        hasCharset,
        hasDescription,
        scriptsCount: scriptSrcMatches.length,
        inlineScriptsCount: inlineScripts.length,
        stylesCount: cssMatches.length,
        imagesCount: imgMatches.length,
        missingAssetsCount: scriptSrcMissing.length + cssMissing.length + imgMissing.length,
        brokenLinksCount: brokenLinks.length,
        duplicateIdsCount: dupIds.length
    });
});

fs.writeFileSync(path.join(root, 'scripts', 'audit_report_data.json'), JSON.stringify(auditResults, null, 2));
console.log('Audit scan completed successfully. Report written to scripts/audit_report_data.json');
