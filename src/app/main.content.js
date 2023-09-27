class Content {
  #onSelectedSectionListeners = [];

  #currentContentElement;
  #currentSectionsElement;

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
    const { content, pageSections} = this.#replaceWithValidElements();

    const pathFileName = utils.parseCategoryUrl(fileName);
    // TODO:handle indexes caching

    const XML = new XMLHttpRequest();
    XML.open('GET', 'https://raw.githubusercontent.com/pytgcalls/docsdata/master/' + fileName, true);
    XML.send();
    XML.addEventListener('readystatechange', (e) => {
      if (e.target.readyState === 4 && e.target.status === 200) {
        window.history.pushState('', '', pathFileName + (hash ?? ''));
        this.#handleResponse(content, pageSections, e.target.response);
      }
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

      //try {
      //  this.#handleHash(data, hash);
      //} catch(e) {}
    } catch(e) {
      //this.#headerCompass.classList.remove('visible');
      content.classList.add('is-loading');
      content.textContent = 'Rendering failed';
      pageSections.classList.add('is-loading');
      pageSections.textContent = '';

      throw e;
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
    section.scrollIntoView();
    for(const listener of this.#onSelectedSectionListeners) {
      try {
        listener();
      } catch(e) {}
    }
  }

  addOnSelectedSectionListener(callback) {
    if (typeof callback === 'function') {
      this.#onSelectedSectionListeners.push(callback);
    }
  }
}