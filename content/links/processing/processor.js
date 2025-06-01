/**
 * @fileoverview OptiRank - Module de traitement des liens
 * Ce module est responsable du traitement individuel des liens, de leur analyse
 * et de la détermination de leur statut (valide, cassé, redirection, etc.)
 * 
 * @module linkProcessor
 * @requires linkValidator
 * @requires redirectDetector
 * @author OptiRank Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} LinkProcessResult
 * @property {string} status - Statut du lien (valid, broken, redirect, nofollow, etc.)
 * @property {number} [statusCode] - Code HTTP si applicable
 * @property {string} [redirectUrl] - URL de redirection si applicable
 */

/**
 * Traite un lien individuel et détermine son statut (valide, cassé, redirection, etc.)
 * Cette fonction centrale analyse un lien HTML, vérifie son statut et met à jour
 * les attributs data-* correspondants sur l'élément DOM.
 * 
 * @function processLink
 * @async
 * @param {HTMLAnchorElement} linkElement - Élément de lien HTML à traiter
 * @param {Object} [options=window.OptiRankUtils.defaultScanOptions] - Options de traitement
 * @param {boolean} [options.checkExternal=true] - Vérifier les liens externes
 * @param {boolean} [options.checkInternal=true] - Vérifier les liens internes
 * @param {boolean} [options.detectRedirects=true] - Détecter les redirections
 * @param {number} [options.maxRetries=2] - Nombre maximal de tentatives pour vérifier un lien
 * @returns {Promise<LinkProcessResult>} - Résultat du traitement du lien
 * @example
 * // Traiter un lien et obtenir son statut
 * const linkElement = document.querySelector('a[href="https://example.com"]');
 * const result = await processLink(linkElement);
 * console.log(`Le lien a le statut: ${result.status}`);
 */
async function processLink(linkElement, options = window.OptiRankUtils.defaultScanOptions) {
  try {
    // Ignorer les liens déjà traités
    if (linkElement.dataset.optirankStatus) {
      return { status: linkElement.dataset.optirankStatus };
    }
    
    const url = linkElement.href;
    
    // Vérifier les liens à ignorer
    if (window.OptiRankValidator.shouldSkipLink(url)) {
      linkElement.dataset.optirankStatus = 'skipped';
      return { status: 'skipped' };
    }
    
    // Analyser les attributs rel
    const relAttributes = window.OptiRankValidator.analyzeRelAttributes(linkElement);
    
    // Traiter les liens nofollow
    if (relAttributes.hasNofollow) {
      linkElement.dataset.optirankStatus = 'nofollow';
      window.OptiRankUtils.scanResults.nofollow++;
      console.log(`%cOptiRank: LIEN NOFOLLOW [N/A] ${url}`, 'color: purple;');
      return { status: 'nofollow' };
    }
    
    // Comptabiliser les attributs rel
    if (relAttributes.hasSponsored) {
      window.OptiRankUtils.scanResults.relAttributes.sponsored++;
    }
    
    if (relAttributes.hasUGC) {
      window.OptiRankUtils.scanResults.relAttributes.ugc++;
    }
    
    // Marquer comme dofollow si pas ignoré
    if (!window.OptiRankValidator.shouldSkipLink(url)) {
      linkElement.dataset.optirankRel = 'dofollow';
      window.OptiRankUtils.scanResults.relAttributes.dofollow++;
      
      // Ajouter un style visuel pour les liens dofollow
      if (window.OptiRankStyles && window.OptiRankStyles.applyStyleDirectly) {
        window.OptiRankStyles.applyStyleDirectly(linkElement, 'dofollow');
      }
    }
    
    // Vérifier les liens d'archive
    if (window.OptiRankValidator.isArchiveLink(url)) {
      window.OptiRankUtils.scanResults.spamLinks++;
      linkElement.dataset.optirankStatus = 'spam';
      console.log(`OptiRank: Spam link (Web Archive): ${url}`);
      return { status: 'spam' };
    }
    
    // Traitement spécial pour les réseaux sociaux
    if (window.OptiRankValidator.isSocialMediaLink(url)) {
      window.OptiRankUtils.scanResults.valid++;
      linkElement.dataset.optirankStatus = 'valid';
      return { status: 'valid' };
    }
    
    // Vérifier les redirections HTTP vers HTTPS
    const httpToHttpsRedirect = window.OptiRankValidator.checkHttpToHttpsRedirect(url);
    if (httpToHttpsRedirect) {
      window.OptiRankUtils.scanResults.redirects++;
      linkElement.dataset.optirankStatus = 'redirect';
      linkElement.dataset.redirectUrl = httpToHttpsRedirect.redirectUrl;
      linkElement.dataset.redirectCode = httpToHttpsRedirect.statusCode;
      linkElement.dataset.mixedContent = 'true';
      console.log(`%cOptiRank: MIXED CONTENT [${httpToHttpsRedirect.statusCode}] ${url} -> ${httpToHttpsRedirect.redirectUrl}`, 'color: #F39C12; font-weight: bold;');
      return { 
        status: 'redirect', 
        statusCode: httpToHttpsRedirect.statusCode,
        redirectUrl: httpToHttpsRedirect.redirectUrl
      };
    }
    
    // Vérifier le statut du lien avec le détecteur de redirections
    try {
      const linkInfo = await window.OptiRankRedirect.checkLinkRedirect(url);
      
      if (linkInfo.isRedirect) {
        window.OptiRankUtils.scanResults.redirects++;
        linkElement.dataset.optirankStatus = 'redirect';
        linkElement.dataset.redirectUrl = linkInfo.redirectUrl || '';
        linkElement.dataset.redirectCode = linkInfo.statusCode || '';
        console.log(`%cOptiRank: REDIRECTION [${linkInfo.statusCode}] ${url} -> ${linkInfo.redirectUrl || 'URL inconnue'}`, 'color: orange; font-weight: bold;');
        return { 
          status: 'redirect', 
          statusCode: linkInfo.statusCode,
          redirectUrl: linkInfo.redirectUrl
        };
      }
      
      if (linkInfo.isBroken) {
        window.OptiRankUtils.scanResults.broken++;
        linkElement.dataset.optirankStatus = 'broken';
        linkElement.dataset.statusCode = linkInfo.statusCode || '';
        console.log(`OptiRank: Broken link detected: ${url} (${linkInfo.statusCode})`);
        return { 
          status: 'broken', 
          statusCode: linkInfo.statusCode
        };
      }
      
      // Si le lien n'est ni redirigé ni cassé, le marquer comme valide
      window.OptiRankUtils.scanResults.valid++;
      linkElement.dataset.optirankStatus = 'valid';
      return { status: 'valid', statusCode: linkInfo.statusCode || 200 };
    } catch (error) {
      console.error(`OptiRank: Error processing link: ${url}`, error);
      
      // En cas d'erreur, marquer comme valide par défaut
      window.OptiRankUtils.scanResults.valid++;
      linkElement.dataset.optirankStatus = 'valid';
      return { 
        status: 'valid', 
        statusCode: 200,
        hasError: true,
        errorMessage: error.message
      };
    }
  } catch (error) {
    console.error(`OptiRank: Unexpected error processing link: ${linkElement.href}`, error);
    return { 
      status: 'error', 
      error: error.message
    };
  }
}

