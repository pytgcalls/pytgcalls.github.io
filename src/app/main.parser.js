class SourceParser {
  #OPTIONS = {};
  #COMPLEX_OPTIONS = [];
  #AVAILABLE_ELEMENTS = [
    'H1', 'H2', 'H3', 'SEPARATOR',
    'TEXT', 'BOLD', 'B', 'SB', 'CODE', 'A', 'BR',
    'SYNTAX-HIGHLIGHT', 'SHI', 'ALERT', 'PG-TITLE',
    'CATEGORY', 'CATEGORY-TITLE', 'REF', 'SUBTEXT',
    'LIST', 'ITEM',
    'TABLE', 'DEFINITIONS', 'COLUMN', 'ITEM',
    'DOCS-REF', 'GITHUB-REF',
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

  saveAsConfigFromDom(dom) {
    const options = dom.querySelectorAll('config > option');
    this.#OPTIONS = {};
    for(const option of options) {
      if (option.hasAttribute('id')) {
        if (option.childElementCount || !(option.firstChild instanceof Text)) {
          this.#COMPLEX_OPTIONS.push(option.getAttribute('id'));
          this.#OPTIONS[option.getAttribute('id')] = option;
        } else {
          this.#OPTIONS[option.getAttribute('id')] = option.textContent;
        }
      }
    }
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
          const spacesMultiplier = '<br/>'.repeat(element.tagName.toUpperCase() == 'ITEM' ? 1 : 2);
          element.innerHTML = element.innerHTML.replace('\n\n', spacesMultiplier);
          containsCustomTags = true;
        }
        
        if (['SYNTAX-HIGHLIGHT', 'SHI'].includes(element.tagName.toUpperCase())) {
          if (containsCustomTags) {
            throw new Error("Syntax highlight can't contain other tags");
          }

          this.#handleSyntaxHighlight(element, newElement);
          elementDom.appendChild(newElement);
        } else if (element.tagName.toUpperCase() == 'GITHUB-REF') {
          this.#handleGithubRef(newElement);
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
    if (element.tagName.toUpperCase() == 'A') {
      if (element.getAttribute('href').startsWith('https')) {
        newElement = document.createElement('a');
        newElement.href = element.getAttribute('href');
        newElement.target = '_blank';
      } else {
        throw new Error("UnsupportedLink");
      }
    } else if (element.tagName.toUpperCase() == 'LIST') {
      newElement = document.createElement('ul');

      if (element.getAttribute('style') == 'numbers') {
        newElement.classList.add('with-numbers');
      }
    } else if (element.tagName.toUpperCase() == 'ITEM' && elementDom.tagName == 'UL') {
      newElement = document.createElement('li');
    } else if (element.tagName.toUpperCase() == 'BOLD' || element.tagName.toUpperCase() == 'B') {
      newElement = document.createElement('b');
    } else if (element.tagName.toUpperCase() == 'BR') {
      newElement = document.createElement('br');
    } else if (element.tagName.toUpperCase() == 'CATEGORY-TITLE') {
      newElement.classList.toggle(element.tagName.toLowerCase());

      let newContent = element.innerHTML.replaceAll('\n', '<br/>');
      if (newContent.startsWith('<br/>')) {
        newContent = newContent.slice(5);
      }
      element.innerHTML = newContent;
    } else if (element.tagName.toUpperCase() == 'TABLE') {
      newElement = document.createElement('table');
    } else if (element.tagName.toUpperCase() == 'DEFINITIONS') {
      newElement = document.createElement('tr');
      newElement.classList.add('as-definitions');
    } else if (element.tagName.toUpperCase() == 'ITEM' && elementDom.tagName == 'TABLE') {
      newElement = document.createElement('tr');
    } else if (element.tagName.toUpperCase() == 'COLUMN') {
      if (elementDom.classList.contains('as-definitions')) {
        newElement = document.createElement('th');
      } else {
        newElement = document.createElement('td');
      }
    } else if(element.tagName.toUpperCase() == 'GITHUB-REF') {
      newElement = document.createElement('a');
      newElement.classList.add('github-ref');
      newElement.setAttribute('target', '_blank');

      if (element.hasAttribute('reponame')) {
        newElement.setAttribute('reponame', element.getAttribute('reponame'));
      }

      if (element.hasAttribute('user')) {
        newElement.setAttribute('user', element.getAttribute('user'));
      }
    } else {
      newElement.classList.toggle(element.tagName.toLowerCase());
    }

    return newElement;
  }

  #tryToReduceTags(element) {
    const handleItem = (child) => {
      if (!(child instanceof Text) && child.tagName.toUpperCase() == 'CONFIG') {
        const currentOptionData = this.#OPTIONS[child.getAttribute('id')];

        if (currentOptionData) {
          if (this.#COMPLEX_OPTIONS.includes(child.getAttribute('id'))) {
            const fragment = document.createDocumentFragment();
            fragment.append(...currentOptionData.cloneNode(true).childNodes);
            child.replaceWith(fragment);
          } else {
            child.replaceWith(document.createTextNode(currentOptionData));
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
    if (element.tagName.toUpperCase() == 'CATEGORY-TITLE') {
      newElement.innerHTML = this.#handleTabsWithSpacer(newElement.innerHTML);
    } else if (element.tagName.toUpperCase() == 'ALERT') {
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

    /*if (element.hasAttribute('mark')) {
      const markData = element.getAttribute('mark');
      const startAt = parseInt(markData.split('-')[0]);
      const endAt = parseInt(markData.split('-')[1]);

      if (!isNaN(startAt) && !isNaN(endAt)) {
        newElement.style.setProperty('--start-mark', startAt);
        newElement.style.setProperty('--offset-mark', endAt - startAt);
        newElement.style.setProperty('--length', code.split('<br/>').length - 1);
        newElement.classList.add('has-mark');
      }
    }*/
    //TODO: MARK ON SYNTAX HIGHLIGHT
  }

  #handleTabsWithSpacer(code) {
    let firstRowSpacesCount = 0;
    const firstRow = code.split('<br/>')[0];
    for(let char of firstRow) {
      if (char == ' ') {
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

  #handleGithubRef(element) {
    if (!element.hasAttribute('user') || !element.hasAttribute('reponame')) {
      throw new Error('github ref doesnt have link');
    }

    if (element.getAttribute('user').indexOf('/') != -1 || element.getAttribute('reponame').indexOf('/') != -1) {
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
        if (e.target.readyState == 4 && e.target.status == 200) {
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