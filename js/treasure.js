class Treasure {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, type = 'normal') {
        this.scene = scene;
        this.initialPosition = position;
        this.model = new THREE.Group(); // Gruppo temporaneo fino al caricamento del modello
        this.model.userData.isTreasure = true; // Flag per identificare il tesoro
        this.scene.add(this.model);
        this.setPosition(position);
        this.setupAnimation();
        this.loaded = false;
        this.type = type; // 'normal', 'bonus', 'malus'
        
        console.log(`Creazione tesoro di tipo ${type} in posizione:`, position);
        
        // Aggiungiamo un collider visibile per debug
        this.addCollider();
        
        // Crea immediatamente un modello di fallback per garantire la visibilità
        this.createFallbackModel();
        
        // Carica il modello GLTF (sostituirà il fallback se caricato con successo)
        this.loadModel();
    }

    loadModel() {
        // Creiamo un loader GLTF
        const loader = new THREE.GLTFLoader();
        
        // URL del modello (utilizziamo il modello locale)
        const modelUrl = '/models/chest.glb';
        
        // Carica il modello
        loader.load(
            modelUrl,
            (gltf) => {
                // Rimuovi il gruppo temporaneo
                this.scene.remove(this.model);
                
                // Assegna il modello caricato
                this.model = gltf.scene;
                
                // Aggiungi il flag isTreasure
                this.model.userData.isTreasure = true;
                this.model.userData.treasureType = this.type;
                
                // Scala il modello
                this.model.scale.set(1.5, 1.5, 1.5);
                
                // Applica materiali con emissione per un effetto luminoso
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        // Salva il materiale originale
                        child.originalMaterial = child.material;
                        
                        // Crea un nuovo materiale con proprietà emissive
                        let color, emissiveColor, emissiveIntensity;
                        
                        // Imposta colori diversi in base al tipo di tesoro
                        switch(this.type) {
                            case 'bonus':
                                color = 0x0088ff; // Blu
                                emissiveColor = 0x0088ff;
                                emissiveIntensity = 0.8;
                                break;
                            case 'malus':
                                color = 0xff0000; // Rosso
                                emissiveColor = 0xff0000;
                                emissiveIntensity = 0.8;
                                break;
                            default: // 'normal'
                                color = 0xffcc00; // Oro
                                emissiveColor = 0xffcc00;
                                emissiveIntensity = 0.5;
                                break;
                        }
                        
                        child.material = new THREE.MeshStandardMaterial({
                            color: color,
                            roughness: 0.3,
                            metalness: 0.8,
                            emissive: emissiveColor,
                            emissiveIntensity: emissiveIntensity
                        });
                        
                        // Abilita ombre
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Aggiungi il modello alla scena
                this.scene.add(this.model);
                
                // Imposta la posizione
                this.setPosition(this.initialPosition);
                
                // Aggiungi dettagli al forziere
                this.addChestDetails();
                
                // Aggiungi una luce al tesoro
                this.addLight();
                
                // Aggiungi particelle
                this.createParticles();
                
                this.loaded = true;
                
                console.log(`Modello GLTF del tesoro di tipo ${this.type} caricato con successo`);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% caricato');
            },
            (error) => {
                console.error('Errore nel caricamento del modello:', error);
                
                // In caso di errore, il modello di fallback è già stato creato
                console.log('Utilizzo del modello di fallback per il tesoro');
            }
        );
    }

    createFallbackModel() {
        // Crea un modello di fallback in caso di errore nel caricamento
        console.log('Creazione modello di fallback per il tesoro');
        
        // Rimuovi il modello precedente se esiste
        if (this.model) {
            this.scene.remove(this.model);
        }
        
        // Crea un nuovo gruppo
        this.model = new THREE.Group();
        this.model.userData.isTreasure = true;
        this.model.userData.treasureType = this.type;
        
        // Colori diversi in base al tipo di tesoro
        let color, emissiveColor, emissiveIntensity;
        
        switch(this.type) {
            case 'bonus':
                color = 0x0088ff; // Blu
                emissiveColor = 0x0088ff;
                emissiveIntensity = 0.8;
                break;
            case 'malus':
                color = 0xff0000; // Rosso
                emissiveColor = 0xff0000;
                emissiveIntensity = 0.8;
                break;
            default: // 'normal'
                color = 0xffcc00; // Oro
                emissiveColor = 0xffcc00;
                emissiveIntensity = 0.5;
                break;
        }
        
        // Crea un forziere semplice con un cubo
        const chestGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
        const chestMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.8,
            emissive: emissiveColor,
            emissiveIntensity: emissiveIntensity
        });
        const chest = new THREE.Mesh(chestGeometry, chestMaterial);
        chest.castShadow = true;
        chest.receiveShadow = true;
        this.model.add(chest);
        
        // Crea il coperchio del forziere
        const lidGeometry = new THREE.BoxGeometry(1.6, 0.5, 1.6);
        const lidMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.8,
            emissive: emissiveColor,
            emissiveIntensity: emissiveIntensity
        });
        this.lid = new THREE.Mesh(lidGeometry, lidMaterial);
        this.lid.position.y = 0.75;
        this.lid.castShadow = true;
        this.lid.receiveShadow = true;
        this.model.add(this.lid);
        
        // Aggiungi dettagli al forziere
        this.addChestDetails();
        
        // Aggiungi una luce al tesoro
        this.addLight();
        
        // Aggiungi particelle
        this.createParticles();
        
        // Aggiungi il modello alla scena
        this.scene.add(this.model);
        
        // Imposta la posizione
        this.setPosition(this.initialPosition);
        
        this.loaded = true;
        
        console.log(`Modello di fallback per il tesoro di tipo ${this.type} creato con successo`);
    }

    addChestDetails() {
        // Aggiungiamo bordi metallici
        const edgeGeometry = new THREE.BoxGeometry(1.05, 0.05, 0.05);
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.2,
            metalness: 0.9
        });

        // Bordi superiori
        const topEdge1 = new THREE.Mesh(edgeGeometry, edgeMaterial);
        topEdge1.position.y = 0.4;
        topEdge1.position.z = 0.3;
        this.model.add(topEdge1);

        const topEdge2 = new THREE.Mesh(edgeGeometry, edgeMaterial);
        topEdge2.position.y = 0.4;
        topEdge2.position.z = -0.3;
        this.model.add(topEdge2);

        // Bordi laterali
        const sideEdgeGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.7);
        
        const sideEdge1 = new THREE.Mesh(sideEdgeGeometry, edgeMaterial);
        sideEdge1.position.x = 0.5;
        sideEdge1.position.y = 0.4;
        this.model.add(sideEdge1);

        const sideEdge2 = new THREE.Mesh(sideEdgeGeometry, edgeMaterial);
        sideEdge2.position.x = -0.5;
        sideEdge2.position.y = 0.4;
        this.model.add(sideEdge2);

        // Aggiungiamo un lucchetto
        const lockGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const lockMaterial = new THREE.MeshStandardMaterial({
            color: 0xB8860B,
            roughness: 0.2,
            metalness: 0.9
        });
        
        const lock = new THREE.Mesh(lockGeometry, lockMaterial);
        lock.position.z = 0.35;
        lock.position.y = 0.3;
        this.model.add(lock);
    }

    addLight() {
        // Colore della luce in base al tipo di tesoro
        let lightColor;
        switch (this.type) {
            case 'bonus':
                lightColor = 0x0088FF; // Blu
                break;
            case 'malus':
                lightColor = 0xFF0000; // Rosso
                break;
            default: // normal
                lightColor = 0xFFD700; // Oro
        }
        
        // Aggiungi una luce point per il bagliore con intensità ridotta
        this.light = new THREE.PointLight(lightColor, 1.0, 8);
        this.light.position.y = 1;
        this.model.add(this.light);

        // Aggiungiamo un effetto di luce volumetrica
        this.addVolumetricLight(lightColor);
    }

    addVolumetricLight(color) {
        // Creiamo un effetto di luce volumetrica con particelle ma meno intenso
        const lightBeamGeometry = new THREE.CylinderGeometry(0.1, 0.5, 4, 8);
        const lightBeamMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        this.lightBeam = new THREE.Mesh(lightBeamGeometry, lightBeamMaterial);
        this.lightBeam.position.y = 2;
        this.lightBeam.rotation.x = Math.PI;
        this.model.add(this.lightBeam);
    }

    createParticles() {
        // Colore delle particelle in base al tipo di tesoro
        let particleColor;
        switch (this.type) {
            case 'bonus':
                particleColor = 0x0088FF; // Blu
                break;
            case 'malus':
                particleColor = 0xFF0000; // Rosso
                break;
            default: // normal
                particleColor = 0xFFD700; // Oro
        }
        
        // Creiamo particelle che fluttuano intorno al tesoro ma meno intense
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const radius = 1 + Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i3 + 1] = radius * Math.cos(phi) + 0.5;
            particlePositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        // Creiamo una texture per le particelle
        const particleTexture = this.createParticleTexture();
        
        const particleMaterial = new THREE.PointsMaterial({
            color: particleColor,
            size: 0.08,
            map: particleTexture,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.model.add(this.particles);
        
        // Salviamo le posizioni originali per l'animazione
        this.particlePositions = particlePositions;
    }

    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        // Gradiente per creare una particella luminosa
        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    setupAnimation() {
        this.animationTime = 0;
        this.floatHeight = 0.5;
        this.floatSpeed = 0.002;
        this.rotationSpeed = 0.01;
        this.initialY = 0;
    }

    update() {
        if (!this.loaded) return;
        
        this.animationTime += this.floatSpeed;
        this.model.position.y = this.initialY + Math.sin(this.animationTime) * this.floatHeight;
        this.model.rotation.y += this.rotationSpeed;

        if (this.light) {
            this.light.intensity = 1.0 + Math.sin(this.animationTime * 2) * 0.3;
        }
        
        if (this.lightBeam) {
            this.lightBeam.material.opacity = 0.1 + Math.sin(this.animationTime * 3) * 0.05;
        }
        
        if (this.particles && this.particlePositions) {
            for (let i = 0; i < this.particlePositions.length / 3; i++) {
                const i3 = i * 3;
                const x = this.particlePositions[i3];
                const y = this.particlePositions[i3 + 1];
                const z = this.particlePositions[i3 + 2];
                const time = this.animationTime + i * 0.1;
                const newY = y + Math.sin(time) * 0.1;
                const radius = Math.sqrt(x * x + z * z);
                const angle = Math.atan2(z, x) + 0.01 * Math.sin(time * 0.5);
                const newX = Math.cos(angle) * radius;
                const newZ = Math.sin(angle) * radius;
                const positions = this.particles.geometry.attributes.position.array;
                positions[i3] = newX;
                positions[i3 + 1] = newY;
                positions[i3 + 2] = newZ;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Aggiorna il collider per seguire il tesoro
        // Non è necessario aggiornare la posizione del collider poiché è un figlio del modello
        // e si muoverà automaticamente con esso
    }

    setPosition(position) {
        this.model.position.set(position.x, position.y + 1, position.z);
        this.initialY = this.model.position.y;
    }

    getPosition() {
        return this.model.position;
    }

    addCollider() {
        // Crea un collider visibile per debug
        const colliderGeometry = new THREE.SphereGeometry(5, 16, 16);
        const colliderMaterial = new THREE.MeshBasicMaterial({
            color: this.type === 'bonus' ? 0x0088ff : (this.type === 'malus' ? 0xff0000 : 0xffcc00),
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        this.collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
        this.model.add(this.collider);
        
        console.log(`Collider aggiunto al tesoro di tipo ${this.type}`);
    }

    checkCollision(playerPosition, collisionDistance = 5) {
        if (!this.model) return false;
        
        const treasurePosition = this.getPosition();
        const distance = playerPosition.distanceTo(treasurePosition);
        
        // Debug della distanza
        if (distance < 10) {
            console.log(`Distanza dal tesoro di tipo ${this.type}: ${distance.toFixed(2)}`);
            
            // Cambia il colore del collider quando il giocatore è vicino
            if (this.collider) {
                this.collider.material.opacity = 0.4;
                
                if (distance < collisionDistance) {
                    // Cambia il colore a verde quando collide
                    this.collider.material.color.set(0x00ff00);
                }
            }
        }
        
        return distance < collisionDistance;
    }

    getType() {
        return this.type;
    }

    dispose() {
        this.scene.remove(this.model);
    }
} 