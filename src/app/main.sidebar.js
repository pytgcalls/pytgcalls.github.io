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

import * as utils from "./main.utils.js";
import ListenerManagerInstance from "./main.listener.js";
import * as iconsManager from "./main.icons.js";
import * as config from "./main.config.js";
import * as indexesManager from "./main.indexes.js";
import * as debug from "./main.debug.js";

const onChangeListenerInstance = new ListenerManagerInstance();
const onCollapsedListenerInstance = new ListenerManagerInstance();

let leftContainer;
let leftSidebar;
let sidebarSticky;

let searchResults;
let searchInputText;

let currentLoadedSidebarId;
let hasLoaded = false;

function getElement() {
  const { searchInput, searchResults } = createSearchBar();
  const leftSidebarElement = document.createElement('div');
  leftSidebarElement.classList.add('left-sidebar', 'expanded');
  leftSidebar = leftSidebarElement;

  const exploreString = document.createElement('span');
  exploreString.textContent = 'Explore';
  const exploreTitle = document.createElement('div');
  exploreTitle.classList.add('explore');
  exploreTitle.appendChild(exploreString);

  const sidebarStickyElement = document.createElement('div');
  sidebarStickyElement.classList.add('sidebar-sticky');
  sidebarStickyElement.appendChild(exploreTitle);
  sidebarStickyElement.appendChild(searchInput);
  sidebarSticky = sidebarStickyElement;

  leftSidebarElement.addEventListener('scroll', () => {
    sidebarSticky.classList.toggle('use-mini-title', searchResults.classList.contains('expanded') || leftSidebar.scrollTop > 0);
  });

  const leftContainerElement = document.createElement('div');
  leftContainerElement.classList.add('left-container');
  leftContainerElement.appendChild(sidebarStickyElement);
  leftContainerElement.appendChild(searchResults);
  leftContainerElement.appendChild(leftSidebarElement);
  leftContainer = leftContainerElement;

  return leftContainerElement;
}

function focusOnSidebar() {
  leftContainer.classList.remove('collapsed');
  onCollapsedListenerInstance.callAllListeners(false);
  killSearch();
}

function killSearch() {
  searchResults.classList.remove('expanded');
  leftSidebar.classList.add('expanded');
  searchResults.textContent = '';
  searchInputText.value = '';
  searchInputText.classList.add('is-empty');
  sidebarSticky.classList.toggle('use-mini-title', leftSidebar.scrollTop > 0);
}

function updateMobileVisibilityState(forcedState) {
  focusOnSidebar();
  return leftContainer.classList.toggle('show', forcedState);
}

function updateDesktopCollapsedState(isCollapsed) {
  return leftContainer.classList.toggle('collapsed', isCollapsed);
}

function createSearchBar() {
  const searchText = document.createElement('input');
  searchText.classList.add('is-empty');
  searchText.placeholder = 'Search...';
  searchInputText = searchText;
  const searchCancelIcon = iconsManager.get('main', 'circleXMark');
  searchCancelIcon.classList.add('cancel');
  const searchInput = document.createElement('div');
  searchInput.classList.add('search-input');
  searchInput.appendChild(iconsManager.get('main', 'magnifyingGlass'));
  searchInput.appendChild(searchText);
  searchInput.appendChild(searchCancelIcon);

  const searchResultsContainer = document.createElement('div');
  searchResultsContainer.classList.add('search-results');
  searchResults = searchResultsContainer;

  searchCancelIcon.addEventListener('click', () => killSearch());

  let wasExpanded = false;
  searchInput.addEventListener('input', () => {
    const expandSearchBar = !!searchText.value.trim().length;

    searchText.classList.toggle('is-empty', !expandSearchBar);
    searchResultsContainer.classList.toggle('expanded', expandSearchBar);
    sidebarSticky.classList.toggle('use-mini-title', expandSearchBar);
    leftSidebar.classList.toggle('expanded', !expandSearchBar);

    if (expandSearchBar && !wasExpanded) {
      searchResultsContainer.scrollTo(0, 0);
    }

    if (!expandSearchBar) {
      sidebarSticky.classList.toggle('use-mini-title', leftSidebar.scrollTop > 0);
    }

    wasExpanded = expandSearchBar;
    handleSearchValue(searchText, searchResultsContainer);
  });

  return {
    searchInput,
    searchResults: searchResultsContainer,
  };
}

