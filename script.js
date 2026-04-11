// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
});


// Reveal Animations on Scroll
const revealElements = document.querySelectorAll('.reveal');

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
};

const revealObserver = new IntersectionObserver(revealCallback, {
    threshold: 0.1
});

revealElements.forEach(el => revealObserver.observe(el));

// Smooth Scrolling for Nav Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70, // Adjust for fixed header
                behavior: 'smooth'
            });
        }
    });
});

// Carousel Logic
const carousel = document.getElementById('carousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

if (carousel && prevBtn && nextBtn) {
    let isPaused = false;
    let scrollInterval;
    let isDown = false;
    let startX;
    let scrollLeft;

    const startAutoScroll = () => {
        scrollInterval = setInterval(() => {
            if (!isPaused) {
                const card = carousel.querySelector('.card');
                if (!card) return;
                const cardWidth = card.offsetWidth + 32; // width + gap
                if (carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth - 10) {
                    carousel.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            }
        }, 3000);
    };

    carousel.addEventListener('mouseenter', () => isPaused = true);
    carousel.addEventListener('mouseleave', () => {
        isPaused = false;
        isDown = false;
    });

    carousel.addEventListener('mousedown', (e) => {
        isDown = true;
        isPaused = true;
        carousel.classList.add('active');
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
        isDown = false;
        if (carousel) carousel.classList.remove('active');
    });

    carousel.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2; // scroll-fast factor
        carousel.scrollLeft = scrollLeft - walk;
    });

    prevBtn.addEventListener('click', () => {
        const card = carousel.querySelector('.card');
        if (!card) return;
        const cardWidth = card.offsetWidth + 32;
        carousel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        const card = carousel.querySelector('.card');
        if (!card) return;
        const cardWidth = card.offsetWidth + 32;
        carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
    });

    startAutoScroll();
}

// Past Events Toggle
const toggleBtn = document.getElementById('togglePastEvents');
const pastSection = document.getElementById('pastEventsSection');

if (toggleBtn && pastSection) {
    toggleBtn.addEventListener('click', () => {
        const isHidden = pastSection.style.display === 'none';
        pastSection.style.display = isHidden ? 'flex' : 'none';
        toggleBtn.textContent = isHidden ? 'Hide Past Events' : 'Show Past Events';
    });
}

// Countdown Timer Logic
function updateCountdown(targetTimestamp) {
    if (!targetTimestamp) return;
    
    // Clear any existing timer
    if (window.countdownInterval) clearInterval(window.countdownInterval);

    const targetDate = new Date(targetTimestamp).getTime();
    
    function update() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        const countdownEl = document.getElementById('countdown');
        if (distance < 0) {
            if (countdownEl) {
                countdownEl.innerHTML = "<div class='glow-text' style='font-size: 2rem;'>RACE WEEKEND</div>";
            }
            return true; // Stop timer
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (daysEl) daysEl.innerText = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, '0');
        return false;
    }

    if (!update()) {
        window.countdownInterval = setInterval(() => {
            if (update()) clearInterval(window.countdownInterval);
        }, 1000);
    }
}

