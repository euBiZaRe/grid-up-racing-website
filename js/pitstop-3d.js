/**
 * GRiD UP - Interactive 3D Pitstop Experience Engine
 * Built with Three.js r128 & GLTFLoader.
 * Features the McLaren 720S GT3 in a dark motorsport pitlane,
 * realistic forward vehicle kinematics, 3D pit crew, and dynamic lighting.
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
            // Model space wheel centers
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
            this.airJackOperator = null;
            
            // Particles
            this.ambientParticles = null;
            this.tyreSmoke = null;
            
            // Overhead signage / LED displays
            this.pitTimerDisplay = null;
            this.pitTimerCanvas = null;
            this.pitTimerTexture = null;
            
            // Smooth Camera Interpolation targets
            this.currentCameraPos = new THREE.Vector3(0, 2.2, 32);
            this.targetCameraPos = new THREE.Vector3(0, 2.2, 32);
            this.currentCameraLookAt = new THREE.Vector3(0, 1.0, 10);
            this.targetCameraLookAt = new THREE.Vector3(0, 1.0, 10);
            
            // State
            this.wheelRotationAngle = 0;
            this.currentTimelineProgress = 0;
            this.targetTimelineProgress = 0;
            this.isLoaded = false;
            this.isDisposed = false;
            this.animFrameId = null;
        }

        init(container, onProgress, onComplete, onError) {
            this.container = container;
            const width = window.innerWidth;
            const height = window.innerHeight;

            // 1. Scene & Atmospheric Fog
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x04060b);
            this.scene.fog = new THREE.FogExp2(0x050711, 0.015);

            // 2. Camera with responsive FOV (wider on mobile to prevent clipping)
            const isMobile = width < 768;
            const fov = isMobile ? 54 : 42;
            this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 220);
            this.camera.position.set(0, 2.2, 32);
            this.currentCameraPos.set(0, 2.2, 32);
            this.targetCameraPos.set(0, 2.2, 32);
            this.currentCameraLookAt.set(0, 1.0, 10);
            this.targetCameraLookAt.set(0, 1.0, 10);
            this.camera.lookAt(this.currentCameraLookAt);

            // 3. WebGL Renderer with High-Performance Tone Mapping & Soft Shadows
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
            this.renderer.toneMappingExposure = 1.18;
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
            this.camera.fov = isMobile ? 54 : 42;
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
            const ambient = new THREE.AmbientLight(0x1a243b, 0.6);
            this.scene.add(ambient);

            // Overhead Pit Box Spotlight (Key Light)
            const mainPitSpot = new THREE.SpotLight(0xf0f6ff, 4.2);
            mainPitSpot.position.set(0, 9.0, 0);
            mainPitSpot.target.position.set(0, 0, 0);
            mainPitSpot.angle = Math.PI / 4.0;
            mainPitSpot.penumbra = 0.65;
            mainPitSpot.decay = 1.7;
            mainPitSpot.distance = 28;
            mainPitSpot.castShadow = true;
            mainPitSpot.shadow.mapSize.width = window.innerWidth < 768 ? 1024 : 2048;
            mainPitSpot.shadow.mapSize.height = window.innerWidth < 768 ? 1024 : 2048;
            mainPitSpot.shadow.camera.near = 1;
            mainPitSpot.shadow.camera.far = 28;
            mainPitSpot.shadow.bias = -0.0008;
            this.scene.add(mainPitSpot);
            this.scene.add(mainPitSpot.target);

            // Gantry Neon Purple Fill (Team Identity)
            const purpleWash = new THREE.PointLight(0x8b5cf6, 2.5, 20, 2);
            purpleWash.position.set(3.2, 5.2, 0);
            this.scene.add(purpleWash);

            // Gantry Electric Lime Accent
            const limeWash = new THREE.PointLight(0x00ff88, 2.0, 18, 2);
            limeWash.position.set(-3.2, 5.2, 0);
            this.scene.add(limeWash);

            // Pitlane Entrance Floodlight (At Z = +40)
            const entryLight = new THREE.SpotLight(0x90a5d4, 2.4, 50, Math.PI / 4.5, 0.7);
            entryLight.position.set(5, 9.5, 42);
            entryLight.target.position.set(0, 0, 22);
            this.scene.add(entryLight);
            this.scene.add(entryLight.target);

            // Pitlane Exit Floodlight (At Z = -40)
            const exitLight = new THREE.SpotLight(0x90a5d4, 2.4, 50, Math.PI / 4.5, 0.7);
            exitLight.position.set(5, 9.5, -42);
            exitLight.target.position.set(0, 0, -22);
            this.scene.add(exitLight);
            this.scene.add(exitLight.target);
        }

        // ---------------------------------------------------------------------
        // Pitlane Track, Surface Markings & Safety Barriers
        // ---------------------------------------------------------------------
        buildPitlaneTrack() {
            const trackWidth = 16;
            const trackLength = 150;

            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 2048;
            const ctx = canvas.getContext('2d');

            // Dark Asphalt Base
            ctx.fillStyle = '#090d14';
            ctx.fillRect(0, 0, 2048, 2048);

            // Bitumen grain noise
            for (let i = 0; i < 50000; i++) {
                const nx = Math.random() * 2048;
                const ny = Math.random() * 2048;
                const bright = Math.floor(Math.random() * 32) + 8;
                ctx.fillStyle = `rgb(${bright}, ${bright + 2}, ${bright + 6})`;
                ctx.fillRect(nx, ny, 2, 2);
            }

            // Pitlane Fast Lane Separation Line (Yellow)
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(980, 0, 24, 2048);

            // Pit Speed Limit Demarcation Text at Entry (+Z, which is top of texture)
            ctx.font = 'bold 38px "Orbitron", sans-serif';
            ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(650, 360);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('PIT SPEED 60 KM/H', 0, 0);
            ctx.restore();

            // Pit Box 01 Perimeter (Yellow Stencil)
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 14;
            ctx.strokeRect(200, 780, 520, 500);

            // Diagonal Hazard Warning Chevrons along pit box boundary
            ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)';
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

            // Tyre stop crosshairs (Front is towards bottom/exit, Rear is towards top/entry)
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 6;
            ctx.strokeRect(320, 840, 50, 80);
            ctx.strokeRect(550, 840, 50, 80);
            ctx.strokeRect(320, 1120, 50, 80);
            ctx.strokeRect(550, 1120, 50, 80);

            const trackTexture = new THREE.CanvasTexture(canvas);
            trackTexture.wrapS = THREE.RepeatWrapping;
            trackTexture.wrapT = THREE.RepeatWrapping;
            trackTexture.repeat.set(1, 1);

            const trackGeo = new THREE.PlaneGeometry(trackWidth, trackLength);
            const trackMat = new THREE.MeshStandardMaterial({
                map: trackTexture,
                roughness: 0.65,
                metalness: 0.25,
                roughnessMap: trackTexture
            });

            const trackMesh = new THREE.Mesh(trackGeo, trackMat);
            trackMesh.rotation.x = -Math.PI / 2;
            trackMesh.position.y = 0;
            trackMesh.position.x = 2; // Position pitlane in viewing frame
            trackMesh.receiveShadow = true;
            this.scene.add(trackMesh);

            // Concrete Pit Wall on the left (trackside, X = -6)
            const wallLength = trackLength;
            const wallGeo = new THREE.BoxGeometry(0.8, 1.25, wallLength);
            const wallMat = new THREE.MeshStandardMaterial({
                color: 0x1e2430,
                roughness: 0.85,
                metalness: 0.1
            });
            const pitWall = new THREE.Mesh(wallGeo, wallMat);
            pitWall.position.set(-6, 0.625, 0);
            pitWall.castShadow = true;
            pitWall.receiveShadow = true;
            this.scene.add(pitWall);

            // Red & White Safety Curbs along pit wall base
            const curbGeo = new THREE.BoxGeometry(0.5, 0.16, wallLength);
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
            curbTex.repeat.set(1, 75);
            const curbMat = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.5 });
            const curb = new THREE.Mesh(curbGeo, curbMat);
            curb.position.set(-5.4, 0.08, 0);
            this.scene.add(curb);

            // Steel posts along pit wall for protective catch fencing
            for (let z = -65; z <= 65; z += 10) {
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
            sctx.fillText('SIM RACING // PIT 01', 512, 185);

            const signTex = new THREE.CanvasTexture(signCanvas);
            const signGeo = new THREE.BoxGeometry(5.2, 1.25, 0.2);
            const signMat = new THREE.MeshStandardMaterial({
                map: signTex,
                emissive: 0x8b5cf6,
                emissiveMap: signTex,
                emissiveIntensity: 0.65,
                roughness: 0.3
            });
            const signMesh = new THREE.Mesh(signGeo, signMat);
            signMesh.position.set(0, 5.2, 0);
            gantryGroup.add(signMesh);

            // Digital Live Pitstop Stopwatch Board (facing front toward pit entry)
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
        // High-End 3D Pit Crew & Precision GT3 Service Equipment
        // ---------------------------------------------------------------------
        buildPitCrew() {
            // Materials: Sleek matte race suit, titanium tools, carbon helmets with iridescent gold/green visors
            const suitMat = new THREE.MeshStandardMaterial({
                color: 0x0d111a,
                roughness: 0.72,
                metalness: 0.1
            });
            const accentMat = new THREE.MeshStandardMaterial({
                color: 0x8b5cf6,
                roughness: 0.4,
                metalness: 0.2
            });
            const helmetMat = new THREE.MeshStandardMaterial({
                color: 0x080b12,
                metalness: 0.9,
                roughness: 0.18
            });
            const visorMat = new THREE.MeshPhysicalMaterial({
                color: 0x00ff88,
                metalness: 0.95,
                roughness: 0.12,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            });
            const gunMat = new THREE.MeshStandardMaterial({
                color: 0x475569,
                metalness: 0.85,
                roughness: 0.25
            });

            const createCrewMember = () => {
                const member = new THREE.Group();

                // Kneeling base pad on pitlane surface
                const matGeo = new THREE.BoxGeometry(0.7, 0.02, 0.7);
                const matMat = new THREE.MeshStandardMaterial({ color: 0x171f2e, roughness: 0.9 });
                const kneeler = new THREE.Mesh(matGeo, matMat);
                kneeler.position.set(0, 0.01, 0);
                kneeler.receiveShadow = true;
                member.add(kneeler);

                // Smooth athletic tapered torso
                const torsoGeo = new THREE.CylinderGeometry(0.19, 0.14, 0.52, 16);
                const torso = new THREE.Mesh(torsoGeo, suitMat);
                torso.position.set(0, 0.46, 0.03);
                torso.rotation.x = 0.22; // Natural athletic forward lean toward wheel hub
                torso.castShadow = true;
                member.add(torso);

                // GRiD UP Violet Team Stripe across chest
                const stripeGeo = new THREE.CylinderGeometry(0.195, 0.155, 0.14, 16);
                const stripe = new THREE.Mesh(stripeGeo, accentMat);
                stripe.position.set(0, 0.52, 0.04);
                stripe.rotation.x = 0.22;
                member.add(stripe);

                // Aerodynamic Carbon Helmet
                const headGroup = new THREE.Group();
                headGroup.position.set(0, 0.80, -0.05);

                const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 20), helmetMat);
                head.scale.set(0.95, 1.05, 1.15);
                head.castShadow = true;
                headGroup.add(head);

                // Curved Iridescent Gold/Green Visor
                const visor = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.152, 0.152, 0.08, 16, 1, false, Math.PI * 0.7, Math.PI * 0.6),
                    visorMat
                );
                visor.position.set(0, 0.02, -0.04);
                headGroup.add(visor);
                member.add(headGroup);

                // Kneeling Leg Silhouettes
                const legGeo = new THREE.CylinderGeometry(0.085, 0.07, 0.42, 12);
                const leftLeg = new THREE.Mesh(legGeo, suitMat);
                leftLeg.position.set(-0.13, 0.19, 0.12);
                leftLeg.rotation.x = 0.65;
                member.add(leftLeg);

                const rightLeg = new THREE.Mesh(legGeo, suitMat);
                rightLeg.position.set(0.13, 0.17, -0.08);
                rightLeg.rotation.x = -0.45;
                member.add(rightLeg);

                // Arm & Precision Pneumatic Impact Wrench Assembly
                const armGroup = new THREE.Group();
                armGroup.position.set(0, 0.46, -0.05);

                // Contoured Arms
                const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.38, 12);
                const leftArm = new THREE.Mesh(armGeo, suitMat);
                leftArm.position.set(-0.17, -0.08, -0.16);
                leftArm.rotation.set(-0.85, 0, 0.28);
                armGroup.add(leftArm);

                const rightArm = new THREE.Mesh(armGeo, suitMat);
                rightArm.position.set(0.17, -0.08, -0.16);
                rightArm.rotation.set(-0.85, 0, -0.28);
                armGroup.add(rightArm);

                // Machined Impact Wrench
                const gun = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.26), gunMat);
                gun.position.set(0, -0.10, -0.38);
                gun.castShadow = true;
                armGroup.add(gun);

                // Titanium Center-Lock Drive Socket
                const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 16), gunMat);
                socket.rotation.x = Math.PI / 2;
                socket.position.set(0, -0.10, -0.56);
                socket.castShadow = true;
                armGroup.add(socket);

                member.add(armGroup);
                member.armGroup = armGroup;
                member.gun = gun;

                return member;
            };

            // 4 Tyre Changers positioned precisely around the McLaren's 4 wheel hubs
            const crewConfigs = [
                { id: 'rf', x: 1.62, z: -1.25, rotY: -Math.PI / 2, side: 'garage' }, // Right Front
                { id: 'rr', x: 1.62, z: 1.45, rotY: -Math.PI / 2, side: 'garage' },  // Right Rear
                { id: 'lf', x: -1.62, z: -1.25, rotY: Math.PI / 2, side: 'wall' },  // Left Front
                { id: 'lr', x: -1.62, z: 1.45, rotY: Math.PI / 2, side: 'wall' }   // Left Rear
            ];

            crewConfigs.forEach(cfg => {
                const c = createCrewMember();
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

            // 1 Front Marshal with Carbon Fiber Digital Lollipop Boom (Z ≈ -3.3, X ≈ 1.6)
            const marshal = new THREE.Group();
            marshal.position.set(1.6, 0, -3.3);

            const mTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.16, 0.65, 16), suitMat);
            mTorso.position.y = 0.95;
            marshal.add(mTorso);

            const mStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.165, 0.16, 16), accentMat);
            mStripe.position.y = 1.05;
            marshal.add(mStripe);

            const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), helmetMat);
            mHead.position.y = 1.46;
            marshal.add(mHead);

            // Carbon Fiber Lollipop Pole
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.2, 12), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 }));
            pole.position.set(-0.6, 1.6, 0);
            pole.rotation.z = -0.15;
            marshal.add(pole);

            // Circular Digital LED Display Paddle facing incoming car (+Z)
            this.lollipopCanvas = document.createElement('canvas');
            this.lollipopCanvas.width = 256;
            this.lollipopCanvas.height = 256;
            this.lollipopTexture = new THREE.CanvasTexture(this.lollipopCanvas);
            this.updateLollipopSign('BRAKE', '#ef4444');

            const paddleGeo = new THREE.CircleGeometry(0.40, 28);
            const paddleMat = new THREE.MeshBasicMaterial({
                map: this.lollipopTexture,
                side: THREE.DoubleSide
            });
            this.lollipopSign = new THREE.Mesh(paddleGeo, paddleMat);
            this.lollipopSign.position.set(-1.0, 2.7, 0);
            this.lollipopSign.rotation.y = 0;
            marshal.add(this.lollipopSign);

            this.lollipop = marshal;
            this.crewGroup.add(marshal);
        }

        updateLollipopSign(text, colorHex) {
            if (!this.lollipopCanvas || !this.lollipopTexture) return;
            const ctx = this.lollipopCanvas.getContext('2d');
            ctx.clearRect(0, 0, 256, 256);

            ctx.fillStyle = '#060a14';
            ctx.beginPath();
            ctx.arc(128, 128, 120, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = colorHex;
            ctx.lineWidth = 14;
            ctx.stroke();

            ctx.font = '900 46px "Orbitron", sans-serif';
            ctx.fillStyle = colorHex;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 128, 128);

            this.lollipopTexture.needsUpdate = true;
        }

        // ---------------------------------------------------------------------
        // Atmospheric Dust Particles
        // ---------------------------------------------------------------------
        buildParticles() {
            const count = 350;
            const geom = new THREE.BufferGeometry();
            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count * 3; i += 3) {
                positions[i] = (Math.random() - 0.5) * 16;
                positions[i + 1] = Math.random() * 7;
                positions[i + 2] = (Math.random() - 0.5) * 50;
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
        // McLaren 720S GT3 Model Loading & Forward Orientation
        // ---------------------------------------------------------------------
        loadCarModel(onProgress, onComplete, onError) {
            const loader = new THREE.GLTFLoader();
            const modelUrl = 'assets/models/mclaren-720s.glb';

            console.log('[3D Engine] Loading car model from:', modelUrl);

            loader.load(
                modelUrl,
                (gltf) => {
                    this.carModel = gltf.scene;

                    // 1. Scale from FBX centimeters to real-world meters
                    this.carModel.scale.set(100, 100, 100);

                    // 2. Rotate 180° so the car's nose points FORWARD along the pitlane (-Z)
                    this.carModel.rotation.y = Math.PI;

                    console.log('[3D Engine] GLB loaded & rotated forward. Setting up hierarchy...');

                    // Setup Wheels, Materials & Lights
                    this.setupCarHierarchy();

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

            // Enhance materials for WebGL
            this.carModel.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const mat = child.material;
                    if (mat) {
                        if (mat.name && mat.name.toLowerCase().includes('carpaint')) {
                            mat.metalness = 0.85;
                            mat.roughness = 0.18;
                        }
                        if (mat.name && mat.name.toLowerCase().includes('window')) {
                            mat.transparent = true;
                            mat.opacity = 0.55;
                            mat.roughness = 0.08;
                        }
                    }
                }
            });

            // Headlights: Attached inside carModel so they illuminate FORWARD in direction of travel (-Z)
            // In carModel local space, front is +Z, which rotates 180° to world -Z!
            const leftHeadlight = new THREE.SpotLight(0xf8fafc, 7.0, 50, Math.PI / 5.5, 0.45);
            leftHeadlight.position.set(0.65, 0.55, 2.1);
            leftHeadlight.target.position.set(0.4, 0.1, 16);
            this.carModel.add(leftHeadlight);
            this.carModel.add(leftHeadlight.target);
            this.headlights.push(leftHeadlight);

            const rightHeadlight = new THREE.SpotLight(0xf8fafc, 7.0, 50, Math.PI / 5.5, 0.45);
            rightHeadlight.position.set(-0.65, 0.55, 2.1);
            rightHeadlight.target.position.set(-0.4, 0.1, 16);
            this.carModel.add(rightHeadlight);
            this.carModel.add(rightHeadlight.target);
            this.headlights.push(rightHeadlight);

            // Taillights: Attached to rear of carModel (local -Z -> world +Z)
            const rearLight = new THREE.PointLight(0xff0033, 1.2, 5);
            rearLight.position.set(0, 0.65, -2.35);
            this.carModel.add(rearLight);
            this.taillights.push(rearLight);

            // Initial car position (Start of Scene 1 at Pit Entry Z = +55m)
            this.carGroup.position.set(0, 0, 55);
        }

        // ---------------------------------------------------------------------
        // Continuous Cinematic Timeline Synchronization (Driven by GSAP)
        // ---------------------------------------------------------------------
        updateFromTimeline(progress, velocity = 0) {
            this.targetTimelineProgress = progress;
            this.currentVelocity = velocity;
        }

        // Internal physics update running in 60fps renderLoop with smooth damping
        processTimelineStep(progress) {
            if (!this.isLoaded) return;

            // -----------------------------------------------------------------
            // SCENE 1: CAR ENTERS PITLANE DRIVING FORWARD (0.00 -> 0.38)
            // -----------------------------------------------------------------
            if (progress < 0.38) {
                const p = progress / 0.38; // 0 to 1
                // Smooth cubic deceleration curve from Z = +55m (entrance) to Z = 0m (pit box)
                const smoothP = p * p * (3 - 2 * p);
                const carZ = 55 - (smoothP * 55);
                this.carGroup.position.z = carZ;

                // Subtle steering entry arc into the pit box
                const steerArc = Math.sin(p * Math.PI) * 0.15;
                this.carGroup.position.x = steerArc * 0.5;
                // Car nose steers slightly as it enters box
                this.carGroup.rotation.y = -steerArc * 0.25;

                // Wheels rotate FORWARD in direction of travel (-Z)
                // Distance traveled = 55 - carZ
                const distTraveled = 55 - carZ;
                this.wheelRotationAngle = distTraveled / 0.35;
                ['lf', 'rf', 'lr', 'rr'].forEach(k => {
                    if (this.wheels[k]) {
                        this.wheels[k].rotation.x = this.wheelRotationAngle;
                        this.wheels[k].position.x = this.wheelCenters[k].x;
                    }
                });

                // Front wheels steer slightly with the entry arc
                if (this.wheels.lf) this.wheels.lf.rotation.y = -steerArc * 0.5;
                if (this.wheels.rf) this.wheels.rf.rotation.y = -steerArc * 0.5;

                // Subtle suspension dip under braking
                const brakeDip = Math.sin(Math.pow(p, 2.5) * Math.PI) * 0.028;
                this.carGroup.position.y = -brakeDip;

                // Headlights illumination
                this.headlights.forEach(h => {
                    h.intensity = p > 0.03 ? 7.5 : 1.2;
                });
                // Taillights flare red under braking into box
                this.taillights.forEach(t => {
                    t.intensity = p > 0.55 ? 4.5 : 0.8;
                });

                // Lollipop marshal holding BRAKE sign facing car
                if (this.lollipop) {
                    this.updateLollipopSign('BRAKE', '#ef4444');
                    this.lollipop.rotation.x = 0;
                }

                // Camera: Starts down pitlane on garage side watching car drive FORWARD into frame,
                // then glides into tracking position
                const camP = Math.pow(p, 0.85);
                this.targetCameraPos.set(
                    2.4 - (camP * 0.4),
                    1.6 + (camP * 0.2),
                    carZ - 5.5 - ((1 - camP) * 12.0)
                );
                // Camera looks at the front of the car
                this.targetCameraLookAt.set(0, 0.65, carZ);

                this.updatePitTimerDisplay('0.00 s', 'APPROACH');
            }
            // -----------------------------------------------------------------
            // SCENE 2: THE COORDINATED PITSTOP (0.38 -> 0.65)
            // -----------------------------------------------------------------
            else if (progress >= 0.38 && progress < 0.65) {
                const p = (progress - 0.38) / 0.27; // 0 to 1
                this.carGroup.position.set(0, 0, 0);
                this.carGroup.rotation.set(0, 0, 0);

                // Air jack lift: car lifts ~7.5cm off the tarmac smoothly
                const liftP = Math.min(1, p * 4.0);
                const dropP = Math.max(0, (p - 0.88) / 0.12);
                const currentLift = (Math.sin(liftP * Math.PI * 0.5) * 0.075) - (Math.pow(dropP, 2) * 0.075);
                this.carGroup.position.y = currentLift;

                // 4-Wheel Tyre Change Animation:
                // Smooth sinusoidal displacement outward and inward
                let wheelSlide = 0;
                if (p >= 0.15 && p < 0.50) {
                    const t = (p - 0.15) / 0.35;
                    wheelSlide = Math.sin(t * Math.PI * 0.5) * 0.62;
                } else if (p >= 0.50 && p < 0.85) {
                    const t = (p - 0.50) / 0.35;
                    wheelSlide = (1 - Math.sin(t * Math.PI * 0.5)) * 0.62;
                }

                if (this.wheels.lf) this.wheels.lf.position.x = this.wheelCenters.lf.x + wheelSlide;
                if (this.wheels.lr) this.wheels.lr.position.x = this.wheelCenters.lr.x + wheelSlide;
                if (this.wheels.rf) this.wheels.rf.position.x = this.wheelCenters.rf.x - wheelSlide;
                if (this.wheels.rr) this.wheels.rr.position.x = this.wheelCenters.rr.x - wheelSlide;

                // Reset steering angle
                if (this.wheels.lf) this.wheels.lf.rotation.y = 0;
                if (this.wheels.rf) this.wheels.rf.rotation.y = 0;

                // Tyre changers step in, guns vibrate
                this.tyreChangers.forEach(c => {
                    const sideMultiplier = c.userData.side === 'garage' ? 1 : -1;
                    if (p >= 0.12 && p <= 0.85) {
                        c.position.x = c.userData.origX - (sideMultiplier * 0.18);
                        if (c.armGroup) {
                            c.armGroup.position.y = 0.58 + Math.sin(Date.now() * 0.08) * 0.015;
                        }
                    } else {
                        c.position.x = c.userData.origX;
                    }
                });

                // Lollipop signals: "STOP" -> "1ST GEAR" -> "GO!"
                if (this.lollipop) {
                    if (p < 0.65) {
                        this.updateLollipopSign('STOP', '#ef4444');
                        this.lollipop.rotation.x = 0;
                    } else if (p < 0.88) {
                        this.updateLollipopSign('1ST GEAR', '#f59e0b');
                        this.lollipop.rotation.x = 0;
                    } else {
                        this.updateLollipopSign('GO!', '#00ff88');
                        this.lollipop.rotation.x = -Math.PI / 2.8;
                    }
                }

                // Dynamic Pitstop Stopwatch Timer
                const timerSec = (p * 2.38).toFixed(2);
                this.updatePitTimerDisplay(`${timerSec} s`, p < 0.88 ? 'SERVICE' : 'RELEASE');

                // Camera: Dynamic sweeping cinematic close-up of the pit crew & McLaren
                // Sweeps around the front-right corner showcasing tyre change action
                const camAngle = -Math.PI / 4 + (p * Math.PI * 0.6);
                const camDist = 3.8 + Math.sin(p * Math.PI) * 0.3;
                this.targetCameraPos.set(
                    Math.cos(camAngle) * camDist,
                    1.0 + Math.sin(p * Math.PI * 0.5) * 0.4,
                    Math.sin(camAngle) * camDist - 0.5
                );
                this.targetCameraLookAt.set(0, 0.55, -0.2);
            }
            // -----------------------------------------------------------------
            // SCENE 3: RELEASE & LAUNCH FORWARD (0.65 -> 0.88)
            // -----------------------------------------------------------------
            else if (progress >= 0.65 && progress < 0.88) {
                const p = (progress - 0.65) / 0.23; // 0 to 1
                // Rapid GT3 launch acceleration curve: launches FORWARD from Z = 0 to Z = -52m
                const launchZ = -Math.pow(p, 1.7) * 52;
                this.carGroup.position.z = launchZ;
                this.carGroup.position.y = 0;
                this.carGroup.rotation.set(0, 0, 0);

                // Wheel spin accelerating forward
                const distTraveled = 55 + (-launchZ);
                this.wheelRotationAngle = distTraveled / 0.35;
                ['lf', 'rf', 'lr', 'rr'].forEach(k => {
                    if (this.wheels[k]) {
                        this.wheels[k].rotation.x = this.wheelRotationAngle;
                        this.wheels[k].position.x = this.wheelCenters[k].x;
                        this.wheels[k].rotation.y = 0;
                    }
                });

                // Pit crew clears out of box
                this.tyreChangers.forEach(c => {
                    const sideMultiplier = c.userData.side === 'garage' ? 1 : -1;
                    c.position.x = c.userData.origX + (sideMultiplier * 0.4);
                });

                if (this.lollipop) {
                    this.updateLollipopSign('GO!', '#00ff88');
                    this.lollipop.rotation.x = -Math.PI / 2.2;
                }

                // Camera follows the departing vehicle briefly, panning as it races away forward
                this.targetCameraPos.set(
                    1.8 - (p * 1.2),
                    1.3 + (p * 0.6),
                    2.8 - (p * 4.0)
                );
                this.targetCameraLookAt.set(0, 0.6, launchZ - 2.0);

                this.updatePitTimerDisplay('2.38 s', 'DEPARTED');
            }
            // -----------------------------------------------------------------
            // SCENE 4: REVEAL GRiD UP WEBSITE (0.88 -> 1.00)
            // -----------------------------------------------------------------
            else if (progress >= 0.88) {
                const p = (progress - 0.88) / 0.12; // 0 to 1
                // Car has sped off into the night
                this.carGroup.position.z = -52 - (p * 30);

                // Camera smoothly tilts up towards the illuminated GRiD UP gantry
                this.targetCameraPos.set(
                    0.2 - (p * 0.2),
                    2.2 + (p * 2.8),
                    2.5 + (p * 4.0)
                );
                this.targetCameraLookAt.set(0, 4.8 - (p * 1.0), 0);
            }
        }

        renderLoop() {
            if (this.isDisposed) return;
            this.animFrameId = requestAnimationFrame(this.renderLoop);

            const delta = this.clock.getDelta();

            // Smooth timeline progress lerp (removes any scroll notched stepping)
            this.currentTimelineProgress += (this.targetTimelineProgress - this.currentTimelineProgress) * 0.12;
            this.processTimelineStep(this.currentTimelineProgress);

            // Butter-smooth camera interpolation
            if (this.camera) {
                this.currentCameraPos.lerp(this.targetCameraPos, 0.08);
                this.currentCameraLookAt.lerp(this.targetCameraLookAt, 0.08);
                this.camera.position.copy(this.currentCameraPos);
                this.camera.lookAt(this.currentCameraLookAt);
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
