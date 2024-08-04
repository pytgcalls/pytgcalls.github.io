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
import * as config from "./main.config.js";
import * as tooltip from "./main.tooltip.js";
import * as iconsManager from "./main.icons.js";
import * as settingsManager from "./main.settings.js";
import {openSearchContainer} from "./main.search.js";
import * as debug from "./main.debug.js";

export const onChangeListenerInstance = new ListenerManagerInstance();
export const onSidebarUpdateListenerInstance = new ListenerManagerInstance();
export const onCompassUpdateListenerInstance = new ListenerManagerInstance();
export const onSettingsUpdateListenerInstance = new ListenerManagerInstance();

let headerElement;
let headerMenuElement;
let headerExpandedElement;
let headerCompassElement;
let headerDescriptionElement;
let headerLibraryElement;
let headerMobileSearchElement;
let headerSettingsElement;
let headerLibraryValueElement;
let fakeHeaderLibraryValueElement;

let selectedTabID;

export function getElement() {
  const headerMenu = document.createElement('div');
  headerMenu.classList.add('menu');
  headerMenu.addEventListener('click', () => {
    if (selectedTabID == null) {
      expandLibrarySelectorTooltip(headerProjectName);
    } else {
      onSidebarUpdateListenerInstance.callAllListeners(true);
    }
  });
  headerMenu.appendChild(document.createElement('div'));
  headerMenu.appendChild(document.createElement('div'));
  headerMenu.appendChild(document.createElement('div'));
  headerMenuElement = headerMenu;

  const headerIcon = iconsManager.get('socials', 'telegram');

  const headerProjectName = document.createElement('div');
  headerProjectName.classList.add('project-name');
  headerProjectName.textContent = 'Documentation';
  const headerTitle = document.createElement('div');
  headerTitle.classList.add('title');
  headerTitle.appendChild(headerIcon);
  headerTitle.appendChild(headerProjectName);

  const headerSeparator = document.createElement('div');
  headerSeparator.classList.add('separator');

  const libraryElement = getLibraryElement();
  headerLibraryElement = libraryElement.element;
  headerLibraryValueElement = libraryElement.value;

  const headerTitleContainer = document.createElement('div');
  headerTitleContainer.classList.add('title-container');
  headerTitleContainer.appendChild(headerTitle);
  headerTitleContainer.appendChild(headerSeparator);
  headerTitleContainer.appendChild(headerLibraryElement);

  const fakeHeaderLibraryValue = document.createElement('div');
  fakeHeaderLibraryValue.classList.add('fake-title');
  fakeHeaderLibraryValueElement = fakeHeaderLibraryValue;

  const searchText = document.createElement('input');
  searchText.placeholder = 'Search Docs';
  const headerSearch = document.createElement('div');
  headerSearch.classList.add('search-input');
  headerSearch.addEventListener('click', () => openSearchContainer(headerSearch, searchText));
  headerSearch.appendChild(iconsManager.get('main', 'magnifyingGlass').firstChild);
  headerSearch.appendChild(searchText);

  const headerCompass = document.createElement('div');
  headerCompass.classList.add('header-icon', 'header-compass');
  headerCompass.addEventListener('click', () => {
    onCompassUpdateListenerInstance.callAllListeners();
  });
  headerCompass.appendChild(iconsManager.get('main', 'compass').firstChild);
  headerCompassElement = headerCompass;

  const headerMobileSearch = document.createElement('div');
  headerMobileSearch.classList.add('header-icon', 'header-search', 'visible');
  headerMobileSearch.addEventListener('click', () => openSearchContainer(headerMobileSearch, searchText));
  headerMobileSearch.appendChild(iconsManager.get('main', 'magnifyingGlass').firstChild);
  headerMobileSearchElement = headerMobileSearch;

  const headerSettings = document.createElement('div');
  headerSettings.classList.add('header-icon', 'header-settings', 'visible');
  headerSettings.addEventListener('click', expandSettingsTooltip);
  headerSettings.appendChild(iconsManager.get('special', 'settings').firstChild);
  headerSettingsElement = headerSettings;

  const headerIcons = document.createElement('div');
  headerIcons.classList.add('header-icons');
  headerIcons.appendChild(headerSearch);
  headerIcons.appendChild(headerCompass);
  headerIcons.appendChild(headerMobileSearch);
  headerIcons.appendChild(headerSettings);

  const header = document.createElement('div');
  header.classList.add('header');
  header.appendChild(headerMenu);
  header.appendChild(headerTitleContainer);
  header.appendChild(fakeHeaderLibraryValue);
  header.appendChild(headerIcons);
  headerElement = header;

  appendTitleUpdateOnActiveTabUpdate();

  return header;
}

