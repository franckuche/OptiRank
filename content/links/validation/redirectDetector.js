/**
 * @fileoverview OptiRank - Module de détection des redirections
 * Ce module est responsable de la détection des redirections de liens en utilisant
 * différentes méthodes comme la communication avec le background script et les requêtes fetch.
 * 
 * @module redirectDetector
 * @requires chrome.runtime
 * @author OptiRank Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} RedirectResult
 * @property {boolean} isRedirect - Indique si le lien est une redirection
 * @property {string} [redirectUrl] - URL de destination de la redirection
 * @property {number} statusCode - Code HTTP de la redirection
 * @property {string} [type] - Type de redirection (HTTP->HTTPS, etc.)
 */

/**
 * Vérifie si une URL est une redirection connue en communiquant avec le background script
 * Cette fonction utilise le système de messages de Chrome pour interroger le background script
 * qui maintient un registre des redirections détectées lors de la navigation.
 * 
 * @function checkRedirectWithBackgroundScript
 * @async
 * @param {string} url - URL à vérifier pour détecter une redirection
 * @returns {Promise<RedirectResult|null>} - Résultat de la vérification ou null en cas d'erreur
 * @example
 * // Vérifier si une URL est une redirection
 * const redirectInfo = await checkRedirectWithBackgroundScript('https://example.com');
 * if (redirectInfo && redirectInfo.isRedirect) {
 *   logger.debugEmoji("", "Redirection détectée vers ${redirectInfo.redirectUrl}");
 * }
 */
function checkRedirectWithBackgroundScript(url) {
  return new Promise((resolve, reject) => {
    let resolved = false; // Empêcher les résolutions multiples
    
    const resolveOnce = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };
    
    try {
      // Vérifier si l'API Chrome est disponible
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'checkRedirect', url: url }, (response) => {
          if (chrome.runtime.lastError) {
            // Ne pas logger cette erreur car elle est attendue quand la connexion se ferme
            // logger.error(`OptiRank: Error during redirect check: ${chrome.runtime.lastError.message}`);
            resolveOnce(null); // Résoudre avec null en cas d'erreur
            return;
          }
          
          // Redirection confirmée
          if (response && response.isRedirect) {
            // URL cible de redirection (l'URL actuelle est une destination, pas une source)
            if (response.isRedirectTarget) {
              logger.debugEmoji("", "OptiRank: URL détectée comme destination de redirection depuis ${response.sourceUrl}");
              resolveOnce({
                isRedirect: false, // Pas considéré comme une redirection dans notre contexte d'affichage
                isRedirectTarget: true,
                sourceUrl: response.sourceUrl
              });
              return;
            }
            
            logger.debugEmoji("", "OptiRank: Background a confirmé une redirection pour ${url}: ${response.statusCode}");
            resolveOnce({
              isRedirect: true,
              isBroken: false,
              statusCode: response.statusCode || 302,
              redirectUrl: response.redirectUrl || '',
              type: response.type || ''
            });
          } else {
            // Pas de redirection connue par le background
            resolveOnce(null);
          }
        }
        );
        
        // En cas de timeout (si le background ne répond pas dans un délai raisonnable)
        setTimeout(() => {
          resolveOnce(null);
        }, 1000); // Réduit à 1 seconde pour éviter les blocages
      } else if (window.chromeRuntimeSubstitute) {
        // Utiliser le substitut pour chrome.runtime si disponible
        try {
          window.chromeRuntimeSubstitute.sendMessage(
            { action: 'checkRedirect', url: url },
            (response) => {
              if (response && response.isRedirect) {
                resolveOnce({
                  isRedirect: true,
                  isBroken: false,
                  statusCode: response.statusCode || 302,
                  redirectUrl: response.redirectUrl || '',
                  type: response.type || ''
                });
              } else {
                resolveOnce(null);
              }
            }
          );
        } catch (error) {
          logger.error(`OptiRank: Erreur lors de l'utilisation du substitut: ${error.message}`);
          resolveOnce(null);
        }
      } else {
        // Mode de compatibilité sans API Chrome ni substitut
        logger.debugEmoji("", "OptiRank: API Chrome non disponible, utilisation de la détection de redirection simplifiée");
        
        // Détection simplifiée des redirections courantes
        // Vérifier si l'URL est une redirection HTTP vers HTTPS
        if (url.startsWith('http://')) {
          const httpsUrl = url.replace('http://', 'https://');
          resolveOnce({
            isRedirect: true,
            isBroken: false,
            statusCode: 301,
            redirectUrl: httpsUrl,
            type: 'HTTP_TO_HTTPS'
          });
          return;
        }
        
        // Vérifier les domaines connus pour les redirections
        const redirectDomains = [
          { pattern: 't.co', type: 'TWITTER' },
          { pattern: 'bit.ly', type: 'SHORTENER' },
          { pattern: 'goo.gl', type: 'SHORTENER' },
          { pattern: 'tinyurl.com', type: 'SHORTENER' },
          { pattern: 'ow.ly', type: 'SHORTENER' },
          { pattern: 'amzn.to', type: 'AMAZON' },
          { pattern: 'amzn.com', type: 'AMAZON' },
          { pattern: 'youtu.be', type: 'YOUTUBE' },
          { pattern: 'fb.me', type: 'FACEBOOK' },
          { pattern: 'wa.me', type: 'WHATSAPP' },
          { pattern: 'rebrand.ly', type: 'SHORTENER' },
          { pattern: 'buff.ly', type: 'SHORTENER' },
          { pattern: 'cutt.ly', type: 'SHORTENER' },
          { pattern: 'shorturl.at', type: 'SHORTENER' },
          { pattern: 'ln.is', type: 'SHORTENER' },
          { pattern: 'cli.re', type: 'SHORTENER' }
        ];
        
        // Vérifier si l'URL correspond à un domaine connu pour les redirections
        for (const domain of redirectDomains) {
          if (url.includes(domain.pattern)) {
            resolveOnce({
              isRedirect: true,
              isBroken: false,
              statusCode: 302,
              redirectUrl: 'Unknown (shortener link)',
              type: domain.type
            });
            return;
          }
        }
        
        // Si aucune redirection n'est détectée, retourner null
        resolveOnce(null);
      }
    } catch (error) {
      logger.error(`OptiRank: Erreur lors de la vérification avec le background: ${error.message}`);
      resolveOnce(null);
    }
  });
}

