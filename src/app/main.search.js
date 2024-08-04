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
import {createLoadingItem, waitForAnimationEnd} from "./main.utils.js";
import {globalUpdateActiveFile} from "./main.sidebar.js";
import * as tooltip from "./main.tooltip.js";
import * as searchEngine from "./main.search_engine.js";
import ListenerManagerInstance from "./main.listener.js";

export const onSearchOpenListenerInstance = new ListenerManagerInstance();

const DOCS_REF_TYPE = 'docs';
const ROW_MARGIN_BOTTOM = 5;
class ExpandedRefsState {
    static NONE = 0;
    static CODE_REF = 1;
    static DOCS_REF = 2;
}

let isAnimating = 0;
let expandedRefsState = ExpandedRefsState.NONE;
let isFirstEmptyContainerView = true;
let lastStartByElement;
let lastStartByInputElement;
let searchTextElement;
let searchTextFullElement;
let searchCloseMobileTextElement;
let searchContainerElement;
let searchSpinnerContainerElement;
let searchListAdapterElement;
let searchCodeRefContainerElement;
let searchDocsRefContainerElement;
let searchDocsRefPreviewTimeouts = [];
let searchResultsFullElement;
let emptyContainerResultElement;
let currentSearchTimeout;
let windowKeyDownEventListener;
let alreadyWaitingForIndexingStart = false;

