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

import * as sidebarInstance from "./main.sidebar.js";
import * as contentInstance from "./main.content.js";
import * as introductionInstance from "./main.introduction.js";
import * as headerInstance from "./main.header.js";
import * as config from "./main.config.js";
import * as utils from "./main.utils.js";
import * as debug from "./main.debug.js";
import * as searchManager from "./main.search.js";
import ListenerManagerInstance from "./main.listener.js";
import {closeAdaptedTooltips} from "./main.tooltip.js";

export const onChangeFavoriteSyntaxTab = new ListenerManagerInstance();
export const onChangeFavoriteSyntaxTabAnimationState = new ListenerManagerInstance();

export function init(pathName) {
  resetChildrenData();

  const syntaxTabData = localStorage.getItem('currentTabDataIndexes');
  let baseParsedSyntaxTab = {};
  if (syntaxTabData != null) {
    try {
      baseParsedSyntaxTab = JSON.parse(syntaxTabData);
    } catch (_) { }
  }

  onChangeFavoriteSyntaxTab.callAllListeners(baseParsedSyntaxTab);
  onChangeFavoriteSyntaxTabAnimationState.callAllListeners(false);

  document.body.innerHTML = '';

  const pageContainer = document.createElement('div');
  pageContainer.classList.add('page-container');
  pageContainer.appendChild(sidebarInstance.getElement());
  pageContainer.appendChild(contentInstance.getElement());
  pageContainer.appendChild(introductionInstance.getElement());

  document.body.appendChild(headerInstance.getElement());
  document.body.appendChild(pageContainer);

  pageContainer.addEventListener('click', (e) => {
    if (window.innerWidth <= 1330) {
      if (!e.target.closest('.left-container') && !e.target.closest('.sections')) {
        const isLeftOpen = document.querySelector('.left-container.show');
        const isSectionsOpen = document.querySelector('.sections.show');
        if (isLeftOpen || isSectionsOpen) {
          contentInstance.updateMobileSectionsVisibilityState(false);
          headerInstance.updateCompassExpandedState(false);
          sidebarInstance.updateMobileVisibilityState(false);
          headerInstance.updateSidebarMobileVisibilityState(false);
        }
      }
    }
  });

  setupSwipeGestures(pageContainer);

  requestAnimationFrame(() => {
    if (typeof pathName === 'string' && pathName.length) {
      chooseRightTab(pathName, window.location.hash).then((found) => {
        if (!found) {
          forceSwitchToHome();
        }
      });
    } else {
      introductionInstance.show();
    }
  });

  introductionInstance.onVisibilityUpdateListenerInstance.addListener({
    callback: (state) => {
      document.body.classList.toggle('as-home', state);
      document.body.classList.remove('expanded');
    }
  });

  headerInstance.onChangeListenerInstance.addListener({
    callback: (id) => {
      introductionInstance.isVisible() && introductionInstance.hide();

      const promise = sidebarInstance.loadSidebar(id);
      sidebarInstance.focusOnSidebar();
      headerInstance.updateCompassVisibilityState(false);
      headerInstance.updateCompassExpandedState(false);
      contentInstance.clearBoard();

      config.getFilesListDefaultFileById(id).then((file) => {
        if (typeof file == 'string') {
          updateLoadedFile(file, null, promise);
        }
      });
    }
  });

  headerInstance.onSidebarUpdateListenerInstance.addListener({
    callback: (isMobile) => {
      if (isMobile) {
        const state = sidebarInstance.updateMobileVisibilityState();
        headerInstance.updateSidebarMobileVisibilityState(state);
        headerInstance.updateCompassExpandedState(false);
        contentInstance.updateMobileSectionsVisibilityState(false);
      } else {
        sidebarInstance.updateDesktopCollapsedState(false);
        headerInstance.updateSidebarDesktopExpandedState(false);
      }
      closeAdaptedTooltips();
    }
  });

  headerInstance.onCompassUpdateListenerInstance.addListener({
    callback: () => {
      const state = contentInstance.updateMobileSectionsVisibilityState();
      headerInstance.updateCompassExpandedState(state);
      sidebarInstance.updateMobileVisibilityState(false);
      headerInstance.updateSidebarMobileVisibilityState(false);
      closeAdaptedTooltips();
    }
  });

  headerInstance.onSettingsUpdateListenerInstance.addListener({
    callback: (opened) => {
      if (opened) {
        contentInstance.updateMobileSectionsVisibilityState(false);
        headerInstance.updateCompassExpandedState(false);
        sidebarInstance.updateMobileVisibilityState(false);
        headerInstance.updateSidebarMobileVisibilityState(false);
      }
    }
  });

  searchManager.onSearchOpenListenerInstance.addListener({
    callback: (opened) => {
      if (opened) {
        contentInstance.updateMobileSectionsVisibilityState(false);
        headerInstance.updateCompassExpandedState(false);
        sidebarInstance.updateMobileVisibilityState(false);
        headerInstance.updateSidebarMobileVisibilityState(false);
        closeAdaptedTooltips();
      }
    }
  });

  sidebarInstance.onChangeListenerInstance.addListener({
    callback: (pathName) => {
      if (!pathName.startsWith('/')) {
        pathName = '/' + pathName;
      }

      chooseRightTab(pathName, '', false).then((found) => {
        if (!found) {
          forceSwitchToHome();
        }
      });
    }
  });

  contentInstance.onSelectedSectionListenerInstance.addListener({
    callback: () => {
      headerInstance.updateCompassExpandedState(false);
      contentInstance.updateMobileSectionsVisibilityState(false);
    }
  });
}

