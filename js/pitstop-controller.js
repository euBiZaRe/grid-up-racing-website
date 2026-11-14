/**
 * GRiD UP - Interactive 3D Pitstop Controller
 * Coordinates GSAP ScrollTrigger, Three.js Scene, Web Audio,
 * UI Overlays, and seamless transition into the GRiD UP website.
 */

(function(window) {
    'use strict';

    class PitstopController {
        constructor() {
            this.scene3D = null;
            this.audio = null;
            this.scrollTrigger = null;
            this.isRevealed = false;
            this.hasUserInteracted = false;
            
            // DOM Elements
            this.wrapper = document.getElementById('pitstop-experience');
            this.canvasContainer = document.getElementById('pitstop-canvas-container');
            this.scrollTrack = document.getElementById('pitstop-scroll-track');
            this.hud = document.getElementById('pitstop-hud');
            this.loader = document.getElementById('pitstop-loader');
            this.loaderFill = document.getElementById('loader-progress-fill');
            this.loaderPct = document.getElementById('loader-pct-text');
            this.scrollPrompt = document.getElementById('pitstop-scroll-prompt');
            this.progressBarFill = document.getElementById('pitstop-progress-bar-fill');
            this.phaseText = document.getElementById('phase-text-name');
            this.revealOverlay = document.getElementById('pitstop-reveal-overlay');
            this.btnSkip = document.getElementById('pit-btn-skip');
            this.btnAudio = document.getElementById('pit-btn-audio');
            this.btnReplay = document.getElementById('btn-replay-pitstop');
            this.btnRevealEnter = document.getElementById('btn-reveal-enter');
        }

        init() {
            console.log('[Pitstop Controller] Initializing...');

            // Verify WebGL Support
            if (!this.checkWebGLSupport()) {
                console.warn('[Pitstop Controller] WebGL not supported. Falling back to normal website.');
                this.fallbackDirectToSite();
                return;
            }

            // Register GSAP ScrollTrigger plugin
            if (window.gsap && window.ScrollTrigger) {
                gsap.registerPlugin(ScrollTrigger);
            } else {
                console.warn('[Pitstop Controller] GSAP or ScrollTrigger not loaded.');
            }

            // Initialize Audio Engine
            this.audio = new window.PitstopAudioEngine();

            // Initialize 3D Engine
            this.scene3D = new window.Pitstop3DScene();
            this.scene3D.init(
                this.canvasContainer,
                this.onLoadProgress.bind(this),
                this.onLoadComplete.bind(this),
                this.onLoadError.bind(this)
            );

            this.bindEvents();
        }

        checkWebGLSupport() {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        }

        fallbackDirectToSite() {
            if (this.wrapper) this.wrapper.style.display = 'none';
            if (this.loader) this.loader.style.display = 'none';
            if (this.revealOverlay) this.revealOverlay.style.display = 'none';
            document.body.classList.remove('pitstop-active');
            document.body.classList.add('pitstop-revealed');
        }

        onLoadProgress(percentage) {
            if (this.loaderFill) {
                this.loaderFill.style.width = `${percentage}%`;
            }
            if (this.loaderPct) {
                this.loaderPct.textContent = `${percentage}%`;
            }
        }

        onLoadComplete() {
            console.log('[Pitstop Controller] 3D assets loaded successfully.');

            if (this.loaderFill) this.loaderFill.style.width = '100%';
            if (this.loaderPct) this.loaderPct.textContent = '100%';

            // Dismiss loader screen with smooth cinematic fade
            setTimeout(() => {
                if (this.loader) {
                    this.loader.classList.add('loader-hidden');
                }

                // Setup GSAP ScrollTrigger
                this.setupScrollTrigger();

                // Check if returning visitor who already completed intro in this session
                const hasSeen = sessionStorage.getItem('gridup_intro_completed');
                const forceIntro = window.location.hash === '#intro' || window.location.search.includes('intro=1');
                
                if (hasSeen && !forceIntro) {
                    console.log('[Pitstop Controller] Returning visitor. Skipping to website.');
                    this.collapseIntroDirectly();
                } else {
                    document.body.classList.add('pitstop-active');
                }
            }, 550);
        }

        onLoadError(err) {
            console.error('[Pitstop Controller] Load error:', err);
            this.fallbackDirectToSite();
        }

        setupScrollTrigger() {
            if (!window.ScrollTrigger || !this.scrollTrack) return;

            // Pin the 3D experience and scrub through the timeline
            this.scrollTrigger = ScrollTrigger.create({
                trigger: this.scrollTrack,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.45, // Smooth physical inertia
                onUpdate: (self) => {
                    const progress = self.progress; // 0.00 to 1.00
                    const velocity = self.getVelocity ? self.getVelocity() : 0;

                    // Update 3D Scene
                    if (this.scene3D) {
                        this.scene3D.updateFromTimeline(progress, velocity);
                    }

                    // Update Web Audio
                    if (this.audio) {
                        this.audio.updateFromTimeline(progress, velocity);
                    }

                    // Update UI HUD
                    this.updateUI(progress);
                }
            });

            ScrollTrigger.refresh();
        }

        updateUI(progress) {
            // Update Horizontal Progress Bar
            if (this.progressBarFill) {
                this.progressBarFill.style.width = `${(progress * 100).toFixed(1)}%`;
            }

            // Hide "SCROLL TO START" once user begins scrolling
            if (this.scrollPrompt) {
                if (progress > 0.02) {
                    this.scrollPrompt.classList.add('hidden');
                } else {
                    this.scrollPrompt.classList.remove('hidden');
                }
            }

            // Update Phase Indicator Label
            if (this.phaseText) {
                if (progress < 0.38) {
                    this.phaseText.textContent = 'APPROACH // 01';
                } else if (progress < 0.65) {
                    this.phaseText.textContent = 'PITSTOP // 02';
                } else if (progress < 0.88) {
                    this.phaseText.textContent = 'DEPARTURE // 03';
                } else {
                    this.phaseText.textContent = 'GRID UP // 04';
                }
            }

            // Scene 4: Cinematic Reveal Overlay into GRiD UP Website
            if (progress >= 0.88 && progress < 0.96) {
                if (!this.isRevealed) {
                    this.isRevealed = true;
                    if (this.revealOverlay) this.revealOverlay.classList.add('active');
                    document.body.classList.add('pitstop-revealed');
                    sessionStorage.setItem('gridup_intro_completed', 'true');
                }
                if (this.canvasContainer) this.canvasContainer.style.opacity = '1';
                if (this.hud) this.hud.style.opacity = '1';
            } else if (progress >= 0.96) {
                // Smoothly dissolve canvas and HUD as visitor enters the live website
                const fadeOut = Math.max(0, (1.0 - progress) / 0.04);
                if (this.canvasContainer) this.canvasContainer.style.opacity = fadeOut.toFixed(2);
                if (this.revealOverlay) this.revealOverlay.style.opacity = fadeOut.toFixed(2);
                if (this.hud) this.hud.style.opacity = fadeOut.toFixed(2);
                document.body.classList.add('pitstop-revealed');
                document.body.classList.remove('pitstop-active');
            } else {
                if (this.isRevealed) {
                    this.isRevealed = false;
                    if (this.revealOverlay) this.revealOverlay.classList.remove('active');
                    document.body.classList.remove('pitstop-revealed');
                    document.body.classList.add('pitstop-active');
                }
                if (this.canvasContainer) this.canvasContainer.style.opacity = '1';
                if (this.hud) this.hud.style.opacity = '1';
            }
        }

        bindEvents() {
            // User interaction listener to resume audio context (obeys autoplay policies)
            const handleFirstGesture = () => {
                if (this.hasUserInteracted) return;
                this.hasUserInteracted = true;
                if (this.audio) this.audio.resumeContext();
            };
            ['click', 'touchstart', 'scroll', 'keydown', 'wheel'].forEach(evt => {
                window.addEventListener(evt, handleFirstGesture, { passive: true, once: true });
            });

            // Audio Mute/Unmute Toggle Button
            if (this.btnAudio) {
                this.btnAudio.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.audio) {
                        const muted = this.audio.toggleMute();
                        this.btnAudio.classList.toggle('muted', muted);
                    }
                });
            }

            // Skip Intro Button
            if (this.btnSkip) {
                this.btnSkip.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.skipIntro(true);
                });
            }

            // Reveal Overlay "ENTER WEBSITE" Button
            if (this.btnRevealEnter) {
                this.btnRevealEnter.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.enterWebsite();
                });
            }

            // Replay 3D Intro Floating Button
            if (this.btnReplay) {
                this.btnReplay.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.replayIntro();
                });
            }
        }

        skipIntro(smooth = true) {
            sessionStorage.setItem('gridup_intro_completed', 'true');
            if (this.audio) this.audio.resumeContext();

            if (this.scrollTrack) {
                const targetScroll = this.scrollTrack.offsetTop + this.scrollTrack.offsetHeight;
                if (smooth) {
                    window.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                    setTimeout(() => {
                        this.enterWebsite();
                    }, 800);
                } else {
                    window.scrollTo(0, targetScroll);
                    this.enterWebsite();
                }
            } else {
                this.enterWebsite();
            }
        }

        enterWebsite() {
            this.isRevealed = true;
            document.body.classList.remove('pitstop-active');
            document.body.classList.add('pitstop-revealed');
            if (this.revealOverlay) this.revealOverlay.classList.remove('active');

            // Smooth scroll down to main website content
            const hero = document.querySelector('.hero-mockup') || document.querySelector('section');
            if (hero) {
                hero.scrollIntoView({ behavior: 'smooth' });
            }
        }

        collapseIntroDirectly() {
            if (this.scrollTrack) this.scrollTrack.style.display = 'none';
            if (this.canvasContainer) {
                this.canvasContainer.style.display = 'none';
                this.canvasContainer.style.opacity = '0';
            }
            if (this.hud) {
                this.hud.style.display = 'none';
                this.hud.style.opacity = '0';
            }
            if (this.loader) this.loader.style.display = 'none';
            if (this.revealOverlay) this.revealOverlay.style.display = 'none';
            document.body.classList.remove('pitstop-active');
            document.body.classList.add('pitstop-revealed');
        }

        replayIntro() {
            sessionStorage.removeItem('gridup_intro_completed');

            if (this.scrollTrack) this.scrollTrack.style.display = 'block';
            if (this.canvasContainer) {
                this.canvasContainer.style.display = 'block';
                this.canvasContainer.style.opacity = '1';
            }
            if (this.hud) {
                this.hud.style.display = 'flex';
                this.hud.style.opacity = '1';
            }
            document.body.classList.add('pitstop-active');
            document.body.classList.remove('pitstop-revealed');
            if (this.revealOverlay) this.revealOverlay.classList.remove('active');
            this.isRevealed = false;

            if (window.ScrollTrigger) {
                ScrollTrigger.refresh();
            }

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            setTimeout(() => {
                if (this.scrollTrigger) {
                    this.scrollTrigger.scroll(0);
                    this.scrollTrigger.update();
                }
            }, 600);
        }
    }

    // Initialize once DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        window.pitstopApp = new PitstopController();
        window.pitstopApp.init();
    });

})(window);
