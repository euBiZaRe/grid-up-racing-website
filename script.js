// ==========================================
// Signature Endurance Purple Brand Theme System
// Locks the website to the purple endurance design from the mockup
// ==========================================
(function applyDailyTheme() {
    const activeTheme = 'theme-purple';
    
    // Apply theme attribute immediately to avoid flash of default color
    if (document.body) {
        document.body.setAttribute('data-theme', activeTheme);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.setAttribute('data-theme', activeTheme);
        });
    }
})();

// Global Utilities
function getSkeletonHTML(type = 'card') {
    const shimmer = `<div class="glass loading-shimmer race-tile" style="min-width: 290px; max-width: 320px; width: 290px; height: 220px; flex: 0 0 290px; border-radius: 10px; border: 1px solid var(--glass-border);"></div>`;
    const listShimmer = `<div class="glass loading-shimmer" style="height: 120px; width: 100%; border-radius: 12px; margin-bottom: 1.5rem;"></div>`;
    if (type === 'list') return listShimmer.repeat(3);
    return shimmer.repeat(4);
}

// Navbar Scroll Effect (Optimized with Passive Listener and rAF)
let isScrolling = false;
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            const navbar = document.getElementById('navbar');
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

// Mobile Menu Toggle
function initMobileMenu() {
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}


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

// Hero Video Decoder Memory Optimization (Pauses GPU/video decoder when offscreen or in background tab)
function initHeroVideoOptimizer() {
    const heroVideo = document.querySelector('video.hero-img');
    if (!heroVideo) return;

    // Respect reduced motion preference if user requested
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        heroVideo.pause();
        return;
    }

    if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !document.hidden) {
                    if (heroVideo.paused) {
                        heroVideo.play().catch(() => {});
                    }
                } else {
                    if (!heroVideo.paused) {
                        heroVideo.pause();
                    }
                }
            });
        }, { threshold: 0.05 });

        videoObserver.observe(heroVideo);

        // Pause video immediately if tab is hidden or minimized
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (!heroVideo.paused) heroVideo.pause();
            } else {
                const rect = heroVideo.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    if (heroVideo.paused) heroVideo.play().catch(() => {});
                }
            }
        });
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroVideoOptimizer);
} else {
    initHeroVideoOptimizer();
}

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

// Past Events Toggle
function initPastEventsToggle() {
    const toggleBtn = document.getElementById('togglePastEvents');
    const pastSection = document.getElementById('pastEventsSection');

    if (toggleBtn && pastSection) {
        // Remove existing listener if any to avoid duplicates
        toggleBtn.onclick = () => {
            const isHidden = window.getComputedStyle(pastSection).display === 'none';
            pastSection.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Hide Past Events' : 'Show Past Events';
            toggleBtn.classList.toggle('active', isHidden);
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPastEventsToggle);
} else {
    initPastEventsToggle();
}

// Countdown Timer Logic
function updateCountdown(targetTimestamp, endVal = null, broadcastUrl = null, liveStartVal = null) {
    if (!targetTimestamp) return;
    
    // Clear any existing timer
    if (window.countdownInterval) clearInterval(window.countdownInterval);

    const parseDateLocal = (d) => {
        if (!d) return null;
        if (typeof d.toDate === 'function') return d.toDate();
        if (d.seconds) return new Date(d.seconds * 1000);
        return new Date(d);
    };

    const targetDate = parseDateLocal(targetTimestamp).getTime();
    const liveStartDate = liveStartVal ? parseDateLocal(liveStartVal).getTime() : targetDate;
    const endDate = endVal ? parseDateLocal(endVal).getTime() : (targetDate + 24 * 60 * 60 * 1000);
    
    function update() {
        const now = new Date().getTime();
        const countdownEl = document.getElementById('countdown');
        
        const hasLiveTelemetry = (typeof getActiveDriverList === 'function' && getActiveDriverList().length > 0) || Boolean(window.isSimulatingTelemetry);

        // 1. ONLY show Live state if telemetry is actively being streamed by a driver
        if (hasLiveTelemetry) {
            if (countdownEl) {
                const subtitleEl = document.getElementById('hero-event-subtitle');
                if (subtitleEl && !subtitleEl.textContent.startsWith('LIVE NOW')) {
                    subtitleEl.textContent = `LIVE NOW: ${window.currentNextEvent?.name || 'RACE DAY'}`;
                    subtitleEl.style.color = '#ff0055';
                    subtitleEl.classList.add('animate-pulse');
                }
                
                // Show YouTube player or RACE DAY pulsing state
                if (broadcastUrl) {
                    if (!countdownEl.querySelector('iframe')) {
                        let embedUrl = getEmbedUrl(broadcastUrl);
                        if (embedUrl) {
                            if (embedUrl.includes('youtube.com/embed/') && !embedUrl.includes('mute=1')) {
                                embedUrl += '&mute=1';
                            }
                            countdownEl.innerHTML = `
                                <div class="live-player-container" style="max-width: 800px; width: 100%; margin: 1.5rem auto 0; border-radius: 16px; border: 1px solid var(--primary); box-shadow: 0 0 40px var(--primary-glow); overflow: hidden; aspect-ratio: 16/9; background: #000;">
                                    <iframe src="${embedUrl}" style="width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                                </div>
                            `;
                        }
                    }
                } else if (!countdownEl.querySelector('.glow-text.animate-pulse')) {
                    countdownEl.innerHTML = "<div class='glow-text animate-pulse' style='font-size: 2.5rem; font-weight: 900; color: #ff0055;'>LIVE NOW / RACE DAY</div>";
                }
            }
            return false; // Keep running the timer to detect when it ends
        }
        
        // 2. If completely finished (past end date)
        if (now > endDate) {
            if (typeof initHomepageLiveTelemetry === 'function') {
                initHomepageLiveTelemetry(false);
            }
            if (countdownEl) {
                const subtitleEl = document.getElementById('hero-event-subtitle');
                if (subtitleEl) {
                    subtitleEl.textContent = 'Event Completed';
                    subtitleEl.style.color = 'var(--text-muted)';
                    subtitleEl.classList.remove('animate-pulse');
                }
                countdownEl.innerHTML = "<div style='color: var(--text-muted); font-size: 1rem; letter-spacing: 2px;'>CHECK RECENT RESULTS BELOW</div>";
            }
            
            // AUTOMATIC TRANSITION: Re-run dynamic content loading to move completed race to past events
            // and fetch the next upcoming race.
            console.log("Active event has ended! Automatically reloading events...");
            if (typeof loadDynamicContent === 'function') {
                localStorage.removeItem('gridup_upcoming_events');
                window.dynamicContentLoaded = false;
                loadDynamicContent();
            }
            return true; // Stop timer
        }
        
        // 3. Upcoming (before start date) - run standard countdown
        const distance = targetDate - now;
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        let daysEl = document.getElementById('days');
        let hoursEl = document.getElementById('hours');
        let minutesEl = document.getElementById('minutes');
        let secondsEl = document.getElementById('seconds');
        
        // If elements are missing (e.g. from previous LIVE NOW state), restore the countdown structure
        if (countdownEl && (!daysEl || !hoursEl || !minutesEl || !secondsEl)) {
            const hasGrid = countdownEl.querySelector('.mockup-countdown-grid') || countdownEl.querySelector('.countdown-container');
            if (!hasGrid) {
                countdownEl.innerHTML = `
                    <div class="mockup-countdown-grid">
                        <div class="cd-box"><span id="days" class="cd-num">00</span><span class="cd-lbl">DAYS</span></div>
                        <div class="cd-box"><span id="hours" class="cd-num">00</span><span class="cd-lbl">HOURS</span></div>
                        <div class="cd-box"><span id="minutes" class="cd-num">00</span><span class="cd-lbl">MINS</span></div>
                        <div class="cd-box"><span id="seconds" class="cd-num">00</span><span class="cd-lbl">SECS</span></div>
                    </div>
                `;
                daysEl = document.getElementById('days');
                hoursEl = document.getElementById('hours');
                minutesEl = document.getElementById('minutes');
                secondsEl = document.getElementById('seconds');
            }
        }
        
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
        const prevBtn = container.parentElement ? container.parentElement.querySelector('.prev-btn') : null;
        const nextBtn = container.parentElement ? container.parentElement.querySelector('.next-btn') : null;
        
        if (!track) return;

        // Clear any previous auto-scroll interval on this container
        if (container._carouselInterval) {
            clearInterval(container._carouselInterval);
            container._carouselInterval = null;
        }

        // Avoid attaching duplicate event listeners if already initialized
        if (!container.dataset.carouselEventsAttached) {
            container.dataset.carouselEventsAttached = 'true';

            let isDown = false;
            let startX;
            let scrollLeft;
            let isPaused = false;
            let pauseTimer = null;

            const requestPause = (duration = 8000) => {
                isPaused = true;
                if (pauseTimer) clearTimeout(pauseTimer);
                pauseTimer = setTimeout(() => {
                    if (!track.matches(':hover') && !isDown) {
                        isPaused = false;
                    }
                }, duration);
            };

            // Store state on container for interval access
            container._getIsPaused = () => isPaused || isDown;

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
                track.style.cursor = 'grab';
                if (!isPaused) isPaused = false; 
            });

            track.addEventListener('mouseenter', () => {
                isPaused = true;
            });

            track.addEventListener('mouseup', () => {
                isDown = false;
                track.style.cursor = 'grab';
                requestPause(5000);
            });

            track.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - container.offsetLeft;
                const walk = (x - startX) * 2;
                container.scrollLeft = scrollLeft - walk;
            });

            // Trackpad / Mouse Wheel Scroll Detection
            container.addEventListener('scroll', () => {
                if (!isDown) {
                    requestPause(10000);
                }
            }, { passive: true });

            // Touch Support
            track.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
            track.addEventListener('touchend', () => { requestPause(8000); }, { passive: true });

            // Button Navigation
            if (prevBtn && nextBtn) {
                const scrollAmount = 350;
                
                prevBtn.addEventListener('click', () => {
                    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                    requestPause(10000);
                });
                
                nextBtn.addEventListener('click', () => {
                    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    requestPause(10000);
                });
            }
        }

        // Observe container visibility so auto-scroll only operates when visible
        if (!container._visibilityObserver && 'IntersectionObserver' in window) {
            container._isVisible = false;
            container._visibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    container._isVisible = entry.isIntersecting;
                });
            }, { threshold: 0.05 });
            container._visibilityObserver.observe(container);
        } else if (!('IntersectionObserver' in window)) {
            container._isVisible = true;
        }

        // Start Auto Scroll Feature (only if visible, not hidden, overflowing and user is not interacting)
        container._carouselInterval = setInterval(() => {
            if (document.hidden || !container._isVisible) return;
            const isPaused = container._getIsPaused ? container._getIsPaused() : false;
            if (!isPaused && container.scrollWidth > container.clientWidth + 20) {
                const firstCard = track.firstElementChild;
                if (!firstCard) return;
                
                const cardWidth = firstCard.offsetWidth + 24; 
                const maxScrollLeft = container.scrollWidth - container.clientWidth;
                const isAtEnd = container.scrollLeft >= maxScrollLeft - 10;
                
                if (isAtEnd) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            }
        }, 5000); 
    });
}



// Firestore Data Integration
async function loadDynamicContent() {
    const upcomingTrack = document.getElementById('dynamic-upcoming-track');
    const fullEventList = document.getElementById('full-event-list');
    
    // Attempt to load from cache first for instant UI
    const SCRIPT_VER = '7';
    if (localStorage.getItem('gridup_script_ver') !== SCRIPT_VER) {
        localStorage.removeItem('gridup_upcoming_events');
        localStorage.removeItem('gridup_past_events');
        localStorage.setItem('gridup_script_ver', SCRIPT_VER);
    }
    const cachedEvents = localStorage.getItem('gridup_upcoming_events');
    const cachedPastEvents = localStorage.getItem('gridup_past_events');
    let cacheLoaded = false;
    if (cachedEvents && !window.dynamicContentLoaded) {
        try {
            console.log("Loading events from cache...");
            const data = JSON.parse(cachedEvents);
            const pastData = cachedPastEvents ? JSON.parse(cachedPastEvents) : null;
            const now = new Date();
            // Only use cache if the first event isn't ancient (allow 24h lookback)
            const firstEventEnd = data[0].endDate ? new Date(data[0].endDate) : new Date(data[0].startDate);
            if (!data[0].endDate) {
                firstEventEnd.setHours(23, 59, 59, 999);
            }
            
            if (firstEventEnd >= now) {
                renderEventsUI(data, pastData);
                cacheLoaded = true;
            }
        } catch (e) {
            console.warn("Failed to load events from cache:", e);
        }
    }

    if (typeof db === 'undefined') {
        console.warn("Firestore 'db' not initialized yet. Waiting...");
        return;
    }

    let featuredOverride = null;

    // 1. Load Upcoming Races & Update Hero (Show events starting now or recently finished)
    // We use a 24h lookback so ongoing races stay visible
    const lookbackDate = new Date();
    lookbackDate.setHours(lookbackDate.getHours() - 24);
    const filterTimestamp = lookbackDate.toISOString();
    
    if (upcomingTrack && !cacheLoaded && !upcomingTrack.dataset.renderedIds) upcomingTrack.innerHTML = getSkeletonHTML('card');
    if (fullEventList && !cacheLoaded && !fullEventList.dataset.renderedIds) fullEventList.innerHTML = getSkeletonHTML('list');
    
    // Global Constants for URL generation
    const path = window.location.pathname;
    let prefix = '';
    if (path.includes('/events/past/')) {
        prefix = '../../';
    } else if (path.includes('/events/') || path.includes('/drivers/')) {
        prefix = '../';
    }
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
            snap.forEach(doc => {
                const data = doc.data();
                if (doc.id === 'suzuka-1000km') {
                    data.date = 'Sept 11-13';
                }
                allEvents.push({ id: doc.id, ...data });
            });

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

            // Force explicit chronological sort to handle mix of manual and custom events
            allEvents.sort((a, b) => {
                const dateA = parseDate(a.startDate);
                const dateB = parseDate(b.startDate);
                if (!dateA) return 1;
                if (!dateB) return -1;
                return dateA.getTime() - dateB.getTime();
            });

            // Filter events
            const nurburgringPast = now > new Date('2026-05-03T23:59:59');
            
            // Helper to determine true event end time
            const getEventEndDate = (e) => {
                if (e.id === 'suzuka-1000km') {
                    // Suzuka event stays active through end of 13th Sept
                    return new Date('2026-09-13T23:59:59.999Z');
                }
                if (e.endDate) {
                    return parseDate(e.endDate);
                }
                const start = parseDate(e.startDate);
                if (!start) return null;
                const calculatedEnd = new Date(start);
                calculatedEnd.setHours(23, 59, 59, 999);
                return calculatedEnd;
            };

            const upcomingEvents = allEvents.filter(e => {
                const eventEnd = getEventEndDate(e);
                if (!eventEnd) return false;
                
                if ((e.id === 'nurburgring-24h' || e.id === 'nurburgring-24') && nurburgringPast) return false;
                return eventEnd >= now;
            });

            const pastEvents = allEvents.filter(e => {
                const eventEnd = getEventEndDate(e);
                if (!eventEnd) return true;
                
                if ((e.id === 'nurburgring-24h' || e.id === 'nurburgring-24') && nurburgringPast) return true;
                return eventEnd < now;
            });

            // Cache upcoming and past events for next load
            if (upcomingEvents.length > 0) {
                localStorage.setItem('gridup_upcoming_events', JSON.stringify(upcomingEvents));
            }
            if (pastEvents.length > 0) {
                localStorage.setItem('gridup_past_events', JSON.stringify(pastEvents));
            }

            renderEventsUI(upcomingEvents, pastEvents, featuredOverride);
            window.dynamicContentLoaded = true;
        }
    } catch (error) {
        console.error("Error loading dynamic content:", error);
    }
}

