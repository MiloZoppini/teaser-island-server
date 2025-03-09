# Teaser Island

Un gioco multiplayer 3D di caccia al tesoro con Three.js e Socket.IO.

## Caratteristiche

- Grafica 3D con Three.js
- Multiplayer in tempo reale con Socket.IO
- Sistema di lobby e matchmaking
- Tesori normali, bonus e malus
- Nuvole realistiche e ambiente immersivo

## Come giocare

1. Visita il gioco online: [Teaser Island](https://teaser-island-server.onrender.com)
2. Attendi nella lobby finché non ci sono abbastanza giocatori
3. Esplora l'isola mentre aspetti
4. Quando la partita inizia, cerca e raccogli i tesori
5. Dopo aver raccolto 3 tesori normali, appariranno tesori bonus (blu, +2 punti) e malus (rosso, -1 punto)

## Sviluppo locale

```bash
# Clona il repository
git clone https://github.com/MiloZoppini/teaser-island-server.git
cd teaser-island-server

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

Visita `http://localhost:3000` nel tuo browser.

## Tecnologie utilizzate

- Three.js per la grafica 3D
- Socket.IO per la comunicazione in tempo reale
- Node.js e Express per il server
- Render.com per il deployment 