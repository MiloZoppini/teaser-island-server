/**
 * UIManager.js
 * Gestisce tutti i componenti dell'interfaccia utente del gioco.
 * Ispirato al progetto dogfight3.
 */

class UIManager {
    constructor() {
        this.components = new Map();
        this.initialized = false;
        
        // Riferimenti agli elementi DOM principali
        this.hudElement = document.getElementById('hud') || this.createHUDElement();
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.lobbyElement = document.getElementById('lobby-screen');
        this.gameOverElement = document.getElementById('game-over');
        
        // Inizializza i componenti UI
        this.init();
    }
    
    /**
     * Crea l'elemento HUD principale se non esiste
     * @returns {HTMLElement} L'elemento HUD creato
     */
    createHUDElement() {
        const hud = document.createElement('div');
        hud.id = 'hud';
        hud.className = 'hud';
        document.body.appendChild(hud);
        return hud;
    }
    
    /**
     * Inizializza tutti i componenti dell'interfaccia utente
     */
    init() {
        if (this.initialized) return;
        
        // Crea i componenti UI
        this.playerCount = new PlayerCountDisplay();
        this.components.set('playerCount', this.playerCount);
        
        this.healthDisplay = new HealthDisplay();
        this.components.set('healthDisplay', this.healthDisplay);
        
        this.leaderboard = new LeaderboardDisplay();
        this.components.set('leaderboard', this.leaderboard);
        
        this.instructions = new InstructionsPanel();
        this.components.set('instructions', this.instructions);
        
        this.notifications = new NotificationSystem();
        this.components.set('notifications', this.notifications);
        
        this.scoreBoard = new ScoreBoard();
        this.components.set('scoreBoard', this.scoreBoard);
        
        // Aggiungi listener per gli eventi della finestra
        window.addEventListener('resize', () => this.onResize());
        
        // Mostra le istruzioni all'avvio
        setTimeout(() => {
            this.instructions.show();
        }, 1000);
        
        this.initialized = true;
        console.log('UI Manager inizializzato');
    }
    
    /**
     * Aggiorna il punteggio visualizzato
     * @param {number} score - Il punteggio da visualizzare
     */
    updateScore(score) {
        const scoreBoard = this.components.get('scoreBoard');
        if (scoreBoard) {
            scoreBoard.updateScore(score);
        }
    }
    
    /**
     * Aggiorna il timer visualizzato
     * @param {number} timeRemaining - Il tempo rimanente in millisecondi
     */
    updateTimer(timeRemaining) {
        const scoreBoard = this.components.get('scoreBoard');
        if (scoreBoard) {
            scoreBoard.updateTimer(timeRemaining);
        }
    }
    
    /**
     * Aggiorna la classifica
     * @param {Array} players - Array di oggetti giocatore con id, nome e punteggio
     */
    updateLeaderboard(players) {
        const leaderboard = this.components.get('leaderboard');
        if (leaderboard) {
            leaderboard.updateLeaderboard(players);
        }
    }
    
    /**
     * Aggiorna il contatore dei giocatori online
     * @param {number} count - Il numero di giocatori online
     */
    updateOnlinePlayersCount(count) {
        const playerCount = this.components.get('playerCount');
        if (playerCount) {
            playerCount.updateCount(count);
        }
    }
    
    /**
     * Aggiorna la salute del giocatore
     * @param {number} health - Il valore della salute (0-100)
     */
    updateHealth(health) {
        const healthDisplay = this.components.get('healthDisplay');
        if (healthDisplay) {
            healthDisplay.updateHealth(health);
        }
    }
    
    /**
     * Mostra un messaggio di notifica
     * @param {string} message - Il messaggio da mostrare
     * @param {string} type - Il tipo di notifica (info, success, warning, error)
     * @param {number} duration - La durata in millisecondi
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notifications = this.components.get('notifications');
        if (notifications) {
            notifications.show(message, type, duration);
        }
    }
    
    /**
     * Mostra un messaggio per il tesoro raccolto
     * @param {string} type - Il tipo di tesoro (normal, blue, red)
     * @param {number} points - I punti guadagnati/persi
     */
    showTreasureMessage(type, points) {
        const notifications = this.components.get('notifications');
        if (notifications) {
            let message = '';
            let notificationType = 'info';
            
            switch (type) {
                case 'normal':
                    message = `Hai trovato un tesoro! +${points} punti`;
                    notificationType = 'success';
                    break;
                case 'blue':
                    message = `Hai trovato un tesoro blu! +${points} punti`;
                    notificationType = 'info';
                    break;
                case 'red':
                    message = `Hai trovato un tesoro raro! +${points} punti`;
                    notificationType = 'warning';
                    break;
                default:
                    message = `Hai trovato un tesoro! +${points} punti`;
                    notificationType = 'success';
            }
            
            notifications.show(message, notificationType, 2000);
        }
    }
    
    /**
     * Mostra la schermata di fine partita
     * @param {Object} data - Dati di fine partita
     */
    showGameOver(data) {
        if (this.gameOverElement) {
            const winnerText = document.getElementById('winner-text');
            if (winnerText) {
                winnerText.textContent = `Vincitore: ${data.winnerName} con ${data.winnerScore} tesori!`;
            }
            
            this.gameOverElement.classList.remove('hidden');
            
            // Mostra una notifica
            this.showNotification('Partita terminata!', 'info', 5000);
        }
    }
    
    /**
     * Mostra la schermata della lobby
     * @param {Object} data - Dati della lobby
     */
    showLobby(data) {
        if (this.lobbyElement) {
            const playersCount = document.getElementById('players-count');
            if (playersCount) {
                playersCount.textContent = data.count || 0;
            }
            
            const maxPlayers = document.getElementById('max-players');
            if (maxPlayers) {
                maxPlayers.textContent = data.maxPlayers || 4;
            }
            
            const progressBar = document.getElementById('lobby-progress');
            if (progressBar) {
                const progressPercentage = ((data.count || 0) / (data.maxPlayers || 4)) * 100;
                progressBar.style.width = `${progressPercentage}%`;
            }
            
            this.lobbyElement.classList.remove('hidden');
            
            // Mostra una notifica
            this.showNotification('In attesa di altri giocatori...', 'info', 3000);
        }
    }
    
    /**
     * Nasconde la schermata della lobby
     */
    hideLobby() {
        if (this.lobbyElement) {
            this.lobbyElement.classList.add('hidden');
            
            // Mostra una notifica
            this.showNotification('Partita iniziata!', 'success', 3000);
        }
    }
    
    /**
     * Gestisce il ridimensionamento della finestra
     */
    onResize() {
        // Aggiorna la posizione dei componenti UI
        this.components.forEach(component => {
            if (component.onResize) {
                component.onResize();
            }
        });
    }
}

// Esporta la classe UIManager
window.UIManager = UIManager; 