// Asynchronously load complete track catalog
if (typeof fetch === 'function') {
    fetch('js/track-catalog.json')
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                window.GLOBAL_TRACK_CATALOG = data;
            }
        })
        .catch(() => {});
}

// Smart Track Image Resolver to ensure every circuit gets its authentic track outline
// Supports subfolders (e.g. assets/tracks/oulton-park/fosters.png), layout variants, and flat fallbacks
function resolveTrackImage(trackName, eventId, explicitTrackImg) {
    if (explicitTrackImg && typeof explicitTrackImg === 'string' && explicitTrackImg.startsWith('assets/tracks/') && !explicitTrackImg.includes('daytona.png')) {
        return explicitTrackImg;
    }
    if (typeof eventBanners !== 'undefined' && eventBanners && eventBanners[eventId]) {
        return eventBanners[eventId];
    }
    const t = (trackName || '').toLowerCase();
    const id = (eventId || '').toLowerCase();

    // Direct path detection
    if (t.startsWith('assets/tracks/') && (t.endsWith('.png') || t.endsWith('.svg'))) {
        return trackName;
    }

    // Catalog lookup if available
    if (window.GLOBAL_TRACK_CATALOG && Array.isArray(window.GLOBAL_TRACK_CATALOG)) {
        const catMatch = window.GLOBAL_TRACK_CATALOG.find(entry => 
            entry.displayName.toLowerCase() === t ||
            entry.id.toLowerCase() === t ||
            (entry.track.toLowerCase() === t) ||
            (t.includes(entry.track.toLowerCase()) && t.includes(entry.layout.toLowerCase()))
        );
        if (catMatch) {
            return catMatch.subfolderPath;
        }
    }

    // Nürburgring Layouts
    if (t.includes('nurburg') || t.includes('nürburg') || t.includes('nordschleife') || t.includes('gesamtstrecke') || id.includes('nurburg')) {
        if (t.includes('24h') || t.includes('gesamtstrecke')) return 'assets/tracks/nurburgring-24h.png';
        if (t.includes('vln') || t.includes('nls') || id.includes('vln') || id.includes('nec')) return 'assets/tracks/nurburgring-vln.png';
        if (t.includes('nordschleife')) return 'assets/tracks/nordschleife.png';
        return 'assets/tracks/nurburgring.png';
    }
    // Oulton Park Layouts
    if (t.includes('oulton') || id.includes('oulton')) {
        if (t.includes('fosters')) return 'assets/tracks/oulton-park/fosters.png';
        if (t.includes('island')) return 'assets/tracks/oulton-park/island.png';
        return 'assets/tracks/oulton-park.png';
    }
    // Daytona Layouts
    if (t.includes('daytona') || id.includes('daytona')) {
        if (t.includes('oval') && !t.includes('road')) return 'assets/tracks/daytona-oval.png';
        return 'assets/tracks/daytona.png';
    }
    // Indianapolis Layouts
    if (t.includes('indy') || t.includes('indianapolis') || id.includes('indy')) {
        if (t.includes('oval') && !t.includes('road')) return 'assets/tracks/indy-oval.png';
        return 'assets/tracks/indy-road-course.png';
    }
    // Watkins Glen Layouts
    if (t.includes('watkins') || id.includes('watkins')) {
        if (t.includes('cup') || t.includes('nascar')) return 'assets/tracks/watkins-glen/cup.png';
        return 'assets/tracks/watkins-glen-boot.png';
    }
    // Silverstone Layouts
    if (t.includes('silverstone') || id.includes('silverstone')) {
        if (t.includes('national')) return 'assets/tracks/silverstone/national.png';
        if (t.includes('international')) return 'assets/tracks/silverstone/international.png';
        return 'assets/tracks/silverstone.png';
    }
    // Brands Hatch Layouts
    if (t.includes('brands hatch') || id.includes('brands-hatch')) {
        if (t.includes('indy')) return 'assets/tracks/brands-hatch/indy.png';
        return 'assets/tracks/brands-hatch.png';
    }
    // Le Mans Layouts
    if (t.includes('lemans') || t.includes('le mans') || id.includes('lemans')) {
        if (t.includes('bugatti')) return 'assets/tracks/lemans/bugatti.png';
        return 'assets/tracks/lemans.png';
    }
    // Suzuka Layouts
    if (t.includes('suzuka') || id.includes('suzuka')) {
        if (t.includes('east')) return 'assets/tracks/suzuka/east.png';
        if (t.includes('west')) return 'assets/tracks/suzuka/west.png';
        return 'assets/tracks/suzuka.png';
    }
    // Sebring Layouts
    if (t.includes('sebring') || id.includes('sebring')) {
        if (t.includes('club')) return 'assets/tracks/sebring/club.png';
        return 'assets/tracks/sebring.png';
    }
    // Road Atlanta Layouts
    if (t.includes('road atlanta') || t.includes('petit le mans') || id.includes('petit-le-mans')) {
        if (t.includes('short')) return 'assets/tracks/road-atlanta/short.png';
        return 'assets/tracks/road-atlanta.png';
    }
    // Portimão
    if (t.includes('portimao') || t.includes('algarve') || id.includes('portimao')) {
        if (t.includes('chicane')) return 'assets/tracks/portimao/chicane.png';
        return 'assets/tracks/portimao.png';
    }
    // Road America
    if (t.includes('road america') || id.includes('road-america')) {
        return 'assets/tracks/road-america.png';
    }
    // Bathurst
    if (t.includes('bathurst') || t.includes('mount panorama') || id.includes('bathurst')) {
        return 'assets/tracks/bathurst.png';
    }
    // Monza
    if (t.includes('monza') || id.includes('monza')) {
        return 'assets/tracks/monza.png';
    }
    // Catalunya / Barcelona
    if (t.includes('catalunya') || t.includes('barcelona') || id.includes('catalunya')) {
        if (t.includes('national')) return 'assets/tracks/catalunya/national.png';
        return 'assets/tracks/catalunya/gp.png';
    }
    // Imola
    if (t.includes('imola') || id.includes('imola')) {
        return 'assets/tracks/imola/gp.png';
    }
    // COTA
    if (t.includes('cota') || t.includes('circuit of the americas') || id.includes('cota')) {
        if (t.includes('national')) return 'assets/tracks/cota/national.png';
        return 'assets/tracks/cota/gp.png';
    }
    // Interlagos
    if (t.includes('interlagos') || t.includes('pace') || id.includes('interlagos')) {
        return 'assets/tracks/interlagos/gp.png';
    }
    // Laguna Seca
    if (t.includes('laguna') || id.includes('laguna')) {
        return 'assets/tracks/laguna-seca/full.png';
    }
    // Red Bull Ring
    if (t.includes('red bull ring') || t.includes('spielberg') || id.includes('red-bull-ring')) {
        return 'assets/tracks/red-bull-ring/gp.png';
    }
    // Hockenheim
    if (t.includes('hockenheim') || id.includes('hockenheim')) {
        return 'assets/tracks/hockenheim/gp.png';
    }
    // Fuji
    if (t.includes('fuji') || id.includes('fuji')) {
        return 'assets/tracks/fuji/gp.png';
    }
    // VIR
    if (t.includes('vir') || t.includes('virginia international') || id.includes('vir')) {
        return 'assets/tracks/vir/full.png';
    }
    // Lime Rock
    if (t.includes('lime rock') || id.includes('lime-rock')) {
        return 'assets/tracks/lime-rock/classic.png';
    }
    // Zandvoort
    if (t.includes('zandvoort') || id.includes('zandvoort')) {
        return 'assets/tracks/zandvoort/gp.png';
    }
    // Mugello
    if (t.includes('mugello') || id.includes('mugello')) {
        return 'assets/tracks/mugello/gp.png';
    }
    // Donington
    if (t.includes('donington') || id.includes('donington')) {
        return 'assets/tracks/donington/gp.png';
    }
    // Snetterton
    if (t.includes('snetterton') || id.includes('snetterton')) {
        return 'assets/tracks/snetterton/300.png';
    }
    // Knockhill
    if (t.includes('knockhill') || id.includes('knockhill')) {
        return 'assets/tracks/knockhill/international.png';
    }
    // Cadwell Park
    if (t.includes('cadwell') || id.includes('cadwell')) {
        return 'assets/tracks/cadwell-park/full.png';
    }
    // Talladega
    if (t.includes('talladega') || id.includes('talladega')) {
        return 'assets/tracks/talladega/oval.png';
    }
    // Charlotte
    if (t.includes('charlotte') || id.includes('charlotte')) {
        if (t.includes('roval')) return 'assets/tracks/charlotte/roval.png';
        return 'assets/tracks/charlotte/oval.png';
    }
    // Bristol
    if (t.includes('bristol') || id.includes('bristol')) {
        return 'assets/tracks/bristol/oval.png';
    }
    // Darlington
    if (t.includes('darlington') || id.includes('darlington')) {
        return 'assets/tracks/darlington/oval.png';
    }
    // Martinsville
    if (t.includes('martinsville') || id.includes('martinsville')) {
        return 'assets/tracks/martinsville/oval.png';
    }

    return 'assets/tracks/generic-circuit.png';
}

function resolveTrackSpecs(trackName, eventSpecs) {
    if (eventSpecs && eventSpecs !== 'OFFICIAL IRACING EVENT') return eventSpecs;
    const t = (trackName || '').toLowerCase();
    if (t.includes('nurburg') || t.includes('nürburg') || t.includes('nordschleife') || t.includes('gesamtstrecke')) {
        return '15.14mi (24.36km) • 170 TURNS • COMBINED VLN';
    }
    if (t.includes('bathurst') || t.includes('mount panorama')) {
        return '3.86mi • 23 TURNS • MOUNT PANORAMA';
    }
    if (t.includes('spa') || t.includes('francorchamps')) {
        return '4.35mi • 19 TURNS • GRAND PRIX';
    }
    if (t.includes('road america')) {
        return '4.05mi • 14 TURNS • FULL COURSE';
    }
    if (t.includes('road atlanta')) {
        return '2.54mi • 12 TURNS • FULL COURSE';
    }
    if (t.includes('watkins')) {
        return '3.40mi • 11 TURNS • BOOT LAYOUT';
    }
    if (t.includes('suzuka')) {
        return '3.61mi • 18 TURNS • GRAND PRIX';
    }
    if (t.includes('daytona')) {
        return '3.56mi • 12 TURNS • ROAD COURSE';
    }
    if (t.includes('sebring')) {
        return '3.74mi • 17 TURNS • INTERNATIONAL';
    }
    if (t.includes('silverstone')) {
        return '3.66mi • 18 TURNS • GRAND PRIX';
    }
    if (t.includes('monza')) {
        return '3.60mi • 11 TURNS • GRAND PRIX';
    }
    if (t.includes('lemans') || t.includes('le mans')) {
        return '8.47mi • 38 TURNS • CIRCUIT DE LA SARTHE';
    }
    if (t.includes('indy') || t.includes('indianapolis')) {
        return '2.43mi • 14 TURNS • ROAD COURSE';
    }
    if (t.includes('oulton')) {
        return '2.69mi (4.33km) • 17 TURNS • INTERNATIONAL';
    }
    if (t.includes('brands hatch')) {
        return '2.43mi • 9 TURNS • GRAND PRIX';
    }
    if (t.includes('portimao') || t.includes('algarve')) {
        return '2.89mi • 15 TURNS • GRAND PRIX';
    }
    return eventSpecs || 'OFFICIAL IRACING EVENT';
}

