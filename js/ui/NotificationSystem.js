/**
 * NotificationSystem.js
 * Sistema di notifiche per il gioco.
 * Ispirato al progetto dogfight3.
 */

class NotificationSystem {
    constructor(containerId = 'notifications-container') {
        this.container = document.getElementById(containerId);
        this.notifications = [];
        this.maxNotifications = 5;
        
        // Se il container non esiste, crealo
        if (!this.container) {
            this.createContainer();
        }
    }
    
    /**
     * Crea il container per le notifiche
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
    }
    
    /**
     * Mostra una notifica
     * @param {string} message - Il messaggio da mostrare
     * @param {string} type - Il tipo di notifica (info, success, warning, error)
     * @param {number} duration - La durata in millisecondi
     */
    show(message, type = 'info', duration = 3000) {
        // Crea l'elemento della notifica
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Aggiungi l'icona in base al tipo
        const icon = document.createElement('span');
        icon.className = 'notification-icon';
        
        switch (type) {
            case 'success':
                icon.textContent = '✓';
                break;
            case 'warning':
                icon.textContent = '⚠';
                break;
            case 'error':
                icon.textContent = '✗';
                break;
            case 'info':
            default:
                icon.textContent = 'ℹ';
                break;
        }
        
        // Aggiungi il messaggio
        const messageElement = document.createElement('span');
        messageElement.className = 'notification-message';
        messageElement.textContent = message;
        
        // Aggiungi il pulsante di chiusura
        const closeButton = document.createElement('span');
        closeButton.className = 'notification-close';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => {
            this.hide(notification);
        });
        
        // Assembla la notifica
        notification.appendChild(icon);
        notification.appendChild(messageElement);
        notification.appendChild(closeButton);
        
        // Aggiungi la notifica al container
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Limita il numero di notifiche
        if (this.notifications.length > this.maxNotifications) {
            this.hide(this.notifications[0]);
        }
        
        // Animazione di entrata
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Imposta il timer per la rimozione automatica
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }
        
        return notification;
    }
    
    /**
     * Nasconde una notifica
     * @param {HTMLElement} notification - L'elemento della notifica da nascondere
     */
    hide(notification) {
        if (!notification || !this.container.contains(notification)) return;
        
        // Animazione di uscita
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        // Rimuovi la notifica dall'array
        const index = this.notifications.indexOf(notification);
        if (index !== -1) {
            this.notifications.splice(index, 1);
        }
        
        // Rimuovi l'elemento dal DOM dopo l'animazione
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
        }, 300);
    }
    
    /**
     * Mostra una notifica di successo
     * @param {string} message - Il messaggio da mostrare
     * @param {number} duration - La durata in millisecondi
     */
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }
    
    /**
     * Mostra una notifica di avviso
     * @param {string} message - Il messaggio da mostrare
     * @param {number} duration - La durata in millisecondi
     */
    warning(message, duration = 3000) {
        return this.show(message, 'warning', duration);
    }
    
    /**
     * Mostra una notifica di errore
     * @param {string} message - Il messaggio da mostrare
     * @param {number} duration - La durata in millisecondi
     */
    error(message, duration = 3000) {
        return this.show(message, 'error', duration);
    }
    
    /**
     * Mostra una notifica informativa
     * @param {string} message - Il messaggio da mostrare
     * @param {number} duration - La durata in millisecondi
     */
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
    
    /**
     * Rimuove tutte le notifiche
     */
    clearAll() {
        // Crea una copia dell'array per evitare problemi durante l'iterazione
        const notificationsCopy = [...this.notifications];
        
        // Nascondi tutte le notifiche
        notificationsCopy.forEach(notification => {
            this.hide(notification);
        });
    }
}

// Esporta la classe NotificationSystem
window.NotificationSystem = NotificationSystem; 