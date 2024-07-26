/*
 * Copyright (c) 2020-2024.
 *
 *  The code in this file is part of the PyTgCalls project.
 *  Please refer to official links:
 *  * Repo: https://github.com/pytgcalls
 *  * News: https://t.me/pytgcallsnews
 *  * Chat: https://t.me/pytgcallschat
 *  * Documentation: https://pytgcalls.github.io
 *
 *  We consider these above sources to be the only official
 *  sources for news related to this source code.
 *  With <3 by @kuogi (and the fox!)
 */

import * as emojisParser from "./main.emojis.js";
import * as requestsManager from "./main.requests.js";
import * as utils from "./main.utils.js";
import * as iconsManager from "./main.icons.js";
import * as config from "./main.config.js";
import * as homePage from "./main.home.js";
import patienceDiff from "../lib/patiencediff.js";
import Prism from "../lib/prism.js";
import {getCollapseLongCodeStatus} from "./main.settings.js";

const AVAILABLE_ELEMENTS = [
  'H1', 'H2', 'H3', 'H4', 'SEPARATOR',
  'TEXT', 'BOLD', 'B', 'SB', 'CODE', 'A', 'BR',
  'SYNTAX-HIGHLIGHT', 'SHI', 'ALERT', 'PG-TITLE',
  'CATEGORY', 'CATEGORY-TITLE', 'REF', 'SUBTEXT',
  'LIST', 'ITEM', 'MULTISYNTAX',
  'TABLE', 'DEFINITIONS', 'COLUMN', 'ITEM',
  'DOCS-REF', 'GITHUB-REF', 'REF-SHI',
  'CONFIG', 'BANNER', 'P2P-BANNER', 'MARK'
];

export function getContentByData(text) {
  const currentElement = document.createElement('div');
  currentElement.classList.add('page');

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'application/xml');

  const currentPage = doc.querySelector('page');
  if (currentPage) {
    handleRecursive(currentPage, currentElement);
  }

  return currentElement;
}

