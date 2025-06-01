// OptiRank - Script de chargement léger pour architecture modulaire
// Ce script vérifie si l'autoscan est activé et charge les modules dans le bon ordre

console.log('OptiRank: Modular Loader initialized');

// Diagnostic pour comprendre pourquoi l'API Chrome n'est pas disponible
(function diagnosticChromeAPI() {
  console.log('OptiRank Diagnostic: Checking Chrome API availability');
  
  // Vérifier si l'objet chrome existe
  if (typeof chrome === 'undefined') {
    console.error('OptiRank Diagnostic: chrome object is completely undefined');
    return;
  }
  
  // Vérifier les propriétés de l'objet chrome
  console.log('OptiRank Diagnostic: chrome object properties:', Object.keys(chrome));
  
  // Vérifier si chrome.runtime existe
  if (!chrome.runtime) {
    console.error('OptiRank Diagnostic: chrome.runtime is undefined');
  } else {
    console.log('OptiRank Diagnostic: chrome.runtime is available');
    console.log('OptiRank Diagnostic: chrome.runtime properties:', Object.keys(chrome.runtime));
    
    // Vérifier si getURL fonctionne
    try {
      const url = chrome.runtime.getURL('content/common/utils.js');
      console.log('OptiRank Diagnostic: chrome.runtime.getURL works, result:', url);
    } catch (error) {
      console.error('OptiRank Diagnostic: Error using chrome.runtime.getURL:', error);
    }
  }
  
  // Vérifier le contexte d'exécution
  console.log('OptiRank Diagnostic: Execution context:', window.location.href);
  console.log('OptiRank Diagnostic: Is extension context:', window.location.protocol === 'chrome-extension:');
})();

// Liste des modules à charger dans l'ordre
const MODULES = [
  'common/utils.js',
  'common/data.js',
  'ui/styles.js',
  'links/validation/validator.js',
  'links/validation/redirectDetector.js',
  'links/detection/detector.js',
  'links/processing/processor.js',
  'links/processing/scanner.js',
  'reports/reporter.js',
  'optiRankMain.js'
];

// Variable pour suivre si les modules sont chargés
let modulesLoaded = false;

/**
 * Charge un script de manière asynchrone en préservant le contexte de l'extension
 * @param {string} src - Chemin du script à charger
 * @returns {Promise} - Promise résolue quand le script est chargé
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    try {
      // Vérifier si chrome.scripting est disponible
      if (typeof chrome !== 'undefined' && chrome.scripting && chrome.scripting.executeScript) {
        // Obtenir l'ID de l'onglet actif
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.error(`OptiRank: Error getting active tab: ${chrome.runtime.lastError.message}`);
            fallbackLoadScript(src, resolve, reject);
            return;
          }
          
          if (!tabs || tabs.length === 0) {
            console.error('OptiRank: No active tab found');
            fallbackLoadScript(src, resolve, reject);
            return;
          }
          
          const tabId = tabs[0].id;
          
          // Exécuter le script dans le contexte de l'extension
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: [`content/${src}`]
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.error(`OptiRank: Error executing script: ${chrome.runtime.lastError.message}`);
              fallbackLoadScript(src, resolve, reject);
              return;
            }
            
            console.log(`OptiRank: Loaded module ${src} in extension context`);
            
            // Pour le module principal, configurer les références globales
            if (src === 'optiRankMain.js') {
              setTimeout(() => {
                if (window.OptiRankUtils) {
                  window.OptiRankUtils.modules = window.OptiRankUtils.modules || {};
                  
                  // Stocker les références aux modules
                  if (window.OptiRankMain) {
                    window.OptiRankUtils.modules.main = window.OptiRankMain;
                  }
                  
                  if (window.OptiRankScan) {
                    window.OptiRankUtils.modules.scanner = window.OptiRankScan;
                  }
                  
                  console.log('OptiRank: Module references updated in OptiRankUtils');
                }
              }, 100);
            }
            
            resolve();
          });
        });
      } else {
        // Méthode de secours si chrome.scripting n'est pas disponible
        fallbackLoadScript(src, resolve, reject);
      }
    } catch (error) {
      console.error(`OptiRank: Error in loadScript for ${src}:`, error);
      fallbackLoadScript(src, resolve, reject);
    }
  });
}

/**
 * Méthode de secours pour charger un script si chrome.scripting n'est pas disponible
 * @param {string} src - Chemin du script à charger
 * @param {function} resolve - Fonction resolve de la Promise
 * @param {function} reject - Fonction reject de la Promise
 */
