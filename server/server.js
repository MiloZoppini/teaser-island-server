const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
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
    currentMatchId: 0 // Contatore per generare ID partita univoci
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

// Generate position far from a given point (safe from water)
function getPositionFarFrom(position, minDistance = 30) {
    // Parametri per generare posizioni sicure sull'isola
    const minRadius = 20; // Minima distanza dal centro
    const maxRadius = 80; // Massima distanza dal centro (per evitare l'acqua)
    
    let newPosition;
    let distance = 0;
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
        
        // Calcola la distanza dalla posizione originale
        distance = Math.sqrt(
            Math.pow(newPosition.x - position.x, 2) + 
            Math.pow(newPosition.z - position.z, 2)
        );
        
        attempts++;
    } while (distance < minDistance && attempts < maxAttempts);
    
    console.log(`Generated new safe position at distance ${distance.toFixed(2)} after ${attempts} attempts`);
    console.log(`Original position: (${position.x.toFixed(2)}, ${position.z.toFixed(2)}), New position: (${newPosition.x.toFixed(2)}, ${newPosition.z.toFixed(2)})`);
    
    return newPosition;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Gestione degli eventi del socket
    socket.on('requestMatchmaking', (data) => {
        const playerId = data.playerId || socket.id;
        handleMatchmaking(socket, playerId);
    });

    socket.on('playerMove', (data) => {
        const playerId = data.id || socket.id;
        const matchId = data.matchId;
        
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
        console.log('Treasure collected event received:', data);
        const playerId = data.playerId || socket.id;
        const matchId = data.matchId;
        const treasureType = data.treasureType || 'normal';
        
        // Se il giocatore è in una partita, gestisci il tesoro per quella partita
        if (matchId && gameState.matches.has(matchId)) {
            const match = gameState.matches.get(matchId);
            const player = match.players.get(playerId);
            
            if (player) {
                // Incrementa il punteggio del giocatore in base al tipo di tesoro
                switch(treasureType) {
                    case 'bonus':
                        player.score += 2; // Il tesoro bonus vale 2 punti
                        console.log(`Giocatore ${playerId} ha raccolto un tesoro BONUS! +2 punti`);
                        break;
                    case 'malus':
                        player.score = Math.max(0, player.score - 1); // Il tesoro malus toglie 1 punto (minimo 0)
                        console.log(`Giocatore ${playerId} ha raccolto un tesoro MALUS! -1 punto`);
                        break;
                    default: // 'normal'
                        player.score += 1; // Il tesoro normale vale 1 punto
                        console.log(`Giocatore ${playerId} ha raccolto un tesoro normale. +1 punto`);
                        break;
                }
                
                // Genera una nuova posizione per il tesoro
                let newPosition;
                if (data.position) {
                    // Usa la posizione inviata dal client per generare una posizione lontana
                    newPosition = getPositionFarFrom(data.position, 30);
                } else {
                    // Fallback a una posizione casuale
                    newPosition = getRandomPosition();
                }
                
                // Aggiorna la posizione del tesoro per questa partita
                match.treasure.position = newPosition;
                match.treasure.collected++;
                
                // Invia l'aggiornamento a tutti i giocatori nella partita
                io.to(matchId).emit('treasureUpdate', {
                    position: match.treasure.position,
                    playerId: playerId,
                    playerScore: player.score,
                    treasureType: 'normal' // Il nuovo tesoro è sempre di tipo normale
                });
            }
        } else {
            // Fallback al vecchio sistema
            const player = gameState.players.get(socket.id);
            if (player) {
                // Incrementa il punteggio del giocatore in base al tipo di tesoro
                switch(treasureType) {
                    case 'bonus':
                        player.score += 2; // Il tesoro bonus vale 2 punti
                        break;
                    case 'malus':
                        player.score = Math.max(0, player.score - 1); // Il tesoro malus toglie 1 punto (minimo 0)
                        break;
                    default: // 'normal'
                        player.score += 1; // Il tesoro normale vale 1 punto
                        break;
                }
                
                // Genera una nuova posizione lontana da quella attuale
                let newPosition;
                if (data.position) {
                    // Usa la posizione inviata dal client per generare una posizione lontana
                    // Aumentiamo la distanza minima a 30 unità per garantire che il tesoro appaia all'altra parte dell'isola
                    newPosition = getPositionFarFrom(data.position, 30);
                } else {
                    // Fallback a una posizione casuale se non abbiamo la posizione attuale
                    newPosition = getRandomPosition();
                }
                
                gameState.treasure.position = newPosition;
                gameState.treasure.collected++;
                
                io.emit('treasureUpdate', {
                    position: gameState.treasure.position,
                    playerId: socket.id,
                    playerScore: player.score,
                    treasureType: 'normal' // Il nuovo tesoro è sempre di tipo normale
                });
            }
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
                }
            }
        });
        
        // Fallback al vecchio sistema
        gameState.players.delete(socket.id);
        io.emit('playerLeft', socket.id);
    });
});

