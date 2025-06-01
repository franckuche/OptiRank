/**
 * OptiRank - Module de copie des titres (headings)
 * 
 * Ce fichier regroupe toutes les fonctionnalités liées à la copie des titres.
 * Il combine les fonctionnalités précédemment réparties dans plusieurs fichiers :
 * - copy-notifications.js
 * - copy-core.js
 * - copy-dropdown.js
 * - copy-main.js
 */

// Variables globales pour le dropdown
let copyDropdownOpen = false;

// Module principal utilisant un IIFE pour éviter la pollution du scope global
window.HeadingsCopy = (function() {
  'use strict';
  
  // Configuration et état
  const config = {
    debug: true,
    selectors: {
      structureList: '#headings-list', // Corrigé pour correspondre à l'ID réel dans popup.html
      headingItem: '.heading-item',
      levelIndicator: '.level-indicator',
      headingText: '.heading-text'
    }
  };
  
  // Système de notification
  const notifications = {
    /**
     * Affiche une notification de copie
     * @param {string} message - Message à afficher
     * @param {boolean} success - Si l'opération est un succès
     */
    showCopyNotification: function(message, success) {
      // Créer l'élément de notification s'il n'existe pas
      let notification = document.getElementById('copy-notification');
      if (!notification) {
        notification = document.createElement('div');
        notification.id = 'copy-notification';
        
        // Appliquer les styles
        Object.assign(notification.style, {
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          borderRadius: '4px',
          fontWeight: 'bold',
          zIndex: '10000',
          opacity: '0',
          transition: 'opacity 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        });
        
        document.body.appendChild(notification);
      }
      
      // Configurer le style en fonction du succès ou de l'échec
      if (success) {
        notification.style.backgroundColor = '#2ecc71';
        notification.style.color = 'white';
      } else {
        notification.style.backgroundColor = '#e74c3c';
        notification.style.color = 'white';
      }
      
      // Définir le message
      notification.textContent = message;
      
      // Afficher la notification
      notification.style.opacity = '1';
      
      // Masquer après un délai
      setTimeout(() => {
        notification.style.opacity = '0';
      }, 3000);
    }
  };
  
  /**
   * Détermine le statut de longueur d'un titre
   * @param {Object} heading - Le titre à analyser
   * @return {string} Le statut de longueur
   */
  function getPixelStatus(heading) {
    if (!heading.pixelWidth) return 'Non mesuré';
    
    // Récupérer les seuils pour ce niveau de titre
    const thresholds = window.headingsConfig?.pixel?.thresholds?.[`h${heading.level}`];
    if (!thresholds) return 'Seuils non définis';
    
    const width = heading.pixelWidth;
    if (width < thresholds.min) {
      return 'Trop court';
    } else if (width > thresholds.max) {
      return 'Trop long';
    } else {
      return 'Optimal';
    }
  }
  
  /**
   * Gère le menu déroulant de copie
   */
  function setupDropdown() {
    // Gérer l'ouverture/fermeture du menu déroulant
    document.addEventListener('click', function(event) {
      const dropdownButton = document.getElementById('copy-structure-dropdown');
      const dropdownMenu = document.querySelector('.copy-dropdown-menu');
      
      if (!dropdownButton || !dropdownMenu) return;
      
      // Ouvrir le menu au clic sur le bouton
      if (event.target === dropdownButton || dropdownButton.contains(event.target)) {
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        event.stopPropagation();
      } 
      // Fermer le menu au clic en dehors
      else if (dropdownMenu.style.display === 'block' && !dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = 'none';
      }
    });
  }
  
  /**
   * Crée une option pour le menu déroulant
   * @param {string} html - Le contenu HTML de l'option
   * @param {Function} clickHandler - La fonction à exécuter au clic
   * @return {HTMLElement} L'élément option créé
   */
  function createDropdownOption(html, clickHandler) {
    const option = document.createElement('div');
    option.className = 'copy-option';
    option.style.padding = '8px 16px';
    option.style.cursor = 'pointer';
    option.style.transition = 'background-color 0.2s';
    option.innerHTML = html;
    
    option.addEventListener('mouseover', () => {
      option.style.backgroundColor = '#f5f5f5';
    });
    
    option.addEventListener('mouseout', () => {
      option.style.backgroundColor = 'transparent';
    });
    
    option.addEventListener('click', () => {
      clickHandler();
      option.closest('.copy-dropdown-menu').style.display = 'none';
    });
    
    return option;
  }
  
  // Nous utilisons maintenant le bouton existant dans le HTML avec la fonction setupCopyButton
  
  /**
   * Copie les titres dans le presse-papier
   * @param {boolean} includeAnalysis - Inclure les analyses ou non
   */
  function copyHeadings(includeAnalysis) {
    console.log('%c[COPY] Début de la copie des titres', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
    console.log(`%c[COPY] Mode: ${includeAnalysis ? 'Avec analyses' : 'Titres seulement'}`, 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // Vérifier d'abord si des titres sont affichés dans la structure
    const structureList = document.querySelector(config.selectors.structureList);
    
    if (!structureList) {
      console.error('%c[COPY] ERREUR: Élément headings-structure-list non trouvé dans le DOM', 'background: red; color: white; padding: 2px 5px; border-radius: 3px;');
      notifications.showCopyNotification('Impossible de trouver la liste des titres', false);
      return;
    }
    
    // Récupérer tous les éléments de titre
    const allHeadingItems = structureList.querySelectorAll(config.selectors.headingItem);
    console.log(`%c[COPY] Nombre total d'éléments de titre trouvés: ${allHeadingItems.length}`, 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // Filtrer pour ne garder que les titres réels de la page (non ajoutés par l'extension)
    console.log('%c[COPY] Début du filtrage des titres', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
    
    const headingItems = Array.from(allHeadingItems).filter(item => {
      const textElement = item.querySelector(config.selectors.headingText);
      const headingText = textElement ? textElement.textContent.trim() : '';
      const badge = item.querySelector(config.selectors.levelIndicator);
      const levelText = badge ? badge.textContent : 'H?';
      
      // Log de débogage pour chaque titre
      console.log(`%c[COPY] Examen du titre: "${headingText}" (${levelText})`, 'color: #3498db;');
      
      // 1. Exclure TOUS les titres marqués comme manquants ou avec des classes spéciales
      if (item.classList.contains('missing-heading')) {
        console.log('%c[COPY] Exclu: titre marqué comme manquant', 'color: #e74c3c;');
        return false;
      }
      
      // 2. Filtrage plus strict pour le mode "Headings présents seulement"
      if (!includeAnalysis) {
        // a. Exclure EXPLICITEMENT le titre "H2: Titre H2 manquant"
        if (headingText === 'H2: Titre H2 manquant' || headingText === 'Titre H2 manquant') {
          console.log('%c[COPY] Exclu: titre explicitement filtré "H2: Titre H2 manquant"', 'color: #e74c3c;');
          return false;
        }
        
        // b. Exclure tous les titres contenant "manquant" ou "Titre" 
        if (headingText.toLowerCase().includes('manquant') || 
            (headingText.includes('Titre') && headingText.includes('H'))) {
          console.log('%c[COPY] Exclu: contient "manquant" ou "Titre"', 'color: #e74c3c;');
          return false;
        }
        
        // c. Exclure tous les titres avec des classes ou attributs d'analyse
        if (item.classList.contains('analysis-heading') || 
            item.dataset.isAnalysisHeading === 'true' || 
            item.dataset.analysisHeading === 'true' ||
            item.hasAttribute('data-missing')) {
          console.log('%c[COPY] Exclu: marqué comme titre d\'analyse', 'color: #e74c3c;');
          return false;
        }
        
        // d. Exclure si le texte commence par le niveau + ":" (format typique des titres générés)
        const levelMatch = new RegExp(`^H${levelText.replace('H', '')}\\s*:`); 
        if (levelMatch.test(headingText)) {
          console.log('%c[COPY] Exclu: format de titre généré', 'color: #e74c3c;');
          return false;
        }
      }
      
      console.log('%c[COPY] Titre accepté pour copie', 'color: #2ecc71;');
      return true;
    });
    
    console.log(`%c[COPY] Après filtrage - Titres à copier: ${headingItems.length}`, 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // Si nous avons des titres dans la structure, les utiliser
    if (headingItems && headingItems.length > 0) {
      // Préparer le texte à copier
      let textToCopy = '';
      
      // Ajouter un en-tête avec le titre de la page
      const pageTitle = document.title || 'OptiRank - Analyse des titres';
      textToCopy += `# ${pageTitle}\n\n`;
      
      // Parcourir tous les titres filtrés
      headingItems.forEach((item) => {
        try {
          // Récupérer le niveau du titre
          const badge = item.querySelector(config.selectors.levelIndicator);
          const levelText = badge ? badge.textContent : 'H1';
          const level = parseInt(levelText.replace('H', '')) || 1;
          
          // Récupérer le texte du titre (sans le niveau)
          const textElement = item.querySelector(config.selectors.headingText);
          let headingText = textElement ? textElement.textContent.trim() : '(Sans texte)';
          
          // Nettoyer le texte du titre - on ne garde que le contenu réel
          // Enlever le préfixe "Hx: " s'il existe
          if (headingText.startsWith(`H${level}:`)) {
            headingText = headingText.substring(headingText.indexOf(':') + 1).trim();
          }
          
          // Indentation en fonction du niveau
          const indent = '  '.repeat(level - 1);
          
          // Ajouter le titre avec son niveau
          textToCopy += `${indent}H${level}: ${headingText}\n`;
          
          // Ajouter les analyses si demandé
          if (includeAnalysis) {
            // Vérifier si l'élément a des données d'analyse
            const hasPixelWidth = item.dataset.pixelWidth;
            const hasHierarchyIssue = item.dataset.hierarchyIssue;
            
            if (hasPixelWidth) {
              const pixelWidth = parseFloat(item.dataset.pixelWidth);
              const status = pixelWidth ? getPixelStatus({ level, pixelWidth }) : 'Non mesuré';
              textToCopy += `${indent}  - Longueur: ${Math.round(pixelWidth)}px (${status})\n`;
            }
            
            if (hasHierarchyIssue) {
              textToCopy += `${indent}  - Problème: ${item.dataset.hierarchyIssue}\n`;
            }
            
            // Ajouter une ligne vide après chaque titre avec analyse
            textToCopy += '\n';
          }
        } catch (err) {
          console.error('%c[COPY] Erreur lors du traitement d\'un titre:', 'background: red; color: white; padding: 2px 5px; border-radius: 3px;', err);
        }
      });
      
      console.log('%c[COPY] Tentative de copie du texte dans le presse-papier', 'background: #f39c12; color: white;');
      console.log('%c[COPY] Contenu à copier:', 'background: #f39c12; color: white;', textToCopy);
      
      // Vérifier si nous avons un contenu à copier
      if (!textToCopy || textToCopy.trim() === '') {
        console.error('%c[COPY] Erreur: Aucun contenu à copier!', 'background: red; color: white;');
        // Utiliser notifications directement
        notifications.showCopyNotification('Aucun contenu à copier', false);
        return;
      }
      
      // Copier dans le presse-papier avec gestion d'erreur améliorée
      try {
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            console.log('%c[COPY] Titres copiés avec succès', 'background: #2ecc71; color: white;');
            // Utiliser notifications directement
            notifications.showCopyNotification('Titres copiés avec succès', true);
          })
          .catch(err => {
            console.error('%c[COPY] Erreur lors de la copie:', 'background: red; color: white;', err);
            // Essayer une méthode alternative de copie
            fallbackCopy(textToCopy);
          });
      } catch (err) {
        console.error('%c[COPY] Exception lors de la tentative de copie:', 'background: red; color: white;', err);
        // Essayer une méthode alternative de copie
        fallbackCopy(textToCopy);
      }
    } else {
      console.warn('%c[COPY] Aucun titre trouvé pour la copie', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
      // Utiliser notifications directement
      notifications.showCopyNotification('Aucun titre trouvé pour la copie', false);
    }
  }
  
  /**
   * Méthode alternative de copie si l'API Clipboard ne fonctionne pas
   * @param {string} text - Texte à copier
   */
  function fallbackCopy(text) {
    console.log('%c[COPY] Tentative de méthode alternative de copie', 'background: #f39c12; color: white;');
    
    try {
      // Créer un élément textarea temporaire
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // S'assurer que l'élément est hors écran
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Essayer la commande de copie
      const successful = document.execCommand('copy');
      
      // Nettoyer
      document.body.removeChild(textArea);
      
      // Afficher le résultat
      if (successful) {
        console.log('%c[COPY] Copie alternative réussie', 'background: #2ecc71; color: white;');
        notifications.showCopyNotification('Titres copiés avec succès', true);
      } else {
        console.error('%c[COPY] Échec de la copie alternative', 'background: red; color: white;');
        notifications.showCopyNotification('Erreur lors de la copie', false);
      }
    } catch (err) {
      console.error('%c[COPY] Exception lors de la méthode alternative de copie:', 'background: red; color: white;', err);
      alert('Impossible de copier le texte : ' + err.message);
    }
  }
  
  // Pas de code de nettoyage nécessaire, nous utilisons le bouton existant dans le HTML
  
  /**
   * Configure le bouton de copie en remplaçant l'original par un nouveau bouton
   */
  function setupCopyButton() {
    console.log('%c[COPY] Configuration du bouton de copie', 'background: #2ecc71; color: white; padding: 2px 5px;');
    
    // 1. Trouver le bouton original et son parent
    const originalButton = document.getElementById('copy-structure');
    if (!originalButton) {
      console.warn('%c[COPY] Bouton original non trouvé', 'background: #e74c3c; color: white;');
      return;
    }
    
    const parentContainer = originalButton.parentElement;
    if (!parentContainer) {
      console.warn('%c[COPY] Parent du bouton non trouvé', 'background: #e74c3c; color: white;');
      return;
    }
    
    // 2. Créer un conteneur pour le nouveau bouton et le menu
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'copy-button-container';
    Object.assign(buttonContainer.style, {
      position: 'relative',
      display: 'inline-block'
    });
    
    // 3. Créer le nouveau bouton de copie
    const newButton = document.createElement('button');
    newButton.id = 'copy-structure-new';
    newButton.className = originalButton.className; // Utiliser les mêmes classes
    Object.assign(newButton.style, {
      padding: '6px 12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px'
    });
    
    // 4. Ajouter l'icône et le texte au bouton
    const icon = document.createElement('i');
    icon.className = 'fas fa-copy';
    icon.style.marginRight = '8px'; // Plus d'espace entre l'icône et le texte
    
    newButton.appendChild(icon);
    newButton.appendChild(document.createTextNode('Copier'));
    
    // 5. Ajouter la flèche du dropdown
    const arrow = document.createElement('i');
    arrow.className = 'fas fa-caret-down';
    arrow.style.marginLeft = '8px'; // Plus d'espace avant la flèche
    newButton.appendChild(arrow);
    
    // 6. Créer le menu déroulant
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'copy-dropdown-menu';
    Object.assign(dropdownMenu.style, {
      position: 'absolute',
      top: 'calc(100% + 5px)',
      right: '0',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      zIndex: '1000',
      minWidth: '220px', // Plus large pour plus d'espace
      display: 'none'
    });
    
    // 7. Ajouter les options au menu avec plus d'espace
    const option1 = createDropdownOption(
      '<i class="fas fa-copy" style="margin-right: 10px;"></i> Headings présents seulement',
      () => copyHeadings(false)
    );
    option1.style.padding = '10px 15px'; // Plus de padding
    dropdownMenu.appendChild(option1);
    
    const option2 = createDropdownOption(
      '<i class="fas fa-clipboard-list" style="margin-right: 10px;"></i> Avec analyse',
      () => copyHeadings(true)
    );
    option2.style.padding = '10px 15px'; // Plus de padding
    dropdownMenu.appendChild(option2);
    
    // 8. Assembler le tout
    buttonContainer.appendChild(newButton);
    buttonContainer.appendChild(dropdownMenu);
    
    // 9. Remplacer le bouton original par notre nouveau conteneur
    parentContainer.replaceChild(buttonContainer, originalButton);
    
    // 10. Ajouter le gestionnaire d'événement pour afficher/masquer le menu
    newButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      const isVisible = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // 11. Fermer le menu au clic en dehors
    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
    });
    
    console.log('%c[COPY] Bouton de copie configuré avec succès', 'background: #2ecc71; color: white;');
  }
  
  /**
   * Initialise le module de copie
   */
  function init() {
    console.log('%c[COPY] Initialisation du module de copie des titres', 'background: #9b59b6; color: white; padding: 3px 5px;');
    
    // Configurer le bouton une fois que le DOM est chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupCopyButton);
    } else {
      setupCopyButton();
    }
    
    // Reconfigurer le bouton lorsqu'on clique sur l'onglet (au cas où le DOM change)
    document.addEventListener('click', event => {
      if (event.target.closest('.tab-link[data-tab="headings"]')) {
        console.log('%c[COPY] Onglet Headings activé, configuration du bouton', 'background: #9b59b6; color: white;');
        setTimeout(setupCopyButton, 300);
      }
    });
    
    // Exposer les fonctions publiques
    window.headingsCopy = {
      copyHeadings: copyHeadings
    };
    
    // Exposer les notifications pour permettre à d'autres modules de les utiliser
    window.headingsNotification = {
      showCopyNotification: notifications.showCopyNotification
    };
  }

  // Exposer explicitement le module au scope global pour compatibilité
  window.headingsNotification = {
    showCopyNotification: notifications.showCopyNotification
  };

  // Exposer cette fonction au scope global pour les scripts qui en dépendent
  window.copyHeadings = copyHeadings;

  // API publique
  return {
    init,
    copyHeadings,
    showCopyNotification: notifications.showCopyNotification
  };
})();

// Auto-initialisation du module
document.addEventListener('DOMContentLoaded', function() {
  if (window.copyHeadings) {
    console.log('Copy module: Auto-initialisation OK');
  }
});

// Fonction d'initialisation du module de copie
function initCopyModule() {
  console.log('OptiRank Copy: Initialisation du module de copie avec dropdown');
  
  // Éléments du dropdown
  const dropdownTrigger = document.getElementById('copy-dropdown-trigger');
  const dropdownMenu = document.getElementById('copy-dropdown-menu');
  const copyWithAnalysis = document.getElementById('copy-with-analysis');
  const copyWithoutAnalysis = document.getElementById('copy-without-analysis');
  
  if (!dropdownTrigger || !dropdownMenu) {
    console.warn('OptiRank Copy: Éléments dropdown non trouvés');
    return;
  }
  
  // Gestion du clic sur le trigger
  dropdownTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDropdown();
  });
  
  // Gestion des clics sur les options
  if (copyWithAnalysis) {
    copyWithAnalysis.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyHeadingsWithAnalysis();
      closeDropdown();
    });
  }
  
  if (copyWithoutAnalysis) {
    copyWithoutAnalysis.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyHeadingsWithoutAnalysis();
      closeDropdown();
    });
  }
  
  // Fermer le dropdown en cliquant ailleurs
  document.addEventListener('click', (e) => {
    if (copyDropdownOpen && !dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
      closeDropdown();
    }
  });
  
  // Fermer le dropdown avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && copyDropdownOpen) {
      closeDropdown();
    }
  });
  
  console.log('OptiRank Copy: Module de copie initialisé avec succès');
}

