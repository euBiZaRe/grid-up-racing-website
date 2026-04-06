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