export function updateActiveTab(id) {
  onChangeListenerInstance.callInternalListeners(id);
}

function globalUpdateActiveTab(id) {
  onChangeListenerInstance.callAllListeners(id);
}

export function updateSidebarMobileVisibilityState(state) {
  headerMenuElement.classList.toggle('show', state);
}

export function updateSidebarDesktopExpandedState(state) {
  headerExpandedElement.classList.toggle('show', state);
}

export function updateCompassVisibilityState(state) {
  headerCompassElement.classList.toggle('visible', state);
}

export function updateCompassExpandedState(state) {
  headerCompassElement.classList.toggle('show', state);
}

function appendTitleUpdateOnActiveTabUpdate() {
  onChangeListenerInstance.addListener({
    callback: (id) => {
      selectedTabID = id;

      if (headerLibraryValueElement.textContent === id) {
        return;
      }

      document.title = id == null ? 'Home' : id+' Docs';

      const wasEmpty = headerLibraryElement.classList.contains('is-empty');
      headerLibraryElement.classList.toggle('is-empty', id == null);

      if (!headerLibraryValueElement.hasChildNodes() && !wasEmpty) {
        headerLibraryValueElement.textContent = id;
        return;
      }

      if (wasEmpty) {
        headerLibraryValueElement.style.setProperty('--width', '0px');
        headerLibraryValueElement.offsetHeight; // trigger redraw
      }

      fakeHeaderLibraryValueElement.textContent = id;
      const rect = fakeHeaderLibraryValueElement.getBoundingClientRect();
      headerLibraryValueElement.style.setProperty('--width', rect.width.toString() + 'px');

      headerLibraryValueElement.classList.add('updating');
      headerLibraryValueElement.addEventListener('transitionend', () => {
        headerLibraryValueElement.classList.remove('updating');
        headerLibraryValueElement.textContent = id;
      }, { once: true });
    },
    isInternal: true
  });
}

function expandLibrarySelectorTooltip(container) {
  requestAnimationFrame(() => {
    config.getAvailableCategories().then((ids) => {
      const selector = document.createElement('div');
      selector.classList.add('selector');
  
      for (const id of ids) {
        const singleLibraryTitle = document.createElement('div');
        singleLibraryTitle.classList.add('title');
        singleLibraryTitle.textContent = id.getAttribute('id').trim();
  
        const singleLibraryDescription = document.createElement('div');
        singleLibraryDescription.classList.add('description');
        singleLibraryDescription.textContent = id.getAttribute('description').trim();

        const copyTagSuccess = iconsManager.get('main', 'check');
        copyTagSuccess.classList.add('success');
  
        const singleLibrary = document.createElement('div');
        singleLibrary.classList.add('library');
        singleLibrary.classList.toggle('selected', (onChangeListenerInstance.ultimateDataCall || onChangeListenerInstance.ultimateDataCallInternal) === id.getAttribute('id').trim());
        singleLibrary.addEventListener('click', () => {
          singleLibrary.classList.add('selected');
          globalUpdateActiveTab(id.getAttribute('id').trim());
        });
        singleLibrary.appendChild(singleLibraryTitle);
        singleLibrary.appendChild(singleLibraryDescription);
        singleLibrary.appendChild(copyTagSuccess);
  
        selector.appendChild(singleLibrary);
      }
    
      tooltip.init({
        childElement: selector,
        container
      });
    });
  });
}

