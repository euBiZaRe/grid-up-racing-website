const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
console.log('--- STARTING SECURITY & CODE QUALITY DEEP SCAN ---');

const findings = [];

function addFinding(severity, category, file, line, message, snippet) {
    findings.push({ severity, category, file, line, message, snippet });
}

// 1. Scan for hardcoded API keys / secrets / credentials
const secretPatterns = [
    { name: 'Discord Bot Token / Webhook', regex: /https:\/\/discord\.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_-]+/g },
    { name: 'Generic Private Key', regex: /-----BEGIN PRIVATE KEY-----/g },
    { name: 'Google Private Key / Service Account JSON', regex: /"private_key":\s*"-----BEGIN/g },
    { name: 'Hardcoded Password Field', regex: /(?:password|passwd|secret)\s*[:=]\s*["'][^"']{6,}["']/gi }
];

function scanFile(filePath) {
    const relPath = path.relative(root, filePath);
    if (relPath.includes('node_modules') || relPath.includes('.git') || relPath.includes('package-lock.json')) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
        const lineNum = idx + 1;

        // Skip comments and safe examples
        if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('<!--')) return;

        // Secrets Check
        secretPatterns.forEach(sp => {
            const matches = line.match(sp.regex);
            if (matches) {
                // If it's in scripts/ (like local backend automation or testing), note it
                const sev = relPath.startsWith('scripts') || relPath.startsWith('telemetry-app') ? 'MEDIUM' : 'CRITICAL';
                addFinding(sev, 'Hardcoded Secret', relPath, lineNum, `Potential ${sp.name} detected`, line.trim().substring(0, 100));
            }
        });

        // Dangerous innerHTML / XSS risks
        if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
            // Check for direct unescaped innerHTML assignments from location / URL params
            if (/innerHTML\s*=\s*.*(?:location\.search|location\.hash|decodeURIComponent|URLSearchParams)/i.test(line)) {
                addFinding('HIGH', 'Potential DOM XSS', relPath, lineNum, 'Direct assignment of unescaped URL parameters to innerHTML', line.trim());
            }

            // Check for eval()
            if (/\beval\s*\(/i.test(line) && !line.includes('//')) {
                addFinding('MEDIUM', 'Dangerous eval()', relPath, lineNum, 'Use of eval() detected', line.trim());
            }

            // Check for target="_blank" without rel="noopener noreferrer"
            if (/<a\s+[^>]*target=["']_blank["'][^>]*>/i.test(line) && !/rel=["'][^"']*noopener/i.test(line)) {
                // Only if not already present
                addFinding('LOW', 'Reverse Tabnabbing', relPath, lineNum, 'target="_blank" link missing rel="noopener noreferrer"', line.trim());
            }
        }
    });
}

function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(e => {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.git') {
            traverse(full);
        } else if (e.isFile()) {
            scanFile(full);
        }
    });
}

traverse(root);

console.log(`Scan complete. Found ${findings.length} items.`);
fs.writeFileSync(path.join(root, 'scripts', 'security_findings.json'), JSON.stringify(findings, null, 2));

const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
findings.forEach(f => bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1);
console.log('Findings by Severity:', bySeverity);
