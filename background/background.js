// OptiRank - Background Script
// This script runs in the background and handles communication between popup and content scripts

// Stockage des redirections et des liens brisés détectés
let detectedRedirects = {};
let detectedBrokenLinks = {};
let redirectChainMap = {}; // Pour suivre les chaînes de redirection

// Utiliser l'API chrome.webRequest pour détecter automatiquement toutes les redirections
chrome.webRequest.onBeforeRedirect.addListener(
  function(details) {
    // Détecter toutes les redirections (codes 300-399)
    if (details.statusCode >= 300 && details.statusCode < 400) {
      // Analyser et enrichir les informations de redirection
      const redirectInfo = {
        redirectUrl: details.redirectUrl,
        statusCode: details.statusCode,
        timestamp: Date.now(),
        type: getRedirectType(details.statusCode),
        initiator: details.initiator || 'unknown',
        fromCache: details.fromCache || false
      };
      
      // Stocker l'information de redirection
      detectedRedirects[details.url] = redirectInfo;
      
      // Conserver une référence inverse pour les URLs de redirection
      if (details.redirectUrl) {
        // Stocker également les informations pour l'URL de destination
        // Cela aide à identifier les chaînes de redirection
        const redirectChains = redirectChainMap[details.redirectUrl] || [];
        redirectChains.push(details.url);
        redirectChainMap[details.redirectUrl] = redirectChains;
      }
    }
  },
  {urls: ["<all_urls>"]},
  ["responseHeaders"]
);

// Détecter les redirections HTTP vers HTTPS de manière proactive
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    // Vérifier si l'URL d'origine est en HTTP (non-localhost)
    if (details.url.startsWith('http://') && !details.url.startsWith('http://localhost')) {
      // Créer l'URL HTTPS équivalente
      const httpsUrl = details.url.replace(/^http:/i, 'https:');
      
      // Vérifier si l'URL existe déjà dans notre base de redirections connues
      if (!detectedRedirects[details.url]) {
        // Utiliser chrome.tabs.executeScript pour vérifier si la version HTTPS est accessible
        testHttpsUrl(details.url, httpsUrl);
      }
    }
  },
  {urls: ["http://*/*"]}
);

// Détecter les liens brisés avec informations enrichies
chrome.webRequest.onCompleted.addListener(
  function(details) {
    // Détecter les liens brisés (codes 400+)
    if (details.statusCode >= 400) {
      // Enrichir les informations sur le lien brisé
      detectedBrokenLinks[details.url] = {
        statusCode: details.statusCode,
        timestamp: Date.now(),
        type: getErrorType(details.statusCode),
        initiator: details.initiator || 'unknown',
        fromCache: details.fromCache || false
      };
    }
  },
  {urls: ["<all_urls>"]},
  ["responseHeaders"]
);

// L'API fetch ne peut pas toujours détecter les redirections à cause du CORS
// Cette fonction vérifie activement si une URL HTTP peut être redirigée vers HTTPS
async function testHttpsUrl(httpUrl, httpsUrl) {
  try {
    // Utiliser XMLHttpRequest pour éviter les limitations CORS
    const xhr = new XMLHttpRequest();
    xhr.timeout = 5000; // 5 secondes de timeout
    
    // Stocker temporairement la redirection comme "en cours de vérification"
    detectedRedirects[httpUrl] = {
      redirectUrl: httpsUrl,
      statusCode: 307, // Temporary Redirect
      timestamp: Date.now(),
      isVerifying: true
    };
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        // Si la version HTTPS est accessible, c'est une redirection valide
        if (xhr.status >= 200 && xhr.status < 400) {
          detectedRedirects[httpUrl] = {
            redirectUrl: httpsUrl,
            statusCode: 301, // Permanent Redirect (HTTP->HTTPS est généralement permanent)
            timestamp: Date.now(),
            verified: true,
            type: 'http-to-https'
          };
        } else if (xhr.status >= 400) {
          delete detectedRedirects[httpUrl]; // Supprimer la redirection temporaire
        }
      }
    };
    
    xhr.open('HEAD', httpsUrl, true);
    xhr.send();
  } catch (error) {
    console.error(`OptiRank: Erreur lors de la vérification HTTPS: ${error.message}`);
    delete detectedRedirects[httpUrl]; // Supprimer la redirection temporaire en cas d'erreur
  }
}

