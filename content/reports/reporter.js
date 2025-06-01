/**
 * @fileoverview OptiRank - Module de génération de rapports
 * Ce module est responsable de la génération de rapports et de logs sur les liens.
 * Il fournit des fonctions pour analyser et exporter les résultats des scans de liens.
 * 
 * @module linkReporter
 * @requires linkValidator
 * @author OptiRank Team
 * @version 1.0.0
 */

/**
 * Génère un rapport détaillé des liens ignorés lors du scan
 * Cette fonction analyse les liens qui ont été ignorés pendant le scan et les classe par catégorie
 * (liens vides, ancres, javascript, mailto, etc.).
 * 
 * @function reportSkippedLinks
 * @param {Array<HTMLAnchorElement>} links - Liste des éléments de lien à analyser
 * @returns {Object} - Rapport détaillé sur les liens ignorés
 * @returns {number} returns.count - Nombre total de liens ignorés
 * @returns {Array<HTMLAnchorElement>} returns.links - Liste des éléments de lien ignorés
 * @returns {Object} returns.reasons - Liens groupés par raison d'exclusion
 * @returns {Array<HTMLAnchorElement>} returns.reasons.empty - Liens avec href vide
 * @returns {Array<HTMLAnchorElement>} returns.reasons.anchor - Liens ancres (commençant par #)
 * @returns {Array<HTMLAnchorElement>} returns.reasons.javascript - Liens javascript
 * @returns {Array<HTMLAnchorElement>} returns.reasons.mailto - Liens mailto
 * @example
 * const allLinks = document.querySelectorAll('a[href]');
 * const skippedReport = reportSkippedLinks(Array.from(allLinks));
 * console.log(`${skippedReport.count} liens ont été ignorés`);
 */
function reportSkippedLinks(links) {
  const skippedLinks = links.filter(link => link.dataset.optirankStatus === 'skipped');
  
  if (skippedLinks.length === 0) {
    console.log(`OptiRank: Aucun lien ignoré trouvé`);
    return { count: 0, links: [] };
  }
  
  console.log(`=== LIENS IGNORÉS ===`);
  console.log(`Total des liens ignorés: ${skippedLinks.length} sur ${links.length} liens`);
  
  // Grouper les liens ignorés par raison
  const reasons = {
    empty: [],
    anchor: [],
    javascript: [],
    mailto: []
  };
  
  skippedLinks.forEach(link => {
    const href = link.href;
    
    if (!href || href === '') {
      reasons.empty.push(link);
    } else if (href === '#' || href.startsWith('#')) {
      reasons.anchor.push(link);
    } else if (href.startsWith('javascript:')) {
      reasons.javascript.push(link);
    } else if (href.startsWith('mailto:')) {
      reasons.mailto.push(link);
    }
  });
  
  // Afficher les statistiques par raison
  if (reasons.empty.length > 0) {
    console.log(`- ${reasons.empty.length} liens avec href vide`);
  }
  
  if (reasons.anchor.length > 0) {
    console.log(`- ${reasons.anchor.length} liens ancres`);
  }
  
  if (reasons.javascript.length > 0) {
    console.log(`- ${reasons.javascript.length} liens javascript`);
  }
  
  if (reasons.mailto.length > 0) {
    console.log(`- ${reasons.mailto.length} liens mailto`);
  }
  
  return {
    count: skippedLinks.length,
    links: skippedLinks,
    reasons: reasons
  };
}

/**
 * Génère un rapport détaillé sur les redirections HTTP vers HTTPS (contenu mixte)
 * Cette fonction identifie les liens qui sont automatiquement redirigés de HTTP vers HTTPS,
 * ce qui peut indiquer des problèmes potentiels de contenu mixte sur la page.
 * 
 * @function reportMixedContentRedirects
 * @param {Array<HTMLAnchorElement>} links - Liste des éléments de lien à analyser
 * @returns {Object} - Rapport sur les redirections HTTP vers HTTPS
 * @returns {number} returns.count - Nombre total de redirections HTTP vers HTTPS
 * @returns {Array<HTMLAnchorElement>} returns.links - Liste des éléments de lien avec redirection HTTP vers HTTPS
 * @example
 * const allLinks = document.querySelectorAll('a[href]');
 * const mixedContentReport = reportMixedContentRedirects(Array.from(allLinks));
 * console.log(`${mixedContentReport.count} liens HTTP sont redirigés vers HTTPS`);
 */