export function handleAsRedirect(pathName, avoidPushingState = false) {
  if (typeof pathName === 'string') {
    if (!pathName.startsWith('/')) {
      pathName = '/' + pathName;
    }

    let hash;
    if (pathName.indexOf('#') !== -1) {
      hash = '#' + pathName.split('#')[1];
      pathName = pathName.split('#')[0];
    }

    chooseRightTab(pathName, hash, avoidPushingState).then((found) => {
      if (!found) {
        forceSwitchToHome(avoidPushingState);
      }
    });
  }
}

async function chooseRightTab(pathName, hash, avoidPushingState = false) {
  let ids = await config.getAvailableCategories();
  let found = false;
  for (const category of ids) {
    const id = category.getAttribute('id').trim();
    if (decodeURI(pathName).startsWith(utils.parseCategoryUrl(id))) {
      found = true;

      headerInstance.updateActiveTab(id);
      const promise = sidebarInstance.loadSidebar(id);

      tryToIndexFilePathFromId(id, pathName, hash, promise, avoidPushingState);
    }
  }
  return found;
}

function forceSwitchToHome(avoidPushingState = false) {
  introductionInstance.show();

  if (!avoidPushingState) {
    window.history.pushState('', '', '/');
    headerInstance.onChangeListenerInstance.callInternalListeners(null);
  }
}

function tryToIndexFilePathFromId(id, pathName, hash, updateActiveFilePromise, avoidPushingState = false) {
  config.getAllFilesListFilesById(id).then((files) => {
    let found = false;

    for (const file of files) {
      if (utils.parseCategoryUrl(file) === utils.parseCategoryUrl(decodeURI(pathName))) {
        found = true;
        updateLoadedFile(file, hash, updateActiveFilePromise, avoidPushingState);
        break;
      }
    }

    if (!found) {
      config.getFilesListDefaultFileById(id).then((file) => {
        if (typeof file == 'string') {
          updateLoadedFile(file, null, updateActiveFilePromise, avoidPushingState);
        }
      });
    }
  });
}

