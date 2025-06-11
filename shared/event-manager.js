/**
 * OptiRank Event Manager
 * Gestionnaire d'événements avec cleanup automatique et logging SEO-friendly
 */

class OptiRankEventManager {
  constructor() {
    this.activeListeners = new Map();
    this.timers = new Map();
    this.logger = window.OptiRankLogger;
    this.listenerCounter = 0;
    
    this.init();
  }

  init() {
    // Logger l'initialisation
    this.logger.info('Gestionnaire d\'événements OptiRank initialisé');
    
    // Cleanup automatique toutes les 5 minutes
    this.startCleanupTimer();
    
    // Cleanup à la fermeture
    this.setupCleanupOnUnload();
  }

  /**
   * Ajouter un event listener avec tracking automatique
   */
  addEventListener(element, event, handler, options = {}) {
    try {
      const listenerId = `listener_${++this.listenerCounter}`;
      
      // Wrapper pour cleanup automatique
      const wrappedHandler = (e) => {
        try {
          handler(e);
        } catch (error) {
          this.logger.error(
            `Erreur dans gestionnaire d'événement : ${event}`,
            { event, error: error.message, listenerId }
          );
        }
      };

      // Ajouter l'événement
      element.addEventListener(event, wrappedHandler, options);
      
      // Tracker pour cleanup
      this.activeListeners.set(listenerId, {
        element,
        event,
        handler: wrappedHandler,
        options,
        addedAt: Date.now(),
        elementType: this.getElementDescription(element)
      });

      this.logger.info(
        `Écouteur d'événement ajouté : ${event}`,
        { 
          event, 
          elementType: this.getElementDescription(element),
          listenerId,
          totalListeners: this.activeListeners.size
        }
      );

      return listenerId;

    } catch (error) {
      this.logger.error(
        'Impossible d\'ajouter l\'écouteur d\'événement',
        { event, error: error.message }
      );
      return null;
    }
  }

  /**
   * Supprimer un event listener
   */
  removeEventListener(listenerId) {
    try {
      const listenerInfo = this.activeListeners.get(listenerId);
      
      if (!listenerInfo) {
        this.logger.warn(`Écouteur non trouvé : ${listenerId}`);
        return false;
      }

      const { element, event, handler, options } = listenerInfo;
      element.removeEventListener(event, handler, options);
      
      this.activeListeners.delete(listenerId);
      
      this.logger.info(
        `Écouteur d'événement supprimé : ${event}`,
        { 
          event, 
          listenerId,
          totalListeners: this.activeListeners.size
        }
      );

      return true;

    } catch (error) {
      this.logger.error(
        'Impossible de supprimer l\'écouteur d\'événement',
        { listenerId, error: error.message }
      );
      return false;
    }
  }

  /**
   * Créer un timer avec tracking automatique
   */
  setTimeout(callback, delay, name = 'unnamed') {
    try {
      const timerId = `timer_${++this.listenerCounter}`;
      
      const wrappedCallback = () => {
        try {
          callback();
        } catch (error) {
          this.logger.error(
            `Erreur dans timer : ${name}`,
            { name, error: error.message, timerId }
          );
        } finally {
          // Auto-cleanup
          this.timers.delete(timerId);
        }
      };

      const browserTimerId = setTimeout(wrappedCallback, delay);
      
      this.timers.set(timerId, {
        browserTimerId,
        name,
        delay,
        createdAt: Date.now(),
        type: 'timeout'
      });

      this.logger.info(
        `Timer créé : ${name} (${delay}ms)`,
        { name, delay, timerId, totalTimers: this.timers.size }
      );

      return timerId;

    } catch (error) {
      this.logger.error(
        'Impossible de créer le timer',
        { name, delay, error: error.message }
      );
      return null;
    }
  }

  /**
   * Créer un interval avec tracking automatique
   */
  setInterval(callback, delay, name = 'unnamed') {
    try {
      const timerId = `interval_${++this.listenerCounter}`;
      
      const wrappedCallback = () => {
        try {
          callback();
        } catch (error) {
          this.logger.error(
            `Erreur dans interval : ${name}`,
            error.message || error.toString()
          );
        }
      };

      const browserTimerId = setInterval(wrappedCallback, delay);
      
      this.timers.set(timerId, {
        browserTimerId,
        name,
        delay,
        createdAt: Date.now(),
        type: 'interval'
      });

      this.logger.info(
        `Interval créé : ${name} (${delay}ms)`,
        { name, delay, timerId, totalTimers: this.timers.size }
      );

      return timerId;

    } catch (error) {
      this.logger.error(
        'Impossible de créer l\'interval',
        { name, delay, error: error.message }
      );
      return null;
    }
  }

