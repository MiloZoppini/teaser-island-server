/**
 * UIManager.js
 * Gestisce tutti i componenti dell'interfaccia utente del gioco.
 * Ispirato al progetto dogfight3.
 */

class UIManager {
    constructor() {
        this.components = new Map();
        this.initialized = false;
        this.theme = 'dark'; // Tema predefinito: dark o light
        
        // Riferimenti agli elementi DOM principali
        this.hudElement = document.getElementById('hud') || this.createHUDElement();
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.lobbyElement = document.getElementById('lobby-screen');
        this.gameOverElement = document.getElementById('game-over');
        
        // Crea il container principale per l'UI se non esiste
        this.mainContainer = document.getElementById('ui-container') || this.createMainContainer();
        
        // Inizializza i componenti UI
        this.init();
        
        // Applica il tema corrente
        this.applyTheme(this.theme);
    }
    
    /**
     * Crea il container principale per l'UI
     * @returns {HTMLElement} Il container principale
     */
    createMainContainer() {
        const container = document.createElement('div');
        container.id = 'ui-container';
        container.className = 'ui-container';
        document.body.appendChild(container);
        return container;
    }
    
    /**
     * Crea l'elemento HUD principale se non esiste
     * @returns {HTMLElement} L'elemento HUD creato
     */
    createHUDElement() {
        const hud = document.createElement('div');
        hud.id = 'hud';
        hud.className = 'hud';
        this.mainContainer.appendChild(hud);
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
        
        // Crea il menu delle impostazioni
        this.createSettingsMenu();
        
        // Aggiungi listener per gli eventi della finestra
        window.addEventListener('resize', () => this.onResize());
        
        // Aggiungi listener per i tasti di scelta rapida
        this.setupKeyboardShortcuts();
        
        // Mostra le istruzioni all'avvio
        setTimeout(() => {
            this.instructions.show();
        }, 1000);
        
        this.initialized = true;
        console.log('UI Manager inizializzato');
    }
    
    /**
     * Crea il menu delle impostazioni
     */
    createSettingsMenu() {
        const settingsButton = document.createElement('button');
        settingsButton.id = 'settings-button';
        settingsButton.className = 'settings-button';
        settingsButton.innerHTML = '<i class="fas fa-cog"></i>';
        settingsButton.title = 'Impostazioni';
        
        const settingsMenu = document.createElement('div');
        settingsMenu.id = 'settings-menu';
        settingsMenu.className = 'settings-menu hidden';
        
        // Opzioni del tema
        const themeOption = document.createElement('div');
        themeOption.className = 'settings-option';
        
        const themeLabel = document.createElement('span');
        themeLabel.textContent = 'Tema:';
        
        const themeSelect = document.createElement('select');
        themeSelect.id = 'theme-select';
        
        const darkOption = document.createElement('option');
        darkOption.value = 'dark';
        darkOption.textContent = 'Scuro';
        
        const lightOption = document.createElement('option');
        lightOption.value = 'light';
        lightOption.textContent = 'Chiaro';
        
        themeSelect.appendChild(darkOption);
        themeSelect.appendChild(lightOption);
        themeSelect.value = this.theme;
        
        themeSelect.addEventListener('change', () => {
            this.applyTheme(themeSelect.value);
        });
        
        themeOption.appendChild(themeLabel);
        themeOption.appendChild(themeSelect);
        
        // Opzione per la qualità grafica
        const qualityOption = document.createElement('div');
        qualityOption.className = 'settings-option';
        
        const qualityLabel = document.createElement('span');
        qualityLabel.textContent = 'Qualità grafica:';
        
        const qualitySelect = document.createElement('select');
        qualitySelect.id = 'quality-select';
        
        const lowOption = document.createElement('option');
        lowOption.value = 'low';
        lowOption.textContent = 'Bassa';
        
        const mediumOption = document.createElement('option');
        mediumOption.value = 'medium';
        mediumOption.textContent = 'Media';
        
        const highOption = document.createElement('option');
        highOption.value = 'high';
        highOption.textContent = 'Alta';
        
        qualitySelect.appendChild(lowOption);
        qualitySelect.appendChild(mediumOption);
        qualitySelect.appendChild(highOption);
        qualitySelect.value = 'medium'; // Valore predefinito
        
        qualitySelect.addEventListener('change', () => {
            // Emetti un evento personalizzato per la modifica della qualità
            const event = new CustomEvent('quality-change', { detail: qualitySelect.value });
            window.dispatchEvent(event);
        });
        
        qualityOption.appendChild(qualityLabel);
        qualityOption.appendChild(qualitySelect);
        
        // Aggiungi le opzioni al menu
        settingsMenu.appendChild(themeOption);
        settingsMenu.appendChild(qualityOption);
        
        // Aggiungi il pulsante e il menu al DOM
        this.mainContainer.appendChild(settingsButton);
        this.mainContainer.appendChild(settingsMenu);
        
        // Aggiungi l'evento per mostrare/nascondere il menu
        settingsButton.addEventListener('click', () => {
            settingsMenu.classList.toggle('hidden');
        });
        
        // Chiudi il menu quando si fa clic altrove
        document.addEventListener('click', (event) => {
            if (!settingsMenu.contains(event.target) && event.target !== settingsButton) {
                settingsMenu.classList.add('hidden');
            }
        });
    }
    
