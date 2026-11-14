/**
 * GRiD UP - Interactive 3D Pitstop Controller
 * Coordinates GSAP ScrollTrigger, Three.js Scene, UI Overlays,
 * and seamless one-way transition into the normal GRiD UP website.
 */

(function(window) {
    'use strict';

    class PitstopController {
        constructor() {
            this.scene3D = null;
            this.scrollTrigger = null;
            this.isIntroCompleted = false;
            this.isTransitioning = false;
            
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
            this.btnRevealEnter = document.getElementById('btn-reveal-enter');
        }

        init() {
            console.log('[Pitstop Controller] Initializing...');

            // If returning visitor who already finished intro, jump straight to normal website
            const hasSeen = sessionStorage.getItem('gridup_intro_completed');
            const forceIntro = window.location.hash === '#intro' || window.location.search.includes('intro=1');
            
            if (hasSeen && !forceIntro) {
                console.log('[Pitstop Controller] Session completed. Showing normal website.');
                this.collapseIntroDirectly();
                return;
            }

            // Verify WebGL Support
            if (!this.checkWebGLSupport()) {
                console.warn('[Pitstop Controller] WebGL not supported. Falling back to normal website.');
                this.collapseIntroDirectly();
                return;
            }

            // Register GSAP ScrollTrigger plugin
            if (window.gsap && window.ScrollTrigger) {
                gsap.registerPlugin(ScrollTrigger);
            }

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

            // Dismiss loader screen with smooth fade
            setTimeout(() => {
                if (this.loader) {
                    this.loader.classList.add('loader-hidden');
                }

                document.body.classList.add('pitstop-active');
                this.setupScrollTrigger();
            }, 450);
        }

        onLoadError(err) {
            console.error('[Pitstop Controller] Load error:', err);
            this.collapseIntroDirectly();
        }

        setupScrollTrigger() {
            if (!window.ScrollTrigger || !this.scrollTrack) return;

            // Pin the 3D experience and scrub through the timeline
            this.scrollTrigger = ScrollTrigger.create({
                trigger: this.scrollTrack,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.85, // Smooth physical inertia and progressive momentum
                onUpdate: (self) => {
                    if (this.isIntroCompleted) return;

                    const progress = self.progress; // 0.00 to 1.00
                    const velocity = self.getVelocity ? self.getVelocity() : 0;

                    // Update 3D Scene
                    if (this.scene3D) {
                        this.scene3D.updateFromTimeline(progress, velocity);
                    }

                    // Update UI HUD
                    this.updateUI(progress);

                    // Once user reaches the end of Scene 4 (progress >= 0.94), automatically
                    // finish the intro, collapse the 480vh track, and enter the normal website!
                    if (progress >= 0.94 && !this.isTransitioning) {
                        this.finishAndEnterWebsite(true);
                    }
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

            // Scene 4: Reveal Overlay
            if (progress >= 0.88 && progress < 0.94) {
                if (this.revealOverlay) this.revealOverlay.classList.add('active');
            }
        }

        bindEvents() {
            // Skip Intro Button
            if (this.btnSkip) {
                this.btnSkip.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.finishAndEnterWebsite(false);
                });
            }

            // Reveal Overlay "ENTER WEBSITE" Button
            if (this.btnRevealEnter) {
                this.btnRevealEnter.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.finishAndEnterWebsite(false);
                });
            }
        }

        /**
         * Transitions from the 3D intro into the normal website,
         * completely removes the 480vh scroll track, and locks scroll
         * so the user cannot scroll back up into the intro.
         */
        finishAndEnterWebsite(fromScroll = true) {
            if (this.isIntroCompleted || this.isTransitioning) return;
            this.isTransitioning = true;
            this.isIntroCompleted = true;

            sessionStorage.setItem('gridup_intro_completed', 'true');

            // 1. Smoothly fade out the 3D canvas and HUD
            if (this.canvasContainer) {
                this.canvasContainer.style.transition = 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
                this.canvasContainer.style.opacity = '0';
            }
            if (this.hud) {
                this.hud.style.transition = 'opacity 0.45s ease';
                this.hud.style.opacity = '0';
            }
            if (this.revealOverlay) {
                this.revealOverlay.style.transition = 'opacity 0.5s ease';
                this.revealOverlay.style.opacity = '0';
            }

            setTimeout(() => {
                // 2. Kill GSAP ScrollTrigger so it releases the pin and listeners
                if (this.scrollTrigger) {
                    this.scrollTrigger.kill(true);
                    this.scrollTrigger = null;
                }

                // 3. Completely hide/collapse the intro wrapper and scroll track
                if (this.wrapper) {
                    this.wrapper.style.display = 'none';
                }

                // 4. Dispose 3D scene resources & stop animation loop
                if (this.scene3D) {
                    this.scene3D.dispose();
                }

                // 5. Restore body to normal website mode
                document.body.classList.remove('pitstop-active');
                document.body.classList.remove('pitstop-revealed');
                document.body.classList.add('pitstop-completed');

                // 6. Reset scroll to top of normal website (user CANNOT scroll back up)
                window.scrollTo(0, 0);

                // 7. Refresh remaining page scroll triggers
                if (window.ScrollTrigger) {
                    ScrollTrigger.refresh();
                }

                console.log('[Pitstop Controller] Intro unmounted. Normal website active.');
            }, 650);
        }

        collapseIntroDirectly() {
            this.isIntroCompleted = true;
            if (this.scrollTrigger) {
                this.scrollTrigger.kill(true);
                this.scrollTrigger = null;
            }
            if (this.wrapper) {
                this.wrapper.style.display = 'none';
            }
            if (this.scene3D) {
                this.scene3D.dispose();
            }
            document.body.classList.remove('pitstop-active');
            document.body.classList.remove('pitstop-revealed');
            document.body.classList.add('pitstop-completed');
            window.scrollTo(0, 0);
        }
    }

    // Initialize once DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        window.pitstopApp = new PitstopController();
        window.pitstopApp.init();
    });

})(window);