  /**
   * Supprimer un timer
   */
  clearTimer(timerId) {
    try {
      const timerInfo = this.timers.get(timerId);
      
      if (!timerInfo) {
        this.logger.warn(`Timer non trouvé : ${timerId}`);
        return false;
      }

      const { browserTimerId, name, type } = timerInfo;
      
      if (type === 'timeout') {
        clearTimeout(browserTimerId);
      } else if (type === 'interval') {
        clearInterval(browserTimerId);
      }
      
      this.timers.delete(timerId);
      
      this.logger.info(
        `Timer supprimé : ${name}`,
        { name, timerId, type, totalTimers: this.timers.size }
      );

      return true;

    } catch (error) {
      this.logger.error(
        'Impossible de supprimer le timer',
        { timerId, error: error.message }
      );
      return false;
    }
  }

  /**
   * Helpers pour usage courant
   */
  onClick(element, handler, options) {
    return this.addEventListener(element, 'click', handler, options);
  }

  onSubmit(form, handler, options) {
    return this.addEventListener(form, 'submit', handler, options);
  }

  onInput(input, handler, options) {
    return this.addEventListener(input, 'input', handler, options);
  }

  onChange(element, handler, options) {
    return this.addEventListener(element, 'change', handler, options);
  }

  onLoad(element, handler, options) {
    return this.addEventListener(element, 'load', handler, options);
  }

  /**
   * Cleanup automatique des événements orphelins
   */
  cleanupOrphanedListeners() {
    let cleanedCount = 0;
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [listenerId, info] of this.activeListeners.entries()) {
      try {
        // Vérifier si l'élément existe encore dans le DOM
        const isOrphaned = !info.element || 
                          !info.element.nodeType || 
                          !document.contains(info.element) || 
                          (now - info.addedAt > maxAge);
        
        if (isOrphaned) {
          this.removeEventListener(listenerId);
          cleanedCount++;
        }
      } catch (error) {
        // Élément invalide, le supprimer
        this.removeEventListener(listenerId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(
        `Nettoyage automatique : ${cleanedCount} écouteurs orphelins supprimés`,
        { cleanedCount, remainingListeners: this.activeListeners.size }
      );
    }
  }

  /**
   * Cleanup automatique des timers expirés
   */
  cleanupExpiredTimers() {
    let cleanedCount = 0;
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 heure pour les intervals

    for (const [timerId, info] of this.timers.entries()) {
      try {
        // Nettoyer les intervals très anciens (potentiellement oubliés)
        if (info.type === 'interval' && now - info.createdAt > maxAge) {
          this.clearTimer(timerId);
          cleanedCount++;
        }
      } catch (error) {
        // Timer invalide, le supprimer
        this.clearTimer(timerId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(
        `Nettoyage automatique : ${cleanedCount} timers expirés supprimés`,
        { cleanedCount, remainingTimers: this.timers.size }
      );
    }
  }

  /**
   * Cleanup complet
   */
  cleanup() {
    const listenersCount = this.activeListeners.size;
    const timersCount = this.timers.size;

    // Supprimer tous les listeners
    for (const listenerId of this.activeListeners.keys()) {
      this.removeEventListener(listenerId);
    }

    // Supprimer tous les timers
    for (const timerId of this.timers.keys()) {
      this.clearTimer(timerId);
    }

    this.logger.info(
      `Nettoyage complet terminé : ${listenersCount} écouteurs et ${timersCount} timers supprimés`,
      { listenersCount, timersCount }
    );
  }

  /**
   * Statistiques pour monitoring
   */
  getStats() {
    const stats = {
      totalListeners: this.activeListeners.size,
      totalTimers: this.timers.size,
      listeners: [],
      timers: []
    };

    // Détails des listeners
    for (const [id, info] of this.activeListeners.entries()) {
      stats.listeners.push({
        id,
        event: info.event,
        elementType: info.elementType,
        ageMinutes: Math.round((Date.now() - info.addedAt) / 60000)
      });
    }

    // Détails des timers
    for (const [id, info] of this.timers.entries()) {
      stats.timers.push({
        id,
        name: info.name,
        type: info.type,
        delay: info.delay,
        ageMinutes: Math.round((Date.now() - info.createdAt) / 60000)
      });
    }

    return stats;
  }

  /**
   * Utilitaires privés
   */
  getElementDescription(element) {
    if (!element) return 'unknown';
    
    const tag = element.tagName ? element.tagName.toLowerCase() : 'unknown';
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ')[0]}` : '';
    
    return `${tag}${id}${className}`;
  }

  startCleanupTimer() {
    // Cleanup toutes les 5 minutes
    this.setInterval(() => {
      this.cleanupOrphanedListeners();
      this.cleanupExpiredTimers();
    }, 5 * 60 * 1000, 'auto-cleanup');
  }

  setupCleanupOnUnload() {
    // Cleanup avant fermeture
    this.addEventListener(window, 'beforeunload', () => {
      this.cleanup();
    });

    // Cleanup sur visibilitychange (onglet fermé/ouvert)
    this.addEventListener(document, 'visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.cleanupOrphanedListeners();
      }
    });
  }
}

// Instance globale
window.OptiRankEventManager = window.OptiRankEventManager || new OptiRankEventManager();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptiRankEventManager;
} 