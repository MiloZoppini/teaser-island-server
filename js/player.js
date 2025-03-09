class Player {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, isLocalPlayer = false, playerName = 'Sconosciuto') {
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
        
        // Usa il nome fornito
        this.playerName = playerName;
        
        console.log(`Creazione giocatore ${this.playerName} in posizione:`, position, `isLocalPlayer: ${isLocalPlayer}`);
        
        // Crea un gruppo temporaneo fino al caricamento del modello
        this.model = new THREE.Group();
        this.scene.add(this.model);
        this.setPosition(position);

        // Crea il modello del personaggio in stile Minecraft
        this.createMinecraftAvatar();

        if (isLocalPlayer) {
            // Rendi invisibili le parti del modello del giocatore locale
            this.model.traverse(child => {
                if (child.isMesh) {
                    child.visible = false;
                }
            });
            
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
        // Nomi italiani per i giocatori
        const firstNames = [
            "Marco", "Sofia", "Luca", "Giulia", "Alessandro", "Martina", "Davide", "Chiara",
            "Francesco", "Anna", "Matteo", "Sara", "Lorenzo", "Elena", "Simone", "Valentina",
            "Andrea", "Laura", "Giovanni", "Francesca", "Riccardo", "Elisa", "Tommaso", "Giorgia"
        ];
        
        const suffixes = [
            "Pro", "Gamer", "Master", "Player", "Champion", "Hero", "Warrior", "King",
            "Queen", "Legend", "Boss", "Ninja", "Pirata", "Cacciatore", "Esploratore", "Avventuriero"
        ];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${firstName}${suffix}`;
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
        
        // Se è il giocatore locale, non creiamo il modello visibile
        // ma solo un contenitore per la camera
        if (this.isLocalPlayer) {
            // Non aggiungiamo parti visibili al modello
            // Aggiungiamo solo un collider invisibile
            this.addCollider();
            
            // Configura la camera
            this.setupCamera();
            this.setupControls();
            this.createRunningIndicator();
            
            // Aggiungi il modello alla scena
            this.scene.add(this.model);
            
            // Imposta la posizione
            this.setPosition(this.initialPosition);
            
            this.loaded = true;
            return;
        }
        
        // Per i giocatori remoti, creiamo il modello completo
        
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
        
        // Aggiungi un collider visibile per debug
        this.addCollider();
        
        // Aggiungi il tag con il nome del giocatore
        this.addPlayerNameTag();
        
        this.loaded = true;
    }
    
    addCollider() {
        // Crea un collider per le collisioni
        const colliderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
        const colliderMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: this.isLocalPlayer ? 0 : 0.2, // Invisibile per il giocatore locale
            wireframe: true
        });
        
        this.collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
        this.collider.position.y = 0.9; // Posiziona il collider al centro del corpo
        this.model.add(this.collider);
        
        // Aggiungi un hitbox per le collisioni con i tesori
        // Questo è un po' più grande del collider principale
        const hitboxGeometry = new THREE.SphereGeometry(1, 8, 8);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: this.isLocalPlayer ? 0 : 0.1, // Quasi invisibile per il giocatore locale
            wireframe: true
        });
        
        this.hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.hitbox.position.y = 1; // Posiziona l'hitbox leggermente più in alto
        this.model.add(this.hitbox);
        
        console.log(`Collider aggiunto al giocatore ${this.isLocalPlayer ? 'locale' : 'remoto'}`);
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
        
        // Posiziona la camera all'altezza degli occhi del giocatore
        // In Minecraft, l'altezza degli occhi è a 1.62 blocchi dal suolo
        this.camera.position.set(0, 1.62, 0);
        
        // Aggiungi la camera al modello del giocatore
        this.model.add(this.camera);
        
        // Inizializza la rotazione verticale a zero
        this.verticalAngle = 0;
        
        // Salva la camera in window.game per debug
        if (window.game) {
            window.game.camera = this.camera;
        }
        
        console.log('Camera setup completato per il giocatore locale');
        
        // Inizializza la variabile per il blocco del puntatore
        this.pointerLocked = false;
        
        // Aggiungiamo un listener per l'evento di resize della finestra
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
        
        // Aggiungiamo un pulsante per bloccare/sbloccare il puntatore
        this.createPointerLockButton();
        
        // Aggiungiamo un listener per il tasto Escape per sbloccare il puntatore
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === document.body;
            if (this.pointerLockButton) {
                this.pointerLockButton.textContent = this.pointerLocked ? 'Sblocca Mouse (L)' : 'Blocca Mouse (L)';
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
        if (!this.isLocalPlayer) return;
        
        // Applica la rotazione solo se il puntatore è bloccato
        if (document.pointerLockElement === document.body) {
            // Sensibilità del mouse (più basso = più sensibile)
            const sensitivity = 0.002;
            
            // Calcola la rotazione orizzontale (sinistra/destra)
            this.model.rotation.y -= event.movementX * sensitivity;
            
            // Calcola la rotazione verticale (su/giù)
            this.verticalAngle -= event.movementY * sensitivity;
            
            // Limita la rotazione verticale per evitare che la camera si capovolga
            // In Minecraft, il limite è di circa 90 gradi in entrambe le direzioni
            const maxVerticalAngle = Math.PI / 2 * 0.99; // Leggermente meno di 90 gradi
            this.verticalAngle = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, this.verticalAngle));
            
            // Applica la rotazione verticale alla camera
            this.camera.rotation.x = this.verticalAngle;
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
        
        // Aggiorna la fisica e il movimento
        this.updatePhysics();
        this.updateMovement();
        
        // Aggiorna la camera per il giocatore locale
        if (this.isLocalPlayer) {
            this.updateCamera();
            
            // Verifica collisione con il tesoro
            if (window.game && window.game.treasures && window.game.treasures.length > 0) {
                const playerPosition = this.getPosition();
                
                // Aggiungiamo un controllo per evitare collisioni multiple in rapida successione
                const now = Date.now();
                const lastCollision = this.lastTreasureCollision || 0;
                
                if (now - lastCollision > 1000) { // Aspetta almeno 1 secondo tra le collisioni
                    // Controlla la collisione con tutti i tesori
                    for (const treasure of window.game.treasures) {
                        if (treasure && treasure.checkCollision(playerPosition, 5)) {
                            console.log('TESORO RACCOLTO dal giocatore locale! Tipo:', treasure.type);
                            
                            // Invia l'evento al server con il tipo di tesoro
                            window.game.gameSocket.emitTreasureCollected(null, null, treasure.type);
                            
                            // Aggiorniamo il timestamp dell'ultima collisione
                            this.lastTreasureCollision = now;
                            
                            // Aggiungiamo un feedback visivo più evidente
                            if (window.game.renderer) {
                                // Flash colorato in base al tipo di tesoro
                                let flashColor;
                                switch(treasure.type) {
                                    case 'bonus': flashColor = 0x00aaff; break; // Blu per bonus
                                    case 'malus': flashColor = 0xff3333; break; // Rosso per malus
                                    default: flashColor = 0xffff00; // Giallo per normale
                                }
                                
                                const originalClearColor = window.game.renderer.getClearColor().getHex();
                                window.game.renderer.setClearColor(flashColor, 1);
                                
                                // Ripristina il colore originale dopo un breve periodo
                                setTimeout(() => {
                                    window.game.renderer.setClearColor(originalClearColor, 1);
                                }, 300);
                            }
                            
                            break; // Esci dal ciclo dopo aver trovato una collisione
                        }
                    }
                }
            }
            
            // Invia la posizione e la rotazione al server
            if (window.game && window.game.gameSocket) {
                window.game.gameSocket.emitPlayerMove(this.getPosition(), this.getRotation());
            }
        } else {
            // Anima i giocatori remoti
            this.animateRemotePlayer();
        }
        
        // Aggiorna le particelle
        if (this.particles) {
            this.particles.rotation.y += 0.01;
        }
        
        // Aggiorna la luce del giocatore
        if (this.playerLight) {
            this.playerLight.position.copy(this.model.position);
            this.playerLight.position.y += 2;
        }
        
        // Aggiorna la posizione del tag con il nome
        if (this.nameTag) {
            // Assicurati che il tag del nome sia sempre rivolto verso la camera
            if (window.game && window.game.camera) {
                this.nameTag.lookAt(window.game.camera.position);
            }
        }
    }

    updateMovement() {
        if (!this.isLocalPlayer) return;
        
        // Calcola la velocità di movimento in base allo stato di corsa
        const moveSpeed = this.isRunning ? this.runSpeed : this.moveSpeed;
        
        // Resetta la velocità orizzontale
        let moveX = 0;
        let moveZ = 0;
        
        // Calcola la direzione di movimento in base ai tasti premuti
        // In Minecraft, i movimenti sono relativi alla direzione della camera
        if (this.keys.forward) {
            moveZ -= 1;
        }
        
        if (this.keys.backward) {
            moveZ += 1;
        }
        
        if (this.keys.left) {
            moveX -= 1;
        }
        
        if (this.keys.right) {
            moveX += 1;
        }
        
        // Normalizza il vettore di movimento se ci si muove in diagonale
        // per evitare velocità maggiori in diagonale
        if (moveX !== 0 && moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;
        }
        
        // In Minecraft, il movimento è sempre relativo alla direzione della camera
        // Usiamo solo la rotazione orizzontale (yaw) per il movimento
        const yaw = this.model.rotation.y;
        
        // Applica la rotazione orizzontale al vettore di movimento
        this.velocity.x = (moveZ * Math.sin(yaw) + moveX * Math.sin(yaw + Math.PI/2)) * moveSpeed;
        this.velocity.z = (moveZ * Math.cos(yaw) + moveX * Math.cos(yaw + Math.PI/2)) * moveSpeed;
        
        // Applica un fattore di rallentamento quando si va all'indietro
        if (this.keys.backward && !this.keys.forward) {
            this.velocity.x *= 0.7;
            this.velocity.z *= 0.7;
        }
        
        // Applica un fattore di rallentamento quando ci si muove lateralmente
        if ((this.keys.left || this.keys.right) && !this.keys.forward && !this.keys.backward) {
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
        }
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
        if (!this.isLocalPlayer || !this.camera) return;
        
        // Calcola l'intensità del movimento basata sulla velocità
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        const isMoving = speed > 0.01;
        
        // Effetto di oscillazione durante la camminata (stile Minecraft)
        if (isMoving) {
            const time = Date.now() * 0.001;
            const bobFrequency = this.isRunning ? 10 : 5; // Frequenza più alta durante la corsa
            const bobAmplitude = this.isRunning ? 0.025 : 0.015; // Ampiezza maggiore durante la corsa
            
            // Oscillazione verticale (su e giù)
            const verticalBob = Math.sin(time * bobFrequency) * bobAmplitude;
            this.camera.position.y = 1.62 + verticalBob;
            
            // In Minecraft non c'è oscillazione laterale o inclinazione della testa
            this.camera.position.x = 0;
            this.camera.rotation.z = 0;
        } else {
            // Ripristina la posizione della camera quando il giocatore è fermo
            this.camera.position.y = 1.62;
            this.camera.position.x = 0;
            this.camera.rotation.z = 0;
        }
        
        // Mantieni la rotazione verticale impostata dal movimento del mouse
        this.camera.rotation.x = this.verticalAngle;
    }

    setPosition(position) {
        if (!position) return;
        
        // Verifica che la posizione sia valida
        if (typeof position !== 'object' || position === null) {
            console.error('Posizione non valida:', position);
            return;
        }
        
        // Aggiorna solo le proprietà definite
        if (position.x !== undefined) this.model.position.x = position.x;
        if (position.y !== undefined) this.model.position.y = position.y;
        if (position.z !== undefined) this.model.position.z = position.z;
        
        // Aggiorna la camera se è un giocatore locale
        if (this.isLocalPlayer && this.camera) {
            this.updateCamera();
        }
    }

    setRotation(rotation) {
        if (!rotation) return;
        
        // Verifica che la rotazione sia valida
        if (typeof rotation !== 'object' || rotation === null) {
            console.error('Rotazione non valida:', rotation);
            return;
        }
        
        // Aggiorna solo le proprietà definite
        if (rotation.x !== undefined) this.model.rotation.x = rotation.x;
        if (rotation.y !== undefined) this.model.rotation.y = rotation.y;
        if (rotation.z !== undefined) this.model.rotation.z = rotation.z;
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
        // Animazione avanzata per i giocatori remoti
        const time = Date.now() * 0.001;
        const isMoving = this.velocity && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01);
        const animationSpeed = isMoving ? (this.isRunning ? 4 : 2) : 0.5; // Velocità di animazione basata sul movimento
        
        // Muovi le braccia avanti e indietro con ampiezza basata sul movimento
        if (this.leftArm && this.rightArm) {
            const armSwing = isMoving ? 0.4 : 0.1; // Ampiezza maggiore quando si muove
            this.leftArm.rotation.x = Math.sin(time * animationSpeed) * armSwing;
            this.rightArm.rotation.x = Math.sin(time * animationSpeed + Math.PI) * armSwing;
            
            // Aggiungi un leggero movimento laterale alle braccia
            this.leftArm.rotation.z = Math.cos(time * animationSpeed * 0.5) * 0.05;
            this.rightArm.rotation.z = -Math.cos(time * animationSpeed * 0.5) * 0.05;
        }
        
        // Muovi le gambe avanti e indietro con ampiezza basata sul movimento
        if (this.leftLeg && this.rightLeg) {
            const legSwing = isMoving ? 0.5 : 0.1; // Ampiezza maggiore quando si muove
            this.leftLeg.rotation.x = Math.sin(time * animationSpeed) * legSwing;
            this.rightLeg.rotation.x = Math.sin(time * animationSpeed + Math.PI) * legSwing;
            
            // Aggiungi un leggero movimento laterale alle gambe
            this.leftLeg.rotation.z = Math.cos(time * animationSpeed * 0.5) * 0.03;
            this.rightLeg.rotation.z = -Math.cos(time * animationSpeed * 0.5) * 0.03;
        }
        
        // Fai ruotare le particelle
        if (this.particles) {
            this.particles.rotation.y = time;
        }
        
        // Fai oscillare leggermente il personaggio in base al movimento
        if (this.model) {
            // Oscillazione verticale più pronunciata durante il movimento
            const bounceHeight = isMoving ? 0.03 : 0.01;
            const bounceSpeed = isMoving ? 2 : 1;
            this.model.position.y += Math.sin(time * animationSpeed * bounceSpeed) * bounceHeight;
            
            // Leggera inclinazione durante il movimento
            if (isMoving) {
                const leanAmount = 0.02;
                this.model.rotation.z = Math.sin(time * animationSpeed) * leanAmount;
            }
        }
    }

    createPointerLockButton() {
        // Crea un pulsante per bloccare/sbloccare il puntatore
        this.pointerLockButton = document.createElement('button');
        this.pointerLockButton.className = 'pointer-lock-button';
        this.pointerLockButton.textContent = 'Blocca Mouse (L)';
        document.body.appendChild(this.pointerLockButton);
        
        // Aggiungi l'evento click
        this.pointerLockButton.addEventListener('click', () => {
            this.togglePointerLock();
        });
        
        // Aggiungi anche il tasto L per bloccare/sbloccare il puntatore
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyL') {
                this.togglePointerLock();
            }
        });
    }
    
    togglePointerLock() {
        if (document.pointerLockElement === document.body) {
            document.exitPointerLock();
            this.pointerLocked = false;
        } else {
            document.body.requestPointerLock();
            this.pointerLocked = true;
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