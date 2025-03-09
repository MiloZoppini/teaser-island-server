# Caccia al Tesoro 3D Multiplayer

Un gioco multiplayer 3D di caccia al tesoro realizzato con Three.js e Socket.IO. I giocatori esplorano un'isola low-poly alla ricerca di un tesoro che brilla nel buio della notte.

![Screenshot del gioco](screenshot.png)

## Caratteristiche

- **Grafica 3D Low-Poly**: Stile visivo semplice e accattivante con modelli low-poly
- **Ambientazione Notturna**: Isola deserta illuminata dalla luna con un mare infinito
- **Multiplayer in Tempo Reale**: Gioca con altri giocatori attraverso Socket.IO
- **Fisica Semplice**: Sistema di movimento e collisioni basilare ma funzionale
- **Interfaccia Minimalista**: HUD essenziale con punteggio e timer

## Controlli

- **W/A/S/D** o **Frecce**: Movimento del personaggio
- **Mouse**: Rotazione della visuale
- **Spazio**: Salto
- **Shift**: Zoom della camera (opzionale)

## Obiettivo

Raccogli più tesori possibili prima che scada il tempo di 10 minuti. Il tesoro riappare in una nuova posizione casuale ogni volta che viene raccolto.

## Tecnologie Utilizzate

- **Three.js**: Rendering 3D
- **Socket.IO**: Comunicazione multiplayer in tempo reale
- **Node.js**: Server backend
- **Express**: Web server

## Installazione

Vedi [Istruzioni per il Deploy](deploy-instructions.md) per i dettagli sull'installazione e l'esecuzione del gioco.

## Struttura del Progetto

```
treasure-hunt-game/
├── js/
│   ├── game.js      # Logica principale del gioco
│   ├── player.js    # Gestione dei personaggi
│   ├── treasure.js  # Logica del tesoro
│   └── socket.js    # Gestione delle connessioni
├── public/
│   ├── index.html   # Pagina principale
│   └── style.css    # Stili
├── server/
│   └── server.js    # Server Node.js
└── docs/           # Documentazione
```

## Contribuire

1. Fai un fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/nome-feature`)
3. Committa i tuoi cambiamenti (`git commit -am 'Aggiungi feature'`)
4. Pusha al branch (`git push origin feature/nome-feature`)
5. Crea una Pull Request

## Licenza

Questo progetto è distribuito sotto la licenza MIT. Vedi il file `LICENSE` per i dettagli.

## Autori

- Nome Autore - [GitHub](https://github.com/username)

## Ringraziamenti

- Ispirato al post su X di [@nicolaszu](https://x.com/nicolaszu/status/1898130528567804366)
- Basato sulla struttura del repository [dogfight3](https://github.com/EnzeD/dogfight3) 