function expandSettingsTooltip() {
  if (tooltip.isAnimatingClosing()) {
    return;
  }

  if (headerSettingsElement.classList.contains('focused-tooltip')) {
    tooltip.closeTooltips();
    return;
  }

  requestAnimationFrame(() => {
    const selector = document.createElement('div');
    selector.classList.add('selector');

    const mainTitle = document.createElement('div');
    mainTitle.classList.add('main-title');
    mainTitle.textContent = 'Settings';
    selector.appendChild(mainTitle);

    selectedTabID != null && selector.appendChild(createFontSizeRow());
    selectedTabID != null && selector.appendChild(createSettingsRow(
        'Collapse Long Code',
        null,
        settingsManager.getCollapseLongCodeStatus(),
        (status) => settingsManager.updateCollapseLongCode(status)
    ));
    selector.appendChild(createSettingsRow(
        'Force Github API',
        'Use api.github.com instead of raw.githubusercontent.com',
        settingsManager.getForceGithubAPIStatus(),
        (status) => settingsManager.updateForceGithubAPI(status)
    ));
    selector.appendChild(createSettingsRow(
        'Reduce Blur Effects',
        'Avoid using blur effects, useful on slower devices',
        settingsManager.getReduceBlurStatus(),
        (status) => settingsManager.updateReduceBlur(status)
    ));

    if (window.innerWidth < 1000) {
      selector.appendChild(createSettingsRow(
          'Desktop Mode',
          'Force desktop mode even on mobile devices',
          settingsManager.getForceDesktopModeStatus(),
          (status) => settingsManager.updateDesktopMode(status)
      ));
    }

    if (debug.isSafeToUseDebugItems() && selectedTabID != null) {
      const debugTitle = document.createElement('div');
      debugTitle.classList.add('mini-text', 'has-margin', 'align-left');
      debugTitle.textContent = 'DEBUG';
      selector.appendChild(debugTitle);

      selector.appendChild(createDebugRow('Try custom page code', () => debug.tryCustomPageCode()));
      selector.appendChild(createDebugRow('Try custom config code', () => debug.tryCustomPageCode(true)));
      selector.appendChild(createDebugRow('Try custom server', () => debug.tryCustomServer()));
      selector.appendChild(createDebugRow('Reload page data',  () => debug.reloadPageData()));
    }

    onSettingsUpdateListenerInstance.callAllListeners(true);
    tooltip.init({
      childElement: selector,
      container: headerSettingsElement,
      closeOnClick: false,
      moreSpace: true,
      adaptMobileInterface: true
    });
  });
}

function createFontSizeRow() {
  let longPressInterval;
  let standardSizeTimeout;

  const updateState = () => {
    fontSizeLess.classList.toggle('disabled', !settingsManager.canDecreaseFontSize());
    fontSizeMore.classList.toggle('disabled', !settingsManager.canIncreaseFontSize());

    if (settingsManager.isDefaultFontSize() && longPressInterval == null) {
      fontSizeContainer.offsetHeight;
      fontSizeContainer.classList.add('is-standard');

      standardSizeTimeout = setTimeout(() => {
        fontSizeContainer.classList.remove('is-standard');
      }, 920);
    }
  };

  const handleLongPress = (isIncrease = true, faster = false) => {
    let pressIntN = 0;

    stopLongPress();
    window.addEventListener('mouseup', stopLongPress, { once: true });
    longPressInterval = setInterval(() => {
      pressIntN++;

      const canUpdate = isIncrease ? settingsManager.canIncreaseFontSize() : settingsManager.canDecreaseFontSize();
      if (canUpdate) {
        isIncrease ? settingsManager.increaseFontSize() : settingsManager.decreaseFontSize();

        if (pressIntN > 3 && !faster) {
          handleLongPress(isIncrease, true);
        }
      } else {
        stopLongPress();
      }
      updateState();
    }, faster ? 200 : 500);
  };

  const stopLongPress = () => {
    if (longPressInterval != null) {
      clearInterval(longPressInterval);
      longPressInterval = undefined;
    }
    window.removeEventListener('mouseup', stopLongPress, { once: true });
  };

  const fontSizeLess = document.createElement('div');
  fontSizeLess.classList.add('font-size-item', 'smaller');
  fontSizeLess.addEventListener('mousedown', () => handleLongPress(false));
  fontSizeLess.addEventListener('click', () => {
    settingsManager.decreaseFontSize();
    updateState();
  });
  fontSizeLess.textContent = 'A';

  const fontSizeMore = document.createElement('div');
  fontSizeMore.classList.add('font-size-item', 'bigger');
  fontSizeMore.addEventListener('mousedown', () => handleLongPress());
  fontSizeMore.addEventListener('click', () => {
    settingsManager.increaseFontSize();
    updateState();
  });
  fontSizeMore.textContent = 'A';

  const fontSizeStandardSpan = document.createElement('span');
  fontSizeStandardSpan.textContent = '100%';
  const fontSizeStandard = document.createElement('div');
  fontSizeStandard.classList.add('font-size-standard');
  fontSizeStandard.addEventListener('click', () => {
    if (standardSizeTimeout != null) {
      clearTimeout(standardSizeTimeout);
      standardSizeTimeout = null;
    }

    fontSizeContainer.classList.remove('is-standard');
  });
  fontSizeStandard.appendChild(fontSizeStandardSpan);

  const fontSizeContainer = document.createElement('div');
  fontSizeContainer.classList.add('font-size');
  fontSizeContainer.appendChild(fontSizeLess);
  fontSizeContainer.appendChild(fontSizeMore);
  fontSizeContainer.appendChild(fontSizeStandard);

  const fontSizePreview = document.createElement('div');
  fontSizePreview.classList.add('font-size-preview');
  fontSizePreview.textContent = "Isn't this the most exciting font size preview ever?";

  const fragment = document.createDocumentFragment();
  fragment.appendChild(fontSizePreview);
  fragment.appendChild(fontSizeContainer);

  return fragment;
}

