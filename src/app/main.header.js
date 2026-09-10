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
import * as config from "./main.config.js";
import * as tooltip from "./main.tooltip.js";
import * as iconsManager from "./main.icons.js";
import * as settingsManager from "./main.settings.js";
import {openSearchContainer} from "./main.search.js";
import * as debug from "./main.debug.js";
import * as requestsManager from "./main.requests.js";
import {isElementHidden} from "./main.utils.js";
import {getForceDesktopModeStatus} from "./main.settings.js";

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

  const headerVersionSeparator = document.createElement('div');
  headerVersionSeparator.classList.add('separator');

  const headerTitleContainer = document.createElement('div');
  headerTitleContainer.classList.add('title-container');
  headerTitleContainer.appendChild(headerMenu);
  headerTitleContainer.appendChild(headerTitle);
  headerTitleContainer.appendChild(headerSeparator);
  headerTitleContainer.appendChild(headerLibraryElement);
  headerTitleContainer.appendChild(headerVersionSeparator);
  headerTitleContainer.appendChild(getVersionElement(headerVersionSeparator));

  const fakeHeaderLibraryValue = document.createElement('div');
  fakeHeaderLibraryValue.classList.add('fake-title');
  fakeHeaderLibraryValueElement = fakeHeaderLibraryValue;

  const searchText = document.createElement('input');
  searchText.placeholder = 'Search Docs';
  const headerSearchShortcut = document.createElement('div');
  headerSearchShortcut.classList.add('search-shortcut');
  headerSearchShortcut.innerHTML = '<kbd>⇧</kbd><kbd>K</kbd>';

  const headerSearch = document.createElement('div');
  headerSearch.classList.add('search-input');
  headerSearch.addEventListener('click', () => openSearchContainer(headerSearch, searchText));
  headerSearch.appendChild(iconsManager.get('main', 'magnifyingGlass').firstChild);
  headerSearch.appendChild(searchText);
  headerSearch.appendChild(headerSearchShortcut);

  window.addEventListener('keydown', (e) => {
    const isShiftK = e.shiftKey && (e.key === 'K' || e.key === 'k');
    const isCtrlK = (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K');
    const isSlash = e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

    if (isShiftK || isCtrlK || isSlash) {
      if (!document.body.classList.contains('focused-by-search')) {
        e.preventDefault();
        openSearchContainer(headerSearch, searchText);
      }
    }
  });

  const headerCompass = document.createElement('div');
  headerCompass.classList.add('header-icon', 'header-compass');
  headerCompass.addEventListener('click', () => {
    onCompassUpdateListenerInstance.callAllListeners();
  });
  headerCompass.appendChild(iconsManager.get('main', 'compass').firstChild);
  headerCompassElement = headerCompass;

  const headerDonate = document.createElement('a');
  headerDonate.classList.add('header-icon', 'header-donate', 'visible');
  headerDonate.target = '_blank';
  headerDonate.rel = 'noopener';
  headerDonate.title = 'Support PyTgCalls';
  headerDonate.style.display = 'none';
  headerDonate.appendChild(iconsManager.get('main', 'heart').firstChild);

  config.getDonationLink().then((donationLink) => {
    if (!donationLink || !donationLink.textContent.trim()) {
      return;
    }

    headerDonate.href = donationLink.textContent.trim();
    headerDonate.style.display = '';
  });

  const headerThemeToggle = document.createElement('div');
  headerThemeToggle.classList.add('header-icon', 'header-theme-toggle', 'visible');

  const updateThemeIcon = () => {
    const isLight = settingsManager.isLightMode();
    headerThemeToggle.title = isLight ? 'Switch to Dark mode' : 'Switch to Light mode';
    headerThemeToggle.textContent = '';
    const icon = iconsManager.get('main', isLight ? 'moon' : 'sun').firstChild;
    if (icon) {
      headerThemeToggle.appendChild(icon);
    }
  };

  updateThemeIcon();
  settingsManager.onThemeChangeListenerInstance.addListener({
    callback: () => updateThemeIcon()
  });

  headerThemeToggle.addEventListener('click', () => {
    headerThemeToggle.classList.add('theme-animating');
    setTimeout(() => headerThemeToggle.classList.remove('theme-animating'), 450);
    settingsManager.toggleTheme();
  });

  const headerSettings = document.createElement('div');
  headerSettings.classList.add('header-icon', 'header-settings', 'visible');
  headerSettings.addEventListener('click', expandSettingsTooltip);
  headerSettings.appendChild(iconsManager.get('special', 'settings').firstChild);
  headerSettingsElement = headerSettings;

  const headerIcons = document.createElement('div');
  headerIcons.classList.add('header-icons');
  headerIcons.appendChild(headerSearch);
  headerIcons.appendChild(headerCompass);
  headerIcons.appendChild(headerDonate);
  headerIcons.appendChild(headerThemeToggle);
  headerIcons.appendChild(headerSettings);

  const header = document.createElement('div');
  header.classList.add('header');
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

      if ((!headerLibraryValueElement.hasChildNodes() && !wasEmpty) || isElementHidden(headerLibraryValueElement)) {
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

function expandVersionSelectorTooltip(container) {
  requestAnimationFrame(() => {
    const versions = config.getDocsVersionsSync();

    if (!versions.length) {
      return;
    }

    const currentRef = requestsManager.getDocsRef();
    const selector = document.createElement('div');
    selector.classList.add('selector');

    for (const version of versions) {
      const ref = version.getAttribute('ref');

      const singleVersionTitle = document.createElement('div');
      singleVersionTitle.classList.add('title');
      singleVersionTitle.textContent = version.textContent.trim();

      const singleVersionDescription = document.createElement('div');
      singleVersionDescription.classList.add('description');
      singleVersionDescription.textContent = (version.getAttribute('description') || ref).trim();

      const copyTagSuccess = iconsManager.get('main', 'check');
      copyTagSuccess.classList.add('success');

      const singleVersion = document.createElement('div');
      singleVersion.classList.add('library');
      singleVersion.classList.toggle('selected', ref === currentRef);
      singleVersion.addEventListener('click', () => {
        singleVersion.classList.add('selected');
        requestsManager.setDocsRef(ref);
      });
      singleVersion.appendChild(singleVersionTitle);
      singleVersion.appendChild(singleVersionDescription);
      singleVersion.appendChild(copyTagSuccess);

      selector.appendChild(singleVersion);
    }

    tooltip.init({
      childElement: selector,
      container
    });
  });
}

export function getVersionElement(separator) {
  const headerVersionTitle = document.createElement('span');
  headerVersionTitle.textContent = 'Version';
  const headerVersionTitlePoint = document.createElement('span');
  headerVersionTitlePoint.classList.add('point');
  headerVersionTitlePoint.textContent = ':';
  const headerVersionValue = document.createElement('span');
  headerVersionValue.classList.add('value');
  headerVersionValue.textContent = requestsManager.getDocsRef();
  const headerVersionIcon = iconsManager.get('main', 'chevronDown');
  const headerVersion = document.createElement('div');
  headerVersion.classList.add('library', 'version');
  headerVersion.addEventListener('click', () => expandVersionSelectorTooltip(headerVersion));
  headerVersion.appendChild(headerVersionTitle);
  headerVersion.appendChild(headerVersionTitlePoint);
  headerVersion.appendChild(headerVersionValue);
  headerVersion.appendChild(headerVersionIcon);

  config.loadConfig().then(() => {
    const versions = config.getDocsVersionsSync();
    const current = versions.find((version) => version.getAttribute('ref') === requestsManager.getDocsRef());

    if (!versions.length) {
      headerVersion.remove();
      separator.remove();
      return;
    }

    headerVersionValue.textContent = (current || versions[0]).textContent.trim();
  });

  return headerVersion;
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

    selector.appendChild(createSettingsRow(
        'Light Mode',
        'Switch between dark and light appearance',
        settingsManager.isLightMode(),
        (isLight) => settingsManager.setTheme(isLight ? 'light' : 'dark')
    ));
    selectedTabID != null && selector.appendChild(createFontSizeRow());
    selectedTabID != null && selector.appendChild(createSettingsRow(
        'Collapse Long Code',
        null,
        settingsManager.getCollapseLongCodeStatus(),
        settingsManager.updateCollapseLongCode
    ));
    selector.appendChild(createSettingsRow(
        'Force Github API',
        'Use api.github.com instead of raw.githubusercontent.com',
        settingsManager.getForceGithubAPIStatus(),
        settingsManager.updateForceGithubAPI
    ));
    (window.innerWidth < 1000 || getForceDesktopModeStatus()) && selector.appendChild(createSettingsRow(
        'Desktop Mode',
        'Force desktop mode even on mobile devices',
        settingsManager.getForceDesktopModeStatus(),
        settingsManager.updateDesktopMode
    ));
    window.innerWidth >= 1000 && selector.appendChild(createSettingsRow(
        'Reduce Blur Effects',
        'Avoid using blur effects, useful on slower devices',
        settingsManager.getReduceBlurStatus(),
        settingsManager.updateReduceBlur
    ));

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