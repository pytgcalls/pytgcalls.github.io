class HomePage {
  #COLORS = ['red', 'green', 'blue', 'yellow'];

  #leftSidebar;
  #leftContainer;
  #content;
  #pageSections;
  #headerDescription;
  #headerMenu;
  #precachedResponse;
  #selectedElement;
  #searchBar;
  #currentlyTabId;

  #hasIndexed = false;
  #isCurrentlyIndexing = false;
  #indexes = {};
  #indexes_caching = {};

  init() {
    document.body.innerHTML = '';

    const headerMenu = document.createElement('div');
    headerMenu.classList.add('menu');
    headerMenu.addEventListener('click', () => {
      const state = leftContainer.classList.toggle('show');
      headerMenu.classList.toggle('show', state);
    });
    headerMenu.appendChild(document.createElement('div'));
    headerMenu.appendChild(document.createElement('div'));
    headerMenu.appendChild(document.createElement('div'));
    this.#headerMenu = headerMenu;
    const headerIcon = document.createElement('img');
    headerIcon.src = 'src/assets/splash/telegram-logo.svg';
    const headerTitle = document.createElement('div');
    headerTitle.classList.add('title');
    headerTitle.textContent = 'NTgCalls';
    headerTitle.appendChild(headerIcon);
    const headerDescription = document.createElement('div');
    headerDescription.classList.add('description');
    const header = document.createElement('div');
    header.classList.add('header');
    header.appendChild(headerMenu);
    header.appendChild(headerTitle);
    header.appendChild(headerDescription);

    this.#headerDescription = headerDescription;

    const leftSidebar = document.createElement('div');
    leftSidebar.classList.add('left-sidebar', 'expanded');
    this.#leftSidebar = leftSidebar;
    const searchBar = this.#createSidebarSearchBar();
    const leftContainer = document.createElement('div');
    leftContainer.classList.add('left-container');
    leftContainer.appendChild(searchBar);
    leftContainer.appendChild(leftSidebar);
    this.#leftContainer = leftContainer;

    const content = document.createElement('div');
    content.classList.add('content');
    this.#content = content;

    const pageSections = document.createElement('div');
    pageSections.classList.add('sections');
    this.#pageSections = pageSections;

    const pageContainer = document.createElement('div');
    pageContainer.classList.add('page-container');
    pageContainer.appendChild(leftContainer);
    pageContainer.appendChild(content);
    pageContainer.appendChild(pageSections);
    
    document.body.appendChild(header);
    document.body.appendChild(pageContainer);

    for(let i = 0; i < 4; i++) {
      if (this.#COLORS[i]) {
        const randomX = Math.floor(Math.random() * 100);
        const randomY = Math.floor(Math.random() * 100);

        const shadowElement = document.createElement('div');
        shadowElement.classList.add('shadow-element');
        shadowElement.style.setProperty('--x', randomX.toString() + '%');
        shadowElement.style.setProperty('--y', randomY.toString() + '%');
        shadowElement.style.setProperty('--color', this.#COLORS[i]);
        document.body.appendChild(shadowElement);
      }
    }

    this.#loadSidebar('PyTgCalls');
  }

  #createPageTabs() {
    if (typeof this.#precachedResponse != 'undefined') {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(this.#precachedResponse, 'application/xml');
      const filesListElements = dom.querySelectorAll('config > files-list');

      let selectedTabElement;

      const tabsContainer = document.createElement('div');
      tabsContainer.classList.add('tabs');

      for(const [id, file] of filesListElements.entries()) {
        if (file.hasAttribute('id')) {
          const tab = document.createElement('div');
          tab.classList.add('tab');
          tab.addEventListener('click', () => {
            if (typeof selectedTabElement != 'undefined') {
              if (selectedTabElement == tab) {
                return;
              }

              selectedTabElement.classList.remove('active');
            }

            this.#switchSidebarWithAnimation(file.getAttribute('id'));
            selectedTabElement = tab;
            tabsContainer.style.setProperty('--id', id.toString());
            tab.classList.add('active');
            
            this.#leftSidebar.classList.add('expanded');
            this.#searchBar.classList.remove('expanded');
          });
          tab.textContent = file.getAttribute('id');
          tabsContainer.append(tab);

          if (!id) {
            tab.classList.add('active');
            selectedTabElement = tab;
            tabsContainer.style.setProperty('--id', id.toString());
            this.#loadSidebar(file.getAttribute('id'));
          }
        }
      }
      
      return tabsContainer;
    }

    return document.createDocumentFragment();
  }

  #switchSidebarWithAnimation(id) {
    const content = this.#createCustomContent();
    content.textContent = '';
    
    const pageSections = this.#createCustomPageSections();
    pageSections.textContent = '';

    this.#leftSidebar.classList.add('faster');
    this.#leftSidebar.classList.add('disappear');
    this.#leftSidebar.lastChild.addEventListener('animationend', () => {
      this.#leftSidebar.classList.remove('disappear');
      this.#loadSidebar(id);
    }, { once: true });
  }

  #loadSidebar(id) {
    const content = this.#leftSidebar;

    content.classList.add('is-loading');
    content.textContent = '';
    content.appendChild(utils.createLoadingItem());

    if (typeof this.#precachedResponse != 'undefined') {
      this.#currentlyTabId = id;
      this.#handleResponseWithContent(this.#precachedResponse, content, id);
    } else {
      content.addEventListener('animationend', () => {
        const XML = new XMLHttpRequest();
        XML.open('GET', 'https://raw.githubusercontent.com/pytgcalls/docsdata/master/config.xml?cache='+String(Math.random()), true);
        XML.send();
        XML.addEventListener('readystatechange', (e) => {
          if (e.target.readyState == 4 && e.target.status == 200) {
            this.#precachedResponse = e.target.response;
            this.#headerDescription.appendChild(this.#createPageTabs());
          }
        });
      }, { once: true });
    }
  }

  #createSidebarSearchBar() {
    const searchIcon = document.createElement('img');
    searchIcon.src = '/src/icons/magnifyingGlass.svg';
    const searchText = document.createElement('input');
    searchText.placeholder = 'Your text';
    const searchInput = document.createElement('div');
    searchInput.classList.add('search-input');
    searchInput.appendChild(searchIcon);
    searchInput.appendChild(searchText);

    const searchResults = document.createElement('div');
    searchResults.classList.add('results');

    const searchBar = document.createElement('div');
    searchBar.classList.add('search-bar');
    searchBar.appendChild(searchInput);
    searchBar.appendChild(searchResults);
    this.#searchBar = searchBar;

    searchInput.addEventListener('input', () => {
      const useInputValueAsRef = window.innerWidth < 1330;

      if (useInputValueAsRef) {
        searchBar.classList.toggle('expanded', !!searchText.value.trim().length);
        this.#leftSidebar.classList.toggle('expanded', !searchText.value.trim().length);
      }

      this.#handleSearchValue(searchText, searchResults);
    });

    searchInput.addEventListener('focusin', () => {
      const useInputValueAsRef = window.innerWidth < 1330;
      if (!useInputValueAsRef) {
        searchBar.classList.add('expanded');
        this.#leftSidebar.classList.remove('expanded');
      }
    });

    searchInput.addEventListener('focusout', () => {
      const useInputValueAsRef = window.innerWidth < 1330;
      if (!useInputValueAsRef) {
        searchBar.classList.remove('expanded');
        this.#leftSidebar.classList.add('expanded');
      }
    });

    return searchBar;
  }

  #handleSearchValue(input, results) {
    if (typeof this.#precachedResponse == 'undefined') {
      return;
    }

    const domHelper = new DOMParser();
    const dom = domHelper.parseFromString(this.#precachedResponse, 'application/xml');

    const onSearchReady = (text) => {
      const resultsFragment = document.createDocumentFragment();

      const filesListElement = dom.querySelector('config > files-list[id="' + this.#currentlyTabId + '"]');
      if (!filesListElement) {
        throw new Error("Can't handle files-list element");
      }

      let hasResults = false;

      for(const file in this.#indexes) {
        if (!file.startsWith(filesListElement.getAttribute('basepath'))) {
          continue;
        }

        const fileDataKeys = this.#indexes[file];

        const foundInName = file.toLowerCase().indexOf(text.toLowerCase()) != -1;
        const foundInKeys = fileDataKeys.toLowerCase().indexOf(text.toLowerCase()) != -1;
        
        if (foundInName || foundInKeys) {
          hasResults = true;

          const fileDataTitle = document.createElement('div');
          fileDataTitle.classList.add('file-data-title');
          fileDataTitle.textContent = this.#parseCategoryName(file.replaceAll('/', ' > '));
          const fileData = document.createElement('div');
          fileData.classList.add('file-data');
          fileData.addEventListener('click', () => {
            this.#loadContent(file);
          });
          fileData.appendChild(fileDataTitle);

          if (!foundInName) {
            const splitting = fileDataKeys.toLowerCase().split(text.toLowerCase());
            const beforeSplitting = this.#splitSearchResult(splitting[0], true);
            const afterSplitting = this.#splitSearchResult(splitting[1], false);

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
          
          resultsFragment.appendChild(fileData);
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
    };

    if (this.#isCurrentlyIndexing) {
      return;
    } else if (!this.#hasIndexed) {
      if (typeof this.#precachedResponse != 'undefined') {
        this.#isCurrentlyIndexing = true;

        const indexingText = document.createElement('span');
        indexingText.textContent = 'Indexing... (0/0)';

        results.classList.add('is-loading');
        results.textContent = '';
        results.appendChild(utils.createLoadingItem(50));
        results.appendChild(indexingText);

        const filesListElements = dom.querySelectorAll('config > files-list file');

        indexingText.textContent = 'Indexing... (0/' + filesListElements.length + ')';
        
        const handleIndexingWithResponse = (i, fullPath, response, status) => {
          indexingText.textContent = 'Indexing... (' + i + '/' + filesListElements.length + ')';

          if (status == 200) {
            this.#indexes[fullPath] = sourceParser.handleSearchIndexByText(response);
            this.#indexes_caching[fullPath] = response;
          }

          if (i == filesListElements.length) {
            this.#isCurrentlyIndexing = false;
            this.#hasIndexed = true;
            
            if (input.value.trim().length) {
              onSearchReady(input.value.trim());
            }
          }
        };

        let i = 0;
        for(const [id, file] of filesListElements.entries()) {
          let fullPath = file.textContent;

          if (file.parentElement.hasAttribute('basepath')) {
            fullPath = file.parentElement.getAttribute('basepath') + file.textContent;
          }

          if (this.#indexes_caching[fullPath]) {
            i++;
            handleIndexingWithResponse(i, fullPath, this.#indexes_caching[fullPath], 200);
          } else {
            const XML = new XMLHttpRequest();
            XML.open('GET', 'https://raw.githubusercontent.com/pytgcalls/docsdata/master/' + fullPath, true);
            
            setTimeout(() => {
              XML.send();
            }, 5 * id);

            XML.addEventListener('readystatechange', (e) => {
              if (e.target.readyState == 4) {
                i++;
                handleIndexingWithResponse(i, fullPath, e.target.response, e.target.status);
              }
            });
          }
        }
      }
    } else if(input.value.trim().length) {
      onSearchReady(input.value.trim());
    }
  }

  #splitSearchResult(text, isZeroSplit = false) {
    if (isZeroSplit) {
      let newText = text.split("").reverse().join("");

      if (newText.length > 30) {
        newText = '...' + newText.slice(0, 30).split("").reverse().join("");
      }

      return newText;
    } else {
      if (text.length > 30) {
        text = text.slice(0, 30) + '...';
      }

      return text;
    }
  }

  #handleResponseWithContent(response, content, id) {
    const domHelper = new DOMParser();
    const dom = domHelper.parseFromString(response, 'application/xml');

    const listFragment = document.createDocumentFragment();

    const currentFilesListElement = dom.querySelector('config > files-list[id="'+id+'"]');
    const basePathForMainFiles = currentFilesListElement.getAttribute('basepath');

    const collapsedDomain = document.createElement('div');
    collapsedDomain.classList.add('collapsed');
    collapsedDomain.addEventListener('click', () => {
      this.#leftSidebar.classList.add('expanded');
      this.#searchBar.classList.remove('expanded');
    });
    collapsedDomain.textContent = 'Press here to expand';
    listFragment.append(collapsedDomain);

    let i = 0;
    for(const file of currentFilesListElement.childNodes) {
      if (file instanceof Element) {
        i++;

        switch (file.tagName.toUpperCase()) {
          case 'FILE':
            if (file.textContent != '.xml' && file.textContent.endsWith('.xml')) {
              listFragment.append(this.#createSidebarFileElement(
                i.toString(),
                this.#parseCategoryName(file.textContent).replace(basePathForMainFiles ?? '', ''),
                basePathForMainFiles ? (basePathForMainFiles + file.textContent) : undefined
              ));
            }
          break;
          case 'MICROTAG':
            if (file.textContent.length) {
              const element = document.createElement('div');
              element.classList.add('microtag');
              element.style.setProperty('--id', i.toString());
              element.textContent = file.textContent;
              listFragment.append(element);
            }
          break;
          case 'GROUP':
            const groupFilesList = file.querySelectorAll('file');
            if (groupFilesList.length) {
              const basePathForGroupFiles = file.getAttribute('basepath');

              if (!basePathForGroupFiles) {
                throw new Error("group elements require a basepath");
              } else {
                const elementText = document.createElement('div');
                elementText.classList.add('text');
                elementText.textContent = this.#parseCategoryName(basePathForGroupFiles).replace(basePathForMainFiles ?? '', '');
                const elementIcon = document.createElement('img');
                elementIcon.src = 'src/icons/chevrondown.svg';
                const element = document.createElement('div');
                element.classList.add('element');
                element.appendChild(elementText);
                element.appendChild(elementIcon);

                const elementsGroup = document.createElement('div');
                elementsGroup.classList.add('elements');
                elementsGroup.style.setProperty('--id', i.toString());
                elementsGroup.appendChild(element);

                for(const file of groupFilesList) {
                  elementsGroup.append(this.#createSidebarFileElement(
                    i.toString(), 
                    this.#parseCategoryName(file.textContent).replace(basePathForGroupFiles ?? '', ''),
                    basePathForGroupFiles + file.textContent
                  ));
                }

                elementsGroup.style.setProperty('--items', elementsGroup.childNodes.length.toString());
                element.addEventListener('click', () => elementsGroup.classList.toggle('expanded'));

                listFragment.append(elementsGroup);
              }
            }
          break;
        }
      }
    }

    let element = document.createElement('div');
    element.classList.add('microtag');
    element.style.setProperty('--id', (i++).toString());
    element.textContent = 'DEVELOPMENT';
    listFragment.append(element);
    
    element = document.createElement('div');
    element.classList.add('element');
    element.style.setProperty('--id', (i++).toString());
    element.addEventListener('click', () => {
      if (typeof this.#selectedElement != 'undefined') {
        if (this.#selectedElement == element) {
          return;
        }

        this.#selectedElement.classList.remove('active');
      }
      
      element.classList.add('active');
      this.#selectedElement = element;
      this.#tryCustomCode();
    });
    element.textContent = 'Add your custom code';
    listFragment.append(element);
    
    content.textContent = '';
    content.classList.remove('is-loading');
    content.appendChild(listFragment);
    sourceParser.saveAsConfigFromDom(dom);
  }

  #createSidebarFileElement(id, textContent, contentUri = textContent) {
    const element = document.createElement('div');
    element.classList.add('element');
    element.addEventListener('click', () => {
      if (typeof this.#selectedElement != 'undefined') {
        if (this.#selectedElement == element) {
          return;
        }

        this.#selectedElement.classList.remove('active');
      }

      element.classList.add('active');
      this.#loadContent(contentUri);
      this.#selectedElement = element;
    });
    element.style.setProperty('--id', id);
    element.textContent = textContent;
    return element;
  }

  #createCustomContent() {
    const content = document.createElement('div');
    content.classList.add('content', 'is-loading');
    content.appendChild(utils.createLoadingItem());

    this.#content.replaceWith(content);
    this.#content = content;

    return content;
  }

  #createCustomPageSections() {
    const pageSections = document.createElement('div');
    pageSections.classList.add('sections', 'is-loading');
    pageSections.appendChild(utils.createLoadingItem());

    this.#pageSections.replaceWith(pageSections);
    this.#pageSections = pageSections;

    return pageSections;
  }

  #loadContent(fileName) {
    const content = this.#createCustomContent();
    const pageSections = this.#createCustomPageSections();

    this.#leftContainer.classList.remove('show');
    this.#headerMenu.classList.remove('show');

    if (this.#indexes_caching[fileName]) {
      this.#handleResponse(content, pageSections, this.#indexes_caching[fileName]);
    } else {
      const XML = new XMLHttpRequest();
      XML.open('GET', 'https://raw.githubusercontent.com/pytgcalls/docsdata/master/' + fileName, true);
      XML.send();
      XML.addEventListener('readystatechange', (e) => {
        if (e.target.readyState == 4 && e.target.status == 200) {
          this.#indexes_caching[fileName] = e.target.response;
          this.#handleResponse(content, pageSections, e.target.response);
        }
      });
    }
  }

  #handleResponse(content, pageSections, response) {
    try {
      const data = sourceParser.getContentByData(response);
      content.classList.remove('is-loading');
      content.textContent = '';
      content.appendChild(data);

      const sectionsFragment = document.createDocumentFragment();
      this.#iterPageSectionsData(data, sectionsFragment);
      pageSections.classList.remove('is-loading');
      pageSections.textContent = '';
      pageSections.appendChild(sectionsFragment);
    } catch(e) {
      content.classList.add('is-loading');
      content.textContent = 'Rendering failed';
      pageSections.classList.add('is-loading');
      pageSections.textContent = '';

      throw e;
    }
  }

  #tryCustomCode() {
    const content = this.#createCustomContent();
    content.classList.add('is-loading');
    content.textContent = '';

    const pageSections = this.#createCustomPageSections();
    pageSections.textContent = '';
    
    const inputElement = document.createElement('textarea');
    inputElement.placeholder = 'Your source';
    const button = document.createElement('div');
    button.classList.add('button');
    button.textContent = 'Try this XML source';
    const tryContainer = document.createElement('div');
    tryContainer.classList.add('try-container');
    tryContainer.appendChild(inputElement);
    tryContainer.appendChild(button);
    content.appendChild(tryContainer);

    button.addEventListener('click', () => {
      if (inputElement.value.length) {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(inputElement.value, 'application/xml');
        if (dom.querySelector('config > option')) {
          sourceParser.saveAsConfigFromDom(dom);
          alert('Config updated. Files list wont change');
          inputElement.value = '';
        } else {
          const content = this.#createCustomContent();
          this.#handleResponse(content, pageSections, inputElement.value);
        }
      }
    });
  }

  #parseCategoryName(fileName) {
    if (fileName.endsWith('.xml')) {
      fileName = fileName.slice(0, -4);
    }

    if (fileName.endsWith('/')) {
      fileName = fileName.slice(0, -1);
    }

    return fileName;
  }

  #iterPageSectionsData(container, currentDom, childsLimit = Infinity) {
    for(const [id, element] of container.childNodes.entries()) {
      if (id > childsLimit) {
        break;
      }

      if (element instanceof Element) {
        if (element.getAttribute('noref') == 'true') {
          continue;
        }

        if (element.tagName.toUpperCase() == 'TD' || (element.classList.length && ['H1', 'H2', 'H3', 'CATEGORY-TITLE', 'PG-TITLE'].includes(element.classList[0].toUpperCase()))) {
          let cloned = element.cloneNode(true);

          if (element.tagName.toUpperCase() == 'TD') {
            cloned = document.createElement('div');
            cloned.classList.add('pg-title');
          }

          cloned.addEventListener('click', () => {
            element.scrollIntoView({ behavior: 'smooth' });
          });

          let hasRefElement = false;
          for(const child of element.childNodes) {
            if (child instanceof Element && child.classList.contains('ref')) {
              let hasSbElement = false;
              for(const sb of child.childNodes) {
                if (sb instanceof Element && sb.classList.contains('sb')) {
                  hasSbElement = true;
                  cloned.innerHTML = sb.textContent;
                }
              }

              hasRefElement = true;
              if (!hasSbElement) {
                cloned.innerHTML = child.textContent;
              }
            }
          }

          if (!hasRefElement) {
            cloned.innerHTML = element.textContent;
          }

          currentDom.append(cloned);
        } else if(element.classList.length && ['CATEGORY', 'SUBTEXT'].includes(element.classList[0].toUpperCase())) {
          const cloned = element.cloneNode(false);
          currentDom.append(cloned);
          this.#iterPageSectionsData(element, cloned);
        } else if (element.tagName.toUpperCase() == 'TABLE') {
          const clonedTable = document.createElement('div');
          clonedTable.classList.add('subtext');
          currentDom.append(clonedTable);
          this.#iterPageSectionsData(element, clonedTable);
        } else if (element.tagName.toUpperCase() == 'TR') {
          this.#iterPageSectionsData(element, currentDom, 1);
        }
      }
    }
  }
}

var homePage = new HomePage();