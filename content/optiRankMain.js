/**
 * OptiRank - Module principal
 * Ce module sert de point d'entrée et coordonne les différents modules
 */

// Ordre de chargement des modules
const MODULES = [
  'links/validation/validator.js',
  'links/validation/redirectDetector.js',
  'links/detection/detector.js',
  'links/processing/processor.js',
  'links/processing/scanner.js',
  'links/reporting/reporter.js'
];

/**
 * Initialise l'extension OptiRank
 */
async function initOptiRank() {
  console.log('OptiRank: Starting initialization');
  
  try {
    // Vérifier si les modules sont déjà chargés
    if (window.OptiRankInitialized) {
      console.log('OptiRank: Already initialized, skipping');
      return;
    }
    
    // Marquer comme initialisé
    window.OptiRankInitialized = true;
    
    // Attendre que les utilitaires soient chargés
    if (!window.OptiRankUtils) {
      console.log('OptiRank: Waiting for utils to load...');
      await new Promise(resolve => {
        const checkUtils = () => {
          if (window.OptiRankUtils) {
            resolve();
          } else {
            setTimeout(checkUtils, 100);
          }
        };
        checkUtils();
      });
    }
    
    // Attendre que le document soit prêt
    if (document.readyState !== 'complete') {
      console.log('OptiRank: Waiting for document to be ready...');
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }
    
    // Fonction pour analyser automatiquement les headings
    function analyzeHeadingsAutomatically() {
      console.log('OptiRank: Analyzing headings automatically');
      
      // Vérifier si le module d'analyse des titres est chargé
      if (typeof window.OptiRankHeadings === 'undefined') {
        console.log('OptiRank: Headings module not loaded, loading it now');
        
        try {
          // Créer une fonction pour analyser les titres sans dépendre du module externe
          window.OptiRankHeadings = {
            detectHeadings: function() {
              console.log('OptiRank: Détection des titres (headings)');
              
              // Structure de données pour les résultats
              const headingsData = {
                counts: {
                  h1: 0,
                  h2: 0,
                  h3: 0,
                  h4: 0,
                  h5: 0,
                  h6: 0
                },
                items: [],
                issues: []
              };
              
              // Détecter tous les titres visibles
              for (let i = 1; i <= 6; i++) {
                const headings = Array.from(document.querySelectorAll(`h${i}`)).filter(heading => {
                  // Vérifier si l'élément est visible
                  const style = window.getComputedStyle(heading);
                  return style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         heading.offsetParent !== null;
                });
                
                // Mettre à jour le compteur
                headingsData.counts[`h${i}`] = headings.length;
                
                // Collecter les informations sur chaque titre
                headings.forEach(heading => {
                  headingsData.items.push({
                    level: i,
                    text: heading.textContent.trim(),
                    id: heading.id || '',
                    hasAnchor: heading.querySelector('a') !== null
                  });
                });
              }
              
              // Analyser les problèmes de structure
              this.analyzeStructure(headingsData);
              
              console.log(`OptiRank: ${headingsData.items.length} titres détectés`, headingsData);
              return headingsData;
            },
            
            analyzeStructure: function(headingsData) {
              const counts = headingsData.counts;
              
              // Vérifier s'il y a plus d'un H1
              if (counts.h1 > 1) {
                headingsData.issues.push({
                  type: 'multiple_h1',
                  severity: 'high',
                  message: `Il y a ${counts.h1} titres H1 sur la page. Il devrait y en avoir un seul.`
                });
              }
              
              // Vérifier s'il n'y a pas de H1
              if (counts.h1 === 0) {
                headingsData.issues.push({
                  type: 'missing_h1',
                  severity: 'high',
                  message: 'Il n\'y a pas de titre H1 sur la page. Chaque page devrait avoir un H1.'
                });
              }
              
              // Vérifier les sauts dans la hiérarchie
              for (let i = 1; i < 6; i++) {
                if (counts[`h${i}`] === 0 && counts[`h${i+1}`] > 0) {
                  headingsData.issues.push({
                    type: 'hierarchy_skip',
                    severity: 'medium',
                    message: `Il y a des titres H${i+1} mais pas de titres H${i}. La hiérarchie des titres devrait être respectée.`
                  });
                }
              }
              
              // Vérifier les problèmes de ratio entre niveaux (sauf entre H2 et H1)
              for (let i = 2; i < 6; i++) {
                const currentCount = counts[`h${i+1}`] || 0;
                const parentCount = counts[`h${i}`] || 0;
                
                // Si il y a des titres du niveau actuel et du niveau parent
                if (currentCount > 0 && parentCount > 0) {
                  const ratio = currentCount / parentCount;
                  
                  // Problème si le ratio dépasse 3:1
                  if (ratio > 3) {
                    headingsData.issues.push({
                      type: 'ratio_imbalance',
                      severity: 'medium',
                      message: `Déséquilibre détecté: ${currentCount} titres H${i+1} pour ${parentCount} titre${parentCount > 1 ? 's' : ''} H${i} (ratio ${ratio.toFixed(1)}:1). Recommandation: maximum 3:1.`
                    });
                  }
                }
              }
              
              // Identifier les sections manquantes dans la structure logique
              this.identifyMissingSections(headingsData);
            },
            
            identifyMissingSections: function(headingsData) {
              const counts = headingsData.counts;
              headingsData.missingSections = [];
              
              // Analyser les niveaux manquants dans la hiérarchie
              for (let i = 1; i < 6; i++) {
                if (counts[`h${i}`] === 0 && counts[`h${i+1}`] > 0) {
                  // Section manquante détectée
                  headingsData.missingSections.push({
                    level: i,
                    reason: 'hierarchy_gap',
                    description: `Niveau H${i} manquant dans la hiérarchie`,
                    suggestion: `Ajouter des titres H${i} pour structurer le contenu avant les H${i+1}`
                  });
                }
              }
              
              // Suggestions pour une meilleure structure
              if (counts.h1 === 1 && counts.h2 === 0 && (counts.h3 > 0 || counts.h4 > 0 || counts.h5 > 0 || counts.h6 > 0)) {
                headingsData.missingSections.push({
                  level: 2,
                  reason: 'missing_main_sections',
                  description: 'Sections principales manquantes',
                  suggestion: 'Ajouter des titres H2 pour diviser le contenu en sections principales'
                });
              }
            }
          };
          
          console.log('OptiRank: Headings module created internally');
          const headingsData = window.OptiRankHeadings.detectHeadings();
          // Stocker les résultats pour le popup
          window.OptiRankUtils.headingsResults = headingsData;
          console.log('OptiRank: Headings analysis complete', headingsData);
        } catch (error) {
          console.error('OptiRank: Error creating headings module:', error);
        }
      } else {
        console.log('OptiRank: Headings module already loaded, analyzing headings');
        if (window.OptiRankHeadings && window.OptiRankHeadings.detectHeadings) {
          const headingsData = window.OptiRankHeadings.detectHeadings();
          // Stocker les résultats pour le popup
          window.OptiRankUtils.headingsResults = headingsData;
          console.log('OptiRank: Headings analysis complete', headingsData);
        }
      }
    }
    
    // Stocker les résultats de l'analyse pour le popup
    if (!window.OptiRankUtils.analysisResults) {
      window.OptiRankUtils.analysisResults = {};
    }
    
    // Démarrer le scan automatique des liens (toujours, pas seulement si activé dans les paramètres)
    console.log('OptiRank: Starting automatic scan of links');
    if (window.OptiRankScan && window.OptiRankScan.scanAllLinks) {
      window.OptiRankScan.scanAllLinks().then(results => {
        // Stocker les résultats pour le popup
        window.OptiRankUtils.analysisResults.links = results;
        console.log('OptiRank: Link analysis complete and stored', results);
      }).catch(error => {
        console.error('OptiRank: Error during link analysis:', error);
      });
    }
    
    // Analyser automatiquement les headings
    setTimeout(() => {
      analyzeHeadingsAutomatically();
      // Les résultats sont déjà stockés dans window.OptiRankUtils.headingsResults
    }, 500);
    
    // Initialiser les écouteurs de messages
    initMessageListeners();
    
    console.log('OptiRank: Initialization complete');
  } catch (error) {
    console.error('OptiRank: Error during initialization:', error);
  }
}