function reportMixedContentRedirects(links) {
  const mixedContentLinks = links.filter(link => 
    link.dataset.optirankStatus === 'redirect' && 
    link.dataset.mixedContent === 'true'
  );
  
  if (mixedContentLinks.length === 0) {
    return { count: 0, links: [] };
  }
  
  console.log(`=== REDIRECTIONS HTTP -> HTTPS ===`);
  console.log(`Total des redirections HTTP -> HTTPS: ${mixedContentLinks.length}`);
  
  // Afficher les 5 premiers exemples
  const examples = mixedContentLinks.slice(0, 5);
  examples.forEach(link => {
    console.log(`- ${link.href} -> ${link.dataset.redirectUrl}`);
  });
  
  if (mixedContentLinks.length > 5) {
    console.log(`... et ${mixedContentLinks.length - 5} autres`);
  }
  
  return {
    count: mixedContentLinks.length,
    links: mixedContentLinks
  };
}

/**
 * Génère un rapport détaillé sur les liens cassés détectés lors du scan
 * Cette fonction identifie et analyse les liens qui renvoient des codes d'erreur HTTP
 * ou qui ne sont pas accessibles pour d'autres raisons.
 * 
 * @function reportBrokenLinks
 * @param {Array<HTMLAnchorElement>} links - Liste des éléments de lien à analyser
 * @returns {Object} - Rapport détaillé sur les liens cassés
 * @returns {number} returns.count - Nombre total de liens cassés
 * @returns {Array<HTMLAnchorElement>} returns.links - Liste des éléments de lien cassés
 * @returns {Object} returns.byStatusCode - Liens groupés par code d'erreur HTTP
 * @returns {Array<HTMLAnchorElement>} returns.internal - Liens cassés internes
 * @returns {Array<HTMLAnchorElement>} returns.external - Liens cassés externes
 * @example
 * const allLinks = document.querySelectorAll('a[href]');
 * const brokenReport = reportBrokenLinks(Array.from(allLinks));
 * console.log(`${brokenReport.count} liens cassés détectés`);
 * console.log(`${brokenReport.internal.length} liens internes cassés`);
 */
function reportBrokenLinks(links) {
  const brokenLinks = links.filter(link => link.dataset.optirankStatus === 'broken');
  
  if (brokenLinks.length === 0) {
    return { count: 0, links: [] };
  }
  
  console.log(`=== LIENS CASSÉS ===`);
  console.log(`Total des liens cassés: ${brokenLinks.length}`);
  
  // Grouper par code de statut
  const byStatusCode = {};
  
  brokenLinks.forEach(link => {
    const statusCode = link.dataset.statusCode || 'unknown';
    
    if (!byStatusCode[statusCode]) {
      byStatusCode[statusCode] = [];
    }
    
    byStatusCode[statusCode].push(link);
  });
  
  // Afficher les statistiques par code de statut
  Object.entries(byStatusCode).forEach(([statusCode, links]) => {
    console.log(`- ${links.length} liens avec statut ${statusCode}`);
    
    // Afficher quelques exemples
    const examples = links.slice(0, 3);
    examples.forEach(link => {
      console.log(`  * ${link.href}`);
    });
    
    if (links.length > 3) {
      console.log(`  * ... et ${links.length - 3} autres`);
    }
  });
  
  return {
    count: brokenLinks.length,
    links: brokenLinks,
    byStatusCode: byStatusCode
  };
}

/**
 * Génère un rapport sur les redirections
 * @param {Array<HTMLAnchorElement>} links - Liens à analyser
 * @returns {Object} - Statistiques sur les redirections
 */
