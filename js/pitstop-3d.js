/**
 * GRiD UP - Interactive 3D Pitstop Experience Engine
 * Built with Three.js r128 & GLTFLoader.
 * Features the McLaren 720S GT3 in a dark motorsport pitlane,
 * realistic vehicle kinematics, 3D pit crew, and dynamic lighting.
 */

(function(window) {
    'use strict';

    class Pitstop3DScene {
        constructor() {
            this.container = null;
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.clock = new THREE.Clock();
            
            // Core 3D objects
            this.carGroup = new THREE.Group();
            this.carModel = null;
            this.wheels = {
                lf: null,
                rf: null,
                lr: null,
                rr: null
            };
            this.wheelPivots = {
                lf: new THREE.Group(),
                rf: new THREE.Group(),
                lr: new THREE.Group(),
                rr: new THREE.Group()
            };
            this.wheelCenters = {
                lf: new THREE.Vector3(0.857, 0.377, 1.213),
                rf: new THREE.Vector3(-0.846, 0.377, 1.213),
                lr: new THREE.Vector3(0.842, 0.342, -1.471),
                rr: new THREE.Vector3(-0.842, 0.342, -1.471)
            };
            
            // Vehicle lights
            this.headlights = [];
            this.taillights = [];
            this.exhaustLights = [];
            
            // Pit crew objects
            this.crewGroup = new THREE.Group();
            this.tyreChangers = [];
            this.lollipop = null;
            this.lollipopSign = null;
            this.lollipopCanvas = null;
            this.lollipopTexture = null;
            
            // Particles
            this.ambientParticles = null;
            this.tyreSmoke = null;
            this.wheelGunSparks = [];
            
            // Overhead signage / LED displays
            this.pitTimerDisplay = null;
            this.pitTimerCanvas = null;
            this.pitTimerTexture = null;
            
            // Animation state
            this.wheelRotationAngle = 0;
            this.lastCarZ = 50;
            this.isLoaded = false;
            this.isDisposed = false;
            this.animFrameId = null;
            
            // Camera targets for smooth interpolation
            this.cameraPosition = new THREE.Vector3(0, 2, 25);
            this.cameraLookAt = new THREE.Vector3(0, 1, 0);
        }

        init(container, onProgress, onComplete, onError) {
            this.container = container;
            const width = window.innerWidth;
            const height = window.innerHeight;

            // 1. Scene & Atmospheric Fog
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x04060b);
            this.scene.fog = new THREE.FogExp2(0x050711, 0.016);

            // 2. Camera with responsive FOV (wider on mobile to prevent clipping)
            const isMobile = width < 768;
            const fov = isMobile ? 55 : 44;
            this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 200);
            this.camera.position.set(0, 1.8, 30);
            this.camera.lookAt(0, 1, 0);

            // 3. WebGL Renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: window.devicePixelRatio < 2,
                powerPreference: 'high-performance',
                alpha: false
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.15;
            this.renderer.outputEncoding = THREE.sRGBEncoding;

            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);

            // 4. Build Environment
            this.buildLighting();
            this.buildPitlaneTrack();
            this.buildPitGantryAndGarage();
            this.buildPitCrew();
            this.buildParticles();

            this.scene.add(this.carGroup);
            this.scene.add(this.crewGroup);

            // 5. Load McLaren 720S GT3 Model
            this.loadCarModel(onProgress, onComplete, onError);

            // 6. Handle Window Resizes
            window.addEventListener('resize', this.onWindowResize.bind(this));

            // 7. Start Render Loop
            this.renderLoop = this.renderLoop.bind(this);
            this.renderLoop();
        }

        onWindowResize() {
            if (!this.camera || !this.renderer) return;
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isMobile = width < 768;
            this.camera.fov = isMobile ? 55 : 44;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }

        // ---------------------------------------------------------------------
        // Lighting Architecture
        // ---------------------------------------------------------------------
        buildLighting() {
            // Dark ambient fill with deep slate-blue tone
            const ambient = new THREE.AmbientLight(0x1a243b, 0.55);
            this.scene.add(ambient);

            // Overhead Pit Box Spotlight (Key Light)
            const mainPitSpot = new THREE.SpotLight(0xf0f6ff, 3.8);
            mainPitSpot.position.set(0, 8.5, 0);
            mainPitSpot.target.position.set(0, 0, 0);
            mainPitSpot.angle = Math.PI / 4.2;
            mainPitSpot.penumbra = 0.65;
            mainPitSpot.decay = 1.8;
            mainPitSpot.distance = 25;
            mainPitSpot.castShadow = true;
            mainPitSpot.shadow.mapSize.width = window.innerWidth < 768 ? 1024 : 2048;
            mainPitSpot.shadow.mapSize.height = window.innerWidth < 768 ? 1024 : 2048;
            mainPitSpot.shadow.camera.near = 1;
            mainPitSpot.shadow.camera.far = 25;
            mainPitSpot.shadow.bias = -0.0008;
            this.scene.add(mainPitSpot);
            this.scene.add(mainPitSpot.target);

            // Gantry Neon Purple Fill (Team Identity)
            const purpleWash = new THREE.PointLight(0x8b5cf6, 2.2, 18, 2);
            purpleWash.position.set(2.8, 5.0, 0);
            this.scene.add(purpleWash);

            // Gantry Electric Lime Accent
            const limeWash = new THREE.PointLight(0x00ff88, 1.8, 16, 2);
            limeWash.position.set(-2.8, 5.0, 0);
            this.scene.add(limeWash);

            // Distant Pitlane Entrance Floodlight
            const entryLight = new THREE.SpotLight(0x8099cc, 2.0, 45, Math.PI / 5, 0.7);
            entryLight.position.set(4, 9, 35);
            entryLight.target.position.set(0, 0, 20);
            this.scene.add(entryLight);
            this.scene.add(entryLight.target);

            // Distant Pitlane Exit Floodlight
            const exitLight = new THREE.SpotLight(0x8099cc, 2.0, 45, Math.PI / 5, 0.7);
            exitLight.position.set(4, 9, -35);
            exitLight.target.position.set(0, 0, -20);
            this.scene.add(exitLight);
            this.scene.add(exitLight.target);
        }

        // ---------------------------------------------------------------------
        // Pitlane Track, Surface Markings & Safety Barriers
        // ---------------------------------------------------------------------
        buildPitlaneTrack() {
            const trackWidth = 16;
            const trackLength = 140;

            // Generate Procedural High-Res Asphalt Texture with painted markings
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 2048;
            const ctx = canvas.getContext('2d');

            // Dark Asphalt Base
            ctx.fillStyle = '#090d14';
            ctx.fillRect(0, 0, 2048, 2048);

            // Fine bitumen grain noise
            for (let i = 0; i < 45000; i++) {
                const nx = Math.random() * 2048;
                const ny = Math.random() * 2048;
                const bright = Math.floor(Math.random() * 32) + 8;
                ctx.fillStyle = `rgb(${bright}, ${bright + 2}, ${bright + 6})`;
                ctx.fillRect(nx, ny, 2, 2);
            }

            // Pitlane Center Separation Line (Yellow)
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(980, 0, 24, 2048);

            // Pit Speed Limit Demarcation Text
            ctx.font = 'bold 36px "Orbitron", sans-serif';
            ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(650, 400);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('PIT SPEED 60 KM/H', 0, 0);
            ctx.restore();

            // Pit Box 01 Perimeter (Yellow & Cyan Stencil)
            // Center is around Y=1024, X=450
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 14;
            ctx.strokeRect(200, 780, 520, 500);

            // Diagonal Hazard Warning Chevrons along pit box boundary
            ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
            ctx.lineWidth = 8;
            for (let c = 790; c < 1270; c += 40) {
                ctx.beginPath();
                ctx.moveTo(200, c);
                ctx.lineTo(240, c + 30);
                ctx.stroke();
            }

            // Stencil: "01 // GRiD UP RACING"
            ctx.font = '900 68px "Orbitron", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.save();
            ctx.translate(460, 1024);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('01 // GRiD UP', 0, -40);
            ctx.font = '700 36px "Orbitron", sans-serif';
            ctx.fillStyle = '#8b5cf6';
            ctx.fillText('DRIVE. IMPROVE. ACHIEVE.', 0, 15);
            ctx.restore();

            // Tyre stop crosshairs (Front & Rear)
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 6;
            // LF & RF
            ctx.strokeRect(320, 840, 50, 80);
            ctx.strokeRect(550, 840, 50, 80);
            // LR & RR
            ctx.strokeRect(320, 1120, 50, 80);
            ctx.strokeRect(550, 1120, 50, 80);

            const trackTexture = new THREE.CanvasTexture(canvas);
            trackTexture.wrapS = THREE.RepeatWrapping;
            trackTexture.wrapT = THREE.RepeatWrapping;
            trackTexture.repeat.set(1, 1);

            const trackGeo = new THREE.PlaneGeometry(trackWidth, trackLength);
            const trackMat = new THREE.MeshStandardMaterial({
                map: trackTexture,
                roughness: 0.68,
                metalness: 0.22,
                roughnessMap: trackTexture
            });

            const trackMesh = new THREE.Mesh(trackGeo, trackMat);
            trackMesh.rotation.x = -Math.PI / 2;
            trackMesh.position.y = 0;
            trackMesh.position.x = 2; // Center pitlane in viewing frame
            trackMesh.receiveShadow = true;
            this.scene.add(trackMesh);

            // Pit Wall (FIA Concrete barrier on track side)
            const wallLength = trackLength;
            const wallGeo = new THREE.BoxGeometry(0.8, 1.2, wallLength);
            const wallMat = new THREE.MeshStandardMaterial({
                color: 0x1e2430,
                roughness: 0.85,
                metalness: 0.1
            });
            const pitWall = new THREE.Mesh(wallGeo, wallMat);
            pitWall.position.set(-6, 0.6, 0);
            pitWall.castShadow = true;
            pitWall.receiveShadow = true;
            this.scene.add(pitWall);

            // Red & White Safety Curbs along pit wall base
            const curbGeo = new THREE.BoxGeometry(0.5, 0.15, wallLength);
            const curbCanvas = document.createElement('canvas');
            curbCanvas.width = 64;
            curbCanvas.height = 128;
            const cctx = curbCanvas.getContext('2d');
            cctx.fillStyle = '#dc2626';
            cctx.fillRect(0, 0, 64, 64);
            cctx.fillStyle = '#f8fafc';
            cctx.fillRect(0, 64, 64, 64);
            const curbTex = new THREE.CanvasTexture(curbCanvas);
            curbTex.wrapS = THREE.RepeatWrapping;
            curbTex.wrapT = THREE.RepeatWrapping;
            curbTex.repeat.set(1, 70);
            const curbMat = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.5 });
            const curb = new THREE.Mesh(curbGeo, curbMat);
            curb.position.set(-5.4, 0.08, 0);
            this.scene.add(curb);

            // Debris fence above pit wall (Steel poles & wire mesh)
            for (let z = -60; z <= 60; z += 12) {
                const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8);
                const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
                const post = new THREE.Mesh(postGeo, postMat);
                post.position.set(-6, 2.0, z);
                this.scene.add(post);
            }
        }

        // ---------------------------------------------------------------------
        // Pit Gantry, Overhead LED Signage & Garage Interior
        // ---------------------------------------------------------------------
        buildPitGantryAndGarage() {
            // Overhead Heavy Steel Truss Gantry spanning over the pit box
            const gantryGroup = new THREE.Group();
            const beamMat = new THREE.MeshStandardMaterial({
                color: 0x1f293d,
                metalness: 0.85,
                roughness: 0.35
            });

            // 2 Main Vertical Pillars (Garage side & Pit lane side)
            const pillarGeo = new THREE.BoxGeometry(0.4, 6.5, 0.4);
            const p1 = new THREE.Mesh(pillarGeo, beamMat);
            p1.position.set(4.5, 3.25, 0);
            p1.castShadow = true;
            gantryGroup.add(p1);

            const p2 = new THREE.Mesh(pillarGeo, beamMat);
            p2.position.set(-4.5, 3.25, 0);
            p2.castShadow = true;
            gantryGroup.add(p2);

            // Overhead Horizontal Lattice Truss
            const crossGeo = new THREE.BoxGeometry(9.4, 0.45, 0.45);
            const crossBeam = new THREE.Mesh(crossGeo, beamMat);
            crossBeam.position.set(0, 6.2, 0);
            crossBeam.castShadow = true;
            gantryGroup.add(crossBeam);

            // Overhead Digital Sign Board: "GRID UP RACING"
            const signCanvas = document.createElement('canvas');
            signCanvas.width = 1024;
            signCanvas.height = 256;
            const sctx = signCanvas.getContext('2d');

            sctx.fillStyle = '#060913';
            sctx.fillRect(0, 0, 1024, 256);
            sctx.strokeStyle = '#8b5cf6';
            sctx.lineWidth = 10;
            sctx.strokeRect(10, 10, 1004, 236);

            // Glowing Brand Text
            sctx.font = '900 84px "Orbitron", sans-serif';
            sctx.fillStyle = '#ffffff';
            sctx.textAlign = 'center';
            sctx.fillText('GRID ', 410, 125);
            sctx.fillStyle = '#8b5cf6';
            sctx.fillText('UP', 560, 125);

            sctx.font = '700 32px "JetBrains Mono", monospace';
            sctx.fillStyle = '#00ff88';
            sctx.letterSpacing = '6px';
            sctx.fillText('SIM RACING // PIT 01', 512, 185);

            const signTex = new THREE.CanvasTexture(signCanvas);
            const signGeo = new THREE.BoxGeometry(5.2, 1.25, 0.2);
            const signMat = new THREE.MeshStandardMaterial({
                map: signTex,
                emissive: 0x8b5cf6,
                emissiveMap: signTex,
                emissiveIntensity: 0.6,
                roughness: 0.3
            });
            const signMesh = new THREE.Mesh(signGeo, signMat);
            signMesh.position.set(0, 5.2, 0);
            gantryGroup.add(signMesh);

            // Digital Live Pitstop Stopwatch Board (facing front)
            this.pitTimerCanvas = document.createElement('canvas');
            this.pitTimerCanvas.width = 512;
            this.pitTimerCanvas.height = 128;
            this.pitTimerTexture = new THREE.CanvasTexture(this.pitTimerCanvas);
            this.updatePitTimerDisplay('0.00 s', 'READY');

            const timerGeo = new THREE.PlaneGeometry(2.2, 0.55);
            const timerMat = new THREE.MeshBasicMaterial({
                map: this.pitTimerTexture,
                transparent: true
            });
            this.pitTimerDisplay = new THREE.Mesh(timerGeo, timerMat);
            this.pitTimerDisplay.position.set(0, 4.25, 0.15);
            gantryGroup.add(this.pitTimerDisplay);

            // Coiled Pneumatic Air Hose Lines (Hanging from gantry to wheels)
            const hoseMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
            const yellowHoseMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });
            [
                { x: 1.8, z: 1.2, mat: yellowHoseMat },
                { x: -1.8, z: 1.2, mat: yellowHoseMat },
                { x: 1.8, z: -1.4, mat: hoseMat },
                { x: -1.8, z: -1.4, mat: hoseMat }
            ].forEach(h => {
                const hoseGeo = new THREE.CylinderGeometry(0.02, 0.02, 3.8, 8);
                const hose = new THREE.Mesh(hoseGeo, h.mat);
                hose.position.set(h.x, 3.8, h.z);
                gantryGroup.add(hose);
            });

            this.scene.add(gantryGroup);

            // Pit Wall Engineering Stand (Curved Telemetry Monitors)
            const standGroup = new THREE.Group();
            const deskGeo = new THREE.BoxGeometry(1.2, 0.9, 3.2);
            const deskMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
            const desk = new THREE.Mesh(deskGeo, deskMat);
            desk.position.set(-4.8, 0.45, 0);
            standGroup.add(desk);

            // Curved monitors with simulated telemetry traces
            for (let m = -1; m <= 1; m++) {
                const monGeo = new THREE.BoxGeometry(0.05, 0.65, 0.95);
                const monMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
                const mon = new THREE.Mesh(monGeo, monMat);
                mon.position.set(-4.5, 1.25, m * 1.05);
                mon.rotation.y = 0.25 * m;
                standGroup.add(mon);
            }
            this.scene.add(standGroup);

            // Garage Interior Backdrop (Tire racks, tool cabinets)
            const garageGroup = new THREE.Group();
            garageGroup.position.set(5.8, 0, 0);

            // Rear Garage Wall with ambient purple strip
            const gWallGeo = new THREE.BoxGeometry(0.4, 5.0, 30);
            const gWallMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1d, roughness: 0.7 });
            const gWall = new THREE.Mesh(gWallGeo, gWallMat);
            gWall.position.set(1.5, 2.5, 0);
            garageGroup.add(gWall);

            // Stacked Racing Slick Tires with Red Electric Warmers
            for (let s = -3; s <= 3; s += 2) {
                for (let h = 0; h < 3; h++) {
                    const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.32, 16);
                    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
                    const tire = new THREE.Mesh(tireGeo, tireMat);
                    tire.position.set(0.6, 0.2 + h * 0.33, s * 1.8);
                    tire.castShadow = true;
                    garageGroup.add(tire);

                    // Red warmer band
                    const bandGeo = new THREE.CylinderGeometry(0.365, 0.365, 0.2, 16);
                    const bandMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
                    const band = new THREE.Mesh(bandGeo, bandMat);
                    band.position.set(0.6, 0.2 + h * 0.33, s * 1.8);
                    garageGroup.add(band);
                }
            }
            this.scene.add(garageGroup);
        }

        updatePitTimerDisplay(timeText, statusText) {
            if (!this.pitTimerCanvas || !this.pitTimerTexture) return;
            const ctx = this.pitTimerCanvas.getContext('2d');
            ctx.clearRect(0, 0, 512, 128);

            ctx.fillStyle = 'rgba(6, 10, 20, 0.9)';
            ctx.fillRect(0, 0, 512, 128);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 4;
            ctx.strokeRect(4, 4, 504, 120);

            ctx.font = '900 52px "JetBrains Mono", monospace';
            ctx.fillStyle = '#00ff88';
            ctx.textAlign = 'center';
            ctx.fillText(timeText, 256, 68);

            ctx.font = '700 24px "Orbitron", sans-serif';
            ctx.fillStyle = '#f8fafc';
            ctx.fillText(statusText, 256, 106);

            this.pitTimerTexture.needsUpdate = true;
        }

        // ---------------------------------------------------------------------
        // 3D Pit Crew Characters
        // ---------------------------------------------------------------------
        buildPitCrew() {
            // Team colors: Black suit with GRiD UP Purple (#8b5cf6) & Lime (#00ff88)
            const suitMat = new THREE.MeshStandardMaterial({
                color: 0x111827,
                roughness: 0.65
            });
            const accentMat = new THREE.MeshStandardMaterial({
                color: 0x8b5cf6,
                roughness: 0.4
            });
            const helmetMat = new THREE.MeshStandardMaterial({
                color: 0x090d16,
                metalness: 0.85,
                roughness: 0.25
            });
            const visorMat = new THREE.MeshStandardMaterial({
                color: 0x00ff88,
                metalness: 0.95,
                roughness: 0.1
            });
            const gunMat = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                metalness: 0.9,
                roughness: 0.2
            });

            // Factory to build an articulated crouching pit crew member
            const createCrewMember = (side = 'left') => {
                const member = new THREE.Group();

                // Torso
                const torsoGeo = new THREE.BoxGeometry(0.42, 0.52, 0.28);
                const torso = new THREE.Mesh(torsoGeo, suitMat);
                torso.position.y = 0.55;
                torso.castShadow = true;
                member.add(torso);

                // Purple chest strip
                const stripeGeo = new THREE.BoxGeometry(0.43, 0.12, 0.29);
                const stripe = new THREE.Mesh(stripeGeo, accentMat);
                stripe.position.y = 0.62;
                member.add(stripe);

                // Helmet
                const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
                const head = new THREE.Mesh(headGeo, helmetMat);
                head.position.y = 0.92;
                head.scale.set(1, 1.15, 1.1);
                head.castShadow = true;
                member.add(head);

                // Reflective Visor
                const visorGeo = new THREE.BoxGeometry(0.24, 0.08, 0.08);
                const visor = new THREE.Mesh(visorGeo, visorMat);
                visor.position.set(0, 0.94, side === 'left' ? -0.15 : 0.15);
                member.add(visor);

                // Arms holding Pneumatic Wheel Gun
                const armGroup = new THREE.Group();
                armGroup.position.set(0, 0.58, 0);

                const gunGeo = new THREE.BoxGeometry(0.12, 0.18, 0.35);
                const gun = new THREE.Mesh(gunGeo, gunMat);
                gun.position.set(0, -0.08, side === 'left' ? -0.42 : 0.42);
                gun.castShadow = true;
                armGroup.add(gun);

                // Drive socket tip
                const tipGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12);
                const tip = new THREE.Mesh(tipGeo, gunMat);
                tip.rotation.x = Math.PI / 2;
                tip.position.set(0, -0.08, side === 'left' ? -0.62 : 0.62);
                armGroup.add(tip);

                member.add(armGroup);
                member.armGroup = armGroup;
                member.gun = gun;

                // Legs in kneeling stance
                const legGeo = new THREE.BoxGeometry(0.16, 0.42, 0.24);
                const leg1 = new THREE.Mesh(legGeo, suitMat);
                leg1.position.set(-0.12, 0.22, 0.05);
                leg1.rotation.x = 0.35;
                member.add(leg1);

                const leg2 = new THREE.Mesh(legGeo, suitMat);
                leg2.position.set(0.12, 0.18, -0.12);
                leg2.rotation.x = -0.55;
                member.add(leg2);

                return member;
            };

            // 4 Tyre Changers at LF, RF, LR, RR
            const crewOffsets = [
                { id: 'lf', x: 1.55, z: 1.25, rotY: Math.PI / 2, side: 'left' },
                { id: 'lr', x: 1.55, z: -1.45, rotY: Math.PI / 2, side: 'left' },
                { id: 'rf', x: -1.55, z: 1.25, rotY: -Math.PI / 2, side: 'right' },
                { id: 'rr', x: -1.55, z: -1.45, rotY: -Math.PI / 2, side: 'right' }
            ];

            crewOffsets.forEach(cfg => {
                const c = createCrewMember(cfg.side);
                c.position.set(cfg.x, 0, cfg.z);
                c.rotation.y = cfg.rotY;
                c.userData = {
                    origX: cfg.x,
                    origZ: cfg.z,
                    side: cfg.side
                };
                this.crewGroup.add(c);
                this.tyreChangers.push(c);
            });

            // 1 Lollipop Marshal standing front-left of pit box
            const marshal = new THREE.Group();
            marshal.position.set(2.2, 0, 3.2);

            const mTorso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.28), suitMat);
            mTorso.position.y = 1.0;
            marshal.add(mTorso);

            const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), helmetMat);
            mHead.position.y = 1.48;
            marshal.add(mHead);

            // Lollipop sign post
            const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 3.2, 8);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(-0.7, 1.6, 0);
            pole.rotation.z = -0.15;
            marshal.add(pole);

            // Lollipop paddle head with dual LED display
            this.lollipopCanvas = document.createElement('canvas');
            this.lollipopCanvas.width = 256;
            this.lollipopCanvas.height = 256;
            this.lollipopTexture = new THREE.CanvasTexture(this.lollipopCanvas);
            this.updateLollipopSign('BRAKE', '#ef4444');

            const paddleGeo = new THREE.CircleGeometry(0.4, 24);
            const paddleMat = new THREE.MeshBasicMaterial({
                map: this.lollipopTexture,
                side: THREE.DoubleSide
            });
            this.lollipopSign = new THREE.Mesh(paddleGeo, paddleMat);
            this.lollipopSign.position.set(-1.1, 2.8, 0);
            this.lollipopSign.rotation.y = Math.PI / 2;
            marshal.add(this.lollipopSign);

            this.lollipop = marshal;
            this.crewGroup.add(marshal);
        }

        updateLollipopSign(text, colorHex) {
            if (!this.lollipopCanvas || !this.lollipopTexture) return;
            const ctx = this.lollipopCanvas.getContext('2d');
            ctx.clearRect(0, 0, 256, 256);

            // Circular ring
            ctx.fillStyle = '#060a14';
            ctx.beginPath();
            ctx.arc(128, 128, 120, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = colorHex;
            ctx.lineWidth = 14;
            ctx.stroke();

            // Bold LED Stencil Text
            ctx.font = '900 48px "Orbitron", sans-serif';
            ctx.fillStyle = colorHex;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 128, 128);

            this.lollipopTexture.needsUpdate = true;
        }

        // ---------------------------------------------------------------------
        // Atmospheric Dust Particles & Tyre Smoke
        // ---------------------------------------------------------------------
        buildParticles() {
            // Ambient dust motes floating under spotlights
            const count = 350;
            const geom = new THREE.BufferGeometry();
            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count * 3; i += 3) {
                positions[i] = (Math.random() - 0.5) * 16;
                positions[i + 1] = Math.random() * 7;
                positions[i + 2] = (Math.random() - 0.5) * 45;
            }
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const mat = new THREE.PointsMaterial({
                color: 0x8b5cf6,
                size: 0.045,
                transparent: true,
                opacity: 0.65,
                blending: THREE.AdditiveBlending
            });

            this.ambientParticles = new THREE.Points(geom, mat);
            this.scene.add(this.ambientParticles);
        }

        // ---------------------------------------------------------------------
        // McLaren 720S GT3 Model Loading & Hierarchy Optimization
        // ---------------------------------------------------------------------
        loadCarModel(onProgress, onComplete, onError) {
            const loader = new THREE.GLTFLoader();
            const modelUrl = 'assets/models/mclaren-720s.glb';

            console.log('[3D Engine] Loading car model from:', modelUrl);

            loader.load(
                modelUrl,
                (gltf) => {
                    this.carModel = gltf.scene;
                    // The GLB has a 0.01 FBX unit matrix on its root node.
                    // Scale by 100 to bring the McLaren 720S to exact 1:1 real-world meter scale!
                    this.carModel.scale.set(100, 100, 100);
                    console.log('[3D Engine] GLB loaded successfully. Optimizing hierarchy...');

                    // Setup Wheels, Materials & Lights
                    this.setupCarHierarchy();

                    const bbox = new THREE.Box3().setFromObject(this.carModel);
                    console.log('[3D Engine] Car BBox size:', bbox.getSize(new THREE.Vector3()));

                    this.carGroup.add(this.carModel);
                    this.isLoaded = true;

                    if (typeof onComplete === 'function') onComplete(this);
                },
                (xhr) => {
                    if (xhr.lengthComputable && typeof onProgress === 'function') {
                        const pct = Math.round((xhr.loaded / xhr.total) * 100);
                        onProgress(pct);
                    }
                },
                (err) => {
                    console.error('[3D Engine] Error loading McLaren 720S model:', err);
                    if (typeof onError === 'function') onError(err);
                }
            );
        }

        setupCarHierarchy() {
            if (!this.carModel) return;

            // Target nodes for wheels
            const wheelNodeMap = {
                lf: 'WHEEL_LF',
                rf: 'WHEEL_RF',
                lr: 'WHEEL_LR',
                rr: 'WHEEL_RR'
            };

            // Setup Wheel Pivots for accurate on-axle rotation and pitstop tyre swap
            ['lf', 'rf', 'lr', 'rr'].forEach(k => {
                const targetName = wheelNodeMap[k];
                let node = null;
                this.carModel.traverse(child => {
                    if (child.name && child.name.includes(targetName)) {
                        node = child;
                    }
                });

                if (node) {
                    const center = this.wheelCenters[k];
                    const pivot = this.wheelPivots[k];
                    pivot.position.copy(center);

                    // Reparent node meshes into pivot
                    node.parent.add(pivot);
                    pivot.add(node);
                    node.position.sub(center);

                    this.wheels[k] = pivot;
                }
            });

            // Enhance materials & discover lights
            this.carModel.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const mat = child.material;
                    if (mat) {
                        // High-end GT3 metallic car paint
                        if (mat.name && mat.name.toLowerCase().includes('carpaint')) {
                            mat.metalness = 0.85;
                            mat.roughness = 0.18;
                        }
                        // Tinted endurance windshield / windows
                        if (mat.name && mat.name.toLowerCase().includes('window')) {
                            mat.transparent = true;
                            mat.opacity = 0.55;
                            mat.roughness = 0.08;
                        }
                    }
                }
            });

            // Attach 2 dynamic forward spotlights to the headlights
            const leftHeadlight = new THREE.SpotLight(0xf8fafc, 6.0, 45, Math.PI / 6, 0.45);
            leftHeadlight.position.set(0.65, 0.55, 2.1);
            leftHeadlight.target.position.set(0.4, 0.1, 15);
            this.carGroup.add(leftHeadlight);
            this.carGroup.add(leftHeadlight.target);
            this.headlights.push(leftHeadlight);

            const rightHeadlight = new THREE.SpotLight(0xf8fafc, 6.0, 45, Math.PI / 6, 0.45);
            rightHeadlight.position.set(-0.65, 0.55, 2.1);
            rightHeadlight.target.position.set(-0.4, 0.1, 15);
            this.carGroup.add(rightHeadlight);
            this.carGroup.add(rightHeadlight.target);
            this.headlights.push(rightHeadlight);

            // Taillights (Red glow on rear diffuser)
            const rearLight = new THREE.PointLight(0xff0033, 0.8, 4);
            rearLight.position.set(0, 0.65, -2.35);
            this.carGroup.add(rearLight);
            this.taillights.push(rearLight);

            // Initial car position (Start of Scene 1 in distance)
            this.carGroup.position.set(0, 0, 50);
        }

        // ---------------------------------------------------------------------
        // Continuous Cinematic Timeline Synchronization (Driven by GSAP)
        // ---------------------------------------------------------------------
        updateFromTimeline(progress, velocity = 0) {
            if (!this.isLoaded) return;

            // -----------------------------------------------------------------
            // SCENE 1: CAR ENTERS PITLANE (0.00 -> 0.38)
            // -----------------------------------------------------------------
            if (progress < 0.38) {
                const p = progress / 0.38; // 0 to 1
                // Deceleration curve from Z = 50m to Z = 0m (pit box)
                const easedP = Math.sin((p * Math.PI) / 2);
                const carZ = 50 - (easedP * 50);
                this.carGroup.position.z = carZ;

                // Subtle steering entry arc into the pit box
                const steerCurve = Math.sin(p * Math.PI) * 0.08;
                this.carGroup.position.x = steerCurve * 0.8;
                this.carGroup.rotation.y = steerCurve * 0.35;

                // Wheels rotate with forward distance
                const deltaZ = this.lastCarZ - carZ;
                this.wheelRotationAngle += deltaZ / 0.35;
                ['lf', 'rf', 'lr', 'rr'].forEach(k => {
                    if (this.wheels[k]) {
                        this.wheels[k].rotation.x = this.wheelRotationAngle;
                        this.wheels[k].position.x = this.wheelCenters[k].x; // Restored to hubs
                    }
                });
                this.lastCarZ = carZ;

                // Suspension dip when braking into box
                const brakeDip = Math.sin(Math.pow(p, 3) * Math.PI) * 0.025;
                this.carGroup.position.y = -brakeDip;

                // Headlights illumination
                this.headlights.forEach(h => {
                    h.intensity = p > 0.05 ? 6.5 : 1.2;
                });
                // Taillights glow red on heavy braking
                this.taillights.forEach(t => {
                    t.intensity = p > 0.6 ? 3.5 : 0.8;
                });

                // Lollipop: lowered waiting for car to brake
                if (this.lollipop) {
                    this.updateLollipopSign('BRAKE', '#ef4444');
                    this.lollipop.rotation.x = 0;
                }

                // Camera Sequence: Wide track view tracking the incoming vehicle
                const camP = Math.pow(p, 0.8);
                this.cameraPosition.set(
                    2.8 - (camP * 1.2),
                    1.4 + (camP * 0.4),
                    carZ + 4.8 + ((1 - camP) * 8.0)
                );
                this.cameraLookAt.set(0, 0.6, carZ - 1.5);

                this.updatePitTimerDisplay('0.00 s', 'APPROACH');
            }
            // -----------------------------------------------------------------
            // SCENE 2: THE COORDINATED PITSTOP (0.38 -> 0.65)
            // -----------------------------------------------------------------
            else if (progress >= 0.38 && progress < 0.65) {
                const p = (progress - 0.38) / 0.27; // 0 to 1
                this.carGroup.position.set(0, 0, 0);
                this.carGroup.rotation.set(0, 0, 0);

                // Air jack lift: car lifts ~7cm off the ground
                const liftP = Math.min(1, p * 4.5);
                const dropP = Math.max(0, (p - 0.88) / 0.12);
                const currentLift = (liftP * 0.075) - (dropP * 0.075);
                this.carGroup.position.y = currentLift;

                // Tyre Change Animation:
                // p: 0.15 -> 0.50 (wheels slide outward off hubs)
                // p: 0.50 -> 0.85 (new wheels slide back on)
                let wheelSlideOut = 0;
                if (p >= 0.15 && p < 0.50) {
                    wheelSlideOut = ((p - 0.15) / 0.35) * 0.65;
                } else if (p >= 0.50 && p < 0.85) {
                    wheelSlideOut = (1 - ((p - 0.50) / 0.35)) * 0.65;
                }

                if (this.wheels.lf) this.wheels.lf.position.x = this.wheelCenters.lf.x + wheelSlideOut;
                if (this.wheels.lr) this.wheels.lr.position.x = this.wheelCenters.lr.x + wheelSlideOut;
                if (this.wheels.rf) this.wheels.rf.position.x = this.wheelCenters.rf.x - wheelSlideOut;
                if (this.wheels.rr) this.wheels.rr.position.x = this.wheelCenters.rr.x - wheelSlideOut;

                // Tyre Changers move in, guns fire
                this.tyreChangers.forEach(c => {
                    const sideMultiplier = c.userData.side === 'left' ? 1 : -1;
                    // Lean inward towards the wheel during active tyre swap
                    if (p >= 0.12 && p <= 0.85) {
                        c.position.x = c.userData.origX - (sideMultiplier * 0.18);
                        if (c.armGroup) {
                            // High-frequency gun impact vibration
                            c.armGroup.position.y = 0.58 + Math.sin(Date.now() * 0.08) * 0.015;
                        }
                    } else {
                        c.position.x = c.userData.origX;
                    }
                });

                // Lollipop transitions: "BRAKE" -> "IN GEAR" -> "GO"
                if (this.lollipop) {
                    if (p < 0.65) {
                        this.updateLollipopSign('STOP', '#ef4444');
                        this.lollipop.rotation.x = 0;
                    } else if (p < 0.88) {
                        this.updateLollipopSign('1ST GEAR', '#f59e0b');
                        this.lollipop.rotation.x = 0;
                    } else {
                        this.updateLollipopSign('GO!', '#00ff88');
                        // Paddle lifts up out of way
                        this.lollipop.rotation.x = -Math.PI / 3;
                    }
                }

                // Dynamic Pitstop Stopwatch Timer
                const timerSec = (p * 2.38).toFixed(2);
                this.updatePitTimerDisplay(`${timerSec} s`, p < 0.88 ? 'SERVICE' : 'CLEAR');

                // Camera: Dynamic sweeping cinematic close-up of the pitstop action
                // Sweeps from front-right 3/4 to side profile focusing on tire changes and car aero
                const camX = -3.2 - Math.sin(p * Math.PI) * 0.4;
                const camY = 0.95 + Math.sin(p * Math.PI * 0.5) * 0.45;
                const camZ = 2.4 - (p * 3.6);
                this.cameraPosition.set(camX, camY, camZ);
                this.cameraLookAt.set(0, 0.55, 0.6 - (p * 1.2));

                this.lastCarZ = 0;
            }
            // -----------------------------------------------------------------
            // SCENE 3: RELEASE & DEPARTURE (0.65 -> 0.88)
            // -----------------------------------------------------------------
            else if (progress >= 0.65 && progress < 0.88) {
                const p = (progress - 0.65) / 0.23; // 0 to 1
                // Rapid GT3 launch acceleration curve: from Z = 0 to Z = -45m
                const launchZ = -Math.pow(p, 1.6) * 45;
                this.carGroup.position.z = launchZ;
                this.carGroup.position.y = 0;
                this.carGroup.rotation.y = 0;

                // Wheel spin with acceleration
                const deltaZ = this.lastCarZ - launchZ;
                this.wheelRotationAngle += deltaZ / 0.35;
                ['lf', 'rf', 'lr', 'rr'].forEach(k => {
                    if (this.wheels[k]) {
                        this.wheels[k].rotation.x = this.wheelRotationAngle;
                        this.wheels[k].position.x = this.wheelCenters[k].x;
                    }
                });
                this.lastCarZ = launchZ;

                // Pit crew clears out of box
                this.tyreChangers.forEach(c => {
                    const sideMultiplier = c.userData.side === 'left' ? 1 : -1;
                    c.position.x = c.userData.origX + (sideMultiplier * 0.35);
                });

                if (this.lollipop) {
                    this.updateLollipopSign('GO!', '#00ff88');
                    this.lollipop.rotation.x = -Math.PI / 2.2;
                }

                // Camera follows the departing vehicle briefly, panning as it races away
                this.cameraPosition.set(
                    2.2 - (p * 1.5),
                    1.3 + (p * 0.8),
                    4.2 - (p * 2.5)
                );
                this.cameraLookAt.set(0, 0.6, launchZ);

                this.updatePitTimerDisplay('2.38 s', 'DEPARTED');
            }
            // -----------------------------------------------------------------
            // SCENE 4: REVEAL GRiD UP WEBSITE (0.88 -> 1.00)
            // -----------------------------------------------------------------
            else if (progress >= 0.88) {
                const p = (progress - 0.88) / 0.12; // 0 to 1
                // Car has sped off into the night
                this.carGroup.position.z = -45 - (p * 25);

                // Camera tilts up smoothly towards the illuminated GRiD UP pit gantry
                this.cameraPosition.set(
                    0.5 - (p * 0.5),
                    2.2 + (p * 2.8),
                    2.5 + (p * 4.5)
                );
                this.cameraLookAt.set(0, 4.8 - (p * 1.2), 0);
            }
        }

        renderLoop() {
            if (this.isDisposed) return;
            this.animFrameId = requestAnimationFrame(this.renderLoop);

            const delta = this.clock.getDelta();

            // Smooth camera interpolation
            if (this.camera) {
                this.camera.position.lerp(this.cameraPosition, 0.1);
                const currentLook = new THREE.Vector3();
                this.camera.getWorldDirection(currentLook);
                const targetLook = this.cameraLookAt.clone().sub(this.camera.position).normalize();
                currentLook.lerp(targetLook, 0.1);
                this.camera.lookAt(this.camera.position.clone().add(currentLook));
            }

            // Animate ambient dust motes
            if (this.ambientParticles) {
                const pos = this.ambientParticles.geometry.attributes.position.array;
                for (let i = 1; i < pos.length; i += 3) {
                    pos[i] -= delta * 0.15;
                    if (pos[i] < 0) pos[i] = 7;
                }
                this.ambientParticles.geometry.attributes.position.needsUpdate = true;
            }

            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        }

        dispose() {
            this.isDisposed = true;
            if (this.animFrameId) {
                cancelAnimationFrame(this.animFrameId);
            }
            window.removeEventListener('resize', this.onWindowResize);

            if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                this.renderer.dispose();
            }
        }
    }

    window.Pitstop3DScene = Pitstop3DScene;

})(window);