/**
 * Vérifie un lien externe en utilisant le background script pour contourner les limitations CORS
 * Cette fonction est particulièrement utile pour vérifier les liens externes qui pourraient être
 * bloqués par les restrictions CORS lorsqu'ils sont appelés directement depuis le content script.
 * 
 * @function checkExternalLinkWithBackground
 * @async
 * @param {string} url - URL externe à vérifier
 * @returns {Promise<Object|null>} - Résultat de la vérification ou null en cas d'erreur
 * @returns {boolean} returns.isRedirect - Indique si l'URL est une redirection
 * @returns {boolean} returns.isBroken - Indique si le lien est cassé
 * @returns {number} returns.statusCode - Code HTTP de la réponse
 * @returns {string} returns.redirectUrl - URL de destination si c'est une redirection
 * @example
 * // Vérifier un lien externe
 * const result = await checkExternalLinkWithBackground('https://external-site.com');
 * if (result) {
 *   if (result.isRedirect) {
 *     logger.debugEmoji("", "Redirection vers ${result.redirectUrl}");
 *   } else if (result.isBroken) {
 *     logger.debugEmoji("", "Lien cassé (${result.statusCode})");
 *   } else {
 *     logger.debug('Lien valide');
 *   }
 * }
 */
async function checkExternalLinkWithBackground(url) {
  return new Promise((resolve) => {
    let resolved = false; // Empêcher les résolutions multiples
    
    const resolveOnce = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };
    
    try {
      // Vérifier si l'API Chrome est disponible
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(
          { action: 'checkExternalLink', url: url },
          (response) => {
            if (chrome.runtime.lastError) {
              // Ne pas logger cette erreur car elle est attendue quand la connexion se ferme
              // logger.error(`OptiRank: Erreur lors de la vérification externe: ${chrome.runtime.lastError.message}`);
              resolveOnce(null);
              return;
            }
          
            if (response && response.success) {
              // Réponse du background script
              resolveOnce({
                isRedirect: response.isRedirect || false,
                isBroken: response.isBroken || false,
                statusCode: response.statusCode || 200,
                redirectUrl: response.redirectUrl || ''
              });
            } else {
              // Considérer les liens externes comme valides en mode de compatibilité
              resolveOnce({
                isRedirect: false,
                isBroken: false,
                statusCode: 200,
                redirectUrl: ''
              });
            }
          }
        );
        
        // En cas de timeout (plus court pour éviter les blocages)
        setTimeout(() => {
          // Considérer les liens externes comme valides en mode de compatibilité
          resolveOnce({
            isRedirect: false,
            isBroken: false,
            statusCode: 200,
            redirectUrl: ''
          });
        }, 1000); // Réduit à 1 seconde
      } else if (window.chromeRuntimeSubstitute) {
        // Utiliser le substitut pour chrome.runtime si disponible
        try {
          window.chromeRuntimeSubstitute.sendMessage(
            { action: 'checkExternalLink', url: url },
            (response) => {
              if (response && response.success) {
                resolveOnce({
                  isRedirect: response.isRedirect || false,
                  isBroken: response.isBroken || false,
                  statusCode: response.statusCode || 200,
                  redirectUrl: response.redirectUrl || ''
                });
              } else {
                // Considérer les liens externes comme valides en mode de compatibilité
                resolveOnce({
                  isRedirect: false,
                  isBroken: false,
                  statusCode: 200,
                  redirectUrl: ''
                });
              }
            }
          );
        } catch (error) {
          logger.error(`OptiRank: Erreur lors de l'utilisation du substitut: ${error.message}`);
          // Considérer les liens externes comme valides en mode de compatibilité
          resolveOnce({
            isRedirect: false,
            isBroken: false,
            statusCode: 200,
            redirectUrl: ''
          });
        }
      } else {
        // Mode de compatibilité sans API Chrome ni substitut
        logger.debugEmoji("", "OptiRank: API Chrome non disponible, impossible de vérifier les liens externes");
        // Considérer les liens externes comme valides en mode de compatibilité
        resolveOnce({
          isRedirect: false,
          isBroken: false,
          statusCode: 200,
          redirectUrl: ''
        });
      }
    } catch (error) {
      logger.error(`OptiRank: Erreur lors de la vérification externe: ${error.message}`);
      // Considérer les liens externes comme valides en mode de compatibilité
      resolveOnce({
        isRedirect: false,
        isBroken: false,
        statusCode: 200,
        redirectUrl: ''
      });
    }
  });
}

