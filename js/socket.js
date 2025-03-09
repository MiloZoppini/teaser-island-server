class GameSocket {
    constructor() {
        this.socket = null;
        this.playerId = this.generatePlayerId(); // Genera un ID univoco per il giocatore
        this.matchId = null; // ID della partita corrente
        this.onGameState = null;
        this.onPlayerJoined = null;
        this.onPlayerMoved = null;
        this.onPlayerLeft = null;
        this.onTreasureCollected = null;
        this.onGameOver = null;
        this.onLobbyUpdate = null; // Nuovo evento per aggiornamenti della lobby
        this.onMatchFound = null; // Nuovo evento per quando viene trovata una partita
        this.connected = false;
    }

    /**
     * Genera un ID univoco per il giocatore
     */
    generatePlayerId() {
        return 'player-' + Math.random().toString(36).substr(2, 9);
    }

    connect() {
        console.log('Attempting to connect to server...');
        
        // Usa l'URL di produzione su Render.com o localhost per lo sviluppo locale
        const serverUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : window.location.origin;
            
        this.socket = io(serverUrl);
        
        // Gestione degli eventi di connessione
        this.socket.on('connect', () => {
            console.log('Connected to server with ID:', this.socket.id);
            this.connected = true;
            
            // Richiedi di entrare nella lobby
            this.requestMatchmaking();
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.connected = false;
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.connected = false;
        });
        
        this.setupListeners();
    }

    setupListeners() {
        if (!this.socket) {
            console.error('Socket not initialized. Call connect() first.');
            return;
        }
        
        console.log('Setting up socket listeners...');
        
        this.socket.on('gameState', (data) => {
            console.log('Received game state:', data);
            this.playerId = data.playerId;
            if (this.onGameState) this.onGameState(data);
        });

        this.socket.on('playerJoined', (data) => {
            console.log('Player joined:', data.id, data.position);
            if (this.onPlayerJoined) this.onPlayerJoined(data.id, data.position);
        });

        this.socket.on('playerMoved', (data) => {
            // Non logghiamo ogni movimento per evitare spam nella console
            if (this.onPlayerMoved) this.onPlayerMoved(data.id, data.position, data.rotation);
        });

        this.socket.on('playerLeft', (id) => {
            console.log('Player left:', id);
            if (this.onPlayerLeft) this.onPlayerLeft(id);
        });

        this.socket.on('treasureCollected', (id, position) => {
            console.log('Treasure collected by player:', id);
            if (this.onTreasureCollected) this.onTreasureCollected(id, position);
        });
        
        this.socket.on('treasureUpdate', (data) => {
            console.log('Treasure update received:', data);
            if (this.onTreasureCollected) this.onTreasureCollected(data.playerId, data.position, data.playerScore, data.treasureType);
        });
        
        this.socket.on('gameOver', (winnerId) => {
            console.log('Game over. Winner:', winnerId);
            if (this.onGameOver) this.onGameOver(winnerId);
        });
        
        // Nuovi eventi per il sistema di lobby e matchmaking
        this.socket.on('lobbyUpdate', (data) => {
            console.log('Lobby update:', data);
            if (this.onLobbyUpdate) this.onLobbyUpdate(data.playersInLobby, data.maxPlayers);
        });
        
        this.socket.on('matchFound', (data) => {
            console.log('Match found:', data);
            this.matchId = data.matchId;
            if (this.onMatchFound) this.onMatchFound(data.matchId, data.players, data.position);
        });
    }

    /**
     * Richiedi di entrare nella lobby per il matchmaking
     */
    requestMatchmaking() {
        if (!this.socket || !this.connected) {
            console.warn('Cannot request matchmaking: not connected to server');
            return;
        }
        
        console.log('Requesting matchmaking with player ID:', this.playerId);
        this.socket.emit('requestMatchmaking', {
            playerId: this.playerId
        });
    }

    emitPlayerMove(position, rotation) {
        if (!this.socket || !this.connected) {
            console.warn('Cannot emit playerMove: not connected to server');
            return;
        }
        this.socket.emit('playerMove', { 
            position, 
            rotation,
            id: this.playerId,
            matchId: this.matchId
        });
    }

    emitTreasureCollected(playerId = null, position = null, treasureType = 'normal') {
        if (!this.socket || !this.connected) {
            console.warn('Cannot emit treasureCollected: not connected to server');
            return;
        }
        
        // Log più evidente
        console.log('=== EMITTING TREASURE COLLECTED EVENT ===');
        
        try {
            // Invia l'evento al server con un timestamp per evitare duplicati
            this.socket.emit('treasureCollected', {
                timestamp: Date.now(),
                playerId: playerId || this.playerId,
                position: position,
                matchId: this.matchId,
                treasureType: treasureType
            });
            
            // Aggiungiamo un log per debug
            console.log('Evento treasureCollected inviato al server con ID:', this.playerId);
            if (position) {
                console.log('Posizione del tesoro inviata:', position);
            }
            console.log('Tipo di tesoro inviato:', treasureType);
            
            // Verifica che l'evento sia stato inviato correttamente
            setTimeout(() => {
                if (this.socket.connected) {
                    console.log('Socket ancora connesso dopo l\'invio dell\'evento treasureCollected');
                } else {
                    console.warn('Socket disconnesso dopo l\'invio dell\'evento treasureCollected');
                }
            }, 100);
        } catch (error) {
            console.error('Errore nell\'invio dell\'evento treasureCollected:', error);
        }
    }

    isCurrentPlayer(id) {
        return this.playerId === id;
    }
} 