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

let isAnimating = 0;
let lastStartByElement;
let searchTextElement;
let searchTextFullElement;
let searchContainerElement;
let searchSpinnerContainerElement;
let searchListAdapterElement;
let searchCodeRefContainerElement;
let searchDocsRefContainerElement;
let searchResultsFullElement;
let currentSearchTimeout;
let windowKeyDownEventListener;
let alreadyWaitingForIndexingStart = false;

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
        let isOutside = e.target !== searchResultsFull && !searchResultsFull.contains(e.target);

        if (searchContainer.classList.contains('text-is-empty') && (e.target === searchResultsFull || searchResultsFull.contains(e.target)) && e.target !== searchTextFull && !searchTextFull.contains(e.target)) {
            isOutside = true;
        }

        isOutside && closeSearch();
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
        searchText.focus();
        isAnimating--;

        if (hasAlreadyText) {
            handleSearch();
            searchListAdapter.addEventListener('transitionend', () => searchContainer.classList.remove('faster'), { once: true });
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

    windowKeyDownEventListener = (e) => e.key === 'Escape' && !e.shiftKey && !e.altKey && closeSearch();
    window.addEventListener('keydown', windowKeyDownEventListener);

    isAnimating++;
    updateSearchAnimationState(searchTextFullAnimation, startByRect, searchTextFull.getBoundingClientRect());
    searchContainer.classList.add('animate-appear');
    searchContainer.classList.toggle('faster', hasAlreadyText);
    startBy.classList.add('opened');
}