export function openSearchContainer(startBy, startByInputElement) {
    lastStartByElement = startBy;
    lastStartByInputElement = startByInputElement;

    document.body.classList.add('focused-by-search');
    onSearchOpenListenerInstance.callAllListeners(true);

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

    const searchCloseMobileText = document.createElement('div');
    searchCloseMobileText.classList.add('close', 'animate-appear');
    searchCloseMobileText.addEventListener('click', closeSearch);
    searchCloseMobileText.textContent = 'Cancel';
    const searchInputContainer = document.createElement('div');
    searchInputContainer.classList.add('search-input-container');
    searchInputContainer.appendChild(searchTextFull);
    searchInputContainer.appendChild(searchCloseMobileText);
    searchCloseMobileTextElement = searchCloseMobileText;

    const searchListAdapter = document.createElement('div');
    searchListAdapter.classList.add('list-adapter', 'is-empty');
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
    searchResultsFull.appendChild(searchInputContainer);
    searchResultsFull.appendChild(searchListAdapter);
    searchResultsFullElement = searchResultsFull;

    const searchContainer = document.createElement('div');
    searchContainer.classList.add('search-container', 'text-is-empty');
    searchContainer.addEventListener('click', (e) => {
        if (useMobileUI()) {
            return;
        }

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
        handleSearch();
    })

    searchText.addEventListener('input', () => {
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

    if (lastStartByInputElement != null) {
        searchText.value = lastStartByInputElement.value;
        hasAlreadyText = !!lastStartByInputElement.value.trim();

        const animationInput = searchTextFullAnimation.querySelector('input');
        if (animationInput != null) {
            animationInput.value = lastStartByInputElement.value;
        }
    }

    if (!hasAlreadyText) {
        searchListAdapter.appendChild(getEmptySearchContainerResult(true));
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
    const onSearchReady = async (query) => {
        clearLoadingPreviews();
        expandedRefsState = ExpandedRefsState.NONE;

        const results = !query ? [] : await searchEngine.search(query);

        searchTextFullElement.classList.remove('is-loading');
        searchContainerElement.classList.toggle('text-is-empty', !query);
        searchListAdapterElement.classList.toggle('is-empty', !results.length);

        if (!query) {
            searchListAdapterElement.textContent = '';
            searchListAdapterElement.appendChild(getEmptySearchContainerResult(true));
            return;
        }

        const codeRefResults = [];
        const docsRefResults = [];
        const codeRefResultsLimited = document.createDocumentFragment();
        const docsRefResultsLimited = document.createDocumentFragment();

        for (const result of results) {
            if (result.element instanceof indexesManager.FileIndex) {
                const ref = createReference(result.element.type, result.element.name, result.file);
                if (codeRefResultsLimited.childNodes.length >= 3) {
                    codeRefResults.push(ref);
                } else {
                    codeRefResultsLimited.append(ref);
                }
            } else if (result.element instanceof indexesManager.ElementIndex) {
                const ref = createReference(DOCS_REF_TYPE, null, result.file, docsRefResultsLimited.childNodes.length >= 3 ? undefined : result.element.chunk, "");
                if (docsRefResultsLimited.childNodes.length >= 3) {
                    docsRefResults.push(ref);
                } else {
                    docsRefResultsLimited.append(ref);
                }
            }
        }

        searchListAdapterElement.textContent = '';
        searchListAdapterElement.scrollTo(0, 0);

        if (codeRefResultsLimited.childNodes.length > 0) {
            const codeRefTitle = document.createElement('div');
            codeRefTitle.classList.add('row-title');
            codeRefTitle.textContent = 'Code References';

            if (codeRefResults.length > 3) {
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

        if (docsRefResultsLimited.childNodes.length > 0) {
            const docsRefTitle = document.createElement('div');
            docsRefTitle.classList.add('row-title');
            docsRefTitle.textContent = 'Docs References';

            if (docsRefResults.length > 3) {
                docsRefTitle.appendChild(createShowMoreLessAnimator(() => expandContainer(docsRefResults, true)));
            }

            const searchResultReferenceContainer = document.createElement('div');
            searchResultReferenceContainer.classList.add('ref-container');
            searchResultReferenceContainer.appendChild(docsRefTitle);
            searchResultReferenceContainer.appendChild(docsRefResultsLimited);

            searchListAdapterElement.appendChild(searchResultReferenceContainer);
            searchDocsRefContainerElement = searchResultReferenceContainer;
        }

        if (searchListAdapterElement.hasChildNodes()) {
            emptyContainerResultElement = undefined;
        } else {
            searchListAdapterElement.appendChild(getEmptySearchContainerResult(false));
        }
    };

    if (!indexesManager.isCurrentlyIndexing) {
        if (!indexesManager.hasIndexed && !alreadyWaitingForIndexingStart){
            alreadyWaitingForIndexingStart = true;
            searchTextFullElement.classList.add('is-loading');
            searchSpinnerContainerElement.addEventListener('transitionend', async () => {
                alreadyWaitingForIndexingStart = false;
                searchTextFullElement.classList.remove('is-loading');
                await onSearchReady(searchTextElement.value.trim());
            }, { once: true });
        } else if (!alreadyWaitingForIndexingStart) {
            scheduleSearch(onSearchReady);
        }
    }
}

function createShowMoreLessAnimator(callback, isAlreadyExpanded = false) {
    const refShowMoreAnimator = document.createElement('span');
    refShowMoreAnimator.classList.add('more');
    refShowMoreAnimator.textContent = 'Show more';

    const refShowLessAnimator = document.createElement('span');
    refShowLessAnimator.classList.add('less');
    refShowLessAnimator.textContent = 'Show less';

    const refShowMoreLess = document.createElement('div');
    refShowMoreLess.classList.add('show-more');
    refShowMoreLess.classList.toggle('expanded', isAlreadyExpanded);
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
            if (showMoreChild != null) {
                mustExpand = showMoreChild.classList.toggle('expanded');
            }
        }
    }

    if (!mustExpand) {
        collapseContainer(fullResultsList, mainContainer, oppositeContainer);
        return;
    }

    if (expandedRefsState !== ExpandedRefsState.NONE) {
        return;
    }

    expandedRefsState = isDocsRef ? ExpandedRefsState.DOCS_REF : ExpandedRefsState.CODE_REF;

    isAnimating++;

    const onReadyToExpand = () => {
        purifyChild(mainContainer, false);
        mainContainer.style.removeProperty('--animate-ref');

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

    let promisesList = [];

    const singleRowHeight = mainContainer.lastChild.getBoundingClientRect().height + (isDocsRef ? -110+8 : 0);
    mainContainer.style.setProperty('--animate-ref', (singleRowHeight * fullResultsList.length + ROW_MARGIN_BOTTOM * (fullResultsList.length - 1)) + 'px');
    purifyChild(mainContainer);
    mainContainer.classList.add('animate-appear');
    promisesList.push(waitForAnimationEnd(mainContainer));

    if (oppositeContainer != null) {
        const oppositeContainerRect = oppositeContainer.getBoundingClientRect();
        oppositeContainer.style.setProperty('--initial-height', oppositeContainerRect.height + 'px');
        purifyChild(oppositeContainer, true);
        oppositeContainer.classList.add('animate-disappear-as-opposite');
        promisesList.push(waitForAnimationEnd(oppositeContainer));
    }

    Promise.all(promisesList).then(onReadyToExpand);
}

function collapseContainer(fullResultsList, mainContainer, oppositeContainer) {
    if (isAnimating !== 0 || expandedRefsState === ExpandedRefsState.NONE) {
        return;
    }

    isAnimating++;

    const singleRowHeight = mainContainer.lastChild.getBoundingClientRect().height;

    expandedRefsState = ExpandedRefsState.NONE;

    let promisesList = [];
    let visibleChildren = [];

    const adapterRect = searchListAdapterElement.getBoundingClientRect();
    let removedChildren = 0;

    for (const child of fullResultsList) {
        if (!mainContainer.contains(child)) {
            continue;
        }

        const childRect = child.getBoundingClientRect();

        if (childRect.top < adapterRect.top + adapterRect.height) {
            purifyChild(child);
            child.classList.add('animate-disappear');
            visibleChildren.push(child);
            promisesList.push(waitForAnimationEnd(child, true));
        } else {
            removedChildren++;
            child.remove();
        }
    }

    mainContainer.style.setProperty('--animate-ref', (singleRowHeight * removedChildren + ROW_MARGIN_BOTTOM * (removedChildren - 1)) + 'px');
    mainContainer.classList.add('preparing-for-remove');

    Promise.all(promisesList).then(() => {
        for (const child of visibleChildren) {
            child.remove();
        }

        let promisesList = [];

        mainContainer.style.setProperty('--animate-ref', (singleRowHeight * fullResultsList.length + ROW_MARGIN_BOTTOM * (fullResultsList.length - 1)) + 'px');
        purifyChild(mainContainer);
        mainContainer.classList.add('animate-disappear');
        promisesList.push(waitForAnimationEnd(mainContainer));

        if (oppositeContainer != null) {
            purifyChild(oppositeContainer);
            oppositeContainer.classList.add('animate-appear-as-opposite');
            promisesList.push(waitForAnimationEnd(oppositeContainer));
        }

        Promise.all(promisesList).then(() => {
            purifyChild(mainContainer, false);
            purifyChild(oppositeContainer, false);
            mainContainer.style.removeProperty('--animate-ref');
            isAnimating--;
        });
    });
}

function purifyChild(child, redraw = true) {
    if (!(child instanceof Element)) {
        return;
    }

    child.classList.remove('preparing-for-remove', 'animate-disappear', 'animate-disappear-as-opposite', 'animate-appear', 'animate-appear-as-opposite');

    if (redraw) {
        child.offsetHeight;
    }
}

function scheduleSearch(onSearchReady) {
    if (currentSearchTimeout != null) {
        clearTimeout(currentSearchTimeout);
        currentSearchTimeout = undefined;
    }

    if (!searchListAdapterElement.hasChildNodes()) {
        onSearchReady(searchTextElement.value.trim());
        return;
    }

    currentSearchTimeout = setTimeout(() => onSearchReady(searchTextElement.value.trim()), 150);
}

function createReference(type, name, pathName, chunks) {
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
    leftSide.appendChild(iconsManager.get('special', type === DOCS_REF_TYPE ? 'docsRef' : 'dev').firstChild);
    leftSide.appendChild(codeDetails);

    const row = document.createElement('div');
    row.classList.add('row');
    row.addEventListener('click', () => {
        if (isAnimating !== 0) {
            return;
        }

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

    if (type != null && type !== DOCS_REF_TYPE) {
        const codeDetailsType = document.createElement('div');
        codeDetailsType.classList.add('cd-type');
        codeDetailsType.dataset.type = type.toLowerCase();
        codeDetailsType.textContent = type.toLowerCase() === 'method' ? 'function' : type.toLowerCase();
        codeDetailsName.prepend(codeDetailsType);
    }

    if (chunks != null) {
        const docsRefPreview = document.createElement('div');
        docsRefPreview.classList.add('content', 'docs-ref-preview');
        const fakePageContainer = document.createElement('div');
        fakePageContainer.classList.add('page-container', 'is-preview', 'is-loading');
        fakePageContainer.appendChild(docsRefPreview);
        row.appendChild(fakePageContainer);
        row.classList.add('has-docs-preview');

        searchDocsRefPreviewTimeouts.push(setTimeout(() => {
            searchEngine.generateResultPreview(docsRefPreview, chunks);
            fakePageContainer.classList.remove('is-loading');
        }, 500));
    }

    return row;
}

function clearLoadingPreviews() {
    for (const timeout of searchDocsRefPreviewTimeouts) {
        clearTimeout(timeout);
    }
    searchDocsRefPreviewTimeouts = [];
}

function closeSearch() {
    if (lastStartByElement == null) {
        searchContainerElement.remove();
        return;
    }

    if (isAnimating !== 0 || searchContainerElement.querySelector('.animated') != null) {
        return;
    }

    const onClosedAdapter = () => {
        const searchTextFullAnimation = searchTextFullElement.cloneNode(true);
        searchTextFullAnimation.classList.add('animated');

        if (searchTextFullAnimation.querySelector('.spinner') != null) {
            searchTextFullAnimation.querySelector('.spinner').remove();
        }

        searchContainerElement.prepend(searchTextFullAnimation);
        updateSearchAnimationState(searchTextFullAnimation, searchTextFullElement.getBoundingClientRect(), lastStartByElement.getBoundingClientRect());
        searchContainerElement.classList.add('animate-disappear');

        document.body.classList.remove('focused-by-search');

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

        if (lastStartByInputElement != null) {
            lastStartByInputElement.value = searchTextElement.value;
            hasAlreadyText = !!searchTextElement.value.trim();
        }
    };

    isAnimating++;

    const promisesList = [];
    const isMobile = useMobileUI();

    if (!searchContainerElement.classList.contains('text-is-empty') && !isMobile) {
        searchContainerElement.classList.add('text-is-empty', 'faster');
        promisesList.push(new Promise((resolve) => searchListAdapterElement.addEventListener('transitionend', resolve, { once: true })));
    }

    if (isMobile) {
        searchContainerElement.classList.add('faster');
        searchCloseMobileTextElement.classList.remove('animate-appear');
        searchCloseMobileTextElement.offsetHeight;
        searchCloseMobileTextElement.classList.add('animate-disappear');
        promisesList.push(waitForAnimationEnd(searchCloseMobileTextElement));
    }

    if (emptyContainerResultElement != null && isMobile) {
        searchContainerElement.classList.add('faster');
        emptyContainerResultElement.classList.remove('is-first-view');
        emptyContainerResultElement.offsetHeight;
        emptyContainerResultElement.classList.add('animate-disappear');
        promisesList.push(waitForAnimationEnd(emptyContainerResultElement));
    }

    Promise.all(promisesList).then(onClosedAdapter);
}

function useMobileUI() {
    return window.matchMedia('screen and (max-width: 1000px)').matches;
}

function getEmptySearchContainerResult(isFirstOpen = false) {
    const emptyContainerText = document.createElement('div');
    emptyContainerText.classList.add('empty-container-text');

    const emptyContainerResult = document.createElement('div');
    emptyContainerResult.classList.add('empty-container');
    emptyContainerResult.classList.toggle('is-first-view', isFirstEmptyContainerView);
    emptyContainerResult.classList.toggle('is-first-open', isFirstOpen);
    emptyContainerResult.appendChild(iconsManager.get('main', isFirstOpen ? 'compass' : 'heartCrack').firstChild);
    emptyContainerResult.appendChild(emptyContainerText);

    if (isFirstOpen) {
        emptyContainerText.textContent = 'Type to search...';
    } else {
        emptyContainerText.textContent = 'No results found';
    }

    isFirstEmptyContainerView = false;
    emptyContainerResultElement = emptyContainerResult;

    return emptyContainerResult;
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

    if (pathName.startsWith('/')) {
        pathName = pathName.slice(1);
    }

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

export function resetData() {
    if (currentSearchTimeout != null) {
        clearTimeout(currentSearchTimeout);
    }

    if (windowKeyDownEventListener != null) {
        window.removeEventListener('keydown', windowKeyDownEventListener);
    }

    clearLoadingPreviews();
    onSearchOpenListenerInstance.callAllListeners(false);

    isAnimating = 0;
    expandedRefsState = ExpandedRefsState.NONE;
    isFirstEmptyContainerView = true;
    lastStartByElement = undefined;
    lastStartByInputElement = undefined;
    searchTextElement = undefined;
    searchTextFullElement = undefined;
    searchCloseMobileTextElement = undefined;
    searchContainerElement = undefined;
    searchSpinnerContainerElement = undefined;
    searchListAdapterElement = undefined;
    searchCodeRefContainerElement = undefined;
    searchDocsRefContainerElement = undefined;
    searchDocsRefPreviewTimeouts = [];
    searchResultsFullElement = undefined;
    emptyContainerResultElement = undefined;
    currentSearchTimeout = undefined;
    windowKeyDownEventListener = undefined;
    alreadyWaitingForIndexingStart = false;

    document.body.classList.remove('focused-by-search');
}