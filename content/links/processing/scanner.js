/**
 * @fileoverview OptiRank - Module de scan des liens
 * Ce module est responsable de l'orchestration du scan complet des liens sur une page web.
 * Il coordonne le processus de détection, de traitement et de rapport des liens.
 * 
 * @module linkScanner
 * @requires linkDetector
 * @requires linkProcessor
 * @requires linkReporter
 * @author OptiRank Team
 * @version 1.0.0
 */

/**
 * Vérifie et corrige les totaux dans les résultats de scan pour assurer la cohérence des données
 * Cette fonction s'assure que le nombre total de liens correspond à la somme des différentes catégories.
 * 
 * @function verifyAndFixTotals
 * @param {Object} results - Résultats du scan de liens
 * @param {number} results.total - Nombre total de liens scannés
 * @param {number} results.valid - Nombre de liens valides
 * @param {number} results.broken - Nombre de liens cassés
 * @param {number} results.redirects - Nombre de liens avec redirection
 * @param {number} results.nofollow - Nombre de liens avec attribut nofollow
 * @param {number} results.skippedLinks - Nombre de liens ignorés
 * @param {number} results.spamLinks - Nombre de liens considérés comme spam
 * @returns {Object} - Résultats avec totaux corrigés
 * @example
 * const correctedResults = verifyAndFixTotals({
 *   total: 100, // Valeur incorrecte
 *   valid: 80,
 *   broken: 5,
 *   redirects: 10,
 *   nofollow: 3,
 *   skippedLinks: 2,
 *   spamLinks: 0
 * });
 * // correctedResults.total sera 100 (80+5+10+3+2+0)
 */
function verifyAndFixTotals(results) {
  // Calculer la somme des liens par catégorie
  const sum = (results.valid || 0) + 
              (results.broken || 0) + 
              (results.redirects || 0) + 
              (results.nofollow || 0) + 
              (results.skippedLinks || 0) + 
              (results.spamLinks || 0);
  
  // Si le total ne correspond pas à la somme, corriger
  if (results.total !== sum) {
    console.log(`OptiRank: Correcting total count from ${results.total} to ${sum}`);
    results.total = sum;
  }
  
  return results;
}

/**
 * Vérifie et marque la présence de redirections et de liens cassés dans les résultats
 * Cette fonction ajoute des indicateurs booléens pour faciliter l'affichage des résultats
 * dans l'interface utilisateur.
 * 
 * @function checkActualRedirects
 * @param {Object} results - Résultats du scan de liens
 * @param {number} results.redirects - Nombre de liens avec redirection
 * @param {number} results.broken - Nombre de liens cassés
 * @returns {Object} - Résultats avec indicateurs de présence ajoutés
 * @returns {boolean} returns.hasRedirects - true si des redirections ont été détectées
 * @returns {boolean} returns.hasBrokenLinks - true si des liens cassés ont été détectés
 * @example
 * const updatedResults = checkActualRedirects({
 *   redirects: 5,
 *   broken: 2
 * });
 * // updatedResults.hasRedirects sera true
 * // updatedResults.hasBrokenLinks sera true
 */
function checkActualRedirects(results) {
  // Vérifier si des redirections ont été détectées
  if (results.redirects > 0) {
    results.hasRedirects = true;
  }
  
  // Vérifier si des liens cassés ont été détectés
  if (results.broken > 0) {
    results.hasBrokenLinks = true;
  }
  
  return results;
}

/**
 * Effectue un pré-scan des liens en utilisant le background script pour détecter rapidement les redirections connues
 * Cette optimisation permet d'éviter de vérifier à nouveau des liens déjà connus par le background script.
 * 
 * @function preScanLinks
 * @async
 * @param {Array<string>} urls - Liste des URLs à pré-vérifier
 * @returns {Promise<Object>} - Résultats du pré-scan
 * @returns {Array<string>} returns.knownRedirects - URLs identifiées comme redirections
 * @returns {Array<string>} returns.knownBroken - URLs identifiées comme cassées
 * @returns {Array<string>} returns.knownValid - URLs identifiées comme valides
 * @returns {Array<string>} returns.unknownUrls - URLs qui nécessitent une vérification complète
 * @example
 * const urls = ['https://example.com', 'https://redirect.example.com'];
 * const preScanResults = await preScanLinks(urls);
 * console.log(`${preScanResults.knownRedirects.length} redirections déjà connues`);
 * console.log(`${preScanResults.unknownUrls.length} URLs à vérifier`);
 */