/**
 * Vérifie si une URL est une redirection en utilisant l'API fetch
 * Cette fonction tente de détecter les redirections en analysant les réponses HTTP.
 * Elle est principalement utilisée pour les liens internes où les restrictions CORS ne s'appliquent pas.
 * 
 * @function checkRedirectWithFetch
 * @async
 * @param {string} url - URL à vérifier pour détecter une redirection
 * @param {Object} [options={}] - Options supplémentaires pour la requête fetch
 * @param {boolean} [options.followRedirects=true] - Si true, suit automatiquement les redirections
 * @param {number} [options.timeout=2000] - Délai d'expiration en millisecondes
 * @param {string} [options.method='HEAD'] - Méthode HTTP à utiliser (HEAD est plus légère que GET)
 * @returns {Promise<Object|null>} - Résultat de la vérification ou null en cas d'erreur
 * @returns {boolean} returns.isRedirect - Indique si l'URL est une redirection
 * @returns {string} [returns.redirectUrl] - URL de destination si c'est une redirection
 * @returns {number} returns.statusCode - Code HTTP de la réponse
 * @example
 * // Vérifier si une URL est une redirection
 * const result = await checkRedirectWithFetch('https://example.com');
 * if (result && result.isRedirect) {
 *   logger.debugEmoji("", "Redirection détectée vers ${result.redirectUrl}");
 * }
 */
async function checkRedirectWithFetch(url, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 5000);
    
    const response = await fetch(url, {
      method: options.method || 'HEAD',
      redirect: 'manual', // Crucial pour détecter les redirections
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    // Vérifier si c'est une redirection (codes 300-399)
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('Location');
      return {
        isRedirect: true,
        isBroken: false,
        statusCode: response.status,
        redirectUrl: redirectUrl || ''
      };
    }
    
    // Pas une redirection
    return {
      isRedirect: false,
      isBroken: response.status >= 400,
      statusCode: response.status
    };
  } catch (error) {
    logger.error(`OptiRank: Erreur lors de la vérification de redirection: ${error.message}`);
    return null;
  }
}

/**
 * Vérifie une URL avec plusieurs méthodes en séquence
 * @param {string} url - URL à vérifier
 * @returns {Promise<RedirectResult>} - Résultat de la vérification
 */
async function checkLinkRedirect(url) {
  // 1. Vérifier d'abord avec le background script
  const backgroundResult = await checkRedirectWithBackgroundScript(url);
  if (backgroundResult && backgroundResult.isRedirect) {
    return backgroundResult;
  }
  
  // 2. Vérifier si c'est un lien externe
  const isInternal = window.OptiRankValidator.isInternalLink(url);
  
  if (!isInternal) {
    // Pour les liens externes, utiliser le background script pour éviter les erreurs CORS
    const externalResult = await checkExternalLinkWithBackground(url);
    if (externalResult) {
      return externalResult;
    }
    
    // Si pas de résultat du background, retourner un résultat inconclusif
    return {
      isRedirect: false,
      isBroken: false,
      statusCode: 200,
      isExternalUnverified: true
    };
  }
  
  // 3. Pour les liens internes, essayer avec fetch
  const fetchResult = await checkRedirectWithFetch(url);
  if (fetchResult) {
    return fetchResult;
  }
  
  // 4. Si tout échoue, retourner un résultat par défaut
  return {
    isRedirect: false,
    isBroken: false,
    statusCode: 200,
    isUnverified: true
  };
}

// Exporter les fonctions
window.OptiRankRedirect = {
  checkRedirectWithBackgroundScript,
  checkExternalLinkWithBackground,
  checkRedirectWithFetch,
  checkLinkRedirect
};

logger.debug('OptiRank: Redirect Detector module loaded');
