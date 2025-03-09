#!/bin/bash

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniziando il processo di deploy...${NC}"

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js non trovato. Per favore installa Node.js${NC}"
    exit 1
fi

# Verifica npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm non trovato. Per favore installa npm${NC}"
    exit 1
fi

# Vai alla directory del progetto
cd ..

# Installa le dipendenze
echo -e "${YELLOW}Installando le dipendenze...${NC}"
npm install --production

if [ $? -ne 0 ]; then
    echo -e "${RED}Errore nell'installazione delle dipendenze${NC}"
    exit 1
fi

# Crea cartella di build se non esiste
mkdir -p dist

# Copia i file necessari
echo -e "${YELLOW}Copiando i file...${NC}"
cp -r public dist/
cp -r js dist/
cp -r server dist/
cp package.json dist/
cp package-lock.json dist/

# Crea file .env se non esiste
if [ ! -f dist/.env ]; then
    echo "PORT=3000" > dist/.env
    echo "NODE_ENV=production" >> dist/.env
fi

# Comprimi la cartella dist
echo -e "${YELLOW}Creando l'archivio...${NC}"
cd dist
zip -r ../deploy-temp/deploy.zip .

if [ $? -ne 0 ]; then
    echo -e "${RED}Errore nella creazione dell'archivio${NC}"
    exit 1
fi

echo -e "${GREEN}Deploy completato con successo!${NC}"
echo -e "${YELLOW}L'archivio deploy.zip è stato creato nella cartella deploy-temp${NC}"
echo -e "${YELLOW}Per avviare il server in produzione:${NC}"
echo -e "1. Estrai deploy.zip sul server"
echo -e "2. Esegui 'npm install --production'"
echo -e "3. Avvia con 'npm start'" 