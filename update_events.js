const fs = require('fs');
const path = require('path');

const eventsDir = path.join(__dirname, 'events');

const mapping = {
    'thruxton-4h.html': { track: 'Thruxton Circuit', dur: '4 Hours', type: 'Team Event', classStr: 'GT3 Class', desc: 'A touring car endurance event on the UK\'s fastest circuit. High-speed sweepers reward clean racing over aggressive tactics.', date: 'May 29-30, 2026' },
    'watkins-glen-6h.html': { track: 'Watkins Glen International', dur: '6 Hours', type: 'Team Event (IMSA Classes)', classStr: 'GTP, LMP2, GT3', desc: 'Six hours of IMSA multiclass racing at the iconic Finger Lakes circuit. The Bus Stop chicane is the prime overtaking and incident zone.', date: 'June 19-21, 2026' },
    'firecracker-400.html': { track: 'Daytona International Speedway', dur: '400 Miles', type: 'NASCAR iRacing Series (Solo)', classStr: '1987 NASCAR', desc: 'Throwback event using 1987 NASCAR machinery. No power steering or aero refinement makes this a raw mechanical challenge.', date: 'June 30 - July 6, 2026' },
    'spa-24hr.html': { track: 'Circuit de Spa-Francorchamps', dur: '24 Hours', type: 'Team Event', classStr: 'GT3 Class', desc: '24 hours of GT3 racing at Spa. Guaranteed weather changes and high-speed night laps through Eau Rouge and Raidillon.', date: 'July 10-12, 2026' },
    'brickyard-400.html': { track: 'Indianapolis Motor Speedway', dur: '400 Miles', type: 'NASCAR iRacing Series (Solo)', classStr: 'NASCAR Next Gen', desc: 'NASCAR on the historic Indy oval. Features wider corners and a more technical surface than traditional superspeedways.', date: 'July 22-27, 2026' },
    'road-america-6h.html': { track: 'Road America', dur: '6 Hours', type: 'Team Event', classStr: 'IMSA Classes', desc: 'IMSA multiclass racing at Road America. High average speeds and a 4-mile length create constant multi-class traffic situations.', date: 'July 24-26, 2026' },
    'knoxville-nationals.html': { track: 'Knoxville Raceway', dur: 'Sprint Race Format', type: 'Super Session (Solo)', classStr: '410 Winged Sprint Car', desc: 'The most prestigious dirt event. 410 Sprint cars are brutally powerful machines that demand total commitment on the clay oval.', date: 'August 4-9, 2026' },
    'portimao-1000.html': { track: 'Algarve International Circuit', dur: '8 Hours (1000km)', type: 'Team Event', classStr: 'HPD, GT1, GT2', desc: 'Endurance event using vintage machinery. The undulating circuit\'s dramatic elevation changes and blind corners provide a unique challenge.', date: 'August 14-15, 2026' },
    'suzuka-1000km.html': { track: 'Suzuka Circuit', dur: '7 Hours (1000km)', type: 'Team Event', classStr: 'GT3 Class', desc: 'One of the world\'s most technically demanding circuits. Figure-eight layout and iconic corners like 130R and Spoon.', date: 'September 10-15, 2026' },
    'crandon-championship.html': { track: 'Crandon International Raceway', dur: 'Off-road Race Format', type: 'Super Session (Solo)', classStr: 'Pro 4 Truck', desc: 'Short-course off-road truck racing. Pro 4 trucks bouncing through dirt and jumps where survival is as important as speed.', date: 'August 25-30, 2026' },
    'southern-500.html': { track: 'Darlington Raceway', dur: '500 Miles', type: 'NASCAR iRacing Series (Solo)', classStr: 'NASCAR Cup', desc: 'Original superspeedway. Darlington\'s egg-shaped oval forces drivers to run extremely close to the wall.', date: 'September 2-7, 2026' },
    'britcar-24hr.html': { track: 'Silverstone Circuit', dur: '24 Hours', type: 'Team Event', classStr: 'GT3, GT4', desc: '24 hours of GT racing at the Home of British Motorsport. Distinctly European character with the technical showpiece of Copse and Maggotts.', date: 'September 18-20, 2026' },
    'petit-le-mans.html': { track: 'Road Atlanta', dur: '10 Hours', type: 'Team Event', classStr: 'GTP, LMP2, GT3', desc: 'IMSA season finale. Dramatic downhill esses and blind corners with peak intensity during night multiclass traffic.', date: 'September 25-27, 2026' },
    'bathurst-1000.html': { track: 'Mount Panorama Circuit', dur: '1000km', type: 'Team Event', classStr: 'Supercars', desc: '"The Great Race." Gen3 Supercars with powerful V8s and no electronics demand pure driver skill across the mountain.', date: 'October 2-4, 2026' },
    'indy-8h.html': { track: 'Indianapolis Motor Speedway', dur: '8 Hours', type: 'Team Event', classStr: 'GT3 Class', desc: 'GT3 endurance racing on the Indy road course. A hybrid circuit that rewards different skill sets in the infield and oval sections.', date: 'October 16-18, 2026' },
    'ff1600-festival.html': { track: 'Brands Hatch Indy', dur: 'Festival Format', type: 'Super Session (Solo)', classStr: 'FF1600', desc: 'Grassroots racing at its finest. Formula Ford 1600 with no downforce or electronics on a tight, flowing layout.', date: 'October 30-31, 2026' },
    'homestead-championship.html': { track: 'Homestead-Miami Speedway', dur: '400 Miles', type: 'NASCAR iRacing Series (Solo)', classStr: 'NASCAR Cup', desc: 'NASCAR season finale. A championship event that rewards clean, methodical racing over the full distance.', date: 'November 4-9, 2026' },
    'sfl-mountain-showdown.html': { track: 'Mount Panorama Circuit', dur: 'Sprint/Feature Format', type: 'Super Session (Solo)', classStr: 'Super Formula Light', desc: 'Super Formula Lights at Mount Panorama. High-downforce open-wheelers transform the mountain\'s character compared to GT racing.', date: 'November 13-15, 2026' },
    'scca-runoffs.html': { track: 'Various Locations', dur: 'Championship Format', type: 'Super Session (Solo)', classStr: 'Multiclass', desc: 'National Championship for amateur classes. Celebrates the grassroots origins of road racing with accessible machinery.', date: 'November 22, 2026' },
    '992-endurance-cup.html': { track: 'Various Circuits', dur: 'Endurance', type: 'Team Event', classStr: 'Porsche 911 GT3 Cup (992)', desc: 'The 992 Endurance Cup tests teams in the premier Porsche cup car.', date: 'November 27-29, 2026' },
    'winter-derby.html': { track: 'Five Flags Speedway', dur: 'Derby Format', type: 'Super Session (Solo)', classStr: 'Super Late Model', desc: 'Classic American short-track dirt late model racing. Tight, close quarters where position and groove choice are critical.', date: 'December 2-7, 2026' },
    'chili-bowl.html': { track: 'Tulsa Expo Center', dur: 'Week-long National Format', type: 'Super Session (Solo)', classStr: 'Dirt Midget', desc: 'Most prestigious indoor dirt midget race. Visceral and challenging indoor clay oval requiring constant throttle adjustment.', date: 'December 15-20, 2026' },
    'production-car-challenge.html': { track: 'Virginia International Raceway', dur: 'Multi-hour Endurance', type: 'Team Event', classStr: 'Mazda MX-5 Cup, Renault Clio R.S., BMW M2 CS Racing, Toyota GR86', desc: 'Year-closing endurance event at VIR. Scenic circuit and production-based machinery that rewards proper technique.', date: 'December 18-19, 2026' }
};

