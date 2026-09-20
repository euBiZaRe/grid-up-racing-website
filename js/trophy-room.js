/**
 * Trophy Room Rendering & Interactivity Engine
 * GRiD UP Sim Racing
 */

document.addEventListener('DOMContentLoaded', () => {
    initTrophyRoom();
});

let CURRENT_SERIES_FILTER = 'ALL';
let CURRENT_SEASON_FILTER = 'ALL';
let CURRENT_CAR_FILTER = 'ALL';
let CURRENT_DRIVER_FILTER = 'ALL';
let CURRENT_VIEW_MODE = 'grid'; // 'grid' or 'list'
let CURRENT_FEATURED_INDEX = 0;

function initTrophyRoom() {
    renderTrophyStats();
    renderSeriesButtons();
    renderFeaturedPodiums();
    populateFilterDropdowns();
    renderPastPodiums();
    setupEventListeners();
}

/**
 * 1. Render Header Statistics
 */
function renderTrophyStats() {
    const stats = window.TROPHY_STATS || { wins: 18, p2: 27, p3: 19, totalPodiums: 64 };
    const winsEl = document.getElementById('stat-wins');
    const p2El = document.getElementById('stat-p2');
    const p3El = document.getElementById('stat-p3');
    const totalEl = document.getElementById('stat-total');

    if (winsEl) winsEl.textContent = stats.wins;
    if (p2El) p2El.textContent = stats.p2;
    if (p3El) p3El.textContent = stats.p3;
    if (totalEl) totalEl.textContent = stats.totalPodiums;
}

/**
 * 2. Render Series Filter Buttons (Featured Podiums Section)
 */
