class Game {
    constructor() {
        // Rendi l'istanza del gioco disponibile globalmente
        window.game = this;
        
        this.players = new Map();
        this.socket = null;
        this.clock = new THREE.Clock();
        this.loadedModels = {}; // Per memorizzare i modelli caricati
        this.isCollectingTreasure = false; // Flag per evitare eventi multipli di raccolta
        this.inLobby = true; // Flag per indicare se il giocatore è in lobby
        this.matchId = null; // ID della partita corrente
        this.gameStarted = false; // Flag per indicare se la partita è iniziata
        this.treasuresCollected = 0; // Contatore dei tesori raccolti
        this.treasures = []; // Array di tesori attivi
        this.gameTime = 300; // Tempo di gioco in secondi (5 minuti)
        this.gameTimer = null; // Timer per il countdown
        
        // Inizializza l'UI Manager
        this.ui = new UIManager();
        
        // Inizializza la scena
        this.setupScene();
        
        // Carica i modelli
        this.loadModels(() => {
            // Crea l'isola
            this.createIsland();
            
            // Configura i gestori degli eventi Socket.IO
            this.setupSocketHandlers();
            
            // Avvia il loop di animazione
            this.animate();
            
            // Crea un giocatore temporaneo per la lobby
            this.createLocalPlayerForLobby();
        });
    }

