const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir) {
    let results = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'scratch') {
                results = results.concat(findHtmlFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                results.push(fullPath);
            }
        }
    } catch(e) {}
    return results;
}

const websiteDir = 'F:\\Grid Up\\Website';
const files = findHtmlFiles(websiteDir);
let processedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Step 1: Rename "Race Reports" to "News" in nav link text only
    if (content.includes('>Race Reports</a>')) {
        content = content.replace(/>Race Reports<\/a>/g, '>News</a>');
        changed = true;
    }

    // Step 2: Find the nav-links ul and reorder items
    const navRegex = /(<ul class="nav-links">)([\s\S]*?)(<\/ul>)/;
    const navMatch = content.match(navRegex);

    if (navMatch) {
        const navBlock = navMatch[2];

        // Extract individual <li>...</li> items (each on its own line)
        const liRegex = /[ \t]*<li>[\s\S]*?<\/li>/g;
        const liItems = [];
        let m;
        while ((m = liRegex.exec(navBlock)) !== null) {
            liItems.push(m[0].trim());
        }

        // Categorize items by their href
        function categorize(li) {
            if (li.includes('#home')) return 'home';
            if (li.includes('events.html')) return 'events';
            if (li.includes('league.html')) return 'league';
            if (li.includes('reports.html')) return 'reports';
            if (li.includes('roster.html')) return 'roster';
            if (li.includes('team-app.html')) return 'team-app';
            if (li.includes('shop.html')) return 'shop';
            if (li.includes('discord.gg') || li.includes('discord_header')) return 'discord';
            if (li.includes('login.html') || li.includes('login-link')) return 'login';
            return null;
        }

        const itemMap = {};
        const unknowns = [];
        for (const li of liItems) {
            const cat = categorize(li);
            if (cat) {
                itemMap[cat] = li;
            } else {
                unknowns.push(li);
            }
        }

        // Desired order: Home > Events > League > News > Roster > Apply > Shop > Discord > Login
        const desiredOrder = ['home', 'events', 'league', 'reports', 'roster', 'team-app', 'shop', 'discord', 'login'];
        const ordered = [];
        for (const key of desiredOrder) {
            if (itemMap[key]) {
                ordered.push(itemMap[key]);
            }
        }
        ordered.push(...unknowns);

        if (ordered.length > 0) {
            const indent = '                ';
            const newNavContent = '\n' + ordered.map(li => indent + li).join('\n') + '\n            ';
            const newContent = content.replace(navRegex, `$1${newNavContent}$3`);

            if (newContent !== content) {
                content = newContent;
                changed = true;
            }
        }
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        processedCount++;
    }
}

console.log(`Processed ${processedCount} files out of ${files.length} total HTML files`);