export function handleRecursive(currentDom, elementDom) {
  tryToReduceTags(currentDom);

  for (const element of currentDom.childNodes) {
    if (element instanceof Text) {
      elementDom.appendChild(emojisParser.parse(element.textContent));
    } else if (!AVAILABLE_ELEMENTS.includes(element.tagName.toUpperCase())) {
      console.error(element);
      throw new Error("An unknown element has been used " + element.tagName);
    } else {
      let newElement = document.createElement('div');
      newElement = checkAndManageElement(element, newElement, elementDom);

      let containsCustomTags = false;
      for (const data of element.querySelectorAll('*')) {
        if (!(data instanceof Text) && data.tagName.toUpperCase() !== 'BR') {
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

        newElement = handleSyntaxHighlight(element, newElement, false, '', element.tagName.toUpperCase() === 'SHI');
        elementDom.appendChild(newElement);
      } else if (element.tagName.toUpperCase() === 'GITHUB-REF') {
        handleGithubRef(newElement);
        elementDom.appendChild(newElement);
      } else if (element.tagName.toUpperCase() === 'MULTISYNTAX') {
        handleMultiSyntax(element, newElement);
        elementDom.appendChild(newElement);
      } else if (element.tagName.toUpperCase() === 'BANNER') {
        if (containsCustomTags) {
          throw new Error("Banner can't contain other tags");
        }

        elementDom.appendChild(handlePostQueryElement(element, newElement));
      } else if (element.tagName.toUpperCase() === 'P2P-BANNER') {
        if (containsCustomTags) {
          throw new Error("P2PBanner can't contain other tags");
        }

        elementDom.appendChild(handlePostQueryElement(element, newElement));
      } else if (element.tagName.toUpperCase() === 'MARK') {
        const markElement = document.createElement('span');
        markElement.classList.add('ids');
        markElement.innerHTML = element.innerHTML;
        elementDom.appendChild(markElement);
      } else {
        if (containsCustomTags) {
          handleRecursive(element, newElement);
        } else {
          newElement.appendChild(emojisParser.parse(element.textContent));
        }

        newElement = handlePostQueryElement(element, newElement);
        elementDom.appendChild(newElement);
      }
    }
  }
}

export function detectLanguageByElement(element) {
  let language = {
    prism: Prism.languages.python,
    name: 'Python',
    icon: {
      category: 'languages',
      name: 'python',
    }
  };

  if (element.hasAttribute('language')) {
    switch (element.getAttribute('language')) {
      case 'go':
        language.prism = Prism.languages.go;
        language.name = 'Go';
        language.icon.name = 'go';
        break;
      case 'c':
        language.prism = Prism.languages.c;
        language.name = 'C';
        language.icon.name = 'c';
        break;
      case 'cpp':
        language.prism = Prism.languages.cpp;
        language.name = 'C++';
        language.icon.name = 'cpp';
        break;
      case 'bash':
        // noinspection JSUnresolvedReference
        language.prism = Prism.languages.bash;
        language.name = 'Bash';
        language.icon.name = '';
        break;
    }
  }

  return language;
}

export function getLanguageColorByName(name) {
  // reference: https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml
  switch (name) {
    case 'Python':
      return '#3572A5';
    case 'Go':
      return '#00ADD8';
    case 'C':
      return '#555555';
    case 'C++':
      return '#f34b7d';
    case 'PHP':
      return '#4F5D95';
    case 'TypeScript':
      return '#3178c6';
    case 'Rust':
      return '#dea584';
    default:
      return '#000000';
  }
}

function checkAndManageElement(element, newElement, elementDom) {
  if (element.tagName.toUpperCase() === 'A') {
    if (element.getAttribute('href').startsWith('https')) {
      newElement = document.createElement('a');
      newElement.href = element.getAttribute('href');
      newElement.target = '_blank';
    } else {
      throw new Error("UnsupportedLink");
    }
  } else if (element.tagName.toUpperCase() === 'BANNER') {
    newElement.classList.add('banner');

    const isValidQuery = (
      element.getAttribute('imageurl')
      && element.hasAttribute('imageheight') && !isNaN(parseInt(element.getAttribute('imageheight')))
      && element.hasAttribute('imagewidth') && !isNaN(parseInt(element.getAttribute('imagewidth')))
      && element.getAttribute('minititle')
      && element.getAttribute('bigtitle')
      && element.getAttribute('description')
      && element.getAttribute('version')
      && element.hasAttribute('mainbg') && element.getAttribute('mainbg').startsWith('#')
    );

    if (isValidQuery) {
      newElement.style.setProperty('--mainbg', element.getAttribute('mainbg'));

      const mainImage = document.createElement('img');
      mainImage.classList.add('main-image');
      mainImage.style.setProperty('--width', element.getAttribute('imagewidth'));
      mainImage.style.setProperty('--height', element.getAttribute('imageheight'));
      mainImage.src = element.getAttribute('imageurl');

      const miniTitleContainer = document.createElement('div');
      miniTitleContainer.classList.add('mini-title');
      miniTitleContainer.appendChild(emojisParser.parse(element.getAttribute('minititle')));
      const bigTitleContainer = document.createElement('div');
      bigTitleContainer.classList.add('big-title');
      bigTitleContainer.appendChild(emojisParser.parse(element.getAttribute('bigtitle')));
      const bottomContainer = document.createElement('div');
      bottomContainer.classList.add('bottom-container');
      bottomContainer.appendChild(miniTitleContainer);
      bottomContainer.appendChild(bigTitleContainer);

      const imageLoaderItem = utils.createLoadingItem();

      const bannerContainer = document.createElement('div');
      bannerContainer.classList.add('banner-container');
      bannerContainer.appendChild(mainImage);
      bannerContainer.appendChild(imageLoaderItem);
      bannerContainer.appendChild(bottomContainer);
      newElement.appendChild(bannerContainer);

      mainImage.addEventListener('load', () => {
        imageLoaderItem.remove();
        mainImage.classList.add('loaded');
      }, { once: true });

      const descriptionContainer = document.createElement('div');
      descriptionContainer.classList.add('description');
      descriptionContainer.appendChild(emojisParser.parse(element.getAttribute('description')));
      newElement.appendChild(descriptionContainer);

      const presentationTitle = document.createElement('div');
      presentationTitle.classList.add('pres-title');
      presentationTitle.textContent = element.getAttribute('presentationtitle') || 'PyTgCalls';
      const presentationDescription = document.createElement('div');
      presentationDescription.classList.add('pres-description');
      presentationDescription.textContent = element.getAttribute('presentationdescription') || 'Async client API for the Telegram calls';
      const presentation = document.createElement('div');
      presentation.classList.add('lib-details');
      presentation.appendChild(presentationTitle);
      presentation.appendChild(presentationDescription);

      const leftIcon = document.createElement('img');
      leftIcon.classList.add('icon');
      leftIcon.src = element.getAttribute('presentationimage') || '/src/assets/pytgcalls.svg';

      const presContainer = document.createElement('div');
      presContainer.classList.add('presentation-data');
      presContainer.appendChild(leftIcon);
      presContainer.appendChild(presentation);

      const updateButton = document.createElement('a');
      updateButton.classList.add('update');
      updateButton.target = '_blank';
      updateButton.textContent = element.getAttribute('presentationbuttontitle') || 'Update';

      if (element.hasAttribute('presentationbuttonurl') && element.getAttribute('presentationbuttonurl').startsWith('https://')) {
        updateButton.href = element.getAttribute('presentationbuttonurl');
      } else {
        const currentVersion = element.getAttribute('version');
        if (currentVersion.endsWith('X')) {
          const searchForVersion = currentVersion.replace(/X+$/g, '');
          if (searchForVersion !== '') {
            requestsManager.retrievePackageData().then((data) => {
              for (const key of Object.keys(data['releases']).reverse()) {
                if (key.startsWith(searchForVersion)) {
                  updateButton.href = 'https://pypi.org/project/py-tgcalls/' + key;
                  break;
                }
              }
            });
          }
        } else {
          updateButton.href = 'https://pypi.org/project/py-tgcalls/' + currentVersion;
        }
      }

      const libPresentationRow = document.createElement('div');
      libPresentationRow.classList.add('lib-presentation');
      libPresentationRow.appendChild(presContainer);
      libPresentationRow.appendChild(updateButton);
      newElement.appendChild(libPresentationRow);
    } else {
      throw new Error("invalid banner data");
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
  } else if (element.tagName.toUpperCase() === 'GITHUB-REF') {
    newElement = document.createElement('a');
    newElement.classList.add('github-ref');
    newElement.target = '_blank';

    if (!element.hasAttribute('reponame') || !element.hasAttribute('user')) {
      throw new Error('invalid repository name/user for github-ref');
    }

    newElement.setAttribute('reponame', element.getAttribute('reponame'));
    newElement.setAttribute('user', element.getAttribute('user'));
  } else if (element.tagName.toUpperCase() === 'REF-SHI') {
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

export function tryToReduceTags(element) {
  const handleItem = (child) => {
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
      throw new Error("A config key that doesn't exist has been requested " + child.getAttribute('id'));
    }
  };

  if (element.tagName.toUpperCase() === 'CONFIG') {
    handleItem(element);
  }

  for (const child of element.querySelectorAll('config')) {
    handleItem(child);
  }
}

function handlePostQueryElement(element, newElement) {
  if (['H1', 'H2', 'H3', 'BANNER'].includes(element.tagName.toUpperCase())) {
    let destElement = newElement;
    if (element.tagName.toUpperCase() === 'BANNER') {
      const bigTitle = newElement.querySelector('.bottom-container > .big-title');
      if (bigTitle) {
        destElement = bigTitle;
      } else {
        return;
      }
    }

    destElement.classList.add('has-hashtag-ref');
    destElement.addEventListener('click', () => {
      const ref = utils.generateSectionRefByTextContent(destElement.textContent);
      window.history.pushState('', '', '#' + ref);
      newElement.scrollIntoView();
    });
  } else if (element.tagName.toUpperCase() === 'REF-SHI') {
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

      const urlBarText = document.createElement('div');
      urlBarText.classList.add('url');
      urlBarText.textContent = src;
      const urlBarOpenImage = iconsManager.get('main', 'upRightFromSquare');
      urlBarOpenImage.classList.add('open');
      const urlBarOpen = document.createElement('a');
      urlBarOpen.classList.add('link');
      urlBarOpen.addEventListener('click', closePopup);
      urlBarOpen.target = '_blank';
      urlBarOpen.href = src;
      urlBarOpen.appendChild(urlBarOpenImage);
      const urlBar = document.createElement('div');
      urlBar.classList.add('url-bar');
      urlBar.appendChild(iconsManager.get('socials', 'github'));
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
          if (!(response instanceof String) && response != null) {
            return;
          }

          codePreview.textContent = '';
          codePreview.classList.remove('is-loading');

          const fakeChild = document.createElement('div');
          if (element.hasAttribute('language')) {
            fakeChild.setAttribute('language', element.getAttribute('language'));
          }
          fakeChild.textContent = response;

          handleSyntaxHighlight(fakeChild, codePreview, true);
        });
      }, { once: true });
    });
  } else if (element.tagName.toUpperCase() === 'ALERT') {
    const elementHeaderText = document.createElement('div');
    elementHeaderText.classList.add('alert-title');
    const elementHeader = document.createElement('div');
    elementHeader.classList.add('alert-header');
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
          elementHeader.prepend(iconsManager.get('main', 'important'));
          elementHeaderText.textContent = 'Important!';
          break;
        case 'note':
          elementHeader.prepend(iconsManager.get('main', 'note'));
          elementHeaderText.textContent = 'Note';
          break;
        case 'warning':
          elementHeader.prepend(iconsManager.get('main', 'warning'));
          elementHeaderText.textContent = 'Warning!';
          break;
      }

    } else {
      throw new Error("An unknown type has been specified for ALERT element");
    }

    newElement.replaceWith(compElement);
    return compElement;
  } else if (element.tagName.toUpperCase() === 'P2P-BANNER') {
    const elementHeaderText = document.createElement('div');
    elementHeaderText.classList.add('alert-title');
    elementHeaderText.textContent = 'Security';
    const elementHeader = document.createElement('div');
    elementHeader.classList.add('alert-header');
    elementHeader.appendChild(iconsManager.get('main', 'check'));
    elementHeader.appendChild(elementHeaderText);

    const elementLockAnimation = document.createElement('img');
    elementLockAnimation.setAttribute('loading', 'lazy');
    elementLockAnimation.src = '/src/assets/speed.gif';

    const elementTitle = document.createElement('div');
    elementTitle.classList.add('alert-title');
    elementTitle.appendChild(document.createTextNode("Don't give up on safety and speed!"));

    const elementData = document.createElement('div');
    elementData.classList.add('alert-content');
    elementData.textContent = "Calls that are made through NTgCalls are 100% encrypted as if you were making them from your trusted Telegram app. All this in just a few lines of code, thanks to the work of our amazing team.";

    const compElement = document.createElement('div');
    compElement.classList.add('alert');
    compElement.dataset.type = 'p2p';
    compElement.appendChild(elementHeader);
    compElement.appendChild(elementLockAnimation);
    compElement.appendChild(elementTitle);
    compElement.appendChild(elementData);

    newElement.replaceWith(compElement);
    return compElement;
  }

  return newElement;
}