function handleSearchValue(input, results) {
  config.loadConfig().then(() => {
    const onSearchReady = (text) => {
      if (!text.length) {
        results.textContent = '';
        results.classList.remove('is-loading');
        return;
      }

      let promise;
      if (typeof currentLoadedSidebarId == 'undefined') {
        promise = config.getAllFilesListFiles();
      } else {
        promise = config.getAllFilesListFilesById(currentLoadedSidebarId);
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
              resultsFragment.append(createSingleSearchResult(file, fileDataKeys, foundInName, text));
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

    if (!indexesManager.isCurrentlyIndexing) {
      if (!indexesManager.hasIndexed) {
        searchResults.classList.add('is-loading');
        searchResults.textContent = '';
        searchResults.appendChild(utils.createLoadingItem(50));

        indexesManager.initFull(() => { }).then(() => {
          onSearchReady(input.value.trim());
        });
      } else {
        onSearchReady(input.value.trim());
      }
    }
  });
}

function createSingleSearchResult(file, fileDataKeys, foundInName, text) {
  const fileDataTitle = document.createElement('div');
  fileDataTitle.classList.add('file-data-title');
  fileDataTitle.textContent = utils.parseCategoryName(file.replaceAll('/', ' > '));
  const fileData = document.createElement('div');
  fileData.classList.add('file-data');
  fileData.addEventListener('click', () => {
    globalUpdateActiveFile(file);
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

  const elementIcon = iconsManager.get('main', 'chevronDown');
  elementIcon.classList.add('right-icon');
  fileData.appendChild(elementIcon);

  return fileData;
}

function loadSidebar(id) {
  if (currentLoadedSidebarId === id) {
    return Promise.resolve();
  }

  const promise = getPromiseBeforeLoadSidebar();

  promise.then(() => {
    hasLoaded = true;

    const content = leftSidebar;
    content.textContent = '';

    if (debug.isSafeToUseDebugItems()) {
      content.appendChild(composeDebugProperties());
    }

    currentLoadedSidebarId = id;

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
                fragment.append(handleSidebarFile(file, i, basePathForMainFiles));
              }
              break;
            case 'MICROTAG':
              if (file.textContent.length) {
                fragment.append(handleSidebarMicrotag(file, i));
              }
              break;
            case 'GROUP':
              const groupFilesList = file.querySelectorAll('file');
              if (groupFilesList.length) {
                const basePathForGroupFiles = file.getAttribute('basepath');

                if (!basePathForGroupFiles) {
                  throw new Error("group elements require a basepath");
                } else {
                  fragment.append(handleSidebarGroup(i, basePathForMainFiles, basePathForGroupFiles, groupFilesList));
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

function getPromiseBeforeLoadSidebar() {
  if (!hasLoaded) {
    return Promise.resolve();
  } else {
    return new Promise((resolve) => {
      leftSidebar.classList.add('faster');
      leftSidebar.classList.add('disappear');
      leftSidebar.lastChild.addEventListener('animationend', () => {
        leftSidebar.classList.remove('disappear');
        resolve();
      }, { once: true });
    });
  }
}

function handleSidebarFile(file, i, basePathForMainFiles) {
  const fullPath = basePathForMainFiles ? (basePathForMainFiles + file.textContent) : undefined;

  return createSidebarFileElement(
      i.toString(),
      utils.parseCategoryName(file.textContent).replace(basePathForMainFiles ?? '', ''),
      fullPath
  );
}

function handleSidebarMicrotag(file, i) {
  const element = document.createElement('div');
  element.classList.add('microtag');
  element.style.setProperty('--id', i.toString());
  element.textContent = file.textContent;

  return element;
}

function handleSidebarGroup(i, basePathForMainFiles, basePathForGroupFiles, groupFilesList) {
  const elementText = document.createElement('div');
  elementText.classList.add('text');
  elementText.textContent = utils.parseCategoryName(basePathForGroupFiles).replace(basePathForMainFiles ?? '', '');
  const element = document.createElement('div');
  element.classList.add('element');
  element.appendChild(elementText);
  element.appendChild(iconsManager.get('main', 'chevronDown'));

  const elementsGroup = document.createElement('div');
  elementsGroup.classList.add('elements');
  elementsGroup.style.setProperty('--id', i.toString());
  elementsGroup.appendChild(element);

  for (const file of groupFilesList) {
    let fullPath = basePathForGroupFiles + file.textContent;

    const element = createSidebarFileElement(
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

function createSidebarFileElement(id, textContent, contentUri = textContent) {
  const element = document.createElement('div');
  element.classList.add('element');
  element.addEventListener('click', () => {
    globalUpdateActiveFile(contentUri);
  });
  element.style.setProperty('--id', id);
  element.textContent = textContent;

  onChangeListenerInstance.addListener({
    callback: (activePath) => {
      element.classList.toggle('active', contentUri === activePath);
    },
    isInternal: true,
    ref: element
  });

  return element;
}

function composeDebugProperties() {
  if (!debug.isSafeToUseDebugItems()) {
    return document.createDocumentFragment();
  }

  const elementText = document.createElement('div');
  elementText.classList.add('text');
  elementText.textContent = 'Internal debug options';
  const element = document.createElement('div');
  element.classList.add('element');
  element.appendChild(elementText);
  element.appendChild(iconsManager.get('main', 'chevronDown'));

  const elementsGroup = document.createElement('div');
  elementsGroup.classList.add('elements');
  elementsGroup.style.setProperty('--id', '0');
  elementsGroup.appendChild(element);

  const customCodeElement = document.createElement('div');
  customCodeElement.classList.add('element');
  customCodeElement.addEventListener('click', () => debug.tryCustomPageCode(false));
  customCodeElement.style.setProperty('--id', '1');
  customCodeElement.textContent = 'Try custom page code';
  elementsGroup.append(customCodeElement);

  const customConfigElement = document.createElement('div');
  customConfigElement.classList.add('element');
  customConfigElement.addEventListener('click', () => debug.tryCustomPageCode(true));
  customConfigElement.style.setProperty('--id', '2');
  customConfigElement.textContent = 'Try custom config code';
  elementsGroup.append(customConfigElement);

  const customDataDocsServer = document.createElement('div');
  customDataDocsServer.classList.add('element');
  customDataDocsServer.addEventListener('click', () => debug.tryCustomServer());
  customDataDocsServer.style.setProperty('--id', '3');
  customDataDocsServer.textContent = 'Try custom server';
  elementsGroup.append(customDataDocsServer);

  const reloadPage = document.createElement('div');
  reloadPage.classList.add('element');
  reloadPage.addEventListener('click', () => debug.reloadPageData());
  reloadPage.style.setProperty('--id', '4');
  reloadPage.textContent = 'Reload page data';
  elementsGroup.append(reloadPage);

  elementsGroup.style.setProperty('--items', '5');
  element.addEventListener('click', () => elementsGroup.classList.toggle('expanded'));

  return elementsGroup;
}

function updateActiveFile(file) {
  onChangeListenerInstance.callInternalListeners(file);
}

function globalUpdateActiveFile(file) {
  onChangeListenerInstance.callAllListeners(file);
}

function resetData() {
  leftContainer = undefined;
  leftSidebar = undefined;
  sidebarSticky = undefined;

  searchResults = undefined;
  searchInputText = undefined;

  currentLoadedSidebarId = undefined;
  hasLoaded = false;
}

export {
  getElement,
  focusOnSidebar,
  killSearch,
  updateMobileVisibilityState,
  updateDesktopCollapsedState,
  loadSidebar,
  updateActiveFile,
  resetData,
  onChangeListenerInstance,
  onCollapsedListenerInstance
};