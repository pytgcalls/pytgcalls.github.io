class Sidebar {
  onChangeListenerInstance;

  #leftContainer;
  #leftSidebar;

  #searchBar;
  #searchResults;

  #currentLoadedSidebarId;
  #hasLoaded = false;

  constructor() {
    this.onChangeListenerInstance = new ListenerManagerInstance();
  }

  getElement() {
    const searchBar = this.#createSearchBar();
    const leftSidebar = document.createElement('div');
    leftSidebar.classList.add('left-sidebar', 'expanded');
    this.#leftSidebar = leftSidebar;

    const exploreTitle = document.createElement('div');
    exploreTitle.classList.add('explore');
    exploreTitle.textContent = 'Explore';

    const leftContainer = document.createElement('div');
    leftContainer.classList.add('left-container');
    leftContainer.appendChild(exploreTitle);
    leftContainer.appendChild(searchBar);
    leftContainer.appendChild(leftSidebar);
    this.#leftContainer = leftContainer;

    return leftContainer;
  }

  focusOnSidebar() {
    this.#leftContainer.classList.remove('collapsed');
    this.#leftSidebar.classList.add('expanded');
    this.#searchBar.classList.remove('expanded');
  }

  updateMobileVisibilityState(forcedState) {
    this.focusOnSidebar();
    return this.#leftContainer.classList.toggle('show', forcedState);
  }
  
  #createSearchBar() {
    const searchIcon = document.createElement('img');
    searchIcon.src = '/src/icons/magnifyingGlass.svg';
    const searchText = document.createElement('input');
    searchText.placeholder = 'Search...';
    const searchInput = document.createElement('div');
    searchInput.classList.add('search-input');
    searchInput.appendChild(searchIcon);
    searchInput.appendChild(searchText);

    const searchResults = document.createElement('div');
    searchResults.classList.add('results');
    this.#searchResults = searchResults;

    const searchBar = document.createElement('div');
    searchBar.classList.add('search-bar');
    searchBar.appendChild(searchInput);
    searchBar.appendChild(searchResults);
    this.#searchBar = searchBar;

    searchInput.addEventListener('input', () => {
      const expandSearchBar = !!searchText.value.trim().length;

      searchBar.classList.toggle('expanded', expandSearchBar);
      this.#leftSidebar.classList.toggle('expanded', !expandSearchBar);
      expandSearchBar && this.#leftSidebar.scrollTo(0, 0);

      this.#handleSearchValue(searchText, searchResults);
    });

    return searchBar;
  }
  
  #handleSearchValue(input, results) {
    config.loadConfig().then(() => {
      const onSearchReady = (text) => {
        if (!text.length) {
          results.textContent = '';
          results.classList.remove('is-loading');
          return;
        }

        let promise;
        if (typeof this.#currentLoadedSidebarId == 'undefined') {
          promise = config.getAllFilesListFiles();
        } else {
          promise = config.getAllFilesListFilesById(this.#currentLoadedSidebarId);
        }

        const resultsFragment = document.createDocumentFragment();
        promise.then((files) => {
          let hasResults = false;

          for(const file of files) {
            const fileDataKeys = indexesManager.getIndexedValue(file);
            
            if (typeof fileDataKeys != 'undefined') {
              const foundInName = file.toLowerCase().indexOf(text.toLowerCase()) !== -1;
              const foundInKeys = fileDataKeys.toLowerCase().indexOf(text.toLowerCase()) !== -1;
              
              if (foundInName || foundInKeys) {
                hasResults = true;
                resultsFragment.append(this.#createSingleSearchResult(file, fileDataKeys, foundInName, text));
              }
            }
          }

          if (!hasResults) {
            const errorImage = document.createElement('img');
            errorImage.classList.add('image');
            errorImage.src = '/src/icons/heartCrack.svg';
            const errorText = document.createElement('div');
            errorText.textContent = 'No results found.';
            const error = document.createElement('div');
            error.classList.add('error');
            error.appendChild(errorImage);
            error.appendChild(errorText);
            resultsFragment.append(error);
          }

          results.textContent = '';
          results.classList.toggle('is-loading', !hasResults);
          results.appendChild(resultsFragment);
        });
      };

      if (!indexesManager.isCurrentlyIndexing()) {
        if (!indexesManager.hasIndexed()) {
          const indexingText = document.createElement('span');
          indexingText.textContent = 'Indexing... (0/0)';

          this.#searchResults.classList.add('is-loading');
          this.#searchResults.textContent = '';
          this.#searchResults.appendChild(utils.createLoadingItem(50));
          this.#searchResults.appendChild(indexingText);

          indexesManager.initFull((i, length) => {
            indexingText.textContent = 'Indexing... (' + i + '/' + length + ')';
          }).then(() => {
            onSearchReady(input.value.trim());
          });
        } else {
          onSearchReady(input.value.trim());
        }
      }
    });
  }

  #createSingleSearchResult(file, fileDataKeys, foundInName, text) {  
    const fileDataTitle = document.createElement('div');
    fileDataTitle.classList.add('file-data-title');
    fileDataTitle.textContent = utils.parseCategoryName(file.replaceAll('/', ' > '));
    const fileData = document.createElement('div');
    fileData.classList.add('file-data');
    fileData.addEventListener('click', () => {
      this.#globalUpdateActiveFile(file);
    });
    fileData.appendChild(fileDataTitle);

    if (!foundInName) {
      const splitting = fileDataKeys.toLowerCase().split(text.toLowerCase());
      const beforeSplitting = utils.splitSearchResult(splitting[0], true);
      const afterSplitting = utils.splitSearchResult(splitting[1], false);

      const highlightedWord = document.createElement('span');
      highlightedWord.classList.add('highlighted');
      highlightedWord.textContent = text;
      const fileDataDescription = document.createElement('div');
      fileDataDescription.classList.add('file-data-description');
      fileDataDescription.appendChild(document.createTextNode(beforeSplitting));
      fileDataDescription.appendChild(highlightedWord);
      fileDataDescription.appendChild(document.createTextNode(afterSplitting));
      fileData.appendChild(fileDataDescription);
    }
    
    return fileData;
  };

  loadSidebar(id) {
    if (this.#currentLoadedSidebarId === id) {
      return Promise.resolve();
    }

    const promise = this.#getPromiseBeforeLoadSidebar();

    promise.then(() => {
      this.#hasLoaded = true;

      const content = this.#leftSidebar;
      content.textContent = '';

      this.#currentLoadedSidebarId = id;
  
      config.getFilesListInstanceById(id).then((child) => {
        const fragment = document.createDocumentFragment();
        const basePathForMainFiles = child.getAttribute('basepath');
  
        let i = 0;
        for(const file of child.childNodes) {
          if (file instanceof Element) {
            i++;
  
            switch (file.tagName.toUpperCase()) {
              case 'FILE':
                if (file.textContent !== '.xml' && file.textContent.endsWith('.xml')) {
                  this.#handleSidebarFile(fragment, file, i, basePathForMainFiles);
                }
              break;
              case 'MICROTAG':
                if (file.textContent.length) {
                  this.#handleSidebarMicrotag(fragment, file, i);
                }
              break;
              case 'GROUP':
                const groupFilesList = file.querySelectorAll('file');
                if (groupFilesList.length) {
                  const basePathForGroupFiles = file.getAttribute('basepath');
  
                  if (!basePathForGroupFiles) {
                    throw new Error("group elements require a basepath");
                  } else {
                    this.#handleSidebarGroup(fragment, file, i, basePathForMainFiles, basePathForGroupFiles, groupFilesList);
                  }
                }
              break;
            }
          }
        }
  
        content.appendChild(fragment);
      });
    });

    return promise;
  }

  #getPromiseBeforeLoadSidebar() {
    if (!this.#hasLoaded) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        this.#leftSidebar.classList.add('faster');
        this.#leftSidebar.classList.add('disappear');
        this.#leftSidebar.lastChild.addEventListener('animationend', () => {
          this.#leftSidebar.classList.remove('disappear');
          resolve();
        }, { once: true });
      });
    }
  }

  #handleSidebarFile(sidebar, file, i, basePathForMainFiles) {
    const fullPath = basePathForMainFiles ? (basePathForMainFiles + file.textContent) : undefined;

    const element = this.#createSidebarFileElement(
      i.toString(),
      utils.parseCategoryName(file.textContent).replace(basePathForMainFiles ?? '', ''),
      fullPath
    );

    sidebar.append(element);
  }
  
  #handleSidebarMicrotag(sidebar, file, i) {
    const element = document.createElement('div');
    element.classList.add('microtag');
    element.style.setProperty('--id', i.toString());
    element.textContent = file.textContent;
    sidebar.append(element);
  }

  #handleSidebarGroup(sidebar, file, i, basePathForMainFiles, basePathForGroupFiles, groupFilesList) {
    const elementText = document.createElement('div');
    elementText.classList.add('text');
    elementText.textContent = utils.parseCategoryName(basePathForGroupFiles).replace(basePathForMainFiles ?? '', '');
    const elementIcon = document.createElement('img');
    elementIcon.src = '/src/icons/chevrondown.svg';
    const element = document.createElement('div');
    element.classList.add('element');
    element.appendChild(elementText);
    element.appendChild(elementIcon);

    const elementsGroup = document.createElement('div');
    elementsGroup.classList.add('elements');
    elementsGroup.style.setProperty('--id', i.toString());
    elementsGroup.appendChild(element);

    for(const file of groupFilesList) {
      let fullPath = basePathForGroupFiles + file.textContent;

      const element = this.#createSidebarFileElement(
        i.toString(), 
        utils.parseCategoryName(file.textContent).replace(basePathForGroupFiles ?? '', ''),
        fullPath,
      );
      elementsGroup.append(element);
    }

    elementsGroup.style.setProperty('--items', elementsGroup.childNodes.length.toString());
    element.addEventListener('click', () => elementsGroup.classList.toggle('expanded'));

    sidebar.append(elementsGroup);
  }

  #createSidebarFileElement(id, textContent, contentUri = textContent) {
    const element = document.createElement('div');
    element.classList.add('element');
    element.addEventListener('click', () => {
      this.#globalUpdateActiveFile(contentUri);
    });
    element.style.setProperty('--id', id);
    element.textContent = textContent;

    this.onChangeListenerInstance.addListener({
      callback: (activePath) => {
        element.classList.toggle('active', contentUri === activePath);
      },
      isInternal: true,
      ref: element
    });

    return element;
  }

  updateActiveFile(file) {
    this.onChangeListenerInstance.callInternalListeners(file);
  }

  #globalUpdateActiveFile(file) {
    this.onChangeListenerInstance.callAllListeners(file);
  }
}