/**
 * OptiRank - Module Loader pour l'architecture modulaire des headings
 * 
 * Ce fichier gère le chargement et l'initialisation de tous les modules
 * de l'analyse des titres (headings) avec une architecture propre et scalable.
 */

class HeadingsModuleLoader {
  constructor() {
    this.modules = new Map();
    this.dependencies = new Map();
    this.initialized = false;
    this.initPromise = null;
  }

  // Enregistrer un module avec ses dépendances
  registerModule(name, module, dependencies = []) {
    this.modules.set(name, {
      module,
      dependencies,
      initialized: false
    });
  }

  // Vérifier que toutes les dépendances sont disponibles
  checkDependencies(moduleName) {
    const moduleInfo = this.modules.get(moduleName);
    if (!moduleInfo) return false;

    return moduleInfo.dependencies.every(dep => {
      // Vérifier les fonctions globales
      if (typeof dep === 'string' && dep.startsWith('window.')) {
        return this.getNestedProperty(window, dep.substring(7)) !== undefined;
      }
      // Vérifier les modules
      return this.modules.has(dep);
    });
  }

  // Utilitaire pour accéder aux propriétés imbriquées
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : undefined, obj);
  }

  // Initialiser tous les modules dans le bon ordre
  async initializeModules() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    logger.debug('🚀 Headings Module Loader: Initialisation des modules');

    // Vérification des modules requis
    const requiredModules = [
      'window.createTestHeadingsData',
      'window.displayHeadingsResults', 
      'window.headingsUtils.showLoading',
      'window.headingsUtils.hideLoading'
    ];

    const missingModules = requiredModules.filter(mod => 
      this.getNestedProperty(window, mod.substring(7)) === undefined
    );

    if (missingModules.length > 0) {
      logger.warn('⚠️ Modules manquants:', missingModules);
      // Attendre un peu pour que les scripts se chargent
      await this.waitForModules(missingModules, 5000);
    }

    // Réenregistrer les modules disponibles
    this.registerAvailableModules();
    
    logger.debug('✅ Modules headings initialisés:', Array.from(this.modules.keys()));
    this.initialized = true;

    // Lancer l'initialisation des headings
    this.initializeHeadings();
  }

  // Attendre que les modules se chargent
  async waitForModules(moduleNames, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const stillMissing = moduleNames.filter(mod => 
        this.getNestedProperty(window, mod.substring(7)) === undefined
      );
      
      if (stillMissing.length === 0) {
        logger.debug('✅ Tous les modules sont maintenant disponibles');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    logger.warn('⚠️ Timeout: Certains modules ne sont toujours pas disponibles');
  }

  // Enregistrer les modules disponibles
  registerAvailableModules() {
    // Module de test
    if (window.createTestHeadingsData) {
      this.registerModule('testData', window.createTestHeadingsData);
    }

    // Module d'affichage
    if (window.displayHeadingsResults) {
      this.registerModule('display', window.displayHeadingsResults);
    }

    // Module d'utilitaires
    if (window.headingsUtils) {
      this.registerModule('utils', window.headingsUtils);
    }

    // Module d'analyse
    if (window.headingStructureAnalyzer) {
      this.registerModule('analyzer', window.headingStructureAnalyzer);
    }
  }

  // Initialiser les headings de façon robuste
  initializeHeadings() {
    logger.debug('🎯 Initialisation des headings avec gestion d\'erreur robuste');

    // Vérifier si nous sommes dans l'onglet headings
    const headingsTab = document.getElementById('headings');
    if (!headingsTab || !headingsTab.classList.contains('active')) {
      logger.debug('📋 Tab headings pas actif, attente de l\'activation');
      return;
    }

    // Lancer la récupération des données
    this.safeGetHeadingsResults();
  }

  // Version sécurisée de getHeadingsResults
  safeGetHeadingsResults() {
    logger.debug('🔍 Récupération sécurisée des résultats headings');

    try {
      // Tenter la communication avec l'extension
      if (chrome && chrome.tabs && chrome.tabs.query) {
        this.tryExtensionCommunication();
      } else {
        logger.debug('📱 Extension Chrome non disponible, utilisation des données de test');
        this.loadTestDataSafely();
      }
    } catch (error) {
      logger.warn('⚠️ Erreur lors de la communication extension:', error);
      this.loadTestDataSafely();
    }
  }

  // Essayer la communication avec l'extension
  tryExtensionCommunication() {
    const utils = this.modules.get('utils')?.module;
    
    if (utils && utils.showLoading) {
      utils.showLoading('Récupération des données...');
    }

    logger.debug('🔍 MODULE LOADER: Tentative de communication avec l\'extension Chrome');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        logger.debug('❌ MODULE LOADER: Aucun onglet actif trouvé → Basculement sur données de test');
        this.loadTestDataSafely();
        return;
      }

      logger.debug('✅ MODULE LOADER: Onglet actif trouvé:', tabs[0].url);

      const timeout = setTimeout(() => {
        logger.debug('⏱️ MODULE LOADER: Timeout communication extension (3s) → Données de test');
        this.loadTestDataSafely();
      }, 3000);

      chrome.tabs.sendMessage(tabs[0].id, { action: 'getHeadingsResults' }, (response) => {
        clearTimeout(timeout);
        
        if (utils && utils.hideLoading) {
          utils.hideLoading();
        }

        if (chrome.runtime.lastError) {
          logger.debug('🔄 MODULE LOADER: Extension non connectée:', chrome.runtime.lastError.message);
          logger.debug('📋 MODULE LOADER: → Basculement sur données de test (normal en développement)');
          this.loadTestDataSafely();
          return;
        }

        logger.debug('📨 MODULE LOADER: Réponse reçue de l\'extension:');
        logger.debug('  - Type de réponse:', typeof response);
        logger.debug('  - Contenu complet:', JSON.stringify(response, null, 2));

        if (response && (response.headingsData || response.items || response.headings)) {
          logger.debug('✅ MODULE LOADER: Données RÉELLES reçues de l\'extension');
          logger.debug('  - Structure des données:', Object.keys(response.headingsData || response));
          const realData = response.headingsData || response;
          if (realData.headings) {
            logger.debug('  - Nombre de headings:', realData.headings.length);
            logger.debug('  - Premier heading:', realData.headings[0]);
          }
          this.displayResultsSafely(realData);
        } else if (response && response.rawHeadingsData) {
          logger.debug('🔧 MODULE LOADER: Données BRUTES reçues de l\'extension');
          logger.debug('  - rawHeadings:', response.rawHeadingsData.rawHeadings?.length || 0, 'éléments');
          logger.debug('  - Appel de processRawHeadingsData');
          
          if (window.processRawHeadingsData) {
            window.processRawHeadingsData(response.rawHeadingsData);
          } else {
            logger.error('❌ MODULE LOADER: processRawHeadingsData non disponible');
            this.loadTestDataSafely();
          }
        } else {
          logger.debug('📊 MODULE LOADER: Réponse vide de l\'extension → Données de test');
          logger.debug('  - Réponse était:', response);
          this.loadTestDataSafely();
        }
      });
    });
  }

  // Charger les données de test de façon sécurisée
  loadTestDataSafely() {
    const utils = this.modules.get('utils')?.module;
    if (utils && utils.hideLoading) {
      utils.hideLoading();
    }

    logger.debug('📋 MODULE LOADER: Chargement des données de TEST (codées en dur)');

    const testDataModule = this.modules.get('testData')?.module;
    const displayModule = this.modules.get('display')?.module;

    if (testDataModule && displayModule) {
      const testData = testDataModule();
      logger.debug('📊 DONNÉES DE TEST générées:');
      logger.debug('  - Compteurs:', testData.counts);
      logger.debug('  - Nombre de headings:', testData.headings?.length || 0);
      logger.debug('  - Premier heading:', testData.headings?.[0]);
      logger.debug('  - Source: FICHIER test-data.js (PAS la page réelle)');
      this.displayResultsSafely(testData);
    } else {
      logger.error('❌ MODULE LOADER: Modules de test ou d\'affichage manquants');
      this.showFallbackContent();
    }
  }

  // Afficher les résultats de façon sécurisée
  displayResultsSafely(data) {
    try {
      logger.debug('🎨 MODULE LOADER: Affichage des données:');
      logger.debug('  - Type de données:', typeof data);
      logger.debug('  - Propriétés:', Object.keys(data));
      
      if (data.headings) {
        logger.debug('  - Source des headings:', data.headings.length > 0 ? 'Extension (page réelle)' : 'Données de test');
        logger.debug('  - Liste des headings:');
        data.headings.forEach((h, i) => {
          logger.debugEmoji("", `${i + 1}. H${h.level}: "${h.text}"`);
        });
      }

      const displayModule = this.modules.get('display')?.module;
      if (displayModule) {
        logger.debug('🎯 MODULE LOADER: Appel de displayHeadingsResults');
        displayModule(data);
      } else {
        logger.error('❌ MODULE LOADER: Module d\'affichage non disponible');
        this.showFallbackContent();
      }
    } catch (error) {
      logger.error('❌ MODULE LOADER: Erreur lors de l\'affichage:', error);
      this.showFallbackContent();
    }
  }

  // Contenu de fallback si tout échoue
  showFallbackContent() {
    logger.debug('🚨 Affichage du contenu de fallback');
    
    const headingsList = document.getElementById('headings-list');
    if (headingsList) {
      headingsList.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>Erreur de chargement</h4>
          <p>Impossible de charger les données des headings. Veuillez recharger la page.</p>
        </div>
      `;
    }
  }

  // API publique pour forcer le rechargement
  forceReload() {
    this.initialized = false;
    this.initPromise = null;
    this.initializeModules();
  }
}

// Instance globale
window.headingsModuleLoader = new HeadingsModuleLoader();

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.headingsModuleLoader.initializeModules();
  });
} else {
  // DOM déjà prêt
  setTimeout(() => window.headingsModuleLoader.initializeModules(), 100);
} 