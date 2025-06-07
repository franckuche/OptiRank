/**
 * OptiRank - Module d'analyse des titres (headings) - Affichage
 * Ce fichier gère l'affichage des titres et des statistiques dans le popup
 */

/**
 * NOUVELLE FONCTION - Traite les données brutes des headings (Option B)
 * Fait tout le comptage et l'analyse dans le popup pour éviter les incohérences
 */
function processRawHeadingsData(rawData) {
  logger.debug('%c[PROCESS_RAW] === TRAITEMENT COMPLET DES DONNÉES BRUTES ===', 'background: #2563eb; color: white; padding: 5px; font-weight: bold;');
  logger.debug('%c[PROCESS_RAW] Données brutes reçues:', 'background: #2563eb; color: white; padding: 2px 5px;', rawData);
  
  if (!rawData || !rawData.rawHeadings) {
    logger.error('%c[PROCESS_RAW] ERREUR: Pas de données brutes valides', 'background: red; color: white; padding: 2px 5px;');
    return;
  }
  
  const rawHeadings = rawData.rawHeadings;
  logger.debugEmoji("", "%c[PROCESS_RAW] ${rawHeadings.length} titres bruts à traiter", 'background: #2563eb; color: white; padding: 2px 5px;');
  
  // ÉTAPE 1: Compter les headings par niveau (fait dans le popup maintenant)
  const counts = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0
  };
  
  rawHeadings.forEach(heading => {
    const levelKey = `h${heading.level}`;
    if (counts.hasOwnProperty(levelKey)) {
      counts[levelKey]++;
    }
  });
  
  logger.debug('%c[PROCESS_RAW] Comptage terminé:', 'background: #2563eb; color: white; padding: 2px 5px;', counts);
  
  // ÉTAPE 2: Créer la structure de données compatible avec l'affichage existant
  const processedData = {
    counts: counts,
    headings: rawHeadings,  // Utiliser les données brutes
    items: rawHeadings,     // Alias pour compatibilité
    issues: [],             // Sera calculé par l'analyse avancée
    timestamp: rawData.timestamp
  };
  
  logger.debug('%c[PROCESS_RAW] Structure de données créée:', 'background: #2563eb; color: white; padding: 2px 5px;', processedData);
  
  // ÉTAPE 3: Appeler l'affichage normal avec les données traitées
  logger.debug('%c[PROCESS_RAW] Appel de displayHeadingsResults avec les données traitées', 'background: #10b981; color: white; padding: 2px 5px;');
  displayHeadingsResults(processedData);
}

