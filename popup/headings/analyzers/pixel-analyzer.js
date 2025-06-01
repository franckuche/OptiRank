/**
 * OptiRank - Module d'analyse des titres (headings) - Analyseur de pixels
 * Ce fichier contient les fonctions pour analyser la taille des titres en pixels
 */

// Référence aux configurations
let headingSizeThresholds = {};
let originalThresholds = {};
let pixelColors = {};
let pixelTexts = {};

// Initialiser les configurations
function initPixelAnalyzerConfig() {
  // Vérifier si la configuration est disponible
  if (window.headingsConfig && window.headingsConfig.pixel) {
    headingSizeThresholds = window.headingsConfig.pixel.thresholds;
    originalThresholds = JSON.parse(JSON.stringify(headingSizeThresholds));
    pixelColors = window.headingsConfig.pixel.colors;
  } else {
    console.warn('Headings: Configuration de l\'analyseur de pixels non disponible, utilisation des valeurs par défaut');
    
    // Valeurs par défaut
    headingSizeThresholds = {
      h1: { min: 300, optimal: 450, max: 600 },
      h2: { min: 250, optimal: 400, max: 550 },
      h3: { min: 200, optimal: 350, max: 500 },
      h4: { min: 150, optimal: 300, max: 450 },
      h5: { min: 100, optimal: 250, max: 400 },
      h6: { min: 100, optimal: 200, max: 350 }
    };
    originalThresholds = JSON.parse(JSON.stringify(headingSizeThresholds));
    pixelColors = {
      tooShort: '#FFA500', // Orange
      optimal: '#8CE071',  // Vert
      tooLong: '#FF5A5F',  // Rouge
      unknown: '#767676'   // Gris
    };
  }
  
  // Textes pour les statuts
  if (window.headingsConfig && window.headingsConfig.text) {
    pixelTexts = window.headingsConfig.text.statuses;
  } else {
    pixelTexts = {
      tooShort: 'Titre trop court',
      optimal: 'Longueur optimale',
      tooLong: 'Titre trop long',
      unknown: 'Type de titre non reconnu'
    };
  }
}

/**
 * Mesure la largeur en pixels d'un élément heading
 * @param {HTMLElement} headingElement - L'élément heading à mesurer
 * @return {number} La largeur en pixels
 */
function measureHeadingWidth(headingElement) {
  // Créer un clone hors écran pour la mesure
  const clone = headingElement.cloneNode(true);
  
  // Appliquer le même style mais rendre invisible
  clone.style.position = 'absolute';
  clone.style.visibility = 'hidden';
  clone.style.whiteSpace = 'nowrap'; // Empêcher le retour à la ligne
  document.body.appendChild(clone);
  
  // Mesurer la largeur
  const width = clone.getBoundingClientRect().width;
  
  // Nettoyer
  document.body.removeChild(clone);
  
  return width;
}

/**
 * Récupère tous les styles calculés qui affectent la largeur
 * @param {HTMLElement} headingElement - L'élément heading
 * @return {Object} Les styles calculés
 */
function getComputedHeadingStyle(headingElement) {
  const computedStyle = window.getComputedStyle(headingElement);
  return {
    fontFamily: computedStyle.fontFamily,
    fontSize: computedStyle.fontSize,
    fontWeight: computedStyle.fontWeight,
    letterSpacing: computedStyle.letterSpacing,
    textTransform: computedStyle.textTransform
  };
}

/**
 * Évalue la taille d'un heading et retourne son statut
 * @param {HTMLElement} headingElement - L'élément heading à évaluer
 * @return {Object} Le résultat de l'évaluation
 */