function handleSyntaxHighlight(element, newElement, hideTags = false, customTextContent = '', forceDisableCollapse = false) {
  let code = customTextContent || element.textContent;
  // noinspection JSUnresolvedReference
  code = Prism.highlight(code, detectLanguageByElement(element).prism, 'html');
  code = code.replaceAll('\n', '<br/>');

  if (code.startsWith('<br/>')) {
    code = code.slice(5);
  }

  const rows = code.split('<br/>').length;

  code = handleTabsWithSpacer(code);
  newElement.innerHTML = code;
  newElement.style.setProperty('--length', String(rows - 1));

  const updateMark = (startAt, endAt) => {
    newElement.style.setProperty('--start-mark', startAt);
    newElement.style.setProperty('--offset-mark', String(endAt - startAt));
    newElement.classList.add('has-mark');
  };

  let hasValidMarkParameter = false;
  if (element.hasAttribute('mark')) {
    const markData = element.getAttribute('mark');
    if (markData.indexOf('-') === -1) {
      const startAt = parseInt(markData);

      if (!isNaN(startAt)) {
        hasValidMarkParameter = true;
        updateMark(startAt, startAt);
      }
    } else {
      const startAt = parseInt(markData.split('-')[0]);
      const endAt = parseInt(markData.split('-')[1]);

      if (!isNaN(startAt) && !isNaN(endAt)) {
        hasValidMarkParameter = true;
        updateMark(Math.min(startAt, endAt), Math.max(startAt, endAt));
      }
    }
  }

  if (element.tagName.toUpperCase() !== 'SHI' && !hideTags && !hasValidMarkParameter) {
    let successTimeout;

    const languageTagText = document.createElement('span');
    languageTagText.textContent = detectLanguageByElement(element).name;
    const languageTag = document.createElement('div');
    languageTag.classList.add('tag');
    languageTag.appendChild(iconsManager.get('main', 'code'));
    languageTag.appendChild(languageTagText);

    const copyTagSuccess = iconsManager.get('main', 'check');
    copyTagSuccess.classList.add('success');
    const copyTagText = document.createElement('span');
    copyTagText.textContent = 'Copy';
    const copyTag = document.createElement('div');
    copyTag.classList.add('tag', 'is-clickable');
    copyTag.addEventListener('click', () => {
      utils.copyToClipboard(element.textContent).then(() => {
        if (successTimeout) {
          clearTimeout(successTimeout);
        }

        copyTag.classList.add('success');
        successTimeout = setTimeout(() => {
          copyTag.classList.remove('success');
          successTimeout = undefined;
        }, 3000);
      }).catch(() => {

      });
    });
    copyTag.appendChild(copyTagSuccess);
    copyTag.appendChild(iconsManager.get('main', 'copy'));
    copyTag.appendChild(copyTagText);

    const tagsContainer = document.createElement('div');
    tagsContainer.classList.add('tags-container');
    tagsContainer.appendChild(languageTag);
    tagsContainer.appendChild(copyTag);
    newElement.appendChild(tagsContainer);
  }

  return forceDisableCollapse ? newElement : updateSyntaxHighlightWithCollapsable(newElement, rows);
}

