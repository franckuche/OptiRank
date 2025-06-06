// OptiRank - Nouvelle interface utilisateur
// Variable globale pour suivre le filtre actif
let currentActiveFilter = null;

// === FONCTIONS GLOBALES POUR LES BOUTONS DE COPIE ===

// Fonction globale pour afficher un message temporaire
function showTemporaryMessageGlobal(message) {
  const button = document.getElementById('copy-all-links');
  if (!button) return;
  
  const originalText = button.innerHTML;
  button.innerHTML = `<i class="fas fa-check"></i> ${message}`;
  button.disabled = true;
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.disabled = false;
  }, 2000);
}

// Fonction globale pour appliquer les filtres aux liens (version simplifiée)
function applyLinksFiltersGlobal(linksArray) {
  if (!Array.isArray(linksArray)) return linksArray || [];
  
  const searchTerm = document.getElementById('links-search')?.value?.toLowerCase() || '';
  
  // Si pas de terme de recherche et pas de filtres spécifiques, retourner tous les liens
  if (!searchTerm) {
    return linksArray;
  }
  
  return linksArray.filter(link => {
    if (!link) return false;
    
    // Filtrage par recherche
    if (searchTerm) {
      const url = (link.url || '').toLowerCase();
      const anchorText = (link.anchorText || '').toLowerCase();
      const matchesSearch = url.includes(searchTerm) || anchorText.includes(searchTerm);
      if (!matchesSearch) return false;
    }
    
    return true;
  });
}

// Fonction globale pour copier tous les liens (version simple - sans analyse)
function copyAllLinksSimple() {
  console.log('🔗 copyAllLinksSimple appelée');
  console.log('🔍 Vérification des données disponibles:');
  console.log('- window.lastLinksResults:', window.lastLinksResults);
  console.log('- window.lastResults:', window.lastResults);
  
  // Essayer différentes sources de données
  let linksData = null;
  
  if (window.lastLinksResults && window.lastLinksResults.links) {
    linksData = window.lastLinksResults.links;
    console.log('✅ Utilisation de window.lastLinksResults.links');
  } else if (window.lastResults && window.lastResults.links) {
    linksData = window.lastResults.links;
    console.log('✅ Utilisation de window.lastResults.links');
  } else {
    console.warn('❌ Aucune donnée de liens trouvée dans les variables globales');
    
    // Essayer de récupérer les liens directement depuis la page
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageLinks' }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('❌ Erreur récupération liens:', chrome.runtime.lastError.message);
            showTemporaryMessageGlobal('Erreur: Aucun lien disponible');
            return;
          }
          
          if (response && response.links && Array.isArray(response.links)) {
            console.log(`✅ ${response.links.length} liens récupérés depuis la page`);
            processSimpleCopy(response.links, tabs[0]);
          } else {
            console.error('❌ Pas de liens dans la réponse:', response);
            showTemporaryMessageGlobal('Aucun lien à copier');
          }
        });
      }
    });
    return;
  }
  
  if (!Array.isArray(linksData) || linksData.length === 0) {
    console.warn('❌ Données de liens invalides:', linksData);
    showTemporaryMessageGlobal('Aucun lien à copier');
    return;
  }
  
  console.log(`🔗 ${linksData.length} liens trouvés, traitement...`);
  
  // Récupérer l'URL de base pour construire les URLs complètes
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs && tabs[0]) {
      processSimpleCopy(linksData, tabs[0]);
    } else {
      showTemporaryMessageGlobal('Erreur: Impossible d\'accéder à l\'onglet');
    }
  });
}

// Fonction helper pour traiter la copie simple
function processSimpleCopy(linksData, tab) {
  const baseUrl = new URL(tab.url).origin;
  
  // Appliquer les filtres pour ne copier que les liens visibles
  const filteredLinks = applyLinksFiltersGlobal(linksData);
  
  if (filteredLinks.length === 0) {
    console.warn('❌ Aucun lien après filtrage');
    showTemporaryMessageGlobal('Aucun lien à copier');
    return;
  }
  
  console.log(`📝 Génération de la liste simple pour ${filteredLinks.length} liens`);
  
  // Construire la liste simple des URLs uniquement
  const linksList = filteredLinks.map(link => {
    let url = link.url || '';
    
    // Construire l'URL complète si nécessaire
    if (url.startsWith('/') && baseUrl) {
      url = baseUrl + url;
    } else if (url.startsWith('#') && baseUrl) {
      url = tab.url + url;
    } else if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('javascript:') && baseUrl) {
      url = baseUrl + '/' + url;
    }
    
    return url;
  }).join('\n');
  
  // Copier vers le presse-papiers
  navigator.clipboard.writeText(linksList).then(() => {
    console.log(`✅ ${filteredLinks.length} liens copiés (simple)`);
    showTemporaryMessageGlobal(`${filteredLinks.length} liens copiés !`);
    
    // Fermer le dropdown
    const dropdown = document.querySelector('.copy-dropdown-menu');
    if (dropdown) dropdown.style.display = 'none';
  }).catch(err => {
    console.error('❌ Erreur lors de la copie:', err);
    showTemporaryMessageGlobal('Erreur lors de la copie');
  });
}

// Fonction globale pour copier tous les liens avec analyse complète
function copyAllLinksWithAnalysis() {
  console.log('🔗 copyAllLinksWithAnalysis appelée');
  console.log('🔍 Vérification des données disponibles:');
  console.log('- window.lastLinksResults:', window.lastLinksResults);
  console.log('- window.lastResults:', window.lastResults);
  
  // Essayer différentes sources de données
  let linksData = null;
  
  if (window.lastLinksResults && window.lastLinksResults.links) {
    linksData = window.lastLinksResults.links;
    console.log('✅ Utilisation de window.lastLinksResults.links');
  } else if (window.lastResults && window.lastResults.links) {
    linksData = window.lastResults.links;
    console.log('✅ Utilisation de window.lastResults.links');
  } else {
    console.warn('❌ Aucune donnée de liens trouvée dans les variables globales');
    
    // Essayer de récupérer les liens directement depuis la page
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageLinks' }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('❌ Erreur récupération liens:', chrome.runtime.lastError.message);
            showTemporaryMessageGlobal('Erreur: Aucun lien disponible');
            return;
          }
          
          if (response && response.links && Array.isArray(response.links)) {
            console.log(`✅ ${response.links.length} liens récupérés depuis la page`);
            processAnalysisCopy(response.links, tabs[0]);
          } else {
            console.error('❌ Pas de liens dans la réponse:', response);
            showTemporaryMessageGlobal('Aucun lien à copier');
          }
        });
      }
    });
    return;
  }
  
  if (!Array.isArray(linksData) || linksData.length === 0) {
    console.warn('❌ Données de liens invalides:', linksData);
    showTemporaryMessageGlobal('Aucun lien à copier');
    return;
  }
  
  console.log(`🔗 ${linksData.length} liens trouvés, traitement...`);
  
  // Récupérer l'URL de base pour construire les URLs complètes
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs && tabs[0]) {
      processAnalysisCopy(linksData, tabs[0]);
    } else {
      showTemporaryMessageGlobal('Erreur: Impossible d\'accéder à l\'onglet');
    }
  });
}

