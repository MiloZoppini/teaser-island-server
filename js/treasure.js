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
        
        // Aggiungiamo un collider visibile per debug
        this.addCollider();
        
        // Carica il modello GLTF
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
                        // Colore in base al tipo di tesoro
                        let color, emissive;
                        switch (this.type) {
                            case 'bonus':
                                color = 0x0088FF; // Blu
                                emissive = 0x0044AA;
                                break;
                            case 'malus':
                                color = 0xFF0000; // Rosso
                                emissive = 0xAA0000;
                                break;
                            default: // normal
                                color = 0xD4AF37; // Oro
                                emissive = 0xFFD700;
                        }
                        
                        child.material = new THREE.MeshStandardMaterial({
                            color: color,
                            roughness: 0.3,
                            metalness: 0.8,
                            emissive: emissive,
                            emissiveIntensity: 0.3
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
                
                // Aggiungi luce e effetti
                this.addLight();
                this.createParticles();
                
                this.loaded = true;
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% caricato');
            },
            (error) => {
                console.error('Errore nel caricamento del modello:', error);
                
                // In caso di errore, crea un modello di fallback
                this.createFallbackModel();
            }
        );
    }
    
    createFallbackModel() {
        // Crea un modello di fallback in caso di errore nel caricamento
        console.log('Creazione modello di fallback per il tesoro');
        
        // Gruppo principale del tesoro
        this.model = new THREE.Group();
        
        // Aggiungi il flag isTreasure
        this.model.userData.isTreasure = true;
        this.model.userData.treasureType = this.type;

        // Colore in base al tipo di tesoro
        let color, emissive;
        switch (this.type) {
            case 'bonus':
                color = 0x0088FF; // Blu
                emissive = 0x0044AA;
                break;
            case 'malus':
                color = 0xFF0000; // Rosso
                emissive = 0xAA0000;
                break;
            default: // normal
                color = 0xD4AF37; // Oro
                emissive = 0xFFD700;
        }

        // Crea il forziere con materiale più realistico
        const chestGeometry = new THREE.BoxGeometry(1, 0.8, 0.6);
        const chestMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.3,
            metalness: 0.8,
            emissive: emissive,
            emissiveIntensity: 0.3
        });
        this.chest = new THREE.Mesh(chestGeometry, chestMaterial);
        this.chest.castShadow = true;
        this.chest.receiveShadow = true;
        this.model.add(this.chest);

        // Crea il coperchio
        const lidGeometry = new THREE.BoxGeometry(1, 0.2, 0.6);
        this.lid = new THREE.Mesh(lidGeometry, chestMaterial);
        this.lid.position.y = 0.5;
        this.lid.position.z = 0.3;
        this.lid.rotation.x = -Math.PI / 6;
        this.lid.castShadow = true;
        this.lid.receiveShadow = true;
        this.model.add(this.lid);

        // Aggiungiamo dettagli al forziere
        this.addChestDetails();
        
        // Aggiungi il modello alla scena
        this.scene.add(this.model);
        
        // Imposta la posizione
        this.setPosition(this.initialPosition);
        
        // Aggiungi luce e effetti
        this.addLight();
        this.createParticles();
        
        this.loaded = true;
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
        // Crea una sfera trasparente per visualizzare l'area di collisione
        const colliderGeometry = new THREE.SphereGeometry(5, 16, 16);
        
        // Colore del collider in base al tipo di tesoro
        let colliderColor;
        switch (this.type) {
            case 'bonus':
                colliderColor = 0x0088FF; // Blu
                break;
            case 'malus':
                colliderColor = 0xFF0000; // Rosso
                break;
            default: // normal
                colliderColor = 0xFF0000; // Rosso per il debug
        }
        
        const colliderMaterial = new THREE.MeshBasicMaterial({
            color: colliderColor,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        this.collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
        this.model.add(this.collider);
    }

    checkCollision(playerPosition, collisionDistance = 5) {
        // Verifica che il modello sia caricato
        if (!this.model) {
            console.log('Modello del tesoro non ancora caricato');
            return false;
        }
        
        // Verifica se il giocatore è abbastanza vicino al tesoro
        const treasurePosition = this.getPosition();
        const dx = treasurePosition.x - playerPosition.x;
        const dy = treasurePosition.y - playerPosition.y;
        const dz = treasurePosition.z - playerPosition.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Debug: mostra sempre la distanza dal tesoro quando è vicino
        if (distance < 10) {
            console.log('Distanza dal tesoro:', distance.toFixed(2), 
                        'Limite collisione:', collisionDistance);
            console.log('Posizione tesoro:', 
                        'X:', treasurePosition.x.toFixed(2), 
                        'Y:', treasurePosition.y.toFixed(2), 
                        'Z:', treasurePosition.z.toFixed(2));
            console.log('Posizione giocatore:', 
                        'X:', playerPosition.x.toFixed(2), 
                        'Y:', playerPosition.y.toFixed(2), 
                        'Z:', playerPosition.z.toFixed(2));
        }
        
        // Utilizziamo solo la distanza, che è più affidabile delle bounding box
        const collision = distance < collisionDistance;
        
        // Aggiungiamo un log più dettagliato per debug
        if (collision) {
            console.log('COLLISIONE CON IL TESORO RILEVATA! Distanza:', distance.toFixed(2), 
                        'Posizione tesoro:', treasurePosition, 
                        'Posizione giocatore:', playerPosition,
                        'Tipo tesoro:', this.type);
            
            // Cambia il colore del collider quando c'è una collisione
            if (this.collider) {
                this.collider.material.color.set(0x00ff00);
                this.collider.material.opacity = 0.5;
            }
        } else if (this.collider && distance < 10) {
            // Ripristina il colore del collider quando non c'è collisione ma il giocatore è vicino
            let colliderColor;
            switch (this.type) {
                case 'bonus':
                    colliderColor = 0x0088FF; // Blu
                    break;
                case 'malus':
                    colliderColor = 0xFF0000; // Rosso
                    break;
                default: // normal
                    colliderColor = 0xFF0000; // Rosso per il debug
            }
            this.collider.material.color.set(colliderColor);
            this.collider.material.opacity = 0.2;
        }
        
        return collision;
    }

    getType() {
        return this.type;
    }

    dispose() {
        this.scene.remove(this.model);
    }
} 