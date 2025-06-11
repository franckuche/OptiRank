/* =============================================
   SYSTÈME DE LOGGING UNIVERSEL - OPTIRANK
   Compatible avec popup, content scripts et background scripts
   ============================================= */

(function() {
  'use strict';

  // Éviter la double initialisation (avec vérification de window pour service workers)
  const globalContext = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : {};
  if (globalContext.logger) {
    return;
  }

  class UniversalLogger {
    constructor() {
      this.prefix = '[OptiRank]';
      this.context = this.detectContext();
      this.isDevelopment = this.detectDevelopment();
      this.logLevel = this.getLogLevel();
    }

    // Détection du contexte d'exécution
    detectContext() {
      try {
        // Service worker context (Manifest V3)
        if (typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope) {
          return 'BACKGROUND';
        }
        
        // Background script context (Manifest V2)
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
          if (typeof window !== 'undefined' && chrome.extension && chrome.extension.getBackgroundPage && chrome.extension.getBackgroundPage() === window) {
            return 'BACKGROUND';
          }
        }
        
        // Content script context
        if (typeof chrome !== 'undefined' && chrome.runtime && !chrome.tabs) {
          return 'CONTENT';
        }
        
        // Popup/options context
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          return 'POPUP';
        }
        
        // Web page context
        return 'WEBPAGE';
      } catch (e) {
        return 'unknown';
      }
    }

    // Détection de l'environnement de développement
    detectDevelopment() {
      try {
        // Méthode 1: Extension non packagée
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
          const manifest = chrome.runtime.getManifest();
          if (!manifest.update_url) {
            return true; // Extension en développement
          }
        }

        // Méthode 2: Flag de debug manuel
        if (typeof localStorage !== 'undefined') {
          const debugFlag = localStorage.getItem('optirank-debug');
          if (debugFlag === 'true') {
            return true;
          }
        }

        // Méthode 3: Détection via storage (pour content scripts)
        if (this.context === 'CONTENT') {
          this.checkDebugFromStorage();
        }

        return false;
      } catch (e) {
        return false;
      }
    }

    // Vérification async du debug flag pour content scripts
    async checkDebugFromStorage() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['optirank-debug']);
          if (result['optirank-debug'] === true) {
            this.isDevelopment = true;
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // Déterminer le niveau de log
    getLogLevel() {
      if (this.isDevelopment) {
        return 'debug';
      }
      return 'error'; // Production: seulement les erreurs
    }

    // Méthodes de logging conditionnelles
    debug(message, ...args) {
      if (this.isDevelopment) {
        console.debug(`${this.prefix} [${this.context.toUpperCase()}] 🔍 ${message}`, ...args);
      }
    }

    info(message, ...args) {
      if (this.isDevelopment) {
        console.log(`${this.prefix} [${this.context.toUpperCase()}] ${message}`, ...args);
      }
    }

    warn(message, ...args) {
      if (this.isDevelopment) {
        console.warn(`${this.prefix} [${this.context.toUpperCase()}] ⚠️ ${message}`, ...args);
      }
    }

    error(message, ...args) {
      // Les erreurs sont toujours affichées
      console.error(`${this.prefix} [${this.context.toUpperCase()}] ❌ ${message}`, ...args);
    }

    // Méthodes spécialisées pour OptiRank
    scanStarted(count) {
      this.info(`Analyse démarrée : ${count} liens à analyser`);
    }

    scanProgress(current, total, percent) {
      this.debug(`Progression : ${percent}% (${current}/${total})`);
    }

    scanCompleted(stats) {
      this.info('Analyse terminée', stats);
    }

    linkValidationFailed(url, status) {
      this.warn(`Lien inaccessible : ${url} (${status})`);
    }

    userAction(action, ...args) {
      this.debug(`User: ${action}`, ...args);
    }

    apiCall(endpoint, ...args) {
      this.debug(`API: ${endpoint}`, ...args);
    }

    // Méthode pour emoji debugging (legacy)
    debugEmoji(emoji, message, ...args) {
      this.debug(`${emoji} ${message}`, ...args);
    }

    // Méthodes pour contrôler le debug
    enableDebug() {
      this.isDevelopment = true;
      this.logLevel = 'debug';
      
      // Sauvegarder dans localStorage si disponible
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('optirank-debug', 'true');
        }
        // Sauvegarder aussi dans chrome.storage pour les content scripts
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ 'optirank-debug': true });
        }
      } catch (e) {
        // Ignore errors
      }
      
      this.info('Debug mode activé');
    }

    disableDebug() {
      this.isDevelopment = false;
      this.logLevel = 'error';
      
      // Supprimer de localStorage si disponible
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('optirank-debug');
        }
        // Supprimer aussi de chrome.storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.remove(['optirank-debug']);
        }
      } catch (e) {
        // Ignore errors
      }
      
      this.info('Debug mode désactivé');
    }

    // Méthodes pour le profiling (compatibles avec les anciens logs)
    startTimer(label) {
      if (this.isDevelopment) {
        console.time(`${this.prefix} [${this.context.toUpperCase()}] ${label}`);
      }
    }

    endTimer(label) {
      if (this.isDevelopment) {
        console.timeEnd(`${this.prefix} [${this.context.toUpperCase()}] ${label}`);
      }
    }

    // Grouping pour organiser les logs
    group(title) {
      if (this.isDevelopment) {
        console.group(`${this.prefix} [${this.context.toUpperCase()}] ${title}`);
      }
    }

    groupEnd() {
      if (this.isDevelopment) {
        console.groupEnd();
      }
    }

    // Anonymisation d'URL pour la confidentialité
    anonymizeUrl(url) {
      try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.length > 20 ? urlObj.pathname.substring(0, 20) + '...' : urlObj.pathname}`;
      } catch (e) {
        return url && url.length > 30 ? url.substring(0, 30) + '...' : url;
      }
    }
  }

  // Créer l'instance globale (avec support service workers)
  globalContext.logger = new UniversalLogger();

  // Compatibilité avec les anciennes références
  globalContext.OptiRankLogger = globalContext.logger;

  // Message d'initialisation (seulement en dev)
  if (globalContext.logger.isDevelopment) {
    console.log(`🚀 OptiRank Universal Logger chargé - Context: ${globalContext.logger.context} - Mode: ${globalContext.logger.isDevelopment ? 'DEV' : 'PROD'}`);
  }

})(); 