// Fonction helper pour traiter la copie avec analyse
function processAnalysisCopy(linksData, tab) {
  const baseUrl = new URL(tab.url).origin;
  
  // Appliquer les filtres pour ne copier que les liens visibles
  const filteredLinks = applyLinksFiltersGlobal(linksData);
  
  if (filteredLinks.length === 0) {
    console.warn('❌ Aucun lien après filtrage');
    showTemporaryMessageGlobal('Aucun lien à copier');
    return;
  }
  
  console.log(`📊 Génération du rapport d'analyse pour ${filteredLinks.length} liens`);
  
  // Construire la liste détaillée avec analyse
  let reportContent = `RAPPORT D'ANALYSE DES LIENS - ${tab.url}\n`;
  reportContent += `Date: ${new Date().toLocaleString('fr-FR')}\n`;
  reportContent += `Total des liens analysés: ${filteredLinks.length}\n\n`;
  
  // Statistiques globales
  const stats = {
    valid: filteredLinks.filter(l => l.status && l.status < 300).length,
    broken: filteredLinks.filter(l => l.status && l.status >= 400).length,
    redirects: filteredLinks.filter(l => l.status && l.status >= 300 && l.status < 400).length,
    internal: filteredLinks.filter(l => !l.isExternal).length,
    external: filteredLinks.filter(l => l.isExternal).length,
    nofollow: filteredLinks.filter(l => l.rel && l.rel.includes('nofollow')).length
  };
  
  reportContent += `STATISTIQUES:\n`;
  reportContent += `- Liens valides: ${stats.valid}\n`;
  reportContent += `- Liens brisés: ${stats.broken}\n`;
  reportContent += `- Redirections: ${stats.redirects}\n`;
  reportContent += `- Liens internes: ${stats.internal}\n`;
  reportContent += `- Liens externes: ${stats.external}\n`;
  reportContent += `- Liens nofollow: ${stats.nofollow}\n\n`;
  
  reportContent += `DÉTAIL DES LIENS:\n`;
  reportContent += `${'='.repeat(80)}\n\n`;
  
  filteredLinks.forEach((link, index) => {
    let url = link.url || '';
    
    // Construire l'URL complète si nécessaire
    if (url.startsWith('/') && baseUrl) {
      url = baseUrl + url;
    } else if (url.startsWith('#') && baseUrl) {
      url = tab.url + url;
    } else if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('javascript:') && baseUrl) {
      url = baseUrl + '/' + url;
    }
    
    const status = link.status || 200;
    const anchorText = link.anchorText || '[Sans texte]';
    const type = link.isExternal ? 'Externe' : 'Interne';
    const rel = link.rel || 'dofollow';
    
    let statusText = '';
    if (status >= 400) {
      statusText = `BRISÉ (${status})`;
    } else if (status >= 300) {
      statusText = `REDIRECTION (${status})`;
    } else {
      statusText = `VALIDE (${status})`;
    }
    
    reportContent += `${index + 1}. ${anchorText}\n`;
    reportContent += `   URL: ${url}\n`;
    reportContent += `   Statut: ${statusText}\n`;
    reportContent += `   Type: ${type}\n`;
    reportContent += `   Rel: ${rel}\n\n`;
  });
  
  // Copier vers le presse-papiers
  navigator.clipboard.writeText(reportContent).then(() => {
    console.log(`✅ Rapport complet de ${filteredLinks.length} liens copié`);
    showTemporaryMessageGlobal(`Rapport complet copié !`);
    
    // Fermer le dropdown
    const dropdown = document.querySelector('.copy-dropdown-menu');
    if (dropdown) dropdown.style.display = 'none';
  }).catch(err => {
    console.error('❌ Erreur lors de la copie:', err);
    showTemporaryMessageGlobal('Erreur lors de la copie');
  });
}