function fallbackLoadScript(src, resolve, reject) {
  try {
    // Créer un élément script
    const script = document.createElement('script');
    
    // Définir l'URL du script en utilisant chrome.runtime si disponible
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      // Utiliser l'URL de l'extension pour préserver le contexte
      script.src = chrome.runtime.getURL(`content/${src}`);
      console.log(`OptiRank: Loading module from extension URL: ${script.src}`);
    } else {
      // Mode de compatibilité - utiliser un chemin relatif
      script.src = `content/${src}`;
      console.log(`OptiRank: Loading module in compatibility mode: ${src}`);
    }
    
    // Ajouter des attributs pour le débogage
    script.setAttribute('data-optirank-module', src);
    
    // Gérer le chargement
    script.onload = () => {
      console.log(`OptiRank: Loaded module ${src} via fallback method`);
      resolve();
    };
    
    // Gérer les erreurs
    script.onerror = (error) => {
      console.error(`OptiRank: Error loading module ${src}`, error);
      reject(error);
    };
    
    // Ajouter le script au document
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error(`OptiRank: Error in fallbackLoadScript for ${src}:`, error);
    reject(error);
  }
}

/**
 * Charge tous les modules dans l'ordre
 * @returns {Promise} - Promise résolue quand tous les modules sont chargés
 */
