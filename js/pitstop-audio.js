/**
 * GRiD UP - Procedural Motorsport Web Audio Engine
 * High-performance Web Audio API synthesis for real-time pitlane,
 * GT3 twin-turbo V8 engine, pneumatic air jacks, and wheel guns.
 */

(function(window) {
    'use strict';

    class PitstopAudioEngine {
        constructor() {
            this.ctx = null;
            this.isMuted = false;
            this.isInitialized = false;
            this.masterGain = null;
            
            // Engine synthesizer nodes
            this.engineGain = null;
            this.engineOsc1 = null;
            this.engineOsc2 = null;
            this.engineSubOsc = null;
            this.engineFilter = null;
            this.engineDistortion = null;
            this.currentRPM = 900;
            
            // Ambience nodes
            this.ambienceGain = null;
            this.ambienceSource = null;
            
            // Wheel gun active timers
            this.wheelGunInterval = null;
            this.isWheelGunRunning = false;
            
            // State tracking to prevent duplicate triggers
            this.lastPhase = -1;
            this.lastAirJackState = null;
            this.lastWheelChangeTriggered = false;
        }

        init() {
            if (this.isInitialized) return;
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) {
                    console.warn('[Audio] Web Audio API not supported on this browser.');
                    return;
                }
                this.ctx = new AudioContext();
                
                // Master Gain
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
                
                this.setupAmbience();
                this.setupEngine();
                
                this.isInitialized = true;
                console.log('[Audio] Pitstop Web Audio Engine initialized.');
            } catch (e) {
                console.warn('[Audio] Failed to initialize AudioContext:', e);
            }
        }

        resumeContext() {
            if (!this.ctx) {
                this.init();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        }

        setMuted(muted) {
            this.isMuted = muted;
            if (!this.masterGain || !this.ctx) return;
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.65, now + 0.08);
        }

        toggleMute() {
            this.resumeContext();
            this.setMuted(!this.isMuted);
            return this.isMuted;
        }

        // ---------------------------------------------------------------------
        // Ambience (Pitlane drone, track reverberation)
        // ---------------------------------------------------------------------
        setupAmbience() {
            if (!this.ctx) return;
            // Generate 2 seconds of pink/brown filtered noise
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                data[i] = (b0 + b1 + b2) * 0.08;
            }

            const noiseNode = this.ctx.createBufferSource();
            noiseNode.buffer = buffer;
            noiseNode.loop = true;

            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 220;
            bandpass.Q.value = 0.8;

            this.ambienceGain = this.ctx.createGain();
            this.ambienceGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

            noiseNode.connect(bandpass);
            bandpass.connect(this.ambienceGain);
            this.ambienceGain.connect(this.masterGain);

            noiseNode.start();
            this.ambienceSource = noiseNode;
        }

        // ---------------------------------------------------------------------
        // McLaren GT3 Twin-Turbo V8 Engine Synthesizer
        // ---------------------------------------------------------------------
        setupEngine() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.setValueAtTime(0.001, now);

            // Distortion Curve for GT3 Exhaust Growl
            this.engineDistortion = this.ctx.createWaveShaper();
            this.engineDistortion.curve = this.makeDistortionCurve(18);
            this.engineDistortion.oversample = '4x';

            // Filter simulating exhaust muffler and air intake
            this.engineFilter = this.ctx.createBiquadFilter();
            this.engineFilter.type = 'lowpass';
            this.engineFilter.frequency.setValueAtTime(380, now);
            this.engineFilter.Q.setValueAtTime(2.2, now);

            // Primary Cylinder Firing Oscillator (Sawtooth)
            this.engineOsc1 = this.ctx.createOscillator();
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc1.frequency.setValueAtTime(32, now);

            // Secondary Harmonics Oscillator (Triangle)
            this.engineOsc2 = this.ctx.createOscillator();
            this.engineOsc2.type = 'triangle';
            this.engineOsc2.frequency.setValueAtTime(64, now);

            // Sub-bass Rumble (Sine)
            this.engineSubOsc = this.ctx.createOscillator();
            this.engineSubOsc.type = 'sine';
            this.engineSubOsc.frequency.setValueAtTime(16, now);

            const oscMixer = this.ctx.createGain();
            oscMixer.gain.setValueAtTime(0.4, now);

            this.engineOsc1.connect(oscMixer);
            this.engineOsc2.connect(oscMixer);
            this.engineSubOsc.connect(oscMixer);

            oscMixer.connect(this.engineDistortion);
            this.engineDistortion.connect(this.engineFilter);
            this.engineFilter.connect(this.engineGain);
            this.engineGain.connect(this.masterGain);

            this.engineOsc1.start();
            this.engineOsc2.start();
            this.engineSubOsc.start();
        }

        makeDistortionCurve(amount) {
            const k = typeof amount === 'number' ? amount : 20;
            const n_samples = 44100;
            const curve = new Float32Array(n_samples);
            const deg = Math.PI / 180;
            for (let i = 0; i < n_samples; ++i) {
                const x = (i * 2) / n_samples - 1;
                curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
            }
            return curve;
        }

        setEngineState(rpm, volume, filterFreq) {
            if (!this.engineGain || !this.ctx) return;
            const now = this.ctx.currentTime;
            const baseFreq = Math.max(20, (rpm / 60) * 2); // 4 pulses per rev for V8
            
            this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
            this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.04);
            this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

            if (filterFreq) {
                this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
            }
            this.engineGain.gain.setTargetAtTime(volume, now, 0.05);
            this.currentRPM = rpm;
        }

        // ---------------------------------------------------------------------
        // Pneumatic Air Jacks (Lift & Drop)
        // ---------------------------------------------------------------------
        playAirJack(action = 'lift') {
            if (!this.ctx || this.isMuted) return;
            this.resumeContext();
            const now = this.ctx.currentTime;

            // Air hiss burst
            const bufferSize = Math.floor(this.ctx.sampleRate * (action === 'lift' ? 0.35 : 0.22));
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(action === 'lift' ? 1400 : 850, now);
            filter.Q.setValueAtTime(1.5, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (action === 'lift' ? 0.35 : 0.22));

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(now);

            // Mechanical clunk
            const clunk = this.ctx.createOscillator();
            clunk.type = 'triangle';
            clunk.frequency.setValueAtTime(action === 'lift' ? 120 : 85, now);
            clunk.frequency.exponentialRampToValueAtTime(35, now + 0.12);

            const clunkGain = this.ctx.createGain();
            clunkGain.gain.setValueAtTime(0.6, now);
            clunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            clunk.connect(clunkGain);
            clunkGain.connect(this.masterGain);
            clunk.start(now);
            clunk.stop(now + 0.15);
        }

        // ---------------------------------------------------------------------
        // Pneumatic Wheel Impact Gun (High-speed rattling torque)
        // ---------------------------------------------------------------------
        startWheelGuns() {
            if (this.isWheelGunRunning || !this.ctx || this.isMuted) return;
            this.resumeContext();
            this.isWheelGunRunning = true;

            const fireImpact = () => {
                if (!this.isWheelGunRunning || !this.ctx) return;
                const now = this.ctx.currentTime;

                // High-speed air rattle burst
                const osc = this.ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(260 + (Math.random() * 40 - 20), now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now);
                osc.stop(now + 0.05);

                // Metallic transient click
                const snap = this.ctx.createOscillator();
                snap.type = 'sine';
                snap.frequency.setValueAtTime(850 + Math.random() * 200, now);
                snap.frequency.exponentialRampToValueAtTime(200, now + 0.02);

                const snapGain = this.ctx.createGain();
                snapGain.gain.setValueAtTime(0.25, now);
                snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

                snap.connect(snapGain);
                snapGain.connect(this.masterGain);
                snap.start(now);
                snap.stop(now + 0.03);
            };

            // Rattle at ~35-40 impacts per second (standard high-torque Formula / GT3 wheel gun)
            this.wheelGunInterval = setInterval(fireImpact, 26);
        }

        stopWheelGuns() {
            if (!this.isWheelGunRunning) return;
            this.isWheelGunRunning = false;
            if (this.wheelGunInterval) {
                clearInterval(this.wheelGunInterval);
                this.wheelGunInterval = null;
            }
        }

        // ---------------------------------------------------------------------
        // Tyre Mounting Clack (Rim locking onto hub)
        // ---------------------------------------------------------------------
        playTyreMount() {
            if (!this.ctx || this.isMuted) return;
            this.resumeContext();
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.17);
        }

        // ---------------------------------------------------------------------
        // Dynamic Timeline Progress Sync (Called on every scroll frame)
        // ---------------------------------------------------------------------
        updateFromTimeline(progress, velocity = 0) {
            if (!this.isInitialized) return;
            if (this.isMuted) return;

            // Phase 1: Entry (0.00 -> 0.38)
            if (progress >= 0.05 && progress < 0.38) {
                const subP = (progress - 0.05) / 0.33; // 0 to 1
                // Deceleration into pit: RPM drops from 4200 to 1050
                const targetRPM = 4200 - (subP * 3150);
                const filter = 1200 - (subP * 700);
                const vol = Math.min(0.5, 0.15 + (1 - subP) * 0.35);
                this.setEngineState(targetRPM, vol, filter);
                this.stopWheelGuns();
                this.lastWheelChangeTriggered = false;
            }
            // Phase 2: Pitstop (0.38 -> 0.65)
            else if (progress >= 0.38 && progress < 0.65) {
                const pitP = (progress - 0.38) / 0.27; // 0 to 1
                // Engine idling in pit box
                this.setEngineState(950, 0.18, 420);

                // Air jack lift trigger (at pit entry)
                if (pitP >= 0.05 && this.lastAirJackState !== 'lifted') {
                    this.playAirJack('lift');
                    this.lastAirJackState = 'lifted';
                }

                // Wheel guns active during tyre change (pitP between 0.15 and 0.85)
                if (pitP >= 0.18 && pitP <= 0.82) {
                    if (!this.isWheelGunRunning) this.startWheelGuns();
                    // Midpoint tyre swap thud
                    if (pitP >= 0.48 && pitP <= 0.54 && !this.lastWheelChangeTriggered) {
                        this.playTyreMount();
                        this.lastWheelChangeTriggered = true;
                    }
                } else {
                    this.stopWheelGuns();
                }

                // Air jack drop trigger (at pitstop release)
                if (pitP > 0.88 && this.lastAirJackState === 'lifted') {
                    this.playAirJack('drop');
                    this.lastAirJackState = 'dropped';
                }
            }
            // Phase 3: Departure / Launch (0.65 -> 0.85)
            else if (progress >= 0.65 && progress < 0.88) {
                this.stopWheelGuns();
                const launchP = (progress - 0.65) / 0.23; // 0 to 1
                // Aggressive throttle flare: RPM shoots up from 1050 to 7200
                const targetRPM = 1050 + Math.pow(launchP, 1.4) * 6150;
                const filter = 450 + Math.pow(launchP, 1.2) * 2400;
                const vol = Math.min(0.65, 0.25 + launchP * 0.4);
                this.setEngineState(targetRPM, vol, filter);
            }
            // Phase 4: Reveal / Finished (0.88 -> 1.0)
            else if (progress >= 0.88) {
                this.stopWheelGuns();
                // Fading out into distance as car speeds away
                const fadeP = (progress - 0.88) / 0.12;
                const vol = Math.max(0.001, 0.55 * (1 - fadeP));
                this.setEngineState(6800, vol, 1800);
            } else {
                // Pre-start / stationary
                this.setEngineState(800, 0.05, 300);
                this.stopWheelGuns();
            }
        }
    }

    window.PitstopAudioEngine = PitstopAudioEngine;

})(window);
