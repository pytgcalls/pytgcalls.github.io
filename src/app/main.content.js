/*
 * Copyright (c) 2020-2026.
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
import {onCollapseLongCodeSettingListenerInstance} from "./main.settings.js";
import * as syntaxManager from "./main.syntax.js";

export const onSelectedSectionListenerInstance = new ListenerManagerInstance();

let currentContentElement;
let currentSectionsElement;
let addedListener = false;

export function getElement() {
  const content = document.createElement('div');
  content.classList.add('content');
  currentContentElement = content;

  const pageSections = document.createElement('div');
  pageSections.classList.add('sections');
  currentSectionsElement = pageSections;

  const fragment = document.createDocumentFragment();
  fragment.append(content);
  fragment.append(pageSections);

  if (!addedListener) {
    addedListener = true;
    onCollapseLongCodeSettingListenerInstance.addListener({
      callback: updateCollapseLongCodeStatus
    });
  }

  return fragment;
}

export async function loadFile(fileName, hash = '', avoidPushingState = false) {
  const { content, pageSections } = replaceWithValidElements();

  const pathFileName = utils.parseCategoryUrl(fileName);
  const indexedCache = indexesManager.getFullIndexedValue(fileName);

  if (indexedCache != null) {
    if (!avoidPushingState) {
      window.history.pushState('', '', pathFileName + (hash ?? ''));
    }

    try {
      await handleResponse(fileName, content, pageSections, indexedCache, hash);
      handlePathPNManager(content, fileName);
    } catch (renderErr) {
      console.error('Error rendering cached file:', fileName, renderErr);
      content.classList.remove('is-loading');
    }
  } else {
    let response;
    try {
      response = await requestsManager.initRequest(fileName);
    } catch (netErr) {
      console.error('Network request failed for:', fileName, netErr);
      content.classList.remove('is-loading');
      content.innerHTML = `
        <div class="request-failed-container" style="text-align: center; padding: 60px 20px;">
          <h2 style="font-size: 20px; margin-bottom: 12px; color: var(--color-fg-default, #c9d1d9);">Failed to load documentation</h2>
          <p style="color: var(--color-fg-muted, #8b949e); margin-bottom: 20px; font-size: 14px;">Could not fetch <code>${fileName}</code> from GitHub. Please check your internet connection.</p>
          <button class="retry-btn" style="background: #238636; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 500; cursor: pointer;">Retry</button>
        </div>
      `;
      content.querySelector('.retry-btn')?.addEventListener('click', () => {
        loadFile(fileName, hash, true);
      });
      pageSections.classList.remove('is-loading');
      pageSections.textContent = '';
      return;
    }

    if (!avoidPushingState) {
      window.history.pushState('', '', pathFileName + (hash ?? ''));
    }
    indexesManager.saveAsFullIndexedValue(fileName, response);

    try {
      await handleResponse(fileName, content, pageSections, response, hash);
      handlePathPNManager(content, fileName);
    } catch (renderErr) {
      console.error('Error rendering content for:', fileName, renderErr);
      content.classList.remove('is-loading');
    }
  }
}

export function handleCustomCodeInsert(data) {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  const { content, pageSections } = replaceWithValidElements();
  // noinspection JSIgnoredPromiseFromCall
  handleResponse("", content, pageSections, data, "");
}

export function clearBoard() {
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
  pageSections.classList.remove('show');
  currentSectionsElement.replaceWith(pageSections);
  currentSectionsElement = pageSections;

  return { content, pageSections };
}

function handleResponse(fileName, content, pageSections, response, hash) {
  const data = sourceParser.getContentByData(response, fileName);
  content.classList.remove('is-loading');
  content.textContent = '';
  content.appendChild(data);

  const isChangelogs = data.classList.contains('changelog-page-wrapper') ||
    (typeof fileName === 'string' && fileName.toLowerCase().includes('changelog')) ||
    (window.location.pathname.toLowerCase().includes('changelog'));

  const sectionsContainer = document.createElement('div');
  sectionsContainer.classList.add('sections-recap');

  if (isChangelogs) {
    pageSections.classList.add('is-changelogs');
    renderVersionsTimeline(sectionsContainer, data);
  } else {
    pageSections.classList.remove('is-changelogs');
    const tocTitle = document.createElement('div');
    tocTitle.classList.add('toc-sidebar-title');
    tocTitle.textContent = 'On this page';
    sectionsContainer.appendChild(tocTitle);
    const trackedItems = [];
    iterPageSectionsData(data, sectionsContainer, Infinity, trackedItems);
    setupTocScrollSpy(data, trackedItems);
  }

  pageSections.classList.remove('is-loading');
  pageSections.textContent = '';
  pageSections.appendChild(sectionsContainer);

  if (isChangelogs) {
    const githubBox = document.createElement('a');
    githubBox.classList.add('versions-github-box');
    githubBox.href = 'https://github.com/pytgcalls/pytgcalls/releases';
    githubBox.target = '_blank';
    githubBox.rel = 'noopener';
    githubBox.innerHTML = `<span>View on GitHub</span> ${iconsManager.get('main', 'upRightFromSquare').outerHTML}`;
    githubBox.addEventListener('click', () => {
      onSelectedSectionListenerInstance.callAllListeners();
    });
    pageSections.appendChild(githubBox);
  } else if (fileName !== "") {
    const contributeToEdit = document.createElement('a');
    contributeToEdit.classList.add('contributions-link');
    contributeToEdit.href = 'https://github.com/pytgcalls/docsdata/edit/master/' + fileName;
    contributeToEdit.target = '_blank';
    contributeToEdit.rel = 'noopener';
    contributeToEdit.innerHTML = `<span>Contribute to this page</span> ${iconsManager.get('main', 'upRightFromSquare').outerHTML}`;
    contributeToEdit.addEventListener('click', () => {
      onSelectedSectionListenerInstance.callAllListeners();
    });
    const contributionsContainer = document.createElement('div');
    contributionsContainer.classList.add('contributions');
    contributionsContainer.appendChild(contributeToEdit);
    pageSections.appendChild(contributionsContainer);
  }

  try {
    handleHash(data, hash);
  } catch (ignored) { }
}

function renderVersionsTimeline(sectionsContainer, pageData) {
  const versionsTitle = document.createElement('div');
  versionsTitle.classList.add('versions-sidebar-title');
  versionsTitle.textContent = 'Versions';
  sectionsContainer.appendChild(versionsTitle);

  const timelineList = document.createElement('div');
  timelineList.classList.add('versions-timeline-list');

  const cards = pageData.querySelectorAll('.changelog-release-card');
  const itemsMap = [];

  cards.forEach((card, idx) => {
    const vName = card.querySelector('.changelog-version-name')?.textContent || '';
    const metaStr = card.querySelector('.changelog-card-meta')?.textContent || '';
    const dateStr = metaStr.split('·')[0]?.trim() || '';

    const item = document.createElement('div');
    item.classList.add('versions-timeline-item');
    if (idx === 0) item.classList.add('is-active', 'is-latest');

    const dot = document.createElement('div');
    dot.classList.add('versions-timeline-dot');
    item.appendChild(dot);

    const nameEl = document.createElement('div');
    nameEl.classList.add('versions-timeline-name');
    let displayName = vName;
    if (idx === 0 && !displayName.startsWith('PyTgCalls')) {
      displayName = 'PyTgCalls ' + displayName;
    }
    nameEl.textContent = displayName;
    item.appendChild(nameEl);

    if (dateStr) {
      const dateEl = document.createElement('div');
      dateEl.classList.add('versions-timeline-date');
      dateEl.textContent = dateStr;
      item.appendChild(dateEl);
    }

    item.addEventListener('click', () => {
      itemsMap.forEach((m) => m.item.classList.remove('is-active'));
      item.classList.add('is-active');
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const toggle = card.querySelector('.changelog-accordion-toggle');
      const body = card.querySelector('.changelog-details-body');
      if (toggle && body && !body.classList.contains('is-open')) {
        toggle.classList.add('is-open');
        body.classList.add('is-open');
      }
      card.style.borderColor = '#58a6ff';
      setTimeout(() => { card.style.borderColor = ''; }, 1200);
      onSelectedSectionListenerInstance.callAllListeners();
    });

    timelineList.appendChild(item);
    itemsMap.push({ card, item });
  });

  sectionsContainer.appendChild(timelineList);

  if ('IntersectionObserver' in window && itemsMap.length) {
    const scrollRoot = pageData.closest('.content') || currentContentElement || null;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const match = itemsMap.find((m) => m.card === entry.target);
          if (match) {
            itemsMap.forEach((m) => m.item.classList.remove('is-active'));
            match.item.classList.add('is-active');
          }
        }
      });
    }, {
      root: scrollRoot,
      rootMargin: '-5% 0px -60% 0px',
      threshold: 0
    });

    itemsMap.forEach((m) => observer.observe(m.card));
  }
}

function handlePathPNManager(content, fileName) {
  config.getTheNextFileAfter(fileName).then(({ previousFile, nextFile, basePath }) => {
    const goToContainer = document.createElement('div');
    goToContainer.classList.add('go-to-container');
    goToContainer.classList.toggle('has-only-next', !previousFile && !!nextFile);

    if (previousFile != null) {
      const goToPreviousBigTitle = document.createElement('div');
      goToPreviousBigTitle.classList.add('big-title');
      goToPreviousBigTitle.textContent = 'Previous';

      const goToPreviousMiniTitle = document.createElement('div');
      goToPreviousMiniTitle.classList.add('mini-title');
      goToPreviousMiniTitle.textContent = utils.getCategoryFileName(previousFile.replace(basePath, ''));

      const textWrapper = document.createElement('div');
      textWrapper.classList.add('go-to-text');
      textWrapper.appendChild(goToPreviousBigTitle);
      textWrapper.appendChild(goToPreviousMiniTitle);

      const goToPreviousContainer = document.createElement('div');
      goToPreviousContainer.classList.add('go-to', 'previous');
      goToPreviousContainer.appendChild(iconsManager.get('main', 'arrowLeft'));
      goToPreviousContainer.appendChild(textWrapper);

      goToPreviousContainer.addEventListener('click', () => {
        handleRedirectWithAnimation(content, previousFile);
      });
      goToContainer.appendChild(goToPreviousContainer);
    }

    if (nextFile != null) {
      const goToNextBigTitle = document.createElement('div');
      goToNextBigTitle.classList.add('big-title');
      goToNextBigTitle.textContent = 'Next';

      const goToNextMiniTitle = document.createElement('div');
      goToNextMiniTitle.classList.add('mini-title');
      goToNextMiniTitle.textContent = utils.getCategoryFileName(nextFile.replace(basePath, ''));

      const textWrapper = document.createElement('div');
      textWrapper.classList.add('go-to-text');
      textWrapper.appendChild(goToNextBigTitle);
      textWrapper.appendChild(goToNextMiniTitle);

      const goToNextContainer = document.createElement('div');
      goToNextContainer.classList.add('go-to', 'next');
      goToNextContainer.appendChild(textWrapper);
      goToNextContainer.appendChild(iconsManager.get('main', 'arrowRight'));

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
  if (hash != null && hash.length) {
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

function iterPageSectionsData(container, currentDom, childrenLimit = Infinity, trackedItems = []) {
  for (const [id, element] of container.childNodes.entries()) {
    if (id > childrenLimit) {
      break;
    }

    if (element instanceof Element) {
      if (element.getAttribute('noref') === 'true') {
        continue;
      }

      if (element.tagName.toUpperCase() === 'TD' || (element.classList.length && [syntaxManager.H1, syntaxManager.H2, syntaxManager.H3, syntaxManager.CATEGORY_TITLE, 'PG-TITLE'].includes(element.classList[0].toUpperCase()))) {
        let cloned = element.cloneNode(true);

        if (element.tagName.toUpperCase() === 'TD') {
          cloned = document.createElement('div');
          cloned.classList.add('pg-title');
        }

        cloned.addEventListener('click', () => {
          trackedItems.forEach((m) => m.cloned.classList.remove('is-active'));
          cloned.classList.add('is-active');
          updateActiveSection(element);
        });

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
        trackedItems.push({ element, cloned });
      } else if (element.classList.contains('category') || element.classList.contains('subtext')) {
        const cloned = element.cloneNode(false);
        currentDom.append(cloned);
        iterPageSectionsData(element, cloned, Infinity, trackedItems);
        if (!cloned.hasChildNodes()) {
          cloned.remove();
        }
      } else if (element.tagName.toUpperCase() === syntaxManager.TABLE) {
        const clonedTable = document.createElement('div');
        clonedTable.classList.add('subtext');
        currentDom.append(clonedTable);
        iterPageSectionsData(element, clonedTable, Infinity, trackedItems);
        if (!clonedTable.hasChildNodes()) {
          clonedTable.remove();
        }
      } else if (element.tagName.toUpperCase() === 'TR') {
        iterPageSectionsData(element, currentDom, 1, trackedItems);
      } else if (element.classList.contains('banner')) {
        const bigTitle = element.querySelector('.banner-container > .bottom-container > .big-title');
        if (bigTitle && bigTitle.textContent !== '') {
          const clonedBannerState = document.createElement('div');
          clonedBannerState.classList.add('h2');
          clonedBannerState.addEventListener('click', () => {
            trackedItems.forEach((m) => m.cloned.classList.remove('is-active'));
            clonedBannerState.classList.add('is-active');
            updateActiveSection(element);
          });
          clonedBannerState.textContent = bigTitle.textContent;
          currentDom.append(clonedBannerState);
          trackedItems.push({ element, cloned: clonedBannerState });
        }
      }
    }
  }
}

function setupTocScrollSpy(pageData, trackedItems) {
  if (!('IntersectionObserver' in window) || !trackedItems.length) return;
  const scrollRoot = pageData.closest('.content') || currentContentElement || null;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const match = trackedItems.find((m) => m.element === entry.target);
        if (match) {
          trackedItems.forEach((m) => m.cloned.classList.remove('is-active'));
          match.cloned.classList.add('is-active');
        }
      }
    });
  }, {
    root: scrollRoot,
    rootMargin: '-5% 0px -70% 0px',
    threshold: 0
  });

  trackedItems.forEach((m) => observer.observe(m.element));
}

export function updateMobileSectionsVisibilityState(forcedState) {
  return currentSectionsElement.classList.toggle('show', forcedState);
}

export function updateActiveSection(section) {
  section.scrollIntoView({
    behavior: 'smooth'
  });
  onSelectedSectionListenerInstance.callAllListeners();
}

function updateCollapseLongCodeStatus(status) {
  for (const externalSh of currentContentElement.querySelectorAll('.external-sh')) {
    if (!status) {
      externalSh.classList.add('expanded');
    } else if (externalSh.classList.contains('is-expandable')) {
      externalSh.classList.remove('expanded');
    }
  }
}

export function resetData() {
   currentContentElement = undefined;
   currentSectionsElement = undefined;
}