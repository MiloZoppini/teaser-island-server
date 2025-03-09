const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*", // Consenti connessioni da qualsiasi origine
        methods: ["GET", "POST"]
    },
    pingTimeout: 120000, // Aumenta ulteriormente il timeout del ping a 120 secondi
    pingInterval: 20000, // Riduce ulteriormente l'intervallo di ping a 20 secondi
    transports: ['websocket', 'polling'], // Supporta sia WebSocket che polling
    allowEIO3: true, // Supporta anche la versione 3 del protocollo Engine.IO
    maxHttpBufferSize: 1e8 // Aumenta la dimensione massima del buffer a 100 MB
});
const path = require('path');

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// API endpoint per ottenere il numero di giocatori online
app.get('/api/online-players', (req, res) => {
    // Calcola il numero totale di giocatori online (lobby + partite attive)
    let totalPlayers = gameState.lobby.players.size;
    
    // Aggiungi i giocatori nelle partite attive
    gameState.matches.forEach(match => {
        totalPlayers += match.players.size;
    });
    
    res.json({ count: totalPlayers });
});

// Game state
const gameState = {
    players: new Map(),
    treasure: {
        position: { x: 0, y: 0, z: 0 },
        collected: 0
    },
    matches: new Map(), // Mappa delle partite attive
    lobby: {
        players: new Map(), // Giocatori in attesa nella lobby
        maxPlayers: 4, // Numero massimo di giocatori per partita
        minPlayers: 2 // Numero minimo di giocatori per iniziare una partita
    },
    maxMatches: 5, // Numero massimo di partite simultanee
    inactivityTimeout: 3 * 60 * 1000, // 3 minuti in millisecondi
    matchTimeout: 5 * 60 * 1000, // 5 minuti in millisecondi
    currentMatchId: 0, // Contatore per generare ID partita univoci
};

// Generate random position on island (safe from water)
function getRandomPosition() {
    // Parametri per generare posizioni sicure sull'isola
    const minRadius = 20; // Minima distanza dal centro
    const maxRadius = 80; // Massima distanza dal centro (per evitare l'acqua)
    const angle = Math.random() * Math.PI * 2; // Angolo casuale
    const radius = minRadius + Math.random() * (maxRadius - minRadius); // Raggio casuale tra min e max
    
    // Calcola la posizione in coordinate cartesiane
    const position = {
        x: Math.cos(angle) * radius,
        y: 1, // Altezza fissa sopra il terreno
        z: Math.sin(angle) * radius
    };
    
    // Aggiungi una piccola variazione casuale per evitare che i giocatori appaiano esattamente negli stessi punti
    position.x += (Math.random() - 0.5) * 5;
    position.z += (Math.random() - 0.5) * 5;
    
    console.log(`Generated safe position on island: (${position.x.toFixed(2)}, ${position.z.toFixed(2)})`);
    
    return position;
}

// Generate position far from a given point or points (safe from water)
function getPositionFarFrom(positions, minDistance = 30) {
    // Parametri per generare posizioni sicure sull'isola
    const minRadius = 20; // Minima distanza dal centro
    const maxRadius = 80; // Massima distanza dal centro (per evitare l'acqua)
    
    // Converti positions in un array se non lo è già
    const positionsArray = Array.isArray(positions) ? positions : [positions];
    
    let newPosition;
    let minDistanceFound = 0;
    let attempts = 0;
    const maxAttempts = 20;
    
    // Genera posizioni finché non ne troviamo una abbastanza lontana o dopo maxAttempts tentativi
    do {
        // Genera un angolo casuale
        const angle = Math.random() * Math.PI * 2;
        
        // Genera un raggio casuale tra min e max
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        
        // Calcola la posizione in coordinate cartesiane
        newPosition = {
            x: Math.cos(angle) * radius,
            y: 1, // Altezza fissa sopra il terreno
            z: Math.sin(angle) * radius
        };
        
        // Aggiungi una piccola variazione casuale
        newPosition.x += (Math.random() - 0.5) * 5;
        newPosition.z += (Math.random() - 0.5) * 5;
        
        // Calcola la distanza minima da tutte le posizioni
        minDistanceFound = Number.MAX_VALUE;
        
        for (const pos of positionsArray) {
            if (!pos || typeof pos !== 'object') continue;
            
            const distance = Math.sqrt(
                Math.pow(newPosition.x - pos.x, 2) + 
                Math.pow(newPosition.z - pos.z, 2)
            );
            
            if (distance < minDistanceFound) {
                minDistanceFound = distance;
            }
        }
        
        attempts++;
    } while (minDistanceFound < minDistance && attempts < maxAttempts);
    
    console.log(`Generated new safe position at distance ${minDistanceFound.toFixed(2)} after ${attempts} attempts`);
    
    // Log solo la prima posizione per brevità se ci sono più posizioni
    if (positionsArray.length > 0 && positionsArray[0]) {
        const firstPos = positionsArray[0];
        console.log(`First original position: (${firstPos.x.toFixed(2)}, ${firstPos.z.toFixed(2)}), New position: (${newPosition.x.toFixed(2)}, ${newPosition.z.toFixed(2)})`);
    }
    
    return newPosition;
}

