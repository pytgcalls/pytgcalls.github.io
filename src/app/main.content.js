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

import ListenerManagerInstance from "./main.listener.js";
import * as utils from "./main.utils.js";
import * as requestsManager from "./main.requests.js";
import * as config from "./main.config.js";
import * as iconsManager from "./main.icons.js";
import * as indexesManager from "./main.indexes.js";
import * as debug from "./main.debug.js";
import * as sourceParser from "./main.parser.js";
import * as homePage from "./main.home.js";

const onSelectedSectionListenerInstance = new ListenerManagerInstance();

let currentContentElement;
let currentSectionsElement;

function getElement() {
  const content = document.createElement('div');
  content.classList.add('content');
  currentContentElement = content;

  const pageSections = document.createElement('div');
  pageSections.classList.add('sections');
  currentSectionsElement = pageSections;

  const fragment = document.createDocumentFragment();
  fragment.append(content);
  fragment.append(pageSections);

  return fragment;
}

async function loadFile(fileName, hash = '', avoidPushingState = false) {
  const { content, pageSections } = replaceWithValidElements();

  const pathFileName = utils.parseCategoryUrl(fileName);
  const indexedCache = indexesManager.getFullIndexedValue(fileName);

  if (typeof indexedCache != 'undefined') {
    if (!avoidPushingState) {
      window.history.pushState('', '', pathFileName + (hash ?? ''));
    }

    await handleResponse(fileName, content, pageSections, indexedCache, hash);
    handlePathPNManager(content, fileName);
  } else {
    try {
      let response = await requestsManager.initRequest(fileName);
      if (!avoidPushingState) {
        window.history.pushState('', '', pathFileName + (hash ?? ''));
      }
      indexesManager.saveAsFullIndexedValue(fileName, response);
      await handleResponse(fileName, content, pageSections, response, hash);
      handlePathPNManager(content, fileName);
    } catch (ignored) {
      content.classList.add('is-loading');
      content.textContent = 'Request failed';
      pageSections.classList.add('is-loading');
      pageSections.textContent = '';
    }
  }
}

function handleCustomCodeInsert(data) {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  const { content, pageSections } = replaceWithValidElements();
  // noinspection JSIgnoredPromiseFromCall
  handleResponse("", content, pageSections, data, "");
}

function clearBoard() {
  replaceWithValidElements(true);
}

function replaceWithValidElements(isEmpty = false) {
  const content = document.createElement('div');
  content.classList.add('content', 'is-loading');
  !isEmpty && content.appendChild(utils.createLoadingItem());
  currentContentElement.replaceWith(content);
  currentContentElement = content;

  const pageSections = document.createElement('div');
  pageSections.classList.add('sections', 'is-loading');
  currentSectionsElement.replaceWith(pageSections);
  currentSectionsElement = pageSections;

  return { content, pageSections };
}

function handleResponse(fileName, content, pageSections, response, hash) {
  const data = sourceParser.getContentByData(response);
  content.classList.remove('is-loading');
  content.textContent = '';
  content.appendChild(data);

  const sectionsContainer = document.createElement('div');
  sectionsContainer.classList.add('sections-recap');
  iterPageSectionsData(data, sectionsContainer);

  pageSections.classList.remove('is-loading');
  pageSections.textContent = '';
  pageSections.appendChild(sectionsContainer);

  if (fileName !== "") {
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
    handleHash(data, hash);
  } catch (ignored) { }
}

