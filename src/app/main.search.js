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

import * as iconsManager from "./main.icons.js";
import * as indexesManager from "./main.indexes.js";
import {createLoadingItem} from "./main.utils.js";
import {loadConfig} from "./main.config.js";
import {handleRecursive} from "./main.parser.js";
import {globalUpdateActiveFile} from "./main.sidebar.js";
import * as tooltip from "./main.tooltip.js";

let lastStartByElement;
let searchTextElement;
let searchTextFullElement;
let searchContainerElement;
let searchSpinnerContainerElement;
let searchListAdapterElement;
let searchResultsFullElement;
let currentSearchTimeout;

function openSearchContainer(startBy) {
    lastStartByElement = startBy;

    const startByRect = startBy.getBoundingClientRect();

    const searchText = document.createElement('input');
    searchText.placeholder = 'Search Docs';
    const searchCancelIcon = iconsManager.get('main', 'circleXMark').firstChild;
    searchCancelIcon.classList.add('cancel');
    const searchTextFull = document.createElement('div');
    searchTextFull.classList.add('search-input');
    searchTextFull.appendChild(iconsManager.get('main', 'magnifyingGlass').firstChild);
    searchTextFull.appendChild(searchText);
    searchTextFull.appendChild(searchCancelIcon);
    searchTextElement = searchText;
    searchTextFullElement = searchTextFull;

    const searchListAdapter = document.createElement('div');
    searchListAdapter.classList.add('list-adapter');
    searchListAdapterElement = searchListAdapter;

    const searchTextFullAnimation = searchTextFull.cloneNode(true);
    searchTextFullAnimation.classList.add('animated');

    const searchSpinnerContainer = document.createElement('div');
    searchSpinnerContainer.classList.add('spinner');
    searchSpinnerContainer.appendChild(createLoadingItem(50));
    searchTextFull.appendChild(searchSpinnerContainer);
    searchSpinnerContainerElement = searchSpinnerContainer;

    const searchResultsFull = document.createElement('div');
    searchResultsFull.classList.add('search-results');
    searchResultsFull.appendChild(searchTextFull);
    searchResultsFull.appendChild(searchListAdapter);
    searchResultsFullElement = searchResultsFull;

    const searchContainer = document.createElement('div');
    searchContainer.classList.add('search-container', 'text-is-empty');
    searchContainer.addEventListener('click', (e) => {
       if (e.target !== searchResultsFull && !searchResultsFull.contains(e.target)) {
           closeSearch();
       }
    });
    searchContainer.appendChild(searchTextFullAnimation);
    searchContainer.appendChild(searchResultsFull);
    document.body.appendChild(searchContainer);
    searchContainerElement = searchContainer;

    searchCancelIcon.addEventListener('click', () => {
        searchText.value = '';
        searchContainer.classList.add('text-is-empty');
        searchListAdapterElement.textContent = '';
    })

    searchText.addEventListener('input', () => {
       if (!searchText.value.trim()) {
           searchContainer.classList.add('text-is-empty');
           return;
       }

       handleSearch();
    });

    let hasAlreadyText = false;

    searchTextFullAnimation.addEventListener('animationend', () => {
        searchContainer.classList.remove('animate-appear');
        searchTextFullAnimation.remove();

        if (hasAlreadyText) {
            handleSearch();
        } else {
            searchText.focus();
        }
    }, { once: true });

    const inputByLastStartBy = getInputByLastStartBy();
    if (inputByLastStartBy !== null) {
        searchText.value = inputByLastStartBy.value;
        hasAlreadyText = !!inputByLastStartBy.value.trim();

        const animationInput = searchTextFullAnimation.querySelector('input');
        if (animationInput !== null) {
            animationInput.value = inputByLastStartBy.value;
        }
    }

    updateSearchAnimationState(searchTextFullAnimation, startByRect, searchTextFull.getBoundingClientRect());
    searchContainer.classList.add('animate-appear');
    startBy.classList.add('opened');
}

