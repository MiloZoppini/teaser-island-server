/**
 * LeaderboardDisplay.js
 * Componente per visualizzare la classifica dei giocatori.
 * Ispirato al progetto dogfight3.
 */

class LeaderboardDisplay {
    constructor(containerId = 'leaderboard-container') {
        this.container = document.getElementById(containerId);
        this.leaderboardList = null;
        this.players = [];
        this.visible = false;
        this.toggleButton = null;
        
        // Se il container non esiste, crealo
        if (!this.container) {
            this.createContainer();
        } else {
            // Altrimenti, trova gli elementi esistenti
            this.leaderboardList = this.container.querySelector('.leaderboard-list');
        }
        
        // Crea il pulsante per mostrare/nascondere la classifica
        this.createToggleButton();
        
        // Aggiungi listener per i tasti
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault(); // Previeni il comportamento predefinito del tasto Tab
                this.toggleVisibility();
            }
        });
    }
    
    /**
     * Crea il container per la classifica
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'leaderboard-container';
        this.container.className = 'leaderboard-container hidden';
        
        const leaderboardHeader = document.createElement('div');
        leaderboardHeader.className = 'leaderboard-header';
        leaderboardHeader.textContent = 'Classifica';
        
        this.leaderboardList = document.createElement('ul');
        this.leaderboardList.className = 'leaderboard-list';
        
        this.container.appendChild(leaderboardHeader);
        this.container.appendChild(this.leaderboardList);
        
        // Aggiungi il container al DOM
        document.body.appendChild(this.container);
    }
    
    /**
     * Crea il pulsante per mostrare/nascondere la classifica
     */
    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'leaderboard-toggle';
        this.toggleButton.className = 'leaderboard-toggle';
        this.toggleButton.textContent = 'Classifica (Tab)';
        
        this.toggleButton.addEventListener('click', () => {
            this.toggleVisibility();
        });
        
        // Aggiungi il pulsante al DOM
        document.body.appendChild(this.toggleButton);
    }
    
    /**
     * Aggiorna la classifica con i nuovi dati dei giocatori
     * @param {Array} players - Array di oggetti giocatore con id, nome e punteggio
     */
    updateLeaderboard(players) {
        this.players = players.sort((a, b) => b.score - a.score);
        
        if (!this.leaderboardList) return;
        
        // Svuota la lista
        this.leaderboardList.innerHTML = '';
        
        // Aggiungi ogni giocatore alla lista
        this.players.forEach((player, index) => {
            const playerItem = document.createElement('li');
            playerItem.className = 'leaderboard-item';
            
            // Aggiungi classe speciale per i primi 3
            if (index < 3) {
                playerItem.classList.add(`rank-${index + 1}`);
            }
            
            const rank = document.createElement('span');
            rank.className = 'rank';
            rank.textContent = `${index + 1}.`;
            
            const playerName = document.createElement('span');
            playerName.className = 'player-name';
            playerName.textContent = player.name;
            
            const playerScore = document.createElement('span');
            playerScore.className = 'player-score';
            playerScore.textContent = player.score;
            
            playerItem.appendChild(rank);
            playerItem.appendChild(playerName);
            playerItem.appendChild(playerScore);
            
            this.leaderboardList.appendChild(playerItem);
        });
    }
    
    /**
     * Mostra/nasconde la classifica
     */
    toggleVisibility() {
        this.visible = !this.visible;
        
        if (this.visible) {
            this.show();
        } else {
            this.hide();
        }
    }
    
    /**
     * Mostra la classifica
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
            this.visible = true;
            
            if (this.toggleButton) {
                this.toggleButton.classList.add('active');
            }
        }
    }
    
    /**
     * Nasconde la classifica
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.visible = false;
            
            if (this.toggleButton) {
                this.toggleButton.classList.remove('active');
            }
        }
    }
}

// Esporta la classe LeaderboardDisplay
window.LeaderboardDisplay = LeaderboardDisplay; 