function updateLoadedFile(file, hash, updateActiveFilePromise, avoidPushingState = false) {
  updateActiveFilePromise.then(() => {
    requestAnimationFrame(() => {
      sidebarInstance.updateActiveFile(file);
    });
  });

  introductionInstance.isVisible() && introductionInstance.hide();
  headerInstance.updateCompassVisibilityState(true);
  headerInstance.updateCompassExpandedState(false);
  contentInstance.updateMobileSectionsVisibilityState(false);
  headerInstance.updateSidebarMobileVisibilityState(false);
  sidebarInstance.updateMobileVisibilityState(false);
  // noinspection JSIgnoredPromiseFromCall
  contentInstance.loadFile(file, hash, avoidPushingState);
}

export function handleCustomCodeInsert(data) {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  contentInstance.handleCustomCodeInsert(data);
}

function resetChildrenData() {
  sidebarInstance.resetData();
  contentInstance.resetData();
  introductionInstance.resetData();
  headerInstance.resetData();
  searchManager.resetData();
}

function setupSwipeGestures(pageContainer) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isTargetScrollableHorizontally = false;

  function isHorizontallyScrollable(el) {
    let current = el;
    while (current && current !== pageContainer && current !== document.body) {
      if (current.scrollWidth > current.clientWidth + 5) {
        const overflowX = window.getComputedStyle(current).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') {
          return true;
        }
      }
      current = current.parentElement;
    }
    return false;
  }

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isTargetScrollableHorizontally = isHorizontallyScrollable(e.target);
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1) return;
    if (window.innerWidth > 1330) return;
    if (document.body.classList.contains('as-home')) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const dt = Date.now() - touchStartTime;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Filter out vertical scrolls or slow drags
    if (absDx < 40 || absDy > absDx * 0.8 || dt > 600) {
      return;
    }

    const leftSidebarElement = document.querySelector('.left-container');
    const sectionsElement = document.querySelector('.sections');

    const isLeftOpen = leftSidebarElement && leftSidebarElement.classList.contains('show');
    const isSectionsOpen = sectionsElement && sectionsElement.classList.contains('show');

    // 1. Right sidebar (TOC / "On this page") is open -> swipe right closes it
    if (isSectionsOpen && dx > 35) {
      contentInstance.updateMobileSectionsVisibilityState(false);
      headerInstance.updateCompassExpandedState(false);
      return;
    }

    // 2. Left sidebar (Navigation menu) is open -> swipe left closes it
    if (isLeftOpen && dx < -35) {
      sidebarInstance.updateMobileVisibilityState(false);
      headerInstance.updateSidebarMobileVisibilityState(false);
      return;
    }

    // If no sidebar is open, ignore if gesture started inside a horizontally scrollable container (e.g. code/table)
    if (!isLeftOpen && !isSectionsOpen && isTargetScrollableHorizontally) {
      return;
    }

    // 3. No sidebar open:
    // Swipe left (dx < -40): open right sidebar ("On this page" / Sections)
    if (!isLeftOpen && !isSectionsOpen && dx < -40) {
      if (touchStartX > window.innerWidth - 120 || touchStartX > window.innerWidth * 0.5) {
        const compass = document.querySelector('.header-compass');
        if (compass && compass.classList.contains('visible')) {
          contentInstance.updateMobileSectionsVisibilityState(true);
          headerInstance.updateCompassExpandedState(true);
          sidebarInstance.updateMobileVisibilityState(false);
          headerInstance.updateSidebarMobileVisibilityState(false);
          closeAdaptedTooltips();
        }
      }
      return;
    }

    // Swipe right (dx > 40): open left sidebar (Navigation menu)
    if (!isLeftOpen && !isSectionsOpen && dx > 40) {
      if (touchStartX < 120 || touchStartX < window.innerWidth * 0.5) {
        sidebarInstance.updateMobileVisibilityState(true);
        headerInstance.updateSidebarMobileVisibilityState(true);
        contentInstance.updateMobileSectionsVisibilityState(false);
        headerInstance.updateCompassExpandedState(false);
        closeAdaptedTooltips();
      }
    }
  }, { passive: true });
}