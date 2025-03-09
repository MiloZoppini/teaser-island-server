class Player {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, isLocalPlayer = false) {
        this.scene = scene;
        this.isLocalPlayer = isLocalPlayer;
        this.moveSpeed = 0.08; // Ridotta da 0.15 a 0.08 per una camminata più lenta
        this.runSpeed = 0.2; // Ridotta da 0.3 a 0.2 ma comunque più veloce della camminata
        this.isRunning = false; // Flag per indicare se il giocatore sta correndo
        this.lastWKeyTime = 0; // Timestamp dell'ultimo tasto W premuto
        this.wKeyPressCount = 0; // Contatore per il doppio click su W
        this.jumpForce = 0.3; // Ridotto da 0.5 a 0.3 per un salto più basso
        this.gravity = 0.02;
        this.velocity = { x: 0, y: 0, z: 0 };
        this.onGround = false;
        this.score = 0;
        this.isPOV = true; // Sempre in prima persona
        this.initialPosition = position;
        this.loaded = false;
        this.playerColor = this.isLocalPlayer ? 0x00ff00 : this.getRandomPlayerColor(); // Verde per il giocatore locale, colore casuale per gli altri
        this.playerName = this.isLocalPlayer ? "Tu" : this.getMinecraftName();
        
        console.log(`Creazione giocatore ${this.playerName} in posizione:`, position, `isLocalPlayer: ${isLocalPlayer}`);
        
        // Crea un gruppo temporaneo fino al caricamento del modello
        this.model = new THREE.Group();
        this.scene.add(this.model);
        this.setPosition(position);

        // Crea il modello del personaggio in stile Minecraft
        this.createMinecraftAvatar();

        if (isLocalPlayer) {
            this.setupControls();
            this.setupCamera();
            
            // Crea un elemento per mostrare lo stato della corsa
            this.createRunningIndicator();
        } else {
            // Aggiungi un'etichetta con il nome del giocatore per i giocatori remoti
            this.addPlayerNameTag();
        }
        
        console.log(`Giocatore ${this.playerName} creato con successo`);
    }

    getRandomPlayerColor() {
        // Colori vivaci per i giocatori remoti
        const colors = [
            0xff0000, // Rosso
            0x0000ff, // Blu
            0xff00ff, // Magenta
            0xffff00, // Giallo
            0x00ffff, // Ciano
            0xff8000, // Arancione
            0x8000ff  // Viola
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getMinecraftName() {
        // Nomi ispirati a Minecraft
        const prefixes = [
            "Steve", "Alex", "Creeper", "Enderman", "Zombie", "Skeleton", 
            "Villager", "Miner", "Digger", "Crafter", "Builder", "Diamond", 
            "Gold", "Iron", "Emerald", "Redstone", "Obsidian", "Lava"
        ];
        
        const suffixes = [
            "Master", "Pro", "Noob", "King", "Queen", "Lord", "Hunter", 
            "Slayer", "Warrior", "Knight", "Mage", "Archer", "Explorer", 
            "Adventurer", "Seeker", "Finder", "Collector", "Destroyer"
        ];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return prefix + suffix;
    }

    createMinecraftAvatar() {
        // Crea un avatar in stile Minecraft (blocchi cubici)
        console.log('Creazione avatar Minecraft per il giocatore');
        
        // Gruppo principale del personaggio
        this.model = new THREE.Group();
        
        // Materiale base con colore del giocatore
        const mainMaterial = new THREE.MeshStandardMaterial({ 
            color: this.playerColor,
            roughness: 0.3,
            metalness: 0.2,
            emissive: this.playerColor,
            emissiveIntensity: 0.2
        });
        
        // Materiale per la testa
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffcc99, // Colore pelle
            roughness: 0.3,
            metalness: 0.0
        });
        
        // Materiale per gli occhi
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000, // Nero
            roughness: 0.0,
            metalness: 0.0
        });
        
        // Materiale per la bocca
        const mouthMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x993333, // Rosso scuro
            roughness: 0.3,
            metalness: 0.0
        });
        
        // Materiale per i capelli
        const hairMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x663300, // Marrone
            roughness: 0.5,
            metalness: 0.0
        });
        
        // Materiale per i pantaloni
        const pantsMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0000aa, // Blu scuro
            roughness: 0.3,
            metalness: 0.1
        });
        
        // Materiale per le scarpe
        const shoesMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x663300, // Marrone
            roughness: 0.3,
            metalness: 0.1
        });
        
        // Testa (cubo)
        const headGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 2.5;
        this.head.castShadow = true;
        this.model.add(this.head);
        
        // Occhi
        const eyeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        
        // Occhio sinistro
        this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.position.set(-0.2, 2.6, 0.5);
        this.model.add(this.leftEye);
        
        // Occhio destro
        this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.position.set(0.2, 2.6, 0.5);
        this.model.add(this.rightEye);
        
        // Bocca
        const mouthGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
        this.mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        this.mouth.position.set(0, 2.3, 0.5);
        this.model.add(this.mouth);
        
        // Capelli (parte superiore della testa)
        const hairGeometry = new THREE.BoxGeometry(1.05, 0.2, 1.05);
        this.hair = new THREE.Mesh(hairGeometry, hairMaterial);
        this.hair.position.set(0, 3.05, 0);
        this.model.add(this.hair);
        
        // Corpo (cubo)
        const bodyGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.6);
        this.body = new THREE.Mesh(bodyGeometry, mainMaterial);
        this.body.position.y = 1.1;
        this.body.castShadow = true;
        this.model.add(this.body);
        
        // Braccia
        const armGeometry = new THREE.BoxGeometry(0.4, 1.8, 0.4);
        
        // Braccio sinistro
        this.leftArm = new THREE.Mesh(armGeometry, mainMaterial);
        this.leftArm.position.set(-0.8, 1.1, 0);
        this.leftArm.castShadow = true;
        this.model.add(this.leftArm);
        
        // Braccio destro
        this.rightArm = new THREE.Mesh(armGeometry, mainMaterial);
        this.rightArm.position.set(0.8, 1.1, 0);
        this.rightArm.castShadow = true;
        this.model.add(this.rightArm);
        
        // Gambe
        const legGeometry = new THREE.BoxGeometry(0.4, 1.8, 0.4);
        
        // Gamba sinistra
        this.leftLeg = new THREE.Mesh(legGeometry, pantsMaterial);
        this.leftLeg.position.set(-0.3, -0.3, 0);
        this.leftLeg.castShadow = true;
        this.model.add(this.leftLeg);
        
        // Gamba destra
        this.rightLeg = new THREE.Mesh(legGeometry, pantsMaterial);
        this.rightLeg.position.set(0.3, -0.3, 0);
        this.rightLeg.castShadow = true;
        this.model.add(this.rightLeg);
        
        // Scarpe
        const shoeGeometry = new THREE.BoxGeometry(0.45, 0.3, 0.5);
        
        // Scarpa sinistra
        this.leftShoe = new THREE.Mesh(shoeGeometry, shoesMaterial);
        this.leftShoe.position.set(-0.3, -1.2, 0.05);
        this.leftShoe.castShadow = true;
        this.model.add(this.leftShoe);
        
        // Scarpa destra
        this.rightShoe = new THREE.Mesh(shoeGeometry, shoesMaterial);
        this.rightShoe.position.set(0.3, -1.2, 0.05);
        this.rightShoe.castShadow = true;
        this.model.add(this.rightShoe);
        
        // Aggiungi un effetto di luce attorno al giocatore
        this.addPlayerLight();
        
        // Aggiungi il modello alla scena
        this.scene.add(this.model);
        
        // Imposta la posizione
        this.setPosition(this.initialPosition);
        
        this.loaded = true;
        
        // Aggiungi un collider visibile per debug
        this.addCollider();
    }
    
    addCollider() {
        // Aggiungi un collider visibile per debug
        const colliderGeometry = new THREE.SphereGeometry(1, 16, 16);
        const colliderMaterial = new THREE.MeshBasicMaterial({
            color: this.playerColor,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        this.collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
        this.collider.position.y = 1.5; // Posiziona il collider al centro del personaggio
        this.model.add(this.collider);
    }

    addPlayerLight() {
        // Aggiungi una luce puntuale attorno al giocatore per renderlo più visibile
        this.playerLight = new THREE.PointLight(this.playerColor, 1, 5);
        this.playerLight.position.set(0, 1.5, 0);
        this.model.add(this.playerLight);
        
        // Aggiungi un effetto di particelle luminose attorno al giocatore
        if (!this.isLocalPlayer) {
            this.addPlayerParticles();
        }
    }

    addPlayerParticles() {
        // Crea un sistema di particelle attorno al giocatore
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = (Math.random() - 0.5) * 2;
            particlePositions[i3 + 1] = Math.random() * 3;
            particlePositions[i3 + 2] = (Math.random() - 0.5) * 2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: this.playerColor,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.model.add(this.particles);
    }

    addPlayerNameTag() {
        // Crea un canvas per il testo
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // Riempi lo sfondo con un colore semi-trasparente
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Aggiungi un bordo
        context.strokeStyle = '#' + this.playerColor.toString(16).padStart(6, '0');
        context.lineWidth = 8;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        // Imposta lo stile del testo
        context.font = 'Bold 48px Arial';
        context.fillStyle = '#ffffff'; // Testo bianco
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Aggiungi un'ombra al testo
        context.shadowColor = 'rgba(0, 0, 0, 0.8)';
        context.shadowBlur = 5;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;
        
        // Disegna il testo
        context.fillText(this.playerName, canvas.width / 2, canvas.height / 2);
        
        // Crea una texture dal canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        // Crea un materiale con la texture
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        // Crea uno sprite con il materiale
        this.nameTag = new THREE.Sprite(material);
        this.nameTag.scale.set(4, 1, 1);
        this.nameTag.position.y = 4; // Posiziona il tag sopra la testa
        
        // Aggiungi il tag al modello
        this.model.add(this.nameTag);
    }

    setupCamera() {
        // Crea una camera in prima persona
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Posiziona la camera sopra la testa del giocatore
        this.camera.position.set(0, 3, 0);
        
        // Aggiungi la camera al modello del giocatore
        this.model.add(this.camera);
        
        // Imposta la camera per guardare in avanti
        this.camera.lookAt(0, 3, -10);
        
        // Salva la camera in window.game per debug
        if (window.game) {
            window.game.camera = this.camera;
        }
        
        console.log('Camera setup completato per il giocatore locale');
        
        // Blocchiamo il puntatore per una migliore esperienza in prima persona
        document.addEventListener('click', () => {
            if (document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            }
        });
    }

    setupControls() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onKeyDown(event) {
        switch(event.code) {
            case 'KeyW': case 'ArrowUp': 
                if (!this.keys.forward) { // Solo se il tasto non era già premuto
                    this.keys.forward = true;
                    
                    // Gestione del doppio click per la corsa
                    const now = Date.now();
                    if (now - this.lastWKeyTime < 300) { // 300ms per rilevare il doppio click
                        this.isRunning = true;
                        console.log('Corsa attivata!');
                        
                        // Mostra l'indicatore di corsa
                        if (this.runningIndicator) {
                            this.runningIndicator.style.display = 'block';
                        }
                    }
                    this.lastWKeyTime = now;
                }
                break;
            case 'KeyS': case 'ArrowDown': 
                this.keys.backward = true; 
                // Disattiva la corsa quando si va indietro
                if (this.isRunning) {
                    this.isRunning = false;
                    if (this.runningIndicator) {
                        this.runningIndicator.style.display = 'none';
                    }
                }
                break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
            case 'Space': if (this.onGround) this.jump(); break;
        }
    }

    onKeyUp(event) {
        switch(event.code) {
            case 'KeyW': case 'ArrowUp': 
                this.keys.forward = false;
                // Disattiva la corsa quando si rilascia W
                if (this.isRunning) {
                    this.isRunning = false;
                    if (this.runningIndicator) {
                        this.runningIndicator.style.display = 'none';
                    }
                }
                break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
        }
    }

    onMouseMove(event) {
        if (this.isLocalPlayer && document.pointerLockElement === document.body) {
            // Rotazione orizzontale
            this.model.rotation.y -= event.movementX * 0.002;
            
            // Rotazione verticale (guardare su/giù)
            this.verticalAngle = this.verticalAngle || 0;
            this.verticalAngle -= event.movementY * 0.002;
            this.verticalAngle = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.verticalAngle));
            
            // Applica la rotazione verticale alla camera
            if (this.camera) {
                this.camera.rotation.x = this.verticalAngle;
            }
        }
    }

    jump() {
        if (this.onGround) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
        }
    }

    update() {
        if (!this.loaded) return;
        
        if (this.isLocalPlayer) {
            this.updateMovement();
            this.updatePhysics();
            this.updateCamera();
            
            // Verifica collisione con il tesoro
            if (window.game && window.game.treasure) {
                const playerPosition = this.getPosition();
                
                // Aggiungiamo un controllo per evitare collisioni multiple in rapida successione
                const now = Date.now();
                const lastCollision = this.lastTreasureCollision || 0;
                
                if (now - lastCollision > 1000) { // Aspetta almeno 1 secondo tra le collisioni
                    // Utilizziamo una distanza di collisione maggiore (5 unità) per rendere più facile raccogliere il tesoro
                    if (window.game.treasure.checkCollision(playerPosition, 5)) {
                        console.log('TESORO RACCOLTO dal giocatore locale! Posizione:', playerPosition);
                        
                        // Invia l'evento al server
                        window.game.gameSocket.emitTreasureCollected();
                        
                        // Aggiorniamo il timestamp dell'ultima collisione
                        this.lastTreasureCollision = now;
                        
                        // Aggiungiamo un feedback visivo più evidente
                        if (window.game.renderer) {
                            // Flash giallo più intenso
                            const originalClearColor = window.game.renderer.getClearColor().getHex();
                            window.game.renderer.setClearColor(0xffff00, 1);
                            
                            // Suono di raccolta (se disponibile)
                            if (window.game.sounds && window.game.sounds.collect) {
                                window.game.sounds.collect.play();
                            }
                            
                            // Ripristina il colore originale dopo un breve periodo
                            setTimeout(() => {
                                window.game.renderer.setClearColor(originalClearColor, 1);
                            }, 300);
                        }
                    }
                }
            }

            // Invia la posizione e la rotazione al server
            if (window.game && window.game.gameSocket) {
                window.game.gameSocket.emitPlayerMove(this.getPosition(), this.getRotation());
            }
        } else {
            // Animazione per i giocatori remoti
            this.animateRemotePlayer();
            
            // Assicurati che il nametag sia sempre rivolto verso la camera
            if (this.nameTag && window.game && window.game.camera) {
                this.nameTag.lookAt(window.game.camera.position);
            }
        }
    }

    updateMovement() {
        if (!this.isLocalPlayer) return;
        
        const moveSpeed = this.isRunning ? this.runSpeed : this.moveSpeed;
        const direction = new THREE.Vector3(0, 0, 0);
        
        // Calcola la direzione in base ai tasti premuti
        if (this.keys.forward) direction.z -= 1;
        if (this.keys.backward) direction.z += 1;
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;
        
        // Normalizza la direzione per evitare velocità maggiore in diagonale
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Calcola il movimento in base alla rotazione del giocatore
        const angle = this.model.rotation.y;
        this.velocity.x = direction.x * Math.cos(angle) + direction.z * Math.sin(angle);
        this.velocity.z = direction.z * Math.cos(angle) - direction.x * Math.sin(angle);
        
        // Applica la velocità
        this.velocity.x *= moveSpeed;
        this.velocity.z *= moveSpeed;
    }

    updatePhysics() {
        if (!window.game) return;
        
        // Applica la gravità
        if (!this.onGround) {
            this.velocity.y -= this.gravity;
        }
        
        // Aggiorna la posizione
        this.model.position.x += this.velocity.x;
        this.model.position.y += this.velocity.y;
        this.model.position.z += this.velocity.z;
        
        // Collisione con il terreno
        const terrainHeight = window.game.getTerrainHeight(this.model.position.x, this.model.position.z);
        if (this.model.position.y < terrainHeight + 1) {
            this.model.position.y = terrainHeight + 1;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Attrito (rallentamento orizzontale)
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
        
        // Limita la velocità massima
        const maxSpeed = this.isRunning ? this.runSpeed * 1.5 : this.moveSpeed * 1.5;
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (horizontalSpeed > maxSpeed) {
            const scale = maxSpeed / horizontalSpeed;
            this.velocity.x *= scale;
            this.velocity.z *= scale;
        }
    }

    updateCamera() {
        // Nessuna azione necessaria poiché la camera è già collegata al modello
    }

    setPosition(position) {
        this.model.position.copy(position);
    }

    setRotation(rotation) {
        this.model.rotation.copy(rotation);
    }

    getPosition() {
        return this.model.position;
    }

    getRotation() {
        return this.model.rotation;
    }

    createRunningIndicator() {
        // Crea un indicatore di corsa
        this.runningIndicator = document.createElement('div');
        this.runningIndicator.style.position = 'fixed';
        this.runningIndicator.style.bottom = '20px';
        this.runningIndicator.style.right = '20px';
        this.runningIndicator.style.padding = '10px 15px';
        this.runningIndicator.style.background = 'rgba(0, 255, 0, 0.5)';
        this.runningIndicator.style.color = 'white';
        this.runningIndicator.style.borderRadius = '5px';
        this.runningIndicator.style.fontFamily = 'Arial, sans-serif';
        this.runningIndicator.style.fontSize = '16px';
        this.runningIndicator.style.display = 'none';
        this.runningIndicator.textContent = 'Corsa';
        document.body.appendChild(this.runningIndicator);
    }

    animateRemotePlayer() {
        // Animazione semplice per i giocatori remoti
        const time = Date.now() * 0.001;
        
        // Muovi le braccia avanti e indietro
        if (this.leftArm && this.rightArm) {
            this.leftArm.rotation.x = Math.sin(time * 2) * 0.2;
            this.rightArm.rotation.x = Math.sin(time * 2 + Math.PI) * 0.2;
        }
        
        // Muovi le gambe avanti e indietro
        if (this.leftLeg && this.rightLeg) {
            this.leftLeg.rotation.x = Math.sin(time * 2) * 0.2;
            this.rightLeg.rotation.x = Math.sin(time * 2 + Math.PI) * 0.2;
        }
        
        // Fai ruotare le particelle
        if (this.particles) {
            this.particles.rotation.y = time;
        }
        
        // Fai oscillare leggermente il personaggio
        if (this.model) {
            this.model.position.y += Math.sin(time * 1.5) * 0.01;
        }
    }

    dispose() {
        if (this.model) {
            this.scene.remove(this.model);
            
            // Rimuovi tutti i materiali e le geometrie
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }
        
        if (this.nameTag && this.nameTag.material) {
            if (this.nameTag.material.map) this.nameTag.material.map.dispose();
            this.nameTag.material.dispose();
        }
        
        if (this.playerLight) {
            this.model.remove(this.playerLight);
        }
        
        if (this.particles) {
            this.model.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
        
        // Rimuovi l'indicatore di corsa
        if (this.runningIndicator && this.runningIndicator.parentNode) {
            this.runningIndicator.parentNode.removeChild(this.runningIndicator);
        }
    }
} 