function handleSearch() {
    loadConfig().then(() => {
        const onSearchReady = (text) => {
            searchContainerElement.classList.toggle('text-is-empty', !text.trim());

            if (!text.length) {
                return;
            }

            const codeRefResults = document.createDocumentFragment();
            const codeRefResultsLimited = document.createDocumentFragment();
            let codeRefResultsCount = 0;

            const docsRefResults = document.createDocumentFragment();
            const docsRefResultsLimited = document.createDocumentFragment();
            let docsRefResultsCount = 0;

            for (const indexedFile of indexesManager.getAllIndexedFiles()) {
                let addedDocsRefForFile = false;
                for (const indexedValue of indexesManager.getIndexedValue(indexedFile)) {
                    if (indexedValue instanceof indexesManager.FileIndex) {
                        if (indexedValue.getName().toLowerCase().indexOf(text.toLowerCase().trim()) !== -1) {
                            codeRefResultsCount++;
                            (codeRefResultsCount > 3 ? codeRefResults : codeRefResultsLimited).append(createReference(indexedValue.getType(), indexedValue.getName(), indexedFile));
                        }
                    } else if (indexedValue instanceof indexesManager.ElementIndex && !addedDocsRefForFile) {
                        if (indexedValue.getMainElement().textContent.toLowerCase().indexOf(text.toLowerCase().trim()) !== -1) {
                            docsRefResultsCount++;
                            addedDocsRefForFile = true;
                            (docsRefResultsCount > 3 ? docsRefResults : docsRefResultsLimited).append(createReference(null, null, indexedFile, docsRefResultsCount > 3 ? undefined : indexedValue.getChunk(), text));
                        }
                    }
                }
            }

            searchListAdapterElement.textContent = '';
            searchListAdapterElement.scrollTo(0, 0);

            if (codeRefResultsCount > 0) {
                const codeRefTitle = document.createElement('div');
                codeRefTitle.classList.add('row-title');
                codeRefTitle.textContent = 'Code References';
                searchListAdapterElement.appendChild(codeRefTitle);
                searchListAdapterElement.appendChild(codeRefResultsLimited);

                if (codeRefResultsCount > 3) {
                    const codeRefShowMore = document.createElement('div');
                    codeRefShowMore.classList.add('show-more');
                    codeRefShowMore.addEventListener('click', () => expandContainer(codeRefResults));
                    codeRefShowMore.textContent = 'Show more';
                    codeRefShowMore.appendChild(iconsManager.get('main', 'arrowRight').firstChild);
                    codeRefTitle.appendChild(codeRefShowMore);
                }
            }

            if (docsRefResultsCount > 0) {
                const docsRefTitle = document.createElement('div');
                docsRefTitle.classList.add('row-title');
                docsRefTitle.textContent = 'Docs References';
                searchListAdapterElement.appendChild(docsRefTitle);
                searchListAdapterElement.appendChild(docsRefResultsLimited);

                if (docsRefResultsCount > 3) {
                    const docsRefShowMore = document.createElement('div');
                    docsRefShowMore.classList.add('show-more');
                    docsRefShowMore.addEventListener('click', () => expandContainer(docsRefResults));
                    docsRefShowMore.textContent = 'Show more';
                    docsRefShowMore.appendChild(iconsManager.get('main', 'arrowRight').firstChild);
                    docsRefTitle.appendChild(docsRefShowMore);
                }
            }
        };

        if (!indexesManager.isCurrentlyIndexing) {
            if (!indexesManager.hasIndexed) {
                searchTextFullElement.classList.add('is-loading');

                searchSpinnerContainerElement.addEventListener('transitionend', () => {
                    indexesManager.initFull().then(() => {
                        searchTextFullElement.classList.remove('is-loading');
                        scheduleSearch(onSearchReady);
                    });
                }, { once: true });
            } else {
                scheduleSearch(onSearchReady);
            }
        }
    });
}

function expandContainer(fullResultsList) {
}

function scheduleSearch(onSearchReady) {
    if (typeof currentSearchTimeout != 'undefined') {
        clearTimeout(currentSearchTimeout);
        currentSearchTimeout = undefined;
    }

    if (searchListAdapterElement.textContent.trim() === '') {
        onSearchReady(searchTextElement.value.trim());
        return;
    }

    currentSearchTimeout = setTimeout(() => onSearchReady(searchTextElement.value.trim()), 100);
}

function createReference(type, name, pathName, chunks, searchText) {
    const codeDetailsName = document.createElement('div');
    codeDetailsName.classList.add('cd-name');
    const codeDetailsPath = document.createElement('div');
    codeDetailsPath.classList.add('cd-path');
    pathName != null && codeDetailsPath.appendChild(recomposeCodePath(pathName));
    const codeDetails = document.createElement('div');
    codeDetails.classList.add('code-details');
    codeDetails.appendChild(codeDetailsName);
    codeDetails.appendChild(codeDetailsPath);

    const leftSide = document.createElement('div');
    leftSide.classList.add('left-side');
    leftSide.appendChild(iconsManager.get('special', 'dev').firstChild);
    leftSide.appendChild(codeDetails);

    const row = document.createElement('div');
    row.classList.add('row');
    row.addEventListener('click', () => {
        closeSearch();
        globalUpdateActiveFile(pathName);
    });
    row.appendChild(leftSide);

    if (name != null) {
        codeDetailsName.textContent = name;
    } else if (pathName != null) {
        const newName = pathName.split('/')[pathName.split('/').length - 1];
        codeDetailsName.textContent = newName.endsWith('.xml') ? newName.slice(0, -4) : newName;
    }

    if (type != null) {
        const codeDetailsType = document.createElement('div');
        codeDetailsType.classList.add('cd-type');
        codeDetailsType.dataset.type = type.toLowerCase();
        codeDetailsType.textContent = type.toLowerCase() === 'method' ? 'function' : type.toLowerCase();
        codeDetailsName.prepend(codeDetailsType);
    }

    if (chunks != null) {
        const docsRefPage = document.createElement('div');
        docsRefPage.classList.add('page');
        const docsRefPreview = document.createElement('div');
        docsRefPreview.classList.add('content', 'docs-ref-preview');
        docsRefPreview.appendChild(docsRefPage);
        const fakePageContainer = document.createElement('div');
        fakePageContainer.classList.add('page-container', 'is-preview', 'is-loading');
        fakePageContainer.appendChild(docsRefPreview);
        row.appendChild(fakePageContainer);
        row.classList.add('has-docs-preview');

        setTimeout(() => {
            const fakeDom = document.createElement('div');
            fakeDom.append(...chunks);

            try {
                handleRecursive(fakeDom, docsRefPage);
            } catch (e) {
                console.log(e);
            }

            if (searchText != null) {
                const searchMask = new RegExp(searchText.toLowerCase(), "ig");
                const replaceWith = "<span class='ids'>" + searchText.toLowerCase() + "</span>";
                docsRefPage.innerHTML = docsRefPage.innerHTML.replaceAll(searchMask, replaceWith);

                const firstId = docsRefPage.querySelector('.ids');
                if (firstId instanceof Element) {
                    //firstId.scrollIntoViewIfNeeded();
                }
            }

            fakePageContainer.classList.remove('is-loading');
        }, 500);
    }

    return row;
}

