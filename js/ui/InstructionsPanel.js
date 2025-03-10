/**
 * InstructionsPanel.js
 * Componente per visualizzare le istruzioni di gioco.
 * Ispirato al progetto dogfight3.
 */

class InstructionsPanel {
    constructor(containerId = 'instructions-panel') {
        this.container = document.getElementById(containerId);
        this.visible = false;
        this.toggleButton = null;
        
        // Se il container non esiste, crealo
        if (!this.container) {
            this.createContainer();
        }
        
        // Crea il pulsante per mostrare/nascondere le istruzioni
        this.createToggleButton();
        
        // Aggiungi listener per i tasti
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.toggleVisibility();
            }
        });
    }
    
    /**
     * Crea il container per le istruzioni
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'instructions-panel';
        this.container.className = 'instructions-panel hidden';
        
        const header = document.createElement('h2');
        header.textContent = 'Istruzioni di Gioco';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.hide());
        
        const content = document.createElement('div');
        content.className = 'instructions-content';
        
        // Aggiungi le istruzioni
        content.innerHTML = `
            <div class="instructions-section">
                <h3>Controlli</h3>
                <div class="controls-grid">
                    <div class="control-item">
                        <div class="key-combo">
                            <span class="key">W</span>
                            <span class="key">A</span>
                            <span class="key">S</span>
                            <span class="key">D</span>
                        </div>
                        <span class="control-desc">Movimento</span>
                    </div>
                    <div class="control-item">
                        <div class="key-combo">
                            <span class="key">Spazio</span>
                        </div>
                        <span class="control-desc">Salto</span>
                    </div>
                    <div class="control-item">
                        <div class="key-combo">
                            <span class="key">W</span>
                            <span class="key">W</span>
                        </div>
                        <span class="control-desc">Corri</span>
                    </div>
                    <div class="control-item">
                        <div class="key-combo">
                            <span class="key">Mouse</span>
                        </div>
                        <span class="control-desc">Guarda intorno</span>
                    </div>
                    <div class="control-item">
                        <div class="key-combo">
                            <span class="key">Tab</span>
                        </div>
                        <span class="control-desc">Mostra/nascondi classifica</span>
                    </div>
                    <div class="control-item">
                        <div class="key-combo">
                            <span class="key">H</span>
                        </div>
                        <span class="control-desc">Mostra/nascondi istruzioni</span>
                    </div>
                    <div class="control-item">
                        <div class="key-combo">
                            <span class="key">ESC</span>
                        </div>
                        <span class="control-desc">Sblocca/blocca mouse</span>
                    </div>
                </div>
            </div>
            
            <div class="instructions-section">
                <h3>Obiettivo</h3>
                <p>Esplora l'isola e raccogli i tesori per guadagnare punti. Ci sono tre tipi di tesori:</p>
                <div class="treasures-grid">
                    <div class="treasure-item">
                        <div class="treasure-icon treasure-normal">🏆</div>
                        <span class="treasure-desc">Tesoro normale: 1 punto</span>
                    </div>
                    <div class="treasure-item">
                        <div class="treasure-icon treasure-blue">💎</div>
                        <span class="treasure-desc">Tesoro blu: 3 punti</span>
                    </div>
                    <div class="treasure-item">
                        <div class="treasure-icon treasure-red">💀</div>
                        <span class="treasure-desc">Tesoro rosso: 5 punti</span>
                    </div>
                </div>
            </div>
            
            <div class="instructions-section">
                <h3>Multiplayer</h3>
                <p>Competi con altri giocatori per raccogliere più tesori. Il giocatore con più punti alla fine del tempo vince!</p>
                <p>Puoi vedere gli altri giocatori sull'isola e la loro posizione nella classifica.</p>
            </div>
            
            <div class="instructions-section">
                <h3>Consigli</h3>
                <ul>
                    <li>Esplora tutta l'isola per trovare tesori nascosti</li>
                    <li>I tesori blu e rossi valgono più punti, ma sono più rari</li>
                    <li>Usa la corsa (doppio W) per muoverti più velocemente</li>
                    <li>Controlla regolarmente la classifica per vedere la tua posizione</li>
                </ul>
            </div>
        `;
        
        this.container.appendChild(closeButton);
        this.container.appendChild(header);
        this.container.appendChild(content);
        
        // Aggiungi il container al DOM
        document.body.appendChild(this.container);
    }
    
    /**
     * Crea il pulsante per mostrare/nascondere le istruzioni
     */
    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'instructions-toggle';
        this.toggleButton.className = 'instructions-toggle';
        this.toggleButton.innerHTML = '<i class="fas fa-question-circle"></i>';
        this.toggleButton.title = 'Istruzioni (H)';
        
        this.toggleButton.addEventListener('click', () => {
            this.toggleVisibility();
        });
        
        // Aggiungi il pulsante al DOM
        document.body.appendChild(this.toggleButton);
    }
    
    /**
     * Mostra/nasconde le istruzioni
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
     * Mostra le istruzioni
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
            this.visible = true;
            
            // Aggiungi animazione di entrata
            this.container.classList.add('slide-in');
            
            // Rimuovi l'animazione dopo che è completata
            setTimeout(() => {
                this.container.classList.remove('slide-in');
            }, 500);
            
            if (this.toggleButton) {
                this.toggleButton.classList.add('active');
            }
        }
    }
    
    /**
     * Nasconde le istruzioni
     */
    hide() {
        if (this.container) {
            // Aggiungi animazione di uscita
            this.container.classList.add('slide-out');
            
            // Rimuovi l'animazione e nascondi il container dopo che è completata
            setTimeout(() => {
                this.container.classList.remove('slide-out');
                this.container.classList.add('hidden');
            }, 500);
            
            this.visible = false;
            
            if (this.toggleButton) {
                this.toggleButton.classList.remove('active');
            }
        }
    }
}

// Esporta la classe InstructionsPanel
window.InstructionsPanel = InstructionsPanel; 