/**
 * Genera un nome italiano casuale
 * @returns {string} Nome casuale
 */
function getRandomName() {
    const firstNames = [
        "Marco", "Sofia", "Luca", "Giulia", "Alessandro", "Martina", "Davide", "Chiara",
        "Francesco", "Anna", "Matteo", "Sara", "Lorenzo", "Elena", "Simone", "Valentina",
        "Andrea", "Laura", "Giovanni", "Francesca", "Riccardo", "Elisa", "Tommaso", "Giorgia"
    ];
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    return randomFirstName;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Inizializza il timestamp dell'ultima attività
    socket.lastActivity = Date.now();
    
    // Genera un nome casuale
    const nickname = getRandomName();
    
    // Aggiungi il giocatore al game state
    gameState.players.set(socket.id, {
        id: socket.id,
        position: getRandomPosition(),
        rotation: { x: 0, y: 0, z: 0 },
        score: 0,
        nickname: nickname
    });
    
    // Invia l'evento playerJoined a tutti i client
    io.emit('playerJoined', {
        id: socket.id, 
        position: gameState.players.get(socket.id).position, 
        nickname: nickname
    });
    
    // Aggiungi il giocatore alla lobby per il matchmaking
    handleMatchmaking(socket, socket.id);

    socket.on('playerMove', (data) => {
        // Aggiorna il timestamp dell'ultima attività
        socket.lastActivity = Date.now();
        
        const playerId = data.id || socket.id;
        const matchId = socket.matchId;
        
        // Se il giocatore è in una partita, invia l'aggiornamento solo ai giocatori di quella partita
        if (matchId && gameState.matches.has(matchId)) {
            const match = gameState.matches.get(matchId);
            const player = match.players.get(playerId);
            
            if (player) {
                // Aggiorna la posizione del giocatore
                player.position = data.position;
                player.rotation = data.rotation;
                
                // Invia l'aggiornamento agli altri giocatori nella stessa partita
                socket.to(matchId).emit('playerMoved', {
                    id: playerId,
                    position: data.position,
                    rotation: data.rotation
                });
            }
        } else {
            // Fallback al vecchio sistema
            const player = gameState.players.get(socket.id);
            if (player) {
                Object.assign(player.position, data.position);
                Object.assign(player.rotation, data.rotation);
                socket.broadcast.emit('playerMoved', {
                    id: socket.id,
                    position: player.position,
                    rotation: player.rotation
                });
            }
        }
    });

    socket.on('treasureCollected', (data) => {
        try {
            // Aggiorna il timestamp dell'ultima attività
            socket.lastActivity = Date.now();
            
            // Aggiungi l'ID della partita ai dati se non è presente
            if (!data.matchId && socket.matchId) {
                data.matchId = socket.matchId;
            }
            
            // Utilizza la funzione comune per gestire la raccolta del tesoro
            handleTreasureCollection(data);
        } catch (error) {
            console.error('Error in treasureCollected event:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        // Rimuovi il giocatore dalla lobby se presente
        if (gameState.lobby.players.has(socket.id)) {
            gameState.lobby.players.delete(socket.id);
            broadcastLobbyUpdate();
        }
        
        // Rimuovi il giocatore dalle partite attive
        gameState.matches.forEach((match, matchId) => {
            if (match.players.has(socket.id)) {
                match.players.delete(socket.id);
                
                // Informa gli altri giocatori nella partita
                socket.to(matchId).emit('playerLeft', socket.id);
                
                // Se non ci sono più giocatori, rimuovi la partita
                if (match.players.size === 0) {
                    gameState.matches.delete(matchId);
                    console.log(`Partita ${matchId} terminata: nessun giocatore rimasto`);
                }
            }
        });
        
        // Fallback al vecchio sistema
        gameState.players.delete(socket.id);
        io.emit('playerLeft', socket.id);
        
        // Aggiorna il contatore dei giocatori online
        broadcastOnlinePlayersCount();
    });
    
    // Ping dal client per mantenere attiva la connessione
    socket.on('ping', () => {
        // Aggiorna il timestamp dell'ultima attività
        socket.lastActivity = Date.now();
    });

    // Gestione degli eventi del socket
    socket.on('requestMatchmaking', (data) => {
        const playerId = data.playerId || socket.id;
        
        // Usa il nickname fornito dal client, o quello memorizzato nel gameState, o quello nel socket
        const nickname = data.nickname || 
                        gameState.players.get(socket.id)?.nickname || 
                        socket.nickname || 
                        getRandomName();
        
        // Aggiorna il timestamp dell'ultima attività
        socket.lastActivity = Date.now();
        
        // Salva il nickname nel socket per riferimento futuro
        socket.nickname = nickname;
        
        // Aggiorna il nickname nel gameState se il giocatore esiste
        if (gameState.players.has(socket.id)) {
            gameState.players.get(socket.id).nickname = nickname;
        }
        
        console.log(`Richiesta matchmaking da ${nickname} (${playerId})`);
        handleMatchmaking(socket, playerId);
    });
});

/**
 * Gestisce il matchmaking per un giocatore
 * @param {Socket} socket - Socket del giocatore
 * @param {string} playerId - ID del giocatore
 */
function handleMatchmaking(socket, playerId) {
    // Ottieni il giocatore dal gameState
    const player = gameState.players.get(playerId);
    
    if (!player) {
        console.error(`Giocatore ${playerId} non trovato nel gameState`);
        return;
    }
    
    const nickname = player.nickname;
    
    console.log(`Gestione matchmaking per ${nickname} (${playerId})`);
    
    // Aggiungi il giocatore alla lobby
    gameState.lobby.players.set(playerId, {
        socket: socket,
        joinTime: Date.now(),
        nickname: nickname
    });
    
    // Fai entrare il socket nella room della lobby
    socket.join('lobby');
    
    console.log(`Giocatore ${nickname} (${playerId}) aggiunto alla lobby. Giocatori in lobby: ${gameState.lobby.players.size}`);
    
    // Invia un aggiornamento della lobby a tutti i giocatori in attesa
    broadcastLobbyUpdate();
    
    // Se ci sono abbastanza giocatori, avvia una partita
    if (gameState.lobby.players.size >= gameState.lobby.minPlayers) {
        console.log(`Avvio partita con ${gameState.lobby.players.size} giocatori`);
        startMatch();
    } else {
        console.log(`In attesa di altri giocatori. Attualmente: ${gameState.lobby.players.size}/${gameState.lobby.minPlayers}`);
    }
}

/**
 * Invia un aggiornamento dello stato della lobby a tutti i giocatori in attesa
 */
function broadcastLobbyUpdate() {
    // Prepara i dati della lobby
    const lobbyData = {
        playersInLobby: gameState.lobby.players.size,
        maxPlayers: gameState.lobby.maxPlayers,
        minPlayers: gameState.lobby.minPlayers,
        players: Array.from(gameState.lobby.players.entries()).map(([id, data]) => ({
            id,
            nickname: data.nickname || `player-${id.slice(0, 5)}`
        }))
    };
    
    // Invia l'aggiornamento a tutti i giocatori nella lobby
    io.to('lobby').emit('lobbyUpdate', lobbyData);
    
    console.log(`Lobby update broadcast: ${lobbyData.playersInLobby}/${lobbyData.maxPlayers} giocatori in attesa`);
}

/**
 * Simula il movimento dei bot in una partita
 * @param {string} matchId - ID della partita
 */
function simulateBotMovement(matchId) {
    const match = gameState.matches.get(matchId);
    if (!match) return;

    // Simula il movimento solo per i bot
    for (const [playerId, playerData] of match.players.entries()) {
        // Salta i giocatori che non sono bot
        if (!playerData.isBot) continue;
        
        // Genera un movimento casuale
        const currentPosition = playerData.position || { x: 0, y: 1, z: 0 };
        
        // Velocità variabile per rendere il movimento più naturale
        const speed = 0.05 + Math.random() * 0.1; // Velocità tra 0.05 e 0.15
        
        // Direzione casuale con una probabilità di mantenere la direzione precedente
        let direction;
        if (!playerData.lastDirection || Math.random() < 0.1) { // 10% di probabilità di cambiare direzione
            direction = Math.random() * Math.PI * 2;
            playerData.lastDirection = direction;
        } else {
            // Piccola variazione della direzione precedente
            direction = playerData.lastDirection + (Math.random() - 0.5) * 0.5;
            playerData.lastDirection = direction;
        }
        
        // Calcola la nuova posizione
        let newPosition = {
            x: currentPosition.x + Math.cos(direction) * speed,
            y: currentPosition.y, // Mantiene l'altezza costante
            z: currentPosition.z + Math.sin(direction) * speed
        };
        
        // Verifica che la nuova posizione sia all'interno dell'isola
        const distanceFromCenter = Math.sqrt(newPosition.x * newPosition.x + newPosition.z * newPosition.z);
        if (distanceFromCenter > 80) { // Se il bot sta per uscire dall'isola
            // Genera una nuova posizione verso il centro dell'isola
            const angleToCenter = Math.atan2(-newPosition.z, -newPosition.x);
            newPosition = {
                x: currentPosition.x + Math.cos(angleToCenter) * speed,
                y: currentPosition.y,
                z: currentPosition.z + Math.sin(direction) * speed
            };
            // Aggiorna la direzione
            playerData.lastDirection = angleToCenter;
        }
        
        // Calcola la rotazione in base alla direzione del movimento
        const currentRotation = playerData.rotation || { x: 0, y: 0, z: 0 };
        const targetRotation = {
            x: currentRotation.x,
            y: Math.atan2(
                newPosition.x - currentPosition.x,
                newPosition.z - currentPosition.z
            ),
            z: currentRotation.z
        };
        
        // Aggiorna la posizione e la rotazione del bot
        playerData.position = newPosition;
        playerData.rotation = targetRotation;

        // Invia l'aggiornamento di movimento a tutti i giocatori nella partita
        io.to(matchId).emit('playerMoved', {
            id: playerId,
            position: newPosition,
            rotation: targetRotation
        });
        
        // Simula la raccolta di tesori da parte dei bot
        simulateBotTreasureCollection(matchId, playerId, newPosition);
    }

    // Ripeti la simulazione ogni 100ms
    setTimeout(() => simulateBotMovement(matchId), 100);
}

/**
 * Simula la raccolta di tesori da parte dei bot
 * @param {string} matchId - ID della partita
 * @param {string} botId - ID del bot
 * @param {Object} botPosition - Posizione del bot
 */
function simulateBotTreasureCollection(matchId, botId, botPosition) {
    const match = gameState.matches.get(matchId);
    if (!match) return;
    
    // Probabilità bassa di raccogliere un tesoro (per non rendere i bot troppo forti)
    if (Math.random() > 0.005) return; // 0.5% di probabilità ad ogni aggiornamento
    
    // Verifica se ci sono tesori nella partita
    if (!match.treasures || match.treasures.size === 0) return;
    
    // Trova il tesoro più vicino
    let closestTreasure = null;
    let minDistance = Infinity;
    
    for (const [treasureId, treasure] of match.treasures.entries()) {
        if (!treasure || !treasure.position) continue;
        
        const distance = Math.sqrt(
            Math.pow(botPosition.x - treasure.position.x, 2) +
            Math.pow(botPosition.z - treasure.position.z, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            closestTreasure = { id: treasureId, ...treasure };
        }
    }
    
    // Se c'è un tesoro abbastanza vicino, simuliamo la raccolta
    if (closestTreasure && minDistance < 5) { // Distanza di raccolta
        console.log(`Bot ${botId} sta raccogliendo un tesoro di tipo ${closestTreasure.type || 'normal'}`);
        
        // Simula l'evento di raccolta tesoro
        const treasureData = {
            playerId: botId,
            position: closestTreasure.position,
            matchId: matchId,
            treasureType: closestTreasure.type || 'normal'
        };
        
        // Chiama la funzione di gestione tesoro come se fosse un evento reale
        handleTreasureCollection(treasureData);
    }
}

/**
 * Gestisce la raccolta di un tesoro
 * @param {Object} data - Dati del tesoro raccolto
 */
function handleTreasureCollection(data) {
    try {
        console.log('Treasure collected event received:', data);
        const playerId = data.playerId;
        const matchId = data.matchId;
        const treasureType = data.treasureType || 'normal';
        
        // Se il giocatore è in una partita, gestisci il tesoro per quella partita
        if (matchId && gameState.matches.has(matchId)) {
            const match = gameState.matches.get(matchId);
            const player = match.players.get(playerId);
            
            if (player) {
                // Incrementa il punteggio del giocatore in base al tipo di tesoro
                let points = 1;
                switch(treasureType) {
                    case 'blue':
                        points = 2;
                        player.score += points;
                        console.log(`Giocatore ${playerId} ha raccolto un tesoro BLU! +${points} punti`);
                        break;
                    case 'red':
                        points = -1;
                        player.score = Math.max(0, player.score + points);
                        console.log(`Giocatore ${playerId} ha raccolto un tesoro ROSSO! ${points} punti`);
                        break;
                    default: // 'normal'
                        points = 1;
                        player.score += points;
                        console.log(`Giocatore ${playerId} ha raccolto un tesoro NORMALE. +${points} punti`);
                        break;
                }
                
                // Aggiorna il punteggio nella mappa dei punteggi della partita
                match.scores.set(playerId, player.score);
                
                // Invia l'aggiornamento del punteggio a tutti i giocatori nella partita
                io.to(matchId).emit('scoreUpdate', playerId, player.score);
                
                // Genera una nuova posizione per il tesoro
                let newPosition;
                try {
                    if (data.position) {
                        // Verifica che la posizione sia valida
                        if (typeof data.position === 'object' && 'x' in data.position && 'z' in data.position) {
                            // Usa la posizione inviata dal client per generare una posizione lontana
                            newPosition = getPositionFarFrom([data.position], 30);
                        } else {
                            // Fallback a una posizione casuale
                            newPosition = getRandomPosition();
                        }
                    } else {
                        // Fallback a una posizione casuale
                        newPosition = getRandomPosition();
                    }
                } catch (error) {
                    console.error('Errore nella generazione della nuova posizione del tesoro:', error);
                    // Fallback a una posizione casuale in caso di errore
                    newPosition = getRandomPosition();
                }
                
                // Genera un nuovo tipo di tesoro
                const newTreasureType = getRandomTreasureType();
                
                // Invia l'evento di aggiornamento del tesoro a tutti i giocatori nella partita
                io.to(matchId).emit('treasureCollected', playerId, data.position, treasureType);
                
                // Invia la nuova posizione e tipo del tesoro
                io.to(matchId).emit('treasureUpdate', {
                    position: newPosition,
                    playerId: playerId,
                    playerScore: player.score,
                    treasureType: newTreasureType
                });
            }
        }
    } catch (error) {
        console.error('Error in handleTreasureCollection:', error);
    }
}

/**
 * Avvia una nuova partita con i giocatori in attesa
 */
function startMatch() {
    // Verifica se abbiamo raggiunto il limite di partite
    if (gameState.matches.size >= gameState.maxMatches) {
        console.log(`Limite di partite raggiunto (${gameState.maxMatches}). Rimuovo la partita più vecchia.`);
        // Trova la partita più vecchia
        const oldestMatchId = [...gameState.matches.keys()][0];
        if (oldestMatchId) {
            // Termina la partita più vecchia
            endMatch(oldestMatchId, 'Partita terminata per fare spazio a nuove partite');
        }
    }

    // Genera un ID univoco per la partita
    const matchId = `match-${Date.now()}`;
    
    // Crea una nuova mappa per i giocatori della partita
    const matchPlayers = new Map();
    
    // Sposta i giocatori dalla lobby alla partita
    let i = 0;
    for (const [playerId, playerData] of gameState.lobby.players.entries()) {
        if (i >= gameState.lobby.maxPlayers) break;
        
        // Ottieni il nickname dal gameState o usa un fallback
        const nickname = gameState.players.get(playerId)?.nickname || 
                         playerData.nickname || 
                         `player-${playerId.slice(0, 5)}`;
        
        matchPlayers.set(playerId, {
            socket: io.sockets.sockets.get(playerId), // Recupera il socket direttamente
            joinTime: playerData.joinTime,
            nickname: nickname,
            score: 0, // Inizializza il punteggio
            position: { x: 0, y: 0, z: 0 }, // Posizione iniziale
            rotation: { x: 0, y: 0, z: 0 }, // Rotazione iniziale
            isBot: false, // Per default, i giocatori non sono bot
            lastDirection: null // Aggiunto per la gestione della direzione
        });
        gameState.lobby.players.delete(playerId);
        i++;
    }
    
    // Se ci sono meno giocatori del minimo richiesto, aggiungi bot
    if (matchPlayers.size < gameState.lobby.minPlayers) {
        const botsNeeded = gameState.lobby.minPlayers - matchPlayers.size;
        console.log(`Aggiungendo ${botsNeeded} bot alla partita ${matchId}`);
        
        for (let j = 0; j < botsNeeded; j++) {
            const botId = `bot-${Date.now()}-${j}`;
            const botNickname = getRandomItalianName();
            
            matchPlayers.set(botId, {
                joinTime: Date.now(),
                nickname: botNickname,
                score: 0,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                isBot: true, // Questo è un bot
                lastDirection: null // Aggiunto per la gestione della direzione
            });
            
            console.log(`Bot ${botNickname} (${botId}) aggiunto alla partita`);
        }
    }
    
    // Aggiungi la partita alla mappa delle partite
    gameState.matches.set(matchId, {
        players: matchPlayers,
        startTime: Date.now(),
        treasures: new Map(),
        scores: new Map()
    });
    
    console.log(`Nuova partita creata: ${matchId} con ${matchPlayers.size} giocatori`);
    console.log('Giocatori nella partita:', Array.from(matchPlayers.keys()));
    
    // Genera posizioni casuali per i giocatori
    const playerPositions = {};
    for (const playerId of matchPlayers.keys()) {
        playerPositions[playerId] = getRandomPosition();
        
        // Aggiorna la posizione nel giocatore
        const player = matchPlayers.get(playerId);
        if (player) {
            player.position = playerPositions[playerId];
        }
    }
    
    // Genera posizioni casuali per i tesori
    const treasurePositions = [];
    for (let i = 0; i < 5; i++) {
        try {
            // Converti le posizioni dei giocatori in un array di oggetti validi
            const validPlayerPositions = Object.values(playerPositions).filter(pos => 
                pos && typeof pos === 'object' && 'x' in pos && 'z' in pos
            );
            
            // Se non ci sono posizioni valide, usa una posizione casuale
            let position;
            if (validPlayerPositions.length > 0) {
                position = getPositionFarFrom(validPlayerPositions, 20);
            } else {
                position = getRandomPosition();
            }
            
            treasurePositions.push({
                position,
                type: getRandomTreasureType()
            });
        } catch (error) {
            console.error(`Errore nella generazione della posizione del tesoro ${i}:`, error);
            // Fallback a una posizione casuale in caso di errore
            treasurePositions.push({
                position: getRandomPosition(),
                type: getRandomTreasureType()
            });
        }
    }
    
    // Prepara i dati dei giocatori con i loro nickname
    const playersData = [];
    for (const [playerId, playerData] of matchPlayers.entries()) {
        playersData.push({
            id: playerId,
            nickname: playerData.nickname,
            position: playerPositions[playerId]
        });
    }
    
    // Prepara i nickname in un oggetto per un accesso più facile
    const nicknames = {};
    for (const [playerId, playerData] of matchPlayers.entries()) {
        nicknames[playerId] = playerData.nickname;
    }
    
    // Invia l'evento di inizio partita a tutti i giocatori
    for (const [playerId, playerData] of matchPlayers.entries()) {
        try {
            // Salta i bot
            if (playerData.isBot) continue;
            
            // Recupera il socket direttamente da io.sockets.sockets
            const socket = io.sockets.sockets.get(playerId);
            
            if (socket && typeof socket.emit === 'function') {
                // Imposta il matchId nel socket
                socket.matchId = matchId;
                
                // Invia l'evento di inizio partita
                socket.emit('matchStart', {
                    matchId,
                    players: Array.from(matchPlayers.keys()),
                    positions: playerPositions,
                    nicknames: nicknames,
                    treasures: treasurePositions
                });
                
                // Fai entrare il socket nella room della partita
                socket.join(matchId);
                
                console.log(`Evento matchStart inviato al giocatore ${playerData.nickname} (${playerId})`);
                console.log(`Dati inviati: ${matchPlayers.size} giocatori, ${treasurePositions.length} tesori`);
            } else {
                console.error(`Socket non trovato per il giocatore ${playerId}`);
                // Rimuovi il giocatore dalla partita se il socket non è valido
                matchPlayers.delete(playerId);
                if (matchPlayers.size === 0) {
                    gameState.matches.delete(matchId);
                    console.log(`Partita ${matchId} annullata: nessun giocatore valido`);
                }
            }
        } catch (error) {
            console.error(`Errore nell'invio dell'evento matchStart al giocatore ${playerId}:`, error);
            // Rimuovi il giocatore dalla partita in caso di errore
            matchPlayers.delete(playerId);
            if (matchPlayers.size === 0) {
                gameState.matches.delete(matchId);
                console.log(`Partita ${matchId} annullata: nessun giocatore valido`);
            }
        }
    }
    
    // Imposta un timer per terminare la partita dopo 5 minuti
    setTimeout(() => {
        if (gameState.matches.has(matchId)) {
            endMatch(matchId, 'Tempo scaduto');
        }
    }, gameState.matchTimeout);
    
    // Verifica se ci sono bot nella partita
    const hasBots = Array.from(matchPlayers.values()).some(player => player.isBot);
    
    // Avvia la simulazione del movimento dei bot solo se ci sono bot nella partita
    if (hasBots) {
        console.log(`Avvio simulazione movimento bot per la partita ${matchId}`);
        simulateBotMovement(matchId);
    }
    
    // Aggiorna il contatore dei giocatori online
    broadcastOnlinePlayersCount();
}

/**
 * Termina una partita e gestisce i risultati
 */
function endMatch(matchId, reason) {
    // Verifica se la partita esiste
    if (!gameState.matches.has(matchId)) {
        console.log(`Impossibile terminare la partita ${matchId}: non esiste`);
        return;
    }
    
    const match = gameState.matches.get(matchId);
    
    // Trova il vincitore (giocatore con il punteggio più alto)
    let winnerId = null;
    let maxScore = -1;
    
    // Crea un oggetto con i punteggi finali
    const finalScores = {};
    
    for (const [playerId, playerData] of match.players.entries()) {
        const score = playerData.score || 0;
        finalScores[playerId] = score;
        
        if (score > maxScore) {
            maxScore = score;
            winnerId = playerId;
        }
    }
    
    console.log(`Partita ${matchId} terminata. Vincitore: ${winnerId || 'nessuno'} con ${maxScore} punti`);
    console.log('Punteggi finali:', finalScores);
    
    // Invia l'evento di fine partita a tutti i giocatori
    for (const [playerId, playerData] of match.players.entries()) {
        try {
            // Recupera il socket direttamente
            const socket = io.sockets.sockets.get(playerId);
            
            if (socket && typeof socket.emit === 'function') {
                // Invia l'evento gameOver
                socket.emit('gameOver', {
                    winnerId,
                    scores: finalScores,
                    reason
                });
                
                // Rimuovi il socket dalla room della partita
                socket.leave(matchId);
                
                // Reimposta il matchId del socket
                socket.matchId = null;
                
                // Rimetti il giocatore nella lobby
                gameState.lobby.players.set(playerId, {
                    joinTime: Date.now(),
                    socket: socket
                });
                
                console.log(`Giocatore ${playerId} rimesso nella lobby`);
            } else {
                console.error(`Socket non trovato per il giocatore ${playerId} durante la fine della partita`);
            }
        } catch (error) {
            console.error(`Errore nell'invio dell'evento gameOver al giocatore ${playerId}:`, error);
        }
    }
    
    // Rimuovi la partita dalla mappa
    gameState.matches.delete(matchId);
    
    // Aggiorna la lobby
    broadcastLobbyUpdate();
    
    // Aggiorna il contatore dei giocatori online
    broadcastOnlinePlayersCount();
}

/**
 * Restituisce un tipo di tesoro casuale
 */
function getRandomTreasureType() {
    const types = ['normal', 'blue', 'red'];
    const weights = [0.7, 0.2, 0.1]; // 70% normale, 20% blu, 10% rosso
    
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < types.length; i++) {
        sum += weights[i];
        if (random < sum) {
            return types[i];
        }
    }
    
    return 'normal'; // Fallback
}

/**
 * Genera un nome italiano casuale per un bot
 * @returns {string} Nome casuale
 */
function getRandomItalianName() {
    const firstNames = [
        "Marco", "Sofia", "Luca", "Giulia", "Alessandro", "Martina", "Davide", "Chiara",
        "Francesco", "Anna", "Matteo", "Sara", "Lorenzo", "Elena", "Simone", "Valentina",
        "Andrea", "Laura", "Giovanni", "Francesca", "Riccardo", "Elisa", "Tommaso", "Giorgia"
    ];
    
    const suffixes = [
        "Bot", "AI", "Robot", "Virtual", "Auto", "Sim", "Digital", "Cyber",
        "Tech", "Mech", "Droid", "Machine", "System", "Program", "Assistant", "Helper"
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${firstName}${suffix}`;
}

// Start server
const PORT = process.env.PORT || 10000; // Usa la porta 10000 come predefinita per Render.com

// Imposta il timeout del server a 120 secondi
http.setTimeout(120000);

// Gestione degli errori del server
const server = http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
    // Initialize treasure position
    gameState.treasure.position = getRandomPosition();
    
    // Avvia l'invio periodico del numero di giocatori online
    startOnlinePlayersUpdates();
    
    // Avvia il controllo periodico dei giocatori inattivi
    startInactivityCheck();
    
    // Avvia il controllo periodico delle partite inattive
    startMatchesCheck();
});

/**
 * Avvia il controllo periodico dei giocatori inattivi
 */
function startInactivityCheck() {
    // Controlla i giocatori inattivi ogni minuto
    setInterval(checkInactiveUsers, 60000);
    console.log('Inactivity check started');
}

/**
 * Invia periodicamente il numero di giocatori online a tutti i client
 */
function startOnlinePlayersUpdates() {
    // Invia subito un primo aggiornamento
    broadcastOnlinePlayersCount();
    
    // Poi invia aggiornamenti ogni 10 secondi
    setInterval(broadcastOnlinePlayersCount, 10000);
}

/**
 * Controlla e disconnette i giocatori inattivi
 */
function checkInactiveUsers() {
    const now = Date.now();
    const inactivityThreshold = now - gameState.inactivityTimeout;
    
    console.log('Checking for inactive users...');
    
    // Ottieni tutti i socket connessi
    const connectedSockets = io.sockets.sockets;
    
    // Itera su tutti i socket
    connectedSockets.forEach(socket => {
        // Se il socket non ha attività recente, disconnettilo
        if (socket.lastActivity && socket.lastActivity < inactivityThreshold) {
            console.log(`Disconnecting inactive user: ${socket.id} (inactive for ${Math.floor((now - socket.lastActivity) / 1000 / 60)} minutes)`);
            socket.disconnect(true);
        }
    });
}

/**
 * Calcola e invia il numero di giocatori online a tutti i client
 */
function broadcastOnlinePlayersCount() {
    // Ottieni il numero di socket connessi (più accurato)
    const connectedSockets = io.sockets.sockets;
    const totalPlayers = connectedSockets.size;
    
    console.log(`Broadcasting online players count: ${totalPlayers}`);
    
    // Invia l'aggiornamento a tutti i client connessi
    io.emit('onlinePlayersUpdate', totalPlayers);
}

/**
 * Avvia il controllo periodico delle partite
 */
function startMatchesCheck() {
    // Controlla le partite ogni minuto
    setInterval(checkMatches, 60000);
    console.log('Matches check started');
}

/**
 * Controlla le partite attive e termina quelle che durano da troppo tempo
 */
function checkMatches() {
    const now = Date.now();
    
    console.log(`Checking matches... (${gameState.matches.size} active)`);
    
    // Controlla ogni partita
    for (const [matchId, match] of gameState.matches.entries()) {
        // Se la partita è attiva da più del tempo massimo, terminala
        if (now - match.startTime > gameState.matchTimeout) {
            console.log(`Match ${matchId} has exceeded time limit. Ending match.`);
            endMatch(matchId, 'Tempo scaduto');
        }
        
        // Se non ci sono giocatori nella partita, rimuovila
        if (match.players.size === 0) {
            console.log(`Match ${matchId} has no players. Removing match.`);
            gameState.matches.delete(matchId);
        }
    }
}

// Gestione degli errori
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please close the other server or use a different port.`);
        process.exit(1);
    } else {
        console.error('Server error:', error);
    }
});

// Gestione della chiusura pulita
process.on('SIGINT', () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Gestione degli errori non gestiti
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    server.close(() => {
        process.exit(1);
    });
}); 