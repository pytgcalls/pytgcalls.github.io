class SourceParser {
  #AVAILABLE_ELEMENTS = [
    'H1', 'H2', 'H3', 'SEPARATOR',
    'TEXT', 'BOLD', 'B', 'SB', 'CODE', 'A', 'BR',
    'SYNTAX-HIGHLIGHT', 'SHI', 'ALERT', 'PG-TITLE',
    'CATEGORY', 'CATEGORY-TITLE', 'REF', 'SUBTEXT',
    'LIST', 'ITEM', 'MULTISYNTAX',
    'TABLE', 'DEFINITIONS', 'COLUMN', 'ITEM',
    'DOCS-REF', 'GITHUB-REF', 'REF-SHI',
    'CONFIG'
  ];

  getContentByData(text) {
    const currentElement = document.createElement('div');
    currentElement.classList.add('page');

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');

    const currentPage = doc.querySelector('page');
    if (currentPage) {
      this.#handleRecursive(currentPage, currentElement);
    }

    return currentElement;
  }

  #handleRecursive(currentDom, elementDom) {
    for(const element of currentDom.childNodes) {
      if (element instanceof Text) {
        elementDom.appendChild(document.createTextNode(element.textContent));
      } else if (!this.#AVAILABLE_ELEMENTS.includes(element.tagName.toUpperCase())) {
        throw new Error("An unknown element has been used "+element.tagName);
      } else {
        let newElement = document.createElement('div');
        this.#tryToReduceTags(element);
        newElement = this.#checkAndManageElement(element, newElement, elementDom);

        let containsCustomTags = false;
        for(const data of element.querySelectorAll('*')) {
          if (!(data instanceof Text)) {
            containsCustomTags = true;
            break;
          }
        }
        
        if (element.hasAttribute('noref')) {
          newElement.setAttribute('noref', element.getAttribute('noref'));
        }

        if (['TEXT', 'ITEM'].includes(element.tagName.toUpperCase())) {
          const spacesMultiplier = '<br/>'.repeat(element.tagName.toUpperCase() === 'ITEM' ? 1 : 2);
          element.innerHTML = element.innerHTML.replace('\n\n', spacesMultiplier);
          containsCustomTags = true;
        }
        
        if (['SYNTAX-HIGHLIGHT', 'SHI'].includes(element.tagName.toUpperCase())) {
          if (containsCustomTags) {
            throw new Error("Syntax highlight can't contain other tags");
          }

          this.#handleSyntaxHighlight(element, newElement);
          elementDom.appendChild(newElement);
        } else if (element.tagName.toUpperCase() === 'GITHUB-REF') {
          this.#handleGithubRef(newElement);
          elementDom.appendChild(newElement);
        } else if (element.tagName.toUpperCase() === 'MULTISYNTAX') {
          this.#handleMultiSyntax(element, newElement);
          elementDom.appendChild(newElement);
        } else {
          if (containsCustomTags) {
            this.#handleRecursive(element, newElement);
          } else {
            newElement.textContent = element.textContent;
          }

          newElement = this.#handlePostQueryElement(element, newElement);
          elementDom.appendChild(newElement);
        }
      }
    }
  }

  #detectLanguageByElement(element) {
    let language = Prism.languages.python;
    
    if (element.hasAttribute('language')) {
      switch (element.getAttribute('language')) {
        case 'go':
          language = Prism.languages.go;
        break;
        case 'c':
          language = Prism.languages.c;
        break;
        case 'cpp':
          language = Prism.languages.cpp;
        break;
        case 'bash':
          language = Prism.languages.bash;
        break;
      }
    }

    return language;
  }

  #checkAndManageElement(element, newElement, elementDom) {
    if (element.tagName.toUpperCase() === 'A') {
      if (element.getAttribute('href').startsWith('https')) {
        newElement = document.createElement('a');
        newElement.href = element.getAttribute('href');
        newElement.target = '_blank';
      } else {
        throw new Error("UnsupportedLink");
      }
    } else if (element.tagName.toUpperCase() === 'LIST') {
      newElement = document.createElement('ul');

      if (element.getAttribute('style') === 'numbers') {
        newElement.classList.add('with-numbers');
      }
    } else if (element.tagName.toUpperCase() === 'ITEM' && elementDom.tagName === 'UL') {
      newElement = document.createElement('li');
    } else if (element.tagName.toUpperCase() === 'BOLD' || element.tagName.toUpperCase() === 'B') {
      newElement = document.createElement('b');
    } else if (element.tagName.toUpperCase() === 'BR') {
      newElement = document.createElement('br');
    } else if (element.tagName.toUpperCase() === 'CATEGORY-TITLE') {
      newElement.classList.toggle(element.tagName.toLowerCase());

      let newContent = element.innerHTML.replaceAll('\n', '<br/>');
      if (newContent.startsWith('<br/>')) {
        newContent = newContent.slice(5);
      }
      element.innerHTML = newContent;
    } else if (element.tagName.toUpperCase() === 'TABLE') {
      newElement = document.createElement('table');
    } else if (element.tagName.toUpperCase() === 'DEFINITIONS') {
      newElement = document.createElement('tr');
      newElement.classList.add('as-definitions');
    } else if (element.tagName.toUpperCase() === 'ITEM' && elementDom.tagName === 'TABLE') {
      newElement = document.createElement('tr');
    } else if (element.tagName.toUpperCase() === 'COLUMN') {
      if (elementDom.classList.contains('as-definitions')) {
        newElement = document.createElement('th');
      } else {
        newElement = document.createElement('td');
      }
    } else if (element.tagName.toUpperCase() === 'DOCS-REF') {
      newElement.classList.add('docs-ref');
      newElement.addEventListener('click', () => {
        if (element.hasAttribute('link')) {
          homePage.handleAsRedirect(element.getAttribute('link'));
        } else {
          throw new Error('invalid link for docs-ref');
        }
      });
    } else if(element.tagName.toUpperCase() === 'GITHUB-REF') {
      newElement = document.createElement('a');
      newElement.classList.add('github-ref');
      newElement.target = '_blank';

      if (!element.hasAttribute('reponame') || !element.hasAttribute('user')) {
        throw new Error('invalid reponame/user for github-ref');
      }

      newElement.setAttribute('reponame', element.getAttribute('reponame'));
      newElement.setAttribute('user', element.getAttribute('user'));
    } else if(element.tagName.toUpperCase() === 'REF-SHI') {
      newElement = document.createElement('a');
      newElement.classList.add('ref-shi');

      if (!element.hasAttribute('url') || !element.hasAttribute('language')) {
        throw new Error('invalid data for ref-shi');
      }
    } else {
      newElement.classList.toggle(element.tagName.toLowerCase());
    }

    return newElement;
  }

  #tryToReduceTags(element) {
    const handleItem = (child) => {
      if (!(child instanceof Text) && child.tagName.toUpperCase() === 'CONFIG') {
        const currentOptionData = config.getOptionValueByIdSync(child.getAttribute('id'));

        if (currentOptionData) {
          const isComplex = config.isComplexOptionValueByIdSync(child.getAttribute('id'));

          if (isComplex) {
            const fragment = document.createDocumentFragment();
            fragment.append(...currentOptionData.cloneNode(true).childNodes);
            child.replaceWith(fragment);
          } else {
            child.replaceWith(document.createTextNode(currentOptionData.textContent));
          }
        } else {
          throw new Error("A config key that doesn't exist has been requested "+child.getAttribute('id'));
        }
      }
    };

    handleItem(element);

    for(const child of element.childNodes) {
      handleItem(child); 
    }
  }

  #handlePostQueryElement(element, newElement) {
    if (['H1', 'H2', 'H3'].includes(element.tagName.toUpperCase())) {
      const hashtagRef = document.createElement('div');
      hashtagRef.classList.add('hashtag-ref');
      hashtagRef.addEventListener('click', () => {
        const ref = utils.generateSectionRefByTextContent(newElement.textContent);
        window.history.pushState('', '', '#' + ref);
        newElement.scrollIntoView();
      });
      hashtagRef.textContent = '#';
      newElement.appendChild(hashtagRef);
    } else if (element.tagName.toUpperCase() == 'REF-SHI') {
      newElement.addEventListener('click', () => {
        const src = 'https://github.com/pytgcalls/pytgcalls/tree/master/' + element.getAttribute('url');

        const closePopup = () => {
          fullscreenCodePreview.classList.add('disappear');
          fullscreenCodePreview.addEventListener('animationend', () => {
            fullscreenCodePreview.remove();
          }, { once: true });
        };

        const closeButton = document.createElement('div');
        closeButton.classList.add('close-button');
        closeButton.addEventListener('click', closePopup);
        closeButton.appendChild(document.createElement('div'));
        closeButton.appendChild(document.createElement('div'));

        const urlBarGithub = document.createElement('img');
        urlBarGithub.classList.add('icon');
        urlBarGithub.src = '/src/assets/github.svg';
        const urlBarText = document.createElement('div');
        urlBarText.classList.add('url');
        urlBarText.textContent = src;
        const urlBarOpenImage = document.createElement('img');
        urlBarOpenImage.classList.add('icon', 'open');
        urlBarOpenImage.src = '/src/assets/uprightfromsquare.svg';
        const urlBarOpen = document.createElement('a');
        urlBarOpen.classList.add('link');
        urlBarOpen.addEventListener('click', closePopup);
        urlBarOpen.target = '_blank';
        urlBarOpen.href = src;
        urlBarOpen.appendChild(urlBarOpenImage);
        const urlBar = document.createElement('div');
        urlBar.classList.add('url-bar');
        urlBar.appendChild(urlBarGithub);
        urlBar.appendChild(urlBarText);
        urlBar.appendChild(urlBarOpen);

        const topBar = document.createElement('div');
        topBar.classList.add('top-bar');
        topBar.appendChild(closeButton);
        topBar.appendChild(urlBar);

        const codePreview = document.createElement('div');
        codePreview.classList.add('code-preview', 'is-loading');
        codePreview.appendChild(utils.createLoadingItem());

        const fullscreenCodePreview = document.createElement('div');
        fullscreenCodePreview.classList.add('fs-code-preview');
        fullscreenCodePreview.appendChild(topBar);
        fullscreenCodePreview.appendChild(codePreview);
        document.body.appendChild(fullscreenCodePreview);

        fullscreenCodePreview.addEventListener('animationend', () => {
          requestsManager.initRequest(element.getAttribute('url'), 'pytgcalls/pytgcalls').then((response) => {
            codePreview.textContent = '';
            codePreview.classList.remove('is-loading');
  
            const fakeChild = document.createElement('div');
            if (element.hasAttribute('language')) {
              fakeChild.setAttribute('language', element.getAttribute('language'));
            }
            fakeChild.textContent = response;
  
            this.#handleSyntaxHighlight(fakeChild, codePreview);
          });
        }, { once: true });
      });
    } else if (element.tagName.toUpperCase() === 'ALERT') {
      const elementHeaderImage = document.createElement('img');
      const elementHeaderText = document.createElement('div');
      elementHeaderText.classList.add('alert-title');
      const elementHeader = document.createElement('div');
      elementHeader.classList.add('alert-header');
      elementHeader.appendChild(elementHeaderImage);
      elementHeader.appendChild(elementHeaderText);

      const elementData = document.createElement('div');
      elementData.classList.add('alert-content');
      elementData.append(...newElement.childNodes);

      const compElement = document.createElement('div');
      compElement.classList.add('alert');
      compElement.appendChild(elementHeader);
      compElement.appendChild(elementData);

      if (['note', 'warning', 'important'].includes(element.getAttribute('type'))) {
        compElement.dataset.type = element.getAttribute('type');
        
        switch (element.getAttribute('type')) {
          case 'important':
            elementHeaderImage.src = '/src/icons/important.svg';
            elementHeaderText.textContent = 'Important!';
          break;
          case 'note':
            elementHeaderImage.src = '/src/icons/note.svg';
            elementHeaderText.textContent = 'Note';
          break;
          case 'warning':
            elementHeaderImage.src = '/src/icons/warning.svg';
            elementHeaderText.textContent = 'Warning!';
          break;
        }

      } else {
        throw new Error("An unknown type has been specified for ALERT element");
      }

      newElement.replaceWith(compElement);
      return compElement;
    }

    return newElement;
  }

  #handleSyntaxHighlight(element, newElement) {
    let code = element.textContent;
    code = Prism.highlight(code, this.#detectLanguageByElement(element), 'html');
    code = code.replaceAll('\n', '<br/>');
    
    if (code.startsWith('<br/>')) {
      code = code.slice(5);
    }
    
    code = this.#handleTabsWithSpacer(code);
    newElement.innerHTML = code;

    const updateMark = (startAt, endAt) => {
      newElement.style.setProperty('--start-mark', startAt);
      newElement.style.setProperty('--offset-mark', endAt - startAt);
      newElement.style.setProperty('--length', code.split('<br/>').length - 1);
      newElement.classList.add('has-mark');
    };

    if (element.hasAttribute('mark')) {
      const markData = element.getAttribute('mark');
      if (markData.indexOf('-') == -1) {
        const startAt = parseInt(markData);

        if (!isNaN(startAt)) {
          updateMark(startAt, startAt);
        }
      } else {
        const startAt = parseInt(markData.split('-')[0]);
        const endAt = parseInt(markData.split('-')[1]);

        if (!isNaN(startAt) && !isNaN(endAt)) {
          updateMark(Math.min(startAt, endAt), Math.max(startAt, endAt));
        }
      }
    }
  }

  #handleTabsWithSpacer(code) {
    let firstRowSpacesCount = 0;
    const firstRow = code.split('<br/>')[0];
    for(let char of firstRow) {
      if (char === ' ') {
        firstRowSpacesCount++;
      } else {
        break;
      }
    }

    let baseString = ' '.repeat(firstRowSpacesCount);

    for(let i = 20; i > 1; i--) {
      const newSpacer = baseString + (' '.repeat(i));
      const replacer = '<div class="spacer" style="--id: '+i+'">&nbsp;</div>';
      code = code.replaceAll(newSpacer, replacer);
    }
    
    return code;
  }

  #handleMultiSyntax(element, newElement) {
    if (!element.querySelector('tabs > tab')) {
      throw new Error('multisyntax must contains tabs');
    }

    if (!element.querySelector('syntax-highlight')) {
      throw new Error('multisyntax must contains syntax highlight elements');
    }

    newElement.classList.add('multisyntax');

    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('tabs');
    tabsContainer.style.setProperty('--i', element.querySelectorAll('tabs > tab').length);
    newElement.appendChild(tabsContainer);
    
    for (const [id, tab] of Object.entries(element.querySelectorAll('tabs > tab'))) {
      if (!tab.textContent || !tab.getAttribute('id')) {
        throw new Error('tab has invalid data for multisyntax');
      }

      const tabElement = document.createElement('div');
      tabElement.classList.add('tab');
      tabElement.addEventListener('click', () => {
        if (!homePage.onChangeFavoriteSyntaxTabAnimationState.ultimateDataCall) {
          homePage.onChangeFavoriteSyntaxTab.callAllListeners(tab.getAttribute('id'));
        }
      });
      tabElement.textContent = tab.textContent;
      tabsContainer.appendChild(tabElement);

      homePage.onChangeFavoriteSyntaxTab.addListener({
        callback: (data) => {
          tabElement.classList.toggle('active', tab.getAttribute('id') == data);
          if (tab.getAttribute('id') == data) {
            tabsContainer.style.setProperty('--eid', parseInt(id));
            localStorage.setItem('currentTabData', tab.getAttribute('id'));
          }
        },
        ref: tabElement,
        recallWithCurrentData: true,
        onUnknownRecall: () => {
          tabElement.classList.toggle('active', !parseInt(id));
          if (!parseInt(id)) {
            tabsContainer.style.setProperty('--eid', 0);
          }
        }
      });
    }

    const syntaxHighlightContainer = document.createElement('div');
    syntaxHighlightContainer.classList.add('sy-container');
    newElement.appendChild(syntaxHighlightContainer);

    for (const [id, syntax] of Object.entries(element.querySelectorAll('syntax-highlight'))) {
      let syntaxElement = document.createElement('div');
      
      this.#tryToReduceTags(syntax);
      syntaxElement = this.#checkAndManageElement(syntax, syntaxElement, document.createElement('div'));

      let containsCustomTags = false;
      for(const data of syntax.querySelectorAll('*')) {
        if (!(data instanceof Text)) {
          containsCustomTags = true;
          break;
        }
      }
      
      if (containsCustomTags) {
        throw new Error("Syntax highlight can't contain other tags");
      }

      this.#handleSyntaxHighlight(syntax, syntaxElement);
      syntaxHighlightContainer.appendChild(syntaxElement);

      homePage.onChangeFavoriteSyntaxTab.addListener({
        callback: (data) => {
          const activeItem = syntaxHighlightContainer.querySelector('.active');
          if (activeItem) {
            if (activeItem != syntaxElement && syntax.getAttribute('id') == data) {
              homePage.onChangeFavoriteSyntaxTabAnimationState.callAllListeners(true);

              const activeItemRect = activeItem.getBoundingClientRect();
              syntaxHighlightContainer.style.setProperty('--height', activeItemRect.height+'px');
              syntaxHighlightContainer.classList.add('preparing-animation');
              
              const currentItemRect = syntaxElement.getBoundingClientRect();
              syntaxHighlightContainer.style.setProperty('--to-height', (currentItemRect.height + 10)+'px');
              activeItem.classList.add('disappearing');
              syntaxHighlightContainer.classList.add('animating');
              syntaxHighlightContainer.classList.remove('preparing-animation');
              syntaxElement.classList.add('appearing');
              
              Promise.all([
                new Promise((resolve) => syntaxHighlightContainer.addEventListener('animationend', resolve, { once: true })),
                new Promise((resolve) => activeItem.addEventListener('animationend', resolve, { once: true })),
                new Promise((resolve) => syntaxElement.addEventListener('animationend', resolve, { once: true }))
              ]).then(() => {
                syntaxElement.classList.remove('appearing');
                syntaxElement.classList.add('active');
                activeItem.classList.remove('disappearing');
                activeItem.classList.remove('active');
                syntaxHighlightContainer.classList.remove('animating');
                homePage.onChangeFavoriteSyntaxTabAnimationState.callAllListeners(false);
              });
            }
          } else {
            syntaxElement.classList.toggle('active', syntax.getAttribute('id') == data);
          }
        },
        ref: syntaxElement,
        recallWithCurrentData: true,
        onUnknownRecall: () => {
          syntaxElement.classList.toggle('active', !parseInt(id));
        }
      });
    }
  }

  #handleGithubRef(element) {
    if (!element.hasAttribute('user') || !element.hasAttribute('reponame')) {
      throw new Error('github ref doesnt have link');
    }

    if (element.getAttribute('user').indexOf('/') !== -1 || element.getAttribute('reponame').indexOf('/') !== -1) {
      throw new Error('github ref has an invalid format');
    }

    const loader = utils.createLoadingItem();

    element.removeAttribute('href');
    element.classList.add('is-loading');
    element.appendChild(loader);

    requestAnimationFrame(() => {
      const XML = new XMLHttpRequest();
      XML.open('GET', 'https://api.github.com/repos/' + element.getAttribute('user') + '/' + element.getAttribute('reponame'), true);
      XML.send();
      XML.addEventListener('readystatechange', (e) => {
        if (e.target.readyState === 4 && e.target.status === 200) {
          const response = JSON.parse(e.target.response);

          if (response['message']) {
            throw new Error('the repository is invalid');
          } else {
            const repoTitle = document.createElement('div');
            repoTitle.classList.add('repo-title');
            repoTitle.textContent = response['full_name'];
            const repoDescription = document.createElement('div');
            repoDescription.classList.add('repo-description');
            repoDescription.textContent = response['description'];

            const repoOwnerImage = document.createElement('img');
            repoOwnerImage.src = response['owner']['avatar_url'];
            const repoOwnerName = document.createElement('div');
            repoOwnerName.classList.add('repo-owner-name');
            repoOwnerName.textContent = response['owner']['login'];
            const repoOwner = document.createElement('div');
            repoOwner.classList.add('repo-owner');
            repoOwner.appendChild(document.createTextNode('Created by'));
            repoOwner.appendChild(repoOwnerImage);
            repoOwner.appendChild(repoOwnerName);

            const repoLanguage = document.createElement('div');
            repoLanguage.classList.add('repo-language');
            repoLanguage.textContent = 'Written in ' + response['language'];
            repoLanguage.textContent += ' (' + utils.calculateSize(response['size']) + ')';

            const repoInformations = document.createElement('div');
            repoInformations.classList.add('repo-info');
            repoInformations.appendChild(repoTitle);
            repoInformations.appendChild(repoDescription);
            repoInformations.appendChild(repoOwner);
            repoInformations.appendChild(repoLanguage);
            
            const repoIllustration = document.createElement('div');
            repoIllustration.classList.add('illustration');
            repoIllustration.appendChild(this.#createIconNameContainerForGithub(
              '/src/icons/codefork.svg', String(response['forks'])
            ));
            repoIllustration.appendChild(this.#createIconNameContainerForGithub(
              '/src/icons/eye.svg', String(response['subscribers_count'])
            ));
            repoIllustration.appendChild(this.#createIconNameContainerForGithub(
              '/src/icons/gavel.svg', response['license'] ? String(response['license']['spdx_id']) : '-'
            ));
            repoIllustration.appendChild(this.#createIconNameContainerForGithub(
              '/src/icons/star.svg', String(response['stargazers_count'])
            ));

            element.classList.remove('is-loading');
            element.textContent = '';
            element.setAttribute('href', response['html_url']);
            element.style.setProperty('--url', 'url(" '+ response['owner']['avatar_url'] + '")');
            element.appendChild(repoInformations);
            element.appendChild(repoIllustration);
          }
        }
      });
    });
  }

  #createIconNameContainerForGithub(icon, title) {
    const iconImage = document.createElement('img');
    iconImage.classList.add('icon');
    iconImage.src = icon;
    const titleElement = document.createElement('div');
    titleElement.classList.add('title');
    titleElement.textContent = title;
    const container = document.createElement('div');
    container.classList.add('container');
    container.appendChild(iconImage);
    container.appendChild(titleElement);
    return container;
  }
  
  handleSearchIndexByText(text) {
    const domHelper = new DOMParser();
    const dom = domHelper.parseFromString(text, 'application/xml');
    const childs = dom.querySelectorAll('h1, h2, h3, text, subtext, category-title');

    let finalText = '';

    for(const child of childs) {
      this.#tryToReduceTags(child);
      finalText += ' ' + child.textContent;
    }

    return finalText;
  }
}

const sourceParser = new SourceParser();