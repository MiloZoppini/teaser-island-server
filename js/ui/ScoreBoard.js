/**
 * ScoreBoard.js
 * Componente per visualizzare il punteggio e il timer del gioco.
 * Ispirato al progetto dogfight3.
 */

class ScoreBoard {
    constructor() {
        this.container = null;
        this.scoreElement = null;
        this.timerElement = null;
        this.score = 0;
        this.timeRemaining = 0;
        
        // Crea il container e gli elementi
        this.createElements();
    }
    
    /**
     * Crea gli elementi del tabellone
     */
    createElements() {
        // Crea il container principale
        this.container = document.createElement('div');
        this.container.id = 'score-board';
        this.container.className = 'score-board';
        
        // Crea il container per il punteggio
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'score-container';
        
        const scoreLabel = document.createElement('span');
        scoreLabel.className = 'score-label';
        scoreLabel.textContent = 'Tesori:';
        
        this.scoreElement = document.createElement('span');
        this.scoreElement.className = 'score-value';
        this.scoreElement.textContent = '0';
        
        scoreContainer.appendChild(scoreLabel);
        scoreContainer.appendChild(this.scoreElement);
        
        // Crea il container per il timer
        const timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        
        const timerLabel = document.createElement('span');
        timerLabel.className = 'timer-label';
        timerLabel.textContent = 'Tempo:';
        
        this.timerElement = document.createElement('span');
        this.timerElement.className = 'timer-value';
        this.timerElement.textContent = '05:00';
        
        timerContainer.appendChild(timerLabel);
        timerContainer.appendChild(this.timerElement);
        
        // Aggiungi gli elementi al container principale
        this.container.appendChild(scoreContainer);
        this.container.appendChild(timerContainer);
        
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
            this.scoreElement.textContent = score;
            
            // Aggiungi un'animazione per evidenziare il cambiamento
            this.scoreElement.classList.remove('score-changed');
            void this.scoreElement.offsetWidth; // Forza il reflow
            this.scoreElement.classList.add('score-changed');
        }
    }
    
    /**
     * Aggiorna il timer visualizzato
     * @param {number} timeRemaining - Il tempo rimanente in millisecondi
     */
    updateTimer(timeRemaining) {
        this.timeRemaining = timeRemaining;
        
        if (this.timerElement) {
            const minutes = Math.floor(timeRemaining / 60000);
            const seconds = Math.floor((timeRemaining % 60000) / 1000);
            
            this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Cambia il colore in base al tempo rimanente
            if (timeRemaining < 30000) { // Meno di 30 secondi
                this.timerElement.classList.add('timer-critical');
            } else if (timeRemaining < 60000) { // Meno di 1 minuto
                this.timerElement.classList.add('timer-warning');
                this.timerElement.classList.remove('timer-critical');
            } else {
                this.timerElement.classList.remove('timer-warning', 'timer-critical');
            }
            
            // Aggiungi un'animazione lampeggiante se il tempo è quasi scaduto
            if (timeRemaining < 10000) { // Meno di 10 secondi
                this.timerElement.classList.add('timer-blink');
            } else {
                this.timerElement.classList.remove('timer-blink');
            }
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
     * Mostra il tabellone
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }
    
    /**
     * Nasconde il tabellone
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }
    
    /**
     * Resetta il punteggio e il timer
     */
    reset() {
        this.updateScore(0);
        this.updateTimer(300000); // 5 minuti
    }
}

// Esporta la classe ScoreBoard
window.ScoreBoard = ScoreBoard; 