function updateSyntaxHighlightWithCollapsable(element, rows) {
  const isExpandable = rows > 9 && getCollapseLongCodeStatus();

  const expandableView = document.createElement('div');
  expandableView.classList.add('expandable');
  expandableView.addEventListener('click', () => externalContainer.classList.add('expanded', 'with-animation'));
  expandableView.textContent = 'Click to expand';
  expandableView.prepend(iconsManager.get('main', 'chevronDown').firstChild);

  const externalContainer = document.createElement('div');
  externalContainer.classList.add('external-sh');
  externalContainer.classList.toggle('expanded', !isExpandable);
  externalContainer.appendChild(element);
  isExpandable && externalContainer.appendChild(expandableView);

  return externalContainer;
}

function handleTabsWithSpacer(code) {
  let firstRowSpacesCount = 0;
  const firstRow = code.split('<br/>')[0];
  for (let char of firstRow) {
    if (char === ' ') {
      firstRowSpacesCount++;
    } else {
      break;
    }
  }

  let baseString = ' '.repeat(firstRowSpacesCount);

  for (let i = 20; i > 1; i--) {
    const newSpacer = baseString + (' '.repeat(i));
    const replacer = '<div class="spacer" style="--id: ' + i + '">&nbsp;</div>';
    code = code.replaceAll(newSpacer, replacer);
  }

  return code;
}

