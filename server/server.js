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
    lobby: {
        players: new Map(), // Giocatori in attesa
        minPlayersToStart: 2 // Minimo 2 giocatori per iniziare una partita
    },
    matches: new Map(), // Partite attive
    players: new Map(), // Tutti i giocatori connessi
    matchDuration: 3 * 60 * 1000, // 3 minuti in millisecondi
    inactivityTimeout: 3 * 60 * 1000, // 3 minuti in millisecondi
    treasureTypes: {
        normal: { points: 1, color: 0xFFD700 },
        blue: { points: 3, color: 0x0000FF },
        red: { points: 5, color: 0xFF0000 }
    }
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
    console.log(`Nuovo socket connesso: ${socket.id}`);
    socket.lastActivity = Date.now();

    // Quando un giocatore richiede di entrare in matchmaking
    socket.on('requestMatchmaking', (data) => {
        socket.lastActivity = Date.now();
        const playerId = socket.id;
        const nickname = data.nickname || getRandomName();
        
        console.log(`Richiesta matchmaking da ${nickname} (${playerId})`);
        console.log(`Stanze del socket:`, Array.from(socket.rooms));
        
        // Salva il giocatore nel gameState
        gameState.players.set(playerId, { 
            name: nickname, 
            position: getRandomPosition(), 
            rotation: 0, 
            score: 0 
        });
        
        // Gestisci il matchmaking
        handleMatchmaking(socket, playerId);
    });

    // Gestione del movimento del giocatore
    socket.on('playerMove', (data) => {
        socket.lastActivity = Date.now();
        const playerId = socket.id;
        
        if (gameState.players.has(playerId)) {
            const player = gameState.players.get(playerId);
                player.position = data.position;
                player.rotation = data.rotation;
                
            // Trova la partita del giocatore
            let matchId = null;
            gameState.matches.forEach((match, id) => {
                if (match.players.has(playerId)) {
                    matchId = id;
                }
            });
            
            if (matchId) {
                // Invia la posizione aggiornata a tutti gli altri giocatori nella stessa partita
                socket.to(matchId).emit('playerMoved', {
                    id: playerId,
                    position: player.position,
                    rotation: player.rotation
                });
            }
        }
    });

    // Gestione della disconnessione
    socket.on('disconnect', () => {
        const playerId = socket.id;
        console.log(`Player disconnected: ${playerId}`);
        
        // Rimuovi il giocatore dalla lobby se presente
        if (gameState.lobby.players.has(playerId)) {
            gameState.lobby.players.delete(playerId);
            broadcastLobbyUpdate();
        }
        
        // Rimuovi il giocatore dalle partite attive
        let matchId = null;
        gameState.matches.forEach((match, id) => {
            if (match.players.has(playerId)) {
                matchId = id;
                match.players.delete(playerId);
                
                // Notifica gli altri giocatori
                socket.to(id).emit('playerLeft', { id: playerId });
                
                // Se non ci sono più giocatori, termina la partita
                if (match.players.size === 0) {
                    gameState.matches.delete(id);
                    console.log(`Partita ${id} terminata: nessun giocatore rimasto`);
                }
            }
        });
        
        // Rimuovi il giocatore dal gameState
        gameState.players.delete(playerId);
        
        // Aggiorna il conteggio dei giocatori online
        broadcastOnlinePlayersCount();
    });
    
    // Ping dal client per mantenere attiva la connessione
    socket.on('ping', () => {
        // Aggiorna il timestamp dell'ultima attività
        socket.lastActivity = Date.now();
    });

    // Gestione degli eventi del socket
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
});

/**
 * Gestisce il matchmaking per un giocatore
 * @param {Socket} socket - Socket del giocatore
 * @param {string} playerId - ID del giocatore
 */
function handleMatchmaking(socket, playerId) {
    // Verifica se il giocatore esiste nel gameState
    if (!gameState.players.has(playerId)) {
        console.error(`Giocatore ${playerId} non trovato nel gameState`);
        return;
    }
    
    const player = gameState.players.get(playerId);
    
    // Aggiungi il giocatore alla lobby
    gameState.lobby.players.set(playerId, player);
    socket.join('lobby');
    
    console.log(`Giocatore ${player.name} (${playerId}) aggiunto alla lobby. Totale: ${gameState.lobby.players.size}`);
    
    // Invia aggiornamento della lobby a tutti
    broadcastLobbyUpdate();
    
    // Verifica se ci sono abbastanza giocatori per iniziare una partita
    if (gameState.lobby.players.size >= gameState.lobby.minPlayersToStart) {
        startMatch();
    }
}