// Fonction pour afficher les résultats de l'analyse des titres
function displayHeadingsResults(headingsData) {
  logger.debug('%c[DISPLAY] Début de l\'affichage des résultats', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
  logger.debug('%c[DISPLAY] Données reçues:', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', headingsData);
  
  if (!headingsData) {
    logger.warn('⚠️ DISPLAY: Aucune donnée fournie à displayHeadingsResults');
    return;
  }

  logger.debug('📊 DISPLAY: Analyse des données:');
  logger.debug('  - headingsData.counts:', headingsData.counts);
  logger.debug('  - headingsData.headings:', headingsData.headings?.length || 0, 'éléments');
  logger.debug('  - headingsData.items:', headingsData.items?.length || 0, 'éléments');
  logger.debug('  - headingsData.issues:', headingsData.issues?.length || 0, 'éléments');

  try {
    // Mise à jour des compteurs
    if (headingsData.counts) {
      logger.debug('📈 DISPLAY: Mise à jour des compteurs:', headingsData.counts);
      updateHeadingCounts(headingsData.counts);
    } else {
      logger.warn('⚠️ DISPLAY: Pas de compteurs dans les données');
    }

    // Affichage de la structure des titres
    const headingsList = headingsData.headings || headingsData.items || [];
    logger.debug('📝 DISPLAY: Liste des headings à afficher:', headingsList.length, 'éléments');
    
    if (headingsList.length > 0) {
      logger.debug('🔍 DISPLAY: Détail des headings:');
      headingsList.forEach((heading, index) => {
        logger.debugEmoji("", `${index + 1}. H${heading.level}: "${heading.text}" ${heading.missing ? '(MANQUANT)' : ''}`);
      });
    }
    
    displayHeadingStructure(headingsList);

    // Mise à jour des insights
    if (headingsData.issues !== undefined) {
      logger.debug('🧠 DISPLAY: Mise à jour des insights avec', headingsData.issues.length, 'problèmes');
      updateInsights(headingsData);
    } else {
      logger.debug('🧠 DISPLAY: Génération automatique des insights');
      updateInsights({
        counts: headingsData.counts,
        headings: headingsList,
        issues: []
      });
    }

  } catch (error) {
    logger.error('❌ DISPLAY: Erreur dans displayHeadingsResults:', error);
    logger.error('Stack trace:', error.stack);
  }
}

// Fonction pour mettre à jour les compteurs de headings avec le design élégant
function updateHeadingCounts(counts) {
  logger.debug('%c[UPDATE_COUNTS] Mise à jour des compteurs:', 'background: #8b5cf6; color: white; padding: 2px 5px;', counts);
  
  // Mettre à jour chaque niveau de titre
  for (let i = 1; i <= 6; i++) {
    const count = counts[`h${i}`] || 0;
    
    // Mettre à jour le texte du compteur avec les bons IDs
    const element = document.getElementById(`h${i}-count`);
    if (element) {
      element.textContent = count;
      logger.debugEmoji("", "%c[UPDATE_COUNTS] Compteur H${i} mis à jour: ${count}", 'background: #3b82f6; color: white; padding: 2px 5px;');
    } else {
      logger.warn(`%c[UPDATE_COUNTS] Élément h${i}-count non trouvé`, 'background: orange; color: white; padding: 2px 5px;');
    }
    
    // SUPPRIMÉ : Plus de gestion des classes missing pour les compteurs
    // Tous les badges des compteurs restent BLEUS, même si count=0
    const badge = document.querySelector(`.h${i}-badge`);
    if (badge) {
      // Toujours retirer la classe missing des badges de compteurs
      badge.classList.remove('missing');
      logger.debugEmoji("", "%c[UPDATE_COUNTS] Badge H${i} maintenu en BLEU (count=${count})", 'background: #3b82f6; color: white; padding: 2px 5px;');
    }
  }
  
  // Synchroniser avec la structure si possible
  if (window.headingsInit && window.headingsInit.syncCountersWithStructure) {
    setTimeout(() => {
      window.headingsInit.syncCountersWithStructure();
    }, 100);
  }
}

// Fonction pour mettre à jour un compteur de heading spécifique
function updateHeadingCount(level, count) {
  logger.debugEmoji("", "%c[UPDATE_COUNT] Mise à jour du compteur H${level} avec la valeur ${count}", 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
  
  // CORRECTION: Cibler directement les éléments DOM avec les IDs exacts du HTML
  // L'élément visible pour l'utilisateur
  let countLabel = document.getElementById(`h${level}-count-label`);
  // L'élément de stockage de données
  let countElement = document.getElementById(`h${level}-count`);
  
  // Si nous ne les trouvons pas par ID, essayons de les trouver par la structure
  if (!countElement || !countLabel) {
    logger.debugEmoji("", "%c[UPDATE_COUNT] Tentative de recherche alternative pour H${level}", 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // Parcourir toutes les cartes
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      // Chercher les titres H5 contenant "H1", "H2", etc.
      const cardTitle = card.querySelector('h5');
      if (cardTitle && cardTitle.textContent.trim() === `H${level}`) {
        logger.debugEmoji("", "%c[UPDATE_COUNT] Carte trouvée pour H${level} via titre", 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
        
        // Chercher le compteur dans cette carte
        const counter = card.querySelector('.counter-value');
        if (counter) {
          countLabel = counter;
          countElement = card.querySelector('.counter') || card;
          logger.debugEmoji("", "%c[UPDATE_COUNT] Éléments trouvés via recherche alternative", 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
        }
      }
    });
  }
  
  // Chercher l'élément de compteur par la classe heading-count-item
  const countItem = document.querySelector(`.h${level}-item`);
  
  // Vérifier si les éléments existent après notre recherche approfondie
  logger.debugEmoji("", "[UPDATE_COUNT] Élément compteur H${level}: ${countElement ? 'trouvé' : 'NON TROUVÉ'}");
  logger.debugEmoji("", "[UPDATE_COUNT] Élément label H${level}: ${countLabel ? 'trouvé' : 'NON TROUVÉ'}");
  logger.debugEmoji("", "[UPDATE_COUNT] Élément item H${level}: ${countItem ? 'trouvé' : 'NON TROUVÉ'}");
  
  if (countLabel) {
    logger.debugEmoji("", `[UPDATE_COUNT] Valeur actuelle du label H${level}: "${countLabel.textContent}"`);
  }
  
  const cardElement = countElement ? (countElement.closest('.card') || countElement.parentElement) : null;
  logger.debugEmoji("", "[UPDATE_COUNT] Carte parente: ${cardElement ? 'trouvée' : 'NON TROUVÉE'}");
  
  if (!countElement || !countLabel) {
    logger.error(`%c[UPDATE_COUNT] ERREUR: Éléments pour H${level} non trouvés`, 'background: red; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // Afficher tous les compteurs disponibles pour le débogage
    const allCounters = document.querySelectorAll('.counter, .counter-value, [id*="count"]');
    logger.debugEmoji("", "%c[UPDATE_COUNT] Tous les compteurs trouvés (${allCounters.length}):", 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
    allCounters.forEach((el, index) => {
      logger.debugEmoji("", "- Compteur #${index+1}: ID=${el.id || 'aucun'}, Class=${el.className}, Text=${el.textContent.trim()}");
    });
    
    // Afficher la structure du DOM pour débogage
    const headingsSection = document.querySelector('#headings-tab-content');
    if (headingsSection) {
      logger.debugEmoji("", "%c[UPDATE_COUNT] Structure du DOM de la section des titres:", 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
      logger.debug(headingsSection.innerHTML.substring(0, 500) + '...');
    }
    
    // Créer les éléments s'ils n'existent pas
    if (cardElement) {
      logger.debugEmoji("", "%c[UPDATE_COUNT] Tentative de création des éléments manquants dans la carte H${level}", 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
      
      if (!countElement) {
        countElement = document.createElement('div');
        countElement.id = `h${level}-count`;
        countElement.className = 'counter';
        cardElement.appendChild(countElement);
      }
      
      if (!countLabel) {
        countLabel = document.createElement('span');
        countLabel.id = `h${level}-count-label`;
        countLabel.className = 'counter-value';
        countElement.appendChild(countLabel);
      }
    } else {
      return; // Si nous ne pouvons rien faire, on abandonne
    }
  }
  
  // Mettre à jour le label avec le nombre
  if (countLabel) {
    // Conserver l'ancienne valeur pour le débogage
    const oldValue = countLabel.textContent;
    
    // Définir la nouvelle valeur
    countLabel.textContent = count;
    logger.debugEmoji("", "%c[UPDATE_COUNT] Label H${level} mis à jour: ${oldValue} -> ${count}", 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // Animation du changement de nombre
    countLabel.style.transform = 'scale(1.2)';
    setTimeout(() => {
      countLabel.style.transform = 'scale(1)';
      // Vérifier que la valeur est toujours correcte après l'animation
      logger.debugEmoji("", "[UPDATE_COUNT] Valeur du label H${level} après animation: ${countLabel.textContent}");
    }, 200);
  } else {
    logger.warn(`%c[UPDATE_COUNT] Label h${level}-count-label non trouvé, impossible de mettre à jour le texte`, 'background: orange; color: black; padding: 2px 5px; border-radius: 3px;');
  }
  
  // Stocker la valeur dans l'attribut data-value pour référence future
  countElement.setAttribute('data-value', count);
  logger.debugEmoji("", "[UPDATE_COUNT] Attribut data-value de h${level}-count mis à jour: ${count}");
  
  // Ajouter l'attribut data-count à l'élément heading-count-item pour les effets CSS
  if (countItem) {
    countItem.setAttribute('data-count', count);
    logger.debugEmoji("", "[UPDATE_COUNT] Attribut data-count ajouté à h${level}-item: ${count}");
  }
  
  // Ajouter des styles spéciaux en fonction du compteur
  if (count === 0 || count === '0') {
    // Si aucun titre, état désactivé
    if (cardElement) {
      cardElement.style.opacity = '0.7';
      logger.debugEmoji("", "[UPDATE_COUNT] Carte H${level} grisée (opacity: 0.7) car compteur = 0");
    }
    
    // NOUVEAU : Ajouter la classe 'missing' au badge quand le count est 0
    const badge = countItem ? countItem.querySelector('.count-badge') : 
                  document.querySelector(`.h${level}-badge`);
    if (badge) {
      badge.classList.add('missing');
      logger.debugEmoji("", "[UPDATE_COUNT] Classe 'missing' ajoutée au badge H${level} (compteur = 0)");
    }
  } else {
    // Sinon, rendre la carte pleinement visible
    if (cardElement) {
      cardElement.style.opacity = '1';
      logger.debugEmoji("", "[UPDATE_COUNT] Carte H${level} rendue pleinement visible (opacity: 1) car compteur = ${count}");
    }
    
    // NOUVEAU : Retirer la classe 'missing' du badge quand le count > 0
    const badge = countItem ? countItem.querySelector('.count-badge') : 
                  document.querySelector(`.h${level}-badge`);
    if (badge) {
      badge.classList.remove('missing');
      logger.debugEmoji("", "[UPDATE_COUNT] Classe 'missing' retirée du badge H${level} (compteur = ${count})");
    }
    
    // Changer la couleur si le nombre est élevé
    if (level === 1 && count > 1) {
      // Alerte visuelle pour plusieurs H1 (non recommandé pour le SEO)
      const warningColor = '#FC642D';
      countElement.style.backgroundColor = warningColor;
      countElement.style.height = '6px'; // Rendre la barre plus visible
      
      // Ajouter un effet de pulsation pour attirer l'attention
      if (cardElement) {
        cardElement.style.animation = 'pulse 2s infinite';
        // Ajouter la définition de l'animation si elle n'existe pas déjà
        if (!document.getElementById('pulse-animation')) {
          const style = document.createElement('style');
          style.id = 'pulse-animation';
          style.textContent = `
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(252, 100, 45, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(252, 100, 45, 0); }
              100% { box-shadow: 0 0 0 0 rgba(252, 100, 45, 0); }
            }
          `;
          document.head.appendChild(style);
        }
      }
    } else if (level === 3 && count > 10) {
      // Alerte visuelle pour trop de H3
      countElement.style.backgroundColor = '#FC642D';
      countElement.style.height = '6px'; // Rendre la barre plus visible
    } else {
      // Restaurer les styles par défaut
      countElement.style.height = '4px';
      if (cardElement) {
        cardElement.style.animation = 'none';
      }
    }
  }
  
  logger.debugEmoji("", "Headings: Compteur H${level} mis à jour avec la valeur ${count}");
}

// Fonction pour mettre à jour les insights
function updateInsights(headingsData) {
  if (!headingsData) {
    return;
  }
  
  const counts = headingsData.counts || {};
  const headingsList = headingsData.items || headingsData.headings || [];
  
  // CORRECTION MAJEURE : Synchroniser avec la structure affichée
  // L'interface ajoute des titres "manquants" via detectMissingHeadings()
  // Il faut recalculer les compteurs en incluant ces titres factices
  
  let enhancedHeadings = headingsList;
  let enhancedCounts = { ...counts };
  
  // Utiliser le même processus que l'affichage de la structure
  if (window.headingStructureAnalyzer && typeof window.headingStructureAnalyzer.detectMissingHeadings === 'function') {
    enhancedHeadings = window.headingStructureAnalyzer.detectMissingHeadings(headingsList);
    logger.debug('🔧 INSIGHTS: Structure enrichie avec titres manquants:', enhancedHeadings.length, 'vs original:', headingsList.length);
    
    // Recalculer les compteurs en incluant les titres "manquants"
    enhancedCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    enhancedHeadings.forEach(heading => {
      if (heading.level >= 1 && heading.level <= 6) {
        enhancedCounts[`h${heading.level}`]++;
      }
    });
    
    logger.debug('🔧 INSIGHTS: Compteurs originaux:', counts);
    logger.debug('🔧 INSIGHTS: Compteurs avec titres manquants:', enhancedCounts);
  }
  
  // Récupérer l'élément insight unique
  const insightElement = document.getElementById('insight-h1-present');
  if (!insightElement) {
    return;
  }
  
  // Analyse avancée intégrée
  const advancedAnalysis = analyzeHeadingsAdvanced(enhancedCounts, enhancedHeadings);
  
  // Toujours utiliser l'affichage avancé (même si aucun problème)
  displayAdvancedInsights(insightElement, advancedAnalysis);
  return;
  
  // FALLBACK: Système simple (ne devrait plus être utilisé)
  // Ce code est conservé pour compatibilité mais ne devrait plus être atteint
  
  // Récupérer les éléments à modifier pour le système simple
  const iconElement = insightElement.querySelector('.insight-icon i');
  const titleElement = insightElement.querySelector('.insight-title');
  const descriptionElement = insightElement.querySelector('.insight-description');
  
  // Modifier le contenu en fonction du nombre de H1 (système simple)
  if (enhancedCounts.h1 === 1) {
    insightElement.className = 'insight-item success';
    if (iconElement) iconElement.className = 'fas fa-check-circle';
    if (titleElement) titleElement.textContent = 'Balise titre présente';
    if (descriptionElement) descriptionElement.textContent = 'La page contient une balise titre H1 unique et bien définie.';
  } else if (enhancedCounts.h1 === 0) {
    insightElement.className = 'insight-item error';
    if (iconElement) iconElement.className = 'fas fa-times-circle';
    if (titleElement) titleElement.textContent = 'Balise h1 manquante';
    if (descriptionElement) descriptionElement.textContent = 'La page ne contient pas de balise titre H1. Chaque page devrait avoir un titre principal.';
  } else if (enhancedCounts.h1 > 1) {
    insightElement.className = 'insight-item error';
    if (iconElement) iconElement.className = 'fas fa-exclamation-triangle';
    if (titleElement) titleElement.textContent = 'Trop de balises H1';
    if (descriptionElement) descriptionElement.textContent = `La page contient ${enhancedCounts.h1} balises H1. Il est recommandé d'avoir une seule balise H1 par page.`;
  } else {
    insightElement.className = 'insight-item';
    if (iconElement) iconElement.className = 'fas fa-spinner fa-spin';
    if (titleElement) titleElement.textContent = 'Analyse en cours...';
    if (descriptionElement) descriptionElement.textContent = 'Analyse de la structure des titres de la page en cours.';
  }
}

/**
 * Analyse avancée intégrée (sans dépendances externes)
 * ALGORITHME AMÉLIORÉ - Détection complète des problèmes de hiérarchie
 */
function analyzeHeadingsAdvanced(counts, headingsList) {
  logger.debug('🔍 ANALYSE_AVANCÉE: Début de l\'analyse');
  logger.debug('🔍 ANALYSE_AVANCÉE: Compteurs reçus:', counts);
  logger.debug('🔍 ANALYSE_AVANCÉE: Liste des titres:', headingsList.length, 'titres');
  
  const issues = [];
  let severity = 'success';
  let message = 'Structure de titres excellente ! La hiérarchie est parfaitement optimisée pour le SEO.';
  
  logger.debug('🔍 ANALYSE_AVANCÉE: === VÉRIFICATION H1 ===');
  // 1. Vérifier les problèmes de base H1 (PRIORITÉ ROUGE)
  if (counts.h1 === 0) {
    logger.debug('🔍 ANALYSE_AVANCÉE: ❌ H1 manquant détecté');
    issues.push({
      type: 'noH1',
      severity: '🔴',
      title: 'Balise H1 manquante',
      message: 'La page ne contient pas de balise H1. Ajouter immédiatement un titre principal.',
      weight: 5,
      priority: 1
    });
    severity = 'critical';
    message = 'Problèmes critiques détectés';
  } else if (counts.h1 > 1) {
    logger.debug('🔍 ANALYSE_AVANCÉE: ❌ Multiples H1 détectés:', counts.h1);
    issues.push({
      type: 'multipleH1',
      severity: '🔴',
      title: 'Plusieurs H1 détectés',
      message: `${counts.h1} balises H1 détectées. Conserver un seul H1, convertir les autres en H2/H3.`,
      weight: 5,
      priority: 1
    });
    severity = 'critical';
    message = 'Problèmes critiques détectés';
  } else {
    logger.debug('🔍 ANALYSE_AVANCÉE: ✅ H1 OK (1 trouvé)');
    
    // Vérifier la qualité du H1
    const h1Headings = headingsList.filter(h => h.level === 1);
    if (h1Headings.length > 0) {
      const h1Text = h1Headings[0].text.trim();
      const h1Html = h1Headings[0].html || '';
      logger.debug('🔍 ANALYSE_AVANCÉE: Texte du H1:', `"${h1Text}"`);
      logger.debug('🔍 ANALYSE_AVANCÉE: HTML du H1:', h1Html);
      
      // Cas 1: H1 complètement vide
      if (h1Text === '') {
        logger.debug('🔍 ANALYSE_AVANCÉE: ❌ H1 vide détecté');
        issues.push({
          type: 'emptyH1',
          severity: '🔴',
          title: 'H1 vide',
          message: 'Le titre H1 est vide. Ajouter un titre descriptif pour améliorer le SEO.',
          weight: 4,
          priority: 1
        });
        severity = 'critical';
        message = 'Problèmes critiques détectés';
      }
      // Cas 2: H1 ne contient qu'une image (détection avancée)
      else if (h1Html && h1Text.length <= 20 && (h1Html.includes('<img') || h1Html.includes('<svg'))) {
        logger.debug('🔍 ANALYSE_AVANCÉE: ⚠️ H1 avec image détecté');
        
        // Vérifier si c'est principalement une image
        const hasSignificantText = h1Text.length > 10 && !h1Text.match(/^[a-zA-Z0-9-_.]+$/);
        
        if (!hasSignificantText) {
          issues.push({
            type: 'imageOnlyH1',
            severity: '🟡',
            title: 'H1 principalement composé d\'une image',
            message: `Le H1 ne contient que "${h1Text}" (probablement un attribut alt). Ajouter du texte visible améliorerait le SEO.`,
            weight: 3,
            priority: 2
          });
          
          if (severity !== 'critical') {
            severity = 'warning';
            message = 'Problèmes de qualité détectés';
          }
        }
      }
      // Cas 3: H1 trop court (moins de 3 caractères utiles)
      else if (h1Text.length < 3) {
        logger.debug('🔍 ANALYSE_AVANCÉE: ⚠️ H1 très court détecté');
        issues.push({
          type: 'shortH1',
          severity: '🟡',
          title: 'H1 très court',
          message: `Le H1 "${h1Text}" est très court (${h1Text.length} caractères). Un titre plus descriptif améliorerait le SEO.`,
          weight: 2,
          priority: 2
        });
        
        if (severity !== 'critical') {
          severity = 'warning';
          message = 'Problèmes de qualité détectés';
        }
      }
    }
  }
  
  logger.debug('🔍 ANALYSE_AVANCÉE: === VÉRIFICATION HIÉRARCHIE AMÉLIORÉE V2.0 ===');
  
  // 2. ALGORITHME SUPER AMÉLIORÉ - Détection complète et intelligente
  
  // Configuration des seuils pour les ratios
  const RATIO_THRESHOLDS = {
    excessive: 6,    // Ratio excessif (> 6:1)
    high: 4,         // Ratio élevé (> 4:1) 
    warning: 3       // Ratio d'avertissement (> 3:1)
  };
  
  // === ÉTAPE 1: ORPHELINS (Priorité critique) ===
  logger.debug('🔍 ANALYSE_AVANCÉE: === ÉTAPE 1: DÉTECTION DES ORPHELINS ===');
  for (let parentLevel = 1; parentLevel <= 5; parentLevel++) {
    const childLevel = parentLevel + 1;
    const parentCount = counts[`h${parentLevel}`] || 0;
    const childCount = counts[`h${childLevel}`] || 0;
    
    if (parentCount === 0 && childCount > 0) {
      logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: ❌ Orphelins détectés: ${childCount} H${childLevel} sans H${parentLevel}");
      issues.push({
        type: 'orphanHeadings',
        severity: '🔴',
        title: `Titres H${childLevel} orphelins`,
        message: `${childCount} titres H${childLevel} existent sans aucun titre H${parentLevel} parent. Cela crée une hiérarchie incorrecte pour le SEO.`,
        weight: 4,
        priority: 1,
        data: { parentLevel, childLevel, parentCount, childCount }
      });
      severity = 'critical';
      message = 'Problèmes critiques de hiérarchie détectés';
    }
  }
  
  // === ÉTAPE 2: RATIOS ADJACENTS (H1→H2, H2→H3, etc.) ===
  logger.debug('🔍 ANALYSE_AVANCÉE: === ÉTAPE 2: RATIOS ADJACENTS ===');
  for (let parentLevel = 1; parentLevel <= 5; parentLevel++) {
    const childLevel = parentLevel + 1;
    const parentCount = counts[`h${parentLevel}`] || 0;
    const childCount = counts[`h${childLevel}`] || 0;
    
    // EXCEPTION: H2/H1 - Il est NORMAL d'avoir plusieurs H2 pour 1 seul H1
    if (parentLevel === 1 && childLevel === 2) {
      logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: ✅ H2/H1 ignoré (normal d'avoir plusieurs H2 pour 1 H1)");
      continue;
    }
    
    if (parentCount > 0 && childCount > 0) {
      const ratio = childCount / parentCount;
      logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: Ratio H${childLevel}/H${parentLevel}: ${ratio.toFixed(1)}");
      
      // Ratio excessif (critique)
      if (ratio > RATIO_THRESHOLDS.excessive) {
        logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: ❌ Déséquilibre EXCESSIF détecté: ratio ${ratio.toFixed(1)}");
        issues.push({
          type: 'excessiveRatio',
          severity: '🔴',
          title: `H${childLevel} déséquilibre excessif`,
          message: `${childCount} H${childLevel} pour seulement ${parentCount} H${parentLevel} (ratio ${ratio.toFixed(1)}:1). Cette disproportion nuit gravement à la hiérarchie SEO.`,
          weight: 4,
          priority: 1,
          data: { parentLevel, childLevel, parentCount, childCount, ratio }
        });
        severity = 'critical';
        message = 'Problèmes critiques de hiérarchie détectés';
      }
      // Ratio élevé (warning)
      else if (ratio > RATIO_THRESHOLDS.high) {
        logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: ⚠️ Déséquilibre ÉLEVÉ détecté: ratio ${ratio.toFixed(1)}");
        issues.push({
          type: 'highRatio',
          severity: '🟡',
          title: `Trop de H${childLevel} par rapport aux H${parentLevel}`,
          message: `${childCount} H${childLevel} pour ${parentCount} H${parentLevel} (ratio ${ratio.toFixed(1)}:1). Créer plus de H${parentLevel} ou regrouper les H${childLevel}.`,
          weight: 3,
          priority: 2,
          data: { parentLevel, childLevel, parentCount, childCount, ratio }
        });
        
        if (severity !== 'critical') {
          severity = 'warning';
          message = 'Problèmes de hiérarchie détectés';
        }
      }
    }
  }
  
  // === ÉTAPE 3: NOUVELLE - DÉSÉQUILIBRES GLOBAUX ===
  logger.debug('🔍 ANALYSE_AVANCÉE: === ÉTAPE 3: DÉSÉQUILIBRES GLOBAUX ===');
  
  // Détecter les cas comme H3:27, H4:1, H5:20 = problème structurel majeur
  // Chercher les "goulots d'étranglement" dans la hiérarchie
  
  for (let bottleneckLevel = 2; bottleneckLevel <= 5; bottleneckLevel++) {
    const bottleneckCount = counts[`h${bottleneckLevel}`] || 0;
    
    // Ignorer les niveaux sans contenu
    if (bottleneckCount === 0) continue;
    
    // Vérifier les niveaux en dessous du goulot
    for (let belowLevel = bottleneckLevel + 1; belowLevel <= 6; belowLevel++) {
      const belowCount = counts[`h${belowLevel}`] || 0;
      
      if (belowCount === 0) continue;
      
      // Calculer le ratio en sautant les niveaux intermédiaires
      const ratio = belowCount / bottleneckCount;
      
      // Si le ratio est très élevé, c'est un problème de "cascade"
      if (ratio > 10) {
        logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: ❌ DÉSÉQUILIBRE GLOBAL: H${belowLevel}:${belowCount} vs H${bottleneckLevel}:${bottleneckCount} = ratio ${ratio.toFixed(1)}");
        
        // Vérifier s'il y a des niveaux manquants entre les deux
        const missingLevels = [];
        for (let i = bottleneckLevel + 1; i < belowLevel; i++) {
          if ((counts[`h${i}`] || 0) === 0) {
            missingLevels.push(i);
          }
        }
        
        let title = `Déséquilibre global H${belowLevel}/H${bottleneckLevel}`;
        let message = `${belowCount} H${belowLevel} pour seulement ${bottleneckCount} H${bottleneckLevel} (ratio ${ratio.toFixed(1)}:1)`;
        
        if (missingLevels.length > 0) {
          message += ` avec niveaux H${missingLevels.join(', H')} manquants`;
          title = `Structure hiérarchique cassée`;
        }
        
        message += `. Cette disproportion crée une hiérarchie déséquilibrée.`;
        
        issues.push({
          type: 'globalImbalance',
          severity: '🔴',
          title: title,
          message: message,
          weight: 5,
          priority: 1,
          data: { 
            bottleneckLevel, 
            belowLevel, 
            bottleneckCount, 
            belowCount, 
            ratio,
            missingLevels
          }
        });
        
        severity = 'critical';
        message = 'Problèmes critiques de hiérarchie détectés';
        
        // Éviter les doublons en s'arrêtant au premier problème pour ce goulot
        break;
      }
    }
  }
  
  // === ÉTAPE 4: STRUCTURES INCOHÉRENTES ===
  logger.debug('🔍 ANALYSE_AVANCÉE: === ÉTAPE 4: STRUCTURES INCOHÉRENTES ===');
  
  // Détecter les cas comme "Beaucoup de H3, très peu de H4, beaucoup de H5"
  // C'est un signe d'une mauvaise utilisation de la hiérarchie
  
  const levelCounts = [
    { level: 1, count: counts.h1 || 0 },
    { level: 2, count: counts.h2 || 0 },
    { level: 3, count: counts.h3 || 0 },
    { level: 4, count: counts.h4 || 0 },
    { level: 5, count: counts.h5 || 0 },
    { level: 6, count: counts.h6 || 0 }
  ].filter(item => item.count > 0);
  
  // Détecter les "vallées profondes" : niveaux avec très peu de contenu
  // entourés de niveaux avec beaucoup de contenu
  for (let i = 1; i < levelCounts.length - 1; i++) {
    const prev = levelCounts[i - 1];
    const current = levelCounts[i];
    const next = levelCounts[i + 1];
    
    // Si le niveau actuel a beaucoup moins que ses voisins
    const avgNeighbors = (prev.count + next.count) / 2;
    const valleyRatio = avgNeighbors / current.count;
    
    if (valleyRatio > 8 && current.count <= 2 && avgNeighbors >= 10) {
      logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: ⚠️ VALLÉE DÉTECTÉE: H${current.level}:${current.count} entre H${prev.level}:${prev.count} et H${next.level}:${next.count}");
      
      issues.push({
        type: 'hierarchyValley',
        severity: '🟡',
        title: `Goulot d'étranglement H${current.level}`,
        message: `H${current.level} (${current.count}) crée un goulot entre H${prev.level} (${prev.count}) et H${next.level} (${next.count}). Cela limite l'organisation du contenu.`,
        weight: 3,
        priority: 2,
        data: { 
          valleyLevel: current.level,
          valleyCount: current.count,
          prevLevel: prev.level,
          prevCount: prev.count,
          nextLevel: next.level,
          nextCount: next.count
        }
      });
      
      if (severity !== 'critical') {
        severity = 'warning';
        message = 'Problèmes de structure détectés';
      }
    }
  }
  
  // === ÉTAPE 5: GAPS DANS LA HIÉRARCHIE ===
  logger.debug('🔍 ANALYSE_AVANCÉE: === ÉTAPE 5: GAPS ===');
  
  // Debug : Afficher les compteurs reçus
  logger.debug('🔍 ANALYSE_AVANCÉE: Compteurs pour gaps:', {
    h1: counts.h1 || 0,
    h2: counts.h2 || 0, 
    h3: counts.h3 || 0,
    h4: counts.h4 || 0,
    h5: counts.h5 || 0,
    h6: counts.h6 || 0
  });
  
  const levelsWithContent = [];
  for (let i = 1; i <= 6; i++) {
    const count = counts[`h${i}`] || 0;
    if (count > 0) {
      levelsWithContent.push(i);
      logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: Niveau H${i} a du contenu: ${count}");
    }
  }
  
  logger.debug('🔍 ANALYSE_AVANCÉE: Niveaux avec contenu:', levelsWithContent);
  
  // Vérifier s'il y a des sauts de niveaux
  for (let i = 0; i < levelsWithContent.length - 1; i++) {
    const currentLevel = levelsWithContent[i];
    const nextLevel = levelsWithContent[i + 1];
    const levelDiff = nextLevel - currentLevel;
    
    logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: Comparaison H${currentLevel} → H${nextLevel} (diff: ${levelDiff})");
    
    if (levelDiff > 1) {
      const missingLevels = [];
      for (let level = currentLevel + 1; level < nextLevel; level++) {
        const missingCount = counts[`h${level}`] || 0;
        logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: Vérification H${level}: ${missingCount}");
        
        // VÉRIFICATION DOUBLE : s'assurer que le niveau est vraiment absent
        if (missingCount === 0) {
          missingLevels.push(`H${level}`);
        } else {
          logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: ⚠️ ERREUR DE LOGIQUE: H${level} a ${missingCount} éléments mais n'était pas dans levelsWithContent !");
        }
      }
      
      // Ne créer un problème QUE s'il y a vraiment des niveaux manquants
      if (missingLevels.length > 0) {
        logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: ⚠️ Gap valide détecté: H${currentLevel} → H${nextLevel} (manque: ${missingLevels.join(', ')})");
        
        issues.push({
          type: 'hierarchyGap',
          severity: '🟡',
          title: `Niveaux de titre manquants`,
          message: `Saut de H${currentLevel} à H${nextLevel} sans ${missingLevels.join(', ')} intermédiaire(s). Cela peut affecter la compréhension de la structure par les moteurs de recherche.`,
          weight: 2,
          priority: 2,
          data: { fromLevel: currentLevel, toLevel: nextLevel, missingLevels }
        });
        
        if (severity !== 'critical') {
          severity = 'warning';
          message = 'Problèmes de hiérarchie détectés';
        }
      } else {
        logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: ✅ Gap ignoré: H${currentLevel} → H${nextLevel} (pas de niveaux réellement manquants)");
      }
    }
  }
  
  logger.debug('🔍 ANALYSE_AVANCÉE: === RÉSULTATS ===');
  logger.debug('🔍 ANALYSE_AVANCÉE: Nombre de problèmes détectés:', issues.length);
  issues.forEach((issue, index) => {
    logger.debugEmoji("🔍", "ANALYSE_AVANCÉE: Problème ${index + 1}: ${issue.severity} ${issue.title}");
  });
  
  // Si aucun problème détecté ET qu'on a au moins un H1, c'est vraiment optimal
  if (issues.length === 0 && counts.h1 === 1) {
    logger.debug('🔍 ANALYSE_AVANCÉE: ✅ Structure parfaite détectée !');
    severity = 'success';
    message = 'Structure de titres excellente ! La hiérarchie est parfaitement optimisée pour le SEO.';
  }
  
  // 3. TRIER PAR PRIORITÉ : Rouge (priority 1) en premier, Orange (priority 2) après
  issues.sort((a, b) => {
    // D'abord par priorité
    const priorityDiff = (a.priority || 99) - (b.priority || 99);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Ensuite par poids
    return (b.weight || 1) - (a.weight || 1);
  });
  
  // 4. Calculer le score
  let totalScore = 0;
  let criticalScore = 0;
  let warningScore = 0;
  
  issues.forEach(issue => {
    const weight = issue.weight || 1;
    totalScore += weight;
    
    if (issue.severity === '🔴') {
      criticalScore += weight;
    } else if (issue.severity === '🟡') {
      warningScore += weight;
    }
  });
  
  const result = {
    hasIssues: issues.length > 0,
    issues,
    summary: {
      status: severity === 'critical' ? '🔴' : (severity === 'warning' ? '🟡' : '✅'),
      message,
      topIssues: issues.slice(0, 3)
    },
    scores: {
      total: totalScore,
      critical: criticalScore,
      warning: warningScore,
      suggestion: 0
    }
  };
  
  logger.debug('🔍 ANALYSE_AVANCÉE: Résultat final:', result);
  return result;
}

/**
 * Affiche les insights basés sur l'analyse avancée (version liste claire)
 */
function displayAdvancedInsights(insightElement, analysisResult) {
  const { summary, issues, scores } = analysisResult;
  
  logger.debug('🔍 DEBUG: Problèmes détectés:', issues.length, issues.map(i => i.title));
  
  // Récupérer la liste des insights pour y ajouter plusieurs éléments
  const insightsList = document.getElementById('insights-list');
  if (!insightsList) {
    logger.error('Liste insights-list non trouvée');
    return;
  }
  
  // Vider la liste existante
  insightsList.innerHTML = '';
  
  // CAS SPÉCIAL : Aucun problème détecté = Structure parfaite !
  if (issues.length === 0) {
    logger.debug('🔍 DEBUG: Aucun problème détecté - Affichage du message de succès');
    
    const successItem = document.createElement('li');
    successItem.className = 'insight-item success';
    
    successItem.innerHTML = `
      <div class="insight-icon"><i class="fas fa-check-circle"></i></div>
      <div class="insight-content">
        <h4 class="insight-title">Structure de titres excellente !</h4>
        <p class="insight-description">La hiérarchie des titres est parfaitement optimisée pour le SEO. Votre page respecte les bonnes pratiques avec un H1 unique et une structure équilibrée.</p>
      </div>
    `;
    
    insightsList.appendChild(successItem);
    logger.debug('🔍 DEBUG: Message de succès ajouté au DOM');
    return;
  }
  
  // CAS NORMAL : Afficher chaque problème détecté
  issues.forEach((issue, index) => {
    logger.debugEmoji("🔍", "DEBUG: Ajout problème ${index + 1}:", issue.title);
    
    const iconClass = getSeverityIcon(issue.severity);
    const severityClass = getSeverityClass(issue.severity);
    
    // Générer un message clair et compréhensible
    let clearMessage = '';
    switch (issue.type) {
      case 'noH1':
        clearMessage = 'La page ne contient pas de balise titre H1. Chaque page devrait avoir un titre principal.';
        break;
      case 'multipleH1':
        clearMessage = `La page contient ${issue.message.match(/\d+/)?.[0] || 'plusieurs'} balises H1. Il est recommandé d'avoir une seule balise H1 par page.`;
        break;
      case 'emptyH1':
        clearMessage = 'Le titre H1 est vide. Ajouter un titre descriptif pour améliorer le SEO.';
        break;
      case 'imageOnlyH1':
        clearMessage = issue.message; // Le message est déjà détaillé
        break;
      case 'shortH1':
        clearMessage = issue.message; // Le message est déjà détaillé
        break;
      case 'orphanHeadings':
        const data = issue.data;
        clearMessage = `${data.childCount} titres H${data.childLevel} existent sans aucun titre H${data.parentLevel} parent. Cela crée une hiérarchie incorrecte pour le SEO.`;
        break;
      case 'excessiveRatio':
        const ratioData = issue.data;
        clearMessage = `${ratioData.childCount} H${ratioData.childLevel} pour seulement ${ratioData.parentCount} H${ratioData.parentLevel} (ratio ${ratioData.ratio.toFixed(1)}:1). Cette disproportion nuit gravement à la hiérarchie SEO.`;
        break;
      case 'highRatio':
        const highRatioData = issue.data;
        clearMessage = `${highRatioData.childCount} H${highRatioData.childLevel} pour ${highRatioData.parentCount} H${highRatioData.parentLevel} (ratio ${highRatioData.ratio.toFixed(1)}:1). Cette structure peut être optimisée.`;
        break;
      case 'globalImbalance':
        const globalData = issue.data;
        clearMessage = `${globalData.belowCount} H${globalData.belowLevel} pour seulement ${globalData.bottleneckCount} H${globalData.bottleneckLevel} (ratio ${globalData.ratio.toFixed(1)}:1)`;
        if (globalData.missingLevels && globalData.missingLevels.length > 0) {
          clearMessage += ` avec niveaux H${globalData.missingLevels.join(', H')} manquants`;
        }
        clearMessage += '. Cette disproportion révèle un problème structurel majeur dans l\'organisation des contenus.';
        break;
      case 'hierarchyValley':
        const valleyData = issue.data;
        clearMessage = `H${valleyData.valleyLevel} (${valleyData.valleyCount}) forme un goulot d'étranglement entre H${valleyData.prevLevel} (${valleyData.prevCount}) et H${valleyData.nextLevel} (${valleyData.nextCount}). Cette structure limite l'organisation logique du contenu.`;
        break;
      case 'hierarchyGap':
        const gapData = issue.data;
        clearMessage = `Saut de H${gapData.fromLevel} à H${gapData.toLevel} sans ${gapData.missingLevels.join(', ')} intermédiaire(s). Cela peut affecter la compréhension de la structure par les moteurs de recherche.`;
        break;
      default:
        clearMessage = issue.message;
    }
    
    // Créer l'élément li
    const listItem = document.createElement('li');
    listItem.className = `insight-item ${severityClass}`;
    
    // Créer la structure HTML
    listItem.innerHTML = `
      <div class="insight-icon"><i class="${iconClass}"></i></div>
      <div class="insight-content">
        <h4 class="insight-title">${issue.title}</h4>
        <p class="insight-description">${clearMessage}</p>
      </div>
    `;
    
    // Ajouter à la liste
    insightsList.appendChild(listItem);
    
    logger.debugEmoji("🔍", "DEBUG: Problème ${index + 1} ajouté au DOM");
  });
  
  logger.debug('🔍 DEBUG: Total éléments dans la liste:', insightsList.children.length);
}

/**
 * Obtient l'icône FontAwesome appropriée pour un niveau de sévérité
 */
function getSeverityIcon(severity) {
  switch (severity) {
    case '🔴':
      return 'fas fa-times-circle';
    case '🟡':
      return 'fas fa-exclamation-triangle';
    case '🟢':
      return 'fas fa-info-circle';
    case '✅':
      return 'fas fa-check-circle';
    default:
      return 'fas fa-question-circle';
  }
}

/**
 * Obtient la classe CSS appropriée pour un niveau de sévérité
 */
function getSeverityClass(severity) {
  switch (severity) {
    case '🔴':
      return 'error';
    case '🟡':
      return 'warning';
    case '🟢':
      return 'info';
    case '✅':
      return 'success';
    default:
      return '';
  }
}

// Fonction pour mettre en évidence les compteurs de titres
function highlightHeadingCounts(counts) {
  if (!counts) return;
  
  // Trouver le niveau de titre le plus utilisé
  let maxCount = 0;
  let maxLevel = 0;
  
  for (let level = 1; level <= 6; level++) {
    const count = counts[`h${level}`] || 0;
    if (count > maxCount) {
      maxCount = count;
      maxLevel = level;
    }
  }
  
  // Si aucun titre n'est présent, ne rien faire
  if (maxCount === 0) return;
  
  // Mettre en évidence le niveau de titre le plus utilisé
  const maxLevelElement = document.getElementById(`h${maxLevel}-count`);
  if (maxLevelElement) {
    const cardElement = maxLevelElement.parentElement.parentElement;
    if (cardElement) {
      // Ajouter une animation subtile pour attirer l'attention
      cardElement.style.transform = 'scale(1.05)';
      cardElement.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
      
      // Réinitialiser après un court délai
      setTimeout(() => {
        cardElement.style.transform = '';
        cardElement.style.boxShadow = '';
      }, 1000);
    }
  }
}

// Fonction pour afficher les problèmes détectés
function displayHeadingIssues(issues) {
  const issuesList = document.getElementById('issues-list');
  const noIssuesMessage = document.getElementById('no-issues-message');
  
  if (!issuesList || !noIssuesMessage) {
    logger.error('Headings: Éléments de problèmes non trouvés dans le DOM');
    return;
  }
  
  // Vider la liste
  issuesList.innerHTML = '';
  
  if (!issues || issues.length === 0) {
    // Afficher le message "aucun problème"
    noIssuesMessage.classList.remove('hidden');
    issuesList.classList.add('hidden');
    return;
  }
  
  // Cacher le message "aucun problème"
  noIssuesMessage.classList.add('hidden');
  issuesList.classList.remove('hidden');
  
  // Ajouter chaque problème à la liste
  issues.forEach(issue => {
    const item = document.createElement('li');
    item.className = 'issue-item';
    
    const content = document.createElement('div');
    content.className = 'issue-content';
    
    let issueTitle = 'Problème détecté';
    let issueDescription = issue.message || 'Un problème a été détecté dans la structure des titres.';
    
    // Personnaliser en fonction du type de problème
    if (issue.type === 'hierarchy_skip') {
      issueTitle = 'Hiérarchie non respectée';
    } else if (issue.type === 'multiple_h1') {
      issueTitle = 'Multiples H1 détectés';
    } else if (issue.type === 'missing_h1') {
      issueTitle = 'H1 manquant';
    }
    
    content.innerHTML = `<h4 class="issue-title">${issueTitle}</h4><p class="issue-description">${issueDescription}</p>`;
    
    item.appendChild(content);
    issuesList.appendChild(item);
  });
}

// NOUVELLE FONCTION : Détecter les niveaux de titres manquants dans la structure hiérarchique
function detectMissingHeadingsInStructure(headings) {
  logger.debug('%c[MISSING_DETECTION] Analyse des niveaux manquants', 'background: #f59e0b; color: white; padding: 2px 5px;', headings);
  
  if (!headings || headings.length === 0) {
    return [];
  }
  
  const result = [];
  let lastLevel = 0;
  
  headings.forEach(heading => {
    const currentLevel = heading.level;
    
    // Si on saute des niveaux (ex: H1 vers H3), ajouter les niveaux manquants
    if (currentLevel > lastLevel + 1) {
      for (let missingLevel = lastLevel + 1; missingLevel < currentLevel; missingLevel++) {
        result.push({
          level: missingLevel,
          text: `Niveau H${missingLevel} manquant`,
          missing: true
        });
        logger.debugEmoji("", "%c[MISSING_DETECTION] Niveau manquant détecté: H${missingLevel}", 'background: #f59e0b; color: white; padding: 2px 5px;');
      }
    }
    
    // Ajouter le heading actuel
    result.push(heading);
    lastLevel = currentLevel;
  });
  
  logger.debug('%c[MISSING_DETECTION] Structure avec niveaux manquants:', 'background: #f59e0b; color: white; padding: 2px 5px;', result);
  return result;
}

// Fonction pour afficher la structure des titres avec le design élégant
function displayHeadingStructure(headings) {
  logger.debug('Headings: Affichage de la structure des titres', headings);
  
  // Récupérer le conteneur de la liste
  const structureContainer = document.getElementById('headings-list');
  if (!structureContainer) {
    logger.error('Headings: Conteneur headings-list non trouvé');
    return;
  }
  
  // Vider le conteneur
  structureContainer.innerHTML = '';
  
  // Si aucun titre, afficher l'état vide
  if (!headings || headings.length === 0) {
    logger.debug('Headings: Aucun titre à afficher - état vide');
    
    // Utiliser l'état vide simple du CSS
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <i class="fas fa-list-ul"></i>
      <p>Aucun titre détecté sur cette page.</p>
    `;
    
    structureContainer.appendChild(emptyState);
    return;
  }
  
  // NOUVELLE LOGIQUE : Détecter les niveaux manquants avec notre fonction locale
  const enhancedHeadings = detectMissingHeadingsInStructure(headings);
  logger.debug('Headings: Structure hiérarchique analysée', enhancedHeadings);
  
  // Couleurs élégantes pour les indicateurs de niveau
  const headingColors = {
    1: '#7C3AED', // Violet élégant
    2: '#2563EB', // Bleu électrique
    3: '#DC2626', // Rouge vif
    4: '#EA580C', // Orange énergique
    5: '#CA8A04', // Jaune doré
    6: '#6B7280'  // Gris élégant
  };
  
  logger.debug('Headings: Ajout de', enhancedHeadings.length, 'titres avec le design élégant');
  
  // Ajouter chaque titre avec le design simple
  enhancedHeadings.forEach((heading, index) => {
    // Vérifier que le titre a les propriétés nécessaires
    if (!heading || typeof heading.level === 'undefined' || (!heading.text && !heading.missing)) {
      logger.error('Headings: Titre invalide:', heading);
      return;
    }
    
    try {
      // Créer l'élément simple pour le titre
      const item = document.createElement('div');
      item.className = 'heading-item';
      item.setAttribute('data-level', heading.level);
      
      // NOUVEAU : Si c'est un titre manquant, ajouter la classe et l'attribut
      if (heading.missing) {
        item.classList.add('missing-heading');
        item.setAttribute('data-missing', 'true');
      }
      
      // Créer l'indicateur de niveau simple
      const levelIndicator = document.createElement('div');
      levelIndicator.className = 'level-indicator';
      // COULEUR FIXE : Tous les level-indicators en bleu (sera surchargé par le CSS)
      levelIndicator.style.backgroundColor = '#3b82f6'; // Sera remplacé par le CSS
      levelIndicator.textContent = `H${heading.level}`;
      
      // Créer le conteneur de contenu
      const contentContainer = document.createElement('div');
      contentContainer.className = 'heading-content';
      
      // Créer le texte du titre
      const textElement = document.createElement('div');
      textElement.className = 'heading-text';
      
      // CORRECTION: Gérer les cas sans texte pour les titres manquants
      const headingText = heading.text ? heading.text.trim() : '';
      if (headingText) {
        textElement.textContent = headingText;
      } else if (heading.missing) {
        // Pour les titres manquants sans texte, ajouter une classe spéciale
        textElement.className += ' empty-missing';
        textElement.style.display = 'none'; // Masquer le texte vide
      } else {
        textElement.textContent = headingText;
      }
      
      // Ajouter le texte au conteneur
      contentContainer.appendChild(textElement);
      
      // Ajouter un indicateur pour les titres manquants
      if (heading.missing) {
        const missingIndicator = document.createElement('span');
        missingIndicator.className = 'missing-indicator';
        missingIndicator.textContent = 'Manquant';
        contentContainer.appendChild(missingIndicator);
        
        // Style spécial pour les titres manquants
        item.style.background = 'linear-gradient(135deg, #FFF7ED 0%, white 100%)';
        item.style.borderColor = '#F97316';
        textElement.style.fontStyle = 'italic';
        textElement.style.opacity = '0.7';
      }
      
      // Assembler la structure
      item.appendChild(levelIndicator);
      item.appendChild(contentContainer);
      
      // Ajouter au conteneur principal
      structureContainer.appendChild(item);
    } catch (error) {
      logger.error('Headings: Erreur lors de l\'ajout du titre', index, error);
    }
  });
  
  // Synchroniser les compteurs avec la structure affichée
  if (window.headingsInit && window.headingsInit.syncCountersWithStructure) {
    window.headingsInit.syncCountersWithStructure();
  }
}

// Fonction pour éviter les doublons d'indicateurs
function ensureUniqueIndicators(container) {
  const lengthIndicators = container.querySelectorAll('span[style*="background-color"]');
  if (lengthIndicators.length > 1) {
    for (let i = 1; i < lengthIndicators.length; i++) {
      lengthIndicators[i].remove();
    }
  }
}

// Fonctions utilitaires manquantes
function formatPixelLength(length) {
  return `${length}px`;
}

function getColorClassFromLength(length) {
  if (length < 30) return 'short';
  if (length < 60) return 'medium';
  return 'long';
}

function createLengthIndicator(length) {
  const indicator = document.createElement('span');
  indicator.className = 'length-indicator';
  indicator.textContent = `${length} caractères`;
  indicator.style.backgroundColor = length < 30 ? '#dc2626' : length < 60 ? '#ea580c' : '#16a34a';
  indicator.style.color = 'white';
  indicator.style.fontSize = '10px';
  indicator.style.padding = '2px 6px';
  indicator.style.borderRadius = '3px';
  indicator.style.marginLeft = '8px';
  return indicator;
}

// Exposer les fonctions utilitaires
window.headingsDisplay = {
  formatPixelLength,
  getColorClassFromLength,
  createLengthIndicator,
  ensureUniqueIndicators
};

// Exposer les fonctions globalement pour qu'elles soient accessibles depuis popup.js
window.processRawHeadingsData = processRawHeadingsData;
window.displayHeadingsResults = displayHeadingsResults;