function handleMultiSyntax(element, newElement) {
  const exportAsBlame = element.hasAttribute('as-blame');

  if (!element.getAttribute('id') && !exportAsBlame) {
    throw new Error('multisyntax must have id tag');
  }

  if (!element.querySelector('tabs > tab') && !exportAsBlame) {
    throw new Error('multisyntax must contains tabs');
  }

  if (!element.querySelector('syntax-highlight')) {
    throw new Error('multisyntax must contains syntax highlight elements');
  }

  if (exportAsBlame && element.querySelectorAll('syntax-highlight').length !== 2) {
    throw new Error('multisyntax must contains 2 elements to enable as-blame-mode');
  }

  newElement.classList.add('multisyntax');

  if (exportAsBlame) {
    const syntaxHighlightElements = element.querySelectorAll('syntax-highlight');

    const firstElement = syntaxHighlightElements[0];
    const secondElement = syntaxHighlightElements[1];

    if (detectLanguageByElement(firstElement).name !== detectLanguageByElement(secondElement).name) {
      throw new Error('multisyntax as-blame-mode must contains 2 elements with the same language property');
    }

    if (firstElement.hasAttribute('mark') || secondElement.hasAttribute('mark')) {
      throw new Error('multisyntax as-blame-mode doesn\'t support mark property');
    }

    // noinspection JSUnresolvedReference
    requestAnimationFrame(() => {
      tryToReduceTags(firstElement);
      tryToReduceTags(secondElement);

      const firstElementLines = firstElement.textContent.split("\n");
      const secondElementLines = secondElement.textContent.split("\n");
      const diff = patienceDiff(firstElementLines, secondElementLines);

      let addedRows = [];
      let removedRows = [];
      let finalCode = '';
      let i = 0;
      for (const line of diff.lines) {
        if (line.aIndex < 0) { // added row
          addedRows.push(i);
        } else if (line.bIndex < 0) { // removed row
          removedRows.push(i);
        }

        i++;

        finalCode += line.line + "\n";
      }
      if (finalCode.endsWith("\n")) {
        finalCode = finalCode.slice(0, -2);
      }

      const fakeResyntaxElement = firstElement.cloneNode(false);
      fakeResyntaxElement.innerHTML = finalCode;

      let containsCustomTags = false;
      for (const data of fakeResyntaxElement.querySelectorAll('*')) {
        if (!(data instanceof Text) && data.tagName.toUpperCase() !== 'BR') {
          containsCustomTags = true;
          break;
        }
      }

      if (containsCustomTags) {
        throw new Error("Syntax highlight can't contain other tags");
      }

      newElement.classList.remove('multisyntax');
      newElement.classList.add('syntax-highlight');
      newElement.classList.add('has-blame');
      newElement = handleSyntaxHighlight(fakeResyntaxElement, newElement, true, finalCode);

      for (const addedRow of addedRows) {
        const tempMark = document.createElement('div');
        tempMark.classList.add('temp-mark', 'added-row');
        tempMark.style.setProperty('--start-mark', addedRow);
        newElement.appendChild(tempMark);
      }

      for (const addedRow of removedRows) {
        const tempMark = document.createElement('div');
        tempMark.classList.add('temp-mark', 'removed-row');
        tempMark.style.setProperty('--start-mark', addedRow);
        newElement.appendChild(tempMark);
      }
    });

    return;
  }

  const tabsContainer = document.createElement('div');
  tabsContainer.classList.add('tabs');
  tabsContainer.style.setProperty('--i', element.querySelectorAll('tabs > tab').length);
  newElement.appendChild(tabsContainer);

  let tabIds = [];
  for (const [id, tab] of Object.entries(element.querySelectorAll('tabs > tab'))) {
    if (!tab.textContent || !tab.getAttribute('id')) {
      throw new Error('tab has invalid data for multisyntax');
    }

    tabIds.push(tab.getAttribute('id'));

    const tabElement = document.createElement('div');
    tabElement.classList.add('tab');
    tabElement.addEventListener('click', () => {
      if (!homePage.onChangeFavoriteSyntaxTabAnimationState.ultimateDataCall) {
        let currentState = homePage.onChangeFavoriteSyntaxTab.ultimateDataCall;
        currentState[element.getAttribute('id')] = tab.getAttribute('id');
        homePage.onChangeFavoriteSyntaxTab.callAllListeners(currentState);
        localStorage.setItem('currentTabDataIndexes', JSON.stringify(currentState));
      }
    });
    tabElement.textContent = tab.textContent;
    tabsContainer.appendChild(tabElement);

    homePage.onChangeFavoriteSyntaxTab.addListener({
      callback: (data) => {
        const currentData = data[element.getAttribute('id')];
        if (currentData && tabIds.includes(currentData)) {
          tabElement.classList.toggle('active', tab.getAttribute('id') === currentData);
          if (tab.getAttribute('id') === currentData) {
            tabsContainer.style.setProperty('--eid', parseInt(id));
          }
        } else if (!currentData && !parseInt(id)) {
          tabElement.classList.add('active');
          tabsContainer.style.setProperty('--eid', '0');
        }
      },
      ref: tabElement,
      recallWithCurrentData: true,
    });
  }

  const syntaxHighlightContainer = document.createElement('div');
  syntaxHighlightContainer.classList.add('sy-container');
  newElement.appendChild(syntaxHighlightContainer);

  let syntaxIds = [];

  for (const [id, syntax] of Object.entries(element.querySelectorAll('syntax-highlight'))) {
    if (!syntax.getAttribute('id')) {
      throw new Error('syntax has invalid data for multisyntax');
    }

    syntaxIds.push(syntax.getAttribute('id'));

    let syntaxElement = document.createElement('div');

    tryToReduceTags(syntax);
    syntaxElement = checkAndManageElement(syntax, syntaxElement, document.createElement('div'));

    let containsCustomTags = false;
    for (const data of syntax.querySelectorAll('*')) {
      if (!(data instanceof Text) && data.tagName.toUpperCase() !== 'BR') {
        containsCustomTags = true;
        break;
      }
    }

    if (containsCustomTags) {
      throw new Error("Syntax highlight can't contain other tags");
    }

    syntaxElement = handleSyntaxHighlight(syntax, syntaxElement, true);
    syntaxHighlightContainer.appendChild(syntaxElement);

    homePage.onChangeFavoriteSyntaxTab.addListener({
      callback: (data) => {
        const currentData = data[element.getAttribute('id')];
        if (currentData && syntaxIds.includes(currentData)) {
          const activeItem = syntaxHighlightContainer.querySelector('.active');
          if (activeItem) {
            if (activeItem !== syntaxElement && syntax.getAttribute('id') === currentData) {
              homePage.onChangeFavoriteSyntaxTabAnimationState.callAllListeners(true);

              const childNodes = [...syntaxHighlightContainer.childNodes];
              let updatedChildren = [];
              for (const syntax of childNodes) {
                if (syntax !== syntaxElement && syntax !== activeItem) {
                  updatedChildren.push(syntax);
                  syntax.classList.add('hidden');
                }
              }

              const asBack = childNodes.indexOf(activeItem) > childNodes.indexOf(syntaxElement);

              const activeItemRect = activeItem.getBoundingClientRect();
              syntaxHighlightContainer.style.setProperty('--height', activeItemRect.height + 'px');
              syntaxHighlightContainer.classList.add('preparing-animation');

              const currentItemRect = syntaxElement.getBoundingClientRect();
              syntaxHighlightContainer.style.setProperty('--to-height', currentItemRect.height + 'px');
              activeItem.classList.add('disappearing');
              syntaxHighlightContainer.classList.add('animating');
              syntaxHighlightContainer.classList.toggle('animating-asback', asBack);
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
                syntaxHighlightContainer.classList.remove('animating-asback');
                homePage.onChangeFavoriteSyntaxTabAnimationState.callAllListeners(false);

                for (const child of updatedChildren) {
                  child.classList.remove('hidden');
                }
              });
            }
          } else {
            syntaxElement.classList.toggle('active', syntax.getAttribute('id') === currentData);
          }
        } else {
          syntaxElement.classList.toggle('active', !parseInt(id));
        }
      },
      ref: syntaxElement,
      recallWithCurrentData: true,
    });
  }
}

