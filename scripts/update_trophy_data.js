const fs = require('fs');
const path = require('path');

const maps = JSON.parse(fs.readFileSync(path.join(__dirname, '../js/track-maps.json'), 'utf8'));

const trackDefinitions = {
    'spa': { name: 'Spa-Francorchamps', fullName: 'Circuit de Spa-Francorchamps', length: '7.004 km', id: '240', vb: '-23.7 92.7 1957.6 919.6' },
    'brands-hatch': { name: 'Brands Hatch', fullName: 'Brands Hatch Circuit', length: '3.916 km', id: '144', vb: '44.5 40.3 1834.2 1002.5' },
    'daytona': { name: 'Daytona', fullName: 'Daytona International Speedway', length: '5.730 km', id: '555', vb: '-54.1 3.7 2034.6 1017.2' },
    'daytona-oval': { name: 'Daytona Oval', fullName: 'Daytona International Speedway Oval', length: '4.023 km', id: '237', vb: '-11.5 197.7 1901.2 682.6' },
    'nurburgring': { name: 'Nürburgring', fullName: 'Nürburgring Nordschleife / GP', length: '25.378 km', id: '252', vb: '406.8 -36.3 1106.6 1135.2' },
    'monza': { name: 'Monza', fullName: 'Autodromo Nazionale Monza', length: '5.793 km', id: '107', vb: '-65.4 79.4 2066.7 933.2' },
    'watkins-glen': { name: 'Watkins Glen', fullName: 'Watkins Glen International', length: '5.472 km', id: '18', vb: '285.9 60.6 1448.2 1026.6' },
    'silverstone': { name: 'Silverstone', fullName: 'Silverstone Circuit', length: '5.891 km', id: '166', vb: '-39.6 10.4 2006.1 999.9' },
    'sebring': { name: 'Sebring', fullName: 'Sebring International Raceway', length: '6.019 km', id: '215', vb: '158.9 21.0 1648.0 1001.7' },
    'road-america': { name: 'Road America', fullName: 'Road America', length: '6.515 km', id: '5', vb: '-71.7 -14.9 2044.7 1061.8' },
    'suzuka': { name: 'Suzuka', fullName: 'Suzuka International Racing Course', length: '5.807 km', id: '511', vb: '98.3 169.2 1733.1 740.6' },
    'lemans': { name: 'Le Mans', fullName: 'Circuit des 24 Heures du Mans', length: '13.626 km', id: '211', vb: '-59.5 121.1 2001.4 777.4' },
    'indy': { name: 'Indianapolis', fullName: 'Indianapolis Motor Speedway', length: '4.023 km', id: '190', vb: '45.3 143.8 1814.5 743.8', img: 'indy-oval.png' },
    'indy-oval': { name: 'Indianapolis Oval', fullName: 'Indianapolis Motor Speedway Oval', length: '4.023 km', id: '190', vb: '45.3 143.8 1814.5 743.8', img: 'indy-oval.png' },
    'bathurst': { name: 'Bathurst', fullName: 'Mount Panorama Circuit (Bathurst)', length: '6.213 km', id: '6', vb: '-71.7 -14.9 2044.7 1061.8' },
    'portimao': { name: 'Portimão', fullName: 'Autódromo Internacional do Algarve', length: '4.653 km', id: '135', vb: '98.7 136.0 1800.3 844.3' },
    'road-atlanta': { name: 'Road Atlanta', fullName: 'Michelin Raceway Road Atlanta', length: '4.088 km', id: '431', vb: '518.2 97.7 866.5 853.0' }
};

const tracksObj = {};
for (const [k, v] of Object.entries(trackDefinitions)) {
    const imgFile = v.img || `${k}.png`;
    tracksObj[k] = {
        name: v.name,
        fullName: v.fullName,
        length: v.length,
        image: `/assets/tracks/${imgFile}?v=46`,
        viewBox: v.vb,
        svgPath: maps[v.id].i
    };
}

const headerComment = `/**
 * Trophy Room Track Outlines & Manufacturer Logos
 * GRiD UP Sim Racing
 * 
 * Central asset registry for SVG circuit maps and automotive emblems.
 * Official track vector outlines extracted directly from telemetry track-maps.json.
 */

window.TRACK_OUTLINES = `;

const targetFile = path.join(__dirname, '../js/trophy-data-v3.js');
let currentContent = fs.readFileSync(targetFile, 'utf8');

// Find manufacturer logos part
const mfgIdx = currentContent.indexOf('window.MANUFACTURER_LOGOS =');
const mfgPart = currentContent.slice(mfgIdx);

const newContent = headerComment + JSON.stringify(tracksObj, null, 4) + ';\n\n' + mfgPart;
fs.writeFileSync(targetFile, newContent, 'utf8');
console.log('Successfully updated js/trophy-data-v3.js');

// Also update trophy-data-v2.js and trophy-data.js if they exist
['../js/trophy-data-v2.js', '../js/trophy-data.js'].forEach(rel => {
    const fPath = path.join(__dirname, rel);
    if (fs.existsSync(fPath)) {
        let cnt = fs.readFileSync(fPath, 'utf8');
        const mIdx = cnt.indexOf('window.MANUFACTURER_LOGOS =');
        if (mIdx !== -1) {
            const mSection = cnt.slice(mIdx);
            fs.writeFileSync(fPath, headerComment + JSON.stringify(tracksObj, null, 4) + ';\n\n' + mSection, 'utf8');
            console.log('Successfully updated', rel);
        }
    }
});
