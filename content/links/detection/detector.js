/**
 * @fileoverview OptiRank - Module de détection des liens
 * Ce module est responsable de la détection et de la collecte des liens dans la page.
 * Il fournit des fonctions pour trouver, filtrer et analyser les liens présents sur une page web.
 * 
 * @module linkDetector
 * @requires linkValidator
 * @author OptiRank Team
 * @version 1.0.0
 */

/**
 * Collecte tous les liens de la page en appliquant des filtres optionnels
 * 
 * @function collectAllLinks
 * @param {Object} [options={}] - Options de filtrage pour les liens
 * @param {string} [options.domainFilter] - Filtre les liens contenant ce domaine
 * @param {boolean} [options.internalOnly] - Si true, ne retourne que les liens internes
 * @param {boolean} [options.externalOnly] - Si true, ne retourne que les liens externes
 * @returns {Array<HTMLAnchorElement>} - Tableau des éléments de lien filtrés
 * @example
 * // Collecter tous les liens
 * const allLinks = collectAllLinks();
 * 
 * // Collecter uniquement les liens externes
 * const externalLinks = collectAllLinks({ externalOnly: true });
 * 
 * // Collecter les liens d'un domaine spécifique
 * const googleLinks = collectAllLinks({ domainFilter: 'google.com' });
 */
function collectAllLinks(options = {}) {
  // Sélectionner tous les liens de la page
  const allLinks = document.querySelectorAll('a[href]');
  
  // Filtrer les liens selon les options
  return Array.from(allLinks).filter(link => {
    const href = link.href;
    
    // Ignorer les liens vides ou les pseudo-protocoles
    if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:')) {
      return false;
    }
    
    // Filtrer par domaine si spécifié
    if (options.domainFilter && !href.includes(options.domainFilter)) {
      return false;
    }
    
    // Filtrer par type de lien si spécifié
    if (options.internalOnly && !window.OptiRankValidator.isInternalLink(href)) {
      return false;
    }
    
    if (options.externalOnly && window.OptiRankValidator.isInternalLink(href)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Collecte et analyse les détails des liens présents sur la page
 * Cette fonction calcule des statistiques sur les différents types de liens présents.
 * 
 * @function collectLinkDetails
 * @returns {Object} - Statistiques détaillées sur les liens de la page
 * @returns {number} returns.total - Nombre total de liens
 * @returns {number} returns.internal - Nombre de liens internes
 * @returns {number} returns.external - Nombre de liens externes
 * @returns {number} returns.nofollow - Nombre de liens avec attribut nofollow
 * @returns {number} returns.socialMedia - Nombre de liens vers des réseaux sociaux
 * @returns {number} returns.archive - Nombre de liens vers des services d'archive
 * @returns {Array<HTMLAnchorElement>} returns.elements - Tous les éléments de lien collectés
 * @example
 * const stats = collectLinkDetails();
 * console.log(`La page contient ${stats.total} liens dont ${stats.external} externes`);
 */
function collectLinkDetails() {
  const links = collectAllLinks();
  const details = {
    total: links.length,
    internal: 0,
    external: 0,
    nofollow: 0,
    sponsored: 0,
    ugc: 0,
    dofollow: 0,
    anchors: 0,
    javascriptLinks: 0,
    mailtoLinks: 0,
    socialMediaLinks: 0,
    archiveLinks: 0
  };
  
  // Analyser chaque lien
  links.forEach(link => {
    const href = link.href;
    const rel = link.getAttribute('rel') || '';
    
    // Compter les types de liens
    if (!href || href === '#') {
      details.anchors++;
      return;
    }
    
    if (href.startsWith('javascript:')) {
      details.javascriptLinks++;
      return;
    }
    
    if (href.startsWith('mailto:')) {
      details.mailtoLinks++;
      return;
    }
    
    // Vérifier si c'est un lien interne ou externe
    if (window.OptiRankValidator.isInternalLink(href)) {
      details.internal++;
    } else {
      details.external++;
    }
    
    // Vérifier les attributs rel
    if (rel.includes('nofollow')) {
      details.nofollow++;
    } else {
      details.dofollow++;
    }
    
    if (rel.includes('sponsored')) {
      details.sponsored++;
    }
    
    if (rel.includes('ugc')) {
      details.ugc++;
    }
    
    // Vérifier les types spéciaux de liens
    if (window.OptiRankValidator.isSocialMediaLink(href)) {
      details.socialMediaLinks++;
    }
    
    if (window.OptiRankValidator.isArchiveLink(href)) {
      details.archiveLinks++;
    }
  });
  
  return details;
}

/**
 * Groupe les liens par domaine
 * @returns {Object} - Liens groupés par domaine
 */
function groupLinksByDomain() {
  const links = collectAllLinks();
  const domains = {};
  
  links.forEach(link => {
    try {
      const url = new URL(link.href);
      const domain = url.hostname;
      
      if (!domains[domain]) {
        domains[domain] = [];
      }
      
      domains[domain].push(link);
    } catch (e) {
      // Ignorer les URLs invalides
    }
  });
  
  return domains;
}

/**
 * Détecte les liens visibles dans la viewport actuelle
 * @returns {Array<HTMLAnchorElement>} - Liens visibles
 */
function detectVisibleLinks() {
  const links = collectAllLinks();
  
  return links.filter(link => {
    const rect = link.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  });
}

// Exporter les fonctions
window.OptiRankDetector = {
  collectAllLinks,
  collectLinkDetails,
  groupLinksByDomain,
  detectVisibleLinks
};

console.log('OptiRank: Link Detector module loaded');
