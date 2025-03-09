class Sky {
    constructor(scene, sun) {
        this.scene = scene;
        this.sun = sun;
        this.visibleSun = null;
        this.clouds = [];
        this.clock = new THREE.Clock();

        // Crea il cielo e il sole
        this.createSky();
        this.createVisibleSun();
        this.createClouds();

        console.log('Sky initialized with daytime and animated clouds');
    }

    /**
     * Crea il cielo diurno con un gradiente usando ShaderMaterial
     */
    createSky() {
        // Shader per il cielo diurno con gradiente
        const vertexShader = `
            varying vec3 vWorldPosition;

            void main() {
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            varying vec3 vWorldPosition;

            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
            }
        `;

        const skyGeometry = new THREE.SphereGeometry(5000, 32, 32); // Sfera invece di box per un aspetto più naturale

        const uniforms = {
            topColor: { value: new THREE.Color(0x87CEEB) }, // Blu cielo diurno
            bottomColor: { value: new THREE.Color(0xE0FFFF) }, // Azzurro chiaro vicino al terreno
            offset: { value: 33 }
        };

        const skyMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide,
            fog: false
        });

        this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.sky);
    }

    /**
     * Crea il sole visibile e lo anima
     */
    createVisibleSun() {
        if (!this.sun) return;

        const sunGeometry = new THREE.SphereGeometry(15, 16, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00, // Giallo brillante
            fog: false
        });

        this.visibleSun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.visibleSun);

        // Inizializza la posizione del sole
        this.updateSunPosition(0);
    }

    /**
     * Crea nuvole 3D animate
     */
    createClouds() {
        // Prova a caricare la texture delle nuvole, ma usa il fallback se non è disponibile
        this.createFallbackClouds();
        
        // Tenta di caricare la texture, ma non bloccare il gioco se non è disponibile
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/models/cloud.png', 
            // Success callback
            (cloudTexture) => {
                // Se la texture è stata caricata con successo, rimuovi le nuvole di fallback
                // e crea nuvole con texture
                this.clouds.forEach(cloud => this.scene.remove(cloud));
                this.clouds = [];
                
                cloudTexture.wrapS = THREE.RepeatWrapping;
                cloudTexture.wrapT = THREE.RepeatWrapping;
                
                const cloudMaterial = new THREE.MeshLambertMaterial({
                    map: cloudTexture,
                    transparent: true,
                    opacity: 0.7,
                    depthWrite: false
                });

                const cloudCount = 10; // Numero di nuvole
                for (let i = 0; i < cloudCount; i++) {
                    const cloudGeometry = new THREE.PlaneGeometry(500, 200);
                    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

                    // Posizioni casuali e rotazioni
                    const theta = Math.random() * Math.PI * 2;
                    const radius = 1000 + Math.random() * 2000;
                    cloud.position.set(
                        Math.cos(theta) * radius,
                        300 + Math.random() * 200, // Altezza tra 300 e 500
                        Math.sin(theta) * radius
                    );
                    cloud.rotation.z = Math.random() * Math.PI;
                    cloud.material.opacity = 0.6 + Math.random() * 0.3;

                    // Assicurati che la nuvola guardi sempre verso il centro
                    cloud.lookAt(0, cloud.position.y, 0);

                    this.clouds.push(cloud);
                    this.scene.add(cloud);
                }
                
                console.log('Cloud texture loaded successfully');
            },
            // Progress callback
            undefined,
            // Error callback
            (error) => {
                console.error('Failed to load cloud texture:', error);
                // Nessuna azione necessaria poiché abbiamo già creato le nuvole di fallback
            }
        );
    }

    /**
     * Crea nuvole di fallback senza texture
     */
    createFallbackClouds() {
        console.log('Creating fallback clouds without texture');
        const cloudMaterial = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });

        const cloudCount = 10;
        for (let i = 0; i < cloudCount; i++) {
            // Usa una geometria più complessa per le nuvole di fallback
            const cloudGeometry = new THREE.SphereGeometry(100, 8, 8);
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

            // Posizioni casuali
            const theta = Math.random() * Math.PI * 2;
            const radius = 1000 + Math.random() * 2000;
            cloud.position.set(
                Math.cos(theta) * radius,
                300 + Math.random() * 200,
                Math.sin(theta) * radius
            );
            
            // Scala non uniforme per un aspetto più naturale
            cloud.scale.set(
                1 + Math.random() * 0.5,
                0.5 + Math.random() * 0.3,
                1 + Math.random() * 0.5
            );

            this.clouds.push(cloud);
            this.scene.add(cloud);
        }
    }

    /**
     * Aggiorna la posizione del sole e l'illuminazione
     * @param {number} deltaTime - Tempo dall'ultimo frame in secondi
     */
    update(deltaTime) {
        const elapsedTime = this.clock.getElapsedTime();

        // Anima il sole lungo una traiettoria diurna (da est a ovest)
        this.updateSunPosition(elapsedTime);

        // Anima le nuvole
        this.clouds.forEach((cloud, index) => {
            // Movimento lento verso destra
            cloud.position.x += deltaTime * 20;
            
            // Riavvolgi quando la nuvola esce dal campo visivo
            if (cloud.position.x > 3000) {
                cloud.position.x = -3000;
            }

            // Aggiungi una leggera oscillazione verticale
            cloud.position.y = 300 + Math.sin(elapsedTime * 0.2 + index) * 50;
        });
    }

    /**
     * Aggiorna la posizione del sole in base al tempo
     * @param {number} elapsedTime - Tempo totale in secondi
     */
    updateSunPosition(elapsedTime) {
        if (this.visibleSun && this.sun) {
            const time = elapsedTime * 0.1; // Velocità del movimento del sole
            const radius = 4900; // Distanza dal centro
            const angle = time + Math.PI / 2; // Inizia a est (90 gradi)

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.5 + 2000; // Traiettoria ellittica
            const z = Math.sin(angle) * radius;

            this.visibleSun.position.set(x, y, z);
            this.sun.position.copy(this.visibleSun.position.clone().normalize().multiplyScalar(5000));

            // Aggiorna la direzione della luce
            this.sun.target.position.set(0, 0, 0);
            this.sun.target.updateMatrixWorld();
        }
    }
} 