// Click and Drag Carousel Logic with Navigation Support
function initCarousel() {
    const containers = document.querySelectorAll('.upcoming-races-container');
    
    containers.forEach(container => {
        const track = container.querySelector('.carousel-track');
        const prevBtn = container.parentElement.querySelector('.prev-btn');
        const nextBtn = container.parentElement.querySelector('.next-btn');
        
        if (!track) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        // Mouse Drag Support
        track.addEventListener('mousedown', (e) => {
            isDown = true;
            track.style.cursor = 'grabbing';
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        track.addEventListener('mouseleave', () => {
            isDown = false;
            track.style.cursor = 'grab';
        });

        track.addEventListener('mouseup', () => {
            isDown = false;
            track.style.cursor = 'grab';
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast factor
            container.scrollLeft = scrollLeft - walk;
        });

        // Button Navigation
        if (prevBtn && nextBtn) {
            const scrollAmount = 350; // Approximates one card + gap
            
            prevBtn.addEventListener('click', () => {
                container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
            
            nextBtn.addEventListener('click', () => {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }
    });
}


// Firestore Data Integration
async function loadDynamicContent() {
    console.log("Loading dynamic site content...");
    if (typeof db === 'undefined') {
        console.warn("Firestore 'db' not initialized yet. Waiting...");
        return;
    }

    // 1. Load Upcoming Races & Update Hero (Show events starting now or recently finished)
    // We use a 24h lookback so ongoing races stay visible
    const lookbackDate = new Date();
    lookbackDate.setHours(lookbackDate.getHours() - 24);
    const filterTimestamp = lookbackDate.toISOString();

    const upcomingTrack = document.getElementById('dynamic-upcoming-track');
    const fullEventList = document.getElementById('full-event-list');
    
    // Global Constants for URL generation
    const isSubdir = window.location.pathname.includes('/events/') || window.location.pathname.includes('/drivers/');
    const prefix = isSubdir ? '../' : '';
    const staticIds = ['imsa-classic-500', 'nurburgring-24h', 'indy-500', 'world-600', 'thruxton-4h', 'watkins-glen-6h'];
    
    // Official Special Event Banners (sourced from iracing.com/special-events/)
    const BASE = 'https://s100.iracing.com/wp-content/uploads';
    const eventBanners = {
        // Completed Events
        'iracing-roar':         `${BASE}/2025/12/iRSE-2026-ROAR-960x576.png`,
        'daytona-24':           `${BASE}/2025/12/iRSE-2026-Daytona-24-VCO-960x576.png`,
        'daytona-500':          `${BASE}/2025/12/iRSE-2026-Daytona-500.png`,
        'bathurst-12':          `${BASE}/2025/12/iRSE-2026-Bathurst-12.png`,
        'sebring-12hr':         `${BASE}/2025/12/iRSE-2026-Sebring-12-VCO.png`,
        // Upcoming Events
        'imsa-classic-500':     `${BASE}/2026/03/iRSE-2026-IMSA-Classic-500.png`,
        'nurburgring-24h':      `${BASE}/2025/12/iRSE-2026-Nurburgring-24H.png`,
        'indy-500':             `${BASE}/2025/12/iRSE-2026-Indy-500.png`,
        'world-600':            `${BASE}/2025/12/iRSE-2026-World-600.png`,
        'thruxton-4h':          `${BASE}/2025/12/iRSE-2026-4-Hours-at-Thruxton.png`,
        'watkins-glen-6h':      `${BASE}/2025/12/iRSE-2026-Watkis-Glen-6H-VCO.png`,
        'spa-24hr':             `${BASE}/2025/12/iRSE-2026-SPA-24HR.png`,
        'brickyard-400':        `${BASE}/2025/12/iRSE-2026-Homestead-Championship.png`,
        'road-america-6h':      `${BASE}/2025/12/iRSE-2026-6HRS-Road-America.png`,
        'firecracker-400':      `${BASE}/2025/12/iRSE-2026-Firecracker-400.png`,
        'knoxville-nationals':  `${BASE}/2025/12/iRSE-2026-Knoxville-Nationals.png`,
        'portimao-1000':        `${BASE}/2025/12/iRSE-2026-Portimao-1000.png`,
        'crandon-championship': `${BASE}/2025/12/iRSE-2026-Crandon.png`,
        'southern-500':         `${BASE}/2025/12/iRSE-2026-Southern-500.png`,
        'suzuka-1000km':        `${BASE}/2026/01/iRSE-2026-PiMax-Suzuka-1000km.png`,
        'britcar-24hr':         `${BASE}/2025/12/iRSE-2026-Britcar-24.png`,
        'petit-le-mans':        `${BASE}/2025/12/iRSE-2026-Petit-Le-Mans-VCO.png`,
        'bathurst-1000':        `${BASE}/2025/12/iRSE-2026-Bathurst-1000.png`,
        'indianapolis-8h':      `${BASE}/2025/12/iRSE-2026-Indianapolis-8H.png`,
        'indy-8h':              `${BASE}/2025/12/iRSE-2026-Indianapolis-8H.png`,
        'ff1600-festival':      `${BASE}/2026/01/iRSE-2026-iRacing-Conspit-FF1600-Festival.png`,
        'homestead-championship': `${BASE}/2025/12/iRSE-2026-Homestead-Championship.png`,
        'sfl-mountain-showdown': `${BASE}/2025/12/iRSE-2026-SFL-Mountain-Challenge.png`,
        '992-endurance-cup':    `${BASE}/2026/04/iRSE-2026-Creventic-992-Endurance-Cup.png`,
        'winter-derby':         `${BASE}/2025/12/iRSE-2026-Winter-Derby.png`,
        'chili-bowl':           `${BASE}/2025/12/iRSE-2026-Chili-Bowl.png`,
        'production-car-challenge': `${BASE}/2025/12/iRSE-2026-Production-Car-Challenge.png`,
    };
    
    console.log("Auth: Querying events with filterTimestamp:", filterTimestamp);
    try {
        const snap = await db.collection("events")
            .where("startDate", ">=", filterTimestamp)
            .orderBy("startDate", "asc")
            .get();
        console.log("Auth: Firestore returned snapshot, size:", snap.size);

        const heroTitle = document.getElementById('hero-event-name');
        const heroSubtitle = document.getElementById('hero-event-subtitle');

        if (snap.empty) {
            console.log("Auth: No upcoming events found.");
            if (upcomingTrack) upcomingTrack.innerHTML = '<p style="text-align: center; color: var(--text-muted); width: 100%;">No upcoming events scheduled.</p>';
            if (fullEventList) fullEventList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Stay tuned for future event dates.</p>';
            
            // Clear LOADING state from hero
            if (heroTitle) heroTitle.textContent = "STAY TUNED";
            if (heroSubtitle) heroSubtitle.textContent = "No Active Events";
        } else {
            const events = [];
            snap.forEach(doc => events.push({ id: doc.id, ...doc.data() }));

            // A. Update Home Hero (if on index.html)
            const nextEvent = events[0];
            const heroSubtitle = document.getElementById('hero-event-subtitle');
            const heroTitle = document.getElementById('hero-event-name');
            const heroLink = document.getElementById('hero-event-link');
            
            const now = new Date();
            const startTime = new Date(nextEvent.startDate);
            const isLive = startTime <= now;
            
            if (heroSubtitle) {
                heroSubtitle.textContent = isLive ? `LIVE NOW: ${nextEvent.name}` : `Next Major Race: ${nextEvent.name}`;
                if (isLive) heroSubtitle.style.color = '#ff0055'; 
            }
            
            if (heroTitle) {
                heroTitle.textContent = nextEvent.name.toUpperCase();
            }
            
            if (heroLink) {
                heroLink.href = staticIds.includes(nextEvent.id) ? `${prefix}events/${nextEvent.id}.html` : `${prefix}events.html?id=${nextEvent.id}`;
            }
            
            updateCountdown(nextEvent.startDate);

            // B. Populate Carousel Track (shared)
            if (upcomingTrack) {
                upcomingTrack.innerHTML = '';
                const colors = ['blue', 'pink', 'green'];
                events.slice(0, 10).forEach((e, i) => {
                    const tile = document.createElement('a');
                    
                    // Priority: If it's a known static page ID, link to it. 
                    // Otherwise, link to events.html with a query param.
                    const linkUrl = staticIds.includes(e.id) ? `${prefix}events/${e.id}.html` : `${prefix}events.html?id=${e.id}`;
                    
                    tile.href = linkUrl;
                    tile.className = `race-tile tile-${colors[i % 3]}`;
                    
                    const bannerUrl = eventBanners[e.id];
                    
                    tile.innerHTML = `
                        ${bannerUrl ? `<div class="tile-banner" style="background-image: url('${bannerUrl}')"></div>` : ''}
                        <h3>${e.name.toUpperCase()}</h3>
                        <div class="race-meta">${e.date}</div>
                    `;
                    upcomingTrack.appendChild(tile);
                });
            }

            // C. Populate Full List (if on events.html)
            if (fullEventList) {
                fullEventList.innerHTML = '';
                const eventColors = ['var(--primary)', 'var(--secondary)', '#00ff88'];
                events.forEach((e, i) => {
                    const card = document.createElement('div');
                    card.id = `event-${e.id}`; // Add ID for scrolling
                    card.className = 'glass event-horizontal-card reveal active';
                    card.style.borderLeft = `4px solid ${eventColors[i % 3]}`;
                    
                    const linkUrl = staticIds.includes(e.id) ? `events/${e.id}.html` : `events.html?id=${e.id}`;
                    const bannerUrl = eventBanners[e.id];

                    card.innerHTML = `
                        ${bannerUrl ? `<div class="event-card-banner" style="background-image: url('${bannerUrl}')"></div>` : ''}
                        <div class="event-info">
                            <h3>${e.name}</h3>
                            <p class="event-meta">${e.date}</p>
                            <p class="event-desc">${e.classes ? 'Classes: ' + e.classes.join(', ') : 'Details coming soon.'}</p>
                        </div>
                        <div class="event-action">
                            <a href="${linkUrl}" class="btn btn-outline">Details</a>
                        </div>
                    `;
                    fullEventList.appendChild(card);
                });

                // Handle Deep Linking (Scroll to event if ID in URL)
                const urlParams = new URLSearchParams(window.location.search);
                const eventId = urlParams.get('id');
                if (eventId) {
                    setTimeout(() => {
                        const target = document.getElementById(`event-${eventId}`);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            target.style.boxShadow = '0 0 30px rgba(0,207,255,0.3)';
                            target.style.borderColor = 'var(--primary)';
                        }
                    }, 500);
                }
            }
        }
    } catch (error) {
        console.error("Error loading events:", error);
        if (upcomingTrack) upcomingTrack.innerHTML = '<p style="color: #ff0055;">Failed to load schedule.</p>';
        const heroTitle = document.getElementById('hero-event-name');
        if (heroTitle) heroTitle.textContent = "SYNC ERROR";
    }

    // 2. Load Recent Results (Race Cards)
    const resultsTrack = document.getElementById('results-track');
    if (resultsTrack) {
        try {
            const snap = await db.collection("race_results")
                .orderBy("timestamp", "desc")
                .limit(6)
                .get();

            if (snap.empty) {
                resultsTrack.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">No recent results to show.</p>';
            } else {
                resultsTrack.innerHTML = '';
                snap.forEach(doc => {
                    const d = doc.data();
                    const card = document.createElement('div');
                    card.className = 'card cinematic-poster reveal active';
                    card.style.padding = '0';
                    card.style.overflow = 'hidden';
                    card.style.position = 'relative';
                    card.style.background = '#000';
                    card.style.aspectRatio = '16/9';
                    card.style.borderRadius = '12px';
                    card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                    card.style.cursor = 'pointer';
                    card.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

                    card.onclick = () => openCardModal(d);

                    const bgImg = d.teamAsset || d.rawUrl;
                    const fgImg = d.rawUrl && d.teamAsset && d.rawUrl !== d.teamAsset ? d.rawUrl : null;

                    card.innerHTML = `
                        <!-- Layer 1: Team Branded Background -->
                        <img src="${bgImg}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.5; transition: transform 0.8s;">
                        
                        <!-- Layer 2: User Photo Overlay -->
                        ${fgImg ? `<img src="${fgImg}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 15px rgba(0,0,0,0.8)); z-index: 1;">` : ''}

                        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 40%, rgba(0,0,0,0.3) 100%); z-index: 2;"></div>
                        
                        <!-- Top Left: Event Type/Track -->
                        <div style="position: absolute; top: 1rem; left: 1rem; text-align: left;">
                            <div style="font-size: 0.6rem; color: var(--primary); font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">SPECIAL EVENTS</div>
                            <div style="font-size: 1.2rem; font-weight: 900; color: white; line-height: 1; margin-top: 0.2rem;">${(d.trackName || d.eventName).toUpperCase()}</div>
                        </div>

                        <!-- Top Right: Car & Position -->
                        <div style="position: absolute; top: 1rem; right: 1rem; text-align: right;">
                            <div style="font-size: 0.65rem; color: white; font-weight: 700; opacity: 0.9;">Car: ${d.carUsed || 'TBD'}</div>
                            <div style="font-size: 0.7rem; color: white; margin-top: 0.2rem;">Start: ${d.startPos || '?'}</div>
                            <div style="font-size: 1rem; color: white; font-weight: 900; margin-top: 0.1rem;">Finish: ${d.position}</div>
                        </div>

                        <!-- Bottom: Drivers and Team Logo -->
                        <div style="position: absolute; bottom: 1.25rem; left: 0; width: 100%; padding: 0 1.25rem; display: flex; justify-content: space-between; align-items: flex-end;">
                            <div style="text-align: left;">
                                <div style="font-size: 0.65rem; color: rgba(255,255,255,0.7); margin-bottom: 0.3rem;">${d.raceDate || ''}</div>
                                <div style="font-size: 0.75rem; font-weight: 800; color: white; letter-spacing: 1px;">${d.drivers.join(' - ').toUpperCase()}</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.05); padding: 0.4rem; border-radius: 4px;">
                                <img src="assets/Grid Up Sim Endurance.png" style="height: 24px; object-fit: contain;" onerror="this.style.display='none'">
                            </div>
                        </div>

                        <!-- Interaction Overlay -->
                        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,207,255,0.1); opacity: 0; transition: opacity 0.3s;" class="hover-overlay">
                             <div style="padding: 0.75rem 1.5rem; border: 2px solid var(--primary); color: var(--primary); font-weight: 800; font-size: 0.8rem; letter-spacing: 2px; border-radius: 4px;">EXPAND</div>
                        </div>
                    `;

                    card.onmouseenter = () => {
                        card.style.transform = 'scale(1.05) translateY(-5px)';
                        card.querySelector('img').style.transform = 'scale(1.1)';
                        card.querySelector('.hover-overlay').style.opacity = '1';
                    };
                    card.onmouseleave = () => {
                        card.style.transform = 'scale(1) translateY(0)';
                        card.querySelector('img').style.transform = 'scale(1)';
                        card.querySelector('.hover-overlay').style.opacity = '0';
                    };
                    resultsTrack.appendChild(card);
                });
            }
        } catch (error) {
            console.error("Error loading results:", error);
            resultsTrack.innerHTML = '<p style="color: #ff0055; grid-column: 1/-1;">Failed to load results.</p>';
        }
    }
}


// --- GLOBAL CINEMATIC POSTER ENGINE ---
let ACTIVE_CARD_DATA = null;

function openCardModal(data) {
    ACTIVE_CARD_DATA = data;
    const modal = document.getElementById('card-modal');
    const container = document.getElementById('modal-container');
    if (!modal || !container) return;

    const bgImg = data.teamAsset || data.rawUrl;
    const fgImg = data.rawUrl && data.teamAsset && data.rawUrl !== data.teamAsset ? data.rawUrl : null;

    // Render high-fidelity version for the modal
    container.innerHTML = `
        <div class="card cinematic-poster" style="padding: 0; overflow: hidden; position: relative; background: #000; width: 100%; height: 100%; border-radius: 20px; box-shadow: 0 40px 80px rgba(0,0,0,0.9);">
            <!-- Layer 1: Background -->
            <img src="${bgImg}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.5;">
            
            <!-- Layer 2: Foreground Overlay -->
            ${fgImg ? `<img src="${fgImg}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 30px rgba(0,0,0,0.9)); z-index: 1;">` : ''}

            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 40%, rgba(0,0,0,0.3) 100%); z-index: 2;"></div>
            
            <div style="position: absolute; top: 3rem; left: 4rem; text-align: left;">
                <div style="font-size: 1.25rem; color: var(--primary); font-weight: 900; letter-spacing: 6px; text-transform: uppercase;">SPECIAL EVENTS</div>
                <div style="font-size: 4rem; font-weight: 900; color: white; line-height: 1; margin-top: 0.75rem; letter-spacing: -1px;">${(data.trackName || data.eventName).toUpperCase()}</div>
            </div>

            <div style="position: absolute; top: 3rem; right: 4rem; text-align: right;">
                <div style="font-size: 1.5rem; color: white; font-weight: 700; opacity: 0.9;">Car: ${data.carUsed || 'TBD'}</div>
                <div style="font-size: 1.75rem; color: white; margin-top: 0.5rem; font-weight: 400;">Start: ${data.startPos || '?'}</div>
                <div style="font-size: 3rem; color: white; font-weight: 900; margin-top: 0.25rem; text-shadow: 0 0 30px rgba(255,255,255,0.2);">Finish: ${data.position}</div>
            </div>

            <div style="position: absolute; bottom: 4rem; left: 0; width: 100%; padding: 0 4rem; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="text-align: left;">
                    <div style="font-size: 1.25rem; color: rgba(255,255,255,0.7); margin-bottom: 0.75rem; font-weight: 500;">${data.raceDate || ''}</div>
                    <div style="font-size: 2rem; font-weight: 800; color: white; letter-spacing: 2px;">${data.drivers.join(' - ').toUpperCase()}</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; backdrop-filter: blur(5px);">
                    <img src="assets/Grid Up Sim Endurance.png" style="height: 80px; object-fit: contain;">
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    setTimeout(() => { container.style.transform = 'scale(1)'; }, 10);
    document.body.style.overflow = 'hidden';
}

function closeCardModal() {
    const container = document.getElementById('modal-container');
    if (container) container.style.transform = 'scale(0.9)';
    setTimeout(() => {
        const modal = document.getElementById('card-modal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

async function downloadActiveCard() {
    if (!ACTIVE_CARD_DATA) return;
    const d = ACTIVE_CARD_DATA;
    const canvas = document.getElementById('export-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set 4K-ish high resolution for maximum quality
    canvas.width = 1920; 
    canvas.height = 1080;
    
    const btn = document.querySelector('#card-modal .btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = "PREPARING...";
    btn.disabled = true;

    try {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.src = d.teamAsset || d.rawUrl;
        
        await new Promise((resolve, reject) => {
            bgImg.onload = resolve;
            bgImg.onerror = () => reject(new Error("BG Load fail"));
        });

        let fgImg = null;
        if (d.rawUrl && d.teamAsset && d.rawUrl !== d.teamAsset) {
            fgImg = new Image();
            fgImg.crossOrigin = "anonymous";
            fgImg.src = d.rawUrl;
            await new Promise((resolve, reject) => {
                fgImg.onload = resolve;
                fgImg.onerror = () => reject(new Error("FG Load fail"));
            });
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw Background
        ctx.globalAlpha = 0.5; 
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;

        // Draw Foreground if exists
        if (fgImg) {
            // Shadow
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 40;
            
            // Calculate contain aspect ratio for FG
            const imgAspect = fgImg.width / fgImg.height;
            const canvasAspect = canvas.width / canvas.height;
            let drawW, drawH, drawX, drawY;

            if (imgAspect > canvasAspect) {
                drawW = canvas.width;
                drawH = canvas.width / imgAspect;
            } else {
                drawH = canvas.height;
                drawW = canvas.height * imgAspect;
            }
            drawX = (canvas.width - drawW) / 2;
            drawY = (canvas.height - drawH) / 2;

            ctx.drawImage(fgImg, drawX, drawY, drawW, drawH);
            ctx.shadowBlur = 0; // Reset shadow
        }

        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.4);
        grad.addColorStop(0, 'rgba(0,0,0,0.95)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

        const topGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.3);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
        topGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3);

        ctx.textBaseline = 'top';
        ctx.font = '900 30px Montserrat, Arial, sans-serif';
        ctx.fillStyle = '#00cfff';
        ctx.fillText('SPECIAL EVENTS', 80, 80);
        
        ctx.font = '900 100px Montserrat, Arial, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText((d.trackName || d.eventName).toUpperCase(), 80, 130);

        ctx.textAlign = 'right';
        ctx.font = '700 45px Montserrat, Arial, sans-serif';
        ctx.fillText(`Car: ${d.carUsed || 'TBD'}`, canvas.width - 80, 80);
        ctx.font = '400 50px Montserrat, Arial, sans-serif';
        ctx.fillText(`Start: ${d.startPos || '?'}`, canvas.width - 80, 150);
        ctx.font = '900 80px Montserrat, Arial, sans-serif';
        ctx.fillText(`Finish: ${d.position}`, canvas.width - 80, 220);

        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '500 40px Montserrat, Arial, sans-serif';
        ctx.fillText(d.raceDate || '', 80, canvas.height - 220);
        ctx.fillStyle = '#fff';
        ctx.font = '900 60px Montserrat, Arial, sans-serif';
        ctx.fillText(d.drivers.join(' - ').toUpperCase(), 80, canvas.height - 150);

        const logo = new Image();
        logo.src = 'assets/Grid Up Sim Endurance.png';
        await new Promise(r => logo.onload = r);
        const logoH = 150;
        const logoW = (logo.width / logo.height) * logoH;
        ctx.drawImage(logo, canvas.width - 80 - logoW, canvas.height - 200, logoW, logoH);

        const link = document.createElement('a');
        link.download = `GridUp_${d.trackName || 'Poster'}_${d.position}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
    } catch (err) {
        console.error(err);
        alert("DOWNLOAD NOTICE: Use a direct link (Imgur/Discord) for the car photo to enable HD downloads. Protected website links may block this feature due to browser security (CORS).");
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}
// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
    
    // Poll for Firestore 'db' initialization from auth.js
    const dbCheckInterval = setInterval(() => {
        if (typeof db !== 'undefined') {
            loadDynamicContent();
            checkLiveStreams(); // Watch Live feature
            clearInterval(dbCheckInterval);
        }
    }, 100);
    
    // Safety timeout to avoid infinite polling if Firestore fails
    setTimeout(() => clearInterval(dbCheckInterval), 5000);
});

// =============================================
// WATCH LIVE — Live Stream Feature
// =============================================

let activeStreams = [];

async function checkLiveStreams() {
    try {
        const snapshot = await db.collection('streams').where('isLive', '==', true).get();
        activeStreams = [];
        snapshot.forEach(doc => activeStreams.push({ id: doc.id, ...doc.data() }));

        const btn = document.getElementById('watch-live-btn');
        if (!btn) return;

        if (activeStreams.length === 0) {
            btn.style.display = 'none';
        } else if (activeStreams.length === 1) {
            btn.style.display = 'inline-flex';
            btn.style.alignItems = 'center';
            btn.onclick = () => openCinematicStream(activeStreams[0].streamUrl);
        } else {
            btn.style.display = 'inline-flex';
            btn.style.alignItems = 'center';
            btn.onclick = openStreamsModal;
        }
    } catch (e) {
        console.warn('Watch Live: Could not fetch streams.', e);
    }
    
    // Re-check every 60 seconds for real-time updates
    setTimeout(checkLiveStreams, 60000);
}

function getEmbedUrl(url) {
    if (!url) return null;
    let embedUrl = url;
    
    try {
        if (url.includes('twitch.tv')) {
            const channel = url.split('twitch.tv/')[1].split('/')[0].split('?')[0];
            const parentDomain = window.location.hostname || 'eubizare.github.io';
            embedUrl = `https://player.twitch.tv/?channel=${channel}&parent=${parentDomain}`;
        } else if (url.includes('youtube.com/watch')) {
            const videoId = new URL(url).searchParams.get('v');
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
    } catch (e) {
        console.warn("Could not parse embed URL for:", url);
    }
    
    return embedUrl;
}

function openCinematicStream(sourceUrl) {
    const modal = document.getElementById('stream-player-modal');
    const iframe = document.getElementById('stream-iframe');
    
    // Auto-close picker if it's open
    closeStreamsModal();
    
    if (modal && iframe) {
        iframe.src = getEmbedUrl(sourceUrl);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        // Fallback for pages without the modal (like events.html)
        window.open(sourceUrl, '_blank');
    }
}

function closeStreamPlayer() {
    const modal = document.getElementById('stream-player-modal');
    const iframe = document.getElementById('stream-iframe');
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = ''; // Stop audio playing in background
    document.body.style.overflow = '';
}

function openStreamsModal() {
    const modal = document.getElementById('streams-modal');
    const list = document.getElementById('streams-list');
    if (!modal || !list) return;

    list.innerHTML = activeStreams.map(stream => `
        <button onclick="openCinematicStream('${stream.streamUrl}')"
           style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 1.5rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,0,0,0.2); border-radius: 10px; color: #fff; transition: all 0.2s; gap: 1rem; width: 100%; text-align: left;"
           onmouseover="this.style.background='rgba(255,0,0,0.1)'; this.style.borderColor='rgba(255,0,0,0.5)'"
           onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='rgba(255,0,0,0.2)'">
            <div>
                <p style="font-weight: 700; font-size: 1rem; margin-bottom: 0.2rem;">${stream.teamName}</p>
                <p style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;">${stream.streamUrl}</p>
            </div>
            <span style="background: #cc0000; color: #fff; font-size: 0.65rem; font-weight: 800; letter-spacing: 2px; padding: 0.3rem 0.7rem; border-radius: 4px; white-space: nowrap;">WATCH →</span>
        </button>
    `).join('');

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeStreamsModal() {
    const modal = document.getElementById('streams-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}