async function preScanLinks(urls) {
  console.log(`OptiRank: Pre-checking ${urls.length} links`);
  
  // Envoyer les URLs au background script pour vérification
  return new Promise((resolve) => {
    // Définir un timeout pour éviter de bloquer indéfiniment
    const timeoutId = setTimeout(() => {
      console.log('OptiRank: Pre-scan timeout, proceeding with all URLs');
      resolve({
        knownRedirects: [],
        knownBroken: [],
        knownValid: [],
        unknownUrls: urls
      });
    }, 3000); // 3 secondes de timeout
    
    // Vérifier si l'API Chrome est disponible
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage(
          { action: 'batchCheckLinks', urls: urls },
          (response) => {
            // Annuler le timeout puisque nous avons reçu une réponse
            clearTimeout(timeoutId);
            
            if (chrome.runtime.lastError) {
              console.error(`OptiRank: Error in pre-scan: ${chrome.runtime.lastError.message}`);
              resolve({
                knownRedirects: [],
                knownBroken: [],
                knownValid: [],
                unknownUrls: urls
              });
              return;
            }
            
            if (response) {
              // S'assurer que response.results existe avant d'utiliser Object.keys
              const resultsCount = response.results ? Object.keys(response.results).length : 0;
              console.log(`OptiRank: Pre-check complete, found ${resultsCount} results`);
              resolve({ 
                knownRedirects: response.knownRedirects || [],
                knownBroken: response.knownBroken || [],
                knownValid: response.knownValid || [],
                unknownUrls: response.unknownUrls || urls
              });
            } else {
              console.log(`OptiRank: Pre-check failed or returned no results`);
              resolve({
                knownRedirects: [],
                knownBroken: [],
                knownValid: [],
                unknownUrls: urls
              });
            }
          }
        );
      } catch (error) {
        console.error(`OptiRank: Error sending message to background script:`, error);
        resolve({
          knownRedirects: [],
          knownBroken: [],
          knownValid: [],
          unknownUrls: urls
        });
      }
    } else {
      // Mode de compatibilité sans API Chrome
      console.log(`OptiRank: Chrome API not available, skipping pre-scan`);
      resolve({
        knownRedirects: [],
        knownBroken: [],
        knownValid: [],
        unknownUrls: urls
      });
    }
    
    // En cas de timeout
    setTimeout(() => {
      console.log(`OptiRank: Pre-scan timeout, proceeding with all URLs`);
      resolve({
        knownRedirects: [],
        knownBroken: [],
        knownValid: [],
        unknownUrls: urls
      });
    }, 2000);
  });
}

/**
 * Scan complet de tous les liens de la page
 * @param {Object} options - Options de scan
 * @returns {Promise<Object>} - Résultats du scan
 */