function evaluateHeadingSize(headingElement) {
  // S'assurer que la configuration est initialisée
  if (Object.keys(headingSizeThresholds).length === 0) {
    initPixelAnalyzerConfig();
  }
  
  const tagName = headingElement.tagName.toLowerCase();
  const width = measureHeadingWidth(headingElement);
  
  // Valeurs par défaut pour les seuils
  const defaultThresholds = {
    min: 200,
    optimal: 350,
    max: 500
  };
  
  // Récupérer les seuils pour ce type de titre ou utiliser les valeurs par défaut
  const thresholds = headingSizeThresholds[tagName] || defaultThresholds;
  
  // Vérifier que les valeurs sont des nombres valides
  const min = isNaN(thresholds.min) ? defaultThresholds.min : thresholds.min;
  const optimal = isNaN(thresholds.optimal) ? defaultThresholds.optimal : thresholds.optimal;
  const max = isNaN(thresholds.max) ? defaultThresholds.max : thresholds.max;
  
  if (!thresholds) {
    return {
      status: 'unknown',
      message: pixelTexts.unknown || 'Type de titre non reconnu',
      color: pixelColors.unknown || '#767676',
      width: width,
      min: min,
      max: max,
      optimal: optimal
    };
  }
  
  if (width < min) {
    return {
      status: 'too-short',
      message: pixelTexts.tooShort || 'Titre trop court',
      color: pixelColors.tooShort || '#FFA500',
      width: width,
      min: min,
      max: max,
      optimal: optimal
    };
  } else if (width > max) {
    return {
      status: 'too-long',
      message: pixelTexts.tooLong || 'Titre trop long',
      color: pixelColors.tooLong || '#FF5A5F',
      width: width,
      min: min,
      max: max,
      optimal: optimal
    };
  } else {
    return {
      status: 'optimal',
      message: pixelTexts.optimal || 'Longueur optimale',
      color: pixelColors.optimal || '#8CE071',
      width: width,
      min: min,
      max: max,
      optimal: optimal
    };
  }
}

/**
 * Ajuste les seuils en fonction de la taille d'écran
 */
function adjustThresholdsForViewport() {
  const viewportWidth = window.innerWidth;
  const scaleFactor = viewportWidth / 1920; // Base sur un écran de référence
  
  // Ajuster les seuils en fonction de la taille d'écran
  Object.keys(headingSizeThresholds).forEach(tag => {
    const original = originalThresholds[tag];
    headingSizeThresholds[tag] = {
      min: Math.round(original.min * scaleFactor),
      optimal: Math.round(original.optimal * scaleFactor),
      max: Math.round(original.max * scaleFactor)
    };
  });
}

/**
 * Crée un indicateur visuel simple et compact de la taille du heading
 * @param {Object} evaluation - Le résultat de l'évaluation
 * @return {HTMLElement} L'élément indicateur
 */
