import * as sidebarInstance from "./main.sidebar.js";
import * as contentInstance from "./main.content.js";
import * as introductionInstance from "./main.introduction.js";
import * as headerInstance from "./main.header.js";
import * as config from "./main.config.js";
import * as utils from "./main.utils.js";
import * as debug from "./main.debug.js";
import ListenerManagerInstance from "./main.listener.js";

const onChangeFavoriteSyntaxTab = new ListenerManagerInstance();
const onChangeFavoriteSyntaxTabAnimationState = new ListenerManagerInstance();

function init(pathName) {
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

  requestAnimationFrame(() => {
    if (typeof pathName === 'string' && pathName.length) {
      chooseRightTab(pathName, window.location.hash).then((found) => {
        if (found) {
          headerInstance.highlightTabsForSelection();
        } else {
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

      if (state) {
        headerInstance.highlightTabsForIntroduction();
      }
    }
  });

  headerInstance.onTabsVisibilityUpdateListenerInstance.addListener({
    callback: (state) => {
      if (state) {
        headerInstance.updateSidebarMobileVisibilityState(false);
        headerInstance.updateCompassExpandedState(false);
        sidebarInstance.updateMobileVisibilityState(false);
        contentInstance.updateMobileSectionsVisibilityState(false);
      }
    }
  });

  headerInstance.onChangeListenerInstance.addListener({
    callback: (id) => {
      introductionInstance.hide();
      const promise = sidebarInstance.loadSidebar(id);
      sidebarInstance.focusOnSidebar();
      headerInstance.updateCompassVisibilityState(false);
      headerInstance.updateCompassExpandedState(false);
      headerInstance.updateTabsMobileVisibility(false);
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
        headerInstance.updateTabsMobileVisibility(false);
        contentInstance.updateMobileSectionsVisibilityState(false);
      } else {
        sidebarInstance.updateDesktopCollapsedState(false);
        headerInstance.updateSidebarDesktopExpandedState(false);
      }
    }
  });

  headerInstance.onCompassUpdateListenerInstance.addListener({
    callback: () => {
      const state = contentInstance.updateMobileSectionsVisibilityState();
      headerInstance.updateCompassExpandedState(state);
      sidebarInstance.updateMobileVisibilityState(false);
      headerInstance.updateSidebarMobileVisibilityState(false);
      headerInstance.updateTabsMobileVisibility(false);
    }
  });

  sidebarInstance.onCollapsedListenerInstance.addListener({
    callback: (isCollapsed) => {
      headerInstance.updateSidebarDesktopExpandedState(isCollapsed);
    }
  });

  sidebarInstance.onChangeListenerInstance.addListener({
    callback: (file) => {
      headerInstance.updateSidebarMobileVisibilityState(false);
      headerInstance.updateCompassVisibilityState(true);
      headerInstance.updateCompassExpandedState(false);
      sidebarInstance.updateMobileVisibilityState(false);
      contentInstance.loadFile(file);
    }
  });

  contentInstance.onSelectedSectionListenerInstance.addListener({
    callback: () => {
      headerInstance.updateCompassExpandedState(false);
      contentInstance.updateMobileSectionsVisibilityState(false);
    }
  });
}

function handleAsRedirect(pathName, avoidPushingState = false) {
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
        forceSwitchToHome();
      }
    });
  }
}

function chooseRightTab(pathName, hash, avoidPushingState = false) {
  return new Promise((resolve) => {
    config.getAvailableCategories().then((ids) => {
      let found = false;

      for (const id of ids) {
        if (decodeURI(pathName).startsWith(utils.parseCategoryUrl(id))) {
          found = true;

          headerInstance.updateActiveTab(id);
          const promise = sidebarInstance.loadSidebar(id);

          tryToIndexFilePathFromId(id, pathName, hash, promise, avoidPushingState);
        }
      }

      resolve(found);
    });
  });
}

function forceSwitchToHome() {
  window.history.pushState('', '', '/');
  introductionInstance.show();
  headerInstance.onChangeListenerInstance.callInternalListeners("Documentation");
}

function tryToIndexFilePathFromId(id, pathName, hash, updateActiveFilePromise, avoidPushingState = false) {
  config.getAllFilesListFilesById(id).then((files) => {
    let found = false;

    for (const file of files) {
      if (utils.parseCategoryUrl(file) === decodeURI(pathName)) {
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

  headerInstance.updateCompassVisibilityState(true);
  headerInstance.updateCompassExpandedState(false);
  headerInstance.updateTabsMobileVisibility(false);
  sidebarInstance.updateMobileVisibilityState(false);
  contentInstance.loadFile(file, hash, avoidPushingState);
}

function handleCustomCodeInsert(data) {
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
}

export {
  init,
  handleAsRedirect,
  handleCustomCodeInsert,
  onChangeFavoriteSyntaxTab,
  onChangeFavoriteSyntaxTabAnimationState,
};