function renderSeriesButtons() {
    const container = document.getElementById('featured-series-filters');
    if (!container) return;

    const seriesList = window.SERIES_LIST || [
        { id: 'ALL', label: 'ALL SERIES' },
        { id: 'GT3', label: 'GT3' },
        { id: 'GT4', label: 'GT4' },
        { id: 'LMP2', label: 'LMP2' },
        { id: 'GTE', label: 'GTE' }
    ];

    container.innerHTML = seriesList.map(s => `
        <button class="trophy-filter-btn ${s.id === CURRENT_SERIES_FILTER ? 'active' : ''}" data-series="${s.id}">
            ${s.label}
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
 * Helper: SVG Trophy Icon
 */
function getTrophyIcon(position) {
    if (position === 1) {
        return `<svg class="trophy-cup gold" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H8v2h8v-2h-3v-3.1c1.8-.41 3.2-1.85 3.61-3.96C19.08 11.63 21 9.55 21 7V5c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
        </svg>`;
    } else if (position === 2) {
        return `<svg class="trophy-cup silver" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H8v2h8v-2h-3v-3.1c1.8-.41 3.2-1.85 3.61-3.96C19.08 11.63 21 9.55 21 7V5c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
        </svg>`;
    } else {
        return `<svg class="trophy-cup bronze" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H8v2h8v-2h-3v-3.1c1.8-.41 3.2-1.85 3.61-3.96C19.08 11.63 21 9.55 21 7V5c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
        </svg>`;
    }
}

/**
 * Helper: Circuit SVG Element
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
 * Helper: Manufacturer Logo SVG
 */
function getManufacturerLogo(key) {
    if (!key || !window.MANUFACTURER_LOGOS || !window.MANUFACTURER_LOGOS[key]) return '';
    return `<div class="mfg-logo mfg-${key}">${window.MANUFACTURER_LOGOS[key].svg}</div>`;
}

/**
 * 3. Render Featured Podiums (Desktop 3-side-by-side & Mobile Carousel)
 */
function renderFeaturedPodiums() {
    const container = document.getElementById('featured-podiums-grid');
    if (!container) return;

    let items = (window.FEATURED_PODIUMS || []).slice();
    if (CURRENT_SERIES_FILTER !== 'ALL') {
        const filtered = items.filter(item => item.category === CURRENT_SERIES_FILTER);
        if (filtered.length > 0) items = filtered;
    }

    container.innerHTML = items.map((item, idx) => {
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
                        <div class="featured-series">${item.series}</div>
                        <div class="featured-round">${item.round} — ${item.event}</div>
                    </div>

                    <div class="featured-specs">
                        <div class="spec-row">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span class="spec-text">${item.date}</span>
                        </div>
                        <div class="spec-row">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 17h14M5 12h14M5 7h14"/></svg>
                            <span class="spec-text">${item.car}</span>
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

    updateCarouselDots(items.length);
}

/**
 * 4. Populate Past Podiums Filter Dropdowns
 */
function populateFilterDropdowns() {
    const pastItems = window.PAST_PODIUMS || [];

    // Series
    const seriesSel = document.getElementById('filter-series');
    if (seriesSel) {
        const seriesSet = new Set(pastItems.map(p => p.series || p.category).filter(Boolean));
        let sHtml = '<option value="ALL">ALL SERIES</option>';
        seriesSet.forEach(s => { sHtml += `<option value="${s}">${s}</option>`; });
        seriesSel.innerHTML = sHtml;
    }

    // Seasons
    const seasonSel = document.getElementById('filter-season');
    if (seasonSel) {
        const seasonSet = new Set(pastItems.map(p => p.season).filter(Boolean));
        let seHtml = '<option value="ALL">ALL SEASONS</option>';
        Array.from(seasonSet).sort((a,b) => b - a).forEach(se => { seHtml += `<option value="${se}">${se} SEASON</option>`; });
        seasonSel.innerHTML = seHtml;
    }

    // Cars
    const carSel = document.getElementById('filter-car');
    if (carSel) {
        const carSet = new Set(pastItems.map(p => p.car).filter(Boolean));
        let cHtml = '<option value="ALL">ALL CARS</option>';
        carSet.forEach(c => { cHtml += `<option value="${c}">${c}</option>`; });
        carSel.innerHTML = cHtml;
    }

    // Drivers
    const driverSel = document.getElementById('filter-driver');
    if (driverSel) {
        const driverSet = new Set();
        pastItems.forEach(p => {
            if (Array.isArray(p.drivers)) p.drivers.forEach(d => driverSet.add(d));
            else if (p.drivers) driverSet.add(p.drivers);
        });
        let dHtml = '<option value="ALL">ALL DRIVERS</option>';
        Array.from(driverSet).sort().forEach(d => { dHtml += `<option value="${d}">${d}</option>`; });
        driverSel.innerHTML = dHtml;
    }
}

/**
 * 5. Render Past Podiums Archive Grid / List
 */
function renderPastPodiums() {
    const gridContainer = document.getElementById('past-podiums-container');
    if (!gridContainer) return;

    let items = (window.PAST_PODIUMS || []).slice();

    // Filtering
    if (CURRENT_SERIES_FILTER !== 'ALL') {
        items = items.filter(item => (item.category === CURRENT_SERIES_FILTER || item.series === CURRENT_SERIES_FILTER));
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
        gridContainer.innerHTML = `
            <div class="trophy-empty-state">
                <p>No podium finishes found matching the selected filter criteria.</p>
                <button class="btn btn-outline" onclick="resetPastFilters()">Reset All Filters</button>
            </div>
        `;
        return;
    }

    gridContainer.className = `past-podiums-${CURRENT_VIEW_MODE}`;

    if (CURRENT_VIEW_MODE === 'list') {
        gridContainer.innerHTML = `
            <div class="trophy-list-table-wrapper">
                <table class="trophy-list-table">
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Series & Event</th>
                            <th>Date</th>
                            <th>Car</th>
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
                                        <div class="pos-badge ${posClass}">${item.position}</div>
                                    </td>
                                    <td class="col-event">
                                        <strong>${item.event}</strong>
                                        <span>${item.series} • ${item.round}</span>
                                    </td>
                                    <td class="col-date">${item.date}</td>
                                    <td class="col-car">${item.car}</td>
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

    // Default: Dense Motorsport Grid View
    gridContainer.innerHTML = items.map(item => {
        const posClass = item.position === 1 ? 'pos-1 gold' : (item.position === 2 ? 'pos-2 silver' : 'pos-3 bronze');
        const driversStr = Array.isArray(item.drivers) ? item.drivers.join(' / ') : item.drivers;

        return `
            <div class="past-card ${posClass}">
                <div class="past-card-header">
                    <div class="past-pos-badge ${posClass}">${item.position}</div>
                    <div class="past-card-img-wrap">
                        <img src="${item.image}" alt="${item.event}" class="past-img" loading="lazy">
                        <div class="past-img-overlay"></div>
                    </div>
                </div>

                <div class="past-card-body">
                    <div class="past-series-title">${item.series}</div>
                    <div class="past-event-title">${item.round} — ${item.event}</div>

                    <div class="past-specs">
                        <div class="past-spec-line">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>${item.date}</span>
                        </div>
                        <div class="past-spec-line">
                            <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 17h14M5 12h14M5 7h14"/></svg>
                            <span>${item.car}</span>
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
 * 6. Interactive Event Listeners & Carousel Controls
 */
function setupEventListeners() {
    // Dropdown filters
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

    // Grid / List View Toggle Buttons
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

    // Carousel Prev/Next Buttons
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            scrollFeaturedCarousel(-1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            scrollFeaturedCarousel(1);
        });
    }
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