/**
 * Invia un aggiornamento dello stato della lobby a tutti i giocatori in attesa
 */
function broadcastLobbyUpdate() {
    const lobbyData = {
        count: gameState.lobby.players.size,
        players: Array.from(gameState.lobby.players.entries()).map(([id, player]) => ({
            id,
            name: player.name
        }))
    };
    
    io.to('lobby').emit('lobbyUpdate', lobbyData);
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
                z: currentPosition.z + Math.sin(angleToCenter) * speed
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
        
        // Log per debug
        console.log(`Bot ${playerId} (${playerData.name}) si è mosso a posizione:`, newPosition);
        
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
    if (gameState.lobby.players.size < gameState.lobby.minPlayersToStart) {
        return;
    }
    
    const matchId = `match-${Date.now()}`;
    const players = new Map();
    const treasures = [];
    
    // Crea un array di posizioni dei giocatori per assicurarsi che siano distanti tra loro
    const playerPositions = [];
    
    // Seleziona i primi N giocatori dalla lobby
    let count = 0;
    const playersData = {};
    
    gameState.lobby.players.forEach((player, id) => {
        if (count < 6) { // Massimo 6 giocatori per partita
            // Genera una posizione casuale lontana dagli altri giocatori
            const position = getPositionFarFrom(playerPositions);
            playerPositions.push(position);
            
            // Aggiorna la posizione del giocatore
            player.position = position;
            player.score = 0; // Resetta il punteggio
            
            // Aggiungi il giocatore alla partita
            players.set(id, player);
            
            // Prepara i dati del giocatore per l'evento matchStart
            playersData[id] = {
                nickname: player.name,
                position: position
            };
            
            // Rimuovi il giocatore dalla lobby
            gameState.lobby.players.delete(id);
            
            count++;
        }
    });
    
    // Genera i tesori per la partita
    for (let i = 0; i < 20; i++) {
        const position = getPositionFarFrom(playerPositions.concat(treasures.map(t => t.position)));
        const type = getRandomTreasureType();
        treasures.push({
            position,
            type,
            collected: false
        });
    }
    
    // Crea la partita
    const match = {
        id: matchId,
        players,
        treasures,
        startTime: Date.now(),
        endTime: Date.now() + gameState.matchDuration
    };
    
    gameState.matches.set(matchId, match);
    
    console.log(`Partita ${matchId} iniziata con ${players.size} giocatori e ${treasures.length} tesori`);
    
    // Fai entrare tutti i giocatori nella stanza della partita
    players.forEach((player, id) => {
        const socket = io.sockets.sockets.get(id);
        if (socket) {
            socket.leave('lobby');
            socket.join(matchId);
        }
    });
    
    // Invia l'evento matchStart a tutti i giocatori nella partita
    io.to(matchId).emit('matchStart', {
        matchId,
        players: playersData,
        treasures: treasures.map(t => ({ position: t.position, type: t.type })),
        duration: gameState.matchDuration
    });
    
    // Aggiorna la lobby
    broadcastLobbyUpdate();
    
    // Avvia il movimento simulato dei bot se ci sono meno di 2 giocatori reali
    if (players.size < 2) {
        // Aggiungi bot fino ad avere almeno 2 giocatori totali
        const botsToAdd = 2 - players.size;
        for (let i = 0; i < botsToAdd; i++) {
            const botId = `bot-${Date.now()}-${i}`;
            const botPosition = getPositionFarFrom(playerPositions);
            playerPositions.push(botPosition);
            
            const botName = getRandomName();
            const bot = {
                name: `Bot ${botName}`,
                position: botPosition,
                rotation: 0,
                score: 0,
                isBot: true
            };
            
            players.set(botId, bot);
            gameState.players.set(botId, bot);
            
            // Notifica i giocatori dell'aggiunta del bot
            io.to(matchId).emit('playerJoined', {
                id: botId,
                name: bot.name,
                position: bot.position,
                rotation: bot.rotation,
                isBot: true
            });
        }
        
        // Avvia il movimento simulato dei bot
        simulateBotMovement(matchId);
    }
    
    // Imposta un timer per terminare la partita
    setTimeout(() => {
        endMatch(matchId, 'timeout');
    }, gameState.matchDuration);
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
        if (now - match.startTime > gameState.matchDuration) {
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