async function scanAllLinks(options = {}) {
  try {
    // Vérifier si un scan est déjà en cours
    if (window.OptiRankUtils.scanInProgress) {
      console.log('OptiRank: Scan already in progress, ignoring new scan request');
      return window.OptiRankUtils.scanResults;
    }
    
    // Marquer le début du scan
    window.OptiRankUtils.scanInProgress = true;
    window.OptiRankUtils.scanResults.inProgress = true;
    
    // Fusionner les options avec les valeurs par défaut
    const currentScanOptions = {
      ...window.OptiRankUtils.defaultScanOptions,
      ...options
    };
    
    // Réinitialiser les résultats du scan
    window.OptiRankUtils.resetScanResults();
    
    // Collecter tous les liens de la page
    const links = window.OptiRankDetector.collectAllLinks();
    window.OptiRankUtils.scanResults.total = links.length;
    console.log(`OptiRank: Found ${links.length} links on the page`);
    
    // Notifier le background script que le scan a commencé (si possible)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'scanStarted', total: links.length });
    } else if (window.chromeRuntimeSubstitute) {
      window.chromeRuntimeSubstitute.sendMessage({ action: 'scanStarted', total: links.length });
    }
    
    // Déclencher un événement personnalisé pour le début du scan
    const startEvent = new CustomEvent('optirank-scan-started', { 
      detail: { total: links.length } 
    });
    document.dispatchEvent(startEvent);
    
    // Extraire les URLs des liens
    const allUrls = links
      .map(link => link.href)
      .filter(url => url && !url.startsWith('javascript:') && !url.startsWith('mailto:') && !url.startsWith('#'));
    
    // Détecter les liens nofollow
    for (const link of links) {
      const relAttributes = window.OptiRankValidator.analyzeRelAttributes(link);
      if (relAttributes.hasNofollow) {
        window.OptiRankUtils.scanResults.nofollow++;
        link.dataset.optirankStatus = 'nofollow';
      }
    }
    
    // Pré-vérifier les liens avec le background script
    console.log(`OptiRank: Pre-checking ${allUrls.length} links with background script`);
    const preScanResults = await preScanLinks(allUrls);
    
    // Mettre à jour la progression à 50%
    window.OptiRankUtils.scanResults.progress = 50;
    
    // Envoyer la mise à jour de progression si possible
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'scanProgress', 
        progress: 50 
      });
    } else if (window.chromeRuntimeSubstitute) {
      window.chromeRuntimeSubstitute.sendMessage({
        action: 'scanProgress', 
        progress: 50
      });
    }
    
    // Déclencher un événement personnalisé pour la progression
    const progressEvent = new CustomEvent('optirank-progress', { 
      detail: { progress: 50 } 
    });
    document.dispatchEvent(progressEvent);
    
    // Vérifier les liens restants
    const remainingLinks = links.filter(link => {
      // Ignorer les liens déjà traités
      return !link.dataset.optirankStatus;
    });
    
    console.log(`OptiRank: Checking ${remainingLinks.length} remaining links`);
    
    if (remainingLinks.length > 0) {
      // Réduire la taille des lots pour améliorer la réactivité
      const BATCH_SIZE = Math.min(10, remainingLinks.length); // Lots de 10 max au lieu de plus
      
      // Traiter les liens restants par lots
      await window.OptiRankProcessor.processLinkBatch(remainingLinks, {
        ...currentScanOptions,
        batchSize: BATCH_SIZE, // Forcer la taille des lots
        delayBetweenBatches: 100, // Délai plus court entre les lots
        onProgress: (progress) => {
          // Convertir la progression de 0-100 à 50-100 (car le pré-scan compte pour 50%)
          const adjustedProgress = 50 + Math.floor(progress / 2);
          
          // Stocker la progression dans l'objet de résultats
          window.OptiRankUtils.scanResults.progress = adjustedProgress;
          
          // Envoyer la mise à jour de progression si possible (avec throttling)
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            // Throttling des messages de progression
            if (!window.lastProgressUpdate || Date.now() - window.lastProgressUpdate > 200) {
              chrome.runtime.sendMessage({
                action: 'scanProgress', 
                progress: adjustedProgress 
              });
              window.lastProgressUpdate = Date.now();
            }
          } else if (window.chromeRuntimeSubstitute) {
            if (!window.lastProgressUpdate || Date.now() - window.lastProgressUpdate > 200) {
              window.chromeRuntimeSubstitute.sendMessage({
                action: 'scanProgress', 
                progress: adjustedProgress
              });
              window.lastProgressUpdate = Date.now();
            }
          }
          
          // Déclencher un événement personnalisé pour la progression (avec throttling)
          if (!window.lastEventUpdate || Date.now() - window.lastEventUpdate > 200) {
            const progressEvent = new CustomEvent('optirank-progress', { 
              detail: { progress: adjustedProgress } 
            });
            document.dispatchEvent(progressEvent);
            window.lastEventUpdate = Date.now();
          }
        },
      });
    } else {
      // Si tous les liens ont été traités pendant le pré-scan, marquer la progression à 100%
      window.OptiRankUtils.scanResults.progress = 100;
      window.OptiRankUtils.scanResults.inProgress = false;
      window.OptiRankUtils.scanInProgress = false;
      window.OptiRankUtils.scanResults.endTime = new Date();
      window.OptiRankUtils.scanResults.duration = window.OptiRankUtils.scanResults.endTime - window.OptiRankUtils.scanResults.startTime;
      
      // Marquer explicitement que le scan est terminé (fix pour le problème de progression bloquée à 50%)
      window.OptiRankUtils.scanResults.completed = true;
      
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ 
          action: 'scanProgress', 
          progress: 100 
        });
        
        // Notifier que le scan est terminé
        chrome.runtime.sendMessage({
          action: 'scanComplete',
          results: window.OptiRankUtils.scanResults
        });
      } else if (window.chromeRuntimeSubstitute) {
        window.chromeRuntimeSubstitute.sendMessage({ 
          action: 'scanProgress', 
          progress: 100
        });
        
        window.chromeRuntimeSubstitute.sendMessage({
          action: 'scanComplete',
          results: window.OptiRankUtils.scanResults
        });
      }
      
      // Déclencher un événement personnalisé pour la progression
      const progressEvent = new CustomEvent('optirank-progress', { 
        detail: { progress: 100 } 
      });
      document.dispatchEvent(progressEvent);
      
      // Déclencher un événement pour indiquer que le scan est terminé
      const completeEvent = new CustomEvent('optirank-scan-complete', {
        detail: { results: window.OptiRankUtils.scanResults }
      });
      document.dispatchEvent(completeEvent);
      
      console.log('OptiRank: Scan terminé avec succès (tous les liens traités pendant le pré-scan)', window.OptiRankUtils.scanResults);
    }
    
    // Vérifier et corriger les totaux
    window.OptiRankUtils.scanResults = verifyAndFixTotals(window.OptiRankUtils.scanResults);
    
    // Vérifier les redirections réelles
    window.OptiRankUtils.scanResults = checkActualRedirects(window.OptiRankUtils.scanResults);
    
    // Marquer la fin du scan
    window.OptiRankUtils.scanInProgress = false;
    window.OptiRankUtils.scanResults.inProgress = false;
    window.OptiRankUtils.scanResults.completed = true;
    window.OptiRankUtils.scanResults.timestamp = Date.now();
    
    // Collecter les informations sur les liens scannés pour le tableau des résultats
    const linksArray = [];
    document.querySelectorAll('a').forEach(link => {
      // Ajouter uniquement les liens qui ont été scannés (qui ont un statut)
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
    
    // Ajouter la propriété links aux résultats
    window.OptiRankUtils.scanResults.links = linksArray;
    console.log(`OptiRank: Added ${linksArray.length} links to scan results`);
    
    // Afficher les résultats du scan dans la console pour débogage
    console.log('OptiRank: Scan completed with results:', JSON.stringify(window.OptiRankUtils.scanResults, null, 2));
    
    console.log('OptiRank: Scan terminé - Surlignage manuel disponible via les statistiques');
    
    // Envoyer les résultats au background script (si possible)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        // Envoyer les résultats avec l'action scanComplete
        chrome.runtime.sendMessage({
          action: 'scanComplete',
          results: window.OptiRankUtils.scanResults
        });
        
        // Envoyer également les résultats avec l'action scanResults pour le popup
        chrome.runtime.sendMessage({
          action: 'scanResults',
          tabId: window.OptiRankUtils.tabId || 0,
          results: window.OptiRankUtils.scanResults,
          success: true
        });
      } catch (error) {
        console.error('OptiRank: Erreur lors de l\'envoi des résultats:', error);
      }
    } else if (window.chromeRuntimeSubstitute) {
      try {
        // Envoyer les résultats avec l'action scanComplete
        window.chromeRuntimeSubstitute.sendMessage({
          action: 'scanComplete',
          results: window.OptiRankUtils.scanResults
        });
        
        // Envoyer également les résultats avec l'action scanResults pour le popup
        window.chromeRuntimeSubstitute.sendMessage({
          action: 'scanResults',
          tabId: window.OptiRankUtils.tabId || 0,
          results: window.OptiRankUtils.scanResults,
          success: true
        });
      } catch (error) {
        console.error('OptiRank: Erreur lors de l\'envoi des résultats:', error);
      }
    }
    
    // Déclencher un événement personnalisé pour la fin du scan
    const completeEvent = new CustomEvent('optirank-scan-complete', { 
      detail: { results: window.OptiRankUtils.scanResults } 
    });
    document.dispatchEvent(completeEvent);
    
    console.log(`OptiRank: Scan complete`, window.OptiRankUtils.scanResults);
    
    return window.OptiRankUtils.scanResults;
  } catch (error) {
    console.error(`OptiRank: Error during scan:`, error);
    
    // Marquer la fin du scan même en cas d'erreur
    window.OptiRankUtils.scanInProgress = false;
    window.OptiRankUtils.scanResults.inProgress = false;
    window.OptiRankUtils.scanResults.hasError = true;
    window.OptiRankUtils.scanResults.errorMessage = error.message;
    
    // Notifier le background script de l'erreur (si possible)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'scanError',
        error: error.message
      });
    } else if (window.chromeRuntimeSubstitute) {
      window.chromeRuntimeSubstitute.sendMessage({
        action: 'scanError',
        error: error.message
      });
    }
    
    // Déclencher un événement personnalisé pour l'erreur
    const errorEvent = new CustomEvent('optirank-scan-error', { 
      detail: { error: error.message } 
    });
    document.dispatchEvent(errorEvent);
    
    return window.OptiRankUtils.scanResults;
  }
}