/**
 * Crée un pont pour l'API Chrome qui sera accessible à tous les modules
 */
function createChromeBridge() {
  // Vérifier si un pont existe déjà
  if (window.chromeBridge) {
    return window.chromeBridge;
  }
  
  console.log('OptiRank: Creating Chrome API bridge');
  
  // Créer l'objet pont
  window.chromeBridge = {
    available: false,
    runtime: {
      sendMessage: null,
      getURL: null,
      lastError: null
    },
    storage: {
      local: {
        get: null,
        set: null
      }
    }
  };
  
  // Vérifier si l'API Chrome est disponible
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    window.chromeBridge.available = true;
    
    // Créer des références aux fonctions de l'API Chrome
    window.chromeBridge.runtime.sendMessage = function(message, callback) {
      try {
        // Ajouter une gestion d'erreur pour les cas où le destinataire n'existe pas
        return chrome.runtime.sendMessage(message, function(response) {
          if (chrome.runtime.lastError) {
            console.warn('OptiRank: Runtime error in sendMessage:', chrome.runtime.lastError.message);
            // Appeler le callback avec un objet vide en cas d'erreur
            if (callback) callback({});
            return;
          }
          
          // Appeler le callback avec la réponse ou un objet vide
          if (callback) callback(response || {});
        });
      } catch (error) {
        console.error('OptiRank: Error in chrome.runtime.sendMessage bridge:', error);
        if (callback) callback({});
        return null;
      }
    };
    
    window.chromeBridge.runtime.getURL = function(path) {
      try {
        return chrome.runtime.getURL(path);
      } catch (error) {
        console.error('OptiRank: Error in chrome.runtime.getURL bridge:', error);
        return path;
      }
    };
    
    // Créer des références pour le stockage
    if (chrome.storage && chrome.storage.local) {
      window.chromeBridge.storage.local.get = function(keys, callback) {
        try {
          return chrome.storage.local.get(keys, callback);
        } catch (error) {
          console.error('OptiRank: Error in chrome.storage.local.get bridge:', error);
          if (callback) callback({});
          return null;
        }
      };
      
      window.chromeBridge.storage.local.set = function(items, callback) {
        try {
          return chrome.storage.local.set(items, callback);
        } catch (error) {
          console.error('OptiRank: Error in chrome.storage.local.set bridge:', error);
          if (callback) callback();
          return null;
        }
      };
    }
    
    console.log('OptiRank: Chrome API bridge created successfully');
  } else {
    console.warn('OptiRank: Chrome API not available, creating fallback bridge');
  }
  
  return window.chromeBridge;
}