function reportRedirects(links) {
  const redirectLinks = links.filter(link => 
    link.dataset.optirankStatus === 'redirect' && 
    link.dataset.mixedContent !== 'true'
  );
  
  if (redirectLinks.length === 0) {
    return { count: 0, links: [] };
  }
  
  console.log(`=== REDIRECTIONS ===`);
  console.log(`Total des redirections: ${redirectLinks.length}`);
  
  // Grouper par code de statut
  const byStatusCode = {};
  
  redirectLinks.forEach(link => {
    const statusCode = link.dataset.redirectCode || 'unknown';
    
    if (!byStatusCode[statusCode]) {
      byStatusCode[statusCode] = [];
    }
    
    byStatusCode[statusCode].push(link);
  });
  
  // Afficher les statistiques par code de statut
  Object.entries(byStatusCode).forEach(([statusCode, links]) => {
    console.log(`- ${links.length} redirections avec statut ${statusCode}`);
    
    // Afficher quelques exemples
    const examples = links.slice(0, 3);
    examples.forEach(link => {
      console.log(`  * ${link.href} -> ${link.dataset.redirectUrl || 'unknown'}`);
    });
    
    if (links.length > 3) {
      console.log(`  * ... et ${links.length - 3} autres`);
    }
  });
  
  return {
    count: redirectLinks.length,
    links: redirectLinks,
    byStatusCode: byStatusCode
  };
}

/**
 * Génère un rapport complet sur tous les liens
 * @returns {Object} - Rapport complet
 */
function generateCompleteReport() {
  const links = window.OptiRankDetector.collectAllLinks();
  
  const report = {
    timestamp: Date.now(),
    pageUrl: window.location.href,
    pageTitle: document.title,
    totalLinks: links.length,
    skippedLinks: reportSkippedLinks(links),
    brokenLinks: reportBrokenLinks(links),
    redirects: reportRedirects(links),
    mixedContentRedirects: reportMixedContentRedirects(links),
    relAttributes: {
      nofollow: links.filter(link => link.getAttribute('rel')?.includes('nofollow')).length,
      sponsored: links.filter(link => link.getAttribute('rel')?.includes('sponsored')).length,
      ugc: links.filter(link => link.getAttribute('rel')?.includes('ugc')).length,
      dofollow: links.filter(link => {
        const rel = link.getAttribute('rel') || '';
        return !rel.includes('nofollow') && !rel.includes('sponsored') && !rel.includes('ugc');
      }).length
    }
  };
  
  console.log(`=== RAPPORT COMPLET ===`);
  console.log(`Page: ${report.pageTitle} (${report.pageUrl})`);
  console.log(`Total des liens: ${report.totalLinks}`);
  console.log(`Liens cassés: ${report.brokenLinks.count}`);
  console.log(`Redirections: ${report.redirects.count}`);
  console.log(`Redirections HTTP -> HTTPS: ${report.mixedContentRedirects.count}`);
  console.log(`Liens ignorés: ${report.skippedLinks.count}`);
  console.log(`Attributs rel:`);
  console.log(`- nofollow: ${report.relAttributes.nofollow}`);
  console.log(`- sponsored: ${report.relAttributes.sponsored}`);
  console.log(`- ugc: ${report.relAttributes.ugc}`);
  console.log(`- dofollow: ${report.relAttributes.dofollow}`);
  
  return report;
}

/**
 * Exporte les résultats au format CSV
 * @returns {string} - Données CSV
 */
function exportResultsAsCsv() {
  const links = window.OptiRankDetector.collectAllLinks();
  
  // En-têtes CSV
  let csv = 'URL,Texte,Statut,Code,URL de redirection,Attributs rel\n';
  
  // Ajouter chaque lien
  links.forEach(link => {
    const url = link.href.replace(/,/g, '%2C'); // Échapper les virgules
    const text = (link.textContent || '').trim().replace(/,/g, ' ').replace(/\n/g, ' ');
    const status = link.dataset.optirankStatus || 'unknown';
    const statusCode = link.dataset.statusCode || link.dataset.redirectCode || '';
    const redirectUrl = link.dataset.redirectUrl || '';
    const rel = link.getAttribute('rel') || '';
    
    csv += `"${url}","${text}","${status}","${statusCode}","${redirectUrl}","${rel}"\n`;
  });
  
  return csv;
}

// Exporter les fonctions
window.OptiRankReporter = {
  reportSkippedLinks,
  reportMixedContentRedirects,
  reportBrokenLinks,
  reportRedirects,
  generateCompleteReport,
  exportResultsAsCsv
};

console.log('OptiRank: Reporter module loaded');
