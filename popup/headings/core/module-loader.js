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
    window.safeLogger.debug('🚀 Headings Module Loader: Initialisation des modules');

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
      window.safeLogger.warn('⚠️ Modules manquants:', missingModules);
      // Attendre un peu pour que les scripts se chargent
      await this.waitForModules(missingModules, 5000);
    }

    // Réenregistrer les modules disponibles
    this.registerAvailableModules();
    
    window.safeLogger.debug('✅ Modules headings initialisés:', Array.from(this.modules.keys()));
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
        window.safeLogger.debug('✅ Tous les modules sont maintenant disponibles');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    window.safeLogger.warn('⚠️ Timeout: Certains modules ne sont toujours pas disponibles');
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
    window.safeLogger.debug('🎯 Initialisation des headings avec gestion d\'erreur robuste');

    // Vérifier si nous sommes dans l'onglet headings
    const headingsTab = document.getElementById('headings');
    if (!headingsTab || !headingsTab.classList.contains('active')) {
      window.safeLogger.debug('📋 Tab headings pas actif, attente de l\'activation');
      return;
    }

    // Lancer la récupération des données
    this.safeGetHeadingsResults();
  }

  // Version sécurisée de getHeadingsResults
  safeGetHeadingsResults() {
    window.safeLogger.debug('🔍 Récupération sécurisée des résultats headings');

    try {
      // Tenter la communication avec l'extension
      if (chrome && chrome.tabs && chrome.tabs.query) {
        this.tryExtensionCommunication();
      } else {
        window.safeLogger.debug('📱 Extension Chrome non disponible, utilisation des données de test');
        this.loadTestDataSafely();
      }
    } catch (error) {
      window.safeLogger.warn('⚠️ Erreur lors de la communication extension:', error);
      this.loadTestDataSafely();
    }
  }

  // Essayer la communication avec l'extension
  tryExtensionCommunication() {
    const utils = this.modules.get('utils')?.module;
    
    if (utils && utils.showLoading) {
      utils.showLoading('Récupération des données...');
    }

    window.safeLogger.debug('🔍 MODULE LOADER: Tentative de communication avec l\'extension Chrome');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        window.safeLogger.debug('❌ MODULE LOADER: Aucun onglet actif trouvé → Basculement sur données de test');
        this.loadTestDataSafely();
        return;
      }

      window.safeLogger.debug('✅ MODULE LOADER: Onglet actif trouvé:', tabs[0].url);

      const timeout = setTimeout(() => {
        window.safeLogger.debug('⏱️ MODULE LOADER: Timeout communication extension (3s) → Données de test');
        this.loadTestDataSafely();
      }, 3000);

      chrome.tabs.sendMessage(tabs[0].id, { action: 'getHeadingsResults' }, (response) => {
        clearTimeout(timeout);
        
        if (utils && utils.hideLoading) {
          utils.hideLoading();
        }

        if (chrome.runtime.lastError) {
          window.safeLogger.debug('🔄 MODULE LOADER: Extension non connectée:', chrome.runtime.lastError.message);
          window.safeLogger.debug('📋 MODULE LOADER: → Basculement sur données de test (normal en développement)');
          this.loadTestDataSafely();
          return;
        }

        window.safeLogger.debug('📨 MODULE LOADER: Réponse reçue de l\'extension:');
        window.safeLogger.debug('  - Type de réponse:', typeof response);
        window.safeLogger.debug('  - Contenu complet:', JSON.stringify(response, null, 2));

        if (response && (response.headingsData || response.items || response.headings)) {
          window.safeLogger.debug('✅ MODULE LOADER: Données RÉELLES reçues de l\'extension');
          window.safeLogger.debug('  - Structure des données:', Object.keys(response.headingsData || response));
          const realData = response.headingsData || response;
          if (realData.headings) {
            window.safeLogger.debug('  - Nombre de headings:', realData.headings.length);
            window.safeLogger.debug('  - Premier heading:', realData.headings[0]);
          }
          this.displayResultsSafely(realData);
        } else if (response && response.rawHeadingsData) {
          window.safeLogger.debug('🔧 MODULE LOADER: Données BRUTES reçues de l\'extension');
          window.safeLogger.debug('  - rawHeadings:', response.rawHeadingsData.rawHeadings?.length || 0, 'éléments');
          window.safeLogger.debug('  - Appel de processRawHeadingsData');
          
          if (window.processRawHeadingsData) {
            window.processRawHeadingsData(response.rawHeadingsData);
          } else {
            window.safeLogger.error('❌ MODULE LOADER: processRawHeadingsData non disponible');
            this.loadTestDataSafely();
          }
        } else {
          window.safeLogger.debug('📊 MODULE LOADER: Réponse vide de l\'extension → Données de test');
          window.safeLogger.debug('  - Réponse était:', response);
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

    window.safeLogger.debug('📋 MODULE LOADER: Chargement des données de TEST (codées en dur)');

    const testDataModule = this.modules.get('testData')?.module;
    const displayModule = this.modules.get('display')?.module;

    if (testDataModule && displayModule) {
      const testData = testDataModule();
      window.safeLogger.debug('📊 DONNÉES DE TEST générées:');
      window.safeLogger.debug('  - Compteurs:', testData.counts);
      window.safeLogger.debug('  - Nombre de headings:', testData.headings?.length || 0);
      window.safeLogger.debug('  - Premier heading:', testData.headings?.[0]);
      window.safeLogger.debug('  - Source: FICHIER test-data.js (PAS la page réelle)');
      this.displayResultsSafely(testData);
    } else {
      window.safeLogger.error('❌ MODULE LOADER: Modules de test ou d\'affichage manquants');
      this.showFallbackContent();
    }
  }

  // Afficher les résultats de façon sécurisée
  displayResultsSafely(data) {
    try {
      window.safeLogger.debug('🎨 MODULE LOADER: Affichage des données:');
      window.safeLogger.debug('  - Type de données:', typeof data);
      window.safeLogger.debug('  - Propriétés:', Object.keys(data));
      
      if (data.headings) {
        window.safeLogger.debug('  - Source des headings:', data.headings.length > 0 ? 'Extension (page réelle)' : 'Données de test');
        window.safeLogger.debug('  - Liste des headings:');
        data.headings.forEach((h, i) => {
          window.safeLogger.debugEmoji("", `${i + 1}. H${h.level}: "${h.text}"`);
        });
      }

      const displayModule = this.modules.get('display')?.module;
      if (displayModule) {
        window.safeLogger.debug('🎯 MODULE LOADER: Appel de displayHeadingsResults');
        displayModule(data);
      } else {
        window.safeLogger.error('❌ MODULE LOADER: Module d\'affichage non disponible');
        this.showFallbackContent();
      }
    } catch (error) {
      window.safeLogger.error('❌ MODULE LOADER: Erreur lors de l\'affichage:', error);
      this.showFallbackContent();
    }
  }

  // Contenu de fallback si tout échoue
  showFallbackContent() {
    window.safeLogger.debug('🚨 Affichage du contenu de fallback');
    
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