/**
 * Initialise les écouteurs de messages pour la communication avec le popup et le background
 */
function initMessageListeners() {
  // Éviter les initialisations multiples
  if (window.optiRankMessageListenersInitialized) {
    return;
  }
  
  window.optiRankMessageListenersInitialized = true;
  
  // Créer le pont pour l'API Chrome
  createChromeBridge();
  
  // Vérifier que chrome.runtime est disponible
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.warn('OptiRank: chrome.runtime n\'est pas disponible, utilisation du mode de compatibilité');
    // Créer un substitut pour chrome.runtime.onMessage
    window.chromeRuntimeSubstitute = {
      listeners: [],
      addMessageListener: function(callback) {
        this.listeners.push(callback);
        return callback;
      },
      sendMessage: function(message) {
        console.log('OptiRank: Message envoyé via substitut:', message);
        // Simuler une réponse après un court délai
        setTimeout(() => {
          if (message.action === 'scanLinks') {
            window.OptiRankUtils.scanResults.inProgress = true;
            window.OptiRankUtils.scanResults.progress = 0;
            // Déclencher un scan manuel si possible
            if (window.OptiRankScan && window.OptiRankScan.scanAllLinks) {
              window.OptiRankScan.scanAllLinks();
            }
          }
        }, 100);
      }
    };
    
    // Démarrer un scan automatique après un court délai
    setTimeout(() => {
      console.log('OptiRank: Démarrage automatique du scan en mode compatibilité');
      // Vérifier si les modules nécessaires sont chargés
      if (!window.OptiRankScan) {
        console.warn('OptiRank: Module Scanner non disponible, vérification des modules...');
        // Vérifier si le module est disponible sous un autre nom
        if (window.OptiRankUtils && window.OptiRankUtils.modules && window.OptiRankUtils.modules.scanner) {
          window.OptiRankScan = window.OptiRankUtils.modules.scanner;
          console.log('OptiRank: Module Scanner trouvé dans window.OptiRankUtils.modules');
        }
      }
      
      if (window.OptiRankScan && window.OptiRankScan.scanAllLinks) {
        try {
          window.OptiRankScan.scanAllLinks().then(results => {
            console.log('OptiRank: Scan terminé avec succès en mode compatibilité', results);
          }).catch(error => {
            console.error('OptiRank: Erreur lors du scan en mode compatibilité', error);
          });
        } catch (error) {
          console.error('OptiRank: Erreur lors du démarrage du scan en mode compatibilité', error);
        }
      } else {
        console.error('OptiRank: Module Scanner non disponible, impossible de démarrer le scan');
        // Afficher les modules disponibles pour le débogage
        console.log('OptiRank: Modules disponibles:', window.OptiRankUtils ? Object.keys(window.OptiRankUtils) : 'Aucun');
      }
    }, 1500);
    return;
  }
  
  try {
    // Écouter les messages du popup ou du background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('OptiRank: Received message', message);
      
      // Demande de scan
      if (message.action === 'scanLinks') {
        // Vérifier si les modules sont chargés
        if (!window.OptiRankScan) {
          console.log('OptiRank: Scan module not loaded, requesting injection');
          chrome.runtime.sendMessage({ action: 'injectMainScripts' });
          sendResponse({ success: false, error: 'Modules not loaded' });
          return true;
        }
        
        // Lancer le scan
        window.OptiRankScan.scanAllLinks()
          .then(results => {
            sendResponse({ success: true, results: results });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
        
        return true; // Indique que sendResponse sera appelé de manière asynchrone
      }
      
      // Demande des résultats du dernier scan
      if (message.action === 'getScanResults') {
        console.log('OptiRank: Demande de récupération des résultats');
        
        // Vérifier si les résultats d'analyse sont disponibles
        if (window.OptiRankUtils && window.OptiRankUtils.analysisResults) {
          console.log('OptiRank: Résultats d\'analyse disponibles, envoi au popup');
          
          // Préparer l'objet de résultats
          const results = {
            links: [],
            headings: window.OptiRankUtils.headingsResults || null
          };
          
          // Récupérer les résultats des liens
          if (window.OptiRankUtils.analysisResults.links) {
            results.links = window.OptiRankUtils.analysisResults.links;
          } else if (window.OptiRankUtils.scanResults && window.OptiRankUtils.scanResults.links) {
            results.links = window.OptiRankUtils.scanResults.links;
          } else {
            // Collecter les informations sur les liens scannés directement depuis le DOM
            const linksArray = [];
            document.querySelectorAll('a').forEach(link => {
              if (link.dataset.optirankStatus) {
                linksArray.push({
                  url: link.href,
                  anchorText: link.textContent.trim() || '[Sans texte]',
                  status: link.dataset.optirankStatus === 'broken' ? 404 : 
                          link.dataset.optirankStatus === 'redirect' ? 302 : 200,
                  isExternal: link.dataset.optirankExternal === 'true',
                  rel: link.rel || '',
                  type: link.dataset.optirankType || 'unknown'
                });
              }
            });
            results.links = linksArray;
            console.log(`OptiRank: Collecté ${linksArray.length} liens depuis le DOM`);
          }
          
          // Envoyer les résultats au popup
          sendResponse({
            success: true,
            results: results
          });
        } else {
          console.warn('OptiRank: Impossible d\'envoyer les résultats au popup - résultats non disponibles');
          sendResponse({
            success: false,
            error: 'Résultats non disponibles'
          });
        }
        return true; // Indique que sendResponse sera appelé de manière asynchrone
      }
      
      // Demande de récupération des liens de la page
      if (message.action === 'getPageLinks') {
        console.log('OptiRank: Récupération des liens de la page pour le popup');
        
        // Collecter les informations sur tous les liens de la page
        const linksArray = [];
        const allLinks = document.querySelectorAll('a');
        console.log(`OptiRank: ${allLinks.length} liens trouvés dans le DOM`);
        
        allLinks.forEach(link => {
          // Ajouter tous les liens, même ceux qui n'ont pas été scannés
          const linkData = {
            url: link.href,
            anchorText: link.textContent.trim() || '[Sans texte]',
            status: link.dataset.optirankStatus === 'broken' ? 404 : 
                    link.dataset.optirankStatus === 'redirect' ? 302 : 200,
            isExternal: link.dataset.optirankExternal === 'true' || (link.hostname !== window.location.hostname),
            rel: link.rel || '',
            type: link.dataset.optirankType || 'unknown'
          };
          linksArray.push(linkData);
        });
        
        console.log(`OptiRank: Collected ${linksArray.length} links from the page`);
        console.log('OptiRank: Premier lien d\'exemple:', linksArray[0]);
        console.log('OptiRank: Dernier lien d\'exemple:', linksArray[linksArray.length - 1]);
        
        sendResponse({ links: linksArray });
        return true;
      }
      
      // Vérifier si le module d'analyse des titres est chargé
      if (message.action === 'checkHeadingsModuleLoaded') {
        console.log('OptiRank: Vérification du module d\'analyse des titres');
        sendResponse({ loaded: typeof window.OptiRankHeadings !== 'undefined' });
        return true;
      }
      
      // Analyser les titres de la page
      if (message.action === 'analyzeHeadings') {
        console.log('OptiRank: Analyse des titres de la page');
        
        // Vérifier si le module d'analyse des titres est chargé
        if (typeof window.OptiRankHeadings === 'undefined') {
          console.error('OptiRank: Module d\'analyse des titres non disponible');
          sendResponse({ success: false, error: 'Module d\'analyse des titres non disponible' });
          return true;
        }
        
        try {
          // Effectuer l'analyse des titres
          const headingsData = window.OptiRankHeadings.detectHeadings();
          console.log('OptiRank: Analyse des titres terminée', headingsData);
          
          // Stocker les résultats pour les récupérer plus tard
          window.OptiRankUtils.headingsResults = headingsData;
          
          // Envoyer les résultats au popup
          sendResponse({ success: true, headingsData: headingsData });
        } catch (error) {
          console.error('OptiRank: Erreur lors de l\'analyse des titres', error);
          sendResponse({ success: false, error: error.message });
        }
        
        return true;
      }
      
      // Récupérer les résultats de l'analyse des headings
      if (message.action === 'getHeadingsResults') {
        console.log('OptiRank: Récupération des résultats de l\'analyse des titres');
        
        // Vérifier si les résultats sont disponibles
        if (window.OptiRankUtils && window.OptiRankUtils.headingsResults) {
          console.log('OptiRank: Résultats de l\'analyse des titres disponibles');
          
          // Envoyer SEULEMENT les données brutes au popup - plus de pré-formatage
          const rawData = window.OptiRankUtils.headingsResults;
          console.log('OptiRank: Données brutes envoyées au popup:', rawData);
          sendResponse({ success: true, rawHeadingsData: rawData });
        } else {
          // Si les résultats ne sont pas disponibles, essayer d'analyser les titres maintenant
          if (typeof window.OptiRankHeadings !== 'undefined' && window.OptiRankHeadings.detectHeadings) {
            try {
              const rawData = window.OptiRankHeadings.detectHeadings();
              window.OptiRankUtils.headingsResults = rawData;
              console.log('OptiRank: Analyse des titres effectuée à la demande');
              console.log('OptiRank: Données brutes envoyées au popup:', rawData);
              sendResponse({ success: true, rawHeadingsData: rawData });
            } catch (error) {
              console.error('OptiRank: Erreur lors de l\'analyse des titres', error);
              sendResponse({ success: false, error: error.message });
            }
          } else {
            console.error('OptiRank: Module d\'analyse des titres non disponible');
            sendResponse({ success: false, error: 'Module d\'analyse des titres non disponible' });
          }
        }
        
        return true;
      }
      
      // Demande d'exportation des résultats
      if (message.action === 'exportResults') {
        if (!window.OptiRankReporter) {
          sendResponse({ success: false, error: 'Reporter module not loaded' });
          return false;
        }
        
        const format = message.format || 'csv';
        
        if (format === 'csv') {
          const csv = window.OptiRankReporter.exportResultsAsCsv();
          sendResponse({ success: true, data: csv, format: 'csv' });
        } else if (format === 'json') {
          const report = window.OptiRankReporter.generateCompleteReport();
          sendResponse({ success: true, data: JSON.stringify(report), format: 'json' });
        } else {
          sendResponse({ success: false, error: `Unsupported format: ${format}` });
        }
        
        return false;
      }
      
      // Aucune action reconnue
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
    });
    
    console.log('OptiRank: Message listeners initialized');
  } catch (error) {
    console.error('OptiRank: Error initializing message listeners:', error);
  }
}