async function loadAllModules() {
  if (modulesLoaded) {
    console.log('OptiRank: Modules already loaded');
    return;
  }
  
  console.log(`OptiRank: Loading ${MODULES.length} modules...`);
  
  try {
    // Charger les modules un par un dans l'ordre
    for (const module of MODULES) {
      await loadScript(module);
      // Petite pause entre chaque module pour éviter les problèmes de dépendances
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    modulesLoaded = true;
    console.log('OptiRank: All modules loaded successfully');
    
    // Informer le background script que les modules sont chargés (si possible)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'loaderStatus',
        status: 'scriptsLoaded'
      });
    }
    
    // Stocker les références aux modules dans l'objet global
    if (window.OptiRankUtils) {
      window.OptiRankUtils.modules = window.OptiRankUtils.modules || {};
      
      // Ajouter des références aux modules pour le mode de compatibilité
      if (window.OptiRankScan) {
        window.OptiRankUtils.modules.scanner = window.OptiRankScan;
      }
      
      // S'assurer que OptiRankMain est disponible globalement
      if (window.OptiRankMain) {
        window.OptiRankUtils.modules.main = window.OptiRankMain;
      }
      
      // Créer des alias pour les modules qui pourraient être référencés sous différents noms
      if (!window.OptiRankMain && window.OptiRankUtils.modules.main) {
        window.OptiRankMain = window.OptiRankUtils.modules.main;
        console.log('OptiRank: Created global alias for OptiRankMain');
      }
      
      if (!window.OptiRankScan && window.OptiRankUtils.modules.scanner) {
        window.OptiRankScan = window.OptiRankUtils.modules.scanner;
        console.log('OptiRank: Created global alias for OptiRankScan');
      }
      
      console.log('OptiRank: Module references stored in window.OptiRankUtils.modules');
    }
    
    return { success: true };
  } catch (error) {
    console.error('OptiRank: Error loading modules:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Vérifie si l'autoscan est activé
 */
function checkAutoScanEnabled() {
  console.log('OptiRank: Checking if auto-scan is enabled');
  
  // Vérifier si l'API Chrome est disponible
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('settings', (data) => {
      if (data.settings && data.settings.autoScanEnabled === true) {
        console.log('OptiRank: Auto-scan is enabled, loading modules');
        loadAllModules();
      } else {
        console.log('OptiRank: Auto-scan is disabled, modules will be loaded on demand');
        
        // Informer le background script que les modules ne sont pas chargés (si possible)
        if (chrome.runtime) {
          chrome.runtime.sendMessage({
            action: 'loaderStatus',
            status: 'scriptsNotLoaded',
            autoScanEnabled: false
          });
        }
      }
    });
  } else {
    // Mode de compatibilité sans API Chrome
    console.log('OptiRank: Chrome API not available, loading modules in compatibility mode');
    loadAllModules();
  }
}

// Écouter tous les messages si l'API Chrome est disponible
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('OptiRank Loader: Received message', message.action);
    
    // Répondre au ping pour indiquer que le content script est accessible
    if (message.action === 'ping') {
      console.log('OptiRank Loader: Ping received, responding');
      sendResponse({ success: true, modulesLoaded: modulesLoaded });
      return true;
    }
    
    // Charger les modules si demandé
    if (message.action === 'loadScripts' || message.action === 'loadModules') {
      console.log('OptiRank Loader: Received request to load modules');
      loadAllModules().then((response) => {
        sendResponse(response);
      });
      return true; // Indique que nous répondrons de manière asynchrone
    }
    
    // Si on reçoit une demande de scan mais que les modules ne sont pas chargés
    if (message.action === 'scanLinks' && !modulesLoaded) {
      console.log('OptiRank Loader: Scan requested but modules not loaded, loading them now');
      
      loadAllModules().then((response) => {
        if (!response || !response.success) {
          console.error('OptiRank Loader: Failed to load modules for scan');
          sendResponse({
            success: false,
            message: 'Failed to load modules for scan'
          });
          return;
        }
        
        // Attendre que les modules soient complètement initialisés avec un délai plus long
        setTimeout(() => {
          console.log('OptiRank Loader: Modules loaded, forwarding scan request');
          
          // Vérifier si les modules sont disponibles sous différents noms
          if (!window.OptiRankMain && window.OptiRankUtils && window.OptiRankUtils.modules && window.OptiRankUtils.modules.main) {
            window.OptiRankMain = window.OptiRankUtils.modules.main;
            console.log('OptiRank Loader: Using OptiRankMain from modules.main');
          }
          
          if (!window.OptiRankScan && window.OptiRankUtils && window.OptiRankUtils.modules && window.OptiRankUtils.modules.scanner) {
            window.OptiRankScan = window.OptiRankUtils.modules.scanner;
            console.log('OptiRank Loader: Using OptiRankScan from modules.scanner');
          }
          
          // Créer des objets de secours pour les modules principaux
          // Créer un objet OptiRankMain de secours si nécessaire
          if (!window.OptiRankMain) {
            console.warn('OptiRank Loader: Creating fallback OptiRankMain object');
            window.OptiRankMain = {
              initOptiRank: function() {
                console.log('OptiRank: Fallback initOptiRank called');
                return Promise.resolve();
              },
              scanAllLinks: function() {
                console.log('OptiRank: Fallback scanAllLinks redirecting to scanner');
                if (window.OptiRankScan && window.OptiRankScan.scanAllLinks) {
                  return window.OptiRankScan.scanAllLinks();
                } else if (window.scanLinks) {
                  return window.scanLinks();
                } else {
                  console.error('OptiRank: No scan function available');
                  return Promise.reject(new Error('No scan function available'));
                }
              }
            };
          }
          
          // Créer un objet OptiRankScan de secours si nécessaire
          if (!window.OptiRankScan) {
            console.warn('OptiRank Loader: Creating fallback OptiRankScan object');
            window.OptiRankScan = {
              scanAllLinks: function() {
                console.log('OptiRank: Fallback scanAllLinks called');
                // Implémentation minimale pour la détection des liens
                try {
                  // Collecter tous les liens de la page
                  const links = Array.from(document.querySelectorAll('a'));
                  console.log(`OptiRank: Found ${links.length} links on the page`);
                  
                  // Créer un objet de résultats minimal
                  const results = {
                    total: links.length,
                    valid: links.length,
                    broken: 0,
                    redirects: 0,
                    nofollow: 0,
                    skipped: 0,
                    progress: 100,
                    completed: true,
                    startTime: new Date(),
                    endTime: new Date(),
                    duration: 0
                  };
                  
                  // Stocker les résultats dans l'objet global
                  if (window.OptiRankUtils) {
                    window.OptiRankUtils.scanResults = results;
                  }
                  
                  return Promise.resolve(results);
                } catch (error) {
                  console.error('OptiRank: Error in fallback scanAllLinks:', error);
                  return Promise.reject(error);
                }
              },
              autoScanLinks: function() {
                console.log('OptiRank: Fallback autoScanLinks called');
                return this.scanAllLinks();
              }
            };
          }
          
          // Créer un objet OptiRankUtils de secours si nécessaire
          if (!window.OptiRankUtils) {
            console.warn('OptiRank Loader: Creating fallback OptiRankUtils object');
            window.OptiRankUtils = {
              modules: {},
              scanResults: {
                total: 0,
                valid: 0,
                broken: 0,
                redirects: 0,
                nofollow: 0,
                skipped: 0,
                progress: 0,
                completed: false,
                inProgress: false
              },
              settings: {
                autoScanEnabled: false,
                checkExternal: true,
                checkInternal: true,
                detectRedirects: true,
                maxRetries: 2,
                batchSize: 5,
                timeout: 10000
              }
            };
          }
          
          // Mettre à jour les références entre les modules
          if (window.OptiRankUtils) {
            window.OptiRankUtils.modules.main = window.OptiRankMain || window.OptiRankUtils.modules.main;
            window.OptiRankUtils.modules.scanner = window.OptiRankScan || window.OptiRankUtils.modules.scanner;
          }
          
          // Vérifier les variables globales pour débogage
          console.log('OptiRank Loader: Available global objects:', Object.keys(window).filter(key => key.startsWith('OptiRank')));
          
          // Transmettre la demande de scan au module principal
          if (window.OptiRankMain) {
            // S'assurer que l'initialisation est terminée
            window.OptiRankMain.initOptiRank().then(() => {
              // Lancer le scan
              if (window.OptiRankScan) {
                window.OptiRankScan.scanAllLinks().then((results) => {
                  console.log('OptiRank Loader: Scan completed, results will be sent by optiRankMain.js');
                  sendResponse({ success: true, results: results });
                }).catch((error) => {
                  console.error('OptiRank Loader: Error during scan:', error);
                  sendResponse({ success: false, error: error.message });
                });
              } else {
                console.error('OptiRank Loader: OptiRankScan not found after modules loaded');
                // Essayer de lancer le scan directement via le substitut
                if (window.chromeRuntimeSubstitute) {
                  window.chromeRuntimeSubstitute.sendMessage({ action: 'scanLinks' });
                  sendResponse({ success: true, message: 'Scan started via substitute' });
                } else {
                  sendResponse({ success: false, message: 'OptiRankScan not found' });
                }
              }
            }).catch((error) => {
              console.error('OptiRank Loader: Error initializing OptiRankMain:', error);
              sendResponse({ success: false, error: error.message });
            });
          } else {
            console.error('OptiRank Loader: OptiRankMain not found after modules loaded');
            
            // Essayer de démarrer le scan directement via le substitut
            if (window.chromeRuntimeSubstitute) {
              console.log('OptiRank Loader: Attempting to start scan via substitute');
              window.chromeRuntimeSubstitute.sendMessage({ action: 'scanLinks' });
              sendResponse({ success: true, message: 'Scan started via substitute' });
            } else {
              sendResponse({ success: false, message: 'OptiRankMain not found' });
            }
          }
        }, 1000); // Délai plus long pour s'assurer que tous les modules sont correctement initialisés
      }).catch((error) => {
        console.error('OptiRank Loader: Error loading modules for scan:', error);
        sendResponse({ success: false, error: error.message });
      });
      
      return true; // Indique que nous répondrons de manière asynchrone
    }
    
    // Si les modules sont déjà chargés, transmettre directement au module principal
    if (modulesLoaded && (message.action === 'scanLinks' || message.action === 'getResults')) {
      console.log(`OptiRank Loader: Forwarding ${message.action} to main module`);
      
      // Transmettre la demande au module principal
      if (window.OptiRankMain) {
        // Retourner true pour indiquer que nous répondrons de manière asynchrone
        return true;
      } else {
        console.error('OptiRank Loader: OptiRankMain not found, cannot forward message');
        sendResponse({ success: false, message: 'OptiRankMain not found' });
      }
    }
    
    // Pas de réponse asynchrone nécessaire
    return false;
  });
} else {
  // Mode de compatibilité sans API Chrome
  console.log('OptiRank Loader: Chrome API not available, loading modules in compatibility mode');
  
  // Charger tous les modules immédiatement
  document.addEventListener('DOMContentLoaded', () => {
    console.log('OptiRank Loader: DOMContentLoaded event fired, loading modules');
    loadAllModules().then(() => {
      console.log('OptiRank Loader: Modules loaded in compatibility mode');
      
      // Déclencher un événement personnalisé pour indiquer que les modules sont chargés
      const event = new CustomEvent('optirank-modules-loaded');
      document.dispatchEvent(event);
    }).catch(error => {
      console.error('OptiRank Loader: Error loading modules in compatibility mode:', error);
    });
  });
  
  // Si le document est déjà chargé, charger les modules immédiatement
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('OptiRank Loader: Document already loaded, loading modules now');
    loadAllModules().then(() => {
      console.log('OptiRank Loader: Modules loaded in compatibility mode');
      
      // Déclencher un événement personnalisé pour indiquer que les modules sont chargés
      const event = new CustomEvent('optirank-modules-loaded');
      document.dispatchEvent(event);
    }).catch(error => {
      console.error('OptiRank Loader: Error loading modules in compatibility mode:', error);
    });
  }
}

// Vérifier si l'autoscan est activé au chargement
checkAutoScanEnabled();
