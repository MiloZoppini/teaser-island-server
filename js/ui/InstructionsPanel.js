/**
 * InstructionsPanel.js
 * Componente per visualizzare le istruzioni del gioco.
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
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => this.hide());
        
        const content = document.createElement('div');
        content.className = 'instructions-content';
        
        // Aggiungi le istruzioni
        content.innerHTML = `
            <h3>Controlli</h3>
            <ul>
                <li><strong>W, A, S, D</strong> - Movimento</li>
                <li><strong>Spazio</strong> - Salto</li>
                <li><strong>Doppio W</strong> - Corri</li>
                <li><strong>Mouse</strong> - Guarda intorno</li>
                <li><strong>Tab</strong> - Mostra/nascondi classifica</li>
                <li><strong>H</strong> - Mostra/nascondi istruzioni</li>
                <li><strong>ESC</strong> - Sblocca/blocca mouse</li>
            </ul>
            
            <h3>Obiettivo</h3>
            <p>Esplora l'isola e raccogli i tesori per guadagnare punti. Ci sono tre tipi di tesori:</p>
            <ul>
                <li><strong>Tesoro normale (🏆)</strong> - 1 punto</li>
                <li><strong>Tesoro blu (💎)</strong> - 3 punti</li>
                <li><strong>Tesoro rosso (💀)</strong> - 5 punti</li>
            </ul>
            
            <h3>Multiplayer</h3>
            <p>Competi con altri giocatori per raccogliere più tesori. Il giocatore con più punti alla fine del tempo vince!</p>
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
        this.toggleButton.textContent = '?';
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
            this.container.classList.add('hidden');
            this.visible = false;
            
            if (this.toggleButton) {
                this.toggleButton.classList.remove('active');
            }
        }
    }
}

// Esporta la classe InstructionsPanel
window.InstructionsPanel = InstructionsPanel; 