function handleSearch() {
    loadConfig().then(() => {
        const onSearchReady = (text) => {
            searchContainerElement.classList.toggle('text-is-empty', !text.trim());
            if (!text.trim()) {
                return;
            }

            const codeRefResults = [];
            const codeRefResultsLimited = document.createDocumentFragment();
            let codeRefResultsCount = 0;

            const docsRefResults = [];
            const docsRefResultsLimited = document.createDocumentFragment();
            let docsRefResultsCount = 0;

            for (const indexedFile of indexesManager.getAllIndexedFiles()) {
                let addedDocsRefForFile = false;
                for (const indexedValue of indexesManager.getIndexedValue(indexedFile)) {
                    if (indexedValue instanceof indexesManager.FileIndex) {
                        if (indexedValue.getName().toLowerCase().indexOf(text.toLowerCase().trim()) !== -1) {
                            const ref = createReference(indexedValue.getType(), indexedValue.getName(), indexedFile);
                            if (codeRefResultsCount++ > 3) {
                                codeRefResults.push(ref);
                            } else {
                                codeRefResultsLimited.append(ref);
                            }
                        }
                    } else if (indexedValue instanceof indexesManager.ElementIndex && !addedDocsRefForFile) {
                        if (indexedValue.getMainElement().textContent.toLowerCase().indexOf(text.toLowerCase().trim()) !== -1) {
                            addedDocsRefForFile = true;

                            const ref = createReference(null, null, indexedFile, docsRefResultsCount > 3 ? undefined : indexedValue.getChunk(), text);
                            if (docsRefResultsCount++ > 3) {
                                docsRefResults.push(ref);
                            } else {
                                docsRefResultsLimited.append(ref);
                            }
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

                if (codeRefResultsCount > 3) {
                    codeRefTitle.appendChild(createShowMoreLessAnimator(() => expandContainer(codeRefResults)));
                }

                const searchResultReferenceContainer = document.createElement('div');
                searchResultReferenceContainer.classList.add('ref-container');
                searchResultReferenceContainer.appendChild(codeRefTitle);
                searchResultReferenceContainer.appendChild(codeRefResultsLimited);
                searchListAdapterElement.appendChild(searchResultReferenceContainer);

                searchCodeRefContainerElement = searchResultReferenceContainer;
            } else {
                searchCodeRefContainerElement = undefined;
            }

            if (docsRefResultsCount > 0) {
                const docsRefTitle = document.createElement('div');
                docsRefTitle.classList.add('row-title');
                docsRefTitle.textContent = 'Docs References';

                if (docsRefResultsCount > 3) {
                    docsRefTitle.appendChild(createShowMoreLessAnimator(() => expandContainer(docsRefResults, true)));
                }

                const searchResultReferenceContainer = document.createElement('div');
                searchResultReferenceContainer.classList.add('ref-container');
                searchResultReferenceContainer.appendChild(docsRefTitle);
                searchResultReferenceContainer.appendChild(docsRefResultsLimited);
                searchListAdapterElement.appendChild(searchResultReferenceContainer);

                searchDocsRefContainerElement = searchResultReferenceContainer;
            } else {
                searchDocsRefContainerElement = undefined;
            }
        };

        if (!indexesManager.isCurrentlyIndexing) {
            if (!indexesManager.hasIndexed && !alreadyWaitingForIndexingStart) {
                searchTextFullElement.classList.add('is-loading');
                alreadyWaitingForIndexingStart = true;

                searchSpinnerContainerElement.addEventListener('transitionend', () => {
                    alreadyWaitingForIndexingStart = false;

                    indexesManager.initFull().then(() => {
                        searchTextFullElement.classList.remove('is-loading');
                        scheduleSearch(onSearchReady);
                    });
                }, { once: true });
            } else if (!alreadyWaitingForIndexingStart) {
                scheduleSearch(onSearchReady);
            }
        }
    });
}

function createShowMoreLessAnimator(callback) {
    const refShowMoreAnimator = document.createElement('span');
    refShowMoreAnimator.classList.add('more');
    refShowMoreAnimator.textContent = 'Show more';

    const refShowLessAnimator = document.createElement('span');
    refShowLessAnimator.classList.add('less');
    refShowLessAnimator.textContent = 'Show less';

    const refShowMoreLess = document.createElement('div');
    refShowMoreLess.classList.add('show-more');
    refShowMoreLess.addEventListener('click', callback);
    refShowMoreLess.appendChild(refShowMoreAnimator);
    refShowMoreLess.appendChild(refShowLessAnimator);
    refShowMoreLess.appendChild(iconsManager.get('main', 'chevronDown').firstChild);

    return refShowMoreLess;
}

function expandContainer(fullResultsList, isDocsRef = false) {
    if (isAnimating !== 0) {
        return;
    }

    const mainContainer = isDocsRef ? searchDocsRefContainerElement : searchCodeRefContainerElement;
    const oppositeContainer = isDocsRef ? searchCodeRefContainerElement : searchDocsRefContainerElement;

    let mustExpand = true;
    if (mainContainer.hasChildNodes()) {
        const titleChild = mainContainer.firstChild;
        if (titleChild.classList.contains('row-title')) {
            const showMoreChild = titleChild.querySelector('.show-more');
            if (showMoreChild !== null) {
                mustExpand = showMoreChild.classList.toggle('expanded');
            }
        }
    }

    if (!mustExpand) {
        collapseContainer(fullResultsList, mainContainer, oppositeContainer);
        return;
    }

    isAnimating++;

    const onReadyToExpand = () => {
        const fragment = document.createDocumentFragment();
        for (const child of fullResultsList) {
            child.classList.add('hidden');
            fragment.append(child);
        }
        mainContainer.appendChild(fragment);

        let itemAnimatorID = -1;
        const adapterRect = searchListAdapterElement.getBoundingClientRect();
        for (const child of fullResultsList) {
            const childRect = child.getBoundingClientRect();

            if (childRect.top < adapterRect.top + adapterRect.height) {
                itemAnimatorID++;
                child.style.setProperty('--id', itemAnimatorID);
                child.classList.remove('animate-disappear');
                child.classList.add('animate-appear');
            }

            child.classList.remove('hidden');
        }

        isAnimating--;
    };

    if (oppositeContainer === null) {
        onReadyToExpand();
    } else {
        const oppositeContainerRect = oppositeContainer.getBoundingClientRect();
        oppositeContainer.style.setProperty('--initial-height', oppositeContainerRect.height + 'px');
        oppositeContainer.classList.remove('animate-appear');
        oppositeContainer.offsetHeight;
        oppositeContainer.classList.add('animate-disappear');
        oppositeContainer.addEventListener('animationend', () => {
            //oppositeContainer.style.removeProperty('--initial-height');
            onReadyToExpand();
        }, { once: true });
    }
}

function collapseContainer(fullResultsList, mainContainer, oppositeContainer) {
    if (isAnimating !== 0) {
        return;
    }

    let promisesList = [];
    let visibleChildren = [];

    const adapterRect = searchListAdapterElement.getBoundingClientRect();
    for (const child of fullResultsList) {
        if (!mainContainer.contains(child)) {
            continue;
        }

        const childRect = child.getBoundingClientRect();

        if (childRect.top < adapterRect.top + adapterRect.height) {
            child.classList.remove('animate-appear');
            child.offsetHeight; // trigger redraw
            child.classList.add('animate-disappear');
            visibleChildren.push(child);
            promisesList.push(new Promise((resolve) => child.addEventListener('animationend', resolve, { once: true })));
        } else {
            child.remove();
        }
    }

    isAnimating++;
    Promise.all(promisesList).then(() => {
        for (const child of visibleChildren) {
            child.remove();
        }

        if (oppositeContainer !== null) {
            oppositeContainer.classList.remove('animate-disappear');
            oppositeContainer.offsetHeight;
            oppositeContainer.classList.add('animate-appear');
            oppositeContainer.addEventListener('animationend', () => oppositeContainer.classList.remove('animate-appear'), { once: true });
        }

        isAnimating--;
    });
}

function scheduleSearch(onSearchReady) {
    if (currentSearchTimeout !== null) {
        clearTimeout(currentSearchTimeout);
        currentSearchTimeout = undefined;
    }

    if (!searchListAdapterElement.hasChildNodes()) {
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

    if (isAnimating !== 0 || searchContainerElement.querySelector('.animated') !== null) {
        return;
    }

    const onClosedAdapter = () => {
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
    };

    isAnimating++;

    if (searchContainerElement.classList.contains('text-is-empty')) {
        onClosedAdapter();
    } else {
        searchContainerElement.classList.add('text-is-empty', 'faster');
        searchListAdapterElement.addEventListener('transitionend', onClosedAdapter, { once: true });
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
    if (currentSearchTimeout !== null) {
        clearTimeout(currentSearchTimeout);
    }

    if (windowKeyDownEventListener !== null) {
        window.removeEventListener('keydown', windowKeyDownEventListener);
    }

    isAnimating = 0;
    lastStartByElement = undefined;
    searchTextElement = undefined;
    searchTextFullElement = undefined;
    searchContainerElement = undefined;
    searchSpinnerContainerElement = undefined;
    searchListAdapterElement = undefined;
    searchCodeRefContainerElement = undefined;
    searchDocsRefContainerElement = undefined;
    searchResultsFullElement = undefined;
    currentSearchTimeout = undefined;
    windowKeyDownEventListener = undefined;
    alreadyWaitingForIndexingStart = false;
}

export {
    openSearchContainer,
    resetData
};