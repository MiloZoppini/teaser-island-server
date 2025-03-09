// Clouds class for creating and managing clouds
class Clouds {
    constructor(scene, qualitySettings = null, cloudMapData = null) {
        this.scene = scene;
        this.qualitySettings = qualitySettings;
        this.cloudMapData = cloudMapData; // Static cloud data from map
        this.clouds = [];
        this.clock = new THREE.Clock();

        // Default quality settings if not provided
        const cloudSettings = qualitySettings ? qualitySettings.clouds : {
            count: 200, // Aumentato da 75 a 200 per avere più nuvole
            segmentsX: 6,
            segmentsY: 4,
            massive: true,
            massiveChance: 5, // Aumentato da 2 a 5 per avere più nuvole grandi
            big: 15, // Aumentato da 10 a 15
            medium: 40, // Aumentato da 38 a 40
            small: 40 // Ridotto da 50 a 40
        };

        // Cloud settings - adjusted based on quality level
        this.cloudCount = this.cloudMapData ? this.cloudMapData.count : (cloudSettings.count || 200);
        this.cloudSpread = 15000; // Aumentato da 10000 a 15000 per coprire un'area più ampia
        this.cloudHeight = 800; // Aumentato da 600 a 800 per nuvole più alte
        this.cloudHeightVariation = 400; // Aumentato da 300 a 400 per maggiore variazione

        // Geometry detail settings
        this.segmentsX = cloudSettings.segmentsX || 6;
        this.segmentsY = cloudSettings.segmentsY || 4;
        this.allowMassive = cloudSettings.massive !== undefined ? cloudSettings.massive : true;
        this.massiveChance = cloudSettings.massiveChance || 5;
        this.bigChance = cloudSettings.big || 15;
        this.mediumChance = cloudSettings.medium || 40;
        this.smallChance = cloudSettings.small || 40;

        // Texture per le nuvole
        this.cloudTexture = null;
        this.loadCloudTexture();

        console.log(`Creating clouds with quality settings: count=${this.cloudCount}, segments=${this.segmentsX}x${this.segmentsY}`);
    }