/**
 * Démarre un scan automatique des liens
 * @param {Object} options - Options de scan
 */
async function autoScanLinks(options = {}) {
  console.log(`OptiRank: autoScanLinks called, checking if settings are loaded`);
  
  // Essayer d'attendre les paramètres, mais avec un timeout
  if (!window.OptiRankUtils.settings) {
    console.log(`OptiRank: Settings not loaded yet, waiting with timeout...`);
    try {
      await Promise.race([
        new Promise(resolve => {
          const checkSettings = () => {
            if (window.OptiRankUtils.settings) {
              resolve();
            } else {
              setTimeout(checkSettings, 100);
            }
          };
          checkSettings();
        }),
        // Timeout après 2 secondes
        new Promise((resolve) => setTimeout(() => {
          console.warn('OptiRank: Timeout waiting for settings, using defaults');
          // Créer des paramètres par défaut si nécessaire
          window.OptiRankUtils.settings = window.OptiRankUtils.settings || {
            autoScanEnabled: false,
            checkExternal: true,
            checkInternal: true,
            detectRedirects: true,
            maxRetries: 2,
            batchSize: 5,
            timeout: 10000
          };
          resolve();
        }, 2000))
      ]);
    } catch (error) {
      console.warn('OptiRank: Error waiting for settings:', error);
      // Créer des paramètres par défaut en cas d'erreur
      window.OptiRankUtils.settings = {
        autoScanEnabled: false,
        checkExternal: true,
        checkInternal: true,
        detectRedirects: true,
        maxRetries: 2,
        batchSize: 5,
        timeout: 10000
      };
    }
  }
  
  console.log(`OptiRank: Current settings:`, window.OptiRankUtils.settings);
  
  // Vérifier si le scan automatique est activé
  if (window.OptiRankUtils.settings.autoScanEnabled) {
    console.log(`OptiRank: Auto-scan is ENABLED in settings, scanning will start soon`);
    
    // Attendre un court instant pour que la page soit complètement chargée
    setTimeout(() => {
      console.log(`OptiRank: Auto-scanning links on page load`);
      scanAllLinks(options);
    }, 500);
  } else {
    console.log(`OptiRank: Auto-scan is DISABLED in settings, skipping scan`);
  }
}

// Exporter les fonctions
window.OptiRankScan = {
  verifyAndFixTotals,
  checkActualRedirects,
  preScanLinks,
  scanAllLinks,
  autoScanLinks
};

// S'assurer que le module est disponible dans l'objet global OptiRankUtils
if (window.OptiRankUtils) {
  window.OptiRankUtils.modules = window.OptiRankUtils.modules || {};
  window.OptiRankUtils.modules.scanner = window.OptiRankScan;
  
  // Ajouter une référence directe à la fonction scanAllLinks pour faciliter l'accès
  window.OptiRankUtils.scanAllLinks = window.OptiRankScan.scanAllLinks;
}

// Créer un alias global pour le scan
window.scanLinks = function() {
  if (window.OptiRankScan && window.OptiRankScan.scanAllLinks) {
    return window.OptiRankScan.scanAllLinks();
  } else {
    console.error('OptiRank: Scanner module not available for global scan function');
    return Promise.reject(new Error('Scanner module not available'));
  }
};

console.log('OptiRank: Scanner module loaded and exposed globally as window.OptiRankScan');
