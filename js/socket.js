class GameSocket {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.playerNickname = null;
        this.connected = false;
        
        // Callbacks
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onPlayerMoved = null;
        this.onTreasureCollected = null;
        this.onTreasureUpdate = null;
        this.onScoreUpdate = null;
        this.onMatchStart = null;
        this.onGameOver = null;
        this.onLobbyUpdate = null;
        this.onOnlinePlayersUpdate = null;
        
        // Connetti automaticamente
        this.connect();
    }
    
    connect() {
        try {
            // Ottieni l'URL del server dal localStorage o usa il default
            const serverUrl = localStorage.getItem('serverUrl') || window.location.origin;
            console.log(`Connecting to server: ${serverUrl}`);
            
            // Crea una nuova connessione Socket.IO
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000
            });
            
            // Gestisci gli eventi di connessione
            this.socket.on('connect', () => this.handleConnect());
            this.socket.on('disconnect', () => this.handleDisconnect());
            this.socket.on('connect_error', (error) => this.handleConnectError(error));
            
            // Gestisci gli eventi di gioco
            this.socket.on('playerJoined', (data) => this.handlePlayerJoined(data));
            this.socket.on('playerLeft', (id) => this.handlePlayerLeft(id));
            this.socket.on('playerMoved', (data) => this.handlePlayerMoved(data));
            this.socket.on('treasureCollected', (playerId, position, type) => this.handleTreasureCollected(playerId, position, type));
            this.socket.on('treasureUpdate', (data) => this.handleTreasureUpdate(data));
            this.socket.on('scoreUpdate', (playerId, score) => this.handleScoreUpdate(playerId, score));
            this.socket.on('matchStart', (data) => this.handleMatchStart(data));
            this.socket.on('gameOver', (data) => this.handleGameOver(data));
            this.socket.on('lobbyUpdate', (data) => this.handleLobbyUpdate(data));
            this.socket.on('onlinePlayersUpdate', (count) => this.handleOnlinePlayersUpdate(count));
            
            // Invia ping periodici per mantenere attiva la connessione
            setInterval(() => {
                if (this.connected) {
                    this.socket.emit('ping');
                }
            }, 30000); // Ogni 30 secondi
            
            console.log('Socket.IO initialized');
        } catch (error) {
            console.error('Error initializing Socket.IO:', error);
        }
    }
    
    handleConnect() {
        console.log('Connected to server with ID:', this.socket.id);
        this.playerId = this.socket.id;
        this.connected = true;
        
        // Genera un nickname casuale o usa quello salvato
        this.playerNickname = localStorage.getItem('playerNickname') || this.generateRandomNickname();
        localStorage.setItem('playerNickname', this.playerNickname);
        
        console.log(`Player nickname: ${this.playerNickname}`);
        
        // Richiedi il matchmaking
        this.requestMatchmaking();
    }
    
    handleDisconnect() {
        console.log('Disconnected from server');
        this.connected = false;
        
        // Mostra un messaggio di disconnessione
        const disconnectMessage = document.createElement('div');
        disconnectMessage.className = 'disconnect-message';
        disconnectMessage.innerHTML = `
            <h2>Disconnesso dal server</h2>
            <p>Tentativo di riconnessione in corso...</p>
        `;
        document.body.appendChild(disconnectMessage);
        
        // Rimuovi il messaggio dopo 5 secondi
        setTimeout(() => {
            if (disconnectMessage.parentNode) {
                disconnectMessage.parentNode.removeChild(disconnectMessage);
            }
        }, 5000);
    }
    
    handleConnectError(error) {
        console.error('Connection error:', error);
        
        // Mostra un messaggio di errore
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <h2>Errore di connessione</h2>
            <p>${error.message || 'Impossibile connettersi al server'}</p>
        `;
        document.body.appendChild(errorMessage);
        
        // Rimuovi il messaggio dopo 5 secondi
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 5000);
    }
    
    handlePlayerJoined(data) {
        console.log('Player joined:', data);
        if (this.onPlayerJoined) {
            this.onPlayerJoined(data);
        }
    }
    
    handlePlayerLeft(id) {
        console.log('Player left:', id);
        if (this.onPlayerLeft) {
            this.onPlayerLeft(id);
        }
    }
    
    handlePlayerMoved(data) {
        // Non logghiamo ogni movimento per evitare spam nella console
        if (this.onPlayerMoved) {
            this.onPlayerMoved(data);
        }
    }
    
    handleTreasureCollected(playerId, position, type) {
        console.log('Treasure collected:', playerId, position, type);
        if (this.onTreasureCollected) {
            this.onTreasureCollected(playerId, position, type);
        }
    }
    
    handleTreasureUpdate(data) {
        console.log('Treasure update:', data);
        if (this.onTreasureUpdate) {
            this.onTreasureUpdate(data);
        }
    }
    
    handleScoreUpdate(playerId, score) {
        console.log('Score update:', playerId, score);
        if (this.onScoreUpdate) {
            this.onScoreUpdate(playerId, score);
        }
    }
    
    handleMatchStart(data) {
        console.log('Match start:', data);
        if (this.onMatchStart) {
            this.onMatchStart(data);
        }
    }
    
    handleGameOver(data) {
        console.log('Game over:', data);
        if (this.onGameOver) {
            this.onGameOver(data);
        }
    }
    
    handleLobbyUpdate(data) {
        console.log('Lobby update:', data);
        if (this.onLobbyUpdate) {
            this.onLobbyUpdate(data);
        }
    }
    
    handleOnlinePlayersUpdate(count) {
        // Non logghiamo ogni aggiornamento per evitare spam nella console
        if (this.onOnlinePlayersUpdate) {
            this.onOnlinePlayersUpdate(count);
        }
    }
    
    emitPlayerMove(position, rotation) {
        if (!this.connected) return;
        
        this.socket.emit('playerMove', {
            position: position,
            rotation: rotation
        });
    }
    
    emitTreasureCollected(position, matchId, treasureType) {
        if (!this.connected) return;
        
        this.socket.emit('treasureCollected', {
            position: position,
            matchId: matchId,
            treasureType: treasureType
        });
    }
    
    requestMatchmaking() {
        if (!this.connected) return;
        
        console.log('Requesting matchmaking with nickname:', this.playerNickname);
        
        this.socket.emit('requestMatchmaking', {
            nickname: this.playerNickname
        });
    }
    
    generateRandomNickname() {
        const adjectives = ['Super', 'Mega', 'Ultra', 'Hyper', 'Extreme', 'Epic', 'Awesome', 'Amazing', 'Fantastic', 'Incredible'];
        const nouns = ['Player', 'Gamer', 'Hero', 'Champion', 'Warrior', 'Knight', 'Ninja', 'Samurai', 'Wizard', 'Mage'];
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        return `${adjective}${noun}${Math.floor(Math.random() * 100)}`;
    }
} 