    /**
     * Carica la texture delle nuvole
     */
    loadCloudTexture() {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            'https://threejs.org/examples/textures/cloud.png',
            (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                this.cloudTexture = texture;
                
                // Crea le nuvole solo dopo aver caricato la texture
                this.createClouds();
            },
            undefined,
            (error) => {
                console.error('Failed to load cloud texture:', error);
                // Crea nuvole di fallback se la texture non può essere caricata
                this.createClouds();
            }
        );
    }

    /**
     * Create cloud instances based on map data if available
     */
    createClouds() {
        if (this.cloudMapData && this.cloudMapData.positions && Array.isArray(this.cloudMapData.positions)) {
            console.log(`Creating ${this.cloudMapData.positions.length} clouds from map data`);

            // Create clouds from map data
            this.cloudMapData.positions.forEach((cloudPos, index) => {
                // Use different sizes for visual variety, cycling through 4 sizes
                let size;
                const sizeIndex = index % 4;

                if (sizeIndex === 0) size = 'small';
                else if (sizeIndex === 1) size = 'medium';
                else if (sizeIndex === 2) size = 'big';
                else size = this.allowMassive ? 'massive' : 'big';

                // Create a cloud at this exact position using the original cloud creation method
                this.createCloudAtPosition(size, cloudPos.x, cloudPos.y, cloudPos.z);
            });

            console.log(`Created ${this.clouds.length} clouds from map data`);
        } else {
            // Fallback to random cloud generation if no map data
            console.warn('No cloud map data provided, using random cloud generation');

            // Create clouds in batches to avoid performance issues during initialization
            const batchSize = 15; // Ridotto da 25 per prestazioni migliori
            const createBatch = (startIndex, count) => {
                for (let i = startIndex; i < startIndex + count && i < this.cloudCount; i++) {
                    // Choose a random patch size with bias toward smaller clouds for better performance
                    const sizeIndex = Math.floor(Math.random() * 100);
                    let patchSize;

                    if (this.allowMassive && sizeIndex < this.massiveChance) {
                        patchSize = 'massive'; // Small chance for massive clouds
                    } else if (sizeIndex < (this.massiveChance + this.bigChance)) {
                        patchSize = 'big'; // Chance for big clouds
                    } else if (sizeIndex < (this.massiveChance + this.bigChance + this.mediumChance)) {
                        patchSize = 'medium'; // Chance for medium clouds
                    } else {
                        patchSize = 'small'; // Remaining chance for small clouds
                    }
                    this.createCloud(patchSize);
                }

                // If there are more clouds to create, schedule the next batch
                if (startIndex + count < this.cloudCount) {
                    setTimeout(() => {
                        createBatch(startIndex + count, batchSize);
                    }, 0);
                } else {
                    console.log(`Created ${this.clouds.length} clouds randomly`);
                }
            };

            // Start creating the first batch
            createBatch(0, batchSize);
        }
    }

    /**
     * Create a cloud at a specific position using original cloud creation method
     * @param {string} size - Size category ('small', 'medium', 'big', 'massive')
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    createCloudAtPosition(size = 'medium', x, y, z) {
        // Create a group to hold cloud parts
        const cloud = new THREE.Group();

        // Position the cloud at the exact coordinates from the map
        cloud.position.set(x, y, z);

        // Set section count and scale based on size
        let sectionCount, scale;

        switch (size) {
            case 'massive':
                sectionCount = 7 + Math.floor(Math.random() * 4); // Aumentato da 5+3 a 7+4
                scale = 5.0; // Aumentato da 4.0 a 5.0
                break;
            case 'big':
                sectionCount = 5 + Math.floor(Math.random() * 3); // Aumentato da 4+2 a 5+3
                scale = 2.0; // Aumentato da 1.5 a 2.0
                break;
            case 'medium':
                sectionCount = 4 + Math.floor(Math.random() * 2); // Aumentato da 3+2 a 4+2
                scale = 1.2; // Aumentato da 1.0 a 1.2
                break;
            case 'small':
                sectionCount = 3; // Aumentato da 2 a 3
                scale = 0.8; // Aumentato da 0.6 a 0.8
                break;
            default:
                sectionCount = 4;
                scale = 1.2;
        }

        // Crea il materiale per le nuvole - più bianco e meno trasparente
        let cloudMaterial;
        
        if (this.cloudTexture) {
            // Usa la texture se disponibile
            cloudMaterial = new THREE.MeshStandardMaterial({
                map: this.cloudTexture,
                transparent: true,
                opacity: 0.9, // Aumentato da 0.7 a 0.9
                color: 0xFFFFFF, // Bianco puro
                emissive: 0x333333, // Leggera emissione per renderle più luminose
                roughness: 0.7, // Ridotto da 0.9 a 0.7
                metalness: 0.0, // Ridotto da 0.1 a 0.0
                side: THREE.DoubleSide,
                depthWrite: false // Disabilita la scrittura nel depth buffer per evitare problemi di rendering
            });
        } else {
            // Fallback senza texture
            cloudMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF, // Bianco puro
                transparent: true,
                opacity: 0.9, // Aumentato da 0.7 a 0.9
                emissive: 0x333333, // Leggera emissione per renderle più luminose
                roughness: 0.7, // Ridotto da 0.9 a 0.7
                metalness: 0.0, // Ridotto da 0.1 a 0.0
                depthWrite: false // Disabilita la scrittura nel depth buffer per evitare problemi di rendering
            });
        }

        // Create cloud sections
        for (let i = 0; i < sectionCount; i++) {
            // Use sphere geometry with detail level based on quality settings
            const cloudGeometry = new THREE.SphereGeometry(
                40, // Aumentato da 30 a 40
                this.segmentsX,
                this.segmentsY
            );

            const section = new THREE.Mesh(cloudGeometry, cloudMaterial);

            // Random position offset for each section
            section.position.set(
                (Math.random() - 0.5) * 80, // Aumentato da 60 a 80
                (Math.random() - 0.5) * 40, // Aumentato da 30 a 40
                (Math.random() - 0.5) * 80  // Aumentato da 60 a 80
            );

            // Random scale for each section (0.7 to 1.3)
            const sectionScale = 0.7 + Math.random() * 0.6;
            section.scale.set(sectionScale, sectionScale * 0.6, sectionScale);

            // Disabilita il frustum culling per evitare che le nuvole scompaiano
            section.frustumCulled = false;

            // Add section to cloud
            cloud.add(section);
        }

        // Apply overall scale to the cloud
        cloud.scale.set(scale, scale, scale);
        
        // Disabilita il frustum culling per l'intero gruppo
        cloud.frustumCulled = false;

        // Add to scene and tracking array
        this.scene.add(cloud);

        // Store with additional data for animations
        this.clouds.push({
            mesh: cloud,
            size: size,
            initialY: y,
            driftSpeed: 0, // No drift for mapped clouds
            rotationSpeed: (Math.random() - 0.5) * 0.01, // Aggiunta rotazione
            bobSpeed: 0.0002 + Math.random() * 0.0003 // Velocità di oscillazione verticale
        });
    }

    /**
     * Create a cloud with random position using original cloud creation method
     * @param {string} size - The size of the cloud patch ('massive', 'big', 'medium', or 'small')
     */
    createCloud(size = 'medium') {
        // Create a group to hold cloud parts
        const cloud = new THREE.Group();

        // Random position within the spread area
        const x = (Math.random() - 0.5) * this.cloudSpread;
        const z = (Math.random() - 0.5) * this.cloudSpread;
        const y = this.cloudHeight + (Math.random() - 0.5) * this.cloudHeightVariation;

        cloud.position.set(x, y, z);

        // Set section count and scale based on size
        let sectionCount, scale;

        switch (size) {
            case 'massive':
                sectionCount = 7 + Math.floor(Math.random() * 4); // Aumentato da 5+3 a 7+4
                scale = 5.0; // Aumentato da 4.0 a 5.0
                break;
            case 'big':
                sectionCount = 5 + Math.floor(Math.random() * 3); // Aumentato da 4+2 a 5+3
                scale = 2.0; // Aumentato da 1.5 a 2.0
                break;
            case 'medium':
                sectionCount = 4 + Math.floor(Math.random() * 2); // Aumentato da 3+2 a 4+2
                scale = 1.2; // Aumentato da 1.0 a 1.2
                break;
            case 'small':
                sectionCount = 3; // Aumentato da 2 a 3
                scale = 0.8; // Aumentato da 0.6 a 0.8
                break;
            default:
                sectionCount = 4;
                scale = 1.2;
        }

        // Crea il materiale per le nuvole - più bianco e meno trasparente
        let cloudMaterial;
        
        if (this.cloudTexture) {
            // Usa la texture se disponibile
            cloudMaterial = new THREE.MeshStandardMaterial({
                map: this.cloudTexture,
                transparent: true,
                opacity: 0.9, // Aumentato da 0.7 a 0.9
                color: 0xFFFFFF, // Bianco puro
                emissive: 0x333333, // Leggera emissione per renderle più luminose
                roughness: 0.7, // Ridotto da 0.9 a 0.7
                metalness: 0.0, // Ridotto da 0.1 a 0.0
                side: THREE.DoubleSide,
                depthWrite: false // Disabilita la scrittura nel depth buffer per evitare problemi di rendering
            });
        } else {
            // Fallback senza texture
            cloudMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF, // Bianco puro
                transparent: true,
                opacity: 0.9, // Aumentato da 0.7 a 0.9
                emissive: 0x333333, // Leggera emissione per renderle più luminose
                roughness: 0.7, // Ridotto da 0.9 a 0.7
                metalness: 0.0, // Ridotto da 0.1 a 0.0
                depthWrite: false // Disabilita la scrittura nel depth buffer per evitare problemi di rendering
            });
        }

        // Create cloud sections
        for (let i = 0; i < sectionCount; i++) {
            // Use sphere geometry with detail level based on quality settings
            const cloudGeometry = new THREE.SphereGeometry(
                40, // Aumentato da 30 a 40
                this.segmentsX,
                this.segmentsY
            );

            const section = new THREE.Mesh(cloudGeometry, cloudMaterial);

            // Random position offset for each section
            section.position.set(
                (Math.random() - 0.5) * 80, // Aumentato da 60 a 80
                (Math.random() - 0.5) * 40, // Aumentato da 30 a 40
                (Math.random() - 0.5) * 80  // Aumentato da 60 a 80
            );

            // Random scale for each section (0.7 to 1.3)
            const sectionScale = 0.7 + Math.random() * 0.6;
            section.scale.set(sectionScale, sectionScale * 0.6, sectionScale);

            // Disabilita il frustum culling per evitare che le nuvole scompaiano
            section.frustumCulled = false;

            // Add section to cloud
            cloud.add(section);
        }

        // Apply overall scale to the cloud
        cloud.scale.set(scale, scale, scale);
        
        // Disabilita il frustum culling per l'intero gruppo
        cloud.frustumCulled = false;

        // Add to scene and tracking array
        this.scene.add(cloud);

        // Store with additional data for animations
        this.clouds.push({
            mesh: cloud,
            size: size,
            initialY: y,
            driftSpeed: (Math.random() - 0.5) * 10, // Random drift speed for randomly placed clouds
            rotationSpeed: (Math.random() - 0.5) * 0.01, // Aggiunta rotazione
            bobSpeed: 0.0002 + Math.random() * 0.0003 // Velocità di oscillazione verticale
        });
    }

    /**
     * Update method for animation/changes over time
     */
    update(deltaTime) {
        const time = this.clock.getElapsedTime();
        
        // Update clouds - only animate clouds that have a drift speed
        this.clouds.forEach(cloud => {
            // Movimento orizzontale
            if (cloud.driftSpeed !== 0) {
                cloud.mesh.position.x += deltaTime * cloud.driftSpeed * 0.1;
                
                // Riposiziona la nuvola se esce dal campo visivo
                if (cloud.mesh.position.x > this.cloudSpread / 2) {
                    cloud.mesh.position.x = -this.cloudSpread / 2;
                } else if (cloud.mesh.position.x < -this.cloudSpread / 2) {
                    cloud.mesh.position.x = this.cloudSpread / 2;
                }
            }
            
            // Rotazione lenta
            cloud.mesh.rotation.y += deltaTime * cloud.rotationSpeed;
            
            // Oscillazione verticale più fluida
            cloud.mesh.position.y = cloud.initialY + Math.sin(time * cloud.bobSpeed * 1000) * 20;
            
            // Leggero movimento casuale per un effetto più naturale
            cloud.mesh.position.x += deltaTime * Math.sin(time * 0.5 + cloud.initialY) * 0.5;
            cloud.mesh.position.z += deltaTime * Math.cos(time * 0.5 + cloud.initialY) * 0.5;
        });
    }
} 