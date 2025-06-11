/**
 * OptiRank - Module de détection et d'analyse des titres (headings)
 * Ce module analyse la structure des titres (h1-h6) d'une page et détecte les problèmes de hiérarchie
 */

// Fonction pour détecter et analyser les titres de la page
function detectHeadings() {
  logger.debug('%c[DETECTOR] Début de la détection des titres', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
  
  // Résultats de l'analyse
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
  
  logger.debug('%c[DETECTOR] Structure initiale des données:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', JSON.stringify(headingsData, null, 2));
  
  try {
    // Détecter tous les titres - ANALYSE DU DOM
    logger.debug('%c[DETECTOR] Analyse du DOM pour détecter les titres', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // D'abord, comptons tous les titres dans le DOM, visibles ou non
    for (let i = 1; i <= 6; i++) {
      const allHeadings = document.querySelectorAll(`h${i}`);
      logger.debugEmoji("", "%c[DETECTOR] Total des titres H${i} dans le DOM: ${allHeadings.length}", 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
      
      if (allHeadings.length > 0) {
        logger.debugEmoji("", "%c[DETECTOR] Exemples de titres H${i} dans le DOM:", 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
        Array.from(allHeadings).slice(0, 3).forEach((h, idx) => {
          logger.debugEmoji("", "- H${i} #${idx+1}: "${h.textContent.trim().substring(0, 30)}${h.textContent.trim().length > 30 ? '...' : ''}"");
          logger.debugEmoji("", "- display: ${window.getComputedStyle(h).display}");
          logger.debugEmoji("", "- visibility: ${window.getComputedStyle(h).visibility}");
          logger.debugEmoji("", "- offsetParent: ${h.offsetParent !== null ? 'existe' : 'null'}");
          logger.debugEmoji("", "- height: ${h.getBoundingClientRect().height}px");
        });
      }
    }
    
    // Maintenant, filtrons pour ne garder que les titres visibles
    for (let i = 1; i <= 6; i++) {
      logger.debugEmoji("", "%c[DETECTOR] Filtrage des titres H${i} visibles", 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
      
      // Récupérer tous les titres de ce niveau
      const allHeadings = document.querySelectorAll(`h${i}`);
      logger.debugEmoji("", "[DETECTOR] Nombre total de titres H${i} avant filtrage: ${allHeadings.length}");
      
      // Filtrer pour ne garder que les titres visibles
      const headings = Array.from(allHeadings).filter(heading => {
        try {
          // Vérifier si l'élément est visible
          const style = window.getComputedStyle(heading);
          const isVisible = style.display !== 'none' && 
                          style.visibility !== 'hidden' && 
                          heading.offsetParent !== null &&
                          heading.getBoundingClientRect().height > 0;
          
          // Log détaillé pour chaque titre
          logger.debugEmoji("", "[DETECTOR] Vérification de visibilité pour H${i} "${heading.textContent.trim().substring(0, 30)}${heading.textContent.trim().length > 30 ? '...' : ''}":");
          logger.debugEmoji("", "- display: ${style.display} (${style.display !== 'none' ? 'OK' : 'NON VISIBLE'})");
          logger.debugEmoji("", "- visibility: ${style.visibility} (${style.visibility !== 'hidden' ? 'OK' : 'NON VISIBLE'})");
          logger.debugEmoji("", "- offsetParent: ${heading.offsetParent !== null ? 'existe' : 'null'} (${heading.offsetParent !== null ? 'OK' : 'NON VISIBLE'})");
          logger.debugEmoji("", "- height: ${heading.getBoundingClientRect().height}px (${heading.getBoundingClientRect().height > 0 ? 'OK' : 'NON VISIBLE'})");
          logger.debugEmoji("", "- Résultat final: ${isVisible ? 'VISIBLE' : 'NON VISIBLE'}");
          
          return isVisible;
        } catch (e) {
          logger.error(`%c[DETECTOR] Erreur lors de la vérification de visibilité d'un titre H${i}:`, 'background: red; color: white; padding: 2px 5px; border-radius: 3px;', e);
          return false;
        }
      });
      
      // Mettre à jour le compteur
      headingsData.counts[`h${i}`] = headings.length;
      logger.debugEmoji("", "%c[DETECTOR] Après filtrage: ${headings.length} titres H${i} visibles", 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
      
      // Collecter les informations sur chaque titre
      headings.forEach((heading, index) => {
        try {
          const text = heading.textContent.trim();
          logger.debugEmoji("", "[DETECTOR] Ajout du titre H${i} #${index+1} aux données: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"");
          
          headingsData.items.push({
            level: i,
            text: text,
            id: heading.id || '',
            hasAnchor: heading.querySelector('a') !== null
          });
        } catch (e) {
          logger.error(`%c[DETECTOR] Erreur lors du traitement d'un titre H${i}:`, 'background: red; color: white; padding: 2px 5px; border-radius: 3px;', e);
        }
      });
    }
    
    // Vérification de cohérence
    logger.debug('%c[DETECTOR] Vérification de cohérence des données', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
    logger.debugEmoji("", `[DETECTOR] Nombre total d'items: ${headingsData.items.length}`);
    logger.debugEmoji("", "[DETECTOR] Compteurs par niveau:", headingsData.counts);
    
    if (headingsData.items.length > 0) {
      let totalCount = 0;
      for (let i = 1; i <= 6; i++) {
        totalCount += headingsData.counts[`h${i}`];
      }
      
      logger.debugEmoji("", `[DETECTOR] Total des compteurs: ${totalCount}, Nombre d'items: ${headingsData.items.length}`);
      
      if (totalCount !== headingsData.items.length) {
        logger.warn(`%c[DETECTOR] Incohérence détectée - Total des compteurs (${totalCount}) != nombre d'items (${headingsData.items.length})`, 'background: orange; color: black; padding: 2px 5px; border-radius: 3px;');
        
        // Recalculer les compteurs à partir des items
        const newCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
        headingsData.items.forEach(item => {
          if (item.level >= 1 && item.level <= 6) {
            newCounts[`h${item.level}`]++;
          }
        });
        
        headingsData.counts = newCounts;
        logger.debug('%c[DETECTOR] Compteurs recalculés:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', newCounts);
      }
    }
    
    // Log final des données
    logger.debug('%c[DETECTOR] Données finales des titres:', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;', JSON.stringify(headingsData, null, 2));
  } catch (e) {
    logger.error('%c[DETECTOR] Erreur générale lors de la détection des titres:', 'background: red; color: white; padding: 2px 5px; border-radius: 3px;', e);
  }
  
  // Analyser la structure hiérarchique des titres
  analyzeHeadingStructure(headingsData);
  
  return headingsData;
}

// Fonction pour analyser la structure hiérarchique des titres
function analyzeHeadingStructure(headingsData) {
  // Vérifier s'il y a plus d'un H1
  if (headingsData.counts.h1 > 1) {
    headingsData.issues.push({
      type: 'multiple_h1',
      severity: 'high',
      message: `Il y a ${headingsData.counts.h1} titres H1 sur la page. Il devrait y en avoir un seul.`
    });
  }
  
  // Vérifier s'il n'y a pas de H1
  if (headingsData.counts.h1 === 0) {
    headingsData.issues.push({
      type: 'missing_h1',
      severity: 'high',
      message: 'Il n\'y a pas de titre H1 sur la page. Chaque page devrait avoir un H1.'
    });
  }
  
  // Vérifier les sauts dans la hiérarchie (ex: H2 -> H4 sans H3)
  for (let i = 1; i < 6; i++) {
    if (headingsData.counts[`h${i}`] === 0 && headingsData.counts[`h${i+1}`] > 0) {
      headingsData.issues.push({
        type: 'hierarchy_skip',
        severity: 'medium',
        message: `Il y a des titres H${i+1} mais pas de titres H${i}. La hiérarchie des titres devrait être respectée.`
      });
    }
  }
  
  // Vérifier l'ordre des titres (si un H3 apparaît avant un H2, etc.)
  const orderedHeadings = [...headingsData.items].sort((a, b) => {
    // Trier par position dans le DOM
    const posA = document.evaluate(`count(//h${a.level}[contains(text(), "${escapeXPathString(a.text)}")]/preceding::*)`, document, null, XPathResult.NUMBER_TYPE, null).numberValue;
    const posB = document.evaluate(`count(//h${b.level}[contains(text(), "${escapeXPathString(b.text)}")]/preceding::*)`, document, null, XPathResult.NUMBER_TYPE, null).numberValue;
    return posA - posB;
  });
  
  let highestLevel = 7; // Plus grand que tous les niveaux de titre
  for (let i = 0; i < orderedHeadings.length; i++) {
    const heading = orderedHeadings[i];
    
    // Si le niveau actuel est plus de 1 niveau plus profond que le niveau précédent
    if (heading.level > highestLevel + 1) {
      headingsData.issues.push({
        type: 'improper_nesting',
        severity: 'medium',
        message: `Un titre H${heading.level} ("${truncateText(heading.text, 30)}") suit directement un titre de niveau H${highestLevel}. Il manque un niveau intermédiaire.`
      });
    }
    
    // Mettre à jour le niveau le plus élevé vu jusqu'à présent
    highestLevel = Math.min(highestLevel, heading.level);
  }
}

// Fonction utilitaire pour échapper les chaînes dans les expressions XPath
function escapeXPathString(str) {
  if (str.includes("'") && str.includes('"')) {
    // Si la chaîne contient à la fois des guillemets simples et doubles,
    // nous devons la diviser et la concaténer
    let parts = str.split("'");
    return "concat('" + parts.join("', \"'\", '") + "')";
  }
  
  if (str.includes("'")) {
    return '"' + str + '"';
  }
  
  return "'" + str + "'";
}

// Fonction utilitaire pour tronquer un texte
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Exposer les fonctions
window.OptiRankHeadings = {
  detectHeadings: detectHeadings
};

logger.debug('OptiRank: Headings Detector module loaded');