// Initialiser l'extension quand le document est prêt
if (document.readyState === 'complete') {
  console.log('OptiRank: Document already complete, initializing now');
  initOptiRank();
} else {
  console.log('OptiRank: Waiting for document to be ready');
  window.addEventListener('load', initOptiRank);
}

// Exporter les fonctions
window.OptiRankMain = {
  initOptiRank,
  scanAllLinks: function() {
    // Proxy vers la fonction scanAllLinks du module scanner
    if (window.OptiRankScan && window.OptiRankScan.scanAllLinks) {
      return window.OptiRankScan.scanAllLinks();
    } else if (window.OptiRankUtils && window.OptiRankUtils.modules && window.OptiRankUtils.modules.scanner) {
      return window.OptiRankUtils.modules.scanner.scanAllLinks();
    } else {
      console.error('OptiRank: Scanner module not found');
      return Promise.reject(new Error('Scanner module not found'));
    }
  }
};

// S'assurer que le module est disponible dans l'objet global OptiRankUtils
if (window.OptiRankUtils) {
  window.OptiRankUtils.modules = window.OptiRankUtils.modules || {};
  window.OptiRankUtils.modules.main = window.OptiRankMain;
}

console.log('OptiRank: Main module loaded and exposed globally as window.OptiRankMain');