    setupScene() {
        // Renderer avanzato con post-processing
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            precision: "highp",
            stencil: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Colore di sfondo azzurro cielo
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.physicallyCorrectLights = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Scene
        this.scene = new THREE.Scene();
        // Nessuna nebbia per un cielo diurno chiaro
        this.scene.fog = null;

        // Aggiungiamo una camera di fallback per il rendering iniziale
        this.fallbackCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.fallbackCamera.position.set(0, 10, 20);
        this.fallbackCamera.lookAt(0, 0, 0);
        console.log('Fallback camera created');

        // Gestione del ridimensionamento della finestra
        window.addEventListener('resize', () => {
            if (this.localPlayer && this.localPlayer.camera) {
                this.localPlayer.camera.aspect = window.innerWidth / window.innerHeight;
                this.localPlayer.camera.updateProjectionMatrix();
            }
            // Aggiorniamo anche la camera di fallback
            this.fallbackCamera.aspect = window.innerWidth / window.innerHeight;
            this.fallbackCamera.updateProjectionMatrix();
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupLights() {
        // Sistema di illuminazione avanzato
        
        // Luce ambientale con intensità aumentata per un ambiente diurno
        this.ambientLight = new THREE.AmbientLight(0x88CCFF, 0.5); // Ridotta da 0.7 a 0.5 per un contrasto migliore
        this.scene.add(this.ambientLight);

        // Luce emisferica per simulare la luce diffusa dal cielo e dal terreno
        this.hemisphereLight = new THREE.HemisphereLight(0xB1E1FF, 0x88AA66, 0.6);
        this.scene.add(this.hemisphereLight);

        // Sole (luce direzionale) con intensità aumentata
        this.sunLight = new THREE.DirectionalLight(0xFFFFAA, 1.2); // Aumentata da 1.0 a 1.2
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        
        // Miglioramento delle ombre
        this.sunLight.shadow.mapSize.width = 2048; // Aumentata da 1024 a 2048
        this.sunLight.shadow.mapSize.height = 2048; // Aumentata da 1024 a 2048
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 1000; // Aumentata da 200 a 1000
        this.sunLight.shadow.camera.left = -500; // Aumentata per coprire l'isola più grande
        this.sunLight.shadow.camera.right = 500; // Aumentata per coprire l'isola più grande
        this.sunLight.shadow.camera.top = 500; // Aumentata per coprire l'isola più grande
        this.sunLight.shadow.camera.bottom = -500; // Aumentata per coprire l'isola più grande
        this.sunLight.shadow.bias = -0.0001; // Riduce gli artefatti delle ombre
        this.scene.add(this.sunLight);

        // Aggiungiamo una luce per illuminare l'isola dal basso (riflesso dell'acqua) con intensità aumentata
        this.waterReflectionLight = new THREE.PointLight(0x0066cc, 0.6, 300); // Aumentato range da 150 a 300
        this.waterReflectionLight.position.set(0, -5, 0);
        this.scene.add(this.waterReflectionLight);

        // Creiamo il cielo stellato usando la classe Sky
        this.sky = new Sky(this.scene, this.sunLight);
        
        // Creiamo le nuvole usando la nuova classe Clouds
        // Definiamo impostazioni di qualità ridotte per prestazioni migliori
        const qualitySettings = {
            clouds: {
                count: 50, // Ridotto da 125 per prestazioni migliori
                segmentsX: 4, // Ridotto da 6 per prestazioni migliori
                segmentsY: 3, // Ridotto da 4 per prestazioni migliori
                massive: true,
                massiveChance: 2,
                big: 10,
                medium: 38,
                small: 50
            }
        };
        this.clouds = new Clouds(this.scene, qualitySettings);
        
        // Aggiungiamo luci supplementari per illuminare meglio la scena
        this.addSupplementaryLights();
        
        console.log('Advanced lighting setup completed');
    }
    
    addSupplementaryLights() {
        // Aggiungiamo alcune luci spot con intensità ridotta
        const spotLights = [
            { position: [0, 30, 0], color: 0xFFFFCC, intensity: 0.4, distance: 300, angle: Math.PI/4 }, // Aumentato range da 150 a 300
            { position: [50, 20, 50], color: 0xFFEECC, intensity: 0.3, distance: 250, angle: Math.PI/6 }, // Aumentato range da 120 a 250
            { position: [-50, 20, -50], color: 0xFFEECC, intensity: 0.3, distance: 250, angle: Math.PI/6 }, // Aumentato range da 120 a 250
            { position: [50, 20, -50], color: 0xFFEECC, intensity: 0.3, distance: 250, angle: Math.PI/6 }, // Aumentato range da 120 a 250
            { position: [-50, 20, 50], color: 0xFFEECC, intensity: 0.3, distance: 250, angle: Math.PI/6 } // Aumentato range da 120 a 250
        ];
        
        this.spotLights = [];
        spotLights.forEach(spotLight => {
            const light = new THREE.SpotLight(
                spotLight.color,
                spotLight.intensity,
                spotLight.distance,
                spotLight.angle,
                0.5, // penumbra
                2 // decay
            );
            
            light.position.set(...spotLight.position);
            light.castShadow = true;
            light.shadow.mapSize.width = 512;
            light.shadow.mapSize.height = 512;
            light.shadow.bias = -0.0001; // Riduce gli artefatti delle ombre
            
            // Crea un target per la luce
            light.target = new THREE.Object3D();
            light.target.position.set(0, 0, 0);
            this.scene.add(light.target);
            
            this.scene.add(light);
            this.spotLights.push(light);
        });
    }

    loadModels(callback) {
        const loader = new THREE.GLTFLoader();
        const modelsToLoad = [
            { name: 'palm-bend', url: '/models/palm-bend.glb', hasCollision: true },
            { name: 'palm-straight', url: '/models/palm-straight.glb', hasCollision: true },
            { name: 'rocks-a', url: '/models/rocks-a.glb', hasCollision: true },
            { name: 'rocks-b', url: '/models/rocks-b.glb', hasCollision: true },
            { name: 'rocks-c', url: '/models/rocks-c.glb', hasCollision: true },
            { name: 'rocks-sand-a', url: '/models/rocks-sand-a.glb', hasCollision: true },
            { name: 'rocks-sand-b', url: '/models/rocks-sand-b.glb', hasCollision: true },
            { name: 'rocks-sand-c', url: '/models/rocks-sand-c.glb', hasCollision: true },
            { name: 'grass-patch', url: '/models/grass-patch.glb', hasCollision: false }, // Attraversabile
            { name: 'grass', url: '/models/grass.glb', hasCollision: false }, // Attraversabile
            { name: 'grass-plant', url: '/models/grass-plant.glb', hasCollision: false }, // Attraversabile
            { name: 'tower-complete-small', url: '/models/tower-complete-small.glb', hasCollision: true },
            { name: 'tower-base', url: '/models/tower-base.glb', hasCollision: true },
            { name: 'ship-wreck', url: '/models/ship-wreck.glb', hasCollision: true },
            { name: 'structure-platform', url: '/models/structure-platform.glb', hasCollision: true },
            { name: 'boat-row-small', url: '/models/boat-row-small.glb', hasCollision: true },
            { name: 'chest', url: '/models/chest.glb', hasCollision: true },
            { name: 'barrel', url: '/models/barrel.glb', hasCollision: true },
            { name: 'flag-pirate', url: '/models/flag-pirate.glb', hasCollision: true }
        ];

        let loadedCount = 0;
        const totalModels = modelsToLoad.length;

        modelsToLoad.forEach(model => {
            loader.load(
                model.url,
                (gltf) => {
                    this.loadedModels[model.name] = {
                        scene: gltf.scene,
                        hasCollision: model.hasCollision
                    };
                    
                    // Aggiungiamo collisioni solo ai modelli che le richiedono
                    if (model.hasCollision) {
                        gltf.scene.traverse((child) => {
                            if (child.isMesh) {
                                // Creiamo una bounding box per ogni mesh
                                child.geometry.computeBoundingBox();
                                // Aggiungiamo una proprietà per indicare che questo oggetto ha collisioni
                                child.userData.hasCollision = true;
                            }
                        });
                    }
                    
                    loadedCount++;
                    console.log(`Modello ${model.name} caricato (${loadedCount}/${totalModels})`);
                    
                    if (loadedCount === totalModels) {
                        console.log('Tutti i modelli sono stati caricati');
                        callback();
                    }
                },
                (xhr) => {
                    console.log(`${model.name}: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% caricato`);
                },
                (error) => {
                    console.error(`Errore nel caricamento del modello ${model.name}:`, error);
                    loadedCount++;
                    if (loadedCount === totalModels) {
                        console.log('Tutti i modelli sono stati caricati (con errori)');
                        callback();
                    }
                }
            );
        });
    }

    createIsland() {
        // Crea il mare con la classe Water avanzata
        const waterGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100); // Quadruplicato
        
        // Carica la texture per le normali dell'acqua
        const waterNormals = new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            console.log('Water normals texture loaded successfully');
        }, undefined, (error) => {
            console.error('Failed to load water normals texture:', error);
        });
        
        // Crea l'acqua
        this.water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: waterNormals,
            alpha: 0.8,
            sunDirection: this.sunLight.position.clone().normalize(),
            sunColor: 0xFFFFAA,
            waterColor: 0x001144,
            distortionScale: 3.7,
            fog: this.scene.fog !== undefined
        });
        
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = -0.5;
        this.water.receiveShadow = false; // Disabilitiamo le ombre sull'acqua
        this.scene.add(this.water);

        // Crea l'isola principale con più dettagli
        const islandGeometry = new THREE.CylinderGeometry(100, 110, 4, 64, 4, false); // Quadruplicato
        
        // Modifichiamo i vertici per rendere l'isola meno perfetta
        const positionAttribute = islandGeometry.getAttribute('position');
        const vertex = new THREE.Vector3();
        
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            
            // Modifichiamo solo i vertici superiori
            if (vertex.y > 0) {
                // Aggiungiamo variazioni casuali ma coerenti
                const distance = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
                if (distance > 20) {
                    const angle = Math.atan2(vertex.z, vertex.x);
                    const noise = Math.sin(angle * 5) * 0.5 + Math.cos(angle * 3) * 0.7;
                    vertex.y += noise;
                }
            }
            
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        // Aggiorniamo le normali
        islandGeometry.computeVertexNormals();
        
        // Creiamo un materiale più realistico per la sabbia usando una texture locale
        const sandTexture = new THREE.TextureLoader().load('/textures/sand.jpg', (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10, 10); // Modificato da 16 a 10 per una texture più visibile
            // Assicuriamoci che la texture sia codificata correttamente
            if (THREE.sRGBEncoding !== undefined) {
                texture.encoding = THREE.sRGBEncoding;
            }
            console.log('Texture della sabbia caricata con successo');
            
            // Assicuriamoci che il materiale venga aggiornato
            this.island.material.needsUpdate = true;
        }, undefined, (error) => {
            console.error('Failed to load sand texture:', error);
            // Fallback a un colore semplice in caso di errore
            this.island.material.map = null;
            this.island.material.color.set(0xf0d78c); // Colore sabbia più giallo
            this.island.material.needsUpdate = true;
        });
        
        const islandMaterial = new THREE.MeshStandardMaterial({ 
            map: sandTexture,
            color: 0xf0d78c, // Colore sabbia più giallo (modificato da 0xd2b48c)
            roughness: 0.9,
            metalness: 0.0,
            bumpMap: sandTexture,
            bumpScale: 0.2
        });
        
        this.island = new THREE.Mesh(islandGeometry, islandMaterial);
        this.island.receiveShadow = true;
        this.island.castShadow = false;
        this.island.position.y = 0; // Assicuriamoci che l'isola sia sopra l'acqua
        this.scene.add(this.island);
        
        // Debug: logghiamo informazioni sull'isola
        console.log('Island Material:', this.island.material);
        console.log('Island Position:', this.island.position);
        console.log('Lights in Scene:', this.scene.children.filter(child => child.isLight));

        // Aggiungi montagne
        this.addMountains();

        // Aggiungi palme
        this.addPalms();

        // Aggiungi rocce
        this.addRocks();
        
        // Aggiungi vegetazione
        this.addVegetation();

        // Aggiungi strutture
        this.addStructures();
        
        // Aggiungiamo un effetto di luce ambientale sull'isola
        this.addIslandAmbientLight();
        
        // Debug: logghiamo il numero di oggetti nella scena
        console.log('Scene children count:', this.scene.children.length);
    }
    
    addIslandAmbientLight() {
        // Aggiungiamo alcune luci per illuminare meglio l'isola con intensità aumentata
        const islandLights = [
            { position: [40, 1, 0], color: 0x8888ff, intensity: 0.6, distance: 50 }, // Aumentata da 0.4 a 0.6
            { position: [-20, 1, 30], color: 0x8888ff, intensity: 0.5, distance: 40 }, // Aumentata da 0.3 a 0.5
            { position: [0, 1, -50], color: 0x8888ff, intensity: 0.5, distance: 45 }, // Aumentata da 0.3 a 0.5
            { position: [60, 1, 60], color: 0x8888ff, intensity: 0.5, distance: 40 }, // Aumentata da 0.3 a 0.5
            { position: [-60, 1, -60], color: 0x8888ff, intensity: 0.5, distance: 40 } // Aumentata da 0.3 a 0.5
        ];
        
        this.islandLights = [];
        
        islandLights.forEach(light => {
            const pointLight = new THREE.PointLight(light.color, light.intensity, light.distance);
            pointLight.position.set(...light.position);
            
            // Aggiungiamo un leggero effetto di flicker
            pointLight.userData = {
                baseIntensity: light.intensity,
                flickerSpeed: 0.1 + Math.random() * 0.2,
                flickerAmount: 0.05 + Math.random() * 0.1
            };
            
            this.scene.add(pointLight);
            this.islandLights.push(pointLight);
        });
    }

    addMountains() {
        // Creiamo alcune montagne sull'isola
        const mountainPositions = [
            { x: -50, z: -30, scale: 1.5, rotation: 0.5 },
            { x: 40, z: 20, scale: 1.2, rotation: 2.1 },
            { x: 10, z: -60, scale: 1.0, rotation: 4.2 },
            { x: -30, z: 50, scale: 1.3, rotation: 3.7 }
        ];

        mountainPositions.forEach(pos => {
            // Utilizziamo i modelli di rocce come montagne
            const rockTypes = ['rocks-a', 'rocks-b', 'rocks-c'];
            const rockType = rockTypes[Math.floor(Math.random() * rockTypes.length)];
            
            if (this.loadedModels[rockType]) {
                const mountain = this.loadedModels[rockType].scene.clone();
                
                // Scala e posiziona la montagna
                const scale = pos.scale * 5; // Scala grande per le montagne
                mountain.scale.set(scale, scale * 1.5, scale);
                
                // Posiziona la montagna sul terreno
                const y = this.getTerrainHeight(pos.x, pos.z);
                mountain.position.set(pos.x, y, pos.z);
                mountain.rotation.y = pos.rotation;
                
                // Aggiungiamo collisioni
                mountain.traverse((child) => {
                    if (child.isMesh) {
                        child.userData.hasCollision = true;
                    }
                });
                
                // Aggiungi la montagna alla scena
                this.scene.add(mountain);
            }
        });
    }

    addPalms() {
        // Utilizziamo i modelli di palme caricati
        if (!this.loadedModels['palm-bend'] || !this.loadedModels['palm-straight']) {
            console.error('Modelli di palme non caricati');
            return;
        }

        // Posizioni per le palme
        const palmPositions = [];
        
        // Generiamo posizioni casuali per le palme
        for (let i = 0; i < 50; i++) { // Aumentato il numero di palme
            const angle = Math.random() * Math.PI * 2;
            const radius = 60 + Math.random() * 30; // Distribuite su un'area più ampia
            
            palmPositions.push({
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius,
                scale: 0.8 + Math.random() * 0.7,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        // Aggiungiamo le palme
        palmPositions.forEach(pos => {
            // Alterna tra palme dritte e piegate
            const palmModel = Math.random() > 0.5 ? 
                this.loadedModels['palm-bend'].scene.clone() : 
                this.loadedModels['palm-straight'].scene.clone();
            
            // Scala la palma
            palmModel.scale.set(pos.scale, pos.scale, pos.scale);
            
            // Posiziona la palma sul terreno
            const y = this.getTerrainHeight(pos.x, pos.z);
            palmModel.position.set(pos.x, y, pos.z);
            palmModel.rotation.y = pos.rotation;
            
            // Aggiungiamo collisioni
            palmModel.traverse((child) => {
                if (child.isMesh) {
                    child.userData.hasCollision = true;
                }
            });
            
            // Aggiungi la palma alla scena
            this.scene.add(palmModel);
        });
    }

    addRocks() {
        // Utilizziamo i modelli di rocce caricati
        const rockTypes = ['rocks-sand-a', 'rocks-sand-b', 'rocks-sand-c', 'rocks-a', 'rocks-b'];
        
        // Verifichiamo che i modelli siano stati caricati
        const availableRocks = rockTypes.filter(type => this.loadedModels[type]);
        
        if (availableRocks.length === 0) {
            console.error('Modelli di rocce non caricati');
            return;
        }

        // Posizioni per le rocce
        const rockPositions = [];
        
        // Generiamo posizioni casuali per le rocce
        for (let i = 0; i < 80; i++) { // Aumentato il numero di rocce
            const angle = Math.random() * Math.PI * 2;
            const radius = 30 + Math.random() * 60; // Distribuite su un'area più ampia
            
            rockPositions.push({
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius,
                scale: 0.5 + Math.random() * 1.0,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        // Aggiungiamo le rocce
        rockPositions.forEach(pos => {
            // Scegliamo un tipo di roccia casuale
            const rockType = availableRocks[Math.floor(Math.random() * availableRocks.length)];
            const rockModel = this.loadedModels[rockType].scene.clone();
            
            // Scala la roccia
            rockModel.scale.set(pos.scale, pos.scale, pos.scale);
            
            // Posiziona la roccia sul terreno
            const y = this.getTerrainHeight(pos.x, pos.z);
            rockModel.position.set(pos.x, y, pos.z);
            rockModel.rotation.y = pos.rotation;
            
            // Aggiungiamo collisioni
            rockModel.traverse((child) => {
                if (child.isMesh) {
                    child.userData.hasCollision = true;
                }
            });
            
            // Aggiungi la roccia alla scena
            this.scene.add(rockModel);
        });
    }
    
    addVegetation() {
        // Utilizziamo i modelli di vegetazione caricati
        if (!this.loadedModels['grass-patch'] || !this.loadedModels['grass'] || !this.loadedModels['grass-plant']) {
            console.error('Modelli di vegetazione non caricati');
            return;
        }

        console.log('Aggiunta vegetazione all\'isola...');
        
        // Posizioni per la vegetazione
        const vegetationPositions = [];
        
        // Generiamo posizioni casuali per la vegetazione
        for (let i = 0; i < 300; i++) { // Aumentato il numero di elementi di vegetazione
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 90; // Distribuite su tutta l'isola
            
            vegetationPositions.push({
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius,
                scale: 0.3 + Math.random() * 0.7,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        // Aggiungiamo la vegetazione
        vegetationPositions.forEach(pos => {
            // Alterna tra diversi tipi di vegetazione
            const vegetationType = Math.random();
            let vegetationModel;
            
            if (vegetationType < 0.33) {
                vegetationModel = this.loadedModels['grass-patch'].scene.clone();
            } else if (vegetationType < 0.66) {
                vegetationModel = this.loadedModels['grass'].scene.clone();
            } else {
                vegetationModel = this.loadedModels['grass-plant'].scene.clone();
            }
            
            // Scala la vegetazione
            vegetationModel.scale.set(pos.scale, pos.scale, pos.scale);
            
            // Posiziona la vegetazione sul terreno
            const y = this.getTerrainHeight(pos.x, pos.z);
            vegetationModel.position.set(pos.x, y, pos.z);
            vegetationModel.rotation.y = pos.rotation;
            
            // Assicuriamoci che la vegetazione non abbia collisioni
            vegetationModel.traverse((child) => {
                if (child.isMesh) {
                    // Impostiamo esplicitamente hasCollision a false
                    child.userData = child.userData || {};
                    child.userData.hasCollision = false;
                    
                    // Per sicurezza, impostiamo anche una proprietà che indica che è vegetazione
                    child.userData.isVegetation = true;
                }
            });
            
            // Aggiungi la vegetazione alla scena
            this.scene.add(vegetationModel);
        });
        
        console.log('Vegetazione aggiunta con successo!');
    }

    addStructures() {
        // Aggiungiamo strutture come torri, relitti di navi e piattaforme
        
        // Torre di guardia
        if (this.loadedModels['tower-complete-small']) {
            const tower = this.loadedModels['tower-complete-small'].scene.clone();
            tower.scale.set(1.5, 1.5, 1.5);
            const towerX = -70;
            const towerZ = 40;
            const y = this.getTerrainHeight(towerX, towerZ);
            tower.position.set(towerX, y, towerZ);
            
            // Aggiungiamo collisioni
            tower.traverse((child) => {
                if (child.isMesh) {
                    child.userData.hasCollision = true;
                }
            });
            
            this.scene.add(tower);
        }
        
        // Base della torre
        if (this.loadedModels['tower-base']) {
            const towerBase = this.loadedModels['tower-base'].scene.clone();
            towerBase.scale.set(2, 2, 2);
            const baseX = 50;
            const baseZ = -30;
            const y = this.getTerrainHeight(baseX, baseZ);
            towerBase.position.set(baseX, y, baseZ);
            
            // Aggiungiamo collisioni
            towerBase.traverse((child) => {
                if (child.isMesh) {
                    child.userData.hasCollision = true;
                }
            });
            
            this.scene.add(towerBase);
        }
        
        // Relitto di nave
        if (this.loadedModels['ship-wreck']) {
            const shipWreck = this.loadedModels['ship-wreck'].scene.clone();
            shipWreck.scale.set(2, 2, 2);
            const shipX = 60;
            const shipZ = -50;
            const y = this.getTerrainHeight(shipX, shipZ);
            shipWreck.position.set(shipX, y, shipZ);
            shipWreck.rotation.y = Math.PI / 4;
            
            // Aggiungiamo collisioni
            shipWreck.traverse((child) => {
                if (child.isMesh) {
                    child.userData.hasCollision = true;
                }
            });
            
            this.scene.add(shipWreck);
        }
        
        // Piattaforma
        if (this.loadedModels['structure-platform']) {
            const platform = this.loadedModels['structure-platform'].scene.clone();
            platform.scale.set(1.5, 1.5, 1.5);
            const platformX = 0;
            const platformZ = 80;
            const y = this.getTerrainHeight(platformX, platformZ);
            platform.position.set(platformX, y, platformZ);
            
            // Aggiungiamo collisioni
            platform.traverse((child) => {
                if (child.isMesh) {
                    child.userData.hasCollision = true;
                }
            });
            
            this.scene.add(platform);
        }
        
        // Barca a remi
        if (this.loadedModels['boat-row-small']) {
            const boat = this.loadedModels['boat-row-small'].scene.clone();
            boat.scale.set(1, 1, 1);
            const boatX = -40;
            const boatZ = -70;
            const y = this.getTerrainHeight(boatX, boatZ);
            boat.position.set(boatX, y, boatZ);
            boat.rotation.y = Math.PI / 3;
            
            // Aggiungiamo collisioni
            boat.traverse((child) => {
                if (child.isMesh) {
                    child.userData.hasCollision = true;
                }
            });
            
            this.scene.add(boat);
        }
        
        // Barili e casse
        if (this.loadedModels['barrel']) {
            // Aggiungiamo alcuni barili sparsi
            for (let i = 0; i < 15; i++) {
                const barrel = this.loadedModels['barrel'].scene.clone();
                const angle = Math.random() * Math.PI * 2;
                const radius = 30 + Math.random() * 40;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                barrel.scale.set(0.8, 0.8, 0.8);
                
                // Posiziona il barile sul terreno
                const y = this.getTerrainHeight(x, z);
                barrel.position.set(x, y, z);
                barrel.rotation.y = Math.random() * Math.PI * 2;
                
                // Aggiungiamo collisioni
                barrel.traverse((child) => {
                    if (child.isMesh) {
                        child.userData.hasCollision = true;
                    }
                });
                
                this.scene.add(barrel);
            }
        }
        
        // Bandiera pirata
        if (this.loadedModels['flag-pirate']) {
            const flag = this.loadedModels['flag-pirate'].scene.clone();
            flag.scale.set(1.2, 1.2, 1.2);
            const flagX = 80;
            const flagZ = 20;
            const y = this.getTerrainHeight(flagX, flagZ);
            flag.position.set(flagX, y, flagZ);
            
            // Aggiungiamo collisioni
            flag.traverse((child) => {
                if (child.isMesh) {
                    child.userData.hasCollision = true;
                }
            });
            
            this.scene.add(flag);
        }
    }

    setupSocketHandlers() {
        // Inizializza la connessione Socket.IO
        this.socket = new GameSocket();
        
        // Imposta i callback per gli eventi Socket.IO
        this.socket.onPlayerJoined = (data) => {
            console.log('Giocatore entrato:', data);
            
            // Verifica che i dati siano nel formato atteso
            if (!data || !data.id) {
                console.error('Dati del giocatore non validi:', data);
                return;
            }
            
            // Verifica se il giocatore è già presente
            if (this.players.has(data.id)) {
                console.log(`Giocatore ${data.id} già presente, aggiorno solo la posizione`);
                const player = this.players.get(data.id);
                if (data.position) {
                    player.setPosition(data.position);
                }
                if (data.rotation) {
                    player.setRotation(data.rotation);
                }
                return;
            }
            
            // Aggiungi il giocatore alla scena
            const position = data.position || { x: 0, y: 0, z: 0 };
            const nickname = data.name || data.nickname || 'Sconosciuto';
            
            console.log(`Aggiungo giocatore remoto ${nickname} (${data.id}) in posizione:`, position);
            
            // Assicurati che la posizione tenga conto dell'altezza del terreno
            if (position.y === 0) {
                position.y = this.getTerrainHeight(position.x, position.z) + 1;
            }
            
            this.addPlayer(data.id, position, false, nickname);
        };
        
        this.socket.onPlayerLeft = (id) => {
            console.log('Giocatore uscito:', id);
            
            // Verifica che l'ID sia valido
            if (!id) {
                console.error('ID del giocatore non valido:', id);
                return;
            }
            
            // Se l'ID è un oggetto, estrai l'ID
            const playerId = typeof id === 'object' ? id.id : id;
            
            // Rimuovi il giocatore dalla scena
            this.removePlayer(playerId);
        };
        
        this.socket.onPlayerMoved = (data) => {
            // Verifica che i dati siano nel formato atteso
            if (!data || !data.id) {
                return;
            }
            
            // Aggiorna la posizione del giocatore
            const player = this.players.get(data.id);
            if (player) {
                const position = data.position || { x: data.x, y: data.y, z: data.z };
                const rotation = data.rotation;
                
                player.setPosition(position);
                if (rotation !== undefined) {
                    player.setRotation(rotation);
                }
            }
        };
        
        this.socket.onTreasureCollected = (playerId, position, type) => {
            console.log('Tesoro raccolto:', playerId, position, type);
            
            // Verifica che i dati siano nel formato atteso
            if (!playerId || !position) {
                console.error('Dati del tesoro non validi:', playerId, position, type);
                return;
            }
            
            // Crea un effetto visivo per la raccolta del tesoro
            this.createTreasureCollectEffect(position, type);
            
            // Aggiorna il punteggio del giocatore
            const player = this.players.get(playerId);
            if (player) {
                let points = 1; // Valore predefinito
                
                // Assegna punti in base al tipo di tesoro
                if (type === 'blue') {
                    points = 3;
                } else if (type === 'red') {
                    points = 5;
                }
                
                player.score += points;
                
                // Mostra un messaggio per il tesoro raccolto
                this.showTreasureMessage(type, points);
                
                // Aggiorna la tabella dei punteggi
                this.updateScoresTable();
            }
        };
        
        this.socket.onTreasureUpdate = (data) => {
            console.log('Aggiornamento tesori:', data);
            
            // Verifica che i dati siano nel formato atteso
            if (!data || !Array.isArray(data)) {
                console.error('Dati dei tesori non validi:', data);
                return;
            }
            
            // Aggiorna i tesori nella scena
            // Implementazione da completare in base alla struttura dei dati
        };
        
        this.socket.onScoreUpdate = (playerId, score) => {
            console.log('Aggiornamento punteggio:', playerId, score);
            
            // Verifica che i dati siano nel formato atteso
            if (!playerId) {
                console.error('ID del giocatore non valido:', playerId);
                return;
            }
            
            // Aggiorna il punteggio del giocatore
            const player = this.players.get(playerId);
            if (player) {
                player.score = score;
                
                // Aggiorna la tabella dei punteggi
                this.updateScoresTable();
            }
        };
        
        this.socket.onMatchStart = (data) => {
            console.log('Inizio partita:', data);
            
            // Verifica che i dati siano nel formato atteso
            if (!data) {
                console.error('Dati della partita non validi:', data);
                return;
            }
            
            // Salva l'ID della partita
            this.matchId = data.matchId;
            
            // Rimuovi tutti i giocatori esistenti
            this.players.forEach((player, id) => {
                this.removePlayer(id);
            });
            
            // Aggiungi i giocatori alla partita
            if (data.players) {
                console.log('Giocatori nella partita:', data.players);
                
                // Gestisci sia il formato array che oggetto
                if (Array.isArray(data.players)) {
                    // Formato array
                    data.players.forEach(playerData => {
                        if (playerData.id !== this.socket.playerId) {
                            const position = playerData.position || { x: 0, y: 0, z: 0 };
                            const nickname = playerData.nickname || playerData.name || 'Sconosciuto';
                            
                            // Assicurati che la posizione tenga conto dell'altezza del terreno
                            if (position.y === 0) {
                                position.y = this.getTerrainHeight(position.x, position.z) + 1;
                            }
                            
                            this.addPlayer(playerData.id, position, false, nickname);
                        }
                    });
                } else {
                    // Formato oggetto
                    Object.entries(data.players).forEach(([id, playerData]) => {
                        if (id !== this.socket.playerId) {
                            const position = playerData.position || { x: 0, y: 0, z: 0 };
                            const nickname = playerData.nickname || playerData.name || 'Sconosciuto';
                            
                            // Assicurati che la posizione tenga conto dell'altezza del terreno
                            if (position.y === 0) {
                                position.y = this.getTerrainHeight(position.x, position.z) + 1;
                            }
                            
                            this.addPlayer(id, position, false, nickname);
                        }
                    });
                }
            }
            
            // Aggiungi il giocatore locale
            const localPlayerData = data.players && (data.players[this.socket.playerId] || data.players.find(p => p.id === this.socket.playerId));
            const localPlayerPosition = localPlayerData ? localPlayerData.position : { x: 0, y: 0, z: 0 };
            
            // Assicurati che la posizione tenga conto dell'altezza del terreno
            if (localPlayerPosition.y === 0) {
                localPlayerPosition.y = this.getTerrainHeight(localPlayerPosition.x, localPlayerPosition.z) + 1;
            }
            
            // Crea il giocatore locale
            this.addPlayer(this.socket.playerId, localPlayerPosition, true, this.socket.playerNickname);
            
            // Aggiungi i tesori alla scena
            if (data.treasures && Array.isArray(data.treasures)) {
                data.treasures.forEach(treasure => {
                    this.createTreasure(treasure.position, treasure.type);
                });
            }
            
            // Avvia il timer di gioco
            this.setupGameTimer(data.duration || 180000); // 3 minuti di default
            
            // Avvia il gioco
            this.startGame();
        };
        
        this.socket.onGameOver = (data) => {
            console.log('Fine partita:', data);
            
            // Verifica che i dati siano nel formato atteso
            if (!data) {
                console.error('Dati di fine partita non validi:', data);
                return;
            }
            
            // Mostra i risultati finali
            this.endGame(data);
        };
        
        this.socket.onLobbyUpdate = (data) => {
            console.log('Aggiornamento lobby:', data);
            
            // Verifica che i dati siano nel formato atteso
            if (!data) {
                console.error('Dati della lobby non validi:', data);
                return;
            }
            
            // Aggiorna l'interfaccia della lobby
            const lobbyElement = document.getElementById('lobby-info');
            if (lobbyElement) {
                lobbyElement.innerHTML = `
                    <h2>Lobby</h2>
                    <p>Giocatori in attesa: ${data.count || data.playersInLobby || 0}</p>
                    <ul>
                        ${(data.players || []).map(player => `<li>${player.name || player.nickname || 'Sconosciuto'}</li>`).join('')}
                    </ul>
                `;
            }
        };
        
        this.socket.onOnlinePlayersUpdate = (count) => {
            // Aggiorna il contatore dei giocatori online
            const counterElement = document.getElementById('online-counter');
            if (counterElement) {
                counterElement.textContent = count;
            }
        };
    }

    setupGameTimer() {
        // Inizializza il timer di gioco
        this.gameTimer = setInterval(() => {
            if (this.gameStarted && this.gameTime > 0) {
            this.gameTime--;
                this.updateGameTimer();

                // Termina la partita quando il tempo scade
            if (this.gameTime <= 0) {
                    clearInterval(this.gameTimer);
                    // Il server gestirà la fine della partita
                }
            }
        }, 1000);
    }

    endGame(data) {
        this.gameStarted = false;
        
        // Trova il giocatore con il punteggio più alto
        let maxScore = -1;
        let winner = null;
        
        this.players.forEach((player, id) => {
            if (player.score > maxScore) {
                maxScore = player.score;
                winner = id;
            }
        });
        
        // Prepara i dati per la schermata di fine partita
        const gameOverData = {
            winnerName: this.players.get(winner)?.playerName || 'Sconosciuto',
            winnerScore: maxScore,
            reason: data?.reason || 'Tempo scaduto'
        };
        
        // Mostra la schermata di fine partita
        this.ui.showGameOver(gameOverData);
        
        // Resetta il gioco dopo 5 secondi
        setTimeout(() => {
            this.resetGame();
        }, 5000);
    }

    addPlayer(id, position, isLocalPlayer = false, nickname = 'Sconosciuto') {
        console.log(`Aggiungo giocatore ${id} (${nickname}) in posizione:`, position);
        
        // Verifica se il giocatore esiste già
        if (this.players.has(id)) {
            console.log(`Giocatore ${id} già esistente, lo rimuovo prima di ricrearlo`);
            this.removePlayer(id);
        }
        
        try {
            // Crea un nuovo giocatore
            const player = new Player(this.scene, position, isLocalPlayer, nickname);
            this.players.set(id, player);
            
            if (isLocalPlayer) {
                this.localPlayer = player;
                this.localPlayer.score = 0;
                console.log('Giocatore locale impostato:', this.localPlayer);
            } else {
                console.log(`Giocatore remoto ${nickname} (${id}) aggiunto alla scena`);
            }
            
            // Aggiorna la tabella dei punteggi
            this.updateScoresTable();
            
            return player;
        } catch (error) {
            console.error(`Errore nella creazione del giocatore ${id}:`, error);
        }
    }

    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            player.dispose();
            this.players.delete(id);
        }
    }

    animate() {
        if (!this.scene || !this.camera || !this.renderer) return;
        
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        
        // Aggiorna gli elementi visibili
        this.updateVisibleElements(delta, time);
        
        // Aggiorna tutti i giocatori
        this.players.forEach(player => {
            if (player) {
                player.update();
            }
        });
        
        // Aggiorna la tabella dei punteggi
        if (this.gameStarted && time - this.lastScoreUpdate > 1) {
            this.updateScoresTable();
            this.lastScoreUpdate = time;
        }
        
        // Aggiorna il timer di gioco
        if (this.gameStarted && this.gameTimer) {
            this.updateGameTimer();
        }
        
        // Renderizza la scena
        this.renderScene();
    }
    
    /**
     * Aggiorna solo gli elementi visibili nella scena
     */
    updateVisibleElements(deltaTime, time) {
        // Aggiorna l'acqua
        if (this.water && this.water.material && this.water.material.uniforms) {
            this.water.material.uniforms['time'].value = time;
            
            // Aggiorna la direzione del sole nell'acqua
            if (this.sunLight) {
                this.water.material.uniforms['sunDirection'].value = this.sunLight.position.clone().normalize();
            }
        }
        
        // Aggiorna il cielo
        if (this.sky) {
            this.sky.update(deltaTime);
        }
        
        // Aggiorna le nuvole
        if (this.clouds) {
            this.clouds.update(deltaTime);
        }
        
        // Aggiorna le luci dell'isola (effetto flicker)
        if (this.islandLights) {
            this.islandLights.forEach(light => {
                const userData = light.userData;
                if (userData) {
                    light.intensity = userData.baseIntensity + 
                        Math.sin(time * userData.flickerSpeed) * userData.flickerAmount;
                }
            });
        }
        
        // Aggiorna le luci spot (movimento lento)
        if (this.spotLights && this.spotLights.length > 0) {
            this.spotLights.forEach((light, index) => {
                const angle = time * 0.2 + index * Math.PI / 3;
                const radius = 20;
                light.position.x = Math.cos(angle) * radius;
                light.position.z = Math.sin(angle) * radius;
                light.target.position.set(0, 0, 0);
                light.target.updateMatrixWorld();
            });
        }

        // Aggiorna tutti i giocatori
        this.players.forEach(player => player.update());

        // Aggiorna i tesori e verifica collisioni
        if (this.localPlayer && !this.isCollectingTreasure && this.gameStarted) {
            const playerPosition = this.localPlayer.getPosition();
            
            // Verifica collisioni con tutti i tesori attivi
            for (let i = 0; i < this.treasures.length; i++) {
                const treasure = this.treasures[i];
                if (!treasure) continue;
                
                treasure.update();
                
                const treasurePosition = treasure.getPosition();
                const distance = playerPosition.distanceTo(treasurePosition);
                
                // Debug della distanza quando il giocatore è vicino al tesoro
                if (distance < 10) {
                    console.log('Distanza dal tesoro:', distance.toFixed(2), 'Tipo:', treasure.getType());
                }
                
                // Verifica la collisione con il tesoro
                const isColliding = treasure.checkCollision(playerPosition, 5);
                if (isColliding) {
                    console.log('Tesoro raccolto dal giocatore locale! Posizione:', treasurePosition, 'Tipo:', treasure.getType());
                    
                    // Imposta il flag per evitare eventi multipli
                    this.isCollectingTreasure = true;
                    
                    // Invia l'evento al server
                    this.socket.emitTreasureCollected(
                        this.socket.playerId, 
                        treasurePosition,
                        treasure.getType()
                    );
                    
                    // Rimuovi il tesoro localmente
                    treasure.dispose();
                    this.treasures[i] = null;
                    
                    // Resetta il flag dopo un breve ritardo
                    setTimeout(() => {
                        this.isCollectingTreasure = false;
                    }, 1000);
                    
                    break;
                }
            }
            
            // Rimuovi i tesori null dall'array
            this.treasures = this.treasures.filter(t => t !== null);
        }
    }
    
    /**
     * Rendering della scena
     */
    renderScene() {
        // Usa la camera di fallback se il giocatore locale non è ancora inizializzato
        if (this.localPlayer && this.localPlayer.camera) {
            this.renderer.render(this.scene, this.localPlayer.camera);
        } else {
            this.renderer.render(this.scene, this.fallbackCamera);
        }
    }

    // Funzione per calcolare l'altezza del terreno in un punto
    getTerrainHeight(x, z) {
        // Otteniamo la distanza dal centro
        const distance = Math.sqrt(x * x + z * z);
        const angle = Math.atan2(z, x);
        
        // Calcoliamo l'altezza in base alla distanza e all'angolo (simile alla logica usata per creare l'isola)
        let height = 2; // Altezza base dell'isola
        
        if (distance > 20 && distance < 100) {
            const noise = Math.sin(angle * 5) * 0.5 + Math.cos(angle * 3) * 0.7;
            height += noise;
        }
        
        return height;
    }

    // Funzione per posizionare un oggetto sul terreno
    placeObjectOnTerrain(object, x, z, yOffset = 0) {
        const y = this.getTerrainHeight(x, z) + yOffset;
        object.position.set(x, y, z);
        
        // Aggiungiamo una leggera rotazione casuale per varietà
        object.rotation.y = Math.random() * Math.PI * 2;
        
        // Incliniamo leggermente l'oggetto per adattarlo al terreno
        const terrainNormal = this.getTerrainNormal(x, z);
        object.lookAt(object.position.clone().add(terrainNormal));
        
        return object;
    }

    // Funzione per calcolare la normale del terreno in un punto
    getTerrainNormal(x, z) {
        const epsilon = 0.1;
        const h = this.getTerrainHeight(x, z);
        const hL = this.getTerrainHeight(x - epsilon, z);
        const hR = this.getTerrainHeight(x + epsilon, z);
        const hD = this.getTerrainHeight(x, z - epsilon);
        const hU = this.getTerrainHeight(x, z + epsilon);
        
        const normal = new THREE.Vector3(hL - hR, 2 * epsilon, hD - hU).normalize();
        return normal;
    }

    // Funzione per verificare le collisioni tra un punto e tutti gli oggetti nella scena
    checkCollisions(position, radius = 1) {
        let hasCollision = false;
        
        // Controlliamo tutti gli oggetti nella scena
        this.scene.traverse((object) => {
            // Verifichiamo solo gli oggetti con collisioni
            if (object.isMesh && object.userData && object.userData.hasCollision === true) {
                // Calcoliamo la distanza tra il punto e l'oggetto
                const objectPosition = new THREE.Vector3();
                object.getWorldPosition(objectPosition);
                
                // Otteniamo la bounding box dell'oggetto
                if (!object.geometry.boundingBox) {
                    object.geometry.computeBoundingBox();
                }
                
                // Calcoliamo la dimensione dell'oggetto
                const size = new THREE.Vector3();
                object.geometry.boundingBox.getSize(size);
                size.multiply(object.scale);
                
                // Calcoliamo la distanza tra il punto e l'oggetto
                const distance = position.distanceTo(objectPosition);
                
                // Se la distanza è minore della somma dei raggi, c'è una collisione
                const objectRadius = Math.max(size.x, size.z) / 2;
                if (distance < radius + objectRadius) {
                    hasCollision = true;
                    // Aggiungiamo un log per debug
                    console.log('Collisione con oggetto:', object.name || 'senza nome', 
                                'distanza:', distance.toFixed(2), 
                                'raggio oggetto:', objectRadius.toFixed(2));
                }
            }
        });
        
        return hasCollision;
    }

    /**
     * Crea un giocatore locale temporaneo per esplorare l'isola durante l'attesa
     */
    createLocalPlayerForLobby() {
        // Genera una posizione casuale sull'isola
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 30;
        const position = {
            x: Math.cos(angle) * radius,
            y: 0,
            z: Math.sin(angle) * radius
        };
        
        // Aggiusta l'altezza in base al terreno
        position.y = this.getTerrainHeight(position.x, position.z) + 1;
        
        // Crea un giocatore locale temporaneo
        this.localPlayer = new Player(this.scene, position, true);
        this.players.set('local-temp', this.localPlayer);
        
        console.log('Giocatore locale temporaneo creato per la lobby');
    }

    /**
     * Crea un tesoro nella posizione specificata
     */
    createTreasure(position, type = 'normal') {
        console.log(`Creazione tesoro di tipo ${type} in posizione:`, position);
        
        // Crea un nuovo tesoro
        const treasure = new Treasure(this.scene, position, type);
        
        // Aggiungi il tesoro all'array
        this.treasures.push(treasure);
        
        return treasure;
    }
    
    /**
     * Genera una posizione casuale per un tesoro
     */
    generateRandomTreasurePosition() {
        // Genera una posizione casuale sull'isola
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 60; // Tra 20 e 80 unità dal centro
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Ottieni l'altezza del terreno in quella posizione
        const y = this.getTerrainHeight(x, z) + 1;
        
        return { x, y, z };
    }

    /**
     * Mostra un messaggio quando un tesoro viene raccolto
     */
    showTreasureMessage(treasureType, points) {
        // Mostra il messaggio del tesoro nell'UI
        this.ui.showTreasureMessage(treasureType, points);
    }
    
    // Funzione per iniziare la partita
    startGame() {
        this.gameStarted = true;
        this.inLobby = false;
        
        // Nascondi la schermata della lobby
        this.ui.hideLobby();
        
        // Mostra una notifica
        this.ui.showNotification('Partita iniziata!', 'success', 3000);
        
        // Imposta la salute del giocatore
        if (this.localPlayer) {
            this.ui.updateHealth(100);
        }
        
        // Aggiorna la classifica
        this.updateScoresTable();
    }
    
    // Funzione per resettare lo stato del gioco
    resetGame() {
        console.log('Resetting game state...');
        
        // Resetta i contatori
        this.treasuresCollected = 0;
        
        // Rimuovi tutti i tesori esistenti
        this.treasures.forEach(treasure => {
            if (treasure) {
                treasure.dispose();
            }
        });
        this.treasures = [];
        
        // Resetta il punteggio nell'interfaccia utente
        document.getElementById('score').textContent = 'Tesori: 0';
    }

    /**
     * Crea l'HUD del gioco con timer e punteggi
     */
    createGameHUD() {
        // Crea il container dell'HUD
        this.hud = document.createElement('div');
        this.hud.id = 'game-hud';
        this.hud.style.position = 'absolute';
        this.hud.style.top = '10px';
        this.hud.style.left = '10px';
        this.hud.style.padding = '10px';
        this.hud.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.hud.style.color = 'white';
        this.hud.style.fontFamily = 'Arial, sans-serif';
        this.hud.style.borderRadius = '5px';
        this.hud.style.display = 'none'; // Nascosto all'inizio
        
        // Timer
        this.timerElement = document.createElement('div');
        this.timerElement.id = 'game-timer';
        this.timerElement.innerHTML = `Tempo: <span>05:00</span>`;
        this.hud.appendChild(this.timerElement);
        
        // Punteggio del giocatore locale
        this.scoreElement = document.createElement('div');
        this.scoreElement.id = 'player-score';
        this.scoreElement.innerHTML = `Tesori: <span>0</span>`;
        this.hud.appendChild(this.scoreElement);
        
        // Tabella dei punteggi
        this.scoresTable = document.createElement('div');
        this.scoresTable.id = 'scores-table';
        this.scoresTable.style.marginTop = '10px';
        this.scoresTable.innerHTML = '<h3 style="margin: 0 0 5px 0;">Punteggi</h3>';
        this.hud.appendChild(this.scoresTable);
        
        // Aggiungi l'HUD al DOM
        document.body.appendChild(this.hud);
    }

    /**
     * Aggiorna il timer del gioco
     */
    updateGameTimer() {
        if (!this.gameStarted) return;
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.gameStartTime;
        const remainingTime = Math.max(0, this.gameTime * 1000 - elapsedTime);
        
        // Aggiorna il timer nell'UI
        this.ui.updateTimer(remainingTime);
        
        // Se il tempo è scaduto, termina la partita
        if (remainingTime <= 0) {
            this.endGame();
        }
    }

    /**
     * Aggiorna la tabella dei punteggi
     */
    updateScoresTable() {
        // Prepara i dati dei giocatori per la classifica
        const playersData = [];
        
        this.players.forEach((player, id) => {
            playersData.push({
                id: id,
                name: player.playerName || 'Sconosciuto',
                score: player.score || 0
            });
        });
        
        // Aggiorna la classifica nell'UI
        this.ui.updateLeaderboard(playersData);
        
        // Aggiorna il punteggio del giocatore locale
        if (this.localPlayer) {
            this.ui.updateScore(this.localPlayer.score || 0);
        }
    }

    /**
     * Verifica se due posizioni sono uguali (con una certa tolleranza)
     */
    isSamePosition(pos1, pos2, tolerance = 1) {
        return Math.abs(pos1.x - pos2.x) < tolerance &&
               Math.abs(pos1.y - pos2.y) < tolerance &&
               Math.abs(pos1.z - pos2.z) < tolerance;
    }

    /**
     * Crea un effetto visivo quando un tesoro viene raccolto
     */
    createTreasureCollectEffect(position, type) {
        // Colore dell'effetto in base al tipo di tesoro
        let color;
        switch(type) {
            case 'blue': color = 0x0088ff; break;
            case 'red': color = 0xff3333; break;
            case 'normal': default: color = 0xffcc00; break;
        }
        
        // Crea un'esplosione di particelle
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = position.x;
            particlePositions[i3 + 1] = position.y;
            particlePositions[i3 + 2] = position.z;
            
            // Velocità casuale per ogni particella
            particleVelocities.push({
                x: (Math.random() - 0.5) * 0.3,
                y: Math.random() * 0.5,
                z: (Math.random() - 0.5) * 0.3
            });
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: 0.2,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        // Anima le particelle
        const startTime = Date.now();
        const duration = 1000; // 1 secondo
        
        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                // Rimuovi le particelle quando l'animazione è completa
                this.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                return;
            }
            
            // Aggiorna la posizione delle particelle
            const positions = particles.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] += particleVelocities[i].x;
                positions[i3 + 1] += particleVelocities[i].y;
                positions[i3 + 2] += particleVelocities[i].z;
                
                // Aggiungi gravità
                particleVelocities[i].y -= 0.01;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            // Riduci l'opacità gradualmente
            particles.material.opacity = 1 - progress;
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }

    /**
     * Restituisce un tipo di tesoro casuale
     */
    getRandomTreasureType() {
        const types = ['normal', 'blue', 'red'];
        const weights = [0.7, 0.2, 0.1]; // 70% normale, 20% blu, 10% rosso
        
        const random = Math.random();
        let sum = 0;
        
        for (let i = 0; i < types.length; i++) {
            sum += weights[i];
            if (random < sum) {
                return types[i];
            }
        }
        
        return 'normal'; // Fallback
    }
}

// Avvia il gioco quando la pagina è caricata
window.addEventListener('load', () => {
    new Game();
}); 