// Déterminer le type de redirection en fonction du code de statut
function getRedirectType(statusCode) {
  switch (statusCode) {
    case 301: return 'permanent'; // Moved Permanently
    case 302: return 'temporary'; // Found (Temporarily Moved)
    case 303: return 'see-other'; // See Other
    case 307: return 'temporary-strict'; // Temporary Redirect
    case 308: return 'permanent-strict'; // Permanent Redirect
    default: return 'other'; // Autres codes 3xx
  }
}

// Déterminer le type d'erreur en fonction du code de statut
function getErrorType(statusCode) {
  if (statusCode >= 400 && statusCode < 500) {
    switch (statusCode) {
      case 401: return 'unauthorized';
      case 403: return 'forbidden';
      case 404: return 'not-found';
      case 429: return 'rate-limited';
      default: return 'client-error';
    }
  } else if (statusCode >= 500) {
    return 'server-error';
  }
  return 'unknown-error';
}

// Nettoyer périodiquement les anciennes détections (toutes les 15 minutes)
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  
  // Nettoyer les redirections
  Object.keys(detectedRedirects).forEach(url => {
    if (detectedRedirects[url].timestamp < oneHourAgo) {
      delete detectedRedirects[url];
      
      // Nettoyer également les entrées correspondantes dans redirectChainMap
      Object.keys(redirectChainMap).forEach(destUrl => {
        redirectChainMap[destUrl] = redirectChainMap[destUrl].filter(sourceUrl => sourceUrl !== url);
        if (redirectChainMap[destUrl].length === 0) {
          delete redirectChainMap[destUrl];
        }
      });
    }
  });
  
  // Nettoyer les liens brisés
  Object.keys(detectedBrokenLinks).forEach(url => {
    if (detectedBrokenLinks[url].timestamp < oneHourAgo) {
      delete detectedBrokenLinks[url];
    }
  });
}, 900000); // 15 minutes

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    chrome.action.openPopup();
  }
});

// Variables globales pour stocker les résultats et callbacks
let latestScanResults = null;
const pendingScanCallbacks = {};

// Fonction simplifiée pour envoyer les résultats à la popup
function sendResultsToPopup(tabId, results) {
  try {
    chrome.runtime.sendMessage({
      action: 'scanResults',
      tabId: tabId,
      results: results
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Ce n'est pas une erreur critique, juste un log de débogage
        // console.error('OptiRank Background: Error sending scan results:', chrome.runtime.lastError);
      } else {
        // Nettoyer le callback une fois utilisé
        if (pendingScanCallbacks[tabId]) {
          delete pendingScanCallbacks[tabId];
        }
      }
    });
  } catch (error) {
    console.error('OptiRank Background: Error in sendResultsToPopup:', error);
  }
}

// Variable pour suivre l'état de chargement des scripts
let scriptsLoadedTabs = {};

// Liste des scripts à injecter dans l'ordre de dépendance
const contentScripts = [
  'content/utils.js',
  'content/data.js',
  'content/styles.js',
  'content/ui.js',
  'content/stats.js',
  'content/linkChecker.js',
  'content/scan.js',
  'content/filter.js',
  'content/messaging.js',
  'content/main.js'
];

/**
 * Injecte les scripts de manière séquentielle dans l'ordre spécifié
 * @param {number} tabId - ID de l'onglet où injecter les scripts
 * @param {string[]} scripts - Tableau des chemins de scripts à injecter
 * @param {number} index - Index du script actuel à injecter
 * @returns {Promise} - Promise résolue lorsque tous les scripts sont injectés
 */
