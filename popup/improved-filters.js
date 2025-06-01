// Script pour gérer les nouveaux filtres améliorés avec select
document.addEventListener('DOMContentLoaded', function() {
  // Suppression du log : console.log('Initialisation des filtres améliorés');
  
  // Récupérer les éléments de filtrage
  const statusFilter = document.getElementById('status-filter');
  const attributeFilter = document.getElementById('attribute-filter');
  const typeFilter = document.getElementById('type-filter');
  const resetFiltersButton = document.getElementById('reset-filters');
  const searchBox = document.getElementById('search-links');
  
  // Fonction pour déboguer les liens ignorés
  function debugSkippedLinks() {
    if (!window.lastResults || !window.lastResults.links) {
      // Suppression du log : console.log('%cAucun résultat à analyser', 'color: #F29725; font-weight: bold;');
      return;
    }

    const allLinks = window.lastResults.links;
    const skippedLinks = allLinks.filter(link => {
      return link.status === 'skipped' || 
             (link.attributes && (link.attributes.includes('data-') || 
                                  link.attributes.includes('javascript:') || 
                                  link.attributes.includes('#')));
    });

    if (skippedLinks.length > 0) {
      // Suppression du log : console.log('%c=== LIENS IGNORÉS ===', 'background: #492A25; color: white; padding: 5px; font-weight: bold; font-size: 14px;');
      // Suppression du log : console.log(`Total des liens ignorés: ${skippedLinks.length} sur ${window.lastResults.links.length} liens`);

      // Créer un tableau pour l'affichage dans la console
      const skippedTable = [];
      
      // Ajouter chaque lien ignoré au tableau
      skippedLinks.forEach((link, index) => {
        let reason = "";
        if (link.isSkipped) reason = "Marqué comme ignoré";
        else if (link.url && link.url.startsWith('javascript:')) reason = "Lien JavaScript";
        else if (link.url && link.url.startsWith('mailto:')) reason = "Lien mailto";
        else if (link.url && link.url.startsWith('tel:')) reason = "Lien téléphone";
        else if (link.url === '#') reason = "Lien ancre (#)";
        
        skippedTable.push({
          "#": index + 1,
          "URL": link.url,
          "Texte d'ancrage": link.anchorText || "(sans texte)",
          "Raison": reason,
          "Type": link.isExternal ? "Externe" : "Interne"
        });
      });
      
      // Afficher le tableau des liens ignorés
      if (skippedLinks.length > 0) {
        // Suppression du log : console.table(skippedTable);
        
        // Afficher des statistiques sur les types de liens ignorés
        const jsLinks = skippedLinks.filter(link => link.url && link.url.startsWith('javascript:')).length;
        const mailtoLinks = skippedLinks.filter(link => link.url && link.url.startsWith('mailto:')).length;
        const telLinks = skippedLinks.filter(link => link.url && link.url.startsWith('tel:')).length;
        const hashLinks = skippedLinks.filter(link => link.url === '#').length;
        const markedSkipped = skippedLinks.filter(link => link.isSkipped === true).length;
        
        // Suppression du log : console.log('%c=== STATISTIQUES DES LIENS IGNORÉS ===', 'background: #F29725; color: white; padding: 5px; font-weight: bold; font-size: 14px;');
        // Suppression du log : console.log({
        //   'Liens JavaScript': jsLinks,
        //   'Liens mailto': mailtoLinks,
        //   'Liens téléphone': telLinks,
        //   'Liens ancre (#)': hashLinks,
        //   'Marqués comme ignorés': markedSkipped
        // });
      } else {
        // Suppression du log : console.log('%cAucun lien ignoré trouvé', 'color: #F29725; font-weight: bold;');
      }
    }
  }
  
  // Appeler la fonction de débogage après un court délai pour s'assurer que les résultats sont chargés
  setTimeout(debugSkippedLinks, 2000);
  
  // Fonction pour initialiser les filtres améliorés
  function initImprovedFilters() {
    // Suppression du log : console.log('Initialisation des filtres améliorés');
    
    // Récupérer les éléments de filtrage améliorés
    const statusFilter = document.getElementById('status-filter');
    const attributeFilter = document.getElementById('attribute-filter');
    const typeFilter = document.getElementById('type-filter');
    const resetFiltersButton = document.getElementById('reset-filters');
    
    // Désactiver le système de filtrage original
    // Récupérer les checkboxes cachées (pour compatibilité avec le code existant)
    const filterAll = document.getElementById('filter-all');
    const filterValid = document.getElementById('filter-valid');
    const filterBroken = document.getElementById('filter-broken');
    const filterRedirects = document.getElementById('filter-redirects');
    const filterSkipped = document.getElementById('filter-skipped');
    const filterDofollow = document.getElementById('filter-dofollow');
    const filterNofollow = document.getElementById('filter-nofollow');
    const filterSponsored = document.getElementById('filter-sponsored');
    const filterUgc = document.getElementById('filter-ugc');
    
    // Désactiver le système de filtrage original
    if (window.applyFilters) {
      window.originalApplyFilters = window.applyFilters;
      window.applyFilters = function() {
        applyFiltersDirectly();
      };
    }

    // Ajouter les gestionnaires d'événements pour les selects
    if (statusFilter) {
      statusFilter.addEventListener('change', applyFiltersDirectly);
    }
    
    if (attributeFilter) {
      attributeFilter.addEventListener('change', applyFiltersDirectly);
    }
    
    if (typeFilter) {
      typeFilter.addEventListener('change', applyFiltersDirectly);
    }
    
    // Ajouter le gestionnaire d'événement pour le bouton de réinitialisation
    if (resetFiltersButton) {
      resetFiltersButton.addEventListener('click', function() {
        // Réinitialiser tous les selects
        if (statusFilter) statusFilter.value = 'all';
        if (attributeFilter) attributeFilter.value = 'all';
        if (typeFilter) typeFilter.value = 'all';
        
        // Réinitialiser les checkboxes cachées
        if (filterAll) filterAll.checked = true;
        if (filterValid) filterValid.checked = false;
        if (filterBroken) filterBroken.checked = false;
        if (filterRedirects) filterRedirects.checked = false;
        if (filterSkipped) filterSkipped.checked = false;
        if (filterDofollow) filterDofollow.checked = false;
        if (filterNofollow) filterNofollow.checked = false;
        if (filterSponsored) filterSponsored.checked = false;
        if (filterUgc) filterUgc.checked = false;
        
        // Appliquer directement les filtres réinitialisés
        applyFiltersDirectly();
      });
    }
    
    // Appliquer les filtres initiaux
    applyFiltersDirectly();
  }
  
  // Fonction pour synchroniser les selects avec les checkboxes
  function syncSelectsWithCheckboxes() {
    // Suppression du log : console.log('Synchronisation des filtres - Valeurs sélectionnées:', {
    //   statut: statusFilter ? statusFilter.value : 'non disponible',
    //   attributs: attributeFilter ? attributeFilter.value : 'non disponible',
    //   type: typeFilter ? typeFilter.value : 'non disponible'
    // });
    
    // Vérifier que les checkboxes existent
    if (!filterAll || !filterValid || !filterBroken || !filterRedirects) {
      // Suppression du log : console.error('Certaines checkboxes n\'existent pas, impossible de synchroniser les filtres');
      return;
    }
    
    // Réinitialiser toutes les checkboxes
    filterAll.checked = true;
    filterValid.checked = false;
    filterBroken.checked = false;
    filterRedirects.checked = false;
    filterSkipped.checked = false;
    filterDofollow.checked = false;
    filterNofollow.checked = false;
    filterSponsored.checked = false;
    filterUgc.checked = false;
    
    // Appliquer les filtres de statut
    if (statusFilter && statusFilter.value !== 'all') {
      filterAll.checked = false;
      
      switch (statusFilter.value) {
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
          filterSkipped.checked = true;
          break;
      }
    }
    
    // Appliquer les filtres d'attributs
    if (attributeFilter && attributeFilter.value !== 'all') {
      filterAll.checked = false;
      
      switch (attributeFilter.value) {
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
      }
    }
    
    // Appliquer les filtres de type (interne/externe)
    if (typeFilter && typeFilter.value !== 'all') {
      // Note: Ces filtres ne sont pas directement mappés aux checkboxes existantes
      // Ils seront gérés dans la fonction de filtrage
      filterAll.checked = false;
    }
    
    // Afficher l'état des checkboxes après synchronisation
    // Suppression du log : console.log('État des checkboxes après synchronisation:', {
    //   all: filterAll.checked,
    //   valid: filterValid.checked,
    //   broken: filterBroken.checked,
    //   redirects: filterRedirects.checked,
    //   skipped: filterSkipped ? filterSkipped.checked : 'non disponible'
    // });
    
    // Déclencher manuellement un événement de changement sur les checkboxes
    // pour que le code existant détecte le changement
    const event = new Event('change');
    if (filterAll.checked) {
      filterAll.dispatchEvent(event);
    } else if (filterValid.checked) {
      filterValid.dispatchEvent(event);
    } else if (filterBroken.checked) {
      filterBroken.dispatchEvent(event);
    } else if (filterRedirects.checked) {
      filterRedirects.dispatchEvent(event);
    }
    
    // Déclencher l'application des filtres
    if (window.lastResults) {
      // Suppression du log : console.log('Application des filtres sur les résultats');
      window.generateResultsTable(window.lastResults);
    } else {
      // Suppression du log : console.warn('Aucun résultat disponible pour appliquer les filtres');
    }
  }
  
  // Fonction pour appliquer directement les filtres sans passer par les checkboxes
  function applyFiltersDirectly() {
    // Suppression du log : console.log('Application directe des filtres améliorés');
    
    if (!window.lastResults || !window.lastResults.links) {
      // Suppression du log : console.warn('Aucun résultat disponible pour appliquer les filtres');
      return;
    }
    
    // Déboguer les résultats disponibles
    // Suppression du log : console.log('Résultats disponibles:', {
    //   total: window.lastResults.links.length,
    //   exemple: window.lastResults.links.length > 0 ? window.lastResults.links[0] : null
    // });
    
    // Copier les résultats originaux
    const results = {...window.lastResults};
    let filteredLinks = [...results.links];
    
    // Déboguer les filtres actifs
    const activeFilters = {
      statut: statusFilter ? statusFilter.value : 'all',
      attributs: attributeFilter ? attributeFilter.value : 'all',
      type: typeFilter ? typeFilter.value : 'all'
    };
    // Suppression du log : console.log('Filtres actifs:', activeFilters);
    
    // Appliquer le filtre de statut
    if (statusFilter && statusFilter.value !== 'all') {
      // Suppression du log : console.log('Application du filtre de statut:', statusFilter.value);
      
      filteredLinks = filteredLinks.filter(link => {
        // Déterminer si le lien est ignoré en recalculant avec la même logique que dans linkChecker.js
        const isJsLink = link.url && link.url.startsWith('javascript:');
        const isMailtoLink = link.url && link.url.startsWith('mailto:');
        const isTelLink = link.url && link.url.startsWith('tel:');
        const isHashLink = link.url === '#';
        
        // Recalculer isSkipped pour être sûr, au lieu de se fier uniquement à la propriété isSkipped
        const isSkipped = link.isSkipped || isJsLink || isMailtoLink || isTelLink || isHashLink;
        
        // Déterminer le statut du lien
        const isBroken = link.status >= 400;
        const isRedirect = link.status >= 300 && link.status < 400;
        const isValid = link.status < 300 && !isSkipped;
        
        let matches = false;
        
        switch (statusFilter.value) {
          case 'valid':
            matches = isValid;
            break;
          case 'broken':
            matches = isBroken;
            break;
          case 'redirect':
            matches = isRedirect;
            break;
          case 'skipped':
            matches = isSkipped;
            break;
          default:
            matches = true;
        }
        
        return matches;
      });
      
      // Suppression du log : console.log(`Après filtre statut: ${filteredLinks.length} liens restants`);
    }
    
    // Appliquer le filtre d'attributs
    if (attributeFilter && attributeFilter.value !== 'all') {
      // Suppression du log : console.log('Application du filtre d\'attributs:', attributeFilter.value);
      
      filteredLinks = filteredLinks.filter(link => {
        const rel = link.rel || '';
        let matches = false;
        
        switch (attributeFilter.value) {
          case 'dofollow':
            matches = !rel.includes('nofollow') && !rel.includes('sponsored') && !rel.includes('ugc');
            break;
          case 'nofollow':
            matches = rel.includes('nofollow');
            break;
          case 'sponsored':
            matches = rel.includes('sponsored');
            break;
          case 'ugc':
            matches = rel.includes('ugc');
            break;
          default:
            matches = true;
        }
        
        return matches;
      });
      
      // Suppression du log : console.log(`Après filtre attributs: ${filteredLinks.length} liens restants`);
    }
    
    // Appliquer le filtre de type
    if (typeFilter && typeFilter.value !== 'all') {
      // Suppression du log : console.log('Application du filtre de type:', typeFilter.value);
      
      filteredLinks = filteredLinks.filter(link => {
        const matches = typeFilter.value === 'internal' ? !link.isExternal : link.isExternal;
        return matches;
      });
      
      // Suppression du log : console.log(`Après filtre type: ${filteredLinks.length} liens restants`);
    }
    
    // Appliquer le filtre de recherche si nécessaire
    const searchTerm = document.getElementById('search-links')?.value?.toLowerCase() || '';
    if (searchTerm.trim() !== '') {
      // Suppression du log : console.log('Application du filtre de recherche:', searchTerm);
      
      filteredLinks = filteredLinks.filter(link => {
        const url = link.url.toLowerCase();
        const anchor = (link.anchorText || '').toLowerCase();
        return url.includes(searchTerm) || anchor.includes(searchTerm);
      });
      
      // Suppression du log : console.log(`Après filtre recherche: ${filteredLinks.length} liens restants`);
    }
    
    // Afficher les liens filtrés pour débogage
    // Suppression du log : console.log(`Total après filtrage: ${filteredLinks.length} liens`);
    if (filteredLinks.length > 0) {
      // Suppression du log : console.log('Exemple de lien filtré:', filteredLinks[0]);
    }
    
    // Mettre à jour le compteur de résultats
    const filteredCountElement = document.getElementById('filtered-count');
    if (filteredCountElement) {
      filteredCountElement.textContent = filteredLinks.length;
    }
    
    // Générer le tableau avec les liens filtrés
    const resultsBody = document.getElementById('results-body');
    if (resultsBody) {
      resultsBody.innerHTML = '';
      
      if (filteredLinks.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4; // 4 colonnes dans le tableau
        cell.textContent = 'Aucun lien ne correspond aux filtres sélectionnés.';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        resultsBody.appendChild(row);
      } else {
        // Générer manuellement le tableau
        filteredLinks.forEach(link => {
          const row = document.createElement('tr');
          
          // Déterminer le type de lien
          const isJsLink = link.url && link.url.startsWith('javascript:');
          const isMailtoLink = link.url && link.url.startsWith('mailto:');
          const isTelLink = link.url && link.url.startsWith('tel:');
          const isHashLink = link.url === '#';
          
          // Recalculer isSkipped pour être sûr
          const isSkippedLink = link.isSkipped || isJsLink || isMailtoLink || isTelLink || isHashLink;
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
          
          // Tronquer le texte d'ancrage si nécessaire
          const maxAnchorLength = 50;
          
          const anchorText = link.anchorText || '[Pas de texte]';
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
            statusText = `Redirection (${link.status})`;
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
          }
          
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
    }
  }
  
  // Initialiser les filtres améliorés quand le DOM est prêt
  document.addEventListener('DOMContentLoaded', function() {
    // Suppression du log : console.log('Initialisation des filtres améliorés');
    
    initImprovedFilters();
    
    // Observer pour détecter quand les résultats sont chargés
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          const hasTable = Array.from(mutation.addedNodes).some(node => 
            node.nodeType === 1 && (node.querySelector('.results-table') || node.classList?.contains('results-table'))
          );
          
          if (hasTable) {
            setTimeout(() => {
              if (window.lastResults) {
                initImprovedFilters();
              }
            }, 100);
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
});