function createSizeIndicator(evaluation) {
  // Créer un indicateur très simple - juste un tiret coloré
  const indicator = document.createElement('span');
  
  // Définir la couleur selon le statut
  let bgColor = '#767676'; // Gris par défaut
  let statusText = '-';
  
  if (evaluation.status === 'optimal') {
    bgColor = '#8CE071'; // Vert
  } else if (evaluation.status === 'too-short') {
    bgColor = '#FFA500'; // Orange
  } else if (evaluation.status === 'too-long') {
    bgColor = '#FF5A5F'; // Rouge
  }
  
  // Appliquer les styles directement pour garantir l'affichage
  indicator.style.backgroundColor = bgColor;
  indicator.style.color = 'white';
  indicator.style.padding = '2px 8px';
  indicator.style.borderRadius = '4px';
  indicator.style.fontSize = '11px';
  indicator.style.fontWeight = '700';
  indicator.style.marginLeft = '8px';
  indicator.style.display = 'inline-block';
  indicator.style.position = 'relative';
  indicator.style.cursor = 'help';
  indicator.style.lineHeight = '1';
  
  // Ajouter le tiret comme texte (simple indicateur visuel)
  indicator.textContent = statusText;
  
  // Arrondir les valeurs pour l'affichage
  const roundedWidth = Math.round(evaluation.width);
  const roundedMin = Math.round(evaluation.min);
  const roundedMax = Math.round(evaluation.max);
  
  // Créer une infobulle très simple avec styles inline
  const tooltip = document.createElement('div');
  tooltip.className = 'heading-length-tooltip';
  
  // Styles de base pour l'infobulle
  Object.assign(tooltip.style, {
    position: 'fixed', // Utiliser fixed au lieu de absolute pour éviter les problèmes de débordement
    display: 'none',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: '10px',
    width: '180px',
    zIndex: '9999', // Z-index très élevé pour s'assurer qu'il est au-dessus de tout
    fontSize: '12px',
    color: '#484848',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    textAlign: 'left'
  });
  
  // Texte de statut selon l'évaluation
  let statusMessage = '';
  if (evaluation.status === 'optimal') {
    statusMessage = 'Longueur optimale';
  } else if (evaluation.status === 'too-short') {
    statusMessage = 'Titre trop court';
  } else if (evaluation.status === 'too-long') {
    statusMessage = 'Titre trop long';
  }
  
  // Contenu de l'infobulle
  tooltip.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${statusMessage}</div>
    <div style="margin-bottom: 4px;">Longueur actuelle: <b>${roundedWidth}px</b></div>
    <div style="margin-bottom: 4px;">Longueur recommandée: <b>${roundedMin}-${roundedMax}px</b></div>
  `;
  
  // Ajouter l'infobulle à l'indicateur
  indicator.appendChild(tooltip);
  
  // Ajouter les événements pour afficher/masquer l'infobulle avec positionnement intelligent
  indicator.addEventListener('mouseenter', (event) => {
    // Calculer la position optimale pour l'infobulle
    const rect = indicator.getBoundingClientRect();
    const popupWidth = 180; // Largeur de l'infobulle
    
    // Vérifier si l'infobulle dépasserait à droite
    const rightEdge = window.innerWidth;
    const leftPosition = Math.min(rect.left, rightEdge - popupWidth - 10);
    
    // Positionner l'infobulle en fonction de l'espace disponible
    tooltip.style.left = `${leftPosition}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
    tooltip.style.display = 'block';
  });
  
  indicator.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
  
  return indicator;
}

/**
 * Calcule la position du marqueur sur la jauge
 * @param {Object} evaluation - Le résultat de l'évaluation
 * @return {number} La position en pourcentage (0-100)
 */
function calculateMarkerPosition(evaluation) {
  const { width, min, max } = evaluation;
  
  if (width < min) {
    return 0;
  } else if (width > max) {
    return 100;
  } else {
    return ((width - min) / (max - min)) * 100;
  }
}

/**
 * Analyse et ajoute des indicateurs de taille à tous les headings
 * @param {NodeList} headingElements - Liste des éléments heading
 */
function analyzeHeadingSizes(headingElements) {
  // Ajuster les seuils pour la taille d'écran actuelle
  adjustThresholdsForViewport();
  
  headingElements.forEach(heading => {
    const evaluation = evaluateHeadingSize(heading);
    
    // Supprimer tous les anciens indicateurs possibles
    const oldIndicators = heading.querySelectorAll('.heading-length-indicator, .heading-length-container, .heading-size-indicator');
    oldIndicators.forEach(indicator => indicator.remove());
    
    // Récupérer le conteneur du contenu du titre ou la zone de texte
    const contentContainer = heading.querySelector('.heading-content') || heading.querySelector('.heading-text');
    
    // Créer l'indicateur simplifié
    const indicator = createSizeIndicator(evaluation);
    
    // Ajouter l'indicateur au bon endroit
    if (contentContainer) {
      // Si on a un conteneur spécifique, on l'ajoute après le texte
      contentContainer.appendChild(indicator);
    } else {
      // Sinon on l'ajoute directement au titre
      heading.appendChild(indicator);
    }
  });
}

// Exposer les fonctions publiques
window.headingPixelAnalyzer = {
  analyzeHeadingSizes,
  evaluateHeadingSize,
  measureHeadingWidth,
  adjustThresholdsForViewport
};

// Ajuster les seuils lors du redimensionnement de la fenêtre
window.addEventListener('resize', adjustThresholdsForViewport);