/**
 * Gestisce il matchmaking per un giocatore
 * @param {Socket} socket - Socket del giocatore
 * @param {string} playerId - ID del giocatore
 */
function handleMatchmaking(socket, playerId) {
    // Aggiungi il giocatore alla lobby
    gameState.lobby.players.set(playerId, {
        socket: socket,
        joinTime: Date.now()
    });
    
    // Fai entrare il socket nella room della lobby
    socket.join('lobby');
    
    console.log(`Giocatore ${playerId} aggiunto alla lobby. Giocatori in lobby: ${gameState.lobby.players.size}`);
    
    // Invia un aggiornamento della lobby a tutti i giocatori in attesa
    broadcastLobbyUpdate();
    
    // Se ci sono abbastanza giocatori, avvia una partita
    if (gameState.lobby.players.size >= gameState.lobby.minPlayers) {
        startMatch();
    }
}

/**
 * Invia un aggiornamento dello stato della lobby a tutti i giocatori in attesa
 */
function broadcastLobbyUpdate() {
    const update = {
        playersInLobby: gameState.lobby.players.size,
        maxPlayers: gameState.lobby.maxPlayers
    };
    
    io.to('lobby').emit('lobbyUpdate', update);
}

/**
 * Avvia una nuova partita con i giocatori in attesa nella lobby
 */
function startMatch() {
    // Genera un nuovo ID per la partita
    gameState.currentMatchId++;
    const matchId = `match-${gameState.currentMatchId}`;
    
    // Crea una nuova partita
    const match = {
        players: new Map(),
        treasure: {
            position: getRandomPosition(),
            collected: 0
        },
        startTime: Date.now()
    };
    
    // Aggiungi la partita alla mappa delle partite attive
    gameState.matches.set(matchId, match);
    
    // Seleziona i giocatori dalla lobby (fino al massimo consentito)
    const playersToAdd = Array.from(gameState.lobby.players.entries())
        .slice(0, gameState.lobby.maxPlayers);
    
    // Dati dei giocatori da inviare a tutti
    const playersData = [];
    
    // Aggiungi i giocatori alla partita
    playersToAdd.forEach(([playerId, playerData]) => {
        // Rimuovi il giocatore dalla lobby
        gameState.lobby.players.delete(playerId);
        
        // Genera una posizione casuale per il giocatore
        const position = getRandomPosition();
        
        // Aggiungi il giocatore alla partita
        match.players.set(playerId, {
            position: position,
            rotation: { x: 0, y: 0, z: 0 },
            score: 0
        });
        
        // Aggiungi i dati del giocatore all'array da inviare
        playersData.push({
            id: playerId,
            position: position
        });
        
        // Fai entrare il socket nella room della partita
        playerData.socket.leave('lobby');
        playerData.socket.join(matchId);
    });
    
    // Invia l'evento di partita trovata a tutti i giocatori nella partita
    playersToAdd.forEach(([playerId, playerData]) => {
        playerData.socket.emit('matchFound', {
            matchId: matchId,
            players: playersData,
            position: match.players.get(playerId).position,
            treasure: match.treasure.position
        });
    });
    
    console.log(`Partita ${matchId} avviata con ${playersToAdd.length} giocatori`);
    
    // Invia un aggiornamento della lobby ai giocatori rimasti in attesa
    broadcastLobbyUpdate();
}

// Start server
const PORT = process.env.PORT || 3000;

// Gestione degli errori del server
const server = http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    // Initialize treasure position
    gameState.treasure.position = getRandomPosition();
    
    // Avvia l'invio periodico del numero di giocatori online
    startOnlinePlayersUpdates();
});

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
 * Calcola e invia il numero di giocatori online a tutti i client
 */
function broadcastOnlinePlayersCount() {
    // Calcola il numero totale di giocatori online (lobby + partite attive)
    let totalPlayers = gameState.lobby.players.size;
    
    // Aggiungi i giocatori nelle partite attive
    gameState.matches.forEach(match => {
        totalPlayers += match.players.size;
    });
    
    console.log(`Broadcasting online players count: ${totalPlayers}`);
    
    // Invia l'aggiornamento a tutti i client connessi
    io.emit('onlinePlayersUpdate', totalPlayers);
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