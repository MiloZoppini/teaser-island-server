/**
 * HealthDisplay.js
 * Componente per visualizzare la salute del giocatore.
 * Ispirato al progetto dogfight3.
 */

class HealthDisplay {
    constructor(containerId = 'health-container') {
        this.container = document.getElementById(containerId);
        this.healthBar = null;
        this.healthText = null;
        this.maxHealth = 100;
        this.currentHealth = 100;
        
        // Se il container non esiste, crealo
        if (!this.container) {
            this.createContainer();
        } else {
            // Altrimenti, trova gli elementi esistenti
            this.healthBar = this.container.querySelector('.health-bar-fill');
            this.healthText = this.container.querySelector('.health-text');
        }
        
        // Inizializza la visualizzazione
        this.updateHealth(this.currentHealth);
    }
    
    /**
     * Crea il container per la barra della salute
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'health-container';
        this.container.className = 'health-container';
        
        const healthLabel = document.createElement('div');
        healthLabel.className = 'health-label';
        healthLabel.textContent = 'Salute:';
        
        const healthBarContainer = document.createElement('div');
        healthBarContainer.className = 'health-bar-container';
        
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'health-bar-fill';
        
        this.healthText = document.createElement('div');
        this.healthText.className = 'health-text';
        this.healthText.textContent = '100%';
        
        healthBarContainer.appendChild(this.healthBar);
        healthBarContainer.appendChild(this.healthText);
        
        this.container.appendChild(healthLabel);
        this.container.appendChild(healthBarContainer);
        
        // Aggiungi il container al DOM
        document.body.appendChild(this.container);
    }
    
    /**
     * Aggiorna la visualizzazione della salute
     * @param {number} health - Il valore della salute (0-100)
     */
    updateHealth(health) {
        this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));
        const percentage = (this.currentHealth / this.maxHealth) * 100;
        
        if (this.healthBar) {
            this.healthBar.style.width = `${percentage}%`;
            
            // Cambia il colore in base alla salute
            if (percentage > 60) {
                this.healthBar.style.backgroundColor = '#4CAF50'; // Verde
            } else if (percentage > 30) {
                this.healthBar.style.backgroundColor = '#FFC107'; // Giallo
            } else {
                this.healthBar.style.backgroundColor = '#F44336'; // Rosso
            }
        }
        
        if (this.healthText) {
            this.healthText.textContent = `${Math.round(percentage)}%`;
        }
        
        // Aggiungi effetto di danno se la salute è bassa
        if (percentage < 30) {
            document.body.classList.add('low-health');
        } else {
            document.body.classList.remove('low-health');
        }
    }
    
    /**
     * Imposta il valore massimo della salute
     * @param {number} maxHealth - Il valore massimo della salute
     */
    setMaxHealth(maxHealth) {
        this.maxHealth = maxHealth;
        this.updateHealth(this.currentHealth);
    }
    
    /**
     * Applica danno al giocatore
     * @param {number} damage - La quantità di danno da applicare
     */
    applyDamage(damage) {
        this.updateHealth(this.currentHealth - damage);
        
        // Aggiungi effetto visivo di danno
        const damageEffect = document.createElement('div');
        damageEffect.className = 'damage-effect';
        document.body.appendChild(damageEffect);
        
        // Rimuovi l'effetto dopo l'animazione
        setTimeout(() => {
            document.body.removeChild(damageEffect);
        }, 500);
    }
    
    /**
     * Ripristina la salute del giocatore
     * @param {number} amount - La quantità di salute da ripristinare
     */
    heal(amount) {
        this.updateHealth(this.currentHealth + amount);
        
        // Aggiungi effetto visivo di cura
        const healEffect = document.createElement('div');
        healEffect.className = 'heal-effect';
        document.body.appendChild(healEffect);
        
        // Rimuovi l'effetto dopo l'animazione
        setTimeout(() => {
            document.body.removeChild(healEffect);
        }, 500);
    }
    
    /**
     * Mostra la barra della salute
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }
    
    /**
     * Nasconde la barra della salute
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }
}

// Esporta la classe HealthDisplay
window.HealthDisplay = HealthDisplay; 