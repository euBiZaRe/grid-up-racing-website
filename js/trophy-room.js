/**
 * Trophy Room Rendering & Live Database Engine
 * GRiD UP Sim Racing
 * 
 * Sourced directly from the official team results database (event_results & events collections)
 * used by https://gridup.online/results.
 * STRICT FILTER: ONLY displays P1, P2, and P3 podium finishes. All non-podium finishes are discarded.
 */

let ALL_PODIUMS = [];
let CURRENT_SERIES_FILTER = 'ALL';
let CURRENT_SEASON_FILTER = 'ALL';
let CURRENT_CAR_FILTER = 'ALL';
let CURRENT_DRIVER_FILTER = 'ALL';
let CURRENT_VIEW_MODE = 'grid'; // 'grid' or 'list'
let CURRENT_FEATURED_INDEX = 0;

document.addEventListener('DOMContentLoaded', () => {
    initTrophyRoom();
});

async function initTrophyRoom() {
    setupEventListeners();
    await loadPodiumResultsFromDatabase();
}

/**
 * Safely parse any timestamp representation (Firestore Timestamp, ISO string, milliseconds)
 */
function getTimestampMs(ts) {
    if (!ts) return 0;
    if (typeof ts === 'number') return ts;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (ts.seconds) return ts.seconds * 1000;
    if (typeof ts === 'string') {
        const parsed = Date.parse(ts);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

/**
 * Infer series category (GT3, GT4, LMP2, GTE, etc.) from car or event name
 */
function inferCategory(car = '', eventName = '') {
    const c = (car || '').toUpperCase();
    const e = (eventName || '').toUpperCase();

    if (c.includes('GT3') || e.includes('GT3')) return 'GT3';
    if (c.includes('GT4') || e.includes('GT4')) return 'GT4';
    if (c.includes('GTP') || c.includes('LMP2') || c.includes('P217') || c.includes('963') || c.includes('ARX') || c.includes('ZX-T')) return 'LMP2';
    if (c.includes('GTE') || c.includes('RSR') || c.includes('GT1') || c.includes('C6.R')) return 'GTE';
    if (c.includes('IR18') || c.includes('INDY') || e.includes('INDY')) return 'FORMULA';
    if (c.includes('TCR') || c.includes('CIVIC') || c.includes('CUP') || c.includes('MX-5')) return 'TOURING';
    return 'GT3';
}

/**
 * Infer manufacturer key from car string
 */
function inferManufacturer(car = '') {
    const c = (car || '').toLowerCase();
    if (c.includes('porsche')) return 'porsche';
    if (c.includes('amg') || c.includes('mercedes')) return 'amg';
    if (c.includes('bmw')) return 'bmw';
    if (c.includes('ferrari') || c.includes('ferarri')) return 'ferrari';
    if (c.includes('aston')) return 'aston';
    if (c.includes('audi')) return 'audi';
    if (c.includes('lamborghini')) return 'lamborghini';
    if (c.includes('dallara') || c.includes('ir18') || c.includes('p217')) return 'dallara';
    return '';
}

/**
 * Match track key for outline SVG
 */
function inferTrackKey(eventId = '', eventName = '') {
    const s = (eventId + ' ' + eventName).toLowerCase();
    if (s.includes('spa')) return 'spa';
    if (s.includes('brands')) return 'brands-hatch';
    if (s.includes('daytona')) return 'daytona';
    if (s.includes('nurburgring') || s.includes('nürburgring')) return 'nurburgring';
    if (s.includes('monza')) return 'monza';
    if (s.includes('watkins') || s.includes('glen')) return 'watkins-glen';
    if (s.includes('silverstone')) return 'silverstone';
    if (s.includes('sebring')) return 'sebring';
    if (s.includes('road-america') || s.includes('america')) return 'road-america';
    if (s.includes('suzuka')) return 'suzuka';
    if (s.includes('le-mans') || s.includes('lemans') || s.includes('sarthe')) return 'lemans';
    if (s.includes('indy')) return 'indy';
    if (s.includes('bathurst') || s.includes('panorama')) return 'bathurst';
    if (s.includes('portimao') || s.includes('algarve')) return 'portimao';
    return 'daytona';
}

/**
 * Clean display name for events
 */
function formatEventTitle(eId, evName) {
    if (evName && evName !== eId && !evName.includes('-')) return evName;
    const s = (eId || '').toLowerCase();
    if (s.includes('daytona-24h')) return '24 Hours of Daytona';
    if (s.includes('nurburgring-24h')) return '24 Hours of Nürburgring';
    if (s.includes('spa-24h')) return '24 Hours of Spa';
    if (s.includes('sebring-12h')) return '12 Hours of Sebring';
    if (s.includes('bathurst-12h')) return 'Bathurst 12 Hour';
    if (s.includes('road-america-6h') || s.includes('road-america')) return 'Road America 6 Hour';
    if (s.includes('suzuka-1000')) return 'Suzuka 1000km';
    if (s.includes('indy-500')) return 'Indianapolis 500';
    return eId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Pick or map event photo
 */
function inferEventImage(eventId = '', index = 0) {
    const s = (eventId || '').toLowerCase();
    if (s.includes('road-america')) return '/assets/results/July2526(3).png';
    if (s.includes('nurburgring')) return '/assets/results/May226(2).png';
    if (s.includes('daytona')) return '/assets/results/Jan1726(3).png';
    if (s.includes('suzuka')) return '/assets/results/Nov1525.png';
    if (s.includes('indy')) return '/assets/results/Jan1026.png';
    if (s.includes('spa')) return '/assets/results/July1126.png';
    if (s.includes('sebring')) return '/assets/results/Mar2826.png';
    if (s.includes('portimao')) return '/assets/results/July2526(1).png';
    if (s.includes('bathurst')) return '/assets/results/Feb2126.png';
    
    const fallbacks = [
        '/assets/results/July2526(3).png',
        '/assets/results/May226(2).png',
        '/assets/results/Jan1726(3).png',
        '/assets/results/Nov1525.png',
        '/assets/results/Jan1026.png'
    ];
    return fallbacks[index % fallbacks.length];
}

/**
 * 1. Fetch live results from database (same collections as /results.html)
 */
async function loadPodiumResultsFromDatabase() {
    const featuredGrid = document.getElementById('featured-podiums-grid');
    const pastContainer = document.getElementById('past-podiums-container');

    if (featuredGrid) featuredGrid.innerHTML = '<div class="trophy-empty-state"><p>Loading team podium finishes...</p></div>';
    if (pastContainer) pastContainer.innerHTML = '<div class="trophy-empty-state"><p>Loading podium archives...</p></div>';

    try {
        let resultsDocs = [];
        let eventsMap = {};

        // Check if window.db or global db is ready
        const activeDb = window.db || (typeof db !== 'undefined' ? db : null);

        if (activeDb) {
            const resultsSnap = await activeDb.collection("event_results").orderBy("timestamp", "desc").get();
            const eventsSnap = await activeDb.collection("events").get();
            
            resultsDocs = resultsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            eventsSnap.docs.forEach(doc => {
                eventsMap[doc.id] = doc.data();
            });
        } else {
            // REST API with large page size to ensure ALL entries are fetched
            const resR = await fetch('https://firestore.googleapis.com/v1/projects/grid-up/databases/(default)/documents/event_results?pageSize=300');
            const dataR = await resR.json();
            const resE = await fetch('https://firestore.googleapis.com/v1/projects/grid-up/databases/(default)/documents/events?pageSize=300');
            const dataE = await resE.json();

            resultsDocs = (dataR.documents || []).map(doc => {
                const f = doc.fields || {};
                return {
                    id: doc.name.split('/').pop(),
                    eventId: f.eventId?.stringValue || '',
                    teamName: f.teamName?.stringValue || '',
                    car: f.car?.stringValue || '',
                    finish: f.finish?.stringValue || '',
                    qualy: f.qualy?.stringValue || '-',
                    drivers: f.drivers?.arrayValue?.values?.map(v => v.stringValue) || [],
                    timestamp: f.timestamp?.timestampValue || ''
                };
            });

            (dataE.documents || []).forEach(doc => {
                const id = doc.name.split('/').pop();
                const f = doc.fields || {};
                eventsMap[id] = {
                    name: f.name?.stringValue,
                    date: f.date?.stringValue
                };
            });
        }

        const extracted = [];

        resultsDocs.forEach((d, idx) => {
            const eId = d.eventId || '';

            // Skip league races (gtc-) as on /results.html
            if (eId.startsWith('gtc-')) return;

            // ==========================================
            // STRICT PODIUM FILTER: P1, P2, or P3 ONLY
            // ==========================================
            const rawFinish = String(d.finish || '').trim().toUpperCase();
            let pos = null;

            if (rawFinish === 'P1' || rawFinish === '1' || rawFinish === '1ST' || rawFinish === 'FIRST') {
                pos = 1;
            } else if (rawFinish === 'P2' || rawFinish === '2' || rawFinish === '2ND' || rawFinish === 'SECOND') {
                pos = 2;
            } else if (rawFinish === 'P3' || rawFinish === '3' || rawFinish === '3RD' || rawFinish === 'THIRD') {
                pos = 3;
            }

            // Reject all non-podiums immediately (e.g. P4, P6, P11, P21, DNF, -, charity raised, etc.)
            if (pos !== 1 && pos !== 2 && pos !== 3) {
                return;
            }

            const ev = eventsMap[eId] || { name: eId, date: '' };
            const eventName = formatEventTitle(eId, ev.name);
            const tsMs = getTimestampMs(d.timestamp);
            const year = tsMs ? new Date(tsMs).getFullYear() : (eId.includes('-25') ? 2025 : 2026);
            const trackKey = inferTrackKey(eId, eventName);
            const trackInfo = (window.TRACK_OUTLINES && window.TRACK_OUTLINES[trackKey]) || { name: eventName, length: 'Grand Prix Circuit' };
            const category = inferCategory(d.car, eventName);
            const displayDate = ev.date || (tsMs ? new Date(tsMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (year + ' Official'));

            extracted.push({
                id: d.id || ('podium-' + idx),
                position: pos,
                finish: 'P' + pos,
                positionLabel: pos === 1 ? '1ST PLACE' : (pos === 2 ? '2ND PLACE' : '3RD PLACE'),
                accent: pos === 1 ? 'gold' : (pos === 2 ? 'silver' : 'bronze'),
                eventId: eId,
                event: eventName,
                series: eventName.includes('iRacing') ? 'iRacing Championship' : 'Endurance Special Event',
                round: 'Official Classification',
                category: category,
                date: displayDate,
                season: year,
                car: d.car || 'Official Entry',
                drivers: Array.isArray(d.drivers) ? d.drivers : (d.drivers ? [d.drivers] : ['Team Drivers']),
                teamName: d.teamName || 'GRiD UP Sim Racing',
                qualy: d.qualy || '-',
                trackKey: trackKey,
                trackName: trackInfo.name,
                trackLength: trackInfo.length,
                image: inferEventImage(eId, idx),
                manufacturer: inferManufacturer(d.car),
                timestamp: d.timestamp || ''
            });
        });

        // Sort chronologically (newest first)
        extracted.sort((a, b) => {
            const ta = getTimestampMs(a.timestamp);
            const tb = getTimestampMs(b.timestamp);
            if (ta && tb && ta !== tb) return tb - ta;
            return (b.season || 0) - (a.season || 0);
        });

        ALL_PODIUMS = extracted;
        window.ALL_PODIUMS = extracted;

        renderTrophyStats();
        renderSeriesButtons();
        renderFeaturedPodiums();
        populateFilterDropdowns();
        renderPastPodiums();

    } catch (err) {
        console.error("Error loading podium results:", err);
        if (featuredGrid) {
            featuredGrid.innerHTML = '<div class="trophy-empty-state"><p>Could not load live podium results. Please try refreshing.</p></div>';
        }
    }
}

/**
 * 2. Render Header Statistics based strictly on validated P1, P2, P3 finishes
 */
function renderTrophyStats() {
    let wins = 0;
    let p2 = 0;
    let p3 = 0;

    ALL_PODIUMS.forEach(p => {
        if (p.position === 1) wins++;
        else if (p.position === 2) p2++;
        else if (p.position === 3) p3++;
    });

    const total = ALL_PODIUMS.length;

    const winsEl = document.getElementById('stat-wins');
    const p2El = document.getElementById('stat-p2');
    const p3El = document.getElementById('stat-p3');
    const totalEl = document.getElementById('stat-total');

    if (winsEl) winsEl.textContent = wins;
    if (p2El) p2El.textContent = p2;
    if (p3El) p3El.textContent = p3;
    if (totalEl) totalEl.textContent = total;
}

/**
 * 3. Render Series Filter Buttons
 */
function renderSeriesButtons() {
    const container = document.getElementById('featured-series-filters');
    if (!container) return;

    const availableCategories = new Set(['ALL']);
    ALL_PODIUMS.forEach(p => {
        if (p.category) availableCategories.add(p.category);
    });

    const categoriesList = ['ALL', 'GT3', 'LMP2', 'FORMULA', 'GT4', 'GTE', 'TOURING']
        .filter(cat => availableCategories.has(cat));

    container.innerHTML = categoriesList.map(cat => `
        <button class="trophy-filter-btn ${cat === CURRENT_SERIES_FILTER ? 'active' : ''}" data-series="${cat}">
            ${cat === 'ALL' ? 'ALL SERIES' : cat}
        </button>
    `).join('');

    container.querySelectorAll('.trophy-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.trophy-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            CURRENT_SERIES_FILTER = btn.getAttribute('data-series');
            renderFeaturedPodiums();
        });
    });
}

/**
 * Circuit Outline Component
 */
function getTrackSvg(trackKey) {
    const track = (window.TRACK_OUTLINES && window.TRACK_OUTLINES[trackKey]) || {
        name: 'Circuit',
        length: '5.000 km',
        svgPath: 'M 15 35 Q 12 18 30 16 L 75 16 Q 92 18 90 35 Q 88 50 72 48 L 52 44 L 32 48 Q 15 50 15 35 Z'
    };

    return `
        <div class="trophy-track-box">
            <svg viewBox="0 0 100 60" class="track-svg" preserveAspectRatio="xMidYMid meet">
                <path d="${track.svgPath}" class="track-path" />
            </svg>
            <div class="track-info">
                <span class="track-name">${track.name}</span>
                <span class="track-length">${track.length}</span>
            </div>
        </div>
    `;
}

/**
 * Manufacturer Logo Component
 */
function getManufacturerLogo(key) {
    if (!key || !window.MANUFACTURER_LOGOS || !window.MANUFACTURER_LOGOS[key]) return '';
    return `<div class="mfg-logo mfg-${key}">${window.MANUFACTURER_LOGOS[key].svg}</div>`;
}

/**
 * 4. Render Featured Podiums (Spotlights top/highest achievements)
 */
function renderFeaturedPodiums() {
    const container = document.getElementById('featured-podiums-grid');
    if (!container) return;

    let items = ALL_PODIUMS.slice();
    if (CURRENT_SERIES_FILTER !== 'ALL') {
        items = items.filter(item => item.category === CURRENT_SERIES_FILTER);
    }

    // Sort featured by best result first (P1 wins first, then P2, then P3), then newest
    const sortedForFeatured = items.slice().sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        const ta = getTimestampMs(a.timestamp);
        const tb = getTimestampMs(b.timestamp);
        if (ta && tb && ta !== tb) return tb - ta;
        return (b.season || 0) - (a.season || 0);
    });

    const featuredItems = sortedForFeatured.slice(0, 3);

    if (featuredItems.length === 0) {
        container.innerHTML = `
            <div class="trophy-empty-state" style="grid-column: 1 / -1;">
                <p>No featured podium finishes found for ${CURRENT_SERIES_FILTER}.</p>
            </div>
        `;
        updateCarouselDots(0);
        return;
    }

    container.innerHTML = featuredItems.map((item, idx) => {
        const posClass = item.position === 1 ? 'pos-1 gold' : (item.position === 2 ? 'pos-2 silver' : 'pos-3 bronze');
        const posSup = item.position === 1 ? 'ST' : (item.position === 2 ? 'ND' : 'RD');
        const driversStr = Array.isArray(item.drivers) ? item.drivers.join(' / ') : item.drivers;

        return `
            <div class="featured-card ${posClass}" data-index="${idx}">
                <div class="card-glow"></div>
                <div class="featured-img-container">
                    <img src="${item.image}" alt="${item.event}" class="featured-img" loading="lazy">
                    <div class="featured-img-gradient"></div>
                    <div class="featured-pos-watermark">
                        <span class="pos-num">${item.position}</span>
                        <span class="pos-meta">
                            <span class="pos-sup">${posSup}</span>
                            <span class="pos-lbl">PLACE</span>
                        </span>
                    </div>
                </div>

                <div class="featured-body">
                    <div class="featured-meta-header">
                        <div class="featured-series">${item.teamName}</div>
                        <div class="featured-round">${item.event}</div>
                    </div>

                    <div class="featured-specs">
                        <div class="spec-row">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span class="spec-text">${item.date || 'Official Event'}</span>
                        </div>
                        <div class="spec-row">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 17h14M5 12h14M5 7h14"/></svg>
                            <span class="spec-text">${item.car} (Qualy: ${item.qualy})</span>
                        </div>
                        <div class="spec-row">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span class="spec-text">${driversStr}</span>
                        </div>
                    </div>

                    <div class="featured-card-footer">
                        ${getTrackSvg(item.trackKey)}
                        ${getManufacturerLogo(item.manufacturer)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateCarouselDots(featuredItems.length);
}

/**
 * 5. Populate Filter Dropdowns dynamically from podium results
 */
function populateFilterDropdowns() {
    // Series
    const seriesSel = document.getElementById('filter-series');
    if (seriesSel) {
        const seriesSet = new Set(ALL_PODIUMS.map(p => p.category).filter(Boolean));
        let sHtml = '<option value="ALL">ALL SERIES</option>';
        seriesSet.forEach(s => { sHtml += `<option value="${s}">${s}</option>`; });
        seriesSel.innerHTML = sHtml;
    }

    // Seasons
    const seasonSel = document.getElementById('filter-season');
    if (seasonSel) {
        const seasonSet = new Set(ALL_PODIUMS.map(p => p.season).filter(Boolean));
        let seHtml = '<option value="ALL">ALL SEASONS</option>';
        Array.from(seasonSet).sort((a,b) => b - a).forEach(se => { seHtml += `<option value="${se}">${se} SEASON</option>`; });
        seasonSel.innerHTML = seHtml;
    }

    // Cars
    const carSel = document.getElementById('filter-car');
    if (carSel) {
        const carSet = new Set(ALL_PODIUMS.map(p => p.car).filter(Boolean));
        let cHtml = '<option value="ALL">ALL CARS</option>';
        carSet.forEach(c => { cHtml += `<option value="${c}">${c}</option>`; });
        carSel.innerHTML = cHtml;
    }

    // Drivers
    const driverSel = document.getElementById('filter-driver');
    if (driverSel) {
        const driverSet = new Set();
        ALL_PODIUMS.forEach(p => {
            if (Array.isArray(p.drivers)) p.drivers.forEach(d => driverSet.add(d));
            else if (p.drivers) driverSet.add(p.drivers);
        });
        let dHtml = '<option value="ALL">ALL DRIVERS</option>';
        Array.from(driverSet).sort().forEach(d => { dHtml += `<option value="${d}">${d}</option>`; });
        driverSel.innerHTML = dHtml;
    }
}

/**
 * 6. Render Past Podiums Archive Grid / List (STRICTLY P1, P2, P3 ONLY)
 */
function renderPastPodiums() {
    const container = document.getElementById('past-podiums-container');
    if (!container) return;

    let items = ALL_PODIUMS.slice();

    // Filters
    if (CURRENT_SERIES_FILTER !== 'ALL') {
        items = items.filter(item => item.category === CURRENT_SERIES_FILTER);
    }
    if (CURRENT_SEASON_FILTER !== 'ALL') {
        items = items.filter(item => String(item.season) === String(CURRENT_SEASON_FILTER));
    }
    if (CURRENT_CAR_FILTER !== 'ALL') {
        items = items.filter(item => item.car === CURRENT_CAR_FILTER);
    }
    if (CURRENT_DRIVER_FILTER !== 'ALL') {
        items = items.filter(item => {
            if (Array.isArray(item.drivers)) {
                return item.drivers.includes(CURRENT_DRIVER_FILTER);
            }
            return item.drivers === CURRENT_DRIVER_FILTER;
        });
    }

    if (items.length === 0) {
        container.innerHTML = `
            <div class="trophy-empty-state">
                <p>No podium finishes found matching the selected filter criteria.</p>
                <button class="btn btn-outline" onclick="resetPastFilters()">Reset All Filters</button>
            </div>
        `;
        return;
    }

    container.className = `past-podiums-${CURRENT_VIEW_MODE}`;

    if (CURRENT_VIEW_MODE === 'list') {
        container.innerHTML = `
            <div class="trophy-list-table-wrapper">
                <table class="trophy-list-table">
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Team & Event</th>
                            <th>Date</th>
                            <th>Car</th>
                            <th>Qualy</th>
                            <th>Drivers</th>
                            <th>Track</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => {
                            const posClass = item.position === 1 ? 'gold' : (item.position === 2 ? 'silver' : 'bronze');
                            const driversStr = Array.isArray(item.drivers) ? item.drivers.join(', ') : item.drivers;
                            return `
                                <tr class="trophy-list-row ${posClass}">
                                    <td class="col-pos">
                                        <div class="pos-badge ${posClass}">${item.finish}</div>
                                    </td>
                                    <td class="col-event">
                                        <strong>${item.event}</strong>
                                        <span>${item.teamName}</span>
                                    </td>
                                    <td class="col-date">${item.date}</td>
                                    <td class="col-car">${item.car}</td>
                                    <td class="col-qualy">${item.qualy}</td>
                                    <td class="col-drivers">${driversStr}</td>
                                    <td class="col-track">${item.trackName}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        return;
    }

    // Grid View
    container.innerHTML = items.map(item => {
        const posClass = item.position === 1 ? 'pos-1 gold' : (item.position === 2 ? 'pos-2 silver' : 'pos-3 bronze');
        const driversStr = Array.isArray(item.drivers) ? item.drivers.join(' / ') : item.drivers;

        return `
            <div class="past-card ${posClass}">
                <div class="past-card-header">
                    <div class="past-pos-badge ${posClass}">${item.finish}</div>
                    <div class="past-card-img-wrap">
                        <img src="${item.image}" alt="${item.event}" class="past-img" loading="lazy">
                        <div class="past-img-overlay"></div>
                    </div>
                </div>

                <div class="past-card-body">
                    <div class="past-series-title">${item.teamName}</div>
                    <div class="past-event-title">${item.event}</div>

                    <div class="past-specs">
                        <div class="past-spec-line">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>${item.date}</span>
                        </div>
                        <div class="past-spec-line">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 17h14M5 12h14M5 7h14"/></svg>
                            <span>${item.car} (Qualy: ${item.qualy})</span>
                        </div>
                        <div class="past-spec-line">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            <span>${driversStr}</span>
                        </div>
                    </div>

                    <div class="past-card-footer">
                        ${getTrackSvg(item.trackKey)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 7. Controls & Event Listeners
 */
function setupEventListeners() {
    const filterSeries = document.getElementById('filter-series');
    if (filterSeries) {
        filterSeries.addEventListener('change', (e) => {
            CURRENT_SERIES_FILTER = e.target.value;
            renderPastPodiums();
        });
    }

    const filterSeason = document.getElementById('filter-season');
    if (filterSeason) {
        filterSeason.addEventListener('change', (e) => {
            CURRENT_SEASON_FILTER = e.target.value;
            renderPastPodiums();
        });
    }

    const filterCar = document.getElementById('filter-car');
    if (filterCar) {
        filterCar.addEventListener('change', (e) => {
            CURRENT_CAR_FILTER = e.target.value;
            renderPastPodiums();
        });
    }

    const filterDriver = document.getElementById('filter-driver');
    if (filterDriver) {
        filterDriver.addEventListener('change', (e) => {
            CURRENT_DRIVER_FILTER = e.target.value;
            renderPastPodiums();
        });
    }

    const btnGrid = document.getElementById('view-grid-btn');
    const btnList = document.getElementById('view-list-btn');

    if (btnGrid && btnList) {
        btnGrid.addEventListener('click', () => {
            CURRENT_VIEW_MODE = 'grid';
            btnGrid.classList.add('active');
            btnList.classList.remove('active');
            renderPastPodiums();
        });

        btnList.addEventListener('click', () => {
            CURRENT_VIEW_MODE = 'list';
            btnList.classList.add('active');
            btnGrid.classList.remove('active');
            renderPastPodiums();
        });
    }

    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (prevBtn) prevBtn.addEventListener('click', () => scrollFeaturedCarousel(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollFeaturedCarousel(1));
}

function scrollFeaturedCarousel(direction) {
    const grid = document.getElementById('featured-podiums-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.featured-card');
    if (cards.length === 0) return;

    CURRENT_FEATURED_INDEX += direction;
    if (CURRENT_FEATURED_INDEX < 0) CURRENT_FEATURED_INDEX = 0;
    if (CURRENT_FEATURED_INDEX >= cards.length) CURRENT_FEATURED_INDEX = cards.length - 1;

    const targetCard = cards[CURRENT_FEATURED_INDEX];
    if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    updateCarouselDots(cards.length);
}

function updateCarouselDots(total) {
    const container = document.getElementById('carousel-dots');
    if (!container) return;

    let dotsHtml = '';
    for (let i = 0; i < total; i++) {
        dotsHtml += `<span class="carousel-dot ${i === CURRENT_FEATURED_INDEX ? 'active' : ''}" onclick="goToFeatured(${i})"></span>`;
    }
    container.innerHTML = dotsHtml;
}

window.goToFeatured = function(idx) {
    CURRENT_FEATURED_INDEX = idx;
    const grid = document.getElementById('featured-podiums-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.featured-card');
    if (cards[idx]) {
        cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    updateCarouselDots(cards.length);
};

window.resetPastFilters = function() {
    CURRENT_SERIES_FILTER = 'ALL';
    CURRENT_SEASON_FILTER = 'ALL';
    CURRENT_CAR_FILTER = 'ALL';
    CURRENT_DRIVER_FILTER = 'ALL';

    const s1 = document.getElementById('filter-series');
    const s2 = document.getElementById('filter-season');
    const s3 = document.getElementById('filter-car');
    const s4 = document.getElementById('filter-driver');

    if (s1) s1.value = 'ALL';
    if (s2) s2.value = 'ALL';
    if (s3) s3.value = 'ALL';
    if (s4) s4.value = 'ALL';

    renderPastPodiums();
};