// Fonction pour ouvrir/fermer le dropdown
function toggleDropdown() {
  const dropdownTrigger = document.getElementById('copy-dropdown-trigger');
  const dropdownMenu = document.getElementById('copy-dropdown-menu');
  
  if (copyDropdownOpen) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

// Fonction pour ouvrir le dropdown
function openDropdown() {
  const dropdownTrigger = document.getElementById('copy-dropdown-trigger');
  const dropdownMenu = document.getElementById('copy-dropdown-menu');
  
  copyDropdownOpen = true;
  dropdownTrigger.classList.add('active');
  dropdownMenu.classList.add('active');
  
  console.log('OptiRank Copy: Dropdown ouvert');
}

// Fonction pour fermer le dropdown
function closeDropdown() {
  const dropdownTrigger = document.getElementById('copy-dropdown-trigger');
  const dropdownMenu = document.getElementById('copy-dropdown-menu');
  
  copyDropdownOpen = false;
  dropdownTrigger.classList.remove('active');
  dropdownMenu.classList.remove('active');
  
  console.log('OptiRank Copy: Dropdown fermé');
}

// Fonction pour copier avec analyse (comportement original)
function copyHeadingsWithAnalysis() {
  console.log('OptiRank Copy: Copie avec analyse demandée');
  
  try {
    // Utiliser les données stockées dans window.headingsResults si disponibles
    let headingsData = null;
    
    if (window.headingsResults) {
      headingsData = window.headingsResults;
      console.log('OptiRank Copy: Utilisation des données cached', headingsData);
    } else {
      console.warn('OptiRank Copy: Aucune donnée d\'analyse disponible');
      showCopyFeedback('Aucune donnée d\'analyse disponible', 'error');
      return;
    }
    
    // Générer le texte avec analyse
    const textWithAnalysis = generateTextWithAnalysis(headingsData);
    
    // Copier dans le presse-papiers
    copyToClipboard(textWithAnalysis, 'Structure copiée avec analyse');
    
  } catch (error) {
    console.error('OptiRank Copy: Erreur lors de la copie avec analyse', error);
    showCopyFeedback('Erreur lors de la copie', 'error');
  }
}

// Fonction pour copier sans analyse (structure simple)
function copyHeadingsWithoutAnalysis() {
  console.log('🔥 OptiRank Copy: Copie sans analyse demandée - DEBUG');
  
  try {
    // Utiliser les données stockées dans window.headingsResults si disponibles
    let headingsData = null;
    
    if (window.headingsResults) {
      headingsData = window.headingsResults;
      console.log('🔥 OptiRank Copy: Données trouvées:', headingsData);
      console.log('🔥 Nombre de headings dans les données:', headingsData.items?.length || 0);
    } else {
      console.warn('🔥 OptiRank Copy: Aucune donnée dans window.headingsResults');
      console.log('🔥 window.headingsResults:', window.headingsResults);
      console.log('🔥 window.OptiRankUtils:', window.OptiRankUtils);
      showCopyFeedback('Aucune donnée d\'analyse disponible', 'error');
      return;
    }
    
    // Générer le texte sans analyse
    console.log('🔥 Appel de generateTextWithoutAnalysis');
    const textWithoutAnalysis = generateTextWithoutAnalysis(headingsData);
    console.log('🔥 Texte généré:', textWithoutAnalysis);
    
    // Copier dans le presse-papiers
    copyToClipboard(textWithoutAnalysis, 'Structure copiée (simple)');
    
  } catch (error) {
    console.error('🔥 OptiRank Copy: Erreur lors de la copie sans analyse', error);
    showCopyFeedback('Erreur lors de la copie', 'error');
  }
}

// Fonction pour générer le texte avec analyse (format original)
function generateTextWithAnalysis(headingsData) {
  let text = '=== ANALYSE DES TITRES (HEADINGS) ===\n\n';
  
  // Compteurs
  if (headingsData.counts) {
    text += '📊 COMPTEURS PAR NIVEAU :\n';
    for (let i = 1; i <= 6; i++) {
      const count = headingsData.counts[`h${i}`] || 0;
      text += `  H${i}: ${count}\n`;
    }
    text += '\n';
  }
  
  // Structure des titres avec filtrage amélioré
  const headingsList = headingsData.items || headingsData.headings || [];
  if (headingsList.length > 0) {
    text += '🏗️ STRUCTURE DES TITRES :\n';
    
    // Filtrer les titres avec le même critère que generateTextWithoutAnalysis
    const filteredHeadings = headingsList.filter(heading => {
      const headingText = heading.text || heading.content || '';
      const cleanText = cleanHeadingText(headingText);
      
      // Exclure les titres vides après nettoyage
      if (!cleanText || cleanText.length === 0) {
        return false;
      }
      
      // Exclure tous les titres contenant "manquant" (même après nettoyage)
      if (cleanText.toLowerCase().includes('manquant')) {
        return false;
      }
      
      // Exclure les titres qui sont des patterns de titre manquant
      if (cleanText.match(/^(niveau\s+)?h[1-6](\s+manquant)?$/i)) {
        return false;
      }
      
      // Exclure si c'est un titre artificiel généré par l'extension
      if (cleanText.includes('Titre H') || cleanText.includes('Level H')) {
        return false;
      }
      
      return true;
    });
    
    filteredHeadings.forEach(heading => {
      const level = heading.level || heading.tag?.replace('h', '') || '?';
      const rawText = heading.text || heading.content || '[Titre vide]';
      const cleanText = cleanHeadingText(rawText);
      text += `  H${level}: ${cleanText}\n`;
    });
    text += '\n';
  }
  
  // Problèmes détectés
  if (headingsData.issues && headingsData.issues.length > 0) {
    text += '⚠️ PROBLÈMES DÉTECTÉS :\n';
    headingsData.issues.forEach(issue => {
      const severity = issue.severity || 'info';
      const message = issue.message || 'Problème non spécifié';
      text += `  [${severity.toUpperCase()}] ${message}\n`;
    });
  } else {
    text += '✅ AUCUN PROBLÈME DÉTECTÉ\n';
  }
  
  text += '\n--- Généré par OptiRank ---';
  
  return text;
}

// Fonction pour générer le texte sans analyse (format simple)
function generateTextWithoutAnalysis(headingsData) {
  console.log('🔥 DEBUG generateTextWithoutAnalysis: Début');
  const headingsList = headingsData.items || headingsData.headings || [];
  console.log('🔥 Liste des headings:', headingsList);
  
  if (headingsList.length === 0) {
    console.log('🔥 Aucun heading trouvé');
    return 'Aucun titre détecté sur cette page.';
  }
  
  let text = '';
  
  // Filtrage plus strict pour exclure tous les titres artificiels
  console.log('🔥 Début du filtrage...');
  const filteredHeadings = headingsList.filter(heading => {
    const headingText = heading.text || heading.content || '';
    const cleanText = cleanHeadingText(headingText);
    
    console.log(`🔥 Examen du heading: "${headingText}" -> "${cleanText}"`);
    
    // Exclure les titres vides après nettoyage
    if (!cleanText || cleanText.length === 0) {
      console.log('🔥 ❌ Exclu: titre vide');
      return false;
    }
    
    // Exclure tous les titres contenant "manquant" (même après nettoyage)
    if (cleanText.toLowerCase().includes('manquant')) {
      console.log('🔥 ❌ Exclu: contient "manquant"');
      return false;
    }
    
    // Exclure les titres qui sont des patterns de titre manquant
    if (cleanText.match(/^(niveau\s+)?h[1-6](\s+manquant)?$/i)) {
      console.log('🔥 ❌ Exclu: pattern de titre manquant');
      return false;
    }
    
    // Exclure si c'est un titre artificiel généré par l'extension
    if (cleanText.includes('Titre H') || cleanText.includes('Level H')) {
      console.log('🔥 ❌ Exclu: titre artificiel');
      return false;
    }
    
    console.log('🔥 ✅ Accepté');
    return true;
  });
  
  console.log(`🔥 Après filtrage: ${filteredHeadings.length} titres gardés sur ${headingsList.length}`);
  
  filteredHeadings.forEach(heading => {
    const level = heading.level || heading.tag?.replace('h', '') || '?';
    const rawText = heading.text || heading.content || '[Titre vide]';
    const cleanText = cleanHeadingText(rawText);
    console.log(`🔥 Ajout: H${level}: ${cleanText}`);
    text += `H${level}: ${cleanText}\n`;
  });
  
  console.log('🔥 Texte final généré:', text.trim());
  return text.trim();
}

/**
 * Fonction améliorée pour nettoyer le texte des titres
 * Supprime les espaces excessifs, sauts de ligne indésirables et caractères invisibles
 */
function cleanHeadingText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    // 1. Supprimer les caractères de contrôle et invisibles (sauf espaces et retours à la ligne)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // 2. Normaliser tous les types d'espaces Unicode en espaces simples
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    // 3. Remplacer TOUS les types de retours à la ligne et tabulations par des espaces
    .replace(/[\r\n\f\v\t]/g, ' ')
    // 4. Supprimer les séquences d'espaces très longues (souvent dues au HTML mal formaté)
    .replace(/\s{3,}/g, ' ')
    // 5. Remplacer les doubles espaces restants par un seul espace (appliqué plusieurs fois)
    .replace(/\s{2,}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    // 6. Supprimer les espaces en début et fin
    .trim()
    // 7. Nettoyage final : supprimer les espaces autour des signes de ponctuation
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])\s+/g, '$1 ')
    // 8. Supprimer tout espace résiduel excessif
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction utilitaire pour copier dans le presse-papiers
async function copyToClipboard(text, successMessage = 'Texte copié') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Utiliser l'API moderne
      await navigator.clipboard.writeText(text);
      console.log('OptiRank Copy: Texte copié avec navigator.clipboard');
    } else {
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('OptiRank Copy: Texte copié avec execCommand fallback');
    }
    
    showCopyFeedback(successMessage, 'success');
    
  } catch (error) {
    console.error('OptiRank Copy: Erreur lors de la copie dans le presse-papiers', error);
    showCopyFeedback('Erreur lors de la copie', 'error');
  }
}

