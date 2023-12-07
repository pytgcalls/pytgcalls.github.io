class Content {
  onSelectedSectionListenerInstance;

  #currentContentElement;
  #currentSectionsElement;

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
      this.#handleResponse(fileName, content, pageSections, indexedCache, hash).then(() => {
        this.#handlePathPNManager(content, fileName);
      });
    } else {
      const handleData = (response) => {
        window.history.pushState('', '', pathFileName + (hash ?? ''));
        indexesManager.saveAsFullIndexedValue(fileName, response);
        this.#handleResponse(fileName, content, pageSections, response, hash).then(() => {
          this.#handlePathPNManager(content, fileName);
        });
      };

      requestsManager.initRequest(fileName).then(handleData).catch(() => {
        content.classList.add('is-loading');
        content.textContent = 'Request failed';
        pageSections.classList.add('is-loading');
        pageSections.textContent = '';
      });
    }
  }

  handleCustomCodeInsert() {
    const data = prompt('Insert here your script');

    const { content, pageSections } = this.#replaceWithValidElements();
    this.#handleResponse("", content, pageSections, data, '');
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

  #handleResponse(fileName, content, pageSections, response, hash) {
    return new Promise((resolve) => {
      const data = sourceParser.getContentByData(response);
      content.classList.remove('is-loading');
      content.textContent = '';
      content.appendChild(data);

      const sectionsContainer = document.createElement('div');
      sectionsContainer.classList.add('sections-recap');
      this.#iterPageSectionsData(data, sectionsContainer);

      pageSections.classList.remove('is-loading');
      pageSections.textContent = '';
      pageSections.appendChild(sectionsContainer);

      if (fileName != "") {
        const contributeToEdit = document.createElement('a');
        contributeToEdit.classList.add('h2');
        contributeToEdit.href = 'https://github.com/pytgcalls/docsdata/edit/master/' + fileName;
        contributeToEdit.target = '_blank';
        contributeToEdit.textContent = 'Contribute to this page';
        const contributionsContainer = document.createElement('div');
        contributionsContainer.classList.add('contributions');
        contributionsContainer.appendChild(contributeToEdit);
        pageSections.appendChild(contributionsContainer);
      }

      try {
        this.#handleHash(data, hash);
      } catch(e) {}

      resolve();
    });
  }

  #handlePathPNManager(content, fileName) {
    config.getTheNextFileAfter(fileName).then(({ previousFile, nextFile, basePath }) => {
      const goToPreviousIcon = document.createElement('img');
      goToPreviousIcon.src = '/src/assets/arrowleft.svg';
      const goToPreviousBigTitle = document.createElement('div');
      goToPreviousBigTitle.classList.add('big-title');
      goToPreviousBigTitle.textContent = 'Previous';
      const goToPreviousMiniTitle = document.createElement('div');
      goToPreviousMiniTitle.classList.add('mini-title');
      const goToPreviousContainer = document.createElement('div');
      goToPreviousContainer.classList.add('go-to');
      goToPreviousContainer.appendChild(goToPreviousIcon);
      goToPreviousContainer.appendChild(goToPreviousBigTitle);
      goToPreviousContainer.appendChild(goToPreviousMiniTitle);

      const goToNextIcon = document.createElement('img');
      goToNextIcon.src = '/src/assets/arrowright.svg';
      const goToNextBigTitle = document.createElement('div');
      goToNextBigTitle.classList.add('big-title');
      goToNextBigTitle.textContent = 'Next';
      const goToNextMiniTitle = document.createElement('div');
      goToNextMiniTitle.classList.add('mini-title');
      const goToNextContainer = document.createElement('div');
      goToNextContainer.classList.add('go-to');
      goToNextContainer.appendChild(goToNextIcon);
      goToNextContainer.appendChild(goToNextBigTitle);
      goToNextContainer.appendChild(goToNextMiniTitle);

      const goToContainer = document.createElement('div');
      goToContainer.classList.add('go-to-container');
      goToContainer.classList.toggle('has-only-next', !previousFile && !!nextFile);

      if (typeof previousFile != 'undefined') {
        goToPreviousMiniTitle.textContent = utils.getCategoryFileName(previousFile.replace(basePath, ''));
        goToPreviousContainer.addEventListener('click', () => {
          this.#handleRedirectWithAnimation(content, previousFile);
        });
        goToContainer.appendChild(goToPreviousContainer);
      }

      if (typeof nextFile != 'undefined') {
        goToNextMiniTitle.textContent = utils.getCategoryFileName(nextFile.replace(basePath, ''));
        goToNextContainer.addEventListener('click', () => {
          this.#handleRedirectWithAnimation(content, nextFile);
        });
        goToContainer.appendChild(goToNextContainer);
      }

      content.appendChild(goToContainer);
    });
  }

  #handleRedirectWithAnimation(content, url) {
    content.classList.add('disappear');
    content.addEventListener('animationend', () => {
      homePage.handleAsRedirect(utils.parseCategoryUrl(url));
    }, { once: true });
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