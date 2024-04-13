class Sidebar {
  onChangeListenerInstance;
  onCollapsedListenerInstance;

  #leftContainer;
  #leftSidebar;
  #sidebarSticky;

  #searchResults;
  #searchInputText;

  #currentLoadedSidebarId;
  #hasLoaded = false;

  constructor() {
    this.onChangeListenerInstance = new ListenerManagerInstance();
    this.onCollapsedListenerInstance = new ListenerManagerInstance();
  }

  getElement() {
    const { searchInput, searchResults } = this.#createSearchBar();
    const leftSidebar = document.createElement('div');
    leftSidebar.classList.add('left-sidebar', 'expanded');
    this.#leftSidebar = leftSidebar;

    const expandableIcon = document.createElement('img');
    expandableIcon.src = '/src/icons/tablecolumns.svg';
    const expandableButton = document.createElement('div');
    expandableButton.classList.add('expandable');
    expandableButton.addEventListener('click', () => {
      this.#leftContainer.classList.add('collapsed');
      this.onCollapsedListenerInstance.callAllListeners(true);
      this.killSearch();
    });
    expandableButton.appendChild(expandableIcon);

    const exploreTitle = document.createElement('div');
    exploreTitle.classList.add('explore');
    exploreTitle.textContent = 'Explore';

    const sidebarSticky = document.createElement('div');
    sidebarSticky.classList.add('sidebar-sticky');
    sidebarSticky.appendChild(expandableButton);
    sidebarSticky.appendChild(exploreTitle);
    sidebarSticky.appendChild(searchInput);
    this.#sidebarSticky = sidebarSticky;

    leftSidebar.addEventListener('scroll', () => {
      sidebarSticky.classList.toggle('use-mini-title', searchResults.classList.contains('expanded') || leftSidebar.scrollTop > 0);
    });

    const leftContainer = document.createElement('div');
    leftContainer.classList.add('left-container');
    leftContainer.appendChild(sidebarSticky);
    leftContainer.appendChild(searchResults);
    leftContainer.appendChild(leftSidebar);
    this.#leftContainer = leftContainer;

    return leftContainer;
  }

  focusOnSidebar() {
    this.#leftContainer.classList.remove('collapsed');
    this.onCollapsedListenerInstance.callAllListeners(false);
    this.killSearch();
  }

  killSearch() {
    this.#searchResults.classList.remove('expanded');
    this.#leftSidebar.classList.add('expanded');
    this.#searchResults.textContent = '';
    this.#searchInputText.value = '';
    this.#searchInputText.classList.add('is-empty');
    this.#sidebarSticky.classList.toggle('use-mini-title', this.#leftSidebar.scrollTop > 0);
  }

  updateMobileVisibilityState(forcedState) {
    this.focusOnSidebar();
    return this.#leftContainer.classList.toggle('show', forcedState);
  }

  updateDesktopCollapsedState(isCollapsed) {
    return this.#leftContainer.classList.toggle('collapsed', isCollapsed);
  }

  #createSearchBar() {
    const searchText = document.createElement('input');
    searchText.classList.add('is-empty');
    searchText.placeholder = 'Search...';
    this.#searchInputText = searchText;
    const searchCancelIcon = iconsManager.get('main', 'circlexmark');
    searchCancelIcon.classList.add('cancel');
    const searchInput = document.createElement('div');
    searchInput.classList.add('search-input');
    searchInput.appendChild(iconsManager.get('main', 'magnifyingGlass'));
    searchInput.appendChild(searchText);
    searchInput.appendChild(searchCancelIcon);

    const searchResults = document.createElement('div');
    searchResults.classList.add('search-results');
    this.#searchResults = searchResults;

    searchCancelIcon.addEventListener('click', () => this.killSearch());

    let wasExpanded = false;
    searchInput.addEventListener('input', () => {
      const expandSearchBar = !!searchText.value.trim().length;

      searchText.classList.toggle('is-empty', !expandSearchBar);
      searchResults.classList.toggle('expanded', expandSearchBar);
      this.#sidebarSticky.classList.toggle('use-mini-title', expandSearchBar);
      this.#leftSidebar.classList.toggle('expanded', !expandSearchBar);

      if (expandSearchBar && !wasExpanded) {
        searchResults.scrollTo(0, 0);
      }

      if (!expandSearchBar) {
        this.#sidebarSticky.classList.toggle('use-mini-title', this.#leftSidebar.scrollTop > 0);
      }

      wasExpanded = expandSearchBar;
      this.#handleSearchValue(searchText, searchResults);
    });

    return {
      searchInput,
      searchResults
    };
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

          for (const file of files) {
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
            const errorText = document.createElement('div');
            errorText.textContent = 'No results found.';
            const error = document.createElement('div');
            error.classList.add('error');
            error.appendChild(iconsManager.get('main', 'heartCrack'));
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
          this.#searchResults.classList.add('is-loading');
          this.#searchResults.textContent = '';
          this.#searchResults.appendChild(utils.createLoadingItem(50));

          indexesManager.initFull(() => { }).then(() => {
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

    const elementIcon = iconsManager.get('main', 'chevrondown');
    elementIcon.classList.add('right-icon');
    fileData.appendChild(elementIcon);

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

      if (debug.isSafeToUseDebugItems()) {
        content.appendChild(this.#composeDebugProperties());
      }

      this.#currentLoadedSidebarId = id;

      config.getFilesListInstanceById(id).then((child) => {
        const fragment = document.createDocumentFragment();
        const basePathForMainFiles = child.getAttribute('basepath');

        let i = 0;
        for (const file of child.childNodes) {
          if (file instanceof Element) {
            i++;

            switch (file.tagName.toUpperCase()) {
              case 'FILE':
                if (file.textContent !== '.xml' && file.textContent.endsWith('.xml')) {
                  fragment.append(this.#handleSidebarFile(file, i, basePathForMainFiles));
                }
                break;
              case 'MICROTAG':
                if (file.textContent.length) {
                  fragment.append(this.#handleSidebarMicrotag(file, i));
                }
                break;
              case 'GROUP':
                const groupFilesList = file.querySelectorAll('file');
                if (groupFilesList.length) {
                  const basePathForGroupFiles = file.getAttribute('basepath');

                  if (!basePathForGroupFiles) {
                    throw new Error("group elements require a basepath");
                  } else {
                    fragment.append(this.#handleSidebarGroup(i, basePathForMainFiles, basePathForGroupFiles, groupFilesList));
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

  #handleSidebarFile(file, i, basePathForMainFiles) {
    const fullPath = basePathForMainFiles ? (basePathForMainFiles + file.textContent) : undefined;

    const element = this.#createSidebarFileElement(
      i.toString(),
      utils.parseCategoryName(file.textContent).replace(basePathForMainFiles ?? '', ''),
      fullPath
    );

    return element;
  }

  #handleSidebarMicrotag(file, i) {
    const element = document.createElement('div');
    element.classList.add('microtag');
    element.style.setProperty('--id', i.toString());
    element.textContent = file.textContent;

    return element;
  }

  #handleSidebarGroup(i, basePathForMainFiles, basePathForGroupFiles, groupFilesList) {
    const elementText = document.createElement('div');
    elementText.classList.add('text');
    elementText.textContent = utils.parseCategoryName(basePathForGroupFiles).replace(basePathForMainFiles ?? '', '');
    const element = document.createElement('div');
    element.classList.add('element');
    element.appendChild(elementText);
    element.appendChild(iconsManager.get('main', 'chevrondown'));

    const elementsGroup = document.createElement('div');
    elementsGroup.classList.add('elements');
    elementsGroup.style.setProperty('--id', i.toString());
    elementsGroup.appendChild(element);

    for (const file of groupFilesList) {
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

    return elementsGroup;
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

  #composeDebugProperties() {
    if (!debug.isSafeToUseDebugItems()) {
      return document.createDocumentFragment();
    }

    const elementText = document.createElement('div');
    elementText.classList.add('text');
    elementText.textContent = 'Internal debug options';
    const element = document.createElement('div');
    element.classList.add('element');
    element.appendChild(elementText);
    element.appendChild(iconsManager.get('main', 'chevrondown'));

    const elementsGroup = document.createElement('div');
    elementsGroup.classList.add('elements');
    elementsGroup.style.setProperty('--id', 0);
    elementsGroup.appendChild(element);

    const customCodeElement = document.createElement('div');
    customCodeElement.classList.add('element');
    customCodeElement.addEventListener('click', () => debug.tryCustomPageCode(false));
    customCodeElement.style.setProperty('--id', 1);
    customCodeElement.textContent = 'Try custom page code';
    elementsGroup.append(customCodeElement);

    const customConfigElement = document.createElement('div');
    customConfigElement.classList.add('element');
    customConfigElement.addEventListener('click', () => debug.tryCustomPageCode(true));
    customConfigElement.style.setProperty('--id', 2);
    customConfigElement.textContent = 'Try custom config code';
    elementsGroup.append(customConfigElement);

    const customDataDocsServer = document.createElement('div');
    customDataDocsServer.classList.add('element');
    customDataDocsServer.addEventListener('click', () => debug.tryCustomServer());
    customDataDocsServer.style.setProperty('--id', 3);
    customDataDocsServer.textContent = 'Try custom server';
    elementsGroup.append(customDataDocsServer);

    const reloadPage = document.createElement('div');
    reloadPage.classList.add('element');
    reloadPage.addEventListener('click', () => debug.reloadPageData());
    reloadPage.style.setProperty('--id', 4);
    reloadPage.textContent = 'Reload page data';
    elementsGroup.append(reloadPage);

    elementsGroup.style.setProperty('--items', '5');
    element.addEventListener('click', () => elementsGroup.classList.toggle('expanded'));

    return elementsGroup;
  }

  updateActiveFile(file) {
    this.onChangeListenerInstance.callInternalListeners(file);
  }

  #globalUpdateActiveFile(file) {
    this.onChangeListenerInstance.callAllListeners(file);
  }
}