/**
 * Traite un lot de liens en parallèle avec une approche par lots pour optimiser les performances
 * Cette fonction divise les liens en lots plus petits pour éviter de surcharger le navigateur
 * et fournit des mises à jour de progression pendant le traitement.
 * 
 * @function processLinkBatch
 * @async
 * @param {Array<HTMLAnchorElement>} linkElements - Éléments de lien à traiter
 * @param {Object} [options={}] - Options de traitement
 * @param {boolean} [options.checkExternal] - Vérifier les liens externes
 * @param {boolean} [options.checkInternal] - Vérifier les liens internes
 * @param {boolean} [options.detectRedirects] - Détecter les redirections
 * @param {Function} [options.onProgress] - Fonction de callback pour la progression (reçoit un pourcentage)
 * @param {number} [batchSize=5] - Nombre de liens à traiter simultanément
 * @returns {Promise<Array<LinkProcessResult>>} - Résultats du traitement pour tous les liens
 * @example
 * // Traiter un groupe de liens avec mise à jour de la progression
 * const links = document.querySelectorAll('a[href]');
 * const results = await processLinkBatch(
 *   Array.from(links),
 *   { 
 *     checkExternal: true, 
 *     onProgress: (percent) => console.log(`Progression: ${percent}%`) 
 *   },
 *   10 // Traiter 10 liens à la fois
 * );
 */
async function processLinkBatch(linkElements, options = {}, batchSize = 5) {
  const results = [];
  
  // Traiter les liens par lots pour éviter de surcharger le navigateur
  for (let i = 0; i < linkElements.length; i += batchSize) {
    const batch = linkElements.slice(i, i + batchSize);
    const batchPromises = batch.map(link => processLink(link, options));
    
    // Attendre que tous les liens du lot soient traités
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Mettre à jour la progression
    if (options.onProgress) {
      const progress = Math.min(100, Math.round((i + batch.length) / linkElements.length * 100));
      options.onProgress(progress);
    }
    
    // Petite pause entre les lots pour éviter de bloquer l'UI
    if (i + batchSize < linkElements.length) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  return results;
}

// Exporter les fonctions
window.OptiRankProcessor = {
  processLink,
  processLinkBatch
};

console.log('OptiRank: Link Processor module loaded');
