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
        this.playerName = this.isLocalPlayer ? "Tu" : "Giocatore " + Math.floor(Math.random() * 1000);
        
        // Crea un gruppo temporaneo fino al caricamento del modello
        this.model = new THREE.Group();
        this.scene.add(this.model);
        this.setPosition(position);

        // Carica il modello del personaggio
        this.createPlayerAvatar();

        if (isLocalPlayer) {
            this.setupControls();
            this.setupCamera();
            
            // Crea un elemento per mostrare lo stato della corsa
            this.createRunningIndicator();
        } else {
            // Aggiungi un'etichetta con il nome del giocatore per i giocatori remoti
            this.addPlayerNameTag();
        }
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

    createPlayerAvatar() {
        // Crea un avatar più visibile per il giocatore
        console.log('Creazione avatar per il giocatore');
        
        // Gruppo principale del personaggio
        this.model = new THREE.Group();

        // Corpo (cilindro)
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.playerColor,
            roughness: 0.3,
            metalness: 0.5,
            emissive: this.playerColor,
            emissiveIntensity: 0.3
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 0.9; // Posiziona il corpo a metà altezza
        this.model.add(this.body);

        // Testa (sfera)
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffcc00,
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0xffcc00,
            emissiveIntensity: 0.2
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 2.1; // Posiziona la testa sopra il corpo
        this.model.add(this.head);

        // Braccia (cilindri)
        const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: this.playerColor,
            roughness: 0.3,
            metalness: 0.5,
            emissive: this.playerColor,
            emissiveIntensity: 0.2
        });
        
        // Braccio sinistro
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.8, 1.2, 0);
        this.leftArm.rotation.z = Math.PI / 6; // Inclina leggermente il braccio
        this.model.add(this.leftArm);

        // Braccio destro
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.8, 1.2, 0);
        this.rightArm.rotation.z = -Math.PI / 6; // Inclina leggermente il braccio
        this.model.add(this.rightArm);

        // Gambe (cilindri)
        const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0000ff, // Blu per le gambe
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0x0000ff,
            emissiveIntensity: 0.1
        });
        
        // Gamba sinistra
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.3, 0, 0);
        this.model.add(this.leftLeg);

        // Gamba destra
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.3, 0, 0);
        this.model.add(this.rightLeg);

        // Aggiungi un effetto di luce attorno al giocatore
        this.addPlayerLight();

        // Aggiungi il modello alla scena
        this.scene.add(this.model);
        
        // Imposta la posizione
        this.setPosition(this.initialPosition);
        
        this.loaded = true;
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
        canvas.width = 256;
        canvas.height = 64;
        
        // Imposta lo stile del testo
        context.font = 'Bold 24px Arial';
        context.fillStyle = '#' + this.playerColor.toString(16).padStart(6, '0');
        context.textAlign = 'center';
        context.fillText(this.playerName, 128, 32);
        
        // Crea una texture dal canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Crea un materiale con la texture
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        // Crea uno sprite con il materiale
        this.nameTag = new THREE.Sprite(material);
        this.nameTag.scale.set(2, 0.5, 1);
        this.nameTag.position.y = 3; // Posiziona il tag sopra la testa
        
        // Aggiungi il tag al modello
        this.model.add(this.nameTag);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.updateCamera();
        
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
        if (this.isLocalPlayer) {
            // Rotazione orizzontale
            this.model.rotation.y -= event.movementX * 0.002;
            
            // Rotazione verticale (guardare su/giù)
            this.verticalAngle = this.verticalAngle || 0;
            this.verticalAngle -= event.movementY * 0.002;
            this.verticalAngle = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.verticalAngle));
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
        }
    }

    updateMovement() {
        const direction = new THREE.Vector3();
        
        if (this.keys.forward) direction.z -= 1;
        if (this.keys.backward) direction.z += 1;
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;

        direction.normalize();
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.rotation.y);
        
        // Usa la velocità di corsa se il giocatore sta correndo, altrimenti usa la velocità normale
        const currentSpeed = this.isRunning && this.keys.forward ? this.runSpeed : this.moveSpeed;
        
        this.velocity.x = direction.x * currentSpeed;
        this.velocity.z = direction.z * currentSpeed;
    }

    updatePhysics() {
        // Applica gravità
        if (!this.onGround) {
            this.velocity.y -= this.gravity;
        }

        // Salva la posizione attuale per poter tornare indietro in caso di collisione
        const oldPosition = this.model.position.clone();

        // Aggiorna posizione
        this.model.position.x += this.velocity.x;
        this.model.position.y += this.velocity.y;
        this.model.position.z += this.velocity.z;

        // Collisione con il terreno
        if (this.model.position.y <= 1) {
            this.model.position.y = 1;
            this.velocity.y = 0;
            this.onGround = true;
        }

        // Verifica collisioni con gli oggetti nella scena
        if (window.game && window.game.checkCollisions) {
            const playerPosition = new THREE.Vector3(
                this.model.position.x,
                this.model.position.y,
                this.model.position.z
            );
            
            // Raggio di collisione del giocatore
            const collisionRadius = 1.0;
            
            // Se c'è una collisione, torna alla posizione precedente
            if (window.game.checkCollisions(playerPosition, collisionRadius)) {
                this.model.position.copy(oldPosition);
                // Azzera la velocità nella direzione della collisione
                this.velocity.x = 0;
                this.velocity.z = 0;
            }
        }

        // Limita l'area di gioco (quadruplicata)
        const maxRadius = 100; // Aumentato da 25 a 100
        const position = new THREE.Vector2(this.model.position.x, this.model.position.z);
        if (position.length() > maxRadius) {
            position.normalize().multiplyScalar(maxRadius);
            this.model.position.x = position.x;
            this.model.position.z = position.y;
        }
    }

    updateCamera() {
        if (!this.camera) return;

        // Visuale in prima persona
        const headPosition = new THREE.Vector3().copy(this.model.position);
        headPosition.y += 3.0; // Aumentata da 1.7 a 3.0 per una visuale più alta
        
        this.camera.position.copy(headPosition);
        
        // Creiamo un punto di mira che tiene conto della rotazione verticale
        const lookAtPoint = new THREE.Vector3(
            headPosition.x - Math.sin(this.model.rotation.y) * 10,
            headPosition.y + (this.verticalAngle || 0) * 10, // Aggiungiamo la rotazione verticale
            headPosition.z - Math.cos(this.model.rotation.y) * 10
        );
        
        this.camera.lookAt(lookAtPoint);
        
        // Nascondiamo il modello del giocatore in prima persona
        this.model.visible = false;
    }

    setPosition(position) {
        this.model.position.set(position.x, position.y, position.z);
    }

    setRotation(rotation) {
        this.model.rotation.set(rotation.x, rotation.y, rotation.z);
    }

    getPosition() {
        return this.model.position;
    }

    getRotation() {
        return this.model.rotation;
    }

    createRunningIndicator() {
        // Crea un elemento per mostrare lo stato della corsa
        this.runningIndicator = document.createElement('div');
        this.runningIndicator.style.position = 'fixed';
        this.runningIndicator.style.bottom = '20px';
        this.runningIndicator.style.left = '50%';
        this.runningIndicator.style.transform = 'translateX(-50%)';
        this.runningIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.runningIndicator.style.color = '#ffcc00';
        this.runningIndicator.style.padding = '8px 15px';
        this.runningIndicator.style.borderRadius = '5px';
        this.runningIndicator.style.fontFamily = 'Arial, sans-serif';
        this.runningIndicator.style.fontSize = '16px';
        this.runningIndicator.style.fontWeight = 'bold';
        this.runningIndicator.style.display = 'none';
        this.runningIndicator.style.zIndex = '1000';
        this.runningIndicator.style.boxShadow = '0 0 10px rgba(255, 204, 0, 0.5)';
        this.runningIndicator.style.border = '1px solid #ffcc00';
        this.runningIndicator.textContent = '🏃 CORSA ATTIVA 🏃';
        document.body.appendChild(this.runningIndicator);
    }

    animateRemotePlayer() {
        // Animazione semplice per i giocatori remoti
        if (this.leftArm && this.rightArm) {
            const time = Date.now() * 0.001;
            
            // Muovi le braccia avanti e indietro
            this.leftArm.rotation.x = Math.sin(time * 2) * 0.2;
            this.rightArm.rotation.x = Math.sin(time * 2 + Math.PI) * 0.2;
            
            // Muovi le gambe avanti e indietro
            if (this.leftLeg && this.rightLeg) {
                this.leftLeg.rotation.x = Math.sin(time * 2) * 0.2;
                this.rightLeg.rotation.x = Math.sin(time * 2 + Math.PI) * 0.2;
            }
            
            // Fai ruotare le particelle
            if (this.particles) {
                this.particles.rotation.y = time;
            }
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