# Architettura del Gioco

## Panoramica

Il gioco è strutturato secondo un'architettura client-server, dove il server gestisce la logica di gioco e la sincronizzazione tra i giocatori, mentre il client si occupa del rendering 3D e dell'input dell'utente.

## Componenti Principali

### Client

#### 1. Game (`game.js`)
- Gestisce il loop di gioco principale
- Inizializza la scena Three.js
- Coordina l'interazione tra i vari componenti
- Gestisce il timer di gioco

Responsabilità:
- Setup della scena 3D
- Gestione del ciclo di rendering
- Creazione e gestione dell'ambiente di gioco
- Coordinamento delle comunicazioni socket

#### 2. Player (`player.js`)
- Gestisce la logica del personaggio
- Implementa il movimento e la fisica
- Gestisce la camera in terza persona

Responsabilità:
- Creazione del modello 3D del personaggio
- Gestione degli input (movimento, salto)
- Fisica del personaggio
- Gestione della camera

#### 3. Treasure (`treasure.js`)
- Gestisce la logica del tesoro
- Implementa le animazioni e gli effetti visivi

Responsabilità:
- Creazione del modello 3D del tesoro
- Gestione delle animazioni
- Gestione delle collisioni
- Effetti di illuminazione

#### 4. Socket (`socket.js`)
- Gestisce la comunicazione con il server
- Sincronizza lo stato del gioco

Responsabilità:
- Connessione al server
- Invio e ricezione degli aggiornamenti
- Gestione degli eventi multiplayer

### Server

#### Server (`server.js`)
- Gestisce le connessioni dei client
- Mantiene lo stato globale del gioco
- Coordina la sincronizzazione tra i giocatori

Responsabilità:
- Gestione delle connessioni WebSocket
- Mantenimento dello stato del gioco
- Broadcast degli aggiornamenti
- Gestione della logica di spawn del tesoro

## Flusso dei Dati

1. **Input del Giocatore**
```
Input Utente -> Player -> Game -> Socket -> Server
```

2. **Aggiornamento Stato**
```
Server -> Socket -> Game -> [Player/Treasure/Altri Componenti]
```

3. **Rendering**
```
Game -> Three.js Renderer -> Display
```

## Protocollo di Comunicazione

### Eventi Socket.IO

1. **Dal Client al Server**
- `playerMove`: Posizione e rotazione del giocatore
- `treasureCollected`: Notifica di raccolta tesoro

2. **Dal Server al Client**
- `gameState`: Stato iniziale del gioco
- `playerJoined`: Nuovo giocatore connesso
- `playerLeft`: Giocatore disconnesso
- `playerMoved`: Aggiornamento posizione giocatore
- `treasureUpdate`: Nuova posizione del tesoro

## Ottimizzazioni

1. **Rendering**
- Utilizzo di geometrie low-poly
- Fog per limitare la distanza di rendering
- Riutilizzo di materiali e geometrie

2. **Networking**
- Invio solo dei dati essenziali
- Rate limiting degli aggiornamenti
- Interpolazione del movimento

3. **Performance**
- Object pooling per elementi riutilizzabili
- Gestione efficiente delle collisioni
- Limitazione dell'area di gioco

## Estensibilità

Il codice è strutturato per facilitare l'aggiunta di nuove funzionalità:

1. **Nuovi Tipi di Oggetti**
- Estendere la classe base per nuovi elementi di gioco

2. **Modalità di Gioco**
- Aggiungere nuove logiche nel Game Manager

3. **Effetti Visivi**
- Sistema modulare per particelle ed effetti

4. **Power-up e Meccaniche**
- Framework flessibile per nuove interazioni 