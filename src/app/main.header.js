import ListenerManagerInstance from "./main.listener.js";
import * as config from "./main.config.js";
import * as tooltip from "./main.tooltip.js";
import * as iconsManager from "./main.icons.js";

const onChangeListenerInstance = new ListenerManagerInstance();
const onSidebarUpdateListenerInstance = new ListenerManagerInstance();
const onCompassUpdateListenerInstance = new ListenerManagerInstance();
const onTabsVisibilityUpdateListenerInstance = new ListenerManagerInstance();

let headerElement;
let headerMenuElement;
let headerExpandedElement;
let headerCompassElement;
let headerDescriptionElement;
let headerProjectNameElement;
let headerTitleElement;
let fakeHeaderTitleElement;

let hasSelectedTab = false;

function getElement() {
  const headerMenu = document.createElement('div');
  headerMenu.classList.add('menu');
  headerMenu.addEventListener('click', () => {
    if (header.classList.contains('tabs-expanded')) {
      header.classList.remove('tabs-expanded');
      onTabsVisibilityUpdateListenerInstance.callAllListeners(false);
    } else if (!hasSelectedTab) {
      header.classList.add('tabs-expanded');
      onTabsVisibilityUpdateListenerInstance.callAllListeners(true);
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
  headerProjectNameElement = headerProjectName;
  const headerTitle = document.createElement('div');
  headerTitle.classList.add('title');
  headerTitle.addEventListener('click', () => {
    const state = header.classList.toggle('tabs-expanded');
    onTabsVisibilityUpdateListenerInstance.callAllListeners(state);
  });
  headerTitle.appendChild(headerProjectName);
  headerTitle.appendChild(headerIcon);
  headerTitleElement = headerTitle;
  const fakeHeaderTitle = document.createElement('div');
  fakeHeaderTitle.classList.add('fake-title');
  fakeHeaderTitleElement = fakeHeaderTitle;

  const headerCompass = document.createElement('div');
  headerCompass.classList.add('header-compass');
  headerCompass.addEventListener('click', () => {
    onCompassUpdateListenerInstance.callAllListeners();
  });
  headerCompass.appendChild(iconsManager.get('main', 'compass'));
  headerCompassElement = headerCompass;

  const headerDescription = document.createElement('div');
  headerDescription.classList.add('description');
  headerDescriptionElement = headerDescription;

  const header = document.createElement('div');
  header.classList.add('header');
  header.addEventListener('dblclick', () => {
    document.body.classList.toggle('disable-blur');
  });
  header.appendChild(headerMenu);
  header.appendChild(headerTitle);
  header.appendChild(fakeHeaderTitle);
  header.appendChild(headerCompass);
  header.appendChild(headerDescription);
  headerElement = header;

  createTabsByConfig();
  appendTitleUpdateOnActiveTabUpdate();

  return header;
}

function createTabsByConfig() {
  config.getAvailableCategories().then((ids) => {
    const tabsContainer = generateTabsContainer(ids);

    headerDescriptionElement.textContent = '';
    headerDescriptionElement.appendChild(tabsContainer);
  });
}

function generateTabsContainer(ids, ignoreOnChange = false) {
  const tabsContainer = document.createElement('div');
  tabsContainer.classList.add('tabs');

  for (const id of ids) {
    tabsContainer.appendChild(createSingleTab(id, ignoreOnChange));
  }

  if (!ignoreOnChange) {
    onChangeListenerInstance.addListener({
      callback: (id) => {
        if (ids.indexOf(id) !== -1) {
          hasSelectedTab = true;
        }
      },
      isInternal: true,
      ref: tabsContainer
    });
  }

  return tabsContainer;
}

function createSingleTab(id, ignoreOnChange) {
  const tab = document.createElement('div');
  tab.classList.add('tab');
  tab.addEventListener('click', () => {
    globalUpdateActiveTab(id);
  });
  tab.textContent = id;

  if (!ignoreOnChange) {
    onChangeListenerInstance.addListener({
      callback: (activeId) => {
        tab.classList.toggle('active', activeId === id);
      },
      isInternal: true,
      ref: tab
    });
  }

  return tab;
}

function updateActiveTab(id) {
  onChangeListenerInstance.callInternalListeners(id);
}

function globalUpdateActiveTab(id) {
  onChangeListenerInstance.callAllListeners(id);
}

function updateSidebarMobileVisibilityState(state) {
  headerMenuElement.classList.toggle('show', state);
}

function updateSidebarDesktopExpandedState(state) {
  headerExpandedElement.classList.toggle('show', state);
}

function updateCompassVisibilityState(state) {
  headerCompassElement.classList.toggle('visible', state);
}

function updateCompassExpandedState(state) {
  headerCompassElement.classList.toggle('show', state);
}

function updateTabsMobileVisibility(state) {
  headerElement.classList.toggle('tabs-expanded', state);
}

function appendTitleUpdateOnActiveTabUpdate() {
  onChangeListenerInstance.addListener({
    callback: (id) => {
      if (headerProjectNameElement.textContent === id) {
        return;
      }

      document.title = id;
      if (id !== 'Documentation') {
        document.title += ' Documentation';
      }

      if (headerProjectNameElement.textContent === "") {
        headerProjectNameElement.textContent = id;
        return;
      }

      fakeHeaderTitleElement.textContent = id;
      const rect = fakeHeaderTitleElement.getBoundingClientRect();
      headerProjectNameElement.style.setProperty('--width', rect.width.toString() + 'px');

      headerProjectNameElement.classList.add('updating');
      headerProjectNameElement.addEventListener('transitionend', () => {
        headerProjectNameElement.classList.remove('updating');
        headerProjectNameElement.textContent = id;
      }, { once: true });
    },
    isInternal: true
  });
}

function highlightTabsForSelection() {
  setTimeout(() => {
    tooltip.init({
      title: 'Select your language',
      text: 'You can choose the programming language by pressing here.',
      container: detectContainerForTooltips()
    });
  }, 800);
}

function highlightTabsForIntroduction() {
  setTimeout(() => {
    tooltip.init({
      title: 'Select your library',
      text: 'When you are ready, you can go to the library documentation of your favorite language by selecting it above.',
      container: detectContainerForTooltips()
    });
  }, 800);
}

function detectContainerForTooltips() {
  return (
    window.matchMedia('screen and (max-width: 1330px)').matches
      ? headerTitleElement : headerDescriptionElement
  );
}

function resetData() {
  headerElement = undefined;
  headerMenuElement = undefined;
  headerExpandedElement = undefined;
  headerCompassElement = undefined;
  headerDescriptionElement = undefined;
  headerProjectNameElement = undefined;
  headerTitleElement = undefined;
  fakeHeaderTitleElement = undefined;

  hasSelectedTab = false;
}

export {
  getElement,
  updateActiveTab,
  updateSidebarMobileVisibilityState,
  updateSidebarDesktopExpandedState,
  updateCompassVisibilityState,
  updateCompassExpandedState,
  updateTabsMobileVisibility,
  highlightTabsForSelection,
  highlightTabsForIntroduction,
  resetData,
  onChangeListenerInstance,
  onSidebarUpdateListenerInstance,
  onCompassUpdateListenerInstance,
  onTabsVisibilityUpdateListenerInstance
};