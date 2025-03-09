# Istruzioni per il Deploy

## Requisiti
- Node.js (versione 14.x o superiore)
- npm (incluso con Node.js)

## Installazione Locale

1. Clona il repository:
```bash
git clone <url-repository>
cd treasure-hunt-game
```

2. Installa le dipendenze:
```bash
npm install
```

3. Avvia il server in modalità sviluppo:
```bash
npm run dev
```

4. Apri il browser e vai all'indirizzo:
```
http://localhost:3000
```

## Deploy in Produzione

1. Assicurati che tutte le dipendenze siano installate:
```bash
npm install --production
```

2. Avvia il server in modalità produzione:
```bash
npm start
```

## Note per il Deploy

- Il gioco utilizza WebSocket tramite Socket.IO, assicurati che il tuo server supporti le connessioni WebSocket
- La porta predefinita è 3000, ma può essere modificata impostando la variabile d'ambiente PORT
- Per il deploy su servizi cloud (Heroku, DigitalOcean, ecc.), segui le loro specifiche guide per il deploy di applicazioni Node.js

## Variabili d'Ambiente

- `PORT`: Porta su cui il server ascolta (default: 3000)
- `NODE_ENV`: Ambiente di esecuzione ('development' o 'production')

## Struttura dei File

```
treasure-hunt-game/
├── js/              # File JavaScript client
├── public/          # File statici (HTML, CSS)
├── server/          # Codice del server
└── package.json     # Dipendenze e script
```

## Troubleshooting

Se incontri problemi:

1. Verifica che tutte le dipendenze siano installate correttamente
2. Controlla i log del server per eventuali errori
3. Assicurati che la porta 3000 non sia già in uso
4. Verifica che il browser supporti WebGL 