    /**
     * Configura le scorciatoie da tastiera
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Mostra/nascondi le istruzioni con il tasto H
            if (event.key === 'h' || event.key === 'H') {
                const instructions = this.components.get('instructions');
                if (instructions) {
                    instructions.toggleVisibility();
                }
            }
            
            // Mostra/nascondi le impostazioni con il tasto S
            if (event.key === 's' || event.key === 'S') {
                const settingsMenu = document.getElementById('settings-menu');
                if (settingsMenu) {
                    settingsMenu.classList.toggle('hidden');
                }
            }
        });
    }
    
    /**
     * Applica il tema selezionato
     * @param {string} theme - Il tema da applicare ('dark' o 'light')
     */
    applyTheme(theme) {
        this.theme = theme;
        document.body.classList.remove('theme-dark', 'theme-light');
        document.body.classList.add(`theme-${theme}`);
        
        // Salva la preferenza nel localStorage
        localStorage.setItem('ui-theme', theme);
        
        // Aggiorna il selettore del tema
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
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
     * Mostra una notifica
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
     * @param {string} type - Il tipo di tesoro raccolto
     * @param {number} points - I punti guadagnati
     */
    showTreasureMessage(type, points) {
        let message = '';
        let notificationType = 'info';
        
        switch (type) {
            case 'normal':
                message = `Hai trovato un tesoro! +${points} punto`;
                notificationType = 'success';
                break;
            case 'blue':
                message = `Hai trovato un tesoro blu! +${points} punti`;
                notificationType = 'info';
                break;
            case 'red':
                message = `Hai trovato un tesoro rosso! +${points} punti`;
                notificationType = 'warning';
                break;
            default:
                message = `Hai trovato un tesoro sconosciuto! +${points} punto`;
                break;
        }
        
        this.showNotification(message, notificationType, 2000);
        
        // Mostra anche un effetto visivo
        const treasureEffect = document.createElement('div');
        treasureEffect.className = `treasure-effect treasure-${type}`;
        treasureEffect.textContent = `+${points}`;
        
        this.mainContainer.appendChild(treasureEffect);
        
        // Rimuovi l'effetto dopo l'animazione
        setTimeout(() => {
            if (treasureEffect.parentNode === this.mainContainer) {
                this.mainContainer.removeChild(treasureEffect);
            }
        }, 1500);
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
            
            // Aggiungi un effetto di confetti per il vincitore
            this.showConfetti();
        }
    }
    
    /**
     * Mostra un effetto di confetti per celebrare la vittoria
     */
    showConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        
        // Crea 50 pezzi di confetti
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Colore casuale
            const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.backgroundColor = color;
            
            // Posizione e animazione casuali
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.animationDelay = `${Math.random() * 5}s`;
            confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
            
            confettiContainer.appendChild(confetti);
        }
        
        this.mainContainer.appendChild(confettiContainer);
        
        // Rimuovi l'effetto dopo 5 secondi
        setTimeout(() => {
            if (confettiContainer.parentNode === this.mainContainer) {
                this.mainContainer.removeChild(confettiContainer);
            }
        }, 5000);
    }
    
    /**
     * Mostra la schermata della lobby
     * @param {Object} data - Dati della lobby
     */
    showLobby(data) {
        if (this.lobbyElement) {
            // Aggiorna i dati della lobby
            const playersCount = this.lobbyElement.querySelector('#players-count');
            if (playersCount) {
                playersCount.textContent = data.count || 0;
            }
            
            const maxPlayers = this.lobbyElement.querySelector('#max-players');
            if (maxPlayers) {
                maxPlayers.textContent = data.maxPlayers || 4;
            }
            
            const progressBar = this.lobbyElement.querySelector('#lobby-progress');
            if (progressBar) {
                const progressPercentage = ((data.count || 0) / (data.maxPlayers || 4)) * 100;
                progressBar.style.width = `${progressPercentage}%`;
            }
            
            // Mostra la lobby
            this.lobbyElement.classList.remove('hidden');
            
            // Mostra una notifica
            this.showNotification('In attesa di altri giocatori...', 'info');
        }
    }
    
    /**
     * Nasconde la schermata della lobby
     */
    hideLobby() {
        if (this.lobbyElement) {
            this.lobbyElement.classList.add('hidden');
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