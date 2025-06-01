// OptiRank - Nouvelle interface utilisateur
// Variable globale pour suivre le filtre actif
let currentActiveFilter = null;

// Fonction pour réinitialiser le filtre actif des cases statistiques
function resetActiveStatFilter() {
  // Supprimer la classe active de toutes les cases statistiques
  const allStatCards = document.querySelectorAll('.stat-card');
  allStatCards.forEach(card => card.classList.remove('active-filter'));
  
  // Réinitialiser la variable globale
  currentActiveFilter = null;
}

document.addEventListener('DOMContentLoaded', function() {
  // Afficher le message d'analyse automatique
  const autoAnalysisMessage = document.getElementById('auto-analysis-message');
  if (autoAnalysisMessage) {
    autoAnalysisMessage.classList.add('visible');
  }
  
  // Récupérer les résultats existants sans déclencher de nouvelle analyse
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || tabs.length === 0) return;
    
    try {
      // Demander les résultats existants au content script
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getExistingResults' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Popup: Erreur lors de la récupération des résultats existants:', chrome.runtime.lastError);
          // Si on ne peut pas récupérer les résultats, masquer le message car il n'y a probablement pas d'analyse en cours
          toggleAutoAnalysisMessage(false);
        } else if (response && response.results) {
          // Si des résultats existent déjà, masquer immédiatement le message et traiter les résultats
          toggleAutoAnalysisMessage(false);
          processResults(response.results);
        } else {
          // Si pas de résultats et pas d'erreur, vérifier si une analyse est en cours
          chrome.tabs.sendMessage(tabs[0].id, { action: 'isAnalysisInProgress' }, function(progressResponse) {
            if (chrome.runtime.lastError || !progressResponse || !progressResponse.inProgress) {
              // Aucune analyse en cours, masquer le message
              toggleAutoAnalysisMessage(false);
            }
          });
        }
      });
    } catch (error) {
      console.error('Popup: Erreur lors de la récupération des résultats:', error);
    }
  });
  
  // Gestion des onglets
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Fonction pour filtrer les liens sur la page en fonction du type
  function filterPageLinks(linkType) {
    // Si on clique sur le même filtre qui est déjà actif, le désactiver et afficher tous les liens
    if (currentActiveFilter && currentActiveFilter.linkType === linkType) {
      linkType = 'all';
      // Réinitialiser le filtre actif
      if (currentActiveFilter.element) {
        currentActiveFilter.element.classList.remove('active-filter');
      }
      currentActiveFilter = null;
    } else {
      // Mettre à jour le filtre actif
      currentActiveFilter = {
        linkType: linkType
      };
    }
    
    // Mettre à jour les checkboxes de filtrage en fonction du type de lien sélectionné
    updateFilterCheckboxes(linkType);
    
    // Envoyer un message au content script pour filtrer les liens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'filterLinks',
          linkType: linkType
        });
      }
    });
    
    // Mettre à jour le tableau des résultats pour afficher uniquement les liens correspondant au filtre
    if (window.lastResults) {
      generateResultsTable(window.lastResults);
    }
  }
  
  // Fonction pour mettre à jour les checkboxes de filtrage en fonction du type de lien sélectionné
  function updateFilterCheckboxes(linkType) {
    // Récupérer toutes les checkboxes de filtrage
    const filterAll = document.getElementById('filter-all');
    const filterValid = document.getElementById('filter-valid');
    const filterBroken = document.getElementById('filter-broken');
    const filterRedirects = document.getElementById('filter-redirects');
    const filterSkipped = document.getElementById('filter-skipped');
    const filterDofollow = document.getElementById('filter-dofollow');
    const filterNofollow = document.getElementById('filter-nofollow');
    const filterSponsored = document.getElementById('filter-sponsored');
    const filterUgc = document.getElementById('filter-ugc');
    
    // Vérifier que les éléments existent
    if (!filterAll) return;
    
    // Décocher toutes les cases
    const allCheckboxes = document.querySelectorAll('.filter-toggle input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Cocher les cases en fonction du type de lien sélectionné
    switch (linkType) {
      case 'all':
        // Cocher toutes les cases
        filterAll.checked = true;
        break;
        
      case 'valid':
        filterValid.checked = true;
        break;
        
      case 'broken':
        filterBroken.checked = true;
        break;
        
      case 'redirect':
        filterRedirects.checked = true;
        break;
        
      case 'skipped':
      case 'rel-skipped':
        filterSkipped.checked = true;
        break;
        
      case 'dofollow':
        filterDofollow.checked = true;
        break;
        
      case 'nofollow':
        filterNofollow.checked = true;
        break;
        
      case 'sponsored':
        filterSponsored.checked = true;
        break;
        
      case 'ugc':
        filterUgc.checked = true;
        break;
        
      case 'none':
        // Ne rien cocher
        break;
    }
  }
  
  // Fonction pour mettre en évidence la case active
  function highlightActiveFilter(element, group) {
    // Supprimer la classe active de TOUTES les cases statistiques
    const allStatCards = document.querySelectorAll('.stat-card');
    allStatCards.forEach(card => card.classList.remove('active-filter'));
    
    // Ajouter la classe active à l'élément cliqué
    element.classList.add('active-filter');
    
    // Déterminer le type de lien en fonction du texte de l'élément
    let linkType = 'all';
    
    // Récupérer le type de lien à partir de l'ID de l'élément
    if (element.querySelector('#results-valid-links')) {
      linkType = 'valid';
    } else if (element.querySelector('#results-broken-links')) {
      linkType = 'broken';
    } else if (element.querySelector('#results-redirect-links')) {
      linkType = 'redirect';
    } else if (element.querySelector('#results-skipped-links')) {
      linkType = 'skipped';
    } else if (element.querySelector('#results-dofollow-links')) {
      linkType = 'dofollow';
    } else if (element.querySelector('#results-nofollow-links')) {
      linkType = 'nofollow';
    } else if (element.querySelector('#results-sponsored-links')) {
      linkType = 'sponsored';
    } else if (element.querySelector('#results-ugc-links')) {
      linkType = 'ugc';
    } else if (element.querySelector('#results-rel-skipped-links')) {
      linkType = 'rel-skipped';
    } else if (element.querySelector('#results-total-links')) {
      linkType = 'all';
    }
    
    // Mettre à jour la variable globale pour suivre le filtre actif
    currentActiveFilter = {
      group: group,
      element: element,
      linkType: linkType
    };
  }
  
  tabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Récupérer l'onglet cible
      const targetTab = this.getAttribute('data-tab');
      
      // Désactiver tous les onglets
      tabLinks.forEach(link => link.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activer l'onglet cliqué
      this.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
        
        // Gestion spéciale pour l'onglet Headings avec architecture modulaire
        if (targetTab === 'headings') {
          // Utiliser le nouveau module loader propre et scalable
          if (window.headingsModuleLoader) {
            console.log('🎯 Activation onglet headings - initialisation module loader');
            
            // Si le module loader n'est pas encore initialisé, l'initialiser
            if (!window.headingsModuleLoader.initialized) {
              window.headingsModuleLoader.initializeModules().then(() => {
                console.log('✅ Modules headings initialisés, lancement analyse');
                window.headingsModuleLoader.initializeHeadings();
              }).catch(error => {
                console.error('❌ Erreur initialisation modules headings:', error);
              });
            } else {
              // Si déjà initialisé, juste lancer l'analyse
              console.log('🔄 Modules déjà initialisés, lancement analyse');
              window.headingsModuleLoader.initializeHeadings();
            }
          } else {
            console.warn('⚠️ Module loader headings non disponible, chargement en cours...');
            // Attendre que le module loader soit disponible
            setTimeout(() => {
              if (window.headingsModuleLoader) {
                window.headingsModuleLoader.initializeModules();
              } else {
                console.error('❌ Module loader toujours pas disponible après timeout');
              }
            }, 500);
          }
        }
      } else {
        console.error('Popup.js: Contenu de l\'onglet non trouvé:', targetTab);
      }
    });
  });
  
  // Activer l'onglet par défaut (dashboard)
  const defaultTab = document.querySelector('.tab-link[data-tab="dashboard"]');
  if (defaultTab) {
    defaultTab.classList.add('active');
    const defaultContent = document.getElementById('dashboard');
    if (defaultContent) {
      defaultContent.classList.add('active');
    }
  }
  
  // Éléments de l'interface
  const scanButton = document.getElementById('scan-button');
  const loadingIndicator = document.getElementById('loading');
  const errorContainer = document.getElementById('error-container');
  // Note: Les boutons 'view-details' et 'highlight-toggle' ont été supprimés
  const saveSettingsButton = document.getElementById('save-settings');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressContainer = document.getElementById('progress-container');
  
  // Bouton de scan
  if (scanButton) {
    scanButton.addEventListener('click', function() {
      startScan();
    });
  }
  
  // Note: Les gestionnaires d'événements pour les boutons 'view-details' et 'highlight-toggle' ont été supprimés
  // car ces boutons ont été retirés de l'interface
  
  // Bouton d'enregistrement des paramètres
  if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', function() {
      saveSettings();
    });
  }
  
  // Fonction pour démarrer l'analyse
  function startScan() {
    // Masquer le message d'analyse automatique si il est visible
    toggleAutoAnalysisMessage(false);
    
    // Afficher l'indicateur de chargement
    loadingIndicator.classList.remove('hidden');
    
    // Réinitialiser la barre de progression
    updateProgress(0);
    
    // Récupérer les options de scan
    const scanOptions = {
      scanInternal: document.getElementById('quick-internal').checked,
      scanExternal: document.getElementById('quick-external').checked
    };
    
    // Récupérer l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        showError('Impossible de récupérer l\'onglet actif');
        loadingIndicator.classList.add('hidden');
        return;
      }
      
      const tab = tabs[0];
      
      // Utiliser un écouteur simple pour les messages
      const messageListener = function(message, sender, sendResponse) {
        // Gérer les mises à jour de progression
        if (message.action === 'scanProgress' && message.tabId === tab.id) {
          updateProgress(message.progress);
          // Ne pas renvoyer de réponse asynchrone
          return false;
        }
        
        // Gérer les résultats finaux
        if (message.action === 'scanResults' && message.tabId === tab.id) {
          chrome.runtime.onMessage.removeListener(messageListener);
          
          if (!message.success) {
            showError(message.message || 'Échec de l\'analyse des liens');
            return false;
          }
          
          if (!message.results) {
            showError('Message de succès reçu mais pas de résultats');
            return false;
          }
          
          // Traiter les résultats
          try {
            processResults(message.results);
          } catch (error) {
            console.error('Popup: Erreur lors du traitement des résultats', error);
            showError('Erreur lors du traitement des résultats: ' + error.message);
          }
          
          return false; // Ne pas renvoyer de réponse asynchrone
        }
        
        return false; // Ne pas renvoyer de réponse asynchrone par défaut
      };
      
      // Ajouter l'écouteur de messages
      chrome.runtime.onMessage.addListener(messageListener);
      
      // Enregistrer un callback pour recevoir les résultats
      chrome.runtime.sendMessage({
        action: 'registerScanCallback',
        tabId: tab.id,
        timestamp: Date.now()
      }, function(registerResponse) {
        if (chrome.runtime.lastError) {
          showError('Erreur lors de l\'enregistrement du callback : ' + chrome.runtime.lastError.message);
          loadingIndicator.classList.add('hidden');
          return;
        }
        
        // Envoyer la demande de scan au content script
        chrome.tabs.sendMessage(tab.id, {
          action: 'scanLinks',
          options: scanOptions
        }, function(response) {
          if (chrome.runtime.lastError) {
            showError('Erreur lors du démarrage de l\'analyse : ' + chrome.runtime.lastError.message);
            loadingIndicator.classList.add('hidden');
            return;
          }
          
          if (!response || !response.success) {
            if (response && response.message) {
              showError('Échec du démarrage de l\'analyse : ' + response.message);
              loadingIndicator.classList.add('hidden');
            }
          }
        });
      });
    });
  }
  
  // Initialiser le tri du tableau
  initTableSorting();
  
  // Initialiser les filtres et la recherche
  initFiltersAndSearch();
  
  // Fonction pour traiter les résultats
  function processResults(results) {
    try {
      // Masquer le message d'analyse automatique
      toggleAutoAnalysisMessage(false);
      
      // Vérifier que les résultats sont valides
      if (!results) {
        console.error('Popup: Résultats invalides', results);
        showError('Résultats invalides reçus');
        return;
      }
      
      // Mettre à jour les statistiques
      updateStats(results);
      
      // Vérifier si nous avons des liens détaillés
      if (!results.links || !Array.isArray(results.links) || results.links.length === 0) {
        console.warn('Popup: Aucun lien détaillé dans les résultats, tentative de récupération des liens depuis la page');
        
        // Essayer de récupérer les liens directement depuis la page
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'getPageLinks'}, function(response) {
              if (chrome.runtime.lastError) {
                console.error('Popup: Erreur lors de la récupération des liens:', chrome.runtime.lastError.message);
              }
              
              // Si nous avons reçu des liens, les ajouter aux résultats
              if (response && response.links && Array.isArray(response.links) && response.links.length > 0) {
                console.log(`Popup: ${response.links.length} liens récupérés depuis la page`);
                results.links = response.links;
                // Mettre à jour le tableau avec les nouveaux liens
                generateResultsTable(results);
              } else {
                // Si nous n'avons toujours pas de liens, ajouter une ligne fictive
                addPlaceholderRow(results);
              }
            });
          } else {
            // Si nous ne pouvons pas récupérer les liens, ajouter une ligne fictive
            addPlaceholderRow(results);
          }
        });
      } else {
        // Générer le tableau des résultats
        generateResultsTable(results);
      }
      
      // Toujours activer l'onglet des résultats à la fin de l'analyse
      setTimeout(() => {
        const resultsTab = document.querySelector('[data-tab="results"]');
        if (resultsTab) {
          resultsTab.click();
        } else {
          console.error('Popup: Impossible de trouver l\'onglet des résultats');
          // Essayer de trouver l'onglet par son contenu
          const tabs = document.querySelectorAll('.tab-link');
          for (const tab of tabs) {
            if (tab.textContent.includes('Résultats')) {
              tab.click();
              break;
            }
          }
        }
      }, 1000);
    } catch (error) {
      console.error('Popup: Erreur lors du traitement des résultats:', error);
      showError('Erreur lors du traitement des résultats: ' + error.message);
    }
  }
  
  // Fonction pour ajouter une ligne fictive aux résultats
  function addPlaceholderRow(results) {
    if (results.total > 0) {
      console.log('Popup: Ajout d\'une ligne fictive au tableau');
      
      // Créer un tableau vide si nécessaire
      if (!results.links) {
        results.links = [];
      }
      
      // Ajouter une ligne fictive
      const placeholderRow = {
        url: 'javascript:void(0)',
        anchorText: 'Détails des liens non disponibles',
        status: 200,
        isExternal: false
      };
      
      results.links.push(placeholderRow);
      
      // Générer le tableau des résultats
      generateResultsTable(results);
    }
  }
  
  // Fonction pour mettre à jour les statistiques
  function updateStats(results) {
    // Vérifier la structure des résultats
    if (!results) {
      console.error('Popup: Résultats invalides', results);
      return;
    }
    
    // Normaliser la structure des résultats
    // Certaines versions utilisent relAttributes, d'autres ont les attributs au niveau racine
    const relAttributes = results.relAttributes || {};
    
    // Mettre à jour les compteurs de code réponse
    const totalLinksElement = document.getElementById('results-total-links');
    const validLinksElement = document.getElementById('results-valid-links');
    const brokenLinksElement = document.getElementById('results-broken-links');
    const redirectLinksElement = document.getElementById('results-redirect-links');
    const skippedLinksElement = document.getElementById('results-skipped-links');
    
    // Récupérer les valeurs des statuts
    const rawTotal = results.total || 0;
    let valid = results.valid || 0;
    let broken = results.broken || 0;
    let redirects = results.redirects || 0;
    let skipped = results.skippedLinks || 0; // Liens ignorés (mailto:, javascript:, etc.)
    
    // Vérifier que le total est égal à la somme des statuts
    const statusTotal = valid + broken + redirects;
    
    // Si le nombre de liens ignorés n'est pas défini ou est à 0, mais qu'il y a une différence entre le total et la somme des statuts
    if (skipped === 0 && rawTotal > statusTotal) {
      // Calculer le nombre de liens ignorés comme la différence
      skipped = rawTotal - statusTotal;
    }
    
    // Calculer le total réel (incluant les liens ignorés)
    const total = statusTotal + skipped;
    
    // Mettre à jour l'interface utilisateur
    if (totalLinksElement) {
      totalLinksElement.textContent = total;
      totalLinksElement.parentElement.addEventListener('click', function() {
        filterPageLinks('all');
        highlightActiveFilter(this, 'status');
      });
    }
    
    if (validLinksElement) {
      validLinksElement.textContent = valid;
      validLinksElement.parentElement.addEventListener('click', function() {
        filterPageLinks('valid');
        highlightActiveFilter(this, 'status');
      });
    }
    
    if (brokenLinksElement) {
      brokenLinksElement.textContent = broken;
      brokenLinksElement.parentElement.addEventListener('click', function() {
        filterPageLinks('broken');
        highlightActiveFilter(this, 'status');
      });
    }
    
    if (redirectLinksElement) {
      redirectLinksElement.textContent = redirects;
      redirectLinksElement.parentElement.addEventListener('click', function() {
        filterPageLinks('redirect');
        highlightActiveFilter(this, 'status');
      });
    }
    
    if (skippedLinksElement) {
      skippedLinksElement.textContent = skipped;
      skippedLinksElement.parentElement.addEventListener('click', function() {
        filterPageLinks('skipped');
        highlightActiveFilter(this, 'status');
      });
    }
    
    // Mettre à jour les compteurs des attributs rel
    const dofollowLinksElement = document.getElementById('results-dofollow-links');
    const nofollowLinksElement = document.getElementById('results-nofollow-links');
    const sponsoredLinksElement = document.getElementById('results-sponsored-links');
    const ugcLinksElement = document.getElementById('results-ugc-links');
    // Ne plus utiliser relSkippedLinksElement car les liens ignorés ne sont pas pertinents pour les attributs rel
    
    // Récupérer les valeurs des attributs rel (en priorité depuis relAttributes si disponible)
    let dofollow = relAttributes.dofollow || results.dofollow || 0;
    const nofollow = relAttributes.nofollow || results.nofollow || 0;
    const sponsored = relAttributes.sponsored || results.sponsored || 0;
    const ugc = relAttributes.ugc || results.ugc || 0;
    // Ne pas compter les liens ignorés dans les attributs rel
    
    // Vérifier que le total des attributs rel est cohérent avec les liens actifs
    const relTotal = dofollow + nofollow + sponsored + ugc;
    
    // Recalculer le nombre de liens dofollow pour plus de précision
    // Par définition, les liens dofollow sont ceux qui sont valides ou des redirections
    // et qui n'ont aucun attribut rel qui limite le suivi des robots
    dofollow = (valid + redirects) - nofollow - sponsored - ugc;
    
    // S'assurer que le compte de dofollow n'est jamais négatif
    dofollow = Math.max(0, dofollow);
    
    // Si la valeur a été ajustée, afficher un log
    if (dofollow !== relAttributes.dofollow && relAttributes.dofollow !== undefined) {
      console.warn(`Popup: Dofollow count adjusted from ${relAttributes.dofollow} to ${dofollow}`);
    }
    
    if (dofollowLinksElement) {
      dofollowLinksElement.textContent = dofollow;
      dofollowLinksElement.parentElement.addEventListener('click', function() {
        filterPageLinks('dofollow');
        highlightActiveFilter(this, 'rel');
      });
    }
    
    if (nofollowLinksElement) {
      nofollowLinksElement.textContent = nofollow;
      nofollowLinksElement.parentElement.addEventListener('click', function() {
        filterPageLinks('nofollow');
        highlightActiveFilter(this, 'rel');
      });
    }
    
    if (sponsoredLinksElement) {
      sponsoredLinksElement.textContent = sponsored;
      sponsoredLinksElement.parentElement.addEventListener('click', function() {
        filterPageLinks('sponsored');
        highlightActiveFilter(this, 'rel');
      });
    }
    
    if (ugcLinksElement) {
      ugcLinksElement.textContent = ugc;
      ugcLinksElement.parentElement.addEventListener('click', function() {
        filterPageLinks('ugc');
        highlightActiveFilter(this, 'rel');
      });
    }
    
    // Ne plus afficher la section "Ignorés" dans les attributs rel car ce n'est pas pertinent
    
    // Activer les boutons d'action si nécessaire
    const copyBrokenButton = document.getElementById('copy-broken');
    if (copyBrokenButton) {
      copyBrokenButton.disabled = (broken <= 0);
    }
  }
  
  // Variables pour le tri du tableau
  let currentSortColumn = 'status';
  let currentSortDirection = 'asc';
  
  // Fonction pour initialiser les événements de tri du tableau
  function initTableSorting() {
    const sortableHeaders = document.querySelectorAll('.results-table th.sortable');
    
    if (!sortableHeaders || sortableHeaders.length === 0) {
      setTimeout(initTableSorting, 500);
      return;
    }
    
    sortableHeaders.forEach(header => {
      // Vérifier si l'écouteur d'événement a déjà été ajouté
      if (header.getAttribute('data-sort-initialized') === 'true') {
        return;
      }
      
      header.addEventListener('click', function() {
        const sortBy = this.getAttribute('data-sort');
        
        // Inverser la direction si on clique sur la même colonne
        if (sortBy === currentSortColumn) {
          currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          currentSortColumn = sortBy;
          currentSortDirection = 'asc';
        }
        
        // Mettre à jour les classes pour l'affichage des icônes de tri
        sortableHeaders.forEach(h => {
          h.classList.remove('sort-asc', 'sort-desc');
        });
        
        this.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        
        // Régénérer le tableau avec le nouveau tri
        if (window.lastResults) {
          generateResultsTable(window.lastResults);
        }
      });
      
      // Marquer l'en-tête comme initialisé
      header.setAttribute('data-sort-initialized', 'true');
    });
  }
  
  // Fonction pour initialiser les filtres et la recherche
  function initFiltersAndSearch() {
    const filterAll = document.getElementById('filter-all');
    const filterBroken = document.getElementById('filter-broken');
    const filterRedirects = document.getElementById('filter-redirects');
    const filterNofollow = document.getElementById('filter-nofollow');
    const searchBox = document.getElementById('search-links');
    
    if (!filterAll || !filterBroken || !filterRedirects || !filterNofollow || !searchBox) {
      setTimeout(initFiltersAndSearch, 500);
      return;
    }
    
    // Fonction pour appliquer les filtres
    function applyFilters() {
      if (window.lastResults) {
        generateResultsTable(window.lastResults);
      }
    }
    
    // Fonction pour gérer les clics sur les labels des filtres
    function handleFilterLabelClick(filterElement) {
      // Inverser l'état de la case à cocher
      filterElement.checked = !filterElement.checked;
      
      // Si c'est le filtre "Tous" et qu'il est coché, cocher tous les autres filtres
      if (filterElement === filterAll && filterElement.checked) {
        filterBroken.checked = true;
        filterRedirects.checked = true;
        filterNofollow.checked = true;
      } else if (filterElement === filterAll && !filterElement.checked) {
        // Si "Tous" est décoché, décocher tous les autres filtres
        filterBroken.checked = false;
        filterRedirects.checked = false;
        filterNofollow.checked = false;
      } else {
        // Si un filtre spécifique est modifié
        // Vérifier si tous les filtres spécifiques sont cochés
        if (filterBroken.checked && filterRedirects.checked && filterNofollow.checked) {
          filterAll.checked = true;
        } else {
          filterAll.checked = false;
        }
      }
      
      // Appliquer les filtres
      applyFilters();
    }
    
    // Ajouter des écouteurs d'événements pour les filtres (checkbox et label)
    document.querySelectorAll('.filter-toggle').forEach(toggle => {
      const checkbox = toggle.querySelector('input[type="checkbox"]');
      const label = toggle.querySelector('span');
      
      // Écouteur pour la case à cocher
      checkbox.addEventListener('change', function() {
        // Récupérer l'ID de la checkbox pour déterminer le type de filtre
        const filterId = this.id;
        const filterType = filterId.replace('filter-', '');
        
        // Si c'est le filtre "Tous"
        if (filterId === 'filter-all') {
          // Si "Tous" est coché, décocher toutes les autres cases
          if (this.checked) {
            // Décocher toutes les autres cases
            document.querySelectorAll('.filter-toggle input[type="checkbox"]').forEach(cb => {
              if (cb !== this) {
                cb.checked = false;
              }
            });
            
            // Réinitialiser le filtre actif des cases statistiques
            resetActiveStatFilter();
            
            // Afficher tous les liens sur la page
            filterPageLinks('all');
          } else {
            // Si "Tous" est décoché, ne rien faire
            // Réactiver la case "Tous" car au moins une case doit être cochée
            this.checked = true;
          }
        } else {
          // Si c'est un filtre spécifique
          // Si la case est cochée, décocher "Tous" et toutes les autres cases
          if (this.checked) {
            // Décocher "Tous"
            const filterAll = document.getElementById('filter-all');
            if (filterAll) filterAll.checked = false;
            
            // Décocher toutes les autres cases spécifiques
            document.querySelectorAll('.filter-toggle input[type="checkbox"]').forEach(cb => {
              if (cb !== this && cb.id !== 'filter-all') {
                cb.checked = false;
              }
            });
            
            // Trouver la case statistique correspondante
            let statElement = null;
            let group = 'status';
            
            // Déterminer le groupe et l'élément statistique en fonction du type de filtre
            switch (filterType) {
              case 'valid':
                statElement = document.querySelector('#results-valid-links')?.closest('.stat-card');
                break;
              case 'broken':
                statElement = document.querySelector('#results-broken-links')?.closest('.stat-card');
                break;
              case 'redirects':
                statElement = document.querySelector('#results-redirect-links')?.closest('.stat-card');
                break;
              case 'skipped':
                statElement = document.querySelector('#results-skipped-links')?.closest('.stat-card');
                break;
              case 'dofollow':
                statElement = document.querySelector('#results-dofollow-links')?.closest('.stat-card');
                group = 'rel';
                break;
              case 'nofollow':
                statElement = document.querySelector('#results-nofollow-links')?.closest('.stat-card');
                group = 'rel';
                break;
              case 'sponsored':
                statElement = document.querySelector('#results-sponsored-links')?.closest('.stat-card');
                group = 'rel';
                break;
              case 'ugc':
                statElement = document.querySelector('#results-ugc-links')?.closest('.stat-card');
                group = 'rel';
                break;
            }
            
            // Mettre à jour le filtre actif
            if (statElement) {
              resetActiveStatFilter();
              statElement.classList.add('active-filter');
              currentActiveFilter = {
                linkType: filterType === 'redirects' ? 'redirect' : filterType,
                element: statElement,
                group: group
              };
            }
            
            // Filtrer les liens sur la page
            filterPageLinks(filterType === 'redirects' ? 'redirect' : filterType);
          } else {
            // Si la case est décochée, vérifier si toutes les cases sont décochées
            const anyChecked = Array.from(document.querySelectorAll('.filter-toggle input[type="checkbox"]')).some(cb => cb.checked);
            
            if (!anyChecked) {
              // Si aucune case n'est cochée, cocher "Tous"
              const filterAll = document.getElementById('filter-all');
              if (filterAll) {
                filterAll.checked = true;
                resetActiveStatFilter();
                filterPageLinks('all');
              }
            }
          }
        }
        
        // Mettre à jour le tableau des résultats
        if (window.lastResults) {
          generateResultsTable(window.lastResults);
        }
      });
      
      // Écouteur pour le label (pour permettre de cliquer sur le texte)
      label.addEventListener('click', function(e) {
        // Empêcher la propagation pour éviter de déclencher l'événement change de la checkbox
        e.preventDefault();
        e.stopPropagation();
        
        // Inverser l'état de la case à cocher associée
        checkbox.checked = !checkbox.checked;
        
        // Si c'est le filtre "Tous" et qu'il est coché, cocher tous les autres filtres
        if (checkbox === filterAll && checkbox.checked) {
          filterBroken.checked = true;
          filterRedirects.checked = true;
          filterNofollow.checked = true;
        } else if (checkbox === filterAll && !checkbox.checked) {
          // Si "Tous" est décoché, décocher tous les autres filtres
          filterBroken.checked = false;
          filterRedirects.checked = false;
          filterNofollow.checked = false;
        } else {
          // Si un filtre spécifique est modifié
          // Vérifier si tous les filtres spécifiques sont cochés
          if (filterBroken.checked && filterRedirects.checked && filterNofollow.checked) {
            filterAll.checked = true;
          } else {
            filterAll.checked = false;
          }
        }
        
        // Appliquer les filtres
        applyFilters();
      });
      
      // Écouteur pour le conteneur du filtre (pour permettre de cliquer n'importe où sur le filtre)
      toggle.addEventListener('click', function(e) {
        // Ne déclencher que si le clic n'est pas sur la checkbox ou le label (déjà gérés)
        if (e.target !== checkbox && e.target !== label) {
          // Inverser l'état de la case à cocher
          checkbox.checked = !checkbox.checked;
          
          // Si c'est le filtre "Tous" et qu'il est coché, cocher tous les autres filtres
          if (checkbox === filterAll && checkbox.checked) {
            filterBroken.checked = true;
            filterRedirects.checked = true;
            filterNofollow.checked = true;
          } else if (checkbox === filterAll && !checkbox.checked) {
            // Si "Tous" est décoché, décocher tous les autres filtres
            filterBroken.checked = false;
            filterRedirects.checked = false;
            filterNofollow.checked = false;
          } else {
            // Si un filtre spécifique est modifié
            // Vérifier si tous les filtres spécifiques sont cochés
            if (filterBroken.checked && filterRedirects.checked && filterNofollow.checked) {
              filterAll.checked = true;
            } else {
              filterAll.checked = false;
            }
          }
          
          // Appliquer les filtres
          applyFilters();
        }
      });
    });
    
    // Écouteur d'événement pour la recherche
    let searchTimeout;
    searchBox.addEventListener('input', function() {
      // Attendre que l'utilisateur arrête de taper avant d'appliquer la recherche
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, 300);
    });
  }
  
  // Fonction pour générer le tableau des résultats avec une meilleure intégration des filtres et de la recherche
  function generateResultsTable(results) {
    // Stocker les résultats pour pouvoir les réutiliser lors du tri
    window.lastResults = results;
    
    const resultsBody = document.getElementById('results-body');
    if (!resultsBody) return;
    
    // Vider le tableau
    resultsBody.innerHTML = '';
    
    // Vérifier si nous avons des liens détaillés
    if (!results || !results.links || !Array.isArray(results.links) || results.links.length === 0) {
      // Afficher un message si aucun résultat
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent = 'Aucun lien trouvé sur cette page.';
      cell.style.textAlign = 'center';
      row.appendChild(cell);
      resultsBody.appendChild(row);
      return;
    }
    
    // Récupérer l'état des filtres
    const filterAll = document.getElementById('filter-all');
    const filterValid = document.getElementById('filter-valid');
    const filterBroken = document.getElementById('filter-broken');
    const filterRedirects = document.getElementById('filter-redirects');
    const filterSkipped = document.getElementById('filter-skipped');
    const filterDofollow = document.getElementById('filter-dofollow');
    const filterNofollow = document.getElementById('filter-nofollow');
    const filterSponsored = document.getElementById('filter-sponsored');
    const filterUgc = document.getElementById('filter-ugc');
    
    // Récupérer le terme de recherche
    const searchTerm = document.getElementById('search-links')?.value?.toLowerCase() || '';
    
    // Copier les liens pour le tri et le filtrage
    let filteredLinks = [...results.links];
    
    // Appliquer les filtres
    filteredLinks = filteredLinks.filter(link => {
      // Vérifier si c'est un lien ignoré
      const isSkippedLink = link.isSkipped || link.url.startsWith('javascript:') || link.url.startsWith('mailto:') || link.url.startsWith('tel:') || link.url === '#';
      
      // Déterminer le statut du lien
      const isBroken = link.status >= 400;
      const isRedirect = link.status >= 300 && link.status < 400 || link.isRedirect === true;
      const isValid = link.status < 300 && !isSkippedLink && !isRedirect;
      
      // Vérifier les attributs rel
      const isNofollow = link.isNofollow || (link.rel && link.rel.includes('nofollow'));
      const isSponsored = link.isSponsored || (link.rel && link.rel.includes('sponsored'));
      const isUgc = link.isUgc || (link.rel && link.rel.includes('ugc'));
      // Un lien est dofollow s'il ne contient aucun des attributs rel qui limitent le suivi
      // et s'il n'est pas ignoré (skipped) ou brisé
      const linkIsDofollow = !isNofollow && !isSponsored && !isUgc && !isSkippedLink && !isBroken;
      
      // Si nous avons un filtre actif depuis les cases statistiques
      if (currentActiveFilter && currentActiveFilter.linkType) {
        const activeFilterType = currentActiveFilter.linkType;
        
        // Filtrer en fonction du type de filtre actif
        switch (activeFilterType) {
          case 'all':
            break; // Pas de filtrage spécifique, continuer avec les autres filtres
          case 'valid':
            if (!isValid) return false;
            break;
          case 'broken':
            if (!isBroken) return false;
            break;
          case 'redirect':
            if (!isRedirect) return false;
            break;
          case 'dofollow':
            if (!isDofollow) return false;
            break;
          case 'nofollow':
            if (!isNofollow) return false;
            break;
          case 'sponsored':
            if (!isSponsored) return false;
            break;
          case 'ugc':
            if (!isUgc) return false;
            break;
          case 'skipped':
          case 'rel-skipped':
            if (!isSkippedLink) return false;
            break;
        }
      } else {
        // Si aucun filtre actif depuis les cases statistiques, utiliser les checkboxes
        if (filterAll && filterAll.checked) {
          // Si "Tous" est coché, appliquer uniquement les filtres d'attributs
          if (filterDofollow && filterDofollow.checked && !isDofollow) return false;
          if (filterNofollow && filterNofollow.checked && !isNofollow) return false;
          if (filterSponsored && filterSponsored.checked && !isSponsored) return false;
          if (filterUgc && filterUgc.checked && !isUgc) return false;
        } else {
          // Sinon, appliquer les filtres de statut et d'attributs
          let matchesStatusFilter = false;
          let hasActiveStatusFilter = false;
          
          // Vérifier les filtres de statut
          if (filterValid && filterValid.checked) {
            hasActiveStatusFilter = true;
            if (isValid) matchesStatusFilter = true;
          }
          
          if (filterBroken && filterBroken.checked) {
            hasActiveStatusFilter = true;
            if (isBroken) matchesStatusFilter = true;
          }
          
          if (filterRedirects && filterRedirects.checked) {
            hasActiveStatusFilter = true;
            if (isRedirect) matchesStatusFilter = true;
          }
          
          if (filterSkipped && filterSkipped.checked) {
            hasActiveStatusFilter = true;
            if (isSkippedLink) matchesStatusFilter = true;
          }
          
          // Si aucun filtre de statut n'est coché, considérer que tous les statuts sont acceptés
          if (hasActiveStatusFilter && !matchesStatusFilter) return false;
          
          // Vérifier les filtres d'attributs
          let matchesAttributeFilter = false;
          let hasActiveAttributeFilter = false;
          
          if (filterDofollow && filterDofollow.checked) {
            hasActiveAttributeFilter = true;
            if (isDofollow) matchesAttributeFilter = true;
          }
          
          if (filterNofollow && filterNofollow.checked) {
            hasActiveAttributeFilter = true;
            if (isNofollow) matchesAttributeFilter = true;
          }
          
          if (filterSponsored && filterSponsored.checked) {
            hasActiveAttributeFilter = true;
            if (isSponsored) matchesAttributeFilter = true;
          }
          
          if (filterUgc && filterUgc.checked) {
            hasActiveAttributeFilter = true;
            if (isUgc) matchesAttributeFilter = true;
          }
          
          // Si aucun filtre d'attribut n'est coché, considérer que tous les attributs sont acceptés
          if (hasActiveAttributeFilter && !matchesAttributeFilter) return false;
        }
      }
      
      // Appliquer la recherche
      if (searchTerm && searchTerm.trim() !== '') {
        const urlMatch = (link.url || '').toLowerCase().includes(searchTerm);
        const anchorMatch = (link.anchorText || '').toLowerCase().includes(searchTerm);
        const relMatch = (link.rel || '').toLowerCase().includes(searchTerm);
        return urlMatch || anchorMatch || relMatch;
      }
      
      return true;
    });
      
    // Trier les liens en fonction de la colonne sélectionnée
    filteredLinks.sort((a, b) => {
      let valueA, valueB;
      
      // Déterminer les valeurs à comparer en fonction de la colonne de tri
      switch (currentSortColumn) {
        case 'url':
          valueA = a.url || '';
          valueB = b.url || '';
          return currentSortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
          
        case 'anchor':
          valueA = a.anchorText || '';
          valueB = b.anchorText || '';
          return currentSortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
          
        case 'status':
          // Priorité des statuts: brisé (400+) > redirection (300+) > valide (200+)
          const getPriority = (status) => {
            if (status >= 400) return 1; // Brisé
            if (status >= 300 && status < 400) return 2; // Redirection
            return 3; // Valide
          };
          const priorityA = getPriority(a.status);
          const priorityB = getPriority(b.status);
          return currentSortDirection === 'asc' ? priorityA - priorityB : priorityB - priorityA;
          
        case 'type':
          valueA = a.isExternal ? 'Externe' : 'Interne';
          valueB = b.isExternal ? 'Externe' : 'Interne';
          return currentSortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
          
        default:
          return 0;
      }
    });
    
    // Mettre à jour le compteur de résultats filtrés
    const filteredCountElement = document.getElementById('filtered-count');
    if (filteredCountElement) {
      filteredCountElement.textContent = filteredLinks.length;
    }
    
    // Afficher un message si aucun résultat après filtrage
    if (filteredLinks.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent = 'Aucun lien ne correspond aux filtres sélectionnés.';
      cell.style.textAlign = 'center';
      row.appendChild(cell);
      resultsBody.appendChild(row);
      return;
    }
    
    // Générer les lignes du tableau
    filteredLinks.forEach(link => {
      const row = document.createElement('tr');
      
      // Déterminer le type de lien pour la classe CSS
      const isSkippedLink = link.isSkipped || link.url.startsWith('javascript:') || link.url.startsWith('mailto:');
      const isBroken = link.status >= 400;
      const isRedirect = link.status >= 300 && link.status < 400;
      
      // Ajouter une classe pour le statut
      if (isBroken) {
        row.classList.add('broken-link');
      } else if (isRedirect) {
        row.classList.add('redirect-link');
      } else if (isSkippedLink) {
        row.classList.add('skipped-link');
      } else {
        row.classList.add('valid-link');
      }
      
      // Tronquer l'URL si elle est trop longue - augmenté pour la nouvelle largeur
      const maxUrlLength = 60;
      const displayUrl = link.url.length > maxUrlLength 
        ? link.url.substring(0, maxUrlLength) + '...' 
        : link.url;
      
      // Préparer le texte d'ancrage - augmenté pour la nouvelle largeur
      const anchorText = link.anchorText || '[Pas de texte]';
      const maxAnchorLength = 50;
      const displayAnchor = anchorText.length > maxAnchorLength
        ? anchorText.substring(0, maxAnchorLength) + '...'
        : anchorText;
      
      // Déterminer le texte et la classe du statut
      let statusText = '';
      let statusClass = '';
      
      if (isBroken) {
        statusText = `Brisé (${link.status})`;
        statusClass = 'status-broken';
      } else if (isRedirect) {
        // Afficher les détails de redirection si disponibles
        if (link.redirectedTo) {
          statusText = `Redirection (${link.status}) → ${truncateText(link.redirectedTo, 30)}`;
        } else {
          statusText = `Redirection (${link.status})`;
        }
        statusClass = 'status-redirect';
      } else if (isSkippedLink) {
        statusText = 'Ignoré';
        statusClass = 'status-skipped';
      } else {
        statusText = `Valide (${link.status})`;
        statusClass = 'status-valid';
      }
      
      // Préparer les attributs rel pour l'affichage
      let relDisplay = '-';
      if (link.rel && link.rel.trim() !== '') {
        relDisplay = link.rel;
      } else if (linkIsDofollow) {
        // Marquer explicitement les liens dofollow pour plus de clarté
        relDisplay = 'dofollow';
      }
      
      // Construire la ligne du tableau avec le nouvel ordre des colonnes (texte d'ancrage en premier, URL intégrée comme lien)
      row.innerHTML = `
        <td title="${link.url}"><a href="${link.url}" target="_blank">${displayAnchor}</a></td>
        <td class="${statusClass}">${statusText}</td>
        <td>${link.isExternal ? 'Externe' : 'Interne'}</td>
        <td title="${relDisplay}">${relDisplay}</td>
      `;
      
      // Ajouter la ligne au tableau
      resultsBody.appendChild(row);
    });
  }
  
  // Fonction pour activer/désactiver les surlignages
  function toggleHighlights() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) return;
      
      const tab = tabs[0];
      
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleHighlights'
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Erreur lors du toggle des surlignages:', chrome.runtime.lastError);
        }
        
        // Mettre à jour le texte du bouton
        if (response && response.highlightsVisible) {
          highlightToggleButton.textContent = 'Masquer surlignage';
        } else {
          highlightToggleButton.textContent = 'Afficher surlignage';
        }
      });
    });
  }
  
  // Fonction pour enregistrer les paramètres
  function saveSettings() {
    const settings = {
      autoHighlightNofollow: document.getElementById('auto-highlight-nofollow').checked,
      autoHighlightSponsored: document.getElementById('auto-highlight-sponsored').checked,
      autoHighlightUgc: document.getElementById('auto-highlight-ugc').checked,
      highlightPoorAnchorText: document.getElementById('highlight-poor-anchor-text').checked,
      autoScanEnabled: document.getElementById('auto-scan-enabled').checked,
      showBadges: document.getElementById('show-badges').checked
    };
    
    chrome.storage.sync.set({ settings: settings }, function() {
      // Afficher une confirmation
      const saveButton = document.getElementById('save-settings');
      const originalText = saveButton.textContent;
      
      saveButton.textContent = 'Enregistré !';
      saveButton.disabled = true;
      
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      }, 2000);
      
      // Envoyer les paramètres au content script
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs || tabs.length === 0) return;
        
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          settings: settings
        });
      });
    });
  }
  
  // Fonction pour charger les paramètres
  function loadSettings() {
    chrome.storage.sync.get('settings', function(data) {
      if (data.settings) {
        // Appliquer les paramètres aux éléments de l'interface
        if (document.getElementById('auto-highlight-nofollow')) {
          document.getElementById('auto-highlight-nofollow').checked = data.settings.autoHighlightNofollow !== false;
        }
        if (document.getElementById('auto-highlight-sponsored')) {
          document.getElementById('auto-highlight-sponsored').checked = data.settings.autoHighlightSponsored !== false;
        }
        if (document.getElementById('auto-highlight-ugc')) {
          document.getElementById('auto-highlight-ugc').checked = data.settings.autoHighlightUgc !== false;
        }
        if (document.getElementById('highlight-poor-anchor-text')) {
          document.getElementById('highlight-poor-anchor-text').checked = data.settings.highlightPoorAnchorText !== false;
        }
        if (document.getElementById('auto-scan-enabled')) {
          document.getElementById('auto-scan-enabled').checked = data.settings.autoScanEnabled === true;
        }
        if (document.getElementById('show-badges')) {
          document.getElementById('show-badges').checked = data.settings.showBadges === true;
        }
      }
    });
  }
  
  // Fonction pour afficher une erreur
  function showError(message) {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = errorContainer.querySelector('.error-message');
    
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
    
    setTimeout(() => {
      errorContainer.classList.add('hidden');
    }, 5000);
  }
  
  // Fonctions utilitaires
  function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  function getStatusText(status) {
    switch (status) {
      case 'valid': return 'Valide';
      case 'broken': return 'Brisé';
      case 'redirect': return 'Redirection';
      case 'nofollow': return 'Nofollow';
      case 'spam': return 'Spam';
      case 'skipped': return 'Ignoré';
      default: return status || 'Inconnu';
    }
  }
  
  // Charger les paramètres au démarrage
  loadSettings();
  
  // Fonction pour mettre à jour le message de chargement
  function updateLoadingMessage(message) {
    const loadingMessage = document.getElementById('loading-message');
    
    if (!loadingMessage) return;
    
    loadingMessage.textContent = message;
  }
  
  // Fonction pour afficher ou masquer le message d'analyse automatique
  function toggleAutoAnalysisMessage(show) {
    const autoAnalysisMessage = document.getElementById('auto-analysis-message');
    
    if (!autoAnalysisMessage) return;
    
    if (show) {
      autoAnalysisMessage.classList.add('visible');
    } else {
      autoAnalysisMessage.classList.remove('visible');
    }
  }
  
  // Fonction pour mettre à jour la barre de progression
  function updateProgress(percent) {
    // S'assurer que le pourcentage est entre 0 et 100
    percent = Math.max(0, Math.min(100, percent));
    
    // Mettre à jour la barre de progression
    if (progressBar) {
      progressBar.style.width = percent + '%';
    }
    
    // Mettre à jour le texte de progression
    if (progressText) {
      progressText.textContent = Math.round(percent) + '%';
    }
    
    // Si la progression atteint 100%, démarrer un timer pour vérifier les résultats
    if (percent >= 100) {
      setTimeout(checkForResults, 2000); // Vérifier les résultats après 2 secondes
    }
  }
  
  // Fonction pour vérifier les résultats après un délai
  function checkForResults() {
    // Masquer le message d'analyse automatique si nécessaire
    toggleAutoAnalysisMessage(false);
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getExistingResults' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Popup: Erreur lors de la vérification des résultats:', chrome.runtime.lastError);
          } else if (response && response.results) {
            processResults(response.results);
          } else {
            console.error('Popup: Aucun résultat disponible lors de la vérification');
          }
        });
      }
    });
  }
  
});
