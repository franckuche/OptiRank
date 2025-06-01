/**
 * OptiRank - Module d'analyse des titres (headings) - Analyseur de structure
 * Ce fichier contient les fonctions pour analyser la structure hiérarchique des titres
 */

// Référence aux configurations
let headingColors = {};
let missingHeadingColor = '';
let structureTexts = {};

// Initialiser les configurations
function initStructureAnalyzerConfig() {
  // Vérifier si la configuration est disponible
  if (window.headingsConfig && window.headingsConfig.structure) {
    headingColors = window.headingsConfig.structure.headingColors;
    missingHeadingColor = window.headingsConfig.structure.missingHeadingColor;
  } else {
    console.warn('Headings: Configuration de l\'analyseur de structure non disponible, utilisation des valeurs par défaut');
    
    // Valeurs par défaut
    headingColors = {
      1: '#FF5A5F', // Rouge - Primary
      2: '#00A699', // Turquoise - Secondary
      3: '#FC642D', // Orange - Accent
      4: '#007A87', // Bleu foncé
      5: '#8CE071', // Vert
      6: '#7B0051'  // Violet
    };
    missingHeadingColor = '#FFA500'; // Orange
  }
  
  // Textes pour les messages de structure
  if (window.headingsConfig && window.headingsConfig.text) {
    structureTexts = window.headingsConfig.text.hierarchy;
  } else {
    structureTexts = {
      missingHeading: 'Titre H{level} manquant',
      hierarchyIssue: 'Problème de hiérarchie',
      missingLevels: 'Il manque {count} niveau(x) intermédiaire(s)',
      jumpMessage: 'Saut de H{from} à H{to}'
    };
  }
}

/**
 * Détecte les titres manquants dans la hiérarchie
 * @param {Array} headings - Liste des titres
 * @return {Array} Liste des titres avec les titres manquants ajoutés
 */
function detectMissingHeadings(headings) {
  // SIMPLIFICATION : Retourner directement les headings sans ajouter de manquants
  // Car selon le cahier des charges, on ne veut plus afficher les titres manquants
  return headings || [];
}

/**
 * Applique l'analyse de structure aux éléments de titre dans le DOM
 * @param {NodeList} headingElements - Liste des éléments de titre dans le DOM
 */
function analyzeHeadingStructure(headingElements) {
  // S'assurer que la configuration est initialisée
  if (Object.keys(headingColors).length === 0) {
    initStructureAnalyzerConfig();
  }
  
  if (!headingElements || headingElements.length === 0) return;
  
  // D'abord supprimer tous les marqueurs existants pour éviter les doublons
  const existingAlerts = document.querySelectorAll('.hierarchy-alert-badge');
  existingAlerts.forEach(alert => alert.remove());
  
  // Récupérer les niveaux de titre
  const levels = Array.from(headingElements).map(el => {
    return parseInt(el.getAttribute('data-level') || '1');
  });
  
  // Vérifier les sauts dans la hiérarchie
  for (let i = 1; i < levels.length; i++) {
    const current = levels[i];
    const previous = levels[i-1];
    
    if (current > previous + 1) {
      // Marquer l'élément comme ayant un problème hiérarchique
      headingElements[i].classList.add('hierarchy-issue');
      
      // Vérifier si l'élément a déjà un badge d'alerte
      const existingAlert = headingElements[i].querySelector('.hierarchy-alert-badge');
      if (existingAlert) {
        continue; // Éviter de créer un doublon
      }
      
      // Préparer les messages avec les textes configurés
      const missingCount = current - previous - 1;
      
      // Créer un badge d'alerte simple et visible
      const hierarchyAlert = document.createElement('span');
      hierarchyAlert.className = 'hierarchy-alert-badge';
      hierarchyAlert.style.backgroundColor = missingHeadingColor || '#FFA500';
      hierarchyAlert.style.color = 'white';
      hierarchyAlert.style.padding = '2px 6px';
      hierarchyAlert.style.borderRadius = '4px';
      hierarchyAlert.style.fontSize = '11px';
      hierarchyAlert.style.fontWeight = '500';
      hierarchyAlert.style.marginLeft = '8px';
      hierarchyAlert.style.display = 'inline-flex';
      hierarchyAlert.style.alignItems = 'center';
      hierarchyAlert.style.cursor = 'help';
      
      // Créer un contenu clair avec icône + texte
      hierarchyAlert.innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-right: 4px;"></i> Saut H${previous}→H${current}`;
      
      // Créer l'infobulle avec des informations détaillées
      const tooltip = document.createElement('div');
      tooltip.className = 'hierarchy-tooltip';
      tooltip.style.position = 'fixed'; // Utiliser fixed au lieu de absolute
      tooltip.style.display = 'none';
      tooltip.style.backgroundColor = 'white';
      tooltip.style.borderRadius = '6px';
      tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      tooltip.style.padding = '10px';
      tooltip.style.width = '200px';
      tooltip.style.zIndex = '9999'; // Z-index très élevé
      tooltip.style.fontSize = '12px';
      tooltip.style.color = '#484848';
      tooltip.style.border = '1px solid rgba(0, 0, 0, 0.05)';
      
      tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">Problème de hiérarchie</div>
        <div style="margin-bottom: 4px;">Saut de H${previous} à H${current}</div>
        <div style="margin-bottom: 4px;">Il manque ${missingCount} niveau(x) intermédiaire(s)</div>
      `;
      
      // Ajouter l'infobulle au badge
      hierarchyAlert.appendChild(tooltip);
      
      // Afficher/masquer l'infobulle au survol avec positionnement intelligent
      hierarchyAlert.addEventListener('mouseenter', (event) => {
        // Calculer la position optimale pour l'infobulle
        const rect = hierarchyAlert.getBoundingClientRect();
        const popupWidth = 200; // Largeur de l'infobulle
        
        // Vérifier si l'infobulle dépasserait à droite
        const rightEdge = window.innerWidth;
        const leftPosition = Math.min(rect.left, rightEdge - popupWidth - 10);
        
        // Positionner l'infobulle en fonction de l'espace disponible
        tooltip.style.left = `${leftPosition}px`;
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.style.display = 'block';
      });
      
      hierarchyAlert.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
      
      // Ajouter le badge d'alerte à l'élément
      const contentElement = headingElements[i].querySelector('.heading-content');
      if (contentElement) {
        contentElement.appendChild(hierarchyAlert);
      }
    }
  }
}

// Exposer les fonctions publiques
window.headingStructureAnalyzer = {
  detectMissingHeadings,
  analyzeHeadingStructure
};