function createDebugRow(title, callback) {
  return createSettingsRow(title, null, false, () => {
    tooltip.closeTooltips();
    callback();
  }, false);
}

function createSettingsRow(title, description, status, callback, hasSwitch = true) {

  const settingRowTitle = document.createElement('div');
  settingRowTitle.classList.add('title');
  settingRowTitle.textContent = title;

  const settingRowSwitch = document.createElement('div');
  settingRowSwitch.classList.add('switch');
  settingRowSwitch.classList.toggle('selected', status);

  const settingRowTitleRow = document.createElement('div');
  settingRowTitleRow.classList.add('title-row');
  hasSwitch && settingRowTitleRow.appendChild(settingRowTitle);
  hasSwitch && settingRowTitleRow.appendChild(settingRowSwitch);

  const settingRowDescription = document.createElement('div');
  settingRowDescription.classList.add('description');
  settingRowDescription.textContent = description;

  const settingRow = document.createElement('div');
  settingRow.classList.add('library', 'has-switch');
  settingRow.addEventListener('click', () => {
    if (!hasSwitch) {
      callback();
      return;
    }

    const newStatus = settingRowSwitch.classList.toggle('selected');
    callback(newStatus);
  });
  hasSwitch && settingRow.appendChild(settingRowTitleRow);
  !hasSwitch && settingRow.appendChild(settingRowTitle);
  description && settingRow.appendChild(settingRowDescription);

  return settingRow;
}

export function getLibraryElement(isStatic = false) {
  const headerLibraryTitle = document.createElement('span');
  headerLibraryTitle.textContent = 'Library';
  const headerLibraryTitlePoint = document.createElement('span');
  headerLibraryTitlePoint.classList.add('point');
  headerLibraryTitlePoint.textContent = ':';
  const headerLibraryValue = document.createElement('span');
  headerLibraryValue.classList.add('value');
  const headerLibraryIcon = iconsManager.get('main', 'chevronDown');
  const headerLibrary = document.createElement('div');
  headerLibrary.classList.add('library');
  headerLibrary.addEventListener('click', () => expandLibrarySelectorTooltip(headerLibrary));
  headerLibrary.appendChild(headerLibraryTitle);
  headerLibrary.appendChild(headerLibraryTitlePoint);
  headerLibrary.appendChild(headerLibraryValue);
  headerLibrary.appendChild(headerLibraryIcon);

  if (isStatic && selectedTabID != null) {
    headerLibraryValue.textContent = selectedTabID;
  }

  return {
    element: headerLibrary,
    value: headerLibraryValue
  };
}

export function resetData() {
  headerElement = undefined;
  headerMenuElement = undefined;
  headerExpandedElement = undefined;
  headerCompassElement = undefined;
  headerDescriptionElement = undefined;
  headerLibraryValueElement = undefined;
  fakeHeaderLibraryValueElement = undefined;

  selectedTabID = undefined;
}