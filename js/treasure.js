class Treasure {
    constructor(scene, position, type = 'normal') {
        this.scene = scene;
        this.position = position;
        this.type = type; // 'normal', 'blue', 'red'
        this.baseY = position.y;
        this.collected = false;
        
        // Crea il modello del tesoro
        this.createModel();
        
        // Aggiungi una luce al tesoro
        this.addLight();
    }
    
    createModel() {
        // Geometria base per tutti i tesori
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        
        // Colore e proprietà in base al tipo di tesoro
        let color, emissiveIntensity, scale;
        
        switch(this.type) {
            case 'blue':
                color = 0x0088ff; // Blu brillante
                emissiveIntensity = 0.8;
                scale = 1.2; // Leggermente più grande
                break;
            case 'red':
                color = 0xff3333; // Rosso
                emissiveIntensity = 0.6;
                scale = 0.8; // Leggermente più piccolo
                break;
            case 'normal':
            default:
                color = 0xffcc00; // Oro
                emissiveIntensity = 0.5;
                scale = 1.0;
                break;
        }
        
        // Materiale con effetto luminoso
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.8,
            roughness: 0.2,
            emissive: color,
            emissiveIntensity: emissiveIntensity
        });
        
        // Crea la mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.scale.set(scale, scale, scale);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Aggiungi la mesh alla scena
        this.scene.add(this.mesh);
        
        // Aggiungi un effetto di particelle attorno al tesoro
        this.addParticles();
    }
    
    addLight() {
        // Colore della luce in base al tipo di tesoro
        let color;
        switch(this.type) {
            case 'blue': color = 0x0088ff; break;
            case 'red': color = 0xff3333; break;
            case 'normal': default: color = 0xffcc00; break;
        }
        
        // Crea una luce puntuale
        this.light = new THREE.PointLight(color, 1, 10);
        this.light.position.copy(this.position);
        this.light.position.y += 0.5; // Posiziona la luce leggermente sopra il tesoro
        
        // Aggiungi la luce alla scena
        this.scene.add(this.light);
    }
    
    addParticles() {
        // Colore delle particelle in base al tipo di tesoro
        let color;
        switch(this.type) {
            case 'blue': color = 0x0088ff; break;
            case 'red': color = 0xff3333; break;
            case 'normal': default: color = 0xffcc00; break;
        }
        
        // Crea un sistema di particelle
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Genera posizioni casuali attorno al tesoro
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const radius = 1.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particlePositions[i3] = this.position.x + radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i3 + 1] = this.position.y + radius * Math.sin(phi) * Math.sin(theta);
            particlePositions[i3 + 2] = this.position.z + radius * Math.cos(phi);
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        // Materiale per le particelle
        const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // Crea il sistema di particelle
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }
    
    update() {
        if (this.collected) return;
        
        // Fai fluttuare il tesoro
        const time = Date.now() * 0.001;
        if (this.mesh) {
            this.mesh.position.y = this.baseY + Math.sin(time * 2) * 0.2;
            this.mesh.rotation.y += 0.01;
        }
        
        // Aggiorna la posizione della luce
        if (this.light) {
            this.light.position.y = this.baseY + Math.sin(time * 2) * 0.2 + 0.5;
            this.light.intensity = 0.5 + Math.sin(time * 3) * 0.2;
        }
        
        // Aggiorna le particelle
        if (this.particles) {
            this.particles.rotation.y += 0.005;
        }
    }
    
    checkCollision(playerPosition, radius = 2) {
        if (this.collected) return false;
        
        // Calcola la distanza tra il giocatore e il tesoro
        const distance = Math.sqrt(
            Math.pow(playerPosition.x - this.position.x, 2) +
            Math.pow(playerPosition.z - this.position.z, 2)
        );
        
        // Verifica se il giocatore è abbastanza vicino al tesoro
        return distance < radius;
    }
    
    collect() {
        if (this.collected) return;
        
        this.collected = true;
        
        // Rimuovi il tesoro dalla scena
        this.dispose();
        
        // Restituisci il valore del tesoro in base al tipo
        switch(this.type) {
            case 'blue': return 2; // Tesoro blu: +2 punti
            case 'red': return -1; // Tesoro rosso: -1 punto
            case 'normal': default: return 1; // Tesoro normale: +1 punto
        }
    }
    
    getPosition() {
        return this.position;
    }
    
    getType() {
        return this.type;
    }
    
    dispose() {
        // Rimuovi la mesh dalla scena
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
        
        // Rimuovi la luce dalla scena
        if (this.light) {
            this.scene.remove(this.light);
            this.light = null;
        }
        
        // Rimuovi le particelle dalla scena
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.particles = null;
        }
    }
} 