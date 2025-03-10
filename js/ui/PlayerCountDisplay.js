/**
 * PlayerCountDisplay.js
 * Componente per visualizzare il contatore dei giocatori online.
 */

class PlayerCountDisplay {
    constructor(containerId = 'online-players-indicator', countId = 'online-players-count-hud') {
        this.container = document.getElementById(containerId);
        this.countElement = document.getElementById(countId);
        this.count = 0;
        this.updateInterval = null;
        
        // Se gli elementi non esistono, creali
        if (!this.container) {
            this.createContainer();
        }
        
        // Inizia l'aggiornamento periodico
        this.startUpdates();
    }
    
    /**
     * Crea il container per il contatore dei giocatori
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'online-players-indicator';
        this.container.className = 'online-players-indicator';
        
        this.countElement = document.createElement('span');
        this.countElement.id = 'online-players-count-hud';
        this.countElement.className = 'online-players-count';
        this.countElement.textContent = '0';
        
        const label = document.createElement('span');
        label.className = 'online-players-label';
        label.textContent = 'Giocatori online: ';
        
        this.container.appendChild(label);
        this.container.appendChild(this.countElement);
        
        // Aggiungi il container al DOM
        document.body.appendChild(this.container);
    }
    
    /**
     * Aggiorna il contatore dei giocatori
     * @param {number} count - Il numero di giocatori online
     */
    updateCount(count) {
        this.count = count;
        
        if (this.countElement) {
            this.countElement.textContent = count;
            
            // Aggiungi una classe per l'animazione
            this.countElement.classList.add('pulse');
            
            // Rimuovi la classe dopo l'animazione
            setTimeout(() => {
                this.countElement.classList.remove('pulse');
            }, 500);
        }
    }
    
    /**
     * Inizia l'aggiornamento periodico del contatore
     */
    startUpdates() {
        // Aggiorna subito
        this.fetchPlayerCount();
        
        // Imposta l'intervallo di aggiornamento (ogni 10 secondi)
        this.updateInterval = setInterval(() => {
            this.fetchPlayerCount();
        }, 10000);
    }
    
    /**
     * Ferma l'aggiornamento periodico del contatore
     */
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * Recupera il numero di giocatori online dal server
     */
    fetchPlayerCount() {
        fetch('/api/online-players')
            .then(response => response.json())
            .then(data => {
                this.updateCount(data.count);
            })
            .catch(error => {
                console.error('Errore nel recupero del conteggio dei giocatori:', error);
            });
    }
    
    /**
     * Mostra il contatore
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }
    
    /**
     * Nasconde il contatore
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }
}

// Esporta la classe PlayerCountDisplay
window.PlayerCountDisplay = PlayerCountDisplay; 