// Fonction pour afficher un feedback visuel
function showCopyFeedback(message, type = 'success') {
  const dropdownTrigger = document.getElementById('copy-dropdown-trigger');
  
  if (!dropdownTrigger) return;
  
  // Créer ou réutiliser l'élément de feedback
  let feedback = document.getElementById('copy-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.id = 'copy-feedback';
    feedback.style.cssText = `
      position: absolute;
      top: -2.5rem;
      right: 0;
      background: ${type === 'success' ? '#10B981' : '#EF4444'};
      color: white;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
      z-index: 1001;
      opacity: 0;
      transform: translateY(4px);
      transition: all 0.3s ease;
    `;
    dropdownTrigger.parentElement.style.position = 'relative';
    dropdownTrigger.parentElement.appendChild(feedback);
  }
  
  // Mettre à jour le style selon le type
  feedback.style.background = type === 'success' ? '#10B981' : '#EF4444';
  feedback.textContent = message;
  
  // Animer l'apparition
  feedback.style.opacity = '1';
  feedback.style.transform = 'translateY(0)';
  
  // Supprimer après 2 secondes
  setTimeout(() => {
    if (feedback && feedback.parentElement) {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translateY(4px)';
      setTimeout(() => {
        if (feedback && feedback.parentElement) {
          feedback.parentElement.removeChild(feedback);
        }
      }, 300);
    }
  }, 2000);
}

// Export pour compatibilité
if (typeof window !== 'undefined') {
  window.optiRankCopy = {
    initCopyModule,
    copyHeadingsWithAnalysis,
    copyHeadingsWithoutAnalysis,
    toggleDropdown,
    openDropdown,
    closeDropdown
  };
}

// Auto-initialisation si le DOM est déjà chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCopyModule);
} else {
  initCopyModule();
}
