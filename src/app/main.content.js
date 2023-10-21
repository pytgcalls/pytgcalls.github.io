class Content {
  onSelectedSectionListenerInstance;

  #currentContentElement;
  #currentSectionsElement;
  #doesLoadViaUserContentWork = true;

  constructor() {
    this.onSelectedSectionListenerInstance = new ListenerManagerInstance();
  }

  getElement() {
    const content = document.createElement('div');
    content.classList.add('content');
    this.#currentContentElement = content;

    const pageSections = document.createElement('div');
    pageSections.classList.add('sections');
    this.#currentSectionsElement = pageSections;

    const fragment = document.createDocumentFragment();
    fragment.append(content);
    fragment.append(pageSections);

    return fragment;
  }

  loadFile(fileName, hash = '') {
    const { content, pageSections } = this.#replaceWithValidElements();

    const pathFileName = utils.parseCategoryUrl(fileName);
    const indexedCache = indexesManager.getFullIndexedValue(fileName);

    if (typeof indexedCache != 'undefined') {
      window.history.pushState('', '', pathFileName + (hash ?? ''));
      this.#handleResponse(content, pageSections, indexedCache, hash);
    } else {
      const handleData = (response) => {
        window.history.pushState('', '', pathFileName + (hash ?? ''));
        indexesManager.saveAsFullIndexedValue(fileName, response);
        this.#handleResponse(content, pageSections, response, hash);
      };

      const userContentPromise = this.#tryToLoadWithUserContent(fileName);
      userContentPromise.then(handleData);
      userContentPromise.catch(() => {
        this.#doesLoadViaUserContentWork = false;

        const apiPromise = this.#tryToLoadWithApi(fileName);
        apiPromise.then(handleData);
        apiPromise.catch(() => {
          content.classList.add('is-loading');
          content.textContent = 'Request failed';
          pageSections.classList.add('is-loading');
          pageSections.textContent = '';
        });
      });
    }
  }

  #tryToLoadWithUserContent(fileName) {
    if (!this.#doesLoadViaUserContentWork) {
      return Promise.reject('Ignoring githubusercontent as it isnt available');
    } else {
      return new Promise((resolve, reject) => {
        const XML = new XMLHttpRequest();
        XML.open('GET', 'https://raw.githubusercontent.com/pytgcalls/docsdata/master/' + fileName, true);
        XML.send();
        XML.addEventListener('readystatechange', (e) => {
          if (e.target.readyState === 4) {
            if (e.target.status === 200) {
              resolve(e.target.response);
            } else {
              reject('Unable to resolve domain via githubusercontent');
            }
          }
        });
      });
    }
  }

  #tryToLoadWithApi(fileName) {
    return new Promise((resolve, reject) => {
      const XML = new XMLHttpRequest();
      XML.open('GET', 'https://api.github.com/repos/pytgcalls/docsdata/contents/' + fileName, true);
      XML.send();
      XML.addEventListener('readystatechange', (e) => {
        if (e.target.readyState === 4) {
          if (e.target.status === 200) {
            const response = JSON.parse(e.target.responseText);
            if (typeof response['content'] === 'string' && response['content'].length > 0) {
              resolve(atob(response['content']));
            } else {
              reject('Failed to parse github api response');
            }
          } else {
            reject('Failed to get data from github api');
          }
        }
      });
    });
  }

  clearBoard() {
    this.#replaceWithValidElements(true);
  }
  
  #replaceWithValidElements(isEmpty = false) {
    const content = document.createElement('div');
    content.classList.add('content', 'is-loading');
    !isEmpty && content.appendChild(utils.createLoadingItem());
    this.#currentContentElement.replaceWith(content);
    this.#currentContentElement = content;

    const pageSections = document.createElement('div');
    pageSections.classList.add('sections', 'is-loading');
    this.#currentSectionsElement.replaceWith(pageSections);
    this.#currentSectionsElement = pageSections;

    return { content, pageSections };
  }

  #handleResponse(content, pageSections, response, hash) {
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

      try {
        this.#handleHash(data, hash);
      } catch(e) {}
    } catch(e) {
      content.classList.add('is-loading');
      content.textContent = 'Rendering failed';
      pageSections.classList.add('is-loading');
      pageSections.textContent = '';

      throw e;
    }
  }

  #handleHash(data, hash) {
    if (typeof hash != 'undefined' && hash.length) {
      if (hash.startsWith('#')) {
        hash = hash.slice(1);
      }
      
      const selectedChild = data.querySelectorAll('.h1, .h2, .h3');
      for(const child of selectedChild) {
        if (utils.generateSectionRefByTextContent(child.textContent) === hash) {
          child.scrollIntoView();
          break;
        }
      }
    }
  }

  #iterPageSectionsData(container, currentDom, childsLimit = Infinity) {
    for(const [id, element] of container.childNodes.entries()) {
      if (id > childsLimit) {
        break;
      }

      if (element instanceof Element) {
        if (element.getAttribute('noref') === 'true') {
          continue;
        }

        if (element.tagName.toUpperCase() === 'TD' || (element.classList.length && ['H1', 'H2', 'H3', 'CATEGORY-TITLE', 'PG-TITLE'].includes(element.classList[0].toUpperCase()))) {
          let cloned = element.cloneNode(true);

          if (element.tagName.toUpperCase() === 'TD') {
            cloned = document.createElement('div');
            cloned.classList.add('pg-title');
          }

          cloned.addEventListener('click', () => this.updateActiveSection(element));

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

            if (element.textContent.endsWith('#') && element.lastChild instanceof Element && element.lastChild.classList.contains('hashtag-ref')) {
              cloned.innerHTML = element.textContent.slice(0, -1);
            }
          }

          currentDom.append(cloned);
        } else if(element.classList.length && ['CATEGORY', 'SUBTEXT'].includes(element.classList[0].toUpperCase())) {
          const cloned = element.cloneNode(false);
          currentDom.append(cloned);
          this.#iterPageSectionsData(element, cloned);
        } else if (element.tagName.toUpperCase() === 'TABLE') {
          const clonedTable = document.createElement('div');
          clonedTable.classList.add('subtext');
          currentDom.append(clonedTable);
          this.#iterPageSectionsData(element, clonedTable);
        } else if (element.tagName.toUpperCase() === 'TR') {
          this.#iterPageSectionsData(element, currentDom, 1);
        }
      }
    }
  }

  updateMobileSectionsVisibilityState(forcedState) {
    return this.#currentSectionsElement.classList.toggle('show', forcedState);
  }

  updateActiveSection(section) {
    section.scrollIntoView({
      behavior: 'smooth'
    });
    this.onSelectedSectionListenerInstance.callAllListeners();
  }
}