// === DÉBUT DU DOMCONTENTLOADED ===

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
  
  tabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Supprimer la classe active de tous les onglets
      tabLinks.forEach(tab => tab.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Ajouter la classe active à l'onglet cliqué
      this.classList.add('active');
      
      // Afficher le contenu correspondant
      const targetId = this.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
        
        // Si c'est l'onglet headings, déclencher l'analyse
        if (targetId === 'headings') {
          analyzeHeadings();
        }
        
        // Si c'est l'onglet links, déclencher l'analyse des liens
        if (targetId === 'links') {
          console.log('🔗 Onglet Links activé, démarrage de l\'analyse');
          // Initialiser les gestionnaires d'événements d'abord
          setTimeout(() => {
            initializeLinksEventHandlers();
            analyzeLinks();
          }, 100);
        }
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
      // Un lien est dofollow s'il ne contient aucun des attributs rel qui limitent le suivi des robots
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
  
  // Fonction pour analyser les titres de la page
  function analyzeHeadings() {
    console.log('🔍 Démarrage de l\'analyse des titres');
    
    // Afficher le message de chargement
    const insightsList = document.getElementById('insights-list');
    if (insightsList) {
      insightsList.innerHTML = `
        <li class="insight-item">
          <div class="insight-icon">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div class="insight-content">
            <h4 class="insight-title">Analyse en cours</h4>
            <p class="insight-description">Analyse de la structure des titres de la page...</p>
          </div>
        </li>
      `;
    }
    
    // Communiquer avec le content script pour analyser les titres
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        console.error('Aucun onglet actif trouvé');
        showHeadingsError('Impossible d\'analyser la page active');
        return;
      }
      
      try {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'analyzeHeadings' }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Erreur de communication avec le content script:', chrome.runtime.lastError);
            showHeadingsError('Impossible de communiquer avec la page. Rechargez la page et réessayez.');
            return;
          }
          
          if (response && response.headingsData) {
            console.log('📊 Données des titres reçues:', response.headingsData);
            displayHeadingsData(response.headingsData);
          } else {
            console.warn('Aucune donnée de titres reçue');
            showHeadingsError('Aucun titre trouvé sur cette page');
          }
        });
      } catch (error) {
        console.error('Erreur lors de l\'analyse des titres:', error);
        showHeadingsError('Erreur lors de l\'analyse des titres');
      }
    });
  }
  
  // Fonction pour afficher les données des titres
  function displayHeadingsData(headingsData) {
    console.log('📋 Affichage des données des titres:', headingsData);
    
    // Stocker les données pour le module de copie
    window.headingsResults = headingsData;
    
    // Mettre à jour les compteurs
    updateHeadingCounters(headingsData.counts);
    
    // Afficher la structure des titres
    displayHeadingStructure(headingsData.items || headingsData.headings || []);
    
    // Afficher les insights
    displayHeadingInsights(headingsData);
    
    // Initialiser le dropdown de copie si ce n'est pas déjà fait
    initializeCopyDropdown();
  }
  
  // Fonction pour mettre à jour les compteurs de titres
  function updateHeadingCounters(counts) {
    console.log('🔢 Mise à jour des compteurs:', counts);
    
    for (let i = 1; i <= 6; i++) {
      const countElement = document.getElementById(`h${i}-count`);
      if (countElement) {
        const count = counts[`h${i}`] || 0;
        countElement.textContent = count;
        console.log(`H${i}: ${count}`);
      }
    }
  }
  
  // Fonction pour afficher la structure des titres
  function displayHeadingStructure(headings) {
    console.log('🏗️ Affichage de la structure:', headings);
    
    const container = document.querySelector('#headings-list .headings-list') || document.getElementById('headings-list');
    if (!container) {
      console.error('Conteneur headings-list non trouvé');
      return;
    }
    
    if (!headings || headings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-list-ul"></i>
          <p>Aucun titre trouvé sur cette page.</p>
        </div>
      `;
      return;
    }
    
    // Créer la structure combinée sans les sections manquantes
    const combinedStructure = [...headings];
    
    // SUPPRIMÉ : Ne plus ajouter les sections manquantes
    // missingSections.forEach(missingSection => {
    //   combinedStructure.push({
    //     level: missingSection.level,
    //     text: `Section manquante`,
    //     type: 'missing',
    //     reason: missingSection.reason,
    //     suggestion: missingSection.suggestion
    //   });
    // });
    
    // Trier par niveau pour une meilleure présentation
    combinedStructure.sort((a, b) => a.level - b.level);
    
    const headingsHTML = combinedStructure.map(item => {
      const isMissing = item.type === 'missing';
      const cssClass = isMissing ? 'heading-item missing-section-item' : 'heading-item';
      
      return `
        <div class="${cssClass}" data-level="${item.level}">
          <div class="level-indicator">H${item.level}</div>
          <div class="heading-content">
            <p class="heading-text">${escapeHtml(item.text)}</p>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = headingsHTML;
  }
  
  // Fonction pour afficher les insights et recommandations
  function displayHeadingInsights(headingsData) {
    console.log('💡 Affichage des insights:', headingsData);
    
    const insightsList = document.getElementById('insights-list');
    if (!insightsList) {
      console.error('Élément insights-list non trouvé');
      return;
    }
    
    const insights = [];
    const counts = headingsData.counts || {};
    const issues = headingsData.issues || [];
    // SUPPRIMÉ : Ne plus traiter les sections manquantes
    // const missingSections = headingsData.missingSections || [];
    
    // Vérifier le H1
    if (counts.h1 === 0) {
      insights.push({
        type: 'error',
        icon: 'fas fa-exclamation-triangle',
        title: 'H1 manquant',
        description: 'Cette page n\'a pas de titre H1. Chaque page devrait avoir un titre principal H1.'
      });
    } else if (counts.h1 > 1) {
      insights.push({
        type: 'warning',
        icon: 'fas fa-exclamation-circle',
        title: 'Plusieurs H1 détectés',
        description: `Cette page contient ${counts.h1} titres H1. Il est recommandé d'avoir un seul H1 par page.`
      });
    } else {
      insights.push({
        type: 'success',
        icon: 'fas fa-check-circle',
        title: 'H1 correct',
        description: 'Cette page a un titre H1 unique, c\'est parfait !'
      });
    }
    
    // Vérifier la hiérarchie
    let hierarchyIssues = [];
    let ratioIssues = [];
    
    // Analyser les issues pour séparer hiérarchie et ratio
    issues.forEach(issue => {
      if (issue.type === 'hierarchy_skip') {
        hierarchyIssues.push(issue.message);
      } else if (issue.type === 'ratio_imbalance') {
        ratioIssues.push(issue.message);
      }
    });
    
    if (hierarchyIssues.length > 0) {
      insights.push({
        type: 'warning',
        icon: 'fas fa-layer-group',
        title: 'Problème de hiérarchie',
        description: hierarchyIssues.join(' ')
      });
    }
    
    if (ratioIssues.length > 0) {
      insights.push({
        type: 'warning',
        icon: 'fas fa-balance-scale',
        title: 'Déséquilibre de structure',
        description: ratioIssues.join(' ')
      });
    }
    
    // SUPPRIMÉ : Ne plus afficher les sections manquantes dans les insights
    // if (missingSections && missingSections.length > 0) {
    //   const missingDescriptions = missingSections.map(section => section.suggestion).join('. ');
    //   insights.push({
    //     type: 'warning',
    //     icon: 'fas fa-puzzle-piece',
    //     title: 'Sections manquantes détectées',
    //     description: missingDescriptions + '.'
    //   });
    // }
    
    // Si aucun problème de hiérarchie n'est détecté
    if (hierarchyIssues.length === 0 && ratioIssues.length === 0) {
      const totalHeadings = Object.values(counts).reduce((sum, count) => sum + count, 0);
      if (totalHeadings > 0) {
        insights.push({
          type: 'success',
          icon: 'fas fa-layer-group',
          title: 'Structure correcte',
          description: 'La hiérarchie des titres respecte la structure logique et les bonnes pratiques.'
        });
      }
    }
    
    // Compter le total de titres
    const totalHeadings = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (totalHeadings === 0) {
      insights.push({
        type: 'error',
        icon: 'fas fa-heading',
        title: 'Aucun titre trouvé',
        description: 'Cette page ne contient aucun titre (H1-H6). Ajoutez des titres pour améliorer la structure et le SEO.'
      });
    } else {
      insights.push({
        type: 'success',
        icon: 'fas fa-heading',
        title: `${totalHeadings} titre${totalHeadings > 1 ? 's' : ''} trouvé${totalHeadings > 1 ? 's' : ''}`,
        description: 'Cette page contient des titres qui structurent le contenu.'
      });
    }
    
    // Générer le HTML des insights
    const insightsHTML = insights.map(insight => `
      <li class="insight-item ${insight.type}">
        <div class="insight-icon">
          <i class="${insight.icon}"></i>
        </div>
        <div class="insight-content">
          <h4 class="insight-title">${insight.title}</h4>
          <p class="insight-description">${insight.description}</p>
        </div>
      </li>
    `).join('');
    
    insightsList.innerHTML = insightsHTML;
  }
  
  // Fonction pour afficher une erreur dans l'onglet headings
  function showHeadingsError(message) {
    console.error('❌ Erreur headings:', message);
    
    // Réinitialiser les compteurs à 0
    for (let i = 1; i <= 6; i++) {
      const countElement = document.getElementById(`h${i}-count`);
      if (countElement) {
        countElement.textContent = '0';
      }
    }
    
    // Afficher le message d'erreur dans la structure
    const headingsList = document.querySelector('#headings-list .headings-list') || document.getElementById('headings-list');
    if (headingsList) {
      headingsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p style="color: #e74c3c;">${message}</p>
        </div>
      `;
    }
    
    // Afficher l'erreur dans les insights
    const insightsList = document.getElementById('insights-list');
    if (insightsList) {
      insightsList.innerHTML = `
        <li class="insight-item error">
          <div class="insight-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="insight-content">
            <h4 class="insight-title">Erreur d'analyse</h4>
            <p class="insight-description">${message}</p>
          </div>
        </li>
      `;
    }
  }
  
  // Fonction utilitaire pour échapper le HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Fonction pour initialiser le dropdown de copie
  function initializeCopyDropdown() {
    const dropdownTrigger = document.getElementById('copy-all-links');
    const dropdownMenu = document.querySelector('.copy-dropdown-menu');
    
    if (!dropdownTrigger || !dropdownMenu) {
      console.log('Éléments du dropdown de copie non trouvés');
      return;
    }
    
    // Éviter les initialisations multiples
    if (dropdownTrigger.dataset.initialized === 'true') {
      return;
    }
    
    // Gestion du clic sur le bouton
    dropdownTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Fermer le dropdown quand on clique en dehors
    document.addEventListener('click', function(e) {
      if (!dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
      }
    });
    
    // Ajouter les event listeners pour les options de copie
    const copySimpleOption = document.getElementById('copy-simple-option');
    const copyAnalysisOption = document.getElementById('copy-analysis-option');
    
    if (copySimpleOption && !copySimpleOption.dataset.initialized) {
      copySimpleOption.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔗 Clic sur copie simple détecté');
        copyAllLinksSimple();
      });
      copySimpleOption.dataset.initialized = 'true';
    }
    
    if (copyAnalysisOption && !copyAnalysisOption.dataset.initialized) {
      copyAnalysisOption.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔗 Clic sur copie avec analyse détecté');
        copyAllLinksWithAnalysis();
      });
      copyAnalysisOption.dataset.initialized = 'true';
    }
    
    // Gestion des effets hover sur les options
    const copyOptions = dropdownMenu.querySelectorAll('.copy-option');
    copyOptions.forEach(option => {
      option.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
      });
      
      option.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
      });
    });
    
    // Marquer comme initialisé
    dropdownTrigger.dataset.initialized = 'true';
    
    console.log('Dropdown de copie initialisé avec event listeners');
  }

  // === FONCTIONS POUR L'ONGLET LINKS ===
  
  // Fonction principale pour analyser les liens
  function analyzeLinks() {
    console.log('🔗 Début de l\'analyse des liens');
    
    // Afficher l'état de chargement
    const tableBody = document.getElementById('links-table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="loading-row">
            <div class="loading-content">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Analyse des liens en cours...</span>
            </div>
          </td>
        </tr>
      `;
    }
    
    // Récupérer l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        showLinksError('Impossible de récupérer l\'onglet actif');
        return;
      }
      
      const tab = tabs[0];
      console.log('📱 Tab actif:', tab.url);
      
      // Vérifier si l'URL est valide pour l'injection de script
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showLinksError('Impossible d\'analyser cette page (page système du navigateur)');
        return;
      }
      
      // Essayer d'abord de récupérer les liens directement
      console.log('🔍 Tentative de récupération directe des liens');
      chrome.tabs.sendMessage(tab.id, { action: 'getPageLinks' }, function(response) {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ Erreur lors de la récupération directe:', chrome.runtime.lastError.message);
          
          // Si l'injection du content script a échoué, essayer d'injecter manuellement
          console.log('🔧 Tentative d\'injection manuelle du content script');
          
          // Injecter tous les scripts dans l'ordre du manifest
          const scriptsToInject = [
            'content/common/utils.js',
            'content/common/data.js',
            'content/links/validation/validator.js',
            'content/links/validation/redirectDetector.js',
            'content/links/detection/detector.js',
            'content/links/processing/processor.js',
            'content/links/processing/scanner.js',
            'content/reports/reporter.js',
            'content/optiRankMain.js'
          ];
          
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: scriptsToInject
          }, function() {
            if (chrome.runtime.lastError) {
              console.error('❌ Erreur d\'injection du script:', chrome.runtime.lastError.message);
              showLinksError('Impossible d\'injecter le script d\'analyse. Rechargez la page et réessayez.');
              return;
            }
            
            console.log('✅ Script injecté avec succès, nouvelle tentative de récupération');
            
            // Attendre un peu que le script s'initialise
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'getPageLinks' }, function(retryResponse) {
                if (chrome.runtime.lastError) {
                  console.error('❌ Échec même après injection:', chrome.runtime.lastError.message);
                  showLinksError('Script injecté mais communication impossible. Vérifiez que la page est bien chargée.');
                  return;
                }
                
                handleLinksResponse(retryResponse, tab.url);
              });
            }, 1000);
          });
          return;
        }
        
        // Réponse reçue avec succès
        handleLinksResponse(response, tab.url);
      });
    });
  }
  
  // Fonction helper pour traiter la réponse des liens
  function handleLinksResponse(response, tabUrl) {
    console.log('📄 handleLinksResponse appelée avec:', response);
    
    if (!response) {
      console.error('❌ Aucune réponse reçue du script d\'analyse');
      showLinksError('Aucune réponse reçue du script d\'analyse');
      return;
    }
    
    if (response.error) {
      console.error('❌ Erreur dans la réponse:', response.error);
      showLinksError('Erreur d\'analyse: ' + response.error);
      return;
    }
    
    if (!response.links) {
      console.error('❌ Pas de propriété links dans la réponse');
      showLinksError('Aucune donnée de liens dans la réponse');
      return;
    }
    
    if (!Array.isArray(response.links)) {
      console.error('❌ response.links n\'est pas un tableau:', typeof response.links, response.links);
      showLinksError('Format de données incorrect reçu');
      return;
    }
    
    if (response.links.length === 0) {
      console.warn('⚠️ Aucun lien trouvé sur la page');
      // Créer des résultats vides mais valides
      const emptyResults = {
        links: [],
        total: 0,
        valid: 0,
        broken: 0,
        redirects: 0,
        internal: 0,
        external: 0,
        nofollow: 0,
        dofollow: 0
      };
      displayLinksData(emptyResults);
      return;
    }
    
    console.log(`🔗 ${response.links.length} liens trouvés, traitement en cours...`);
    
    // Créer l'objet results à partir des liens
    const results = createResultsFromLinks(response.links);
    console.log('📊 Results créés:', results);
    
    // Appeler displayLinksData
    console.log('🎯 Appel de displayLinksData...');
    displayLinksData(results);
  }
  
  // Fonction helper pour créer l'objet results à partir des liens
  function createResultsFromLinks(links) {
    console.log('🔨 Création de l\'objet results à partir de', links.length, 'liens');
    
    if (!Array.isArray(links)) {
      console.error('❌ Links is not an array:', typeof links);
      return { links: [], total: 0, valid: 0, broken: 0, redirects: 0, internal: 0, external: 0, nofollow: 0, dofollow: 0 };
    }
    
    // Analyser chaque lien pour déterminer son statut et type
    const processedLinks = links.map(link => {
      if (!link) return null;
      
      // Copier le lien pour éviter de modifier l'original
      const processedLink = { ...link };
      
      // Déterminer le statut si pas déjà défini
      if (!processedLink.status) {
        // Si l'URL semble valide, considérer comme valide par défaut
        if (processedLink.url && processedLink.url !== '#' && !processedLink.url.startsWith('javascript:')) {
          processedLink.status = 200;
        } else {
          processedLink.status = 400; // Lien invalide
        }
      }
      
      // Déterminer si c'est un lien externe si pas déjà défini
      if (typeof processedLink.isExternal === 'undefined') {
        try {
          const linkUrl = new URL(processedLink.url, window.location.href);
          processedLink.isExternal = linkUrl.hostname !== window.location.hostname;
        } catch (e) {
          // Si l'URL est invalide, considérer comme externe par défaut
          processedLink.isExternal = true;
        }
      }
      
      // S'assurer que rel est défini
      if (!processedLink.rel) {
        processedLink.rel = '';
      }
      
      // S'assurer que anchorText est défini
      if (!processedLink.anchorText) {
        processedLink.anchorText = '[Sans texte]';
      }
      
      return processedLink;
    }).filter(link => link !== null);
    
    const results = {
      links: processedLinks,
      total: processedLinks.length,
      valid: processedLinks.filter(l => l.status && l.status < 300).length,
      broken: processedLinks.filter(l => l.status && l.status >= 400).length,
      redirects: processedLinks.filter(l => l.status && l.status >= 300 && l.status < 400).length,
      internal: processedLinks.filter(l => !l.isExternal).length,
      external: processedLinks.filter(l => l.isExternal).length,
      nofollow: processedLinks.filter(l => l.rel && l.rel.includes('nofollow')).length,
      dofollow: processedLinks.filter(l => !l.rel || !l.rel.includes('nofollow')).length
    };
    
    console.log('📈 Objet results créé:', results);
    return results;
  }
  
  // Fonction pour afficher les données des liens
  function displayLinksData(results) {
    console.log('📊 displayLinksData appelée avec:', results);
    
    // Sauvegarder les résultats pour les filtres ET pour les fonctions de copie
    window.lastLinksResults = results;
    window.lastResults = results; // Backup pour compatibilité
    
    // Log pour vérifier que les données sont bien stockées
    console.log('💾 Données stockées dans les variables globales:');
    console.log('- window.lastLinksResults:', window.lastLinksResults);
    console.log('- window.lastResults:', window.lastResults);
    
    try {
      console.log('🔢 Mise à jour des statistiques...');
      // Mettre à jour les statistiques
      updateLinksStats(results);
      
      console.log('📋 Génération du tableau...');
      // Générer le tableau des liens
      generateLinksTable(results);
      
      console.log('🎛️ Initialisation des gestionnaires d\'événements...');
      // Initialiser les gestionnaires d'événements
      initializeLinksEventHandlers();
      
      console.log('✅ Données de liens affichées avec succès');
      console.log('📊 Résumé des données disponibles:');
      console.log(`- Total liens: ${results.total || (results.links ? results.links.length : 0)}`);
      console.log(`- Liens dans tableau: ${results.links ? results.links.length : 0}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage des données de liens:', error);
      console.error('❌ Stack trace:', error.stack);
      showLinksError('Erreur lors de l\'affichage des résultats: ' + error.message);
    }
  }
  
  // Fonction pour mettre à jour les statistiques des liens
  function updateLinksStats(results) {
    console.log('📊 updateLinksStats called with:', results);
    
    // Vérifications de sécurité
    if (!results) {
      console.error('❌ Results is null or undefined');
      return;
    }
    
    // S'assurer que results.links est un tableau
    const linksArray = Array.isArray(results.links) ? results.links : [];
    console.log('🔗 Links array:', linksArray);
    
    // Calculer les statistiques avec des vérifications
    const stats = {
      total: results.total || linksArray.length,
      valid: results.valid || linksArray.filter(l => l && l.status && l.status < 300).length,
      broken: results.broken || linksArray.filter(l => l && l.status && l.status >= 400).length,
      redirects: results.redirects || linksArray.filter(l => l && l.status && l.status >= 300 && l.status < 400).length,
      internal: results.internal || linksArray.filter(l => l && !l.isExternal).length,
      external: results.external || linksArray.filter(l => l && l.isExternal).length,
      nofollow: results.nofollow || linksArray.filter(l => l && l.rel && l.rel.includes('nofollow')).length,
      dofollow: results.dofollow || linksArray.filter(l => l && (!l.rel || !l.rel.includes('nofollow'))).length
    };
    
    console.log('📈 Calculated stats:', stats);
    
    // Mettre à jour les éléments de l'interface avec les bons IDs
    const elements = {
      'total-links': { value: stats.total, type: 'total' },
      'valid-links': { value: stats.valid, type: 'valid' },
      'broken-links': { value: stats.broken, type: 'broken' },
      'redirect-links': { value: stats.redirects, type: 'redirect' },
      'internal-links': { value: stats.internal, type: 'internal' },
      'external-links': { value: stats.external, type: 'external' },
      'nofollow-links': { value: stats.nofollow, type: 'nofollow' },
      'dofollow-links': { value: stats.dofollow, type: 'dofollow' }
    };
    
    // Suivre les sélections actives pour sélections multiples
    if (!window.activeHighlights) {
      window.activeHighlights = new Set();
    }
    
    Object.entries(elements).forEach(([id, data]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = data.value;
        console.log(`✅ Updated ${id}: ${data.value}`);
        
        // Ajouter gestionnaire de clic pour surlignage avec sélections multiples
        const statBox = element.closest('.stat-box');
        if (statBox && !statBox.dataset.clickListenerAdded) {
          statBox.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Gestion des sélections multiples
            if (window.activeHighlights.has(data.type)) {
              // Désélectionner si déjà sélectionné
              window.activeHighlights.delete(data.type);
              this.classList.remove('active-highlight');
            } else {
              // Ajouter à la sélection
              window.activeHighlights.add(data.type);
              this.classList.add('active-highlight');
            }
            
            // Envoyer la liste des types sélectionnés au content script pour surlignage
            const highlightTypes = Array.from(window.activeHighlights);
            
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: 'highlightLinksByTypes',
                  types: highlightTypes
                }, function(response) {
                  if (chrome.runtime.lastError) {
                    console.log('Surlignage non disponible:', chrome.runtime.lastError.message);
                  } else {
                    console.log(`🎯 Surlignage appliqué pour:`, highlightTypes);
                  }
                });
              }
            });
            
            console.log(`🎯 Statistique cliquée: ${data.type}, sélections actives:`, Array.from(window.activeHighlights));
          });
          statBox.dataset.clickListenerAdded = 'true';
        }
      } else {
        console.warn(`⚠️ Element not found: ${id}`);
      }
    });
    
    // Mettre à jour la description du nombre de liens
    const linksCountDescription = document.getElementById('links-count-description');
    if (linksCountDescription) {
      linksCountDescription.textContent = `${stats.total} lien${stats.total !== 1 ? 's' : ''} détecté${stats.total !== 1 ? 's' : ''} sur la page`;
    }
  }
  
  // Fonction pour générer le tableau des liens
  function generateLinksTable(results) {
    console.log('🎯 generateLinksTable appelée avec:', results);
    
    const tableBody = document.getElementById('links-table-body');
    if (!tableBody) {
      console.error('❌ Element links-table-body not found !');
      return;
    }
    
    console.log('✅ Element tableBody trouvé:', tableBody);
    
    // Vérifications de sécurité
    if (!results) {
      console.error('❌ No results provided');
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erreur</h3>
            <p>Aucune donnée de liens disponible.</p>
          </td>
        </tr>
      `;
      return;
    }
    
    // S'assurer que results.links est un tableau
    const linksArray = Array.isArray(results.links) ? results.links : [];
    console.log(`🔗 Processing ${linksArray.length} links`);
    
    // Si aucun lien n'est trouvé, afficher un message approprié
    if (linksArray.length === 0) {
      console.log('📝 Aucun lien trouvé, affichage du message');
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            <i class="fas fa-link"></i>
            <h3>Aucun lien trouvé</h3>
            <p>Cette page ne contient aucun lien à analyser. Assurez-vous d'être sur une page web avec des liens.</p>
          </td>
        </tr>
      `;
      return;
    }
    
    console.log('⏳ Récupération de l\'onglet actif pour générer les liens...');
    
    // Récupérer l'URL de base pour construire les URLs complètes
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const baseUrl = tabs && tabs[0] ? new URL(tabs[0].url).origin : '';
      console.log('🌐 Base URL:', baseUrl);
      
      // Appliquer les filtres avant de générer le tableau
      const filteredLinks = applyLinksFilters(linksArray);
      console.log(`🔍 ${filteredLinks.length} liens après filtrage`);
      
      // Vérifier s'il y a des liens après filtrage
      if (filteredLinks.length === 0) {
        console.log('📝 Aucun lien après filtrage, affichage du message');
        tableBody.innerHTML = `
          <tr>
            <td colspan="4" class="empty-state">
              <i class="fas fa-filter"></i>
              <h3>Aucun résultat</h3>
              <p>Aucun lien ne correspond aux filtres sélectionnés. Ajustez les filtres ou réinitialisez-les.</p>
            </td>
          </tr>
        `;
        return;
      }
      
      console.log('🏗️ Génération des lignes du tableau...');
      
      // Générer les lignes du tableau avec vérifications
      const rows = filteredLinks.map((link, index) => {
        // Vérifications de sécurité pour chaque lien
        if (!link) {
          console.warn(`⚠️ Link at index ${index} is null/undefined`);
          return '';
        }
        
        let url = link.url || '#';
        const status = link.status || 200;
        const anchorText = link.anchorText || '[Sans texte]';
        
        // Construire l'URL complète si c'est un lien relatif
        if (url.startsWith('/') && baseUrl) {
          url = baseUrl + url;
        } else if (url.startsWith('#') && baseUrl) {
          url = tabs[0].url + url;
        } else if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('javascript:') && baseUrl) {
          url = baseUrl + '/' + url;
        }
        
        const statusBadge = getStatusBadge(status);
        const typeBadge = getTypeBadge(link);
        
        // Pour l'affichage de l'URL, on va montrer soit le chemin relatif, soit juste le domaine
        let displayUrl = '';
        try {
          const urlObj = new URL(url);
          if (urlObj.origin === baseUrl) {
            // Lien interne : afficher le chemin relatif
            displayUrl = urlObj.pathname + urlObj.search + urlObj.hash;
            if (displayUrl === '/') {
              displayUrl = 'Page d\'accueil';
            }
          } else {
            // Lien externe : afficher le domaine + chemin tronqué
            displayUrl = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
          }
        } catch (e) {
          // Si l'URL n'est pas valide, l'afficher telle quelle mais tronquée
          displayUrl = url;
        }
        
        const truncatedUrl = truncateText(displayUrl, 50);
        const truncatedAnchor = truncateText(anchorText, 40);
        
        return `
          <tr>
            <td title="${escapeHtml(anchorText)}">
              <strong>${escapeHtml(truncatedAnchor)}</strong>
            </td>
            <td title="${escapeHtml(url)}">
              <a href="${escapeHtml(url)}" target="_blank" class="link-url">
                ${escapeHtml(truncatedUrl)}
              </a>
            </td>
            <td>${statusBadge}</td>
            <td>${typeBadge}</td>
          </tr>
        `;
      }).filter(row => row !== '').join(''); // Filtrer les lignes vides
      
      console.log('📝 Mise à jour du contenu du tableau...');
      
      // Mettre à jour le tableau avec les liens générés
      if (rows) {
        tableBody.innerHTML = rows;
        console.log('✅ Tableau généré avec succès avec', filteredLinks.length, 'liens');
      } else {
        console.error('❌ Erreur de génération des lignes');
        tableBody.innerHTML = `
          <tr>
            <td colspan="4" class="empty-state">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Erreur de génération</h3>
              <p>Impossible de générer le tableau des liens.</p>
            </td>
          </tr>
        `;
      }
    });
  }
  
  // Nouvelle fonction pour appliquer les filtres aux liens
  function applyLinksFilters(linksArray) {
    const searchTerm = document.getElementById('links-search')?.value?.toLowerCase() || '';
    
    // Récupérer les états des filtres
    const statusFilters = {
      valid: document.querySelector('input[data-filter="status"][data-value="valid"]')?.checked || false,
      broken: document.querySelector('input[data-filter="status"][data-value="broken"]')?.checked || false,
      redirect: document.querySelector('input[data-filter="status"][data-value="redirect"]')?.checked || false
    };
    
    const typeFilters = {
      internal: document.querySelector('input[data-filter="type"][data-value="internal"]')?.checked || false,
      external: document.querySelector('input[data-filter="type"][data-value="external"]')?.checked || false
    };
    
    // Si aucun filtre de statut n'est coché, considérer tous comme cochés
    const anyStatusFilter = Object.values(statusFilters).some(Boolean);
    if (!anyStatusFilter) {
      statusFilters.valid = statusFilters.broken = statusFilters.redirect = true;
    }
    
    // Si aucun filtre de type n'est coché, considérer tous comme cochés
    const anyTypeFilter = Object.values(typeFilters).some(Boolean);
    if (!anyTypeFilter) {
      typeFilters.internal = typeFilters.external = true;
    }
    
    return linksArray.filter(link => {
      if (!link) return false;
      
      // Filtrage par recherche
      if (searchTerm) {
        const url = (link.url || '').toLowerCase();
        const anchorText = (link.anchorText || '').toLowerCase();
        const matchesSearch = url.includes(searchTerm) || anchorText.includes(searchTerm);
        if (!matchesSearch) return false;
      }
      
      // Filtrage par statut
      const status = link.status || 200;
      const isValid = status < 300;
      const isBroken = status >= 400;
      const isRedirect = status >= 300 && status < 400;
      
      const statusMatch = 
        (statusFilters.valid && isValid) ||
        (statusFilters.broken && isBroken) ||
        (statusFilters.redirect && isRedirect);
      
      if (!statusMatch) return false;
      
      // Filtrage par type
      const isExternal = link.isExternal || false;
      const typeMatch = 
        (typeFilters.internal && !isExternal) ||
        (typeFilters.external && isExternal);
      
      return typeMatch;
    });
  }
  
  // Fonction pour générer le badge de statut
  function getStatusBadge(status) {
    if (status >= 400) {
      return `<span class="status-badge broken">${status} Brisé</span>`;
    } else if (status >= 300) {
      return `<span class="status-badge redirect">${status} Redirection</span>`;
    } else {
      return `<span class="status-badge valid">${status} Valide</span>`;
    }
  }
  
  // Fonction pour générer le badge de type
  function getTypeBadge(link) {
    let badges = [];
    
    // Type de lien (interne/externe)
    if (link.isExternal) {
      badges.push('<span class="type-badge external">Externe</span>');
    } else {
      badges.push('<span class="type-badge internal">Interne</span>');
    }
    
    // Attributs rel
    if (link.rel && link.rel.includes('nofollow')) {
      badges.push('<span class="type-badge nofollow">Nofollow</span>');
    }
    
    return badges.join(' ');
  }
  
  // Fonction pour initialiser les gestionnaires d'événements de l'onglet links
  function initializeLinksEventHandlers() {
    console.log('🔗 Initialisation des gestionnaires Links');
    
    // Gestionnaire pour le bouton reset des filtres
    const resetFiltersButton = document.getElementById('reset-filters');
    if (resetFiltersButton && !resetFiltersButton.dataset.initialized) {
      resetFiltersButton.addEventListener('click', function() {
        console.log('🔄 Réinitialisation des filtres');
        resetAllFilters();
      });
      resetFiltersButton.dataset.initialized = 'true';
    }
    
    // Gestionnaire pour le bouton export CSV
    const exportCSVBtn = document.getElementById('export-csv-btn');
    if (exportCSVBtn && !exportCSVBtn.dataset.initialized) {
      exportCSVBtn.addEventListener('click', function() {
        console.log('📊 Clic sur export CSV du nouveau bouton détecté');
        exportLinksToCSV();
      });
      exportCSVBtn.dataset.initialized = 'true';
    }
    
    // Initialiser les filtres et la recherche
    initializeLinksFiltersAndSearch();
    
    // Initialiser le dropdown de copie
    initializeLinksDropdown();
  }
  
  // Fonction pour réinitialiser tous les filtres
  function resetAllFilters() {
    // Réinitialiser tous les checkboxes des filtres intégrés
    const filterCheckboxes = document.querySelectorAll('.filter-menu input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
    
    // Vider la barre de recherche
    const searchInput = document.getElementById('links-search');
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Cacher le bouton clear search
    const clearSearchButton = document.getElementById('clear-search');
    if (clearSearchButton) {
      clearSearchButton.style.display = 'none';
    }
    
    // Mettre à jour les indicateurs visuels des boutons de filtre
    updateFilterButtonStates();
    
    // Réappliquer les filtres (qui vont tout afficher maintenant)
    applyLinksFiltersWithoutParam();
    
    console.log('✅ Filtres réinitialisés');
  }
  
  // Fonction pour initialiser les filtres et la recherche avec les nouveaux filtres intégrés
  function initializeLinksFiltersAndSearch() {
    console.log('🔍 Initialisation des filtres links intégrés');
    
    // Initialiser les dropdowns de filtres
    initializeFilterDropdowns();
    
    // Recherche avec filtrage en temps réel
    const searchInput = document.getElementById('links-search');
    const clearSearch = document.getElementById('clear-search');
    
    if (searchInput && !searchInput.dataset.initialized) {
      searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        if (searchTerm) {
          clearSearch.style.display = 'block';
        } else {
          clearSearch.style.display = 'none';
        }
        
        // Appliquer les filtres avec la recherche
        applyLinksFiltersWithoutParam();
      });
      searchInput.dataset.initialized = 'true';
    }
    
    if (clearSearch && !clearSearch.dataset.initialized) {
      clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        this.style.display = 'none';
        
        // Réappliquer les filtres sans la recherche
        applyLinksFiltersWithoutParam();
      });
      clearSearch.dataset.initialized = 'true';
    }
    
    console.log('✅ Filtres et recherche links initialisés');
  }
  
  // Fonction pour initialiser les dropdowns de filtres
  function initializeFilterDropdowns() {
    // Bouton de filtre de statut
    const statusFilterBtn = document.getElementById('status-filter-btn');
    const statusFilterMenu = document.getElementById('status-filter-menu');
    
    if (statusFilterBtn && statusFilterMenu && !statusFilterBtn.dataset.initialized) {
      statusFilterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Fermer les autres menus
        document.querySelectorAll('.filter-menu').forEach(menu => {
          if (menu !== statusFilterMenu) {
            menu.classList.remove('show');
          }
        });
        
        // Toggle ce menu
        statusFilterMenu.classList.toggle('show');
      });
      statusFilterBtn.dataset.initialized = 'true';
    }
    
    // Bouton de filtre de type
    const typeFilterBtn = document.getElementById('type-filter-btn');
    const typeFilterMenu = document.getElementById('type-filter-menu');
    
    if (typeFilterBtn && typeFilterMenu && !typeFilterBtn.dataset.initialized) {
      typeFilterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Fermer les autres menus
        document.querySelectorAll('.filter-menu').forEach(menu => {
          if (menu !== typeFilterMenu) {
            menu.classList.remove('show');
          }
        });
        
        // Toggle ce menu
        typeFilterMenu.classList.toggle('show');
      });
      typeFilterBtn.dataset.initialized = 'true';
    }
    
    // Fermer les menus quand on clique en dehors
    document.addEventListener('click', function() {
      document.querySelectorAll('.filter-menu').forEach(menu => {
        menu.classList.remove('show');
      });
    });
    
    // Gestionnaires pour les options de filtre
    const filterInputs = document.querySelectorAll('.filter-menu input[type="checkbox"]');
    filterInputs.forEach(input => {
      if (!input.dataset.initialized) {
        input.addEventListener('change', function(e) {
          e.stopPropagation(); // Empêcher la fermeture du menu
          console.log('🔍 Filtre changé:', this.dataset.filter, this.dataset.value, this.checked);
          
          // Mettre à jour l'état visuel du bouton
          updateFilterButtonStates();
          
          // Appliquer les filtres
          applyLinksFiltersWithoutParam();
        });
        input.dataset.initialized = 'true';
      }
    });
    
    // Empêcher la fermeture des menus quand on clique à l'intérieur
    document.querySelectorAll('.filter-menu').forEach(menu => {
      menu.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    });
    
    console.log('✅ Dropdowns de filtres initialisés');
  }
  
  // Fonction pour mettre à jour l'état visuel des boutons de filtre
  function updateFilterButtonStates() {
    // Bouton de statut
    const statusFilterBtn = document.getElementById('status-filter-btn');
    const statusInputs = document.querySelectorAll('#status-filter-menu input[type="checkbox"]');
    const statusAllChecked = Array.from(statusInputs).every(input => input.checked);
    
    if (statusFilterBtn) {
      statusFilterBtn.classList.toggle('has-active-filters', !statusAllChecked);
      statusFilterBtn.classList.toggle('active', !statusAllChecked);
    }
    
    // Bouton de type
    const typeFilterBtn = document.getElementById('type-filter-btn');
    const typeInputs = document.querySelectorAll('#type-filter-menu input[type="checkbox"]');
    const typeAllChecked = Array.from(typeInputs).every(input => input.checked);
    
    if (typeFilterBtn) {
      typeFilterBtn.classList.toggle('has-active-filters', !typeAllChecked);
      typeFilterBtn.classList.toggle('active', !typeAllChecked);
    }
  }
  
  // Fonction pour appliquer les filtres sur les liens (adaptée pour les nouveaux filtres)
  function applyLinksFiltersWithoutParam() {
    if (!window.lastLinksResults || !window.lastLinksResults.links) {
      console.log('Aucune donnée de liens à filtrer');
      return;
    }
    
    console.log('🔍 Application des filtres links intégrés');
    
    // Récupérer les filtres actifs
    const activeFilters = {
      status: [],
      type: []
    };
    
    // Récupérer les filtres de statut depuis les nouveaux menus
    const statusFilters = document.querySelectorAll('#status-filter-menu input[data-filter="status"]:checked');
    statusFilters.forEach(filter => {
      activeFilters.status.push(filter.dataset.value);
    });
    
    // Récupérer les filtres de type depuis les nouveaux menus
    const typeFilters = document.querySelectorAll('#type-filter-menu input[data-filter="type"]:checked');
    typeFilters.forEach(filter => {
      activeFilters.type.push(filter.dataset.value);
    });
    
    // Récupérer le terme de recherche
    const searchTerm = document.getElementById('links-search')?.value.toLowerCase().trim() || '';
    
    // Filtrer les liens
    const filteredLinks = window.lastLinksResults.links.filter(link => {
      // Filtre par statut
      let statusMatch = activeFilters.status.length === 0; // Si aucun filtre, accepter tout
      if (activeFilters.status.includes('valid') && link.status < 300) statusMatch = true;
      if (activeFilters.status.includes('broken') && link.status >= 400) statusMatch = true;
      if (activeFilters.status.includes('redirect') && link.status >= 300 && link.status < 400) statusMatch = true;
      
      // Filtre par type
      let typeMatch = activeFilters.type.length === 0; // Si aucun filtre, accepter tout
      if (activeFilters.type.includes('internal') && !link.isExternal) typeMatch = true;
      if (activeFilters.type.includes('external') && link.isExternal) typeMatch = true;
      
      // Filtre par recherche
      let searchMatch = true;
      if (searchTerm) {
        const searchText = `${link.anchorText || ''} ${link.url || ''}`.toLowerCase();
        searchMatch = searchText.includes(searchTerm);
      }
      
      return statusMatch && typeMatch && searchMatch;
    });
    
    // Régénérer le tableau avec les liens filtrés
    const modifiedResults = {
      ...window.lastLinksResults,
      links: filteredLinks
    };
    
    generateLinksTable(modifiedResults);
    
    // Mettre à jour la description du nombre de liens
    const description = document.getElementById('links-count-description');
    if (description) {
      const total = window.lastLinksResults.links.length;
      const filtered = filteredLinks.length;
      if (filtered === total) {
        description.textContent = `${total} lien${total !== 1 ? 's' : ''} détecté${total !== 1 ? 's' : ''} sur la page`;
      } else {
        description.textContent = `${filtered} sur ${total} liens affichés`;
      }
    }
    
    console.log(`✅ Filtres appliqués: ${filteredLinks.length}/${window.lastLinksResults.links.length} liens affichés`);
  }
  
  // Fonction pour initialiser le dropdown de copie
  function initializeLinksDropdown() {
    const dropdownTrigger = document.getElementById('copy-all-links');
    const dropdownMenu = document.querySelector('.copy-dropdown-menu');
    
    if (!dropdownTrigger || !dropdownMenu) {
      console.log('Éléments du dropdown de copie non trouvés');
      return;
    }
    
    // Éviter les initialisations multiples
    if (dropdownTrigger.dataset.initialized === 'true') {
      return;
    }
    
    // Gestion du clic sur le bouton
    dropdownTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Fermer le dropdown quand on clique en dehors
    document.addEventListener('click', function(e) {
      if (!dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
      }
    });
    
    // Ajouter les event listeners pour les options de copie
    const copySimpleOption = document.getElementById('copy-simple-option');
    const copyAnalysisOption = document.getElementById('copy-analysis-option');
    
    if (copySimpleOption && !copySimpleOption.dataset.initialized) {
      copySimpleOption.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔗 Clic sur copie simple détecté');
        copyAllLinksSimple();
      });
      copySimpleOption.dataset.initialized = 'true';
    }
    
    if (copyAnalysisOption && !copyAnalysisOption.dataset.initialized) {
      copyAnalysisOption.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔗 Clic sur copie avec analyse détecté');
        copyAllLinksWithAnalysis();
      });
      copyAnalysisOption.dataset.initialized = 'true';
    }
    
    // Gestion des effets hover sur les options
    const copyOptions = dropdownMenu.querySelectorAll('.copy-option');
    copyOptions.forEach(option => {
      option.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
      });
      
      option.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
      });
    });
    
    // Marquer comme initialisé
    dropdownTrigger.dataset.initialized = 'true';
    
    console.log('Dropdown de copie initialisé avec event listeners');
  }
  
  // Fonction pour copier tous les liens vers le presse-papiers
  function copyAllLinksToClipboard() {
    if (!window.lastLinksResults || !window.lastLinksResults.links) {
      console.warn('Aucun lien à copier');
      showTemporaryMessage('Aucun lien à copier');
      return;
    }
    
    // Récupérer l'URL de base
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const baseUrl = tabs && tabs[0] ? new URL(tabs[0].url).origin : '';
      
      // Appliquer les filtres pour ne copier que les liens visibles
      const filteredLinks = applyLinksFilters(window.lastLinksResults.links);
      
      if (filteredLinks.length === 0) {
        console.warn('Aucun lien visible à copier');
        showTemporaryMessage('Aucun lien à copier');
        return;
      }
      
      // Construire la liste des liens avec URLs complètes
      const linksList = filteredLinks.map(link => {
        let url = link.url || '';
        
        // Construire l'URL complète si nécessaire
        if (url.startsWith('/') && baseUrl) {
          url = baseUrl + url;
        } else if (url.startsWith('#') && baseUrl) {
          url = tabs[0].url + url;
        } else if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('javascript:') && baseUrl) {
          url = baseUrl + '/' + url;
        }
        
        const anchorText = link.anchorText || '[Sans texte]';
        return `${anchorText} - ${url}`;
      }).join('\n');
      
      // Copier vers le presse-papiers
      navigator.clipboard.writeText(linksList).then(() => {
        console.log(`✅ ${filteredLinks.length} liens copiés`);
        showTemporaryMessage(`${filteredLinks.length} liens copiés !`);
        
        // Fermer le dropdown
        const dropdown = document.querySelector('.copy-dropdown-menu');
        if (dropdown) dropdown.style.display = 'none';
      }).catch(err => {
        console.error('❌ Erreur lors de la copie:', err);
        showTemporaryMessage('Erreur lors de la copie');
      });
    });
  }
  
  // Fonction pour copier seulement les liens brisés
  function copyBrokenLinksOnly() {
    if (!window.lastLinksResults || !window.lastLinksResults.links) {
      console.warn('Aucun lien à copier');
      showTemporaryMessage('Aucun lien à copier');
      return;
    }
    
    // Récupérer l'URL de base
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const baseUrl = tabs && tabs[0] ? new URL(tabs[0].url).origin : '';
      
      // Filtrer seulement les liens brisés
      const brokenLinks = window.lastLinksResults.links.filter(link => {
        return link && link.status && link.status >= 400;
      });
      
      if (brokenLinks.length === 0) {
        showTemporaryMessage('Aucun lien brisé trouvé');
        return;
      }
      
      // Construire la liste des liens brisés avec URLs complètes
      const linksList = brokenLinks.map(link => {
        let url = link.url || '';
        
        // Construire l'URL complète si nécessaire
        if (url.startsWith('/') && baseUrl) {
          url = baseUrl + url;
        } else if (url.startsWith('#') && baseUrl) {
          url = tabs[0].url + url;
        } else if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('javascript:') && baseUrl) {
          url = baseUrl + '/' + url;
        }
        
        const anchorText = link.anchorText || '[Sans texte]';
        return `${anchorText} - ${url} (Erreur ${link.status})`;
      }).join('\n');
      
      // Copier vers le presse-papiers
      navigator.clipboard.writeText(linksList).then(() => {
        console.log(`✅ ${brokenLinks.length} liens brisés copiés`);
        showTemporaryMessage(`${brokenLinks.length} liens brisés copiés !`);
        
        // Fermer le dropdown
        const dropdown = document.querySelector('.copy-dropdown-menu');
        if (dropdown) dropdown.style.display = 'none';
      }).catch(err => {
        console.error('❌ Erreur lors de la copie:', err);
        showTemporaryMessage('Erreur lors de la copie');
      });
    });
  }
  
  // Fonction pour afficher un message temporaire
  function showTemporaryMessage(message) {
    const button = document.getElementById('copy-all-links');
    if (!button) return;
    
    const originalText = button.innerHTML;
    button.innerHTML = `<i class="fas fa-check"></i> ${message}`;
    button.disabled = true;
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 2000);
  }
  
  // Fonction pour initialiser les actions rapides
  function initializeQuickActions() {
    const actions = {
      'copy-broken-list': () => copyBrokenLinksList(),
      'generate-report': () => generateLinksReport()
    };
    
    Object.entries(actions).forEach(([id, handler]) => {
      const button = document.getElementById(id);
      if (button && !button.dataset.initialized) {
        button.addEventListener('click', handler);
        button.dataset.initialized = 'true';
      }
    });
  }
  
  // Fonction pour initialiser le dropdown d'export
  function initializeExportDropdown() {
    const trigger = document.getElementById('export-dropdown-trigger');
    const menu = document.querySelector('.export-dropdown-menu');
    
    if (!trigger || !menu || trigger.dataset.initialized) return;
    
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = menu.style.display === 'block';
      menu.style.display = isVisible ? 'none' : 'block';
    });
    
    document.addEventListener('click', function(e) {
      if (!trigger.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
    
    trigger.dataset.initialized = 'true';
  }
  
  // Fonction pour afficher une erreur dans l'onglet links
  function showLinksError(message) {
    console.error('❌ Erreur links:', message);
    
    // Réinitialiser les statistiques
    const statsElements = ['total-links', 'working-links', 'broken-links', 'redirect-links', 
                          'internal-links', 'external-links', 'nofollow-links', 'dofollow-links'];
    
    statsElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = '0';
      }
    });
    
    // Afficher le message d'erreur dans le tableau
    const tableBody = document.getElementById('links-table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erreur d'analyse</h3>
            <p style="color: #e74c3c;">${message}</p>
          </td>
        </tr>
      `;
    }
  }
  
  // === FONCTIONS UTILITAIRES POUR L'ONGLET LINKS ===
  
  // Fonction pour copier l'URL d'un lien
  window.copyLinkUrl = function(url) {
    navigator.clipboard.writeText(url).then(() => {
      console.log('URL copiée:', url);
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
    });
  };
  
  // Fonction pour ouvrir un lien dans un nouvel onglet
  window.openLinkInNewTab = function(url) {
    chrome.tabs.create({ url: url });
  };
  
  // Fonction pour exporter les liens
  window.exportLinks = function(type) {
    console.log('Export des liens:', type);
    // TODO: Implémenter l'export selon le type
  };
  
  // Fonction pour surligner les liens sur la page
  function highlightLinksOnPage(type) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'highlightLinks',
          type: type
        });
      }
    });
  }
  
  // Fonction pour copier la liste des liens brisés
  function copyBrokenLinksList() {
    // TODO: Implémenter la copie de la liste des liens brisés
    console.log('Copie de la liste des liens brisés');
  }
  
  // Fonction pour générer un rapport des liens
  function generateLinksReport() {
    // TODO: Implémenter la génération de rapport
    console.log('Génération du rapport des liens');
  }
  
  // Fonction pour copier tous les liens vers le presse-papiers (version simple - sans analyse)
  function copyAllLinksSimple() {
    if (!window.lastLinksResults || !window.lastLinksResults.links) {
      console.warn('Aucun lien à copier');
      showTemporaryMessage('Aucun lien à copier');
      return;
    }
    
    // Récupérer l'URL de base
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const baseUrl = tabs && tabs[0] ? new URL(tabs[0].url).origin : '';
      
      // Appliquer les filtres pour ne copier que les liens visibles
      const filteredLinks = applyLinksFilters(window.lastLinksResults.links);
      
      if (filteredLinks.length === 0) {
        console.warn('Aucun lien visible à copier');
        showTemporaryMessage('Aucun lien à copier');
        return;
      }
      
      // Construire la liste simple des URLs uniquement
      const linksList = filteredLinks.map(link => {
        let url = link.url || '';
        
        // Construire l'URL complète si nécessaire
        if (url.startsWith('/') && baseUrl) {
          url = baseUrl + url;
        } else if (url.startsWith('#') && baseUrl) {
          url = tabs[0].url + url;
        } else if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('javascript:') && baseUrl) {
          url = baseUrl + '/' + url;
        }
        
        return url;
      }).join('\n');
      
      // Copier vers le presse-papiers
      navigator.clipboard.writeText(linksList).then(() => {
        console.log(`✅ ${filteredLinks.length} liens copiés (simple)`);
        showTemporaryMessage(`${filteredLinks.length} liens copiés !`);
        
        // Fermer le dropdown
        const dropdown = document.querySelector('.copy-dropdown-menu');
        if (dropdown) dropdown.style.display = 'none';
      }).catch(err => {
        console.error('❌ Erreur lors de la copie:', err);
        showTemporaryMessage('Erreur lors de la copie');
      });
    });
  }
  
  // Fonction pour copier tous les liens avec analyse complète
  function copyAllLinksWithAnalysis() {
    if (!window.lastLinksResults || !window.lastLinksResults.links) {
      console.warn('Aucun lien à copier');
      showTemporaryMessage('Aucun lien à copier');
      return;
    }
    
    // Récupérer l'URL de base
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const baseUrl = tabs && tabs[0] ? new URL(tabs[0].url).origin : '';
      
      // Appliquer les filtres pour ne copier que les liens visibles
      const filteredLinks = applyLinksFilters(window.lastLinksResults.links);
      
      if (filteredLinks.length === 0) {
        console.warn('Aucun lien visible à copier');
        showTemporaryMessage('Aucun lien à copier');
        return;
      }
      
      // Construire la liste détaillée avec analyse
      let reportContent = `RAPPORT D'ANALYSE DES LIENS - ${tabs[0].url}\n`;
      reportContent += `Date: ${new Date().toLocaleString('fr-FR')}\n`;
      reportContent += `Total des liens analysés: ${filteredLinks.length}\n\n`;
      
      // Statistiques globales
      const stats = {
        valid: filteredLinks.filter(l => l.status && l.status < 300).length,
        broken: filteredLinks.filter(l => l.status && l.status >= 400).length,
        redirects: filteredLinks.filter(l => l.status && l.status >= 300 && l.status < 400).length,
        internal: filteredLinks.filter(l => !l.isExternal).length,
        external: filteredLinks.filter(l => l.isExternal).length,
        nofollow: filteredLinks.filter(l => l.rel && l.rel.includes('nofollow')).length
      };
      
      reportContent += `STATISTIQUES:\n`;
      reportContent += `- Liens valides: ${stats.valid}\n`;
      reportContent += `- Liens brisés: ${stats.broken}\n`;
      reportContent += `- Redirections: ${stats.redirects}\n`;
      reportContent += `- Liens internes: ${stats.internal}\n`;
      reportContent += `- Liens externes: ${stats.external}\n`;
      reportContent += `- Liens nofollow: ${stats.nofollow}\n\n`;
      
      reportContent += `DÉTAIL DES LIENS:\n`;
      reportContent += `${'='.repeat(80)}\n\n`;
      
      filteredLinks.forEach((link, index) => {
        let url = link.url || '';
        
        // Construire l'URL complète si nécessaire
        if (url.startsWith('/') && baseUrl) {
          url = baseUrl + url;
        } else if (url.startsWith('#') && baseUrl) {
          url = tabs[0].url + url;
        } else if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('javascript:') && baseUrl) {
          url = baseUrl + '/' + url;
        }
        
        const status = link.status || 200;
        const anchorText = link.anchorText || '[Sans texte]';
        const type = link.isExternal ? 'Externe' : 'Interne';
        const rel = link.rel || 'dofollow';
        
        let statusText = '';
        if (status >= 400) {
          statusText = `BRISÉ (${status})`;
        } else if (status >= 300) {
          statusText = `REDIRECTION (${status})`;
        } else {
          statusText = `VALIDE (${status})`;
        }
        
        reportContent += `${index + 1}. ${anchorText}\n`;
        reportContent += `   URL: ${url}\n`;
        reportContent += `   Statut: ${statusText}\n`;
        reportContent += `   Type: ${type}\n`;
        reportContent += `   Rel: ${rel}\n\n`;
      });
      
      // Copier vers le presse-papiers
      navigator.clipboard.writeText(reportContent).then(() => {
        console.log(`✅ Rapport complet de ${filteredLinks.length} liens copié`);
        showTemporaryMessage(`Rapport complet copié !`);
        
        // Fermer le dropdown
        const dropdown = document.querySelector('.copy-dropdown-menu');
        if (dropdown) dropdown.style.display = 'none';
      }).catch(err => {
        console.error('❌ Erreur lors de la copie:', err);
        showTemporaryMessage('Erreur lors de la copie');
      });
    });
  }
  
  // === FONCTIONS GLOBALES POUR LES GESTIONNAIRES ONCLICK ===
  
  // Fonction globale pour copier tous les liens simple (appelée depuis le HTML)
  window.copyAllLinksSimple = copyAllLinksSimple;
  
  // Fonction globale pour copier tous les liens avec analyse (appelée depuis le HTML)
  window.copyAllLinksWithAnalysis = copyAllLinksWithAnalysis;
  
  // Fonction globale pour exporter en CSV
  function exportLinksToCSV() {
    console.log('📊 exportLinksToCSV appelée');
    
    // Essayer différentes sources de données
    let linksData = null;
    
    if (window.lastLinksResults && window.lastLinksResults.links) {
      linksData = window.lastLinksResults.links;
    } else if (window.lastResults && window.lastResults.links) {
      linksData = window.lastResults.links;
    } else {
      console.warn('❌ Aucune donnée de liens trouvée');
      showTemporaryMessageGlobal('Aucun lien à exporter');
      return;
    }
    
    if (!Array.isArray(linksData) || linksData.length === 0) {
      console.warn('❌ Données de liens invalides');
      showTemporaryMessageGlobal('Aucun lien à exporter');
      return;
    }
    
    // Récupérer l'URL de base pour construire les URLs complètes
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs[0]) {
        const baseUrl = new URL(tabs[0].url).origin;
        
        // Appliquer les filtres pour ne exporter que les liens visibles
        const filteredLinks = applyLinksFiltersGlobal(linksData);
        
        if (filteredLinks.length === 0) {
          console.warn('❌ Aucun lien après filtrage');
          showTemporaryMessageGlobal('Aucun lien à exporter');
          return;
        }
        
        console.log(`📝 Génération du fichier CSV pour ${filteredLinks.length} liens`);
        
        // Construire le contenu CSV
        let csvContent = 'Texte du lien,URL,Statut,Type,Rel\n';
        
        filteredLinks.forEach(link => {
          let url = link.url || '';
          
          // Construire l'URL complète si nécessaire
          if (url.startsWith('/') && baseUrl) {
            url = baseUrl + url;
          } else if (url.startsWith('#') && baseUrl) {
            url = tabs[0].url + url;
          } else if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('javascript:') && baseUrl) {
            url = baseUrl + '/' + url;
          }
          
          const anchorText = (link.anchorText || '[Sans texte]').replace(/"/g, '""'); // Échapper les guillemets
          const status = link.status || 200;
          const type = link.isExternal ? 'Externe' : 'Interne';
          const rel = link.rel || 'dofollow';
          
          csvContent += `"${anchorText}","${url}","${status}","${type}","${rel}"\n`;
        });
        
        // Créer et télécharger le fichier CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `liens-${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log(`✅ Fichier CSV généré avec ${filteredLinks.length} liens`);
          showTemporaryMessageGlobal(`CSV exporté (${filteredLinks.length} liens) !`);
          
          // Fermer le dropdown
          const dropdown = document.querySelector('.copy-dropdown-menu');
          if (dropdown) dropdown.style.display = 'none';
        } else {
          console.error('❌ Le téléchargement de fichier n\'est pas supporté');
          showTemporaryMessageGlobal('Export non supporté par ce navigateur');
        }
      } else {
        showTemporaryMessageGlobal('Erreur: Impossible d\'accéder à l\'onglet');
      }
    });
  }
  
  // Fonction globale pour exporter en CSV (appelée depuis le HTML)
  window.exportLinksToCSV = exportLinksToCSV;
});
