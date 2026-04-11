// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
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
function updateCountdown() {
    // Corrected target date to April 10, 2026 based on next major event
    const targetDate = new Date('April 10, 2026 00:00:00').getTime();
    
    function update() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance < 0) {
            if (document.getElementById('countdown')) {
                document.getElementById('countdown').innerHTML = "<div class='glow-text' style='font-size: 2rem;'>RACE WEEKEND</div>";
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

    // Initial call to avoid '00' flicker
    if (!update()) {
        const timer = setInterval(() => {
            if (update()) clearInterval(timer);
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

    // 1. Load Upcoming Races
    const upcomingTrack = document.getElementById('dynamic-upcoming-track');
    if (upcomingTrack) {
        try {
            const now = new Date().toISOString();
            const snap = await db.collection("events")
                .where("startDate", ">=", now)
                .orderBy("startDate", "asc")
                .limit(10)
                .get();

            if (snap.empty) {
                upcomingTrack.innerHTML = '<p style="text-align: center; color: var(--text-muted); width: 100%;">No upcoming events scheduled.</p>';
            } else {
                upcomingTrack.innerHTML = '';
                let index = 0;
                const colors = ['blue', 'pink', 'green'];
                snap.forEach(doc => {
                    const e = doc.data();
                    const color = colors[index % 3];
                    const tile = document.createElement('a');
                    tile.href = `events.html?id=${doc.id}`;
                    tile.className = `race-tile tile-${color}`;
                    tile.innerHTML = `
                        <h3>${e.name.toUpperCase()}</h3>
                        <div class="race-meta">${e.date}</div>
                    `;
                    upcomingTrack.appendChild(tile);
                    index++;
                });
            }
        } catch (error) {
            console.error("Error loading events:", error);
            upcomingTrack.innerHTML = '<p style="color: #ff0055;">Failed to load schedule.</p>';
        }
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

                    card.innerHTML = `
                        <img src="${d.rawUrl}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.7;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 40%, rgba(0,0,0,0.4) 100%);"></div>
                        
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
                    `;
                    resultsTrack.appendChild(card);
                });
            }
        } catch (error) {
            console.error("Error loading results:", error);
            resultsTrack.innerHTML = '<p style="color: #ff0055; grid-column: 1/-1;">Failed to load results.</p>';
        }
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
    if (document.getElementById('countdown')) {
        updateCountdown();
    }
    
    // Check for Firebase existence before loading dynamic content
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
            loadDynamicContent();
            clearInterval(checkFirebase);
        }
    }, 500);
});