fs.readdirSync(eventsDir).forEach(file => {
    if (!mapping[file]) return;
    
    let content = fs.readFileSync(path.join(eventsDir, file), 'utf8');
    const data = mapping[file];

    // 1. Date
    content = content.replace(
        /(<p style="color: var\(--primary\); font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">)(.*?)(<\/p>)/,
        `$1${data.date}$3`
    );

    // 2. Event Overview
    content = content.replace(
        /(<h2>Event Overview<\/h2>\s*<p>)(.*?)(<\/p>)/s,
        `$1${data.desc}$3`
    );

    // 3. Track Information Header and Desc
    content = content.replace(
        /(<h2>Track Information<\/h2>\s*<div class="glass sidebar-card">\s*<h3>)(.*?)(<\/h3>\s*<p>)(.*?)(<\/p>)/s,
        `$1${data.track}$3Experience the challenge of racing at ${data.track} on the iRacing platform.$5`
    );

    // 4. Race Format Details
    content = content.replace(
        /(<strong style="color: var\(--primary\);">Type:<\/strong> )(.*?)(<\/li>)/s,
        `$1${data.type}$3`
    );
    content = content.replace(
        /(<strong style="color: var\(--primary\);">Distance:<\/strong> )(.*?)(<\/li>)/s,
        `$1${data.dur}$3`
    );
    content = content.replace(
        /(<strong style="color: var\(--primary\);">Classes:<\/strong> )(.*?)(<\/li>)/s,
        `$1${data.classStr}$3`
    );

    // 5. Cars Competing List
    // Convert the classStr string (like "HPD, GT1, GT2") into HTML divs for the car list
    if (content.includes('<h2>Cars Competing</h2>')) {
        const carItems = data.classStr.split(',').map(c => `<div class="car-item">${c.trim()}</div>`).join('\n                        ');
        content = content.replace(
            /(<h2>Cars Competing<\/h2>\s*<div class="car-list">).*?(<\/div>)/s,
            `$1\n                        ${carItems}\n                    $2`
        );
    }

    fs.writeFileSync(path.join(eventsDir, file), content);
    console.log(`Updated ${file}`);
});
