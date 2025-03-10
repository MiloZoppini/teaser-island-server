/**
 * ScoreBoard.js
 * Componente per visualizzare il punteggio e il timer del gioco.
 * Ispirato al progetto dogfight3.
 */

class ScoreBoard {
    constructor(containerId = 'score-board') {
        this.container = document.getElementById(containerId);
        this.scoreElement = null;
        this.timerElement = null;
        this.treasureCountElement = null;
        this.score = 0;
        this.timeRemaining = 0;
        this.treasuresCollected = 0;
        
        // Se il container non esiste, crealo
        if (!this.container) {
            this.createContainer();
        } else {
            // Altrimenti, trova gli elementi esistenti
            this.scoreElement = this.container.querySelector('.score-value');
            this.timerElement = this.container.querySelector('.timer-value');
            this.treasureCountElement = this.container.querySelector('.treasure-count-value');
        }
    }
    
    /**
     * Crea il container per il punteggio e il timer
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'score-board';
        this.container.className = 'score-board';
        
        // Crea il contatore del punteggio
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'score-container';
        
        const scoreIcon = document.createElement('span');
        scoreIcon.className = 'score-icon';
        scoreIcon.innerHTML = '🏆';
        
        const scoreLabel = document.createElement('span');
        scoreLabel.className = 'score-label';
        scoreLabel.textContent = 'Punteggio:';
        
        this.scoreElement = document.createElement('span');
        this.scoreElement.className = 'score-value';
        this.scoreElement.textContent = '0';
        
        scoreContainer.appendChild(scoreIcon);
        scoreContainer.appendChild(scoreLabel);
        scoreContainer.appendChild(this.scoreElement);
        
        // Crea il timer
        const timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        
        const timerIcon = document.createElement('span');
        timerIcon.className = 'timer-icon';
        timerIcon.innerHTML = '⏱️';
        
        const timerLabel = document.createElement('span');
        timerLabel.className = 'timer-label';
        timerLabel.textContent = 'Tempo:';
        
        this.timerElement = document.createElement('span');
        this.timerElement.className = 'timer-value';
        this.timerElement.textContent = '05:00';
        
        timerContainer.appendChild(timerIcon);
        timerContainer.appendChild(timerLabel);
        timerContainer.appendChild(this.timerElement);
        
        // Crea il contatore dei tesori raccolti
        const treasureCountContainer = document.createElement('div');
        treasureCountContainer.className = 'treasure-count-container';
        
        const treasureCountIcon = document.createElement('span');
        treasureCountIcon.className = 'treasure-count-icon';
        treasureCountIcon.innerHTML = '💎';
        
        const treasureCountLabel = document.createElement('span');
        treasureCountLabel.className = 'treasure-count-label';
        treasureCountLabel.textContent = 'Tesori:';
        
        this.treasureCountElement = document.createElement('span');
        this.treasureCountElement.className = 'treasure-count-value';
        this.treasureCountElement.textContent = '0';
        
        treasureCountContainer.appendChild(treasureCountIcon);
        treasureCountContainer.appendChild(treasureCountLabel);
        treasureCountContainer.appendChild(this.treasureCountElement);
        
        // Assembla il container
        this.container.appendChild(scoreContainer);
        this.container.appendChild(timerContainer);
        this.container.appendChild(treasureCountContainer);
        
        // Aggiungi il container al DOM
        document.body.appendChild(this.container);
    }
    
    /**
     * Aggiorna il punteggio visualizzato
     * @param {number} score - Il punteggio da visualizzare
     */
    updateScore(score) {
        this.score = score;
        
        if (this.scoreElement) {
            // Animazione del punteggio
            const oldScore = parseInt(this.scoreElement.textContent);
            if (score > oldScore) {
                this.scoreElement.classList.add('score-increase');
                setTimeout(() => {
                    this.scoreElement.classList.remove('score-increase');
                }, 500);
            }
            
            this.scoreElement.textContent = score;
        }
        
        // Aggiorna anche il contatore dei tesori
        this.treasuresCollected = Math.floor(score);
        if (this.treasureCountElement) {
            this.treasureCountElement.textContent = this.treasuresCollected;
        }
    }
    
    /**
     * Aggiorna il timer visualizzato
     * @param {number} timeRemaining - Il tempo rimanente in millisecondi
     */
    updateTimer(timeRemaining) {
        this.timeRemaining = timeRemaining;
        
        if (this.timerElement) {
            // Converti il tempo in minuti e secondi
            const minutes = Math.floor(timeRemaining / 60000);
            const seconds = Math.floor((timeRemaining % 60000) / 1000);
            
            // Formatta il tempo come MM:SS
            const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Aggiungi classe per il tempo basso
            if (timeRemaining < 30000) { // Meno di 30 secondi
                this.timerElement.classList.add('timer-low');
                
                // Aggiungi pulsazione se meno di 10 secondi
                if (timeRemaining < 10000) {
                    this.timerElement.classList.add('timer-critical');
                } else {
                    this.timerElement.classList.remove('timer-critical');
                }
            } else {
                this.timerElement.classList.remove('timer-low', 'timer-critical');
            }
            
            this.timerElement.textContent = formattedTime;
        }
    }
    
    /**
     * Incrementa il punteggio
     * @param {number} points - I punti da aggiungere
     */
    addPoints(points) {
        this.updateScore(this.score + points);
    }
    
    /**
     * Incrementa il contatore dei tesori
     * @param {number} count - Il numero di tesori da aggiungere
     */
    addTreasures(count = 1) {
        this.treasuresCollected += count;
        if (this.treasureCountElement) {
            this.treasureCountElement.textContent = this.treasuresCollected;
            
            // Aggiungi animazione
            this.treasureCountElement.classList.add('treasure-increase');
            setTimeout(() => {
                this.treasureCountElement.classList.remove('treasure-increase');
            }, 500);
        }
    }
    
    /**
     * Mostra il punteggio
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }
    
    /**
     * Nasconde il punteggio
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }
}

// Esporta la classe ScoreBoard
window.ScoreBoard = ScoreBoard; 