function handleGithubRef(element) {
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

  const githubCacheKey = 'githubData_' + element.getAttribute('user') + '_' + element.getAttribute('reponame');

  const isValidCacheContent = (cacheContent, checkingFromCache = false) => {
    let isValidContent = (
        typeof cacheContent['full_name'] == 'string' && cacheContent['full_name'].trim()
        && (typeof cacheContent['description'] == 'string' || cacheContent['description'] == null)
        && typeof cacheContent['html_url'] == 'string' && cacheContent['html_url'].trim()
        && typeof cacheContent['owner'] == 'object'
        && typeof cacheContent['owner']['avatar_url'] == 'string' && cacheContent['owner']['avatar_url'].trim()
        && typeof cacheContent['language'] == 'string' && cacheContent['language'].trim()
        && typeof cacheContent['forks'] == 'number'
        && typeof cacheContent['stargazers_count'] == 'number'
    );

    if (checkingFromCache && isValidContent) {
      isValidContent = (
          typeof cacheContent['svd_time'] == 'number'
          && (new Date().getTime() - cacheContent['svd_time']) < 86400 * 1000
          // max cache 1d
      );
    }

    return isValidContent;
  };

  const filterResponse = (cacheContent) => {
    return {
      full_name: cacheContent['full_name'],
      description: cacheContent['description'],
      html_url: cacheContent['html_url'],
      owner: {
        avatar_url: cacheContent['owner']['avatar_url']
      },
      language: cacheContent['language'],
      forks: cacheContent['forks'],
      stargazers_count: cacheContent['stargazers_count'],
      svd_time: cacheContent['svd_time']
    };
  }

  const handleElementUpdate = (response) => {
    requestAnimationFrame(() => {
      const recommendedIcon = iconsManager.get('main', 'star');
      const recommendedBadge = document.createElement('div');
      recommendedBadge.classList.add('recommended-badge');
      recommendedBadge.appendChild(recommendedIcon);
      recommendedBadge.appendChild(document.createTextNode('Recommended by our staff'));

      const repoTitle = document.createElement('div');
      repoTitle.classList.add('repo-title');
      repoTitle.textContent = response['full_name'];
      const repoDescription = document.createElement('div');
      repoDescription.classList.add('repo-description');
      repoDescription.textContent = response['description'];
      const repoDetails = document.createElement('div');
      repoDetails.classList.add('repo-details');
      repoDetails.appendChild(repoTitle);
      repoDetails.appendChild(repoDescription);

      const repoOwnerImage = document.createElement('img');
      repoOwnerImage.src = response['owner']['avatar_url'];
      const repoPresentation = document.createElement('div');
      repoPresentation.classList.add('repo-presentation');
      repoPresentation.appendChild(repoDetails);
      repoPresentation.appendChild(repoOwnerImage);

      const repoLanguage = document.createElement('div');
      repoLanguage.classList.add('value', 'repo-language');
      repoLanguage.style.setProperty('--color', getLanguageColorByName(response['language']));
      repoLanguage.textContent = response['language'];
      const repoStars = document.createElement('div');
      repoStars.classList.add('value', 'repo-stars');
      repoStars.appendChild(iconsManager.get('main', 'star'));
      repoStars.appendChild(document.createTextNode(response['stargazers_count']));
      const repoForks = document.createElement('div');
      repoForks.classList.add('value', 'repo-forks');
      repoForks.appendChild(iconsManager.get('main', 'codeFork'));
      repoForks.appendChild(document.createTextNode(response['forks']));
      const repoValues = document.createElement('div');
      repoValues.classList.add('repo-values');
      repoValues.appendChild(repoLanguage);
      repoValues.appendChild(repoStars);
      repoValues.appendChild(repoForks);

      element.classList.remove('is-loading');
      element.textContent = '';
      element.setAttribute('href', response['html_url']);
      element.appendChild(recommendedBadge);
      element.appendChild(repoPresentation);
      element.appendChild(repoValues);
    });
  };

  requestAnimationFrame(() => {
    const dataFromCache = localStorage.getItem(githubCacheKey);
    if (dataFromCache) {
      try {
        const parsedData = JSON.parse(dataFromCache);
        if (isValidCacheContent(parsedData, true)) {
          handleElementUpdate(parsedData);
          return;
        }
      } catch(e) {}
    }

    const XML = new XMLHttpRequest();
    XML.open('GET', 'https://api.github.com/repos/' + element.getAttribute('user') + '/' + element.getAttribute('reponame'), true);
    XML.send();
    XML.addEventListener('readystatechange', (e) => {
      if (e.target.readyState === 4 && e.target.status === 200) {
        const response = JSON.parse(e.target.response);

        if (response['message']) {
          throw new Error('the repository is invalid');
        } else {
          if (isValidCacheContent(response)) {
            handleElementUpdate(response);

            response['svd_time'] = new Date().getTime();
            localStorage.setItem(githubCacheKey, JSON.stringify(filterResponse(response)));
          }
        }
      }
    });
  });
}

export function handleHomepageSyntaxHighlightElement(element) {
  let newElement = document.createElement('div');
  tryToReduceTags(element);
  newElement = checkAndManageElement(element, newElement, document.createElement('div'));
  newElement = handleSyntaxHighlight(element, newElement, true, '', true);
  return newElement;
}