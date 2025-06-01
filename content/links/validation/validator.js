/**
 * @fileoverview OptiRank - Module de validation des liens
 * Ce module est responsable de la vérification du statut des liens (valide, cassé, etc.)
 * 
 * @module linkValidator
 * @requires window
 * @author OptiRank Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} LinkValidationResult
 * @property {boolean} isValid - Indique si le lien est valide
 * @property {boolean} isBroken - Indique si le lien est cassé
 * @property {number} statusCode - Code HTTP
 * @property {string} [errorMessage] - Message d'erreur si applicable
 */

/**
 * Vérifie si une URL est valide syntaxiquement
 * 
 * @function isValidUrl
 * @param {string} url - URL à vérifier
 * @returns {boolean} - true si l'URL est syntaxiquement valide et utilise le protocole HTTP ou HTTPS
 * @example
 * // Retourne true
 * isValidUrl('https://example.com');
 * 
 * // Retourne false
 * isValidUrl('javascript:alert(1)');
 */
function isValidUrl(url) {
  try {
    // Vérifier que l'URL peut être parsée
    const parsedUrl = new URL(url);
    // Vérifier que c'est un protocole HTTP ou HTTPS
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    return false;
  }
}

/**
 * Détermine si une URL est interne au site courant en comparant son hostname avec celui de la page actuelle
 * 
 * @function isInternalLink
 * @param {string} url - URL à vérifier
 * @returns {boolean} - true si l'URL est interne (même hostname que la page courante)
 * @example
 * // Si window.location.hostname est 'example.com'
 * // Retourne true
 * isInternalLink('https://example.com/page');
 * 
 * // Retourne false
 * isInternalLink('https://external-site.com');
 */
function isInternalLink(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === window.location.hostname;
  } catch (e) {
    // URL invalide, traiter comme interne par défaut
    return true;
  }
}

/**
 * Vérifie si un lien doit être ignoré lors de l'analyse (liens vides, ancres, javascript)
 * 
 * @function shouldSkipLink
 * @param {string} url - URL à vérifier
 * @returns {boolean} - true si le lien doit être ignoré dans l'analyse
 * @example
 * // Retourne true
 * shouldSkipLink('javascript:void(0)');
 * shouldSkipLink('#section-1');
 * shouldSkipLink('');
 * 
 * // Retourne false
 * shouldSkipLink('https://example.com');
 */
function shouldSkipLink(url) {
  return !url || url === '#' || url.startsWith('javascript:');
}

/**
 * Vérifie si un lien pointe vers un réseau social connu
 * 
 * @function isSocialMediaLink
 * @param {string} url - URL à vérifier
 * @returns {boolean} - true si l'URL pointe vers un réseau social connu
 * @example
 * // Retourne true
 * isSocialMediaLink('https://facebook.com/profile');
 * isSocialMediaLink('https://twitter.com/user');
 * isSocialMediaLink('https://x.com/user');
 * isSocialMediaLink('https://linkedin.com/in/user');
 * 
 * // Retourne false
 * isSocialMediaLink('https://example.com');
 */
function isSocialMediaLink(url) {
  return url.includes('facebook.com') || 
         url.includes('twitter.com') || 
         url.includes('x.com') || 
         url.includes('linkedin.com');
}

/**
 * Vérifie si un lien pointe vers un service d'archivage web comme Internet Archive
 * 
 * @function isArchiveLink
 * @param {string} url - URL à vérifier
 * @returns {boolean} - true si l'URL pointe vers un service d'archivage web
 * @example
 * // Retourne true
 * isArchiveLink('https://web.archive.org/web/20200101000000/https://example.com');
 * isArchiveLink('https://archive.org/web/page');
 * 
 * // Retourne false
 * isArchiveLink('https://example.com');
 */
function isArchiveLink(url) {
  return url.includes('web.archive.org') || url.includes('archive.org/web');
}

/**
 * Analyse les attributs rel d'un élément de lien pour identifier nofollow, sponsored et ugc
 * 
 * @function analyzeRelAttributes
 * @param {HTMLAnchorElement} linkElement - Élément de lien à analyser
 * @returns {Object} - Objet contenant les attributs rel trouvés
 * @returns {boolean} returns.hasNofollow - true si l'attribut rel contient "nofollow"
 * @returns {boolean} returns.hasSponsored - true si l'attribut rel contient "sponsored"
 * @returns {boolean} returns.hasUGC - true si l'attribut rel contient "ugc"
 * @example
 * // Pour <a href="https://example.com" rel="nofollow sponsored">Lien</a>
 * // Retourne {hasNofollow: true, hasSponsored: true, hasUGC: false}
 * analyzeRelAttributes(linkElement);
 */
function analyzeRelAttributes(linkElement) {
  const rel = linkElement.getAttribute('rel') || '';
  return {
    hasNofollow: rel.includes('nofollow'),
    hasSponsored: rel.includes('sponsored'),
    hasUGC: rel.includes('ugc')
  };
}

/**
 * Vérifie si une URL HTTP pourrait être redirigée vers HTTPS
 * 
 * @function checkHttpToHttpsRedirect
 * @param {string} url - URL HTTP à vérifier
 * @returns {Object|null} - Objet contenant l'URL HTTPS et le statut, ou null si non applicable
 * @returns {string} returns.httpsUrl - Version HTTPS de l'URL d'origine
 * @returns {string} returns.status - Statut de la redirection ('potential' par défaut)
 * @example
 * // Retourne {httpsUrl: 'https://example.com', status: 'potential'}
 * checkHttpToHttpsRedirect('http://example.com');
 * 
 * // Retourne null
 * checkHttpToHttpsRedirect('https://example.com'); // Déjà en HTTPS
 * checkHttpToHttpsRedirect('http://localhost'); // Exception pour localhost
 */
function checkHttpToHttpsRedirect(url) {
  if (url.startsWith('http://') && !url.startsWith('http://localhost')) {
    const httpsUrl = url.replace(/^http:/i, 'https:');
    return {
      originalUrl: url,
      redirectUrl: httpsUrl,
      statusCode: 307, // Temporary Redirect
      isMixedContent: true
    };
  }
  return null;
}

// Exporter les fonctions
window.OptiRankValidator = {
  isValidUrl,
  isInternalLink,
  shouldSkipLink,
  isSocialMediaLink,
  isArchiveLink,
  analyzeRelAttributes,
  checkHttpToHttpsRedirect
};

console.log('OptiRank: Validator module loaded');