function closeSearch() {
    if (lastStartByElement == null) {
        searchContainerElement.remove();
        return;
    }

    if (searchContainerElement.querySelector('.animated') !== null) {
        return;
    }

    const searchTextFullAnimation = searchTextFullElement.cloneNode(true);
    searchTextFullAnimation.classList.add('animated');

    if (searchTextFullAnimation.querySelector('.spinner') !== null) {
        searchTextFullAnimation.querySelector('.spinner').remove();
    }

    searchContainerElement.prepend(searchTextFullAnimation);
    updateSearchAnimationState(searchTextFullAnimation, searchTextFullElement.getBoundingClientRect(), lastStartByElement.getBoundingClientRect());
    searchContainerElement.classList.add('animate-disappear');

    let hasAlreadyText = false;
    searchTextFullAnimation.addEventListener('animationend', () => {
        searchContainerElement.remove();
        lastStartByElement.classList.remove('opened');

        if (hasAlreadyText && localStorage.getItem('searchEndTip') == null) {
            localStorage.setItem('searchEndTip', 'true');

            const miniText = document.createElement('div');
            miniText.classList.add('mini-text');
            miniText.textContent = 'You can resume the search whenever you want by pressing here.';

            const selector = document.createElement('div');
            selector.classList.add('selector');
            selector.appendChild(miniText);

            tooltip.init({
                childElement: selector,
                container: lastStartByElement
            });
        }

        resetData();
    }, { once: true });

    const inputByLastStartBy = getInputByLastStartBy();
    if (inputByLastStartBy !== null) {
        inputByLastStartBy.value = searchTextElement.value;
        hasAlreadyText = !!searchTextElement.value.trim();
    }
}

function getInputByLastStartBy() {
    return lastStartByElement.tagName.toUpperCase() === 'INPUT' ? lastStartByElement : lastStartByElement.querySelector('input');
}

function updateSearchAnimationState(animatedSearchText, startByRect, endByRect) {
    animatedSearchText.style.setProperty('--start-x', startByRect.left+'px');
    animatedSearchText.style.setProperty('--start-y', startByRect.top+'px');
    animatedSearchText.style.setProperty('--start-width', startByRect.width+'px');
    animatedSearchText.style.setProperty('--start-height', startByRect.height+'px');

    animatedSearchText.style.setProperty('--end-x', endByRect.left+'px');
    animatedSearchText.style.setProperty('--end-y', endByRect.top+'px');
    animatedSearchText.style.setProperty('--end-width', endByRect.width+'px');
    animatedSearchText.style.setProperty('--end-height', endByRect.height+'px');
}

function recomposeCodePath(pathName) {
    const fragment = document.createDocumentFragment();

    const splitted = pathName.split('/');
    for (let [i, part] of splitted.entries()) {
        if (i === splitted.length - 1 && part.endsWith('.xml')) {
            part = part.slice(0, -4);
        }

        fragment.append(document.createTextNode(part));

        if (i !== splitted.length - 1) {
            fragment.append(document.createTextNode(" > "));
        }
    }

    return fragment;
}

function resetData() {
    lastStartByElement = undefined;
    searchTextElement = undefined;
    searchTextFullElement = undefined;
    searchContainerElement = undefined;
    searchSpinnerContainerElement = undefined;
    searchListAdapterElement = undefined;
    searchResultsFullElement = undefined;
    currentSearchTimeout = undefined;
}

export {
    openSearchContainer,
    resetData
};