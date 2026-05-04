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
        pastSection.style.display = isHidden ? 'block' : 'none';
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
        let isPaused = false;

        // Mouse Drag Support
        track.addEventListener('mousedown', (e) => {
            isDown = true;
            isPaused = true;
            track.style.cursor = 'grabbing';
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        track.addEventListener('mouseleave', () => {
            isDown = false;
            isPaused = false;
            track.style.cursor = 'grab';
        });

        track.addEventListener('mouseenter', () => {
            isPaused = true;
        });

        track.addEventListener('mouseup', () => {
            isDown = false;
            isPaused = false;
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
                isPaused = true;
                setTimeout(() => { if (!track.matches(':hover')) isPaused = false; }, 5000);
            });
            
            nextBtn.addEventListener('click', () => {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                isPaused = true;
                setTimeout(() => { if (!track.matches(':hover')) isPaused = false; }, 5000);
            });
        }

        // Auto Scroll Feature
        setInterval(() => {
            if (!isPaused && !isDown) {
                const firstCard = track.firstElementChild;
                if (!firstCard) return;
                
                const cardWidth = firstCard.offsetWidth + 24; // width + gap (1.5rem = 24px)
                const isAtEnd = container.scrollLeft + container.offsetWidth >= container.scrollWidth - 20;
                
                if (isAtEnd) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            }
        }, 4000); // Scroll every 4 seconds
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
    const staticIds = [
        // Upcoming events with static pages
        'imsa-classic-500', 'indy-500', 'world-600',
        'thruxton-4h', 'watkins-glen-6h', 'spa-24hr', 'firecracker-400',
        'road-america-6h', 'brickyard-400', 'suzuka-1000km', 'petit-le-mans',
        'bathurst-1000', 'indy-8h', 'knoxville-nationals', 'portimao-1000',
        'crandon-championship', 'southern-500', 'britcar-24hr', 'ff1600-festival',
        'homestead-championship', 'sfl-mountain-showdown', 'scca-runoffs',
        '992-endurance-cup', 'winter-derby', 'chili-bowl', 'production-car-challenge',
        // Completed events with static pages
        'iracing-roar', 'daytona-24', 'daytona-500', 'bathurst-12', 'sebring-12hr', 'nurburgring-24h'
    ];
    
    // Official Special Event Banners (sourced from iracing.com/special-events/)
    const BASE = 'https://s100.iracing.com/wp-content/uploads';
    const eventBanners = {
        // Completed Events
        'iracing-roar':         `${BASE}/2025/12/iRSE-2026-ROAR-960x576.png`,
        'daytona-24':           `${BASE}/2025/12/iRSE-2026-Daytona-24-VCO-960x576.png`,
        'daytona-500':          `${BASE}/2025/12/iRSE-2026-Daytona-500.png`,
        'bathurst-12':          `${BASE}/2025/12/iRSE-2026-Bathurst-12.png`,
        'sebring-12hr':         `${BASE}/2025/12/iRSE-2026-Sebring-12-VCO.png`,
        'nurburgring-24h':      `${BASE}/2025/12/iRSE-2026-Nurburgring-24H.png`,
        // Upcoming Events
        'imsa-classic-500':     `${BASE}/2026/03/iRSE-2026-IMSA-Classic-500.png`,
        'indy-500':             `${BASE}/2025/12/iRSE-2026-Indy-500.png`,
        'world-600':            `${BASE}/2025/12/iRSE-2026-World-600.png`,
        'thruxton-4h':          `${BASE}/2025/12/iRSE-2026-4-Hours-at-Thruxton.png`,
        'watkins-glen-6h':      `${BASE}/2025/12/iRSE-2026-Watkis-Glen-6H-VCO.png`,
        'spa-24hr':             `${BASE}/2025/12/iRSE-2026-SPA-24HR.png`,
        'brickyard-400':        'https://s100.iracing.com/wp-content/uploads/2025/04/iRSE-2025-Brickyard-400-v2.png',
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
        'scca-runoffs':         `${BASE}/2024/12/iRSE-2025-Scca-Runoffs.png`,
        '992-endurance-cup':    `${BASE}/2026/04/iRSE-2026-Creventic-992-Endurance-Cup.png`,
        'winter-derby':         `${BASE}/2025/12/iRSE-2026-Winter-Derby.png`,
        'chili-bowl':           `${BASE}/2025/12/iRSE-2026-Chili-Bowl.png`,
        'production-car-challenge': `${BASE}/2025/12/iRSE-2026-Production-Car-Challenge.png`,
    };
    
    console.log("Auth: Querying events with filterTimestamp:", filterTimestamp);
    try {
        const snap = await db.collection("events")
            .where("startDate", ">=", "2026-01-01")
            .orderBy("startDate", "asc")
            .get();
        console.log("Auth: Firestore returned snapshot, size:", snap.size);

        if (snap.empty) {
            console.log("Auth: No events found.");
            if (upcomingTrack) upcomingTrack.innerHTML = '<p style="text-align: center; color: var(--text-muted); width: 100%;">No upcoming events scheduled.</p>';
            if (fullEventList) fullEventList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Stay tuned for future event dates.</p>';
        } else {
            const allEvents = [];
            snap.forEach(doc => allEvents.push({ id: doc.id, ...doc.data() }));

            const now = new Date();
            const lookbackDate = new Date();
            lookbackDate.setHours(lookbackDate.getHours() - 24);

            // Helper to parse dates from Firestore (handles strings and Timestamps)
            const parseDate = (d) => {
                if (!d) return null;
                if (typeof d.toDate === 'function') return d.toDate();
                if (d.seconds) return new Date(d.seconds * 1000);
                return new Date(d);
            };

            // Filter events
            const upcomingEvents = allEvents.filter(e => {
                const start = parseDate(e.startDate);
                const end = parseDate(e.endDate || e.startDate);
                if (!start) return false;

                const eventEnd = new Date(end);
                eventEnd.setHours(23, 59, 59, 999);
                
                // FINAL SAFETY CHECK: Explicitly exclude passed Nurburgring event
                if (e.id === 'nurburgring-24h' || e.id === 'nurburgring-24') {
                    if (now > new Date('2026-05-03T23:59:59')) return false;
                }

                return eventEnd >= now;
            });

            const pastEvents = allEvents.filter(e => {
                const end = parseDate(e.endDate || e.startDate);
                if (!end) return true;

                const eventEnd = new Date(end);
                eventEnd.setHours(23, 59, 59, 999);
                
                // Consistency check for Nurburgring (matches the safety check in upcomingEvents)
                if (e.id === 'nurburgring-24h' || e.id === 'nurburgring-24') {
                    if (now > new Date('2026-05-03T23:59:59')) return true;
                }

                return eventEnd < now;
            }); // Oldest first

            // A. Update Upcoming UI
            if (upcomingEvents.length === 0) {
                if (upcomingTrack) upcomingTrack.innerHTML = '<p style="text-align: center; color: var(--text-muted); width: 100%;">No upcoming events scheduled.</p>';
                if (fullEventList) fullEventList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Stay tuned for future event dates.</p>';
                
                // Clear hero if no upcoming
                const heroSubtitle = document.getElementById('hero-event-subtitle');
                const heroTitle = document.getElementById('hero-event-name');
                if (heroSubtitle) heroSubtitle.textContent = 'Next Major Race: TBA';
                if (heroTitle) heroTitle.textContent = 'GRiD UP';
            } else {
                const nextEvent = upcomingEvents[0];
                const heroSubtitle = document.getElementById('hero-event-subtitle');
                const heroTitle = document.getElementById('hero-event-name');
                const heroLink = document.getElementById('hero-event-link');
                
                const startTime = parseDate(nextEvent.startDate);
                const endTime = parseDate(nextEvent.endDate || nextEvent.startDate);
                endTime.setHours(23, 59, 59, 999);
                
                // Is live if now is between start and end of the scheduled dates
                const isLive = now >= startTime && now <= endTime;
                
                if (heroSubtitle) {
                    heroSubtitle.textContent = isLive ? `LIVE NOW: ${nextEvent.name}` : `Next Major Race: ${nextEvent.name}`;
                    heroSubtitle.style.color = isLive ? '#ff0055' : 'var(--primary)';
                    if (isLive) heroSubtitle.classList.add('animate-pulse');
                }
                
                if (heroTitle) {
                    heroTitle.textContent = nextEvent.name.toUpperCase();
                }
                
                if (heroLink) {
                    heroLink.href = staticIds.includes(nextEvent.id) ? getEventLink(nextEvent.id, true) : getEventLink(nextEvent.id);
                }
                
                updateCountdown(nextEvent.startDate);

                // B. Populate Carousel Track (shared)
                if (upcomingTrack) {
                    upcomingTrack.innerHTML = '';
                    const colors = ['blue', 'pink', 'green'];
                    upcomingEvents.slice(0, 10).forEach((e, i) => {
                        const tile = document.createElement('a');
                        const linkUrl = staticIds.includes(e.id) ? getEventLink(e.id, true) : getEventLink(e.id);
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
                    upcomingEvents.forEach((e, i) => {
                        const card = document.createElement('div');
                        card.id = `event-${e.id}`;
                        card.className = 'glass event-horizontal-card reveal active';
                        card.style.borderLeft = `4px solid ${eventColors[i % 3]}`;
                        const linkUrl = staticIds.includes(e.id) ? getEventLink(e.id, true) : getEventLink(e.id);
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

                    // Handle Deep Linking & Results
                    const urlParams = new URLSearchParams(window.location.search);
                    const eventId = urlParams.get('id');
                    if (eventId) {
                        setTimeout(() => {
                            const target = document.getElementById(`event-${eventId}`);
                            if (target) {
                                // If inside past section, expand it
                                const pastSection = document.getElementById('pastEventsSection');
                                const toggleBtn = document.getElementById('togglePastEvents');
                                if (pastSection && pastSection.contains(target) && pastSection.style.display === 'none') {
                                    pastSection.style.display = 'block';
                                    if (toggleBtn) toggleBtn.textContent = 'Hide Past Events';
                                }

                                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                target.style.boxShadow = '0 0 30px rgba(0,207,255,0.3)';
                                target.style.borderColor = 'var(--primary)';
                                
                                // Load Results for this event
                                renderEventResults(eventId, target);
                            }
                        }, 500);
                    }
                }
            }

            // D. Populate Past List
            const pastList = document.getElementById('dynamic-past-list');
            if (pastList) {
                const hardcodedIds = ['iracing-roar', 'daytona-24', 'daytona-500', 'bathurst-12', 'sebring-12hr', 'nurburgring-24h', 'imsa-classic-500'];
                const eventColors = ['var(--primary)', 'var(--secondary)', '#00ff88'];
                pastList.innerHTML = '';
                pastEvents.forEach((e, i) => {
                    if (hardcodedIds.includes(e.id)) return;
                    const card = document.createElement('div');
                    card.id = `event-${e.id}`;
                    card.className = 'glass event-horizontal-card reveal active';
                    card.style.borderLeft = `4px solid ${eventColors[(i + hardcodedIds.length) % 3]}`;
                    const linkUrl = staticIds.includes(e.id) ? getEventLink(e.id, true) : getEventLink(e.id);
                    const bannerUrl = eventBanners[e.id];
                    card.innerHTML = `
                        ${bannerUrl ? `<div class="event-card-banner" style="background-image: url('${bannerUrl}')"></div>` : ''}
                        <div class="event-info">
                            <h3>${e.name}</h3>
                            <p class="event-meta">${e.date}</p>
                            <p class="event-desc">${e.classes ? 'Classes: ' + e.classes.join(', ') : 'Race event completed.'}</p>
                        </div>
                        <div class="event-action">
                            <a href="${linkUrl}" class="btn btn-outline">Details</a>
                        </div>
                    `;
                    pastList.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error("Error loading events:", error);
        if (upcomingTrack) upcomingTrack.innerHTML = '<p style="color: #ff0055;">Failed to load schedule.</p>';
    }
}

// --- URL CLEANING (Pretty Links) ---
function beautifyCurrentURL() {
    let path = window.location.pathname;
    if (path.endsWith('.html')) {
        let newPath = path.replace('.html', '');
        // Keep search/hash if they exist
        let cleanURL = newPath + window.location.search + window.location.hash;
        window.history.replaceState(null, '', cleanURL);
    }
}
window.addEventListener('DOMContentLoaded', beautifyCurrentURL);

// Helper for clean event links
function getEventLink(id, isStatic = false) {
    if (isStatic) return `events/${id}.html`;
    return `events/details.html#${id}`;
}

// Hidden Download Handler for Team App
function downloadTeamApp() {
    const link = document.createElement('a');
    link.href = 'https://github.com/euBiZaRe/GRiD-UP-Center/releases/download/v1.5.7/GRiD-UP.exe';
    link.download = 'GRiD-UP.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

    // Auto-detect Event Detail Pages and load results
    function initAutoResults() {
        if (document.body.classList.contains('event-detail-page')) {
            if (typeof db === 'undefined') {
                setTimeout(initAutoResults, 500);
                return;
            }

            let pageName = window.location.pathname.split('/').pop().replace('.html', '');
            
            // Handle dynamic details page
            if (pageName === 'details' || pageName === 'events') {
                const params = new URLSearchParams(window.location.search);
                const urlId = params.get('id');
                if (urlId) pageName = urlId;
            }

            const targets = ['.event-main', '.event-details', '.section', 'main'];
            let mainSection = null;
            for (const t of targets) {
                mainSection = document.querySelector(t);
                if (mainSection) break;
            }

            // Don't auto-load for generic names that aren't real event IDs
            const genericNames = ['details', 'events', 'index', 'admin', 'roster'];
            if (pageName && !genericNames.includes(pageName) && mainSection) {
                console.log("Event Page Detected:", pageName, "Loading result data...");
                const anchor = document.getElementById('results-anchor') || 
                               document.getElementById('event-results-anchor') || 
                               mainSection.querySelector('.event-section:last-of-type') || 
                               mainSection.lastElementChild;
                renderEventResults(pageName, anchor);
            }
        }
    }
    
    // Start auto-detection
    initAutoResults();

async function renderEventResults(eventId, targetElement) {
    if (!targetElement) return;
    
    // Prevent duplicate rendering
    if (targetElement.dataset.loadedResults === eventId) return;
    targetElement.dataset.loadedResults = eventId;
    try {
        // Try exact match first
        let snap = await db.collection("event_results")
            .where("eventId", "in", [eventId, eventId.toLowerCase(), eventId.toUpperCase(), eventId.replace(/-/g, ' ')])
            .get();
        
        // Deep Fallback: Search the 'events' collection for a name match to find the actual Firestore ID
        if (snap.empty) {
            // Priority: Try card name first, then page title, then header
            const eventName = targetElement.closest('.event-horizontal-card')?.querySelector('h3')?.textContent.trim() || 
                              document.getElementById('event-title')?.textContent.trim();
            const pageTitle = document.querySelector('h1')?.textContent.trim();
            const searchName = (eventName && !["Upcoming Races", "Loading Event..."].includes(eventName)) ? eventName : pageTitle;

            if (searchName && !["Upcoming Races", "Loading Event..."].includes(searchName)) {
                console.log(`Trying deep fallback for name: ${searchName}`);
                // Try exact and partial matches
                const eventSearch = await db.collection("events").where("name", ">=", searchName).where("name", "<=", searchName + '\uf8ff').get();
                if (!eventSearch.empty) {
                    const actualId = eventSearch.docs[0].id;
                    console.log(`Deep Fallback: Found actual event ID ${actualId} for name "${searchName}"`);
                    snap = await db.collection("event_results")
                        .where("eventId", "==", actualId)
                        .get();
                }
            }
        }

        if (snap.empty) {
            console.log(`No results found for event keyword: ${eventId}`);
            
            // Remove any existing results/pending messages
            const existing = targetElement.parentNode.querySelectorAll('.event-results-container, .results-pending-placeholder');
            existing.forEach(el => el.remove());

            // NEW: Feedback for empty results
            const noResults = document.createElement('section');
            noResults.className = 'glass card reveal active results-pending-placeholder';
            noResults.style.marginTop = '2rem';
            noResults.style.padding = '2rem';
            noResults.style.textAlign = 'center';
            noResults.innerHTML = `
                <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Race Results Pending</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Official team results for this event haven't been recorded yet. Check back soon!</p>
            `;
            targetElement.after(noResults);
            return;
        }

        // Sort manually by timestamp if available, otherwise preserve order
        const docs = [];
        snap.forEach(doc => docs.push(doc.data()));
        docs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

        console.log(`Rendering ${docs.length} results for ${eventId}`);
        const resultsContainer = document.createElement('section');
        resultsContainer.className = 'glass card reveal active event-results-container';
        resultsContainer.style.marginTop = '2rem';
        
        // Remove any existing "Pending" messages or previous results
        const existing = targetElement.parentNode.querySelectorAll('.event-results-container, .results-pending-placeholder');
        existing.forEach(el => el.remove());
        
        let rowsHtml = '';
        docs.forEach(d => {
            const drivers = Array.isArray(d.drivers) ? d.drivers.join(', ') : d.drivers;
            
            rowsHtml += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 1rem;">
                        <strong style="color: var(--text);">${d.teamName}</strong><br>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${d.car}</span><br>
                        <span style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.6;">${drivers}</span>
                    </td>
                    <td style="padding: 1rem;">
                        <span style="color: var(--text-muted);">${d.qualy || '-'}</span>
                    </td>
                    <td style="padding: 1rem;">
                        <strong style="color: var(--primary); font-weight: 900; font-size: 1.1rem;">${d.finish || '-'}</strong>
                    </td>
                </tr>
            `;
        });

        resultsContainer.innerHTML = `
            <h2 style="color: var(--secondary); margin-bottom: 1.5rem;">Team Results</h2>
            <div class="results-table-container" style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; color: var(--text-muted); font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--glass-border); text-align: left;">
                            <th style="padding: 1rem;">Team / Car</th>
                            <th style="padding: 1rem;">Qualy</th>
                            <th style="padding: 1rem;">Finish</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;

        targetElement.after(resultsContainer);
        
    } catch (e) {
        console.error("Error rendering results:", e);
    }
}

// 2. Load Recent Results (Race Cards)
async function loadRecentResults() {
    const resultsTrack = document.getElementById('results-track');
    if (resultsTrack) {
        try {
            const snap = await db.collection("race_results")
                .orderBy("timestamp", "desc")
                .limit(10) // Increased limit for carousel
                .get();

            if (snap.empty) {
                resultsTrack.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">No recent results to show.</p>';
            } else {
                resultsTrack.innerHTML = '';
                snap.forEach(doc => {
                    const d = doc.data();
                    const card = document.createElement('div');
                    card.className = 'card cinematic-poster reveal active';
                    card.style.cursor = 'pointer';
                    card.onclick = () => openCardModal(d);

                    // Detect dedicated poster (rawUrl same as teamAsset = clean poster display)
                    const isPoster = d.rawUrl && d.teamAsset && d.rawUrl === d.teamAsset;
                    const bgImg = d.teamAsset || d.rawUrl || "assets/poster-placeholder.png";
                    const fgImg = !isPoster && d.rawUrl && d.teamAsset && d.rawUrl !== d.teamAsset ? d.rawUrl : null;

                    if (isPoster) {
                        // Clean full-bleed poster — no text overlays
                        card.innerHTML = `
                            <img src="${bgImg}" style="width:100%; height:100%; object-fit:cover; border-radius: inherit; display:block;">
                            <!-- Interaction Overlay -->
                            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,207,255,0.08); opacity:0; transition:opacity 0.3s; z-index:6; border-radius:inherit;" class="hover-overlay">
                                <div style="padding:0.75rem 1.5rem; border:2px solid var(--primary); color:var(--primary); font-weight:800; font-size:0.8rem; letter-spacing:2px; border-radius:4px; backdrop-filter:blur(5px);">VIEW POSTER</div>
                            </div>
                        `;
                    } else {
                        card.innerHTML = `
                            <!-- Layers -->
                            <img src="${bgImg}" class="bg-layer">
                            ${fgImg ? `<img src="${fgImg}" class="fg-layer">` : ''}
                            
                            <!-- Watermark Branding (Center Background) -->
                            <img src="assets/logo.png" class="event-branding" onerror="this.style.display='none'">

                            <div class="gradient-overlay"></div>
                            
                            <!-- Top Left Metadata -->
                            <div class="text-overlay" style="top: 1.5rem; left: 1.5rem; text-align: left;">
                                <div style="font-size: 0.6rem; color: var(--primary); font-weight: 900; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 0.2rem;">GRiD UP // SPECIAL EVENT</div>
                                <div style="font-size: 1.6rem; font-weight: 900; line-height: 1.1; letter-spacing: -0.5px;">${(d.trackName || d.eventName || 'RACE EVENT').toUpperCase()}</div>
                                <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.4rem; font-weight: 600;">${d.raceDate || ''}</div>
                            </div>

                            <!-- Top Right Stats -->
                            <div class="text-overlay" style="top: 1.5rem; right: 1.5rem; text-align: right;">
                                <div style="font-size: 0.75rem; font-weight: 800; opacity: 0.9; color: var(--primary);">${d.carUsed || 'GT3'}</div>
                                <div style="font-size: 1.2rem; font-weight: 900; margin-top: 0.2rem;">FINISH: ${d.position}</div>
                            </div>

                            <!-- Bottom Banner -->
                            <div class="text-overlay" style="bottom: 1.5rem; left: 1.5rem; right: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end;">
                                <div style="text-align: left;">
                                    <div style="font-size: 1.1rem; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">${Array.isArray(d.drivers) ? d.drivers.join(' - ') : d.drivers}</div>
                                    <div style="font-size: 0.6rem; color: var(--primary); font-weight: 700; margin-top: 0.2rem; letter-spacing: 2px;">CONFIRMED TEAM ENTRY</div>
                                </div>
                            </div>

                            <!-- Interaction Overlay -->
                            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,207,255,0.1); opacity: 0; transition: opacity 0.3s; z-index: 6;" class="hover-overlay">
                                 <div style="padding: 0.75rem 1.5rem; border: 2px solid var(--primary); color: var(--primary); font-weight: 800; font-size: 0.8rem; letter-spacing: 2px; border-radius: 4px; backdrop-filter: blur(5px);">EXPAND</div>
                            </div>
                        `;
                    }

                    card.onmouseenter = () => {
                        card.style.transform = 'translateY(-5px)';
                        card.querySelector('.hover-overlay').style.opacity = '1';
                    };
                    card.onmouseleave = () => {
                        card.style.transform = 'translateY(0)';
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

    const isPoster = data.rawUrl && data.teamAsset && data.rawUrl === data.teamAsset;
    const bgImg = data.teamAsset || data.rawUrl || "assets/poster-placeholder.png";
    const fgImg = !isPoster && data.rawUrl && data.teamAsset && data.rawUrl !== data.teamAsset ? data.rawUrl : null;

    // Render modal — clean poster or standard race card
    if (isPoster) {
        container.innerHTML = `
            <div style="width:100%; height:100%; border-radius:20px; box-shadow:0 40px 80px rgba(0,0,0,0.9); overflow:hidden; position:relative;">
                <img src="${bgImg}" style="width:100%; height:100%; object-fit:contain; display:block; background:#000;">
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="card cinematic-poster" style="width: 100%; height: 100%; border-radius: 20px; box-shadow: 0 40px 80px rgba(0,0,0,0.9);">
                <!-- Layers -->
                <img src="${bgImg}" class="bg-layer">
                ${fgImg ? `<img src="${fgImg}" class="fg-layer" style="filter: drop-shadow(0 20px 40px rgba(0,0,0,0.9));">` : ''}
                
                <!-- Watermark Branding -->
                <img src="assets/logo.png" class="event-branding" style="opacity: 0.12;" onerror="this.style.display='none'">

                <div class="gradient-overlay"></div>
                
                <!-- Metadata Overlay (Top Left) -->
                <div class="text-overlay" style="top: 3rem; left: 4rem; text-align: left;">
                    <div style="font-size: 1.25rem; color: var(--primary); font-weight: 900; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 0.5rem;">GRiD UP // SPECIAL EVENT</div>
                    <div style="font-size: 4rem; font-weight: 900; line-height: 1.1; letter-spacing: -1.5px;">${(data.trackName || data.eventName || 'RACE EVENT').toUpperCase()}</div>
                    <div style="font-size: 1.5rem; opacity: 0.8; margin-top: 1rem; font-weight: 600; letter-spacing: 2px;">${data.raceDate || ''}</div>
                </div>

                <!-- Stats Overlay (Top Right) -->
                <div class="text-overlay" style="top: 3rem; right: 4rem; text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 800; opacity: 0.9; color: var(--primary); letter-spacing: 1px;">${data.carUsed || 'GT3'}</div>
                    <div style="font-size: 3rem; font-weight: 900; margin-top: 0.5rem; text-shadow: 0 0 30px rgba(0,207,255,0.4);">FINISH: ${data.position}</div>
                    ${data.startPos ? `<div style="font-size: 1.5rem; opacity: 0.8; margin-top: 0.2rem; font-weight: 600;">STARTED: ${data.startPos}</div>` : ''}
                </div>

                <!-- Bottom Entry Details -->
                <div class="text-overlay" style="bottom: 4rem; left: 4rem; right: 4rem; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="text-align: left;">
                        <div style="font-size: 2.5rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">${Array.isArray(data.drivers) ? data.drivers.join(' - ') : data.drivers}</div>
                        <div style="font-size: 1.25rem; color: var(--primary); font-weight: 700; margin-top: 0.5rem; letter-spacing: 4px;">OFFICIAL TEAM ENTRY</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.08); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(12px);">
                        <img src="assets/logo.png" style="height: 60px;" onerror="this.style.display='none'">
                    </div>
                </div>
            </div>
        `;
    }
    
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

/**
 * Helper to load images with CORS support using fetch/blobs to bypass cache issues.
 */
async function loadImageWithCORS(url, timeout = 10000) {
    if (!url) return null;
    
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout loading image: ${url.substring(0, 40)}...`));
        }, timeout);

        const run = async () => {
            try {
                // Add cache-buster to prevent non-CORS cached versions from being used
                const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                
                const response = await fetch(cacheBustedUrl, { mode: 'cors' });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                const img = new Image();
                img.crossOrigin = "anonymous";
                
                img.onload = () => {
                    clearTimeout(timer);
                    URL.revokeObjectURL(blobUrl);
                    resolve(img);
                };
                img.onerror = () => {
                    clearTimeout(timer);
                    URL.revokeObjectURL(blobUrl);
                    reject(new Error("Image creation fail"));
                };
                img.src = blobUrl;
                
                } catch (e) {
                console.warn("Direct CORS fetch failed, trying proxy fallback:", url);
                try {
                    // Try corsproxy.io (faster and more reliable)
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`Proxy error! status: ${response.status}`);
                    
                    const blob = await response.blob();
                    if (blob.size < 100) throw new Error("Invalid image data from proxy");
                    
                    const blobUrl = URL.createObjectURL(blob);
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    
                    img.onload = () => {
                        clearTimeout(timer);
                        URL.revokeObjectURL(blobUrl);
                        resolve(img);
                    };
                    img.onerror = () => {
                        clearTimeout(timer);
                        URL.revokeObjectURL(blobUrl);
                        reject(new Error(`Failed to decode image from proxy: ${url.substring(0, 30)}...`));
                    };
                    img.src = blobUrl;
                    
                } catch (proxyErr) {
                    console.error("Proxy fallback failed:", proxyErr);
                    // Final attempt: regular Image load
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => {
                        clearTimeout(timer);
                        resolve(img);
                    };
                    img.onerror = () => {
                        clearTimeout(timer);
                        reject(new Error(`Image load fail: ${url.substring(0, 50)}...`));
                    };
                    img.src = url;
                }
            }
        };
        
        run();
    });
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
        // 1. Load All Assets with CORS support
        const bgUrl = "assets/poster-placeholder.png"; // Hardcoded override as requested
        const fgUrl = null; // Override to null to prevent export failures from broken external links
        
        const [bgImg, fgImg, logo] = await Promise.all([
            loadImageWithCORS(bgUrl),
            loadImageWithCORS(fgUrl),
            loadImageWithCORS('assets/logo.png')
        ]);

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

        const topGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
        topGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);

        // Watermark Logo
        if (logo && logo.complete) {
            ctx.globalAlpha = 0.12;
            const logoH = canvas.height * 0.6;
            const logoW = (logo.width / logo.height) * logoH;
            ctx.drawImage(logo, (canvas.width - logoW)/2, (canvas.height - logoH)/2 + 100, logoW, logoH);
            ctx.globalAlpha = 1.0;
        }

        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        // Top Left Info
        ctx.fillStyle = '#00cfff';
        ctx.font = '900 24px Montserrat, sans-serif';
        ctx.fillText('GRiD UP // SPECIAL EVENT', 80, 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = '900 80px Montserrat, sans-serif';
        ctx.fillText((d.trackName || d.eventName || 'RACE EVENT').toUpperCase(), 80, 120);

        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '600 35px Montserrat, sans-serif';
        ctx.fillText(d.raceDate || '', 80, 210);

        // Top Right Info
        ctx.textAlign = 'right';
        ctx.fillStyle = '#00cfff';
        ctx.font = '800 35px Montserrat, sans-serif';
        ctx.fillText(d.carUsed || 'GT3', canvas.width - 80, 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = '900 65px Montserrat, sans-serif';
        ctx.fillText(`FINISH: ${d.position}`, canvas.width - 80, 130);
        
        if (d.startPos) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = '600 35px Montserrat, sans-serif';
            ctx.fillText(`STARTED: ${d.startPos}`, canvas.width - 80, 210);
        }

        // Bottom Banner Info
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.font = '900 55px Montserrat, sans-serif';
        const driverText = Array.isArray(d.drivers) ? d.drivers.join(' - ').toUpperCase() : String(d.drivers).toUpperCase();
        ctx.fillText(driverText, 80, canvas.height - 160);
        
        ctx.fillStyle = '#00cfff';
        ctx.font = '700 28px Montserrat, sans-serif';
        ctx.fillText('OFFICIAL TEAM ENTRY', 80, canvas.height - 90);

        // Corner Logo
        if (logo && logo.complete) {
            const logoH = 100;
            const logoW = (logo.width / logo.height) * logoH;
            
            // Draw glass background for logo
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.roundRect(canvas.width - 80 - logoW - 40, canvas.height - 80 - logoH - 20, logoW + 80, logoH + 40, 15);
            ctx.fill();
            
            ctx.drawImage(logo, canvas.width - 80 - logoW, canvas.height - 80 - logoH, logoW, logoH);
        }

        const link = document.createElement('a');
        link.download = `GridUp_${d.trackName || 'Poster'}_${d.position}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
    } catch (err) {
        console.error("Download Error:", err);
        alert(`DOWNLOAD NOTICE: HD Export failed.\n\nReason: ${err.message}\n\nTroubleshooting:\n1. If you just updated, please hard-refresh (Ctrl + F5).\n2. Ensure the car photo is a direct link (Imgur/Discord).\n3. Some links may still block HD downloads due to CORS security.`);
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}
// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
    injectCredits();
    
    // Poll for Firestore 'db' initialization from auth.js
    const dbCheckInterval = setInterval(() => {
        if (typeof db !== 'undefined') {
            loadDynamicContent();
            loadRecentResults();
            checkLiveStreams();
            // Re-initialize carousel logic after a short delay to catch dynamic elements
            setTimeout(initCarousel, 1000);
            clearInterval(dbCheckInterval);
        }
    }, 100);
    
    // Safety timeout to avoid infinite polling if Firestore fails
    setTimeout(() => clearInterval(dbCheckInterval), 5000);
});

function injectCredits() {
    if (document.querySelector('.bizare-credits')) return;
    const footer = document.querySelector('footer');
    if (!footer) return;
    
    const credits = document.createElement('a');
    credits.href = 'https://bizare.shop/';
    credits.target = '_blank';
    credits.className = 'bizare-credits';
    credits.innerHTML = 'Created by BiZaRe';
    footer.prepend(credits);
}

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
            const parentDomain = window.location.hostname || 'gridup.online';
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

// Initialize Site-Wide Credits
document.addEventListener('DOMContentLoaded', injectCredits);
window.addEventListener('load', injectCredits);
