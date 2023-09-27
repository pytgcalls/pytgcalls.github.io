class Sidebar {
  #onChangeListeners = [];

  #leftContainer;
  #leftSidebar;

  #searchBar;
  #searchResults;

  #hasIndexed = false;
  #hasLoaded = false;
  #isCurrentlyIndexing = false;
  #indexes = {};

  getElement() {
    const searchBar = this.#createSearchBar();
    const leftSidebar = document.createElement('div');
    leftSidebar.classList.add('left-sidebar', 'expanded');
    this.#leftSidebar = leftSidebar;
    const leftContainer = document.createElement('div');
    leftContainer.classList.add('left-container');
    leftContainer.appendChild(searchBar);
    leftContainer.appendChild(leftSidebar);
    this.#leftContainer = leftContainer;

    return leftContainer;
  }

  updateMobileVisibilityState(forcedState) {
    const state = this.#leftContainer.classList.toggle('show', forcedState);
    this.#leftSidebar.classList.add('expanded');
    this.#searchBar.classList.remove('expanded');
    return state;
  }
  
  #createSearchBar() {
    const searchIcon = document.createElement('img');
    searchIcon.src = '/src/icons/magnifyingGlass.svg';
    const searchText = document.createElement('input');
    searchText.placeholder = 'Search docs';
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

        const resultsFragment = document.createDocumentFragment();
        config.getAllFilesListFiles().then((files) => {
          let hasResults = false;

          for(const file of files) {
            const fileDataKeys = this.#indexes[file];

            const foundInName = file.toLowerCase().indexOf(text.toLowerCase()) !== -1;
            const foundInKeys = fileDataKeys.toLowerCase().indexOf(text.toLowerCase()) !== -1;
            
            if (foundInName || foundInKeys) {
              hasResults = true;
              resultsFragment.append(this.#createSingleSearchResult(file, fileDataKeys, foundInName, text));
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

      if (this.#isCurrentlyIndexing) {
        return;
      } else if (!this.#hasIndexed) {
        this.#handleSearchIndexing().then(() => {
          onSearchReady(input.value.trim());
        });
      } else {
        onSearchReady(input.value.trim());
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
      this.updateActiveFile(file);
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

  #handleSearchIndexing() {
    if (this.#hasIndexed) {
      return Promise.resolve();
    } else if (this.#isCurrentlyIndexing) {
      return Promise.reject();
    }

    return new Promise((resolve) => {
      this.#isCurrentlyIndexing = true;

      const indexingText = document.createElement('span');
      indexingText.textContent = 'Indexing... (0/0)';

      this.#searchResults.classList.add('is-loading');
      this.#searchResults.textContent = '';
      this.#searchResults.appendChild(utils.createLoadingItem(50));
      this.#searchResults.appendChild(indexingText);
      
      let i = 0;

      config.getAllFilesListFiles().then((files) => {
        const handleIndexingWithResponse = (i, file, response, status) => {
          indexingText.textContent = 'Indexing... (' + i + '/' + files.length + ')';
    
          if (status === 200) {
            this.#indexes[file] = sourceParser.handleSearchIndexByText(response);
          }
    
          if (i === files.length) {
            this.#isCurrentlyIndexing = false;
            this.#hasIndexed = true;
            resolve();
          }
        };

        for(const file of files) {
          //if (this.#indexes_caching[file]) {
          //  i++;
          //  handleIndexingWithResponse(i, file, this.#indexes_caching[file], 200);
          //} else {
            const XML = new XMLHttpRequest();
            XML.open('GET', 'https://raw.githubusercontent.com/pytgcalls/docsdata/master/' + file, true);
            setTimeout(() => XML.send(), i * 150);
            XML.addEventListener('readystatechange', (e) => {
              if (e.target.readyState === 4) {
                i++;
                handleIndexingWithResponse(i, file, e.target.response, e.target.status);
              }
            });
          //}
        }
      });
    });
  }

  loadSidebar(id) {
    this.#getPromiseBeforeLoadSidebar().then(() => {
      this.#hasLoaded = true;

      const content = this.#leftSidebar;
      content.textContent = '';
  
      config.getFilesListInstanceById(id).then((child) => {
        const fragment = document.createDocumentFragment();
        const basePathForMainFiles = child.getAttribute('basepath');

        const collapsedDomain = document.createElement('div');
        collapsedDomain.classList.add('collapsed');
        collapsedDomain.addEventListener('click', () => {
          this.#leftSidebar.classList.add('expanded');
          this.#searchBar.classList.remove('expanded');
        });
        collapsedDomain.textContent = 'Press here to expand';
        fragment.append(collapsedDomain);
  
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
      this.updateActiveFile(contentUri);
    });
    element.style.setProperty('--id', id);
    element.textContent = textContent;

    this.#onChangeListeners.push((activePath) => {
      element.classList.toggle('active', contentUri == activePath);
    });

    return element;
  }

  updateActiveFile(file) {
    for(const listener of this.#onChangeListeners) {
      try {
        listener(file);
      } catch(e) {}
    }
  }

  addOnSelectedFileUpdate(callback) {
    if (typeof callback === 'function') {
      this.#onChangeListeners.push(callback);
    }
  }
}