function handlePathPNManager(content, fileName) {
  config.getTheNextFileAfter(fileName).then(({ previousFile, nextFile, basePath }) => {
    const goToPreviousBigTitle = document.createElement('div');
    goToPreviousBigTitle.classList.add('big-title');
    goToPreviousBigTitle.textContent = 'Previous';
    const goToPreviousMiniTitle = document.createElement('div');
    goToPreviousMiniTitle.classList.add('mini-title');
    const goToPreviousContainer = document.createElement('div');
    goToPreviousContainer.classList.add('go-to');
    goToPreviousContainer.appendChild(iconsManager.get('main', 'arrowLeft'));
    goToPreviousContainer.appendChild(goToPreviousBigTitle);
    goToPreviousContainer.appendChild(goToPreviousMiniTitle);

    const goToNextBigTitle = document.createElement('div');
    goToNextBigTitle.classList.add('big-title');
    goToNextBigTitle.textContent = 'Next';
    const goToNextMiniTitle = document.createElement('div');
    goToNextMiniTitle.classList.add('mini-title');
    const goToNextContainer = document.createElement('div');
    goToNextContainer.classList.add('go-to');
    goToNextContainer.appendChild(iconsManager.get('main', 'arrowRight'));
    goToNextContainer.appendChild(goToNextBigTitle);
    goToNextContainer.appendChild(goToNextMiniTitle);

    const goToContainer = document.createElement('div');
    goToContainer.classList.add('go-to-container');
    goToContainer.classList.toggle('has-only-next', !previousFile && !!nextFile);

    if (typeof previousFile != 'undefined') {
      goToPreviousMiniTitle.textContent = utils.getCategoryFileName(previousFile.replace(basePath, ''));
      goToPreviousContainer.addEventListener('click', () => {
        handleRedirectWithAnimation(content, previousFile);
      });
      goToContainer.appendChild(goToPreviousContainer);
    }

    if (typeof nextFile != 'undefined') {
      goToNextMiniTitle.textContent = utils.getCategoryFileName(nextFile.replace(basePath, ''));
      goToNextContainer.addEventListener('click', () => {
        handleRedirectWithAnimation(content, nextFile);
      });
      goToContainer.appendChild(goToNextContainer);
    }

    content.appendChild(goToContainer);
  });
}

function handleRedirectWithAnimation(content, url) {
  content.classList.add('disappear');
  content.addEventListener('animationend', () => {
    homePage.handleAsRedirect(utils.parseCategoryUrl(url));
  }, { once: true });
}

function handleHash(data, hash) {
  if (typeof hash != 'undefined' && hash.length) {
    if (hash.startsWith('#')) {
      hash = hash.slice(1);
    }

    const selectedChild = data.querySelectorAll('.h1, .h2, .h3, .banner-container');
    for (const child of selectedChild) {
      let destElement = child;
      if (child.classList.contains('banner-container')) {
        const bigTitle = child.querySelector('.bottom-container > .big-title');
        if (bigTitle) {
          destElement = bigTitle;
        } else {
          continue;
        }
      }

      if (utils.generateSectionRefByTextContent(destElement.textContent) === hash) {
        child.scrollIntoView();
        break;
      }
    }
  }
}

function iterPageSectionsData(container, currentDom, childrenLimit = Infinity) {
  for (const [id, element] of container.childNodes.entries()) {
    if (id > childrenLimit) {
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

        cloned.addEventListener('click', () => updateActiveSection(element));

        let hasRefElement = false;
        for (const child of element.childNodes) {
          if (child instanceof Element && child.classList.contains('ref')) {
            let hasSbElement = false;
            for (const sb of child.childNodes) {
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
      } else if (element.classList.contains('category') || element.classList.contains('subtext')) {
        const cloned = element.cloneNode(false);
        currentDom.append(cloned);
        iterPageSectionsData(element, cloned);
      } else if (element.tagName.toUpperCase() === 'TABLE') {
        const clonedTable = document.createElement('div');
        clonedTable.classList.add('subtext');
        currentDom.append(clonedTable);
        iterPageSectionsData(element, clonedTable);
      } else if (element.tagName.toUpperCase() === 'TR') {
        iterPageSectionsData(element, currentDom, 1);
      } else if (element.classList.contains('banner')) {
        const bigTitle = element.querySelector('.banner-container > .bottom-container > .big-title');
        if (bigTitle && bigTitle.textContent !== '') {
          const clonedBannerState = document.createElement('div');
          clonedBannerState.classList.add('h2');
          clonedBannerState.addEventListener('click', () => updateActiveSection(element));
          clonedBannerState.textContent = bigTitle.textContent;
          currentDom.append(clonedBannerState);
        }
      }
    }
  }
}

function updateMobileSectionsVisibilityState(forcedState) {
  return currentSectionsElement.classList.toggle('show', forcedState);
}

function updateActiveSection(section) {
  section.scrollIntoView({
    behavior: 'smooth'
  });
  onSelectedSectionListenerInstance.callAllListeners();
}

function resetData() {
   currentContentElement = undefined;
   currentSectionsElement = undefined;
}

export {
  getElement,
  loadFile,
  handleCustomCodeInsert,
  clearBoard,
  updateMobileSectionsVisibilityState,
  updateActiveSection,
  resetData,
  onSelectedSectionListenerInstance
};