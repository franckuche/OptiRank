/**
 * Content Script Event Manager - Standard et Simple
 * Gestion automatique du cleanup lors du déchargement
 */

class ContentEventManager {
  constructor() {
    this.listeners = new Map();
    this.timers = new Set();
    this.observers = new Set();
    this.setupAutoCleanup();
    
    logger.debug('EventManager initialized');
  }

  /**
   * Ajouter un event listener avec cleanup automatique
   */
  on(element, event, handler, options = false) {
    if (!element || !event || !handler) {
      logger.error('EventManager: Invalid parameters for addEventListener');
      return null;
    }

    const id = this.generateId();
    const listenerInfo = { element, event, handler, options };
    
    this.listeners.set(id, listenerInfo);
    element.addEventListener(event, handler, options);
    
    logger.debug(`Event listener added: ${event} (${id})`);
    return id;
  }

  /**
   * Supprimer un event listener
   */
  off(id) {
    const info = this.listeners.get(id);
    if (!info) return false;

    info.element.removeEventListener(info.event, info.handler, info.options);
    this.listeners.delete(id);
    
    logger.debug(`Event listener removed: ${info.event} (${id})`);
    return true;
  }

  /**
   * Ajouter un timer avec cleanup automatique
   */
  setTimeout(callback, delay) {
    const id = originalSetTimeout((...args) => {
      this.timers.delete(id);
      callback(...args);
    }, delay);
    
    this.timers.add(id);
    return id;
  }

  setInterval(callback, delay) {
    const id = originalSetInterval(callback, delay);
    this.timers.add(id);
    return id;
  }

  /**
   * Supprimer un timer
   */
  clearTimeout(id) {
    originalClearTimeout(id);
    this.timers.delete(id);
  }

  clearInterval(id) {
    originalClearInterval(id);
    this.timers.delete(id);
  }

  /**
   * Ajouter un observer avec cleanup automatique
   */
  addObserver(observer) {
    this.observers.add(observer);
    return observer;
  }

  /**
   * Cleanup complet
   */
  cleanup() {
    // Nettoyer les event listeners
    for (const [id, info] of this.listeners) {
      info.element.removeEventListener(info.event, info.handler, info.options);
    }
    this.listeners.clear();

    // Nettoyer les timers
    for (const id of this.timers) {
      originalClearTimeout(id);
      originalClearInterval(id);
    }
    this.timers.clear();

    // Nettoyer les observers
    for (const observer of this.observers) {
      if (observer.disconnect) observer.disconnect();
      if (observer.unobserve) observer.unobserve();
    }
    this.observers.clear();

    logger.debug('EventManager: Cleanup completed');
  }

  /**
   * Configuration du cleanup automatique
   */
  setupAutoCleanup() {
    // Cleanup lors du déchargement de la page
    const cleanupEvents = ['beforeunload', 'unload', 'pagehide'];
    
    cleanupEvents.forEach(event => {
      window.addEventListener(event, () => {
        this.cleanup();
      }, { once: true, passive: true });
    });

    // Cleanup lors de la suppression du DOM (pour les SPA)
    if (document.documentElement) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && 
              Array.from(mutation.removedNodes).includes(document.documentElement)) {
            this.cleanup();
          }
        });
      });

      observer.observe(document, { childList: true, subtree: true });
      this.observers.add(observer);
    }
  }

  /**
   * Générer un ID unique
   */
  generateId() {
    return `em_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Statistiques pour le debug
   */
  getStats() {
    return {
      listeners: this.listeners.size,
      timers: this.timers.size,
      observers: this.observers.size
    };
  }
}

// Instance globale
window.eventManager = new ContentEventManager();

// Helpers pour faciliter l'utilisation
window.addListener = (element, event, handler, options) => 
  window.eventManager.on(element, event, handler, options);

window.removeListener = (id) => 
  window.eventManager.off(id);

// Helpers pour les timers avec auto-cleanup
window.addManagedTimeout = (callback, delay) =>
  window.eventManager.setTimeout(callback, delay);

window.addManagedInterval = (callback, delay) =>
  window.eventManager.setInterval(callback, delay);

// Sauvegarder les méthodes originales
const originalSetTimeout = window.setTimeout;
const originalSetInterval = window.setInterval;
const originalClearTimeout = window.clearTimeout;
const originalClearInterval = window.clearInterval;

// PAS d'override global - trop risqué pour la récursion
// Les développeurs doivent utiliser explicitement eventManager.setTimeout()
// ou addManagedTimeout() pour le auto-cleanup 