// Dynamically populates the Next Event dashboard card with real track and event info
function populateNextEventDashboard(nextEvent, staticIds = [], eventBanners = {}) {
    if (!nextEvent) return;

    const EVENT_PROFILES = {
        'indy-8h': {
            name: '8 HOURS OF INDIANAPOLIS',
            trackName: 'INDIANAPOLIS MOTOR SPEEDWAY',
            trackSpecs: '2.43mi • 14 TURNS • ROAD COURSE',
            trackImg: 'assets/tracks/indy-road-course.png',
            date: 'OCTOBER 16–18, 2026',
            schedule: { practice: '17:00 GMT', qualifying: '18:30 GMT', greenFlag: '19:00 GMT' },
            timeslots: [
                { slot: 1, utc: '2026-10-16T22:00:00Z', duration: '8 hr' },
                { slot: 2, utc: '2026-10-17T07:00:00Z', duration: '8 hr' },
                { slot: 3, utc: '2026-10-17T12:00:00Z', duration: '8 hr' },
                { slot: 4, utc: '2026-10-17T16:00:00Z', duration: '8 hr' },
                { slot: 5, utc: '2026-10-18T00:00:00Z', duration: '8 hr' }
            ],
            classes: ['GT3 CLASS', '2+ DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: '4 SETS', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~45 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'TIRE STRATEGY', lbl: 'DOUBLE STINT TIRES' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'MIN 2 DRIVERS PER CAR' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'Demanding front stretch of the Brickyard oval into heavy braking turn 1, technical infield snake complex, and high-speed banking transition.',
            detailsUrl: 'events/indy-8h.html'
        },
        'indianapolis-8h': {
            name: '8 HOURS OF INDIANAPOLIS',
            trackName: 'INDIANAPOLIS MOTOR SPEEDWAY',
            trackSpecs: '2.43mi • 14 TURNS • ROAD COURSE',
            trackImg: 'assets/tracks/indy-road-course.png',
            date: 'OCTOBER 16–18, 2026',
            schedule: { practice: '17:00 GMT', qualifying: '18:30 GMT', greenFlag: '19:00 GMT' },
            timeslots: [
                { slot: 1, utc: '2026-10-16T22:00:00Z', duration: '8 hr' },
                { slot: 2, utc: '2026-10-17T07:00:00Z', duration: '8 hr' },
                { slot: 3, utc: '2026-10-17T12:00:00Z', duration: '8 hr' },
                { slot: 4, utc: '2026-10-17T16:00:00Z', duration: '8 hr' },
                { slot: 5, utc: '2026-10-18T00:00:00Z', duration: '8 hr' }
            ],
            classes: ['GT3 CLASS', '2+ DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: '4 SETS', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~45 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'TIRE STRATEGY', lbl: 'DOUBLE STINT TIRES' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'MIN 2 DRIVERS PER CAR' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'Demanding front stretch of the Brickyard oval into heavy braking turn 1, technical infield snake complex, and high-speed banking transition.',
            detailsUrl: 'events/indy-8h.html'
        },
        'bathurst-1000': {
            name: 'BATHURST 1000',
            trackName: 'MOUNT PANORAMA CIRCUIT',
            trackSpecs: '3.86mi • 23 TURNS • MOUNT PANORAMA',
            trackImg: 'assets/tracks/bathurst.png',
            date: 'OCTOBER 09–11, 2026',
            schedule: { practice: '08:00 GMT', qualifying: '09:30 GMT', greenFlag: '10:00 GMT' },
            classes: ['SUPERCAR CLASS', '2 DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: '6 SETS', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~40 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'THE MOUNTAIN', lbl: 'CONROD STRAIGHT DRAFT' },
                { icon: '⚖️', val: 'CO-DRIVER RULE', lbl: 'MIN 54 LAPS CO-DRIVER' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'PER ENTERED CAR' }
            ],
            highlights: 'Breathtaking 174-meter vertical climb, razor-thin barriers through the Cutting, and 300 km/h Conrod Straight.',
            detailsUrl: 'events/bathurst-1000.html'
        },
        'petit-le-mans': {
            name: 'PETIT LE MANS',
            trackName: 'MICHELIN RACEWAY ROAD ATLANTA',
            trackSpecs: '2.54mi • 12 TURNS • FULL COURSE',
            trackImg: 'assets/tracks/road-atlanta.png',
            date: 'OCTOBER 02–04, 2026',
            schedule: { practice: '14:00 GMT', qualifying: '15:30 GMT', greenFlag: '16:00 GMT' },
            classes: ['GTP + LMP2 + GT3', '2-3 DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'UNLIMITED', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~45 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'TURN 12 DOWNHILL', lbl: 'BLIND CREST ENTRY' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'EACH DRIVER >= 1 STINT' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'The sweeping downhill esses, high-speed back straight into the chicane, and thrilling plunge down turn 12 to the line.',
            detailsUrl: 'events/petit-le-mans.html'
        },
        'road-america-6h': {
            name: 'ROAD AMERICA 6 HOUR',
            trackName: 'ROAD AMERICA',
            trackSpecs: '4.05mi • 14 TURNS • FULL COURSE',
            trackImg: 'assets/tracks/road-america.png',
            date: 'JULY 24–26, 2026',
            schedule: { practice: '16:00 GMT', qualifying: '17:30 GMT', greenFlag: '18:00 GMT' },
            classes: ['GTP + LMP2 + GT3', '2-3 DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'UNLIMITED', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~50 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'CAROUSEL & KINK', lbl: 'HIGH DOWNFORCE SETUP' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'EACH DRIVER >= 1 STINT' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'PER ENTERED CAR' }
            ],
            highlights: 'High-speed straights into downhill braking zones, the relentless right-hand Carousel, and the flat-out Kink.',
            detailsUrl: 'events/road-america-6h.html'
        },
        'suzuka-1000km': {
            name: 'SUZUKA 1000KM',
            trackName: 'SUZUKA INTERNATIONAL RACING COURSE',
            trackSpecs: '3.61mi • 18 TURNS • GRAND PRIX',
            trackImg: 'assets/tracks/suzuka.png',
            date: 'SEPTEMBER 11–13, 2026',
            schedule: { practice: '13:00 GMT', qualifying: '14:30 GMT', greenFlag: '15:00 GMT' },
            classes: ['GT3 CLASS', '2-3 DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: '6 SETS', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~48 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'S-CURVES RHYTHM', lbl: 'HIGH APEX PRECISION' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'EACH DRIVER >= 1 STINT' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'Technical figure-eight layout, rhythm-demanding first sector S-curves, and high-commitment 130R flat out.',
            detailsUrl: 'events/suzuka-1000km.html'
        },
        'spa-24hr': {
            name: '24 HOURS OF SPA',
            trackName: 'CIRCUIT DE SPA-FRANCORCHAMPS',
            trackSpecs: '4.35mi • 19 TURNS • GRAND PRIX',
            trackImg: 'assets/tracks/spa.png',
            date: 'JULY 10–12, 2026',
            schedule: { practice: '11:00 GMT', qualifying: '12:30 GMT', greenFlag: '13:00 GMT' },
            classes: ['GT3 CLASS', '3-4 DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'UNLIMITED', lbl: 'TIRE ALLOCATION' },
                { icon: '⏱️', val: '~60 MIN', lbl: 'STINT LENGTH' },
                { icon: '🔧', val: 'WEATHER RADAR', lbl: 'DYNAMIC ARDENNES RAIN' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'PRO RATED DRIVE TIME' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'Steep compression up Eau Rouge and Raidillon, long Kemmel Straight slipstream battles, and tricky Blanchimont sweepers.',
            detailsUrl: 'events/spa-24hr.html'
        },
        'watkins-glen-6h': {
            name: 'WATKINS GLEN 6 HOUR',
            trackName: 'WATKINS GLEN INTERNATIONAL',
            trackSpecs: '3.40mi • 11 TURNS • BOOT LAYOUT',
            trackImg: 'assets/tracks/watkins-glen.png',
            date: 'JUNE 19–21, 2026',
            schedule: { practice: '15:00 GMT', qualifying: '16:30 GMT', greenFlag: '17:00 GMT' },
            classes: ['GTP + LMP2 + GT3', '2-3 DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'UNLIMITED', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~45 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'THE BUS STOP', lbl: 'CURB STRIKE STABILITY' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'MIN 2 DRIVERS' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'Uphill esses, rapid braking into the Bus Stop chicane, and long technical sweepers through the Boot.',
            detailsUrl: 'events/watkins-glen-6h.html'
        },
        'nurburgring-24h': {
            name: 'NÜRBURGRING 24H',
            trackName: 'NÜRBURGRING COMBINED - GESAMTSTRECKE 24H',
            trackSpecs: '15.77mi (25.38km) • 170 TURNS • 24H LAYOUT',
            trackImg: 'assets/tracks/nurburgring.png',
            date: 'MAY 1–3, 2026',
            schedule: { practice: '14:00 GMT', qualifying: '15:30 GMT', greenFlag: '16:00 GMT' },
            classes: ['GT3 + GT4 + TCR + CUP', '3-4 DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'UNLIMITED', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~55 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'FLUGPLATZ & KARUSSELL', lbl: 'HIGH COMPRESSION' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'MIN 25% DRIVE TIME' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'The legendary Green Hell with 170 corners through the Eifel mountains, combining the modern GP-Strecke and the relentless Nordschleife.',
            detailsUrl: 'events/nurburgring-24h.html'
        },
        'nec-26-w10': {
            name: 'NÜRBURGRING ENDURANCE CHAMPIONSHIP',
            trackName: 'NÜRBURGRING COMBINED - GESAMTSTRECKE VLN',
            trackSpecs: '15.14mi (24.36km) • 170 TURNS • COMBINED VLN',
            trackImg: 'assets/tracks/nurburgring.png',
            date: 'NOVEMBER 7–8, 2026',
            schedule: { practice: '06:00 GMT', qualifying: '06:45 GMT', greenFlag: '07:00 GMT' },
            timeslots: [
                { slot: 1, utc: '2026-11-07T07:00:00Z', duration: '4 hr' },
                { slot: 2, utc: '2026-11-07T17:00:00Z', duration: '4 hr' },
                { slot: 3, utc: '2026-11-08T00:00:00Z', duration: '4 hr' },
                { slot: 4, utc: '2026-11-08T13:00:00Z', duration: '4 hr' }
            ],
            classes: ['GT3', 'PORSCHE CUP', 'GT4', 'TCR', 'BMW M2'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'UNLIMITED', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~55 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'DÖTTINGER HÖHE', lbl: 'SLIPSTREAM DRAFTING' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'MIN 2 DRIVERS PER CAR' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'High-commitment crests, Karussell banking, and flat-out speeds down Döttinger Höhe on the world-famous VLN layout.',
            detailsUrl: 'events/nurburgring-24h.html'
        },
        'nurburgring-vln': {
            name: 'NÜRBURGRING ENDURANCE CHAMPIONSHIP',
            trackName: 'NÜRBURGRING COMBINED - GESAMTSTRECKE VLN',
            trackSpecs: '15.14mi (24.36km) • 170 TURNS • COMBINED VLN',
            trackImg: 'assets/tracks/nurburgring.png',
            date: 'NOVEMBER 7–8, 2026',
            schedule: { practice: '06:00 GMT', qualifying: '06:45 GMT', greenFlag: '07:00 GMT' },
            timeslots: [
                { slot: 1, utc: '2026-11-07T07:00:00Z', duration: '4 hr' },
                { slot: 2, utc: '2026-11-07T17:00:00Z', duration: '4 hr' },
                { slot: 3, utc: '2026-11-08T00:00:00Z', duration: '4 hr' },
                { slot: 4, utc: '2026-11-08T13:00:00Z', duration: '4 hr' }
            ],
            classes: ['GT3', 'PORSCHE CUP', 'GT4', 'TCR', 'BMW M2'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'UNLIMITED', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~55 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'DÖTTINGER HÖHE', lbl: 'SLIPSTREAM DRAFTING' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'MIN 2 DRIVERS PER CAR' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'High-commitment crests, Karussell banking, and flat-out speeds down Döttinger Höhe on the world-famous VLN layout.',
            detailsUrl: 'events/nurburgring-24h.html'
        },
        'daytona-24': {
            name: '24 HOURS OF DAYTONA',
            trackName: 'DAYTONA INTERNATIONAL SPEEDWAY',
            trackSpecs: '3.56mi • 12 TURNS • ROAD COURSE',
            trackImg: 'assets/tracks/daytona.png',
            date: 'JANUARY 23–25, 2026',
            schedule: { practice: '17:00 GMT', qualifying: '18:30 GMT', greenFlag: '19:00 GMT' },
            classes: ['GTP + LMP2 + GT3', '3-4 DRIVERS PER CAR'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'UNLIMITED', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~45 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'BUS STOP CHICANE', lbl: 'HIGH SPEED CURBING' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'MIN 25% DRIVE TIME' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'Steep 31-degree banking, technical infield, and high-speed slipstreaming into the Le Mans chicane.',
            detailsUrl: 'events/past/daytona-24.html'
        },
        'oulton-park': {
            name: 'OULTON PARK',
            trackName: 'OULTON PARK CIRCUIT',
            trackSpecs: '2.69mi (4.33km) • 17 TURNS • INTERNATIONAL',
            trackImg: 'assets/tracks/oulton-park.png',
            classes: ['GT3', 'TEAM EVENT'],
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'UNLIMITED', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~45 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'SHELL OILS HAIRPIN', lbl: 'BANKED HAIRPIN TRACTION' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'MIN 2 DRIVERS PER CAR' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: 'Famous undulating parkland circuit featuring Old Hall, Cascades down to the banked Shell Oils Hairpin, and the thrilling plunge through Druids and Lodge Corner.',
            detailsUrl: 'events.html'
        }
    };

    const id = nextEvent.id || '';
    const rawTrackName = nextEvent.track || nextEvent.name || 'Official Circuit';
    const fallbackImg = (nextEvent.trackImg && nextEvent.trackImg !== 'assets/tracks/daytona.png') ? nextEvent.trackImg : resolveTrackImage(rawTrackName, id, nextEvent.trackImg);
    const fallbackSpecs = resolveTrackSpecs(rawTrackName, nextEvent.specs);

    // Dynamic resolution: exact id match, or fuzzy match for NEC / Nürburgring VLN series
    let profile = EVENT_PROFILES[id];
    if (!profile) {
        const idLower = (id || '').toLowerCase();
        const tLower = (rawTrackName || '').toLowerCase();
        const nLower = ((nextEvent && nextEvent.name) || '').toLowerCase();
        if (idLower.includes('nec') || idLower.includes('vln') || tLower.includes('nurburg') || nLower.includes('nurburg') || nLower.includes('endurance championship')) {
            profile = EVENT_PROFILES['nec-26-w10'] || EVENT_PROFILES['nurburgring-vln'];
        } else if (tLower.includes('oulton') || idLower.includes('oulton') || nLower.includes('oulton')) {
            profile = EVENT_PROFILES['oulton-park'];
        }
    }

    if (!profile) {
        let cleanClasses = ['ENDURANCE MULTICLASS', 'TEAM EVENT'];
        if (nextEvent.classes) {
            if (Array.isArray(nextEvent.classes)) {
                cleanClasses = [...nextEvent.classes, 'TEAM EVENT'];
            } else if (typeof nextEvent.classes === 'string') {
                cleanClasses = nextEvent.classes.split(',').map(c => c.trim()).concat(['TEAM EVENT']);
            }
        }

        profile = {
            name: (nextEvent.name || 'Upcoming Race').toUpperCase(),
            trackName: rawTrackName.toUpperCase(),
            trackSpecs: fallbackSpecs,
            trackImg: fallbackImg,
            date: (nextEvent.date || 'SEASON 2026').toUpperCase(),
            schedule: { practice: '17:00 GMT', qualifying: '18:30 GMT', greenFlag: '19:00 GMT' },
            classes: cleanClasses,
            metrics: [
                { icon: '⛽', val: '100%', lbl: 'FUEL CAPACITY' },
                { icon: '🛞', val: 'ALLOCATED', lbl: 'TIRE SETS' },
                { icon: '⏱️', val: '~45 MIN', lbl: 'FUEL STINTS' },
                { icon: '🔧', val: 'TEAM STRATEGY', lbl: 'OPTIMIZED TELEMETRY' },
                { icon: '⚖️', val: 'FAIR SHARE RULE', lbl: 'ALL ENTERED DRIVERS' },
                { icon: '⚡', val: '1 FAST REPAIR', lbl: 'AVAILABLE IN RACE' }
            ],
            highlights: nextEvent.description || 'Full team effort featuring optimized setups, telemetry analysis, and endurance race strategy.',
            detailsUrl: (staticIds && staticIds.includes(id)) ? getEventLink(id, true) : getEventLink(id)
        };
    }

    // Safety check: if trackImg is daytona or missing but trackName is Nurburgring or other circuit, resolve accurately
    if (profile.trackName) {
        if (!profile.trackImg || profile.trackImg.includes('daytona.png')) {
            const accuratelyResolved = resolveTrackImage(profile.trackName, id);
            if (accuratelyResolved && !accuratelyResolved.includes('daytona.png')) {
                profile.trackImg = accuratelyResolved;
            }
        }
        if (!profile.trackSpecs || profile.trackSpecs === 'OFFICIAL IRACING EVENT') {
            profile.trackSpecs = resolveTrackSpecs(profile.trackName, profile.trackSpecs);
        }
    }

    const nameEl = document.getElementById('hero-event-name');
    if (nameEl) nameEl.textContent = profile.name;

    const dateEl = document.getElementById('hero-event-date-text');
    if (dateEl) dateEl.textContent = profile.date;

    const schedPrac = document.getElementById('hero-sched-practice');
    if (schedPrac) schedPrac.textContent = profile.schedule ? profile.schedule.practice : '';

    const schedQual = document.getElementById('hero-sched-quali');
    if (schedQual) schedQual.textContent = profile.schedule ? profile.schedule.qualifying : '';

    const schedGreen = document.getElementById('hero-sched-green');
    if (schedGreen) schedGreen.textContent = profile.schedule ? profile.schedule.greenFlag : '';

    // Render Event Timeslots formatted to user's local timezone (passes nextEvent for context)
    renderHeroTimeslots(profile.timeslots || nextEvent.slots, nextEvent);

    const classesEl = document.getElementById('hero-event-classes');
    if (classesEl && Array.isArray(profile.classes)) {
        classesEl.innerHTML = profile.classes.map(c => `<span class="class-pill">${c}</span>`).join('');
    }

    const trackImg = document.getElementById('hero-track-img');
    if (trackImg) {
        trackImg.src = profile.trackImg;
        trackImg.alt = profile.trackName;
    }

    const trackName = document.getElementById('hero-track-name');
    if (trackName) trackName.textContent = profile.trackName;

    const trackSpecs = document.getElementById('hero-track-specs');
    if (trackSpecs) trackSpecs.textContent = profile.trackSpecs;

    const metricsEl = document.getElementById('hero-event-metrics');
    if (metricsEl && Array.isArray(profile.metrics)) {
        metricsEl.innerHTML = profile.metrics.map(m => `
            <div class="metric-badge-item">
                <div class="metric-icon">${m.icon}</div>
                <div class="metric-text">
                    <span class="metric-val">${m.val}</span>
                    <span class="metric-lbl">${m.lbl}</span>
                </div>
            </div>
        `).join('');
    }

    const highlightsEl = document.getElementById('hero-track-highlights');
    if (highlightsEl) {
        highlightsEl.innerHTML = `<strong>TRACK HIGHLIGHTS:</strong> ${profile.highlights}`;
    }

    const heroLink = document.getElementById('hero-event-link');
    if (heroLink) {
        heroLink.href = profile.detailsUrl;
    }
}

// Renders the Event Timeslots list formatted to the user's local timezone
function renderHeroTimeslots(slots, eventContext) {
    const listEl = document.getElementById('hero-timeslots-list');
    const badgeEl = document.getElementById('hero-tz-badge');
    if (!listEl) return;

    let tzShort = 'LOCAL';
    try {
        const parts = new Intl.DateTimeFormat([], { timeZoneName: 'short' }).formatToParts(new Date());
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        if (tzPart && tzPart.value) {
            tzShort = tzPart.value;
        }
    } catch (e) {
        tzShort = 'LOCAL';
    }
    if (badgeEl) {
        badgeEl.textContent = tzShort;
        badgeEl.title = `Times converted to your local time (${tzShort})`;
    }

    const defaultSlots = [
        { slot: 1, utc: '2026-11-07T07:00:00Z', duration: '4 hr' },
        { slot: 2, utc: '2026-11-07T17:00:00Z', duration: '4 hr' },
        { slot: 3, utc: '2026-11-08T00:00:00Z', duration: '4 hr' },
        { slot: 4, utc: '2026-11-08T13:00:00Z', duration: '4 hr' }
    ];

    let rawSlots = slots;
    if (!Array.isArray(rawSlots) || rawSlots.length === 0) {
        rawSlots = defaultSlots;
    }

    const now = Date.now();

    listEl.innerHTML = rawSlots.map((s, idx) => {
        let slotNum = idx + 1;
        let duration = '4 hr';
        let slotDate = null;
        let fallbackTimeStr = '';
        let fallbackDateStr = '';

        if (typeof s === 'string') {
            const numMatch = s.match(/#(\d+)/);
            if (numMatch) slotNum = parseInt(numMatch[1], 10);

            const gmtMatch = s.match(/(\d{1,2}:\d{2})\s*GMT/i);
            const dayMatch = s.match(/(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i);

            if (eventContext && eventContext.startDate && dayMatch && gmtMatch) {
                const baseDate = new Date(eventContext.startDate);
                if (!isNaN(baseDate.getTime())) {
                    const targetDay = dayMatch[1].toLowerCase();
                    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const targetDayIdx = daysOfWeek.indexOf(targetDay);
                    const baseDayIdx = baseDate.getUTCDay();
                    let diffDays = targetDayIdx - baseDayIdx;
                    if (diffDays < -3) diffDays += 7;
                    if (diffDays > 3) diffDays -= 7;

                    const [h, m] = gmtMatch[1].split(':').map(Number);
                    const derived = new Date(baseDate);
                    derived.setUTCDate(derived.getUTCDate() + diffDays);
                    derived.setUTCHours(h, m, 0, 0);
                    slotDate = derived;
                }
            }

            if (!slotDate || isNaN(slotDate.getTime())) {
                const direct = new Date(s);
                if (!isNaN(direct.getTime())) {
                    slotDate = direct;
                } else {
                    fallbackTimeStr = gmtMatch ? `${gmtMatch[1]} GMT` : s;
                    fallbackDateStr = dayMatch ? dayMatch[1] : (eventContext && eventContext.date ? eventContext.date : 'Upcoming Session');
                }
            }
        } else if (typeof s === 'object' && s !== null) {
            slotNum = s.slot || (idx + 1);
            duration = s.duration || '4 hr';
            const rawVal = s.utc || s.date || s.startTime || s.time || s.datetime;
            if (rawVal) {
                const d = new Date(rawVal);
                if (!isNaN(d.getTime())) slotDate = d;
            }
        }

        const isValidDate = slotDate instanceof Date && !isNaN(slotDate.getTime());
        const timeFormatted = isValidDate
            ? slotDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            : (fallbackTimeStr || 'TBA');
        const dateFormatted = isValidDate
            ? slotDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            : (fallbackDateStr || 'Upcoming Session');

        // Countdown calculation
        let countdownText = 'UPCOMING';
        let isActive = false;

        if (isValidDate) {
            const diffMs = slotDate.getTime() - now;
            const durHoursMatch = String(duration).match(/(\d+)/);
            const durHours = durHoursMatch ? parseInt(durHoursMatch[1], 10) : 4;
            const endMs = slotDate.getTime() + (durHours * 3600 * 1000);

            if (diffMs > 0) {
                const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                const days = Math.floor(totalHours / 24);
                const remHours = totalHours % 24;
                if (days > 0) {
                    countdownText = `${days}d ${String(remHours).padStart(2, '0')} hrs`;
                } else {
                    const remMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    countdownText = `${remHours}h ${String(remMins).padStart(2, '0')}m`;
                }
            } else if (now <= endMs) {
                countdownText = 'LIVE NOW';
                isActive = true;
            } else {
                countdownText = 'COMPLETED';
            }
        }

        return `
            <div class="timeslot-row ${isActive ? 'is-active-now' : ''}">
                <div class="timeslot-col col-start">
                    <div class="timeslot-time">${timeFormatted}</div>
                    <div class="timeslot-countdown">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>${countdownText}</span>
                    </div>
                </div>
                <div class="timeslot-col col-date">
                    <div class="timeslot-date-title">${dateFormatted}</div>
                    <div class="timeslot-slot-tag">Timeslot #${slotNum}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Populates the scrolling upcoming events marquee ticker under the navbar (Homepage only)
function populateEventsTicker(upcomingEvents, staticIds = []) {
    const tickerContent = document.getElementById('events-ticker-content');
    if (!tickerContent) return;
    if (!Array.isArray(upcomingEvents) || upcomingEvents.length === 0) return;

    const signature = upcomingEvents.map(e => e.id || e.name).join('|');
    if (tickerContent.dataset.renderedSignature === signature) {
        return; // Avoid unnecessary re-render that resets CSS animation position
    }
    tickerContent.dataset.renderedSignature = signature;

    const itemsHtml = upcomingEvents.map((e, idx) => {
        const link = (staticIds && staticIds.includes(e.id)) ? getEventLink(e.id, true) : getEventLink(e.id);
        const name = (e.name || 'Upcoming Race').toUpperCase();
        const date = (e.date || 'Season 2026').toUpperCase();
        const tagText = idx === 0 ? '📅 NEXT MAJOR' : '📅 UPCOMING';
        return `
            <a href="${link}" class="ticker-item">
                <span class="ticker-tag tag-next">${tagText}</span>
                <span class="ticker-text">${name} — ${date}</span>
            </a>
        `;
    }).join('');

    const recentResultsHtml = `
        <a href="events/petit-le-mans.html" class="ticker-item">
            <span class="ticker-tag tag-p1">🏆 P1 WIN</span>
            <span class="ticker-text">PETIT LE MANS — LMP2 CLASS (Chandler English • Andrew Gould • Bret Weyand)</span>
        </a>
        <a href="events/road-america-6h.html" class="ticker-item">
            <span class="ticker-tag tag-p1">🥇 P1 WIN</span>
            <span class="ticker-text">ROAD AMERICA 6 HOUR — GTP (Faraz Ebrahim • Anthony Savignano)</span>
        </a>
        <a href="events/past/daytona-24.html" class="ticker-item">
            <span class="ticker-tag tag-p2">🥈 P2 PODIUM</span>
            <span class="ticker-text">24 HOURS OF DAYTONA — LMP2 (A. Fabian • M. Cook • J. Reid • A. Cortez)</span>
        </a>
        <a href="events/indy-500.html" class="ticker-item">
            <span class="ticker-tag tag-p1">🥇 P1 WIN</span>
            <span class="ticker-text">INDY 500 — DALLARA IR18 (Alex Cortez)</span>
        </a>
        <a href="events/nurburgring-24h.html" class="ticker-item">
            <span class="ticker-tag tag-p2">🥈 P2 PODIUM</span>
            <span class="ticker-text">24H NÜRBURGRING — GT3 (A. Cortez • C. Deasey • J. Reid • L. Wilt)</span>
        </a>
        <a href="events/suzuka-1000km.html" class="ticker-item">
            <span class="ticker-tag tag-p2">🥈 P2 PODIUM</span>
            <span class="ticker-text">SUZUKA 1000KM — GT3 (M. Roberts • F. Ebrahim • T. Cantwell)</span>
        </a>
        <a href="events/past/iracing-roar.html" class="ticker-item">
            <span class="ticker-tag tag-p3">🥉 P3 PODIUM</span>
            <span class="ticker-text">IRACING ROAR — GT4 (Terry Cantwell)</span>
        </a>
    `;

    const totalHtml = itemsHtml + recentResultsHtml;
    // Duplicate once for seamless infinite continuous marquee loop
    tickerContent.innerHTML = totalHtml + totalHtml;
}

// Extracted UI rendering logic to allow calling from cache or Firestore
function renderEventsUI(upcomingEvents, pastEvents = null, featuredOverride = null) {
    const upcomingTrack = document.getElementById('dynamic-upcoming-track');
    const fullEventList = document.getElementById('full-event-list');
    const heroSubtitle = document.getElementById('hero-event-subtitle');
    const heroTitle = document.getElementById('hero-event-name');
    const heroLink = document.getElementById('hero-event-link');
    const now = new Date();

    const staticIds = [
        'imsa-classic-500', 'indy-500', 'world-600',
        'thruxton-4h', 'watkins-glen-6h', 'spa-24hr', 'firecracker-400',
        'road-america-6h', 'brickyard-400', 'suzuka-1000km', 'petit-le-mans',
        'bathurst-1000', 'indy-8h', 'knoxville-nationals', 'portimao-1000',
        'crandon-championship', 'southern-500', 'britcar-24hr', 'ff1600-festival',
        'homestead-championship', 'sfl-mountain-showdown', 'scca-runoffs',
        '992-endurance-cup', 'winter-derby', 'chili-bowl', 'production-car-challenge',
        'iracing-roar', 'daytona-24', 'daytona-500', 'bathurst-12', 'sebring-12hr', 'nurburgring-24h'
    ];

    const BASE = 'https://s100.iracing.com/wp-content/uploads';
    const eventBanners = {
        'iracing-roar':         `${BASE}/2025/12/iRSE-2026-ROAR-960x576.png`,
        'daytona-24':           `${BASE}/2025/12/iRSE-2026-Daytona-24-VCO-960x576.png`,
        'daytona-500':          `${BASE}/2025/12/iRSE-2026-Daytona-500.png`,
        'bathurst-12':          `${BASE}/2025/12/iRSE-2026-Bathurst-12.png`,
        'sebring-12hr':         `${BASE}/2025/12/iRSE-2026-Sebring-12-VCO.png`,
        'nurburgring-24h':      `${BASE}/2025/12/iRSE-2026-Nurburgring-24H.png`,
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

    const parseDate = (d) => {
        if (!d) return null;
        if (typeof d.toDate === 'function') return d.toDate();
        if (d.seconds) return new Date(d.seconds * 1000);
        return new Date(d);
    };

    const eventLengths = {
        'iracing-roar': '2.4 Hours',
        'daytona-24': '24 Hours',
        'daytona-500': '500 Miles',
        'bathurst-12': '12 Hours',
        'sebring-12hr': '12 Hours',
        'nurburgring-24h': '24 Hours',
        'imsa-classic-500': '500 Miles',
        'indy-500': '500 Miles',
        'world-600': '600 Miles',
        'thruxton-4h': '4 Hours',
        'watkins-glen-6h': '6 Hours',
        'spa-24hr': '24 Hours',
        'brickyard-400': '400 Miles',
        'road-america-6h': '6 Hours',
        'knoxville-nationals': 'Sprint Format',
        'portimao-1000': '8 Hours (1000km)',
        'suzuka-1000km': '7 Hours (1000km)',
        'crandon-championship': 'Off-road Format',
        'southern-500': '500 Miles',
        'britcar-24hr': '24 Hours',
        'petit-le-mans': '10 Hours',
        'bathurst-1000': '1000km',
        'indy-8h': '8 Hours',
        'ff1600-festival': 'Festival Format',
        'homestead-championship': '400 Miles',
        'sfl-mountain-showdown': 'Sprint/Feature Format',
        'scca-runoffs': 'Championship Format',
        '992-endurance-cup': 'Endurance',
        'winter-derby': 'Derby Format',
        'chili-bowl': 'National Format',
        'production-car-challenge': 'Multi-hour Endurance'
    };

    const eventSeriesNames = {
        'iracing-roar': 'iRacing Roar Before the 24',
        'daytona-24': 'iRacing Daytona 24',
        'daytona-500': 'iRacing Daytona 500',
        'bathurst-12': 'iRacing Bathurst 12 Hour',
        'sebring-12hr': 'iRacing Sebring 12 Hour',
        'nurburgring-24h': 'iRacing Nürburgring 24h',
        'imsa-classic-500': 'iRacing IMSA Classic 500',
        'indy-500': 'iRacing Indy 500',
        'world-600': 'iRacing World 600',
        'thruxton-4h': 'iRacing 4 Hours at Thruxton',
        'watkins-glen-6h': 'iRacing Watkins Glen 6 Hour',
        'spa-24hr': 'iRacing Spa 24 Hour',
        'brickyard-400': 'iRacing Brickyard 400',
        'road-america-6h': 'iRacing Road America 6 Hour',
        'knoxville-nationals': 'iRacing Knoxville Nationals',
        'portimao-1000': 'iRacing Portimao 1000',
        'suzuka-1000km': 'iRacing Suzuka 1000km',
        'crandon-championship': 'iRacing Crandon Championship',
        'southern-500': 'iRacing Southern 500',
        'britcar-24hr': 'iRacing Britcar 24',
        'petit-le-mans': 'iRacing Petit Le Mans',
        'bathurst-1000': 'iRacing Bathurst 1000',
        'indy-8h': 'iRacing Indianapolis 8 Hour',
        'ff1600-festival': 'iRacing FF1600 Festival',
        'homestead-championship': 'iRacing Homestead Championship',
        'sfl-mountain-showdown': 'iRacing SFL Mountain Showdown',
        'scca-runoffs': 'iRacing SCCA Runoffs',
        '992-endurance-cup': 'iRacing 992 Endurance Cup',
        'winter-derby': 'iRacing Winter Derby',
        'chili-bowl': 'iRacing Chili Bowl',
        'production-car-challenge': 'iRacing Production Car Challenge'
    };

    let nextEvent = featuredOverride || (upcomingEvents.length > 0 ? upcomingEvents[0] : null);
    // Prioritize Road America 6h if it is upcoming/active
    const raEvent = upcomingEvents.find(e => e.id === 'road-america-6h');
    if (raEvent && !featuredOverride) {
        nextEvent = raEvent;
    }
    if (!nextEvent) {
        if (upcomingTrack) upcomingTrack.innerHTML = '<p style="text-align: center; color: var(--text-muted); width: 100%;">No upcoming events scheduled.</p>';
        if (fullEventList) fullEventList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Stay tuned for future event dates.</p>';
        if (heroSubtitle) heroSubtitle.textContent = 'Next Major Race: TBA';
        if (heroTitle) heroTitle.textContent = 'GRiD UP';
    } else {

        const startTime = parseDate(nextEvent.startDate);
        const endTime = nextEvent.endDate ? parseDate(nextEvent.endDate) : (startTime ? new Date(startTime) : null);
        if (endTime && !nextEvent.endDate) {
            endTime.setHours(23, 59, 59, 999);
        }
        
        const liveStart = nextEvent.practiceStart ? parseDate(nextEvent.practiceStart) : startTime;
        const isLive = now >= liveStart && now <= endTime;
        
        const hasLiveTelemetry = (typeof getActiveDriverList === 'function' && getActiveDriverList().length > 0) || Boolean(window.isSimulatingTelemetry);
        if (heroSubtitle) {
            heroSubtitle.textContent = hasLiveTelemetry ? `LIVE NOW: ${nextEvent.name || 'TBA'}` : `Next Major Race: ${nextEvent.name || 'TBA'}`;
            heroSubtitle.style.color = hasLiveTelemetry ? '#ff0055' : 'var(--primary)';
            if (hasLiveTelemetry) {
                heroSubtitle.classList.add('animate-pulse');
            } else {
                heroSubtitle.classList.remove('animate-pulse');
            }
        }

        const heroStatusBadge = document.getElementById('hero-event-status-badge');
        if (heroStatusBadge) {
            if (hasLiveTelemetry) {
                heroStatusBadge.className = 'mockup-badge-live';
                heroStatusBadge.innerHTML = '<span class="pulsing-dot-red"></span> LIVE NOW';
            } else {
                heroStatusBadge.className = 'mockup-badge-upcoming';
                heroStatusBadge.innerHTML = '<span class="pulsing-dot"></span> UPCOMING';
            }
        }
        
        if (heroTitle) {
            heroTitle.textContent = (nextEvent.name || 'TBA').toUpperCase();
        }
        
        if (heroLink) {
            heroLink.href = staticIds.includes(nextEvent.id) ? getEventLink(nextEvent.id, true) : getEventLink(nextEvent.id);
        }

        // Populate all details in the Next Event Dashboard Card (Track img, specs, schedule, metrics)
        populateNextEventDashboard(nextEvent, staticIds, eventBanners);

        window.currentNextEvent = nextEvent;
        if (typeof initHomepageLiveTelemetry === 'function') {
            initHomepageLiveTelemetry(isLive, nextEvent);
        }

        // Show Live Telemetry button if Spa 24HR or if live telemetry is currently active
        const telemetryBtn = document.getElementById('hero-telemetry-btn');
        if (telemetryBtn && !isLive) {
            telemetryBtn.style.display = (nextEvent.id === 'spa-24hr') ? 'inline-flex' : 'none';
        }

        // Populate upcoming events marquee ticker under navbar
        populateEventsTicker(upcomingEvents, staticIds);
        
        updateCountdown(nextEvent.startDate, endTime, nextEvent.broadcastUrl, nextEvent.practiceStart);


        if (upcomingTrack) {
            const newUpcomingIds = upcomingEvents.slice(0, 10).map(e => e.id).join(',');
            if (upcomingTrack.dataset.renderedIds !== newUpcomingIds) {
                upcomingTrack.dataset.renderedIds = newUpcomingIds;
                upcomingTrack.innerHTML = '';
                const colors = ['blue', 'pink', 'green'];
                upcomingEvents.slice(0, 10).forEach((e, i) => {
                    const tile = document.createElement('a');
                    tile.href = staticIds.includes(e.id) ? getEventLink(e.id, true) : getEventLink(e.id);
                    tile.className = `race-tile tile-${colors[i % 3]}`;
                    const bannerUrl = eventBanners[e.id];
                    tile.innerHTML = `
                        ${bannerUrl ? `<div class="tile-banner" style="background-image: url('${bannerUrl}')"></div>` : ''}
                        <h3>${(e.name || 'TBA').toUpperCase()}</h3>
                        <div class="race-meta">${e.date}${eventLengths[e.id] ? ` | ${eventLengths[e.id]}` : ''}</div>
                    `;
                    upcomingTrack.appendChild(tile);
                });
            }
        }

        if (fullEventList) {
            const newFullIds = upcomingEvents.map(e => e.id).join(',');
            if (fullEventList.dataset.renderedIds !== newFullIds) {
                fullEventList.dataset.renderedIds = newFullIds;
                fullEventList.innerHTML = '';
                const eventColors = ['var(--primary)', 'var(--secondary)', '#00ff88'];
                upcomingEvents.forEach((e, i) => {
                    const card = document.createElement('div');
                    card.id = `event-${e.id}`;
                    card.className = 'glass event-horizontal-card reveal active';
                    card.style.borderLeft = `4px solid ${eventColors[i % 3]}`;
                    const bannerUrl = eventBanners[e.id];
                    card.innerHTML = `
                        ${bannerUrl ? `<div class="event-card-banner" style="background-image: url('${bannerUrl}')"></div>` : ''}
                        <div class="event-info">
                            <h3>${e.name || 'TBA'}</h3>
                            ${eventSeriesNames[e.id] ? `<p style="color: var(--primary); font-size: 0.8rem; font-weight: 700; margin-top: -0.25rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Series: ${eventSeriesNames[e.id]}</p>` : ''}
                            <p class="event-meta">${e.date}${eventLengths[e.id] ? ` &bull; ${eventLengths[e.id]}` : ''}</p>
                            <p class="event-desc">${Array.isArray(e.classes) ? 'Classes: ' + e.classes.join(', ') : (e.classes ? 'Classes: ' + e.classes : 'Details coming soon.')}</p>
                        </div>
                        <div class="event-action">
                            <a href="${staticIds.includes(e.id) ? getEventLink(e.id, true) : getEventLink(e.id)}" class="btn btn-outline">Details</a>
                        </div>
                    `;
                    fullEventList.appendChild(card);
                });
            }
        }
    }

    // D. Populate Past List (Only if pastEvents is provided from Firestore)
    const pastList = document.getElementById('dynamic-past-list');
    if (pastList && pastEvents) {
        const hardcodedIds = [];
        const eventColors = ['var(--primary)', 'var(--secondary)', '#00ff88'];
        pastList.innerHTML = '';
        pastEvents.forEach((e, i) => {
            if (hardcodedIds.includes(e.id)) return;
            const card = document.createElement('div');
            card.id = `event-${e.id}`;
            card.className = 'glass event-horizontal-card reveal active';
            card.style.borderLeft = `4px solid ${eventColors[(i + hardcodedIds.length) % 3]}`;
            const bannerUrl = eventBanners[e.id];
            card.innerHTML = `
                ${bannerUrl ? `<div class="event-card-banner" style="background-image: url('${bannerUrl}')"></div>` : ''}
                <div class="event-info">
                    <h3>${e.name || 'TBA'}</h3>
                    ${eventSeriesNames[e.id] ? `<p style="color: var(--primary); font-size: 0.8rem; font-weight: 700; margin-top: -0.25rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Series: ${eventSeriesNames[e.id]}</p>` : ''}
                    <p class="event-meta">${e.date}${eventLengths[e.id] ? ` &bull; ${eventLengths[e.id]}` : ''}</p>
                    <p class="event-desc">${Array.isArray(e.classes) ? 'Classes: ' + e.classes.join(', ') : (e.classes ? 'Classes: ' + e.classes : 'Race event completed.')}</p>
                </div>
                <div class="event-action">
                    <button onclick="openEventResultsModal('${e.id}', '${(e.name || 'Event').replace(/'/g, "\\'")}')" class="btn btn-outline" style="border-color: rgba(255, 190, 11, 0.4); color: #ffbe0b;">Results</button>
                    <a href="${staticIds.includes(e.id) ? getEventLink(e.id, true) : getEventLink(e.id)}" class="btn btn-outline">Details</a>
                </div>
            `;
            pastList.appendChild(card);
        });
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
    const pastStatic = ['iracing-roar', 'daytona-24', 'daytona-500', 'bathurst-12', 'sebring-12hr'];
    const isHttp = window.location.protocol.startsWith('http');
    
    if (isHttp) {
        if (isStatic) {
            if (pastStatic.includes(id)) return `/events/past/${id}.html`;
            return `/events/${id}.html`;
        }
        return `/events/details.html?id=${encodeURIComponent(id)}`;
    } else {
        // Local file:// fallback
        const path = window.location.pathname.replace(/\\/g, '/');
        let prefix = '';
        if (path.includes('/events/past/')) {
            prefix = '../../';
        } else if (path.includes('/events/') || path.includes('/drivers/')) {
            prefix = '../';
        }
        if (isStatic) {
            if (pastStatic.includes(id)) return `${prefix}events/past/${id}.html`;
            return `${prefix}events/${id}.html`;
        }
        return `${prefix}events/details.html?id=${encodeURIComponent(id)}`;
    }
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
            const genericNames = ['details', 'events', 'index', 'admin', 'roster', 'team-app'];
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

            // Feedback for empty results
            const noResults = document.createElement('section');
            noResults.className = 'event-section reveal active results-pending-placeholder';
            noResults.style.textAlign = 'center';
            noResults.innerHTML = `
                <h2>TEAM RESULTS</h2>
                <div class="glass sidebar-card" style="padding: 1.5rem; margin-top: 1rem;">
                    <p style="color: var(--primary); font-family: var(--font-heading); font-size: 0.95rem; letter-spacing: 1px; margin-bottom: 0.5rem; text-transform: uppercase;">Race Results Pending</p>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0;">Official team results for this event haven't been recorded yet. Check back soon!</p>
                </div>
            `;
            targetElement.after(noResults);
            return;
        }

        // Sort by team name based on priority list
        const docs = [];
        snap.forEach(doc => docs.push(doc.data()));
        
        const teamOrder = ["GRiD UP Sim Racing", "GRiD UP White", "GRiD UP Black", "GRiD UP Blue", "GRiD UP Red", "GRiD UP Purple"];
        docs.sort((a, b) => {
            const orderA = teamOrder.indexOf(a.teamName);
            const orderB = teamOrder.indexOf(b.teamName);
            const valA = orderA === -1 ? 99 : orderA;
            const valB = orderB === -1 ? 99 : orderB;
            return valA - valB;
        });

        console.log(`Rendering ${docs.length} results for ${eventId}`);
        const resultsContainer = document.createElement('section');
        resultsContainer.className = 'event-section reveal active event-results-container';
        
        // Remove any existing "Pending" messages or previous results
        const existing = targetElement.parentNode.querySelectorAll('.event-results-container, .results-pending-placeholder');
        existing.forEach(el => el.remove());
        
        let rowsHtml = '';
        docs.forEach(d => {
            const drivers = Array.isArray(d.drivers) ? d.drivers.join(', ') : (d.drivers || '');
            const finishPos = (d.finish || '-').trim();
            
            // Finish color styling matching event podiums and results modal
            let finishStyle = 'color: #ffbe0b;';
            if (finishPos.toUpperCase() === 'P1') {
                finishStyle = 'color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);';
            } else if (finishPos.toUpperCase() === 'P2') {
                finishStyle = 'color: #e2e8f0; text-shadow: 0 0 10px rgba(226, 232, 240, 0.3);';
            } else if (finishPos.toUpperCase() === 'P3') {
                finishStyle = 'color: #f59e0b; text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);';
            } else if (/^P([4-5])$/i.test(finishPos)) {
                finishStyle = 'color: #00ff88;';
            } else if (/^P([6-9]|10)$/i.test(finishPos)) {
                finishStyle = 'color: #00cfff;';
            }
            
            rowsHtml += `
                <tr>
                    <td>
                        <div class="team-results-team-name">${d.teamName || 'GRiD UP'}</div>
                        <div class="team-results-car-name">${d.car || ''}</div>
                        ${drivers ? `<div class="team-results-drivers">${drivers}</div>` : ''}
                    </td>
                    <td class="team-results-qualy">
                        ${d.qualy || '-'}
                    </td>
                    <td>
                        <span class="team-results-finish" style="${finishStyle}">${finishPos}</span>
                    </td>
                </tr>
            `;
        });

        resultsContainer.innerHTML = `
            <h2>TEAM RESULTS</h2>
            <div class="results-table-container" style="overflow-x: auto;">
                <table class="team-results-table">
                    <thead>
                        <tr>
                            <th>Team / Car</th>
                            <th>Qualy</th>
                            <th>Finish</th>
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

// Global Event Results Modal (Matching user Image 1)
async function openEventResultsModal(eventId, eventName = '') {
    const modal = document.getElementById('event-results-modal');
    const container = document.getElementById('event-results-modal-container');
    const content = document.getElementById('event-results-modal-content');
    
    if (!modal || !content) {
        // Fallback: If modal container isn't present on page, navigate to details page
        window.location.href = getEventLink(eventId, true);
        return;
    }

    modal.style.display = 'flex';
    setTimeout(() => { if (container) container.style.transform = 'scale(1)'; }, 10);
    document.body.style.overflow = 'hidden';

    content.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div class="loading-shimmer" style="height: 200px; border-radius: 12px; width: 100%;"></div>
            <p style="color: var(--text-muted); margin-top: 1rem; font-size: 0.9rem;">Fetching team classification...</p>
        </div>
    `;

    try {
        let snap = await db.collection("event_results")
            .where("eventId", "in", [eventId, eventId.toLowerCase(), eventId.toUpperCase(), eventId.replace(/-/g, ' ')])
            .get();

        if (snap.empty) {
            // Try name match search
            const cleanName = eventName || eventId.replace(/-/g, ' ');
            const eventSearch = await db.collection("events").where("name", ">=", cleanName).where("name", "<=", cleanName + '\uf8ff').get();
            if (!eventSearch.empty) {
                const actualId = eventSearch.docs[0].id;
                snap = await db.collection("event_results").where("eventId", "==", actualId).get();
            }
        }

        if (snap.empty) {
            content.innerHTML = `
                <div style="text-align: center; padding: 2.5rem 1rem;">
                    <h3 style="color: var(--primary); margin-bottom: 0.75rem; font-family: var(--font-heading); letter-spacing: 1px;">RESULTS PENDING</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">Official team results for ${eventName || eventId} have not been published yet.</p>
                    <a href="${getEventLink(eventId, true)}" class="btn btn-outline" style="font-size: 0.85rem;">View Event Details</a>
                </div>
            `;
            return;
        }

        const docs = [];
        snap.forEach(doc => docs.push(doc.data()));
        
        const teamOrder = ["GRiD UP Sim Racing", "GRiD UP White", "GRiD UP Black", "GRiD UP Blue", "GRiD UP Red", "GRiD UP Purple"];
        docs.sort((a, b) => {
            const orderA = teamOrder.indexOf(a.teamName);
            const orderB = teamOrder.indexOf(b.teamName);
            const valA = orderA === -1 ? 99 : orderA;
            const valB = orderB === -1 ? 99 : orderB;
            return valA - valB;
        });

        let rowsHtml = '';
        docs.forEach(d => {
            const drivers = Array.isArray(d.drivers) ? d.drivers.join(', ') : (d.drivers || '');
            rowsHtml += `
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                    <td style="padding: 1.1rem 1rem; text-align: left;">
                        <strong style="color: #ffffff; font-size: 0.95rem; letter-spacing: 0.5px;">${d.teamName || 'GRiD UP'}</strong><br>
                        <span style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.15rem; display: inline-block;">${d.car || ''}</span><br>
                        ${drivers ? `<span style="font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; display: inline-block;">${drivers}</span>` : ''}
                    </td>
                    <td style="padding: 1.1rem 1rem; text-align: left; font-family: var(--font-heading); color: #94a3b8; font-size: 0.9rem;">
                        ${d.qualy || '-'}
                    </td>
                    <td style="padding: 1.1rem 1rem; text-align: right;">
                        <strong style="font-family: var(--font-heading); color: #ffbe0b; font-weight: 900; font-size: 1.25rem; letter-spacing: 0.5px;">${d.finish || '-'}</strong>
                    </td>
                </tr>
            `;
        });

        content.innerHTML = `
            <div style="margin-bottom: 1.5rem; padding-right: 2rem;">
                <h2 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 900; letter-spacing: 2px; color: #ff334b; text-transform: uppercase; margin: 0;">TEAM RESULTS</h2>
                ${eventName ? `<p style="font-size: 0.85rem; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; margin-top: 0.25rem;">${eventName}</p>` : ''}
            </div>
            <div class="results-table-container" style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.12); text-align: left;">
                            <th style="padding: 0.75rem 1rem; font-family: var(--font-heading); font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Team / Car</th>
                            <th style="padding: 0.75rem 1rem; font-family: var(--font-heading); font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Qualy</th>
                            <th style="padding: 0.75rem 1rem; font-family: var(--font-heading); font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Finish</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 1.5rem; text-align: center;">
                <a href="${getEventLink(eventId, true)}" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.4rem 1.2rem;">View Full Event Details</a>
            </div>
        `;

    } catch (err) {
        console.error("Error in openEventResultsModal:", err);
        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: #ff334b;">Failed to load results. Please try again.</p>
            </div>
        `;
    }
}

function closeEventResultsModal() {
    const container = document.getElementById('event-results-modal-container');
    if (container) container.style.transform = 'scale(0.95)';
    setTimeout(() => {
        const modal = document.getElementById('event-results-modal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 250);
}

// 2. Load Recent Results (Race Cards)

async function loadRecentResults() {
    const resultsTrack = document.getElementById('results-track');
    if (!resultsTrack) return;

    // Homepage optimization: only load 8 most recent results for carousel to minimize image memory
    const isHomePage = !!document.getElementById('home') || !!document.getElementById('dynamic-upcoming-track');
    const resultLimit = isHomePage ? 8 : 30;

    // Attempt to load from cache first
    const cachedResults = localStorage.getItem('gridup_recent_results');
    let cacheLoaded = false;
    if (cachedResults && !window.recentResultsLoaded) {
        try {
            console.log("Loading recent results from cache...");
            const parsed = JSON.parse(cachedResults);
            const toRender = isHomePage ? parsed.slice(0, resultLimit) : parsed;
            renderRecentResultsUI(toRender);
            cacheLoaded = true;
        } catch (e) {
            console.warn("Failed to load results from cache:", e);
        }
    }

    if (!cacheLoaded && !resultsTrack.dataset.renderedFingerprint) resultsTrack.innerHTML = getSkeletonHTML('card');

    if (typeof db === 'undefined') return;

    try {
        const snap = await db.collection("race_results")
            .orderBy("timestamp", "desc")
            .limit(resultLimit)
            .get();

        if (snap.empty) {
            resultsTrack.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">No recent results to show.</p>';
        } else {
            const results = [];
            snap.forEach(doc => results.push(doc.data()));
            if (!isHomePage) {
                localStorage.setItem('gridup_recent_results', JSON.stringify(results));
            }
            renderRecentResultsUI(results);
            window.recentResultsLoaded = true;
        }
    } catch (error) {
        console.error("Error loading results:", error);
        if (!cacheLoaded) resultsTrack.innerHTML = '<p style="color: #ff0055; grid-column: 1/-1;">Failed to load results.</p>';
    }
}

function renderRecentResultsUI(results) {
    const resultsTrack = document.getElementById('results-track');
    if (!resultsTrack) return;
    
    const resultsFingerprint = results.map(d => `${d.trackName || d.eventName || ''}-${d.position || ''}-${d.raceDate || ''}`).join('|');
    if (resultsTrack.dataset.renderedFingerprint === resultsFingerprint) {
        return;
    }
    resultsTrack.dataset.renderedFingerprint = resultsFingerprint;
    resultsTrack.innerHTML = '';

    
    results.forEach(d => {
        const card = document.createElement('div');
        card.className = 'card cinematic-poster reveal active';
        card.style.cursor = 'pointer';
        card.onclick = () => openCardModal(d);

        const isPoster = (d.rawUrl && d.teamAsset && d.rawUrl === d.teamAsset) || d.type === "cinematic-poster";
        const bgImg = d.teamAsset || d.rawUrl || "assets/poster-placeholder.png";
        const fgImg = !isPoster && d.rawUrl && d.teamAsset && d.rawUrl !== d.teamAsset ? d.rawUrl : null;

        if (isPoster) {
            card.innerHTML = `
                <img src="${bgImg}" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover; border-radius: inherit; display:block;">
                <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,207,255,0.08); opacity:0; transition:opacity 0.3s; z-index:6; border-radius:inherit;" class="hover-overlay">
                    <div style="padding:0.75rem 1.5rem; border:2px solid var(--primary); color:var(--primary); font-weight:800; font-size:0.8rem; letter-spacing:2px; border-radius:4px; backdrop-filter:blur(5px);">VIEW POSTER</div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <img src="${bgImg}" class="bg-layer" loading="lazy" decoding="async">
                ${fgImg ? `<img src="${fgImg}" class="fg-layer" loading="lazy" decoding="async">` : ''}
                <img src="assets/logo.png" class="event-branding" loading="lazy" decoding="async" onerror="this.style.display='none'">
                <div class="gradient-overlay"></div>
                <div class="text-overlay" style="top: 1.5rem; left: 1.5rem; text-align: left;">
                    <div style="font-size: 0.6rem; color: var(--primary); font-weight: 900; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 0.2rem;">GRiD UP // SPECIAL EVENT</div>
                    <div style="font-size: 1.6rem; font-weight: 900; line-height: 1.1; letter-spacing: -0.5px;">${(d.trackName || d.eventName || 'RACE EVENT').toUpperCase()}</div>
                    <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.4rem; font-weight: 600;">${d.raceDate || ''}</div>
                </div>
                <div class="text-overlay" style="top: 1.5rem; right: 1.5rem; text-align: right;">
                    <div style="font-size: 0.75rem; font-weight: 800; opacity: 0.9; color: var(--primary);">${d.carUsed || 'GT3'}</div>
                    <div style="font-size: 1.2rem; font-weight: 900; margin-top: 0.2rem;">FINISH: ${d.position}</div>
                    ${d.startPos ? `<div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.1rem;">STARTED: ${d.startPos}</div>` : ''}
                </div>
                <div class="text-overlay" style="bottom: 1.5rem; left: 1.5rem; right: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="text-align: left;">
                        <div style="font-size: 1.1rem; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">${Array.isArray(d.drivers) ? d.drivers.join(' - ') : d.drivers}</div>
                        <div style="font-size: 0.6rem; color: var(--primary); font-weight: 700; margin-top: 0.2rem; letter-spacing: 2px;">CONFIRMED TEAM ENTRY</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 0.6rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px);">
                        <img src="assets/logo.png" style="height: 25px;" loading="lazy" decoding="async" onerror="this.style.display='none'">
                    </div>
                </div>
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

let ALL_RESULTS_REALTIME_INITIALIZED = false;

// 3. Load ALL Results (for results.html)
async function loadAllResults() {
    const allResultsGrid = document.getElementById('text-results-container');
    if (!allResultsGrid) return;
    
    // Set up real-time listener if on results page so additions/edits reflect immediately
    if (!ALL_RESULTS_REALTIME_INITIALIZED && typeof db !== 'undefined') {
        ALL_RESULTS_REALTIME_INITIALIZED = true;
        try {
            let isFirst = true;
            db.collection("event_results").onSnapshot(() => {
                if (isFirst) { isFirst = false; return; }
                console.log("Real-time results update received, refreshing results...");
                loadAllResults();
            }, err => console.warn("Firestore onSnapshot error on event_results:", err));
        } catch (e) {
            console.warn("Failed to set up realtime listener on event_results:", e);
        }
    }
    
    try {
        allResultsGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); width: 100%;">Loading text results data...</p>';
        
        // 1. Fetch all event_results (the text data)
        const resultsSnap = await db.collection("event_results")
            .orderBy("timestamp", "desc")
            .get();

        if (resultsSnap.empty) {
            allResultsGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); width: 100%;">No results found.</p>';
            return;
        }

        // 2. Fetch all events to map eventId -> event details
        const eventsSnap = await db.collection("events").get();
        const eventsMap = {};
        eventsSnap.forEach(doc => {
            eventsMap[doc.id] = doc.data();
        });

        // 3. Group results by eventId
        const groupedResults = {};
        
        resultsSnap.forEach(doc => {
            const data = doc.data();
            const eId = data.eventId;
            
            // Skip league event results from global view
            if (eId && eId.startsWith('gtc-')) return;
            
            if (!groupedResults[eId]) {
                groupedResults[eId] = [];
            }
            groupedResults[eId].push(data);
        });

        // 4. Sort event IDs strictly by event date (chronological / newest event first)
        const MONTH_MAP = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        function getEventSortTimestamp(eId, evData, rList) {
            // A. Exact eventsMap match with startDate (e.g. ISO timestamp "2026-09-25T22:00:00Z")
            if (evData && evData.startDate) {
                const t = new Date(evData.startDate).getTime();
                if (!isNaN(t)) return t;
            }
            // B. Exact eventsMap match with date string (e.g. "Sept 25-27", "June 19-21")
            if (evData && evData.date) {
                const m = evData.date.match(/([a-zA-Z]+)\s*(\d+)/);
                if (m) {
                    const mon = m[1].slice(0, 3).toLowerCase();
                    if (mon in MONTH_MAP) {
                        const is25 = eId.includes('-25') || eId.includes('2025');
                        const year = is25 ? 2025 : 2026;
                        return new Date(year, MONTH_MAP[mon], parseInt(m[2], 10)).getTime();
                    }
                }
            }
            // C. Match clean event id (e.g. daytona-24h-26 -> daytona-24) if not 2025
            const is25 = eId.includes('-25') || eId.includes('2025');
            if (!is25) {
                const cleanId = eId.replace(/(\d+)(h|hr)$/, '$1').replace(/-26$/, '');
                if (eventsMap[cleanId] && eventsMap[cleanId].startDate) {
                    const t = new Date(eventsMap[cleanId].startDate).getTime();
                    if (!isNaN(t)) return t;
                }
            }
            // D. Result document timestamps (excluding today's upload timestamp if older ones exist)
            if (rList && rList.length > 0) {
                for (const r of rList) {
                    const ts = r.timestamp;
                    if (ts && !String(ts).startsWith('2026-09-27')) {
                        const t = new Date(ts).getTime();
                        if (!isNaN(t)) return t;
                    }
                }
                const firstTs = rList[0].timestamp;
                if (firstTs) {
                    const t = new Date(firstTs).getTime();
                    if (!isNaN(t)) return t;
                }
            }
            // E. Fallback by season year
            return new Date(is25 ? 2025 : 2026, 0, 1).getTime();
        }

        const orderedEventIds = Object.keys(groupedResults).sort((a, b) => {
            const timeA = getEventSortTimestamp(a, eventsMap[a], groupedResults[a]);
            const timeB = getEventSortTimestamp(b, eventsMap[b], groupedResults[b]);
            return timeB - timeA; // Descending: newest event first
        });

        allResultsGrid.innerHTML = '';

        // 4. Render each group
        orderedEventIds.forEach(eId => {
            const eventData = eventsMap[eId] || { name: eId.replace(/-/g, ' ').toUpperCase(), date: '' };
            const results = groupedResults[eId];
            
            // Sort results by specified team priority order
            const teamOrder = ["GRiD UP Sim Racing", "GRiD UP White", "GRiD UP Black", "GRiD UP Blue", "GRiD UP Red", "GRiD UP Purple"];
            results.sort((a, b) => {
                const orderA = teamOrder.indexOf(a.teamName);
                const orderB = teamOrder.indexOf(b.teamName);
                const valA = orderA === -1 ? 99 : orderA;
                const valB = orderB === -1 ? 99 : orderB;
                return valA - valB;
            });

            // Build rows
            let rowsHtml = '';
            results.forEach(d => {
                const drivers = Array.isArray(d.drivers) ? d.drivers.join(', ') : (d.drivers || 'TBA');
                rowsHtml += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                        <td class="col-team" style="padding: 0.5rem 0.75rem;">
                            <strong style="color: var(--text); font-size: 0.9rem; letter-spacing: 0.5px;">${d.teamName || 'GRiD UP'}</strong>
                            <span style="font-size: 0.75rem; color: var(--primary); margin-left: 0.5rem;">${d.car || 'TBA'}</span><br>
                            <span style="font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; display: block; margin-top: 0.1rem;">${drivers}</span>
                        </td>
                        <td class="col-qualy" style="padding: 0.5rem 0.75rem; width: 120px; text-align: center; white-space: nowrap;">
                            <span style="color: var(--text-muted); font-size: 0.85rem; font-variant-numeric: tabular-nums; display: inline-block;">${d.qualy || '-'}</span>
                        </td>
                        <td class="col-finish" style="padding: 0.5rem 0.75rem; width: 120px; text-align: center; white-space: nowrap;">
                            <strong style="color: var(--primary); font-weight: 900; font-size: 1rem; font-variant-numeric: tabular-nums; display: inline-block;">${d.finish || '-'}</strong>
                        </td>
                    </tr>
                `;
            });

            // Build section
            const section = document.createElement('section');
            section.className = 'glass card reveal active event-result-block';
            section.style.padding = '1.5rem 2rem'; // Compact the outer block padding
            section.innerHTML = `
                <div style="margin-bottom: 1rem; border-bottom: 1px solid rgba(0, 207, 255, 0.2); padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: baseline;">
                    <h2 style="color: var(--primary); font-size: 1.4rem; letter-spacing: 1px; margin-bottom: 0;">${eventData.name || eId}</h2>
                    <p style="color: var(--text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0;">${eventData.date || ''}</p>
                </div>
                <div class="results-table-container" style="overflow-x: auto;">
                    <table style="width: 100%; table-layout: fixed; border-collapse: collapse; color: var(--text-muted); font-size: 0.85rem;">
                        <colgroup>
                            <col class="col-team" style="width: auto;">
                            <col class="col-qualy" style="width: 120px;">
                            <col class="col-finish" style="width: 120px;">
                        </colgroup>
                        <thead>
                            <tr style="border-bottom: 1px solid var(--glass-border);">
                                <th class="col-team" style="padding: 0.5rem 0.75rem; font-size: 0.7rem; text-align: left;">Team / Car / Drivers</th>
                                <th class="col-qualy" style="padding: 0.5rem 0.75rem; font-size: 0.7rem; width: 120px; text-align: center;">Qualy</th>
                                <th class="col-finish" style="padding: 0.5rem 0.75rem; font-size: 0.7rem; width: 120px; text-align: center;">Finish</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;
            allResultsGrid.appendChild(section);
        });

    } catch (error) {
        console.error("Error loading text results:", error);
        allResultsGrid.innerHTML = '<p style="color: #ff0055; width: 100%; text-align: center;">Failed to load data.</p>';
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
        // Direct download if high-res visual poster file exists
        if (d.rawUrl && typeof d.rawUrl === 'string' && (d.rawUrl.endsWith('.png') || d.rawUrl.endsWith('.jpg') || d.rawUrl.endsWith('.jpeg') || d.rawUrl.endsWith('.gif'))) {
            const link = document.createElement('a');
            link.download = `GRiDUP_${(d.eventName || 'Race').replace(/[^a-zA-Z0-9]/g, '_')}_Poster.png`;
            link.href = d.rawUrl;
            link.click();
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            return;
        }

        // 1. Load All Assets with CORS support for custom composite card
        const bgUrl = d.teamAsset || d.rawUrl || "assets/poster-placeholder.png";
        const fgUrl = null; 
        
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
        // Release 1920x1080 canvas buffer immediately to reclaim memory
        if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
        }
    }
}
// Initialize on page load
function initializeApp() {
    injectCredits();
    initHeroVideoOptimizer();

    // Prevent running public homepage queries/intervals on admin or portal dashboards
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin') || path.includes('portal') || path.includes('driver-stats')) {
        return;
    }

    renderHeroTimeslots(); // Format timeslots in user local timezone immediately
    loadDynamicContent(); // Load from cache immediately
    loadRecentResults(); // Load from cache immediately
    initCarousel();
    startRealTimeEventCheck(); // Start real-time event conclusion monitor
    
    // Poll for Firestore 'db' initialization from auth.js
    const dbCheckInterval = setInterval(() => {
        if (typeof db !== 'undefined') {
            loadDynamicContent();
            loadRecentResults();
            loadAllResults();
            syncHomepagePodiums();
            checkLiveStreams();
            // Re-initialize carousel logic after a short delay to catch dynamic elements
            setTimeout(initCarousel, 1000);
            clearInterval(dbCheckInterval);
        }
    }, 100);
    
    // Safety timeout to avoid infinite polling if Firestore fails
    setTimeout(() => clearInterval(dbCheckInterval), 5000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function startRealTimeEventCheck() {
    setInterval(() => {
        if (document.hidden) return; // Skip if tab is inactive
        const cachedEvents = localStorage.getItem('gridup_upcoming_events');
        if (cachedEvents) {
            try {
                const data = JSON.parse(cachedEvents);
                if (data.length > 0) {
                    const now = new Date();
                    const parseDate = (d) => {
                        if (!d) return null;
                        if (typeof d.toDate === 'function') return d.toDate();
                        if (d.seconds) return new Date(d.seconds * 1000);
                        return new Date(d);
                    };
                    const firstEventEnd = data[0].endDate ? parseDate(data[0].endDate) : (data[0].startDate ? new Date(data[0].startDate) : null);
                    if (firstEventEnd && !data[0].endDate) {
                        firstEventEnd.setHours(23, 59, 59, 999);
                    }
                    
                    if (firstEventEnd && now > firstEventEnd) {
                        console.log("Real-time event transition check: Active event has ended! Reloading events...");
                        localStorage.removeItem('gridup_upcoming_events');
                        window.dynamicContentLoaded = false;
                        loadDynamicContent();
                    }
                }
            } catch (e) {
                console.warn("Error in real-time event transition check:", e);
            }
        }
    }, 60000);
}

function injectCredits() {
    if (document.querySelector('.bizare-credits')) return;
    const footer = document.querySelector('footer');
    if (!footer) return;
    
    const credits = document.createElement('a');
    credits.href = 'https://bizare.shop/';
    credits.target = '_blank';
    credits.rel = 'noopener';
    credits.className = 'bizare-credits';
    credits.innerHTML = 'Created by BiZaRe';

    const footerCenter = footer.querySelector('.footer-center');
    if (footerCenter) {
        footerCenter.prepend(credits);
    } else {
        footer.prepend(credits);
    }
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

// Dynamic Firestore synchronization for homepage official podium finishes
function syncHomepagePodiums() {
    const listEl = document.getElementById('mockup-recent-results-list');
    if (!listEl) return;
    const dbInstance = (typeof window.db !== 'undefined' && window.db) || (typeof db !== 'undefined' && db);
    if (!dbInstance || typeof dbInstance.collection !== 'function') return;

    try {
        dbInstance.collection('event_results').onSnapshot(snapshot => {
            if (!snapshot || snapshot.empty) return;
            let p1 = 0, p2 = 0, p3 = 0, total = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                const team = (data.teamName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const eventId = (data.eventId || '').toLowerCase();
                if (!team.includes('gridup') || eventId.startsWith('gtc-')) return;
                const rawPos = String(data.finishPosition || data.position || data.finish || '').trim().toUpperCase();
                if (rawPos === 'P1' || rawPos === '1' || rawPos === '1ST' || rawPos === 'FIRST') { p1++; total++; }
                else if (rawPos === 'P2' || rawPos === '2' || rawPos === '2ND' || rawPos === 'SECOND') { p2++; total++; }
                else if (rawPos === 'P3' || rawPos === '3' || rawPos === '3RD' || rawPos === 'THIRD') { p3++; total++; }
            });

            // Update badge count
            const badge = document.getElementById('podium-badge-count');
            if (badge) badge.textContent = `${total} PODIUMS RECORDED`;

            // Update filter button labels with live counts
            const btnP1 = document.querySelector('.podium-filter-btn[data-filter="P1"]');
            if (btnP1) btnP1.textContent = `🥇 P1 WINS (${p1})`;
            const btnP2 = document.querySelector('.podium-filter-btn[data-filter="P2"]');
            if (btnP2) btnP2.textContent = `🥈 P2 PODIUMS (${p2})`;
            const btnP3 = document.querySelector('.podium-filter-btn[data-filter="P3"]');
            if (btnP3) btnP3.textContent = `🥉 P3 PODIUMS (${p3})`;
            const btnAll = document.querySelector('.podium-filter-btn[data-filter="ALL"]');
            if (btnAll) btnAll.textContent = `ALL PODIUMS (${total})`;
        }, err => {
            console.warn('Realtime podium sync error:', err);
        });
    } catch (e) {
        console.warn('Error setting up homepage podium sync:', e);
    }
}
window.syncHomepagePodiums = syncHomepagePodiums;
document.addEventListener('DOMContentLoaded', () => {
    if (typeof db !== 'undefined' || typeof window.db !== 'undefined') {
        syncHomepagePodiums();
    }
});

// Client-side podium filter handler for the homepage dashboard
window.filterPodiumResults = function(filter) {
    const buttons = document.querySelectorAll('.podium-filter-btn');
    buttons.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const cards = document.querySelectorAll('#mockup-recent-results-list .result-entry-card');
    cards.forEach(card => {
        if (filter === 'LAST2') {
            card.style.display = card.dataset.recent === 'true' ? 'flex' : 'none';
        } else if (filter === 'ALL') {
            card.style.display = 'flex';
        } else if (filter === 'P1') {
            card.style.display = card.classList.contains('p1-card') ? 'flex' : 'none';
        } else if (filter === 'P2') {
            card.style.display = card.classList.contains('p2-card') ? 'flex' : 'none';
        } else if (filter === 'P3') {
            card.style.display = card.classList.contains('p3-card') ? 'flex' : 'none';
        }
    });
};

// ==========================================================================
// HOMEPAGE LIVE TELEMETRY COCKPIT ENGINE
// ==========================================================================
const TELEMETRY_RTDB_URL = "https://grid-up-racedash-default-rtdb.europe-west1.firebasedatabase.app";
const DEFAULT_TELEMETRY_TEAMS = [
    { id: 'gridUp_sim', name: 'GRiD UP Sim Racing', color: '#00cfff' },
    { id: 'gridUp_black', name: 'GRiD UP Black', color: '#222222' },
    { id: 'gridUp_blue', name: 'GRiD UP Blue', color: '#0066ff' },
    { id: 'gridUp_red', name: 'GRiD UP Red', color: '#ff0033' },
    { id: 'gridUp_white', name: 'GRiD UP White', color: '#ffffff' },
    { id: 'gridUp_purple', name: 'GRiD UP Purple', color: '#a855f7' },
    { id: 'gridUp_practice', name: 'Practice Server', color: '#fbbf24' }
];

let availableTelemetryTeams = [...DEFAULT_TELEMETRY_TEAMS];
const TELEMETRY_TEAMS = ['gridUp_sim', 'gridUp_black', 'gridUp_blue', 'gridUp_red', 'gridUp_white', 'gridUp_purple', 'gridUp_practice'];

let homeTelemetryApp = null;
let homeTelemetryDb = null;
let activeTelemetryStreams = {}; // key: `${teamId}_${mid}` -> { teamId, mid, stream, driverPresence }
let activeTelemetryDrivers = {}; // key: `${teamId}_${mid}` -> driver presence
let homeTelemetryListeners = [];
let homeTelemetryPollTimer = null;
let selectedTelemetryTeamId = null;
let userManuallySelectedTeam = false;
let selectedTelemetryKey = null;
let isHomepageTelemetryActive = false;
let isSimulatingTelemetry = false;
let simulatedTelemetryInterval = null;

function getHomeTelemetryDb() {
    if (homeTelemetryDb) return homeTelemetryDb;
    if (typeof firebase === 'undefined' || typeof firebase.database !== 'function') return null;
    try {
        homeTelemetryApp = firebase.apps.find(app => app.name === "home-telemetry");
        if (!homeTelemetryApp) {
            homeTelemetryApp = firebase.initializeApp({
                databaseURL: TELEMETRY_RTDB_URL
            }, "home-telemetry");
        }
        homeTelemetryDb = homeTelemetryApp.database();
        return homeTelemetryDb;
    } catch (e) {
        console.warn("[Telemetry HUD] Failed to initialize Firebase RTDB app:", e);
        try {
            if (typeof firebase.database === 'function') {
                homeTelemetryDb = firebase.database();
                return homeTelemetryDb;
            }
        } catch (err) {}
        return null;
    }
}

function syncAvailableTelemetryTeams() {
    const db = getHomeTelemetryDb();
    if (db) {
        db.ref('teams/meta_teams').once('value', snapshot => {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                const list = [];
                Object.keys(data).forEach(key => {
                    const t = data[key];
                    if (t.enabled !== false) {
                        list.push({
                            id: key,
                            name: t.name || key,
                            color: t.color || '#00cfff',
                            order: t.order || 99
                        });
                    }
                });
                list.sort((a, b) => a.order - b.order);
                if (list.length > 0) {
                    availableTelemetryTeams = list;
                    updateHomepageTeamDropdown();
                }
            }
        });
    } else {
        fetch(`${TELEMETRY_RTDB_URL}/teams/meta_teams.json`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && typeof data === 'object') {
                    const list = [];
                    Object.keys(data).forEach(key => {
                        const t = data[key];
                        if (t.enabled !== false) {
                            list.push({
                                id: key,
                                name: t.name || key,
                                color: t.color || '#00cfff',
                                order: t.order || 99
                            });
                        }
                    });
                    list.sort((a, b) => a.order - b.order);
                    if (list.length > 0) {
                        availableTelemetryTeams = list;
                        updateHomepageTeamDropdown();
                    }
                }
            }).catch(() => {});
    }
}

function stopHomepageLiveTelemetry() {
    if (!isHomepageTelemetryActive && !isSimulatingTelemetry) return;
    isHomepageTelemetryActive = false;

    if (homeTelemetryListeners && homeTelemetryListeners.length > 0) {
        homeTelemetryListeners.forEach(cleanupFn => {
            try { cleanupFn(); } catch (e) {}
        });
        homeTelemetryListeners = [];
    }

    if (homeTelemetryPollTimer) {
        clearInterval(homeTelemetryPollTimer);
        homeTelemetryPollTimer = null;
    }

    if (simulatedTelemetryInterval) {
        clearInterval(simulatedTelemetryInterval);
        simulatedTelemetryInterval = null;
    }
    isSimulatingTelemetry = false;

    activeTelemetryStreams = {};
    activeTelemetryDrivers = {};
    selectedTelemetryKey = null;
    userManuallySelectedTeam = false;

    const hud = document.getElementById('hero-live-telemetry-hud');
    if (hud) hud.style.display = 'none';

    const telBtn = document.getElementById('hero-telemetry-btn');
    if (telBtn) {
        const nextEvent = window.currentNextEvent;
        telBtn.style.display = (nextEvent && nextEvent.id === 'spa-24hr') ? 'inline-flex' : 'none';
    }
}

function isTelemetryStreamActive(stream, now) {
    if (!stream) return false;
    let streamTs = stream.timestamp || (stream.telemetry && stream.telemetry.timestamp) || 0;
    if (streamTs > 0 && streamTs < 10000000000) {
        streamTs *= 1000;
    }
    const isRecent = streamTs > 0 && (now - streamTs) < 120000; // active within last 2 minutes
    const isLiveFlag = stream.is_live === true || (stream.session && stream.session.is_live === true);
    return isRecent && (isLiveFlag || stream.is_live !== false);
}

function getActiveDriverList() {
    const now = Date.now();
    const active = [];
    Object.keys(activeTelemetryStreams).forEach(key => {
        const item = activeTelemetryStreams[key];
        if (!item || !item.stream) return;
        if (isTelemetryStreamActive(item.stream, now)) {
            active.push(item);
        }
    });
    return active;
}

function updateHomepageTeamDropdown(activeTeamIds) {
    const selectEl = document.getElementById('hero-tel-team-select');
    if (!selectEl) return;

    const optionsHtml = availableTelemetryTeams.map(t => {
        const isActive = activeTeamIds.has(t.id);
        const prefix = isActive ? '🟢 ' : '';
        const suffix = isActive ? ' (Active)' : '';
        return `<option value="${t.id}" ${t.id === selectedTelemetryTeamId ? 'selected' : ''}>${prefix}${t.name}${suffix}</option>`;
    }).join('');

    selectEl.innerHTML = optionsHtml;
    selectEl.value = selectedTelemetryTeamId;
}

function renderHomepageTelemetryHUD() {
    const hud = document.getElementById('hero-live-telemetry-hud');
    const heroStatusBadge = document.getElementById('hero-event-status-badge');
    const heroSubtitle = document.getElementById('hero-event-subtitle');
    const telBtn = document.getElementById('hero-telemetry-btn');
    const countdownEl = document.getElementById('countdown');

    const activeDrivers = getActiveDriverList();
    const isTelemetryStreaming = activeDrivers.length > 0 || Boolean(window.isSimulatingTelemetry);

    // If NO active telemetry streaming, revert HUD, Status, Subtitle, and Countdown immediately without refresh
    if (!isTelemetryStreaming) {
        if (hud) hud.style.display = 'none';
        if (heroStatusBadge) {
            heroStatusBadge.className = 'mockup-badge-upcoming';
            heroStatusBadge.innerHTML = '<span class="pulsing-dot"></span> UPCOMING';
        }
        if (heroSubtitle && window.currentNextEvent) {
            heroSubtitle.textContent = `Next Major Race: ${window.currentNextEvent.name || 'TBA'}`;
            heroSubtitle.style.color = 'var(--primary)';
            heroSubtitle.classList.remove('animate-pulse');
        }
        if (telBtn) {
            const nextEvent = window.currentNextEvent;
            telBtn.style.display = (nextEvent && nextEvent.id === 'spa-24hr') ? 'inline-flex' : 'none';
        }

        // Restore countdown timer if it was showing LIVE NOW / RACE DAY
        if (countdownEl && (countdownEl.querySelector('.glow-text.animate-pulse') || countdownEl.querySelector('.live-player-container'))) {
            countdownEl.innerHTML = `
                <div class="mockup-countdown-grid">
                    <div class="cd-box"><span id="days" class="cd-num">00</span><span class="cd-lbl">DAYS</span></div>
                    <div class="cd-box"><span id="hours" class="cd-num">00</span><span class="cd-lbl">HOURS</span></div>
                    <div class="cd-box"><span id="minutes" class="cd-num">00</span><span class="cd-lbl">MINS</span></div>
                    <div class="cd-box"><span id="seconds" class="cd-num">00</span><span class="cd-lbl">SECS</span></div>
                </div>
            `;
            if (window.currentNextEvent) {
                updateCountdown(window.currentNextEvent.startDate, window.currentNextEvent.endDate, window.currentNextEvent.broadcastUrl, window.currentNextEvent.practiceStart);
            }
        }
        return;
    }

    // Drivers ARE streaming telemetry! Show Live HUD, Red Badge, Subtitle & Live state
    if (hud) hud.style.display = 'block';
    if (telBtn) telBtn.style.display = 'inline-flex';
    if (heroStatusBadge) {
        heroStatusBadge.className = 'mockup-badge-live';
        heroStatusBadge.innerHTML = '<span class="pulsing-dot-red"></span> LIVE NOW';
    }
    if (heroSubtitle && window.currentNextEvent) {
        heroSubtitle.textContent = `LIVE NOW: ${window.currentNextEvent.name || 'TBA'}`;
        heroSubtitle.style.color = '#ff0055';
        heroSubtitle.classList.add('animate-pulse');
    }
    if (countdownEl) {
        if (window.currentNextEvent && window.currentNextEvent.broadcastUrl) {
            if (!countdownEl.querySelector('iframe')) {
                let embedUrl = getEmbedUrl(window.currentNextEvent.broadcastUrl);
                if (embedUrl) {
                    if (embedUrl.includes('youtube.com/embed/') && !embedUrl.includes('mute=1')) {
                        embedUrl += '&mute=1';
                    }
                    countdownEl.innerHTML = `
                        <div class="live-player-container" style="max-width: 800px; width: 100%; margin: 1.5rem auto 0; border-radius: 16px; border: 1px solid var(--primary); box-shadow: 0 0 40px var(--primary-glow); overflow: hidden; aspect-ratio: 16/9; background: #000;">
                            <iframe src="${embedUrl}" style="width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    `;
                }
            }
        } else if (!countdownEl.querySelector('.glow-text.animate-pulse')) {
            countdownEl.innerHTML = "<div class='glow-text animate-pulse' style='font-size: 2.5rem; font-weight: 900; color: #ff0055;'>LIVE NOW / RACE DAY</div>";
        }
    }

    const activeTeamIds = new Set(activeDrivers.map(d => d.teamId));

    // If user hasn't manually locked a team, or current team has no active drivers, default to first active team
    if (!selectedTelemetryTeamId || (!activeTeamIds.has(selectedTelemetryTeamId) && !userManuallySelectedTeam)) {
        selectedTelemetryTeamId = activeDrivers[0].teamId;
    }

    updateHomepageTeamDropdown(activeTeamIds);

    const teamActiveDrivers = activeDrivers.filter(d => d.teamId === selectedTelemetryTeamId);
    const noStreamMsg = document.getElementById('hero-tel-no-stream-msg');
    const metricsGrid = document.getElementById('hero-tel-metrics-grid');
    const switcherEl = document.getElementById('hero-tel-driver-switcher');

    // If the user selected a team that currently has no active drivers streaming
    if (teamActiveDrivers.length === 0) {
        if (noStreamMsg) {
            noStreamMsg.style.display = 'flex';
            const selectedTeamObj = availableTelemetryTeams.find(t => t.id === selectedTelemetryTeamId);
            const teamName = selectedTeamObj ? selectedTeamObj.name : selectedTelemetryTeamId;
            noStreamMsg.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>No active telemetry streams for <strong>${teamName}</strong>. Select another team above or run the telemetry tool in iRacing.</span>
            `;
        }
        if (metricsGrid) metricsGrid.style.display = 'none';
        if (switcherEl) switcherEl.style.display = 'none';

        const nameEl = document.getElementById('hero-tel-driver-name');
        if (nameEl) nameEl.textContent = 'No Driver Streaming';
        const numEl = document.getElementById('hero-tel-car-num');
        if (numEl) numEl.textContent = '#--';
        return;
    }

    // Team has active drivers! Show metrics grid and hide empty notice
    if (noStreamMsg) noStreamMsg.style.display = 'none';
    if (metricsGrid) metricsGrid.style.display = 'grid';

    let activeItem = teamActiveDrivers.find(d => d.key === selectedTelemetryKey);
    if (!activeItem) {
        activeItem = teamActiveDrivers.find(d => {
            const tel = d.stream?.telemetry || {};
            return (tel.speed > 0.5) || (tel.drivers && Object.values(tel.drivers).some(drv => drv && drv.isPlayer));
        }) || teamActiveDrivers[0];
        selectedTelemetryKey = activeItem.key;
    }

    const stream = activeItem.stream || {};
    const tel = stream.telemetry || {};
    const presence = activeItem.driverPresence || {};

    let targetDriver = null;
    let isDriverSpectating = false;

    if (tel.isSpectating && tel.drivers) {
        if (tel.spectatingCarNum) {
            targetDriver = Object.values(tel.drivers).find(d => d && String(d.carNum) === String(tel.spectatingCarNum));
        }
        if (!targetDriver && tel.spectatingDriverName) {
            targetDriver = Object.values(tel.drivers).find(d => d && d.name === tel.spectatingDriverName);
        }
        isDriverSpectating = true;
    }

    if (!targetDriver && tel.drivers) {
        targetDriver = Object.values(tel.drivers).find(d => d && d.isPlayer);
        if (!targetDriver && tel.playerIdx !== undefined && tel.drivers[tel.playerIdx]) {
            targetDriver = tel.drivers[tel.playerIdx];
        }
    }

    const driverName = targetDriver?.name || (isDriverSpectating && tel.spectatingDriverName) || presence.name || tel.driverName || "Active Driver";
    const carNum = targetDriver?.carNum || (isDriverSpectating && tel.spectatingCarNum) || presence.carNum || tel.carNum || "--";

    let rawSpeed = 0;
    if (isDriverSpectating && targetDriver && typeof targetDriver.speed === 'number' && targetDriver.speed > 0) {
        rawSpeed = targetDriver.speed;
    } else if (typeof tel.speed === 'number') {
        rawSpeed = tel.speed;
    }

    const useImperial = localStorage.getItem('use_imperial') === 'true';
    const speedVal = useImperial ? Math.round(rawSpeed * 2.23694) : Math.round(rawSpeed * 3.6);
    const speedUnit = useImperial ? "MPH" : "KM/H";

    const gearRaw = (isDriverSpectating && targetDriver && targetDriver.gear !== undefined) ? targetDriver.gear : tel.gear;
    const gearText = gearRaw === 0 ? "N" : gearRaw === -1 ? "R" : (gearRaw !== undefined && gearRaw !== null ? gearRaw : "N");

    const displayRpm = (isDriverSpectating && targetDriver && targetDriver.rpm !== undefined) ? Math.round(targetDriver.rpm) : (tel.rpm || 0);
    const rpmPercent = Math.min(100, Math.max(0, Math.round((displayRpm / 9000) * 100)));

    let displayPos = "P-";
    if (targetDriver) {
        displayPos = targetDriver.classPos ? `P${targetDriver.classPos}` : (targetDriver.pos ? `P${targetDriver.pos}` : "P-");
    } else if (tel.position) {
        displayPos = `P${tel.position}`;
    }

    const lapVal = (targetDriver && typeof targetDriver.lap === 'number') ? targetDriver.lap : (typeof tel.lap === 'number' ? tel.lap : '-');
    const fuelVal = (targetDriver && targetDriver.fuel !== undefined) ? targetDriver.fuel : (tel.fuel !== undefined ? tel.fuel : null);
    const fuelText = fuelVal !== null ? (useImperial ? `${(fuelVal * 0.264172).toFixed(1)} GAL` : `${fuelVal.toFixed(1)} L`) : '--';

    const nameEl = document.getElementById('hero-tel-driver-name');
    if (nameEl) nameEl.textContent = driverName;

    const numEl = document.getElementById('hero-tel-car-num');
    if (numEl) numEl.textContent = String(carNum).startsWith('#') ? carNum : `#${carNum}`;

    const posEl = document.getElementById('hero-tel-pos');
    if (posEl) posEl.textContent = displayPos;

    const speedEl = document.getElementById('hero-tel-speed');
    if (speedEl) speedEl.textContent = speedVal;

    const unitEl = document.getElementById('hero-tel-speed-unit');
    if (unitEl) unitEl.textContent = speedUnit;

    const gearEl = document.getElementById('hero-tel-gear');
    if (gearEl) gearEl.textContent = gearText;

    const rpmEl = document.getElementById('hero-tel-rpm');
    if (rpmEl) rpmEl.textContent = `${displayRpm.toLocaleString()} RPM`;

    const rpmBarEl = document.getElementById('hero-tel-rpm-bar');
    if (rpmBarEl) rpmBarEl.style.width = `${rpmPercent}%`;

    const lapEl = document.getElementById('hero-tel-lap');
    if (lapEl) lapEl.textContent = (lapVal !== '-' && lapVal !== undefined) ? `LAP ${lapVal}` : 'ON TRACK';

    const fuelEl = document.getElementById('hero-tel-fuel');
    if (fuelEl) fuelEl.textContent = `FUEL: ${fuelText}`;

    // Multi-driver switcher pills for current team
    if (switcherEl) {
        if (teamActiveDrivers.length > 1) {
            switcherEl.style.display = 'inline-flex';
            switcherEl.innerHTML = teamActiveDrivers.map(d => {
                const s = d.stream || {};
                const t = s.telemetry || {};
                const dName = t.driverName || d.driverPresence?.name || d.mid.slice(0, 5);
                const cNum = t.carNum ? `#${t.carNum}` : '';
                const isActive = d.key === selectedTelemetryKey;
                return `<button type="button" class="tel-driver-pill-btn ${isActive ? 'active' : ''}" onclick="window.selectHomepageTelemetryDriver('${d.key}')">${cNum} ${dName}</button>`;
            }).join('');
        } else {
            switcherEl.style.display = 'none';
        }
    }
}

function initHomepageLiveTelemetry(isLive, eventObj, forcePreview) {
    window.currentNextEvent = eventObj || window.currentNextEvent;

    const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
    const isPreviewRequested = forcePreview || (urlParams && (urlParams.get('telemetry') === 'preview' || urlParams.get('preview') === 'live' || urlParams.get('live') === '1'));

    if (!isLive && !isPreviewRequested) {
        stopHomepageLiveTelemetry();
        return;
    }

    syncAvailableTelemetryTeams();

    if (isHomepageTelemetryActive) {
        renderHomepageTelemetryHUD();
        return;
    }

    isHomepageTelemetryActive = true;

    if (isPreviewRequested && !isSimulatingTelemetry) {
        window.simulateLiveTelemetry(true);
        return;
    }

    const db = getHomeTelemetryDb();
    if (db) {
        try {
            TELEMETRY_TEAMS.forEach(teamId => {
                const streamsRef = db.ref(`teams/${teamId}/streams`);
                const driversRef = db.ref(`teams/${teamId}/drivers`);

                const onStreamsChange = snapshot => {
                    const val = snapshot.val() || {};
                    Object.keys(activeTelemetryStreams).forEach(k => {
                        if (activeTelemetryStreams[k].teamId === teamId && !val[activeTelemetryStreams[k].mid]) {
                            delete activeTelemetryStreams[k];
                        }
                    });

                    Object.keys(val).forEach(mid => {
                        const key = `${teamId}_${mid}`;
                        activeTelemetryStreams[key] = {
                            key: key,
                            teamId: teamId,
                            mid: mid,
                            stream: val[mid],
                            driverPresence: activeTelemetryDrivers[key] || {}
                        };
                    });

                    renderHomepageTelemetryHUD();
                };

                const onDriversChange = snapshot => {
                    const val = snapshot.val() || {};
                    Object.keys(val).forEach(mid => {
                        const key = `${teamId}_${mid}`;
                        activeTelemetryDrivers[key] = val[mid];
                        if (activeTelemetryStreams[key]) {
                            activeTelemetryStreams[key].driverPresence = val[mid];
                        }
                    });
                    renderHomepageTelemetryHUD();
                };

                streamsRef.on('value', onStreamsChange);
                driversRef.on('value', onDriversChange);

                homeTelemetryListeners.push(() => {
                    try { streamsRef.off('value', onStreamsChange); } catch (e) {}
                    try { driversRef.off('value', onDriversChange); } catch (e) {}
                });
            });
        } catch (err) {
            console.warn("[Telemetry HUD] Error subscribing to RTDB listeners, falling back to REST poll:", err);
            startHomepageTelemetryRestPolling();
        }
    } else {
        startHomepageTelemetryRestPolling();
    }

    if (!homeTelemetryPollTimer) {
        homeTelemetryPollTimer = setInterval(() => {
            renderHomepageTelemetryHUD();
        }, 10000);
    }
}

async function startHomepageTelemetryRestPolling() {
    if (homeTelemetryPollTimer) clearInterval(homeTelemetryPollTimer);

    const fetchTeamStreams = async () => {
        if (!isHomepageTelemetryActive) return;
        try {
            const fetchPromises = TELEMETRY_TEAMS.map(teamId =>
                fetch(`${TELEMETRY_RTDB_URL}/teams/${teamId}/streams.json`)
                    .then(r => r.ok ? r.json() : null)
                    .then(val => ({ teamId, val }))
                    .catch(() => ({ teamId, val: null }))
            );

            const results = await Promise.all(fetchPromises);
            results.forEach(({ teamId, val }) => {
                if (val && typeof val === 'object') {
                    Object.keys(val).forEach(mid => {
                        const key = `${teamId}_${mid}`;
                        activeTelemetryStreams[key] = {
                            key: key,
                            teamId: teamId,
                            mid: mid,
                            stream: val[mid],
                            driverPresence: {}
                        };
                    });
                }
            });
            renderHomepageTelemetryHUD();
        } catch (e) {
            console.warn("[Telemetry HUD] REST poll error:", e);
        }
    };

    await fetchTeamStreams();
    homeTelemetryPollTimer = setInterval(fetchTeamStreams, 5000);
}

window.selectHomepageTelemetryTeam = function(teamId) {
    selectedTelemetryTeamId = teamId;
    userManuallySelectedTeam = true;
    selectedTelemetryKey = null;
    renderHomepageTelemetryHUD();
};

window.selectHomepageTelemetryDriver = function(key) {
    selectedTelemetryKey = key;
    renderHomepageTelemetryHUD();
};

window.simulateLiveTelemetry = function(enable) {
    if (enable === false) {
        if (simulatedTelemetryInterval) {
            clearInterval(simulatedTelemetryInterval);
            simulatedTelemetryInterval = null;
        }
        isSimulatingTelemetry = false;
        delete activeTelemetryStreams['sim_demo_sim'];
        delete activeTelemetryStreams['sim_demo_red'];
        delete activeTelemetryStreams['sim_demo_blue'];
        delete activeTelemetryStreams['sim_demo_purple'];
        userManuallySelectedTeam = false;
        renderHomepageTelemetryHUD();
        console.log("Telemetry simulation stopped.");
        return;
    }

    isSimulatingTelemetry = true;
    isHomepageTelemetryActive = true;

    // Multi-team simulation parameters
    const mockTeams = {
        gridUp_sim: { driver: 'Matty Roberts', carNum: '64', speed: 175, gear: 4, rpm: 6400, pos: 2, classPos: 2, lap: 14, fuel: 42.4, accel: true },
        gridUp_red: { driver: 'Andrew Fabian', carNum: '22', speed: 282, gear: 6, rpm: 8450, pos: 1, classPos: 1, lap: 15, fuel: 31.8, accel: false },
        gridUp_blue: { driver: 'Martyn Cook', carNum: '88', speed: 215, gear: 5, rpm: 7100, pos: 4, classPos: 4, lap: 14, fuel: 48.0, accel: true },
        gridUp_purple: { driver: 'Adam Jones', carNum: '77', speed: 245, gear: 5, rpm: 7800, pos: 3, classPos: 3, lap: 14, fuel: 37.2, accel: true }
    };

    if (simulatedTelemetryInterval) clearInterval(simulatedTelemetryInterval);

    simulatedTelemetryInterval = setInterval(() => {
        Object.keys(mockTeams).forEach(tId => {
            const m = mockTeams[tId];
            if (m.accel) {
                m.speed += 2.6;
                m.rpm += 115;
                if (m.rpm > 8700) {
                    if (m.gear < 6) {
                        m.gear++;
                        m.rpm = 6350;
                    } else {
                        m.accel = false;
                    }
                }
            } else {
                m.speed -= 3.4;
                m.rpm -= 160;
                if (m.rpm < 5800) {
                    if (m.gear > 3) {
                        m.gear--;
                        m.rpm = 8100;
                    } else {
                        m.accel = true;
                    }
                }
            }

            activeTelemetryStreams[`sim_${tId}`] = {
                key: `sim_${tId}`,
                teamId: tId,
                mid: `mid_${tId}`,
                stream: {
                    is_live: true,
                    timestamp: Date.now(),
                    telemetry: {
                        driverName: m.driver,
                        carNum: m.carNum,
                        speed: m.speed / 3.6,
                        gear: m.gear,
                        rpm: Math.round(m.rpm),
                        position: m.pos,
                        classPos: m.classPos,
                        lap: m.lap,
                        fuel: m.fuel,
                        is_live: true,
                        timestamp: Date.now()
                    }
                },
                driverPresence: {
                    name: m.driver,
                    carNum: m.carNum,
                    status: "online"
                }
            };
        });

        if (!selectedTelemetryTeamId) {
            selectedTelemetryTeamId = 'gridUp_sim';
        }
        renderHomepageTelemetryHUD();
    }, 150);

    console.log("Live Telemetry multi-team simulation running. Call simulateLiveTelemetry(false) to stop.");
};

window.initHomepageLiveTelemetry = initHomepageLiveTelemetry;
window.stopHomepageLiveTelemetry = stopHomepageLiveTelemetry;