function injectScriptsSequentially(tabId, scripts, index) {
  return new Promise((resolve, reject) => {
    // Si tous les scripts ont été injectés, résoudre la promesse
    if (index >= scripts.length) {
      resolve();
      return;
    }
    
    const scriptPath = scripts[index];
    // console.log(`OptiRank: Injecting script ${index + 1}/${scripts.length}: ${scriptPath}`);
    
    // Injecter le script actuel
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: [scriptPath]
    })
    .then(() => {
      // console.log(`OptiRank: Script ${scriptPath} injected successfully`);
      // Attendre un court instant avant d'injecter le script suivant
      setTimeout(() => {
        // Injecter le script suivant de manière récursive
        injectScriptsSequentially(tabId, scripts, index + 1)
          .then(resolve)
          .catch(reject);
      }, 100); // Petit délai entre chaque injection pour assurer l'ordre de chargement
    })
    .catch(error => {
      console.error(`OptiRank: Error injecting script ${scriptPath}:`, error);
      // Continuer avec le script suivant malgré l'erreur
      setTimeout(() => {
        injectScriptsSequentially(tabId, scripts, index + 1)
          .then(resolve)
          .catch(reject);
      }, 100);
    });
  });
}

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Suppression du log : console.log(`OptiRank Background: Message reçu`, message);
  
  // Action: Vérifier un lot d'URLs en une seule requête
  if (message.action === 'batchCheckLinks' && Array.isArray(message.urls)) {
    const urls = message.urls;
    // Suppression du log : console.log(`OptiRank Background: Vérification par lots de ${urls.length} URLs`);
    
    // Préparer les résultats
    const knownRedirects = [];
    const knownBroken = [];
    const knownValid = [];
    const unknownUrls = [];
    
    // Vérifier chaque URL
    urls.forEach(url => {
      // Vérifier si c'est une redirection connue
      if (detectedRedirects[url]) {
        knownRedirects.push(url);
      }
      // Vérifier si c'est un lien cassé connu
      else if (detectedBrokenLinks[url]) {
        knownBroken.push(url);
      }
      // Sinon, considérer comme inconnu
      else {
        unknownUrls.push(url);
      }
    });
    
    // Envoyer les résultats
    sendResponse({
      success: true,
      knownRedirects,
      knownBroken,
      knownValid,
      unknownUrls
    });
    
    return true; // Indique que sendResponse sera appelé de manière asynchrone
  }
  
  // Action: Vérifier si une URL est une redirection connue
  if (message.action === 'checkRedirect' && message.url) {
    const url = message.url;
    
    // Vérifier si l'URL est une redirection connue
    if (detectedRedirects[url]) {
      const redirectInfo = detectedRedirects[url];
      
      // Si la redirection est en cours de vérification, attendre
      if (!redirectInfo.verified && redirectInfo.checking) {
        // Suppression du log : console.log(`OptiRank Background: Redirection en cours de vérification pour ${url}`);
        
        sendResponse({
          isRedirect: false,
          isVerifying: true
        });
        return true;
      }
      
      // Suppression du log : console.log(`OptiRank Background: Redirection confirmée pour ${url} -> ${redirectInfo.redirectUrl} (${redirectInfo.statusCode})`);
      
      // Répondre avec les informations complètes de redirection
      sendResponse({
        isRedirect: true,
        redirectUrl: redirectInfo.redirectUrl,
        statusCode: redirectInfo.statusCode,
        type: redirectInfo.type || getRedirectType(redirectInfo.statusCode),
        timestamp: redirectInfo.timestamp
      });
    } else {
      // Vérifier si l'URL fait partie d'une chaîne de redirection connue
      if (redirectChainMap[url] && redirectChainMap[url].length > 0) {
        const sourceUrl = redirectChainMap[url][0]; // Premier URL dans la chaîne
        // Suppression du log : console.log(`OptiRank Background: URL détectée comme destination de redirection depuis ${sourceUrl}`);
        
        sendResponse({
          isRedirect: true,
          redirectUrl: url,
          sourceUrl: sourceUrl,
          statusCode: 200, // L'URL elle-même n'est pas une redirection, mais elle est la destination d'une redirection
          isRedirectTarget: true
        });
      } else {
        // Vérifier si c'est une URL HTTP qui pourrait être redirigée vers HTTPS
        if (url.startsWith('http://') && !url.startsWith('http://localhost')) {
          const httpsUrl = url.replace(/^http:/i, 'https:');
          
          // Lancer une vérification active
          // Suppression du log : console.log(`OptiRank Background: Lancement de vérification HTTP->HTTPS pour ${url}`);
          testHttpsUrl(url, httpsUrl);
          
          // Indiquer que la vérification est en cours
          sendResponse({
            isRedirect: false,
            isVerifying: true,
            possibleHttpsRedirect: httpsUrl
          });
        } else {
          // Pas de redirection connue
          sendResponse({
            isRedirect: false
          });
        }
      }
    }
    
    return true; // Indique que sendResponse sera appelé de manière asynchrone
  }
  // Gérer l'enregistrement d'un callback pour les résultats de scan
  if (message.action === 'registerScanCallback') {
    const tabId = message.tabId;
    if (!tabId) {
      console.error('OptiRank Background: No tab ID provided for registerScanCallback');
      sendResponse({ success: false, error: 'No tab ID provided' });
      return true;
    }
    
    // Suppression du log : console.log(`OptiRank Background: Registering scan callback for tab ${tabId}`);
    
    // Enregistrer le callback pour les futurs résultats
    pendingScanCallbacks[tabId] = (result) => {
      // Suppression du log : console.log(`OptiRank Background: Executing callback for tab ${tabId} with results:`, result.success);
      // Utiliser notre fonction robuste pour envoyer les résultats
      try {
        sendResultsToPopup(tabId, result.results);
      } catch (error) {
        console.error('OptiRank Background: Error sending results to popup:', error);
      }
    };
    
    // Si nous avons déjà des résultats pour cet onglet, les envoyer immédiatement
    const hasExistingResults = latestScanResults !== null;
    if (hasExistingResults) {
      // Suppression du log : console.log(`OptiRank Background: We already have scan results, sending them immediately for tab ${tabId}`);
      // Utiliser notre fonction robuste pour envoyer les résultats immédiatement
      sendResultsToPopup(tabId, latestScanResults);
    }
    
    // Répondre au popup pour confirmer l'enregistrement du callback
    sendResponse({ 
      success: true, 
      hasExistingResults: hasExistingResults 
    });
    return true;
  }
  
  // Gérer les messages de progression du scan
  if (message.action === 'scanProgress') {
    // Récupérer l'ID de l'onglet depuis le sender
    const tabId = sender && sender.tab ? sender.tab.id : null;
    
    if (!tabId) {
      console.error('OptiRank Background: No tab ID for scanProgress');
      return false;
    }
    
    // Suppression du log : console.log(`OptiRank Background: Received scan progress update: ${message.progress}% for tab ${tabId}`);
    
    // Relayer le message de progression à la popup sans attendre de réponse
    try {
      chrome.runtime.sendMessage({
        action: 'scanProgress',
        tabId: tabId,
        progress: message.progress
      });
    } catch (error) {
      console.error('OptiRank Background: Error sending progress update:', error);
    }
    
    return false; // Ne pas attendre de réponse asynchrone
  }
  
  // Gérer la réception des résultats de scan
  if (message.action === 'scanCompleted') {
    // Récupérer l'ID de l'onglet depuis le sender (pour les messages des content scripts)
    // ou depuis le message (pour les messages des popups ou autres)
    const tabId = message.tabId || (sender && sender.tab ? sender.tab.id : null);
    
    // Suppression du log verbeux
    
    if (!tabId) {
      console.error('OptiRank Background: No tab ID for scanCompleted');
      if (sendResponse) sendResponse({ success: false, error: 'No tab ID provided' });
      return false;
    }
    
    // Vérifier que les résultats sont valides
    if (!message.results) {
      console.error('OptiRank Background: Received empty scan results');
      if (sendResponse) sendResponse({ success: false, error: 'Empty scan results' });
      return false;
    }
    
    // Faire une copie profonde des résultats pour éviter les références partagées
    const safeResults = JSON.parse(JSON.stringify(message.results));
    
    // Vérifier la cohérence des résultats
    const sum = (safeResults.valid || 0) + (safeResults.broken || 0) + (safeResults.redirects || 0) + 
                (safeResults.skippedLinks || 0) + (safeResults.spamLinks || 0);
    
    if (safeResults.total !== sum) {
      console.warn(`OptiRank Background: Total mismatch - Total: ${safeResults.total}, Sum: ${sum}`);
    }
    
    // Stocker les résultats
    latestScanResults = safeResults;
    
    // Transmettre les résultats au popup via sendResultsToPopup
    console.log(`OptiRank Background: Forwarding scan results to popup for tab ${tabId}`);
    sendResultsToPopup(tabId, safeResults);
    
    // Confirmer la réception au content script sans attendre de réponse asynchrone
    if (sendResponse) sendResponse({ success: true, received: true, message: 'Results will be forwarded to popup' });
    return false;
  }
  
  // Gérer la réception des erreurs de scan
  if (message.action === 'scanError') {
    console.error('OptiRank Background: Received scan error for tab', message.tabId, message.error);
    
    // Transmettre l'erreur au popup si nécessaire
    if (message.tabId && pendingScanCallbacks[message.tabId]) {
      // Suppression du log : console.log('OptiRank Background: Forwarding scan error to popup');
      pendingScanCallbacks[message.tabId]({ success: false, message: message.error });
      delete pendingScanCallbacks[message.tabId];
    }
    
    return false;
  }
  
  // Gérer la demande d'injection des scripts
  if (message.action === 'injectMainScripts') {
    // Suppression du log : console.log('OptiRank: Request to inject main scripts');
    
    // Déterminer le tabId à utiliser
    const tabId = message.tabId || (sender.tab ? sender.tab.id : null);
    if (!tabId) {
      console.error('OptiRank: No tab ID provided for script injection');
      sendResponse({ success: false, error: 'No tab ID provided' });
      return false;
    }
    
    // Vérifier si les scripts sont déjà chargés
    if (scriptsLoadedTabs[tabId] === true) {
      // Suppression du log : console.log(`OptiRank: Scripts already loaded for tab ${tabId}`);
      sendResponse({ success: true, alreadyLoaded: true });
      return false;
    }
    
    // Suppression du log : console.log(`OptiRank: Injecting scripts for tab ${tabId}`);
    
    // Injecter les scripts un par un dans l'ordre
    injectScriptsSequentially(tabId, contentScripts, 0)
      .then(() => {
        // Suppression du log : console.log(`OptiRank: All scripts injected successfully for tab ${tabId}`);
        scriptsLoadedTabs[tabId] = true;
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error(`OptiRank: Error injecting scripts for tab ${tabId}:`, error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Indique que nous enverrons une réponse de manière asynchrone
  }
  
  // Gérer la demande de chargement des scripts (ancienne méthode, pour compatibilité)
  if (message.action === 'ensureScriptsLoaded') {
    // Suppression du log : console.log(`OptiRank: Request to ensure scripts are loaded for tab ${message.tabId}`);
    
    const tabId = message.tabId;
    if (!tabId) {
      sendResponse({ success: false, error: 'No tab ID provided' });
      return false;
    }
    
    // Vérifier si les scripts sont déjà chargés
    if (scriptsLoadedTabs[tabId] === true) {
      // Suppression du log : console.log(`OptiRank: Scripts already loaded for tab ${tabId}`);
      sendResponse({ success: true, alreadyLoaded: true });
      return false;
    }
    
    // Injecter les scripts via la nouvelle méthode
    injectScriptsSequentially(tabId, contentScripts, 0)
      .then(() => {
        // Suppression du log : console.log(`OptiRank: All scripts injected successfully for tab ${tabId}`);
        scriptsLoadedTabs[tabId] = true;
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error(`OptiRank: Error injecting scripts for tab ${tabId}:`, error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Indique que nous enverrons une réponse de manière asynchrone
  }
  
  // Gérer le statut du loader
  if (message.action === 'loaderStatus') {
    // Suppression du log : console.log(`OptiRank: Loader status update from tab ${sender.tab?.id}:`, message.status);
    
    if (sender.tab && sender.tab.id) {
      if (message.status === 'scriptsNotLoaded') {
        scriptsLoadedTabs[sender.tab.id] = false;
      } else if (message.status === 'scriptsLoaded') {
        scriptsLoadedTabs[sender.tab.id] = true;
      }
    }
    
    sendResponse({ success: true });
    return false;
  }
  
  // Gérer la vérification des liens externes (pour éviter les erreurs CORS)
  if (message.action === 'checkExternalLink' && message.url) {
    const url = message.url;
    // Suppression du log : console.log(`OptiRank Background: Vérification de lien externe: ${url}`);
    
    // Vérifier d'abord si nous avons déjà une redirection connue pour cette URL
    if (detectedRedirects[url]) {
      const redirectInfo = detectedRedirects[url];
      // Suppression du log : console.log(`OptiRank Background: Redirection connue pour lien externe: ${url} -> ${redirectInfo.redirectUrl}`);
      
      sendResponse({
        success: true,
        isRedirect: true,
        isBroken: false,
        statusCode: redirectInfo.statusCode,
        redirectUrl: redirectInfo.redirectUrl
      });
      
      return true;
    }
    
    // Vérifier si le lien est déjà connu comme cassé
    if (detectedBrokenLinks[url]) {
      const brokenInfo = detectedBrokenLinks[url];
      // Suppression du log : console.log(`OptiRank Background: Lien cassé connu: ${url} (${brokenInfo.statusCode})`);
      
      sendResponse({
        success: true,
        isRedirect: false,
        isBroken: true,
        statusCode: brokenInfo.statusCode
      });
      
      return true;
    }
    
    // Effectuer une vérification active du lien externe
    try {
      // Utiliser XMLHttpRequest pour éviter les limitations CORS
      const xhr = new XMLHttpRequest();
      xhr.timeout = 5000; // 5 secondes de timeout
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          // Traiter la réponse en fonction du code de statut
          if (xhr.status >= 300 && xhr.status < 400) {
            // C'est une redirection
            const redirectUrl = xhr.getResponseHeader('Location') || '';
            // Suppression du log : console.log(`OptiRank Background: Redirection détectée pour lien externe: ${url} -> ${redirectUrl} (${xhr.status})`);
            
            // Enregistrer la redirection pour les futures vérifications
            detectedRedirects[url] = {
              redirectUrl: redirectUrl,
              statusCode: xhr.status,
              timestamp: Date.now(),
              type: getRedirectType(xhr.status)
            };
            
            sendResponse({
              success: true,
              isRedirect: true,
              isBroken: false,
              statusCode: xhr.status,
              redirectUrl: redirectUrl
            });
          } else if (xhr.status >= 400) {
            // C'est un lien cassé
            // Suppression du log : console.log(`OptiRank Background: Lien externe cassé détecté: ${url} (${xhr.status})`);
            
            // Enregistrer le lien cassé pour les futures vérifications
            detectedBrokenLinks[url] = {
              statusCode: xhr.status,
              timestamp: Date.now(),
              type: getErrorType(xhr.status)
            };
            
            sendResponse({
              success: true,
              isRedirect: false,
              isBroken: true,
              statusCode: xhr.status
            });
          } else if (xhr.status >= 200 && xhr.status < 300) {
            // C'est un lien valide
            // Suppression du log : console.log(`OptiRank Background: Lien externe valide: ${url} (${xhr.status})`);
            
            sendResponse({
              success: true,
              isRedirect: false,
              isBroken: false,
              statusCode: xhr.status
            });
          } else {
            // Statut inconnu
            // Suppression du log : console.log(`OptiRank Background: Statut inconnu pour lien externe: ${url} (${xhr.status})`);
            
            sendResponse({
              success: true,
              isRedirect: false,
              isBroken: false,
              statusCode: xhr.status,
              isUnknownStatus: true
            });
          }
        }
      };
      
      xhr.ontimeout = function() {
        // Suppression du log : console.log(`OptiRank Background: Timeout pour lien externe: ${url}`);
        sendResponse({
          success: true,
          isRedirect: false,
          isBroken: true,
          statusCode: 0,
          isTimeout: true
        });
      };
      
      xhr.onerror = function() {
        // Suppression du log : console.log(`OptiRank Background: Erreur pour lien externe: ${url}`);
        sendResponse({
          success: true,
          isRedirect: false,
          isBroken: true, // Considérer comme cassé si on ne peut pas y accéder
          statusCode: 0,
          isError: true
        });
      };
      
      // Tenter d'abord avec HEAD pour minimiser le trafic
      xhr.open('HEAD', url, true);
      xhr.send();
    } catch (error) {
      console.error(`OptiRank Background: Erreur lors de la vérification du lien externe: ${error.message}`);
      sendResponse({
        success: false,
        error: error.message
      });
    }
    
    return true; // Indique que nous enverrons une réponse de manière asynchrone
  }
  
  // Gérer la demande de scan de l'onglet courant
  if (message.action === 'scanCurrentTab') {
    // Si nous avons déjà des résultats et pas de nouvelles options, les renvoyer immédiatement
    if (latestScanResults && !message.options) {
      sendResponse(latestScanResults);
      return false;
    }
    
    // Vérifier si les scripts sont chargés pour cet onglet
    if (sender.tab && sender.tab.id && scriptsLoadedTabs[sender.tab.id] === false) {
      // Suppression du log : console.log(`OptiRank: Scripts not loaded for tab ${sender.tab.id}, loading them now`);
      
      // Charger les scripts avant de scanner
      chrome.tabs.sendMessage(sender.tab.id, { action: 'loadScripts' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('OptiRank: Error loading scripts:', chrome.runtime.lastError);
          sendResponse({ success: false, error: 'Failed to load scripts' });
          return;
        }
        
        // Attendre un peu pour que les scripts se chargent
        setTimeout(() => {
          // Marquer les scripts comme chargés
          scriptsLoadedTabs[sender.tab.id] = true;
          
          // Lancer le scan
          scanCurrentTab(message.options).then(results => {
            sendResponse(results);
          });
        }, 500);
      });
    } else {
      // Les scripts sont déjà chargés, lancer le scan directement
      scanCurrentTab(message.options).then(results => {
        sendResponse(results);
      });
    }
    
    return true; // Indique que nous enverrons une réponse de manière asynchrone
  } else if (message.action === 'scanComplete') {
    // Store results from content script
    latestScanResults = message.results;
    
    // Mettre à jour le badge pour indiquer que le scan est terminé
    chrome.action.setBadgeText({ text: '' });
    
    // Si des liens cassés ont été trouvés, afficher leur nombre
    if (latestScanResults && latestScanResults.broken > 0) {
      chrome.action.setBadgeText({ text: latestScanResults.broken.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
    }
  } else if (message.action === 'scanProgress') {
    // Mettre à jour le badge avec la progression du scan
    const progress = message.progress || 0;
    
    // Afficher la progression dans le badge
    chrome.action.setBadgeText({ text: progress + '%' });
    chrome.action.setBadgeBackgroundColor({ color: '#3498db' });
    
    // Stocker les résultats partiels
    if (message.results) {
      latestScanResults = message.results;
    }
  } else if (message.action === 'getRedirects') {
    // Renvoyer les redirections détectées pour les URLs demandées
    const urls = message.urls || [];
    const redirectsForUrls = {};
    
    urls.forEach(url => {
      if (detectedRedirects[url]) {
        redirectsForUrls[url] = detectedRedirects[url];
      }
    });
    
    sendResponse({
      success: true,
      redirects: redirectsForUrls
    });
  } else if (message.action === 'checkLinks') {
    // Vérifier le statut des liens (redirections et liens brisés)
    const urls = message.urls || [];
    const results = {};
    
    // Suppression du log : console.log(`OptiRank DEBUG: Vérification de ${urls.length} liens depuis le background script`);
    
    urls.forEach(url => {
      results[url] = {
        isRedirect: false,
        isBroken: false,
        statusCode: null,
        redirectUrl: null
      };
      
      // Vérifier si c'est une redirection
      if (detectedRedirects[url]) {
        results[url].isRedirect = true;
        results[url].statusCode = detectedRedirects[url].statusCode;
        results[url].redirectUrl = detectedRedirects[url].redirectUrl;
        // Suppression du log : console.log(`%cOptiRank BACKGROUND: REDIRECTION [${detectedRedirects[url].statusCode}] ${url} -> ${detectedRedirects[url].redirectUrl}`, 'color: orange; font-weight: bold;');
      }
      
      // Vérifier si c'est un lien brisé
      if (detectedBrokenLinks[url]) {
        results[url].isBroken = true;
        results[url].statusCode = detectedBrokenLinks[url].statusCode;
        // Suppression du log : console.log(`%cOptiRank BACKGROUND: LIEN BRISÉ [${detectedBrokenLinks[url].statusCode}] ${url}`, 'color: red; font-weight: bold;');
      }
      
      // Si ni redirection ni brisé, vérifier manuellement
      if (!results[url].isRedirect && !results[url].isBroken) {
        // Faire une vérification manuelle avec XMLHttpRequest
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, false); // Synchrone pour simplifier
        try {
          xhr.send();
          
          // Vérifier si c'est une redirection (3xx)
          if (xhr.status >= 300 && xhr.status < 400) {
            results[url].isRedirect = true;
            results[url].statusCode = xhr.status;
            results[url].redirectUrl = xhr.responseURL !== url ? xhr.responseURL : null;
            // Suppression du log : console.log(`%cOptiRank BACKGROUND: REDIRECTION DÉTECTÉE [${xhr.status}] ${url} -> ${results[url].redirectUrl || 'URL inconnue'}`, 'color: orange; font-weight: bold;');
            
            // Stocker pour les futures vérifications
            detectedRedirects[url] = {
              redirectUrl: results[url].redirectUrl || url,
              statusCode: xhr.status,
              timestamp: Date.now()
            };
          } 
          // Vérifier si c'est un lien brisé (4xx, 5xx)
          else if (xhr.status >= 400) {
            results[url].isBroken = true;
            results[url].statusCode = xhr.status;
            // Suppression du log : console.log(`%cOptiRank BACKGROUND: LIEN BRISÉ DÉTECTÉ [${xhr.status}] ${url}`, 'color: red; font-weight: bold;');
            
            // Stocker pour les futures vérifications
            detectedBrokenLinks[url] = {
              statusCode: xhr.status,
              timestamp: Date.now()
            };
          } else {
            // Suppression du log : console.log(`%cOptiRank BACKGROUND: LIEN VALIDE [${xhr.status}] ${url}`, 'color: green;');
          }
        } catch (error) {
          // Suppression du log : console.log(`OptiRank BACKGROUND: Erreur lors de la vérification manuelle de ${url}`, error);
        }
      }
    });
    
    sendResponse({
      success: true,
      results: results
    });
    
    // Update badge with number of broken links
    if (latestScanResults && latestScanResults.broken > 0) {
      chrome.action.setBadgeText({ text: latestScanResults.broken.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
});

// When a tab is updated (page load completes), clear the stored results
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    latestScanResults = null;
    chrome.action.setBadgeText({ text: '' });
  }
});

// Function to scan links in the current tab
async function scanCurrentTab(options = null) {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      return { error: 'No active tab found' };
    }
    
    // Vérifier si les scripts sont chargés pour cet onglet
    if (scriptsLoadedTabs[tab.id] === false) {
      // Suppression du log : console.log(`OptiRank: Scripts not loaded for tab ${tab.id}, loading them now`);
      
      // Essayer de charger les scripts
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'loadScripts' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('OptiRank: Error loading scripts:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
              return;
            }
            
            // Attendre un peu pour que les scripts se chargent
            setTimeout(() => {
              // Marquer les scripts comme chargés
              scriptsLoadedTabs[tab.id] = true;
              resolve();
            }, 500);
          });
        });
      } catch (error) {
        console.error('OptiRank: Failed to load scripts:', error);
        return { error: 'Failed to load scripts. Please refresh the page and try again.' };
      }
    }
    
    // Envoyer un message au content script pour scanner les liens avec les options
    const results = await chrome.tabs.sendMessage(tab.id, { 
      action: 'scanLinks',
      options: options || {
        scanInternal: true,
        scanExternal: true,
        checkAnchorText: true,
        checkArchive: true
      }
    });
    
    // Envoyer un message au content script pour réinitialiser les surlignages
    await chrome.tabs.sendMessage(tab.id, { action: 'resetHighlights' });
    
    return results;
  } catch (error) {
    console.error('Error scanning tab:', error);
    return { error: error.message || 'Unknown error occurred' };
  }
}
