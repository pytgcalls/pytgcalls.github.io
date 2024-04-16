class HomePage {
  onChangeFavoriteSyntaxTab;
  onChangeFavoriteSyntaxTabAnimationState;

  #headerInstance;
  #sidebarInstance;
  #contentInstance;
  #introductionInstance;

  init(pathName) {
    this.onChangeFavoriteSyntaxTab = new ListenerManagerInstance();
    this.onChangeFavoriteSyntaxTabAnimationState = new ListenerManagerInstance();

    const syntaxTabData = localStorage.getItem('currentTabDataIndexes');
    let baseParsedSyntaxTab = {};
    if (syntaxTabData != null) {
      try {
        baseParsedSyntaxTab = JSON.parse(syntaxTabData);
      } catch (_) { }
    }

    this.onChangeFavoriteSyntaxTab.callAllListeners(baseParsedSyntaxTab);
    this.onChangeFavoriteSyntaxTabAnimationState.callAllListeners(false);

    this.#headerInstance = new Header();
    this.#sidebarInstance = new Sidebar();
    this.#contentInstance = new Content();
    this.#introductionInstance = new Introduction();

    document.body.innerHTML = '';

    const pageContainer = document.createElement('div');
    pageContainer.classList.add('page-container');
    pageContainer.appendChild(this.#sidebarInstance.getElement());
    pageContainer.appendChild(this.#contentInstance.getElement());
    pageContainer.appendChild(this.#introductionInstance.getElement());

    document.body.appendChild(this.#headerInstance.getElement());
    document.body.appendChild(pageContainer);

    requestAnimationFrame(() => {
      if (typeof pathName === 'string' && pathName.length) {
        this.#chooseRightTab(pathName, window.location.hash).then((found) => {
          if (found) {
            this.#headerInstance.highlightTabsForSelection();
          }
        });
      } else {
        this.#introductionInstance.show();
      }
    });

    this.#introductionInstance.onVisibilityUpdateListenerInstance.addListener({
      callback: (state) => {
        document.body.classList.toggle('as-home', state);
        document.body.classList.remove('expanded');

        if (state) {
          this.#headerInstance.highlightTabsForIntroduction();
        }
      }
    });

    this.#headerInstance.onTabsVisibilityUpdateListenerInstance.addListener({
      callback: (state) => {
        if (state) {
          this.#headerInstance.updateSidebarMobileVisibilityState(false);
          this.#headerInstance.updateCompassExpandedState(false);
          this.#sidebarInstance.updateMobileVisibilityState(false);
          this.#contentInstance.updateMobileSectionsVisibilityState(false);
        }
      }
    });

    this.#headerInstance.onChangeListenerInstance.addListener({
      callback: (id) => {
        this.#introductionInstance.hide();
        const promise = this.#sidebarInstance.loadSidebar(id);
        this.#sidebarInstance.focusOnSidebar();
        this.#headerInstance.updateCompassVisibilityState(false);
        this.#headerInstance.updateCompassExpandedState(false);
        this.#headerInstance.updateTabsMobileVisibility(false);
        this.#contentInstance.clearBoard();

        config.getFilesListDefaultFileById(id).then((file) => {
          if (typeof file == 'string') {
            this.#updateLoadedFile(file, null, promise);
          }
        });
      }
    });

    this.#headerInstance.onSidebarUpdateListenerInstance.addListener({
      callback: (isMobile) => {
        if (isMobile) {
          const state = this.#sidebarInstance.updateMobileVisibilityState();
          this.#headerInstance.updateSidebarMobileVisibilityState(state);
          this.#headerInstance.updateCompassExpandedState(false);
          this.#headerInstance.updateTabsMobileVisibility(false);
          this.#contentInstance.updateMobileSectionsVisibilityState(false);
        } else {
          this.#sidebarInstance.updateDesktopCollapsedState(false);
          this.#headerInstance.updateSidebarDesktopExpandedState(false);
        }
      }
    });

    this.#headerInstance.onCompassUpdateListenerInstance.addListener({
      callback: () => {
        const state = this.#contentInstance.updateMobileSectionsVisibilityState();
        this.#headerInstance.updateCompassExpandedState(state);
        this.#sidebarInstance.updateMobileVisibilityState(false);
        this.#headerInstance.updateSidebarMobileVisibilityState(false);
        this.#headerInstance.updateTabsMobileVisibility(false);
      }
    });

    this.#sidebarInstance.onCollapsedListenerInstance.addListener({
      callback: (isCollapsed) => {
        this.#headerInstance.updateSidebarDesktopExpandedState(isCollapsed);
      }
    });

    this.#sidebarInstance.onChangeListenerInstance.addListener({
      callback: (file) => {
        this.#headerInstance.updateSidebarMobileVisibilityState(false);
        this.#headerInstance.updateCompassVisibilityState(true);
        this.#headerInstance.updateCompassExpandedState(false);
        this.#sidebarInstance.updateMobileVisibilityState(false);
        this.#contentInstance.loadFile(file);
      }
    });

    this.#contentInstance.onSelectedSectionListenerInstance.addListener({
      callback: () => {
        this.#headerInstance.updateCompassExpandedState(false);
        this.#contentInstance.updateMobileSectionsVisibilityState(false);
      }
    });
  }

  handleAsRedirect(pathName) {
    if (typeof pathName === 'string') {
      if (!pathName.startsWith('/')) {
        pathName = '/' + pathName;
      }

      let hash;
      if (pathName.indexOf('#') !== -1) {
        hash = '#' + pathName.split('#')[1];
        pathName = pathName.split('#')[0];
      }
      this.#chooseRightTab(pathName, hash);
    }
  }

  #chooseRightTab(pathName, hash) {
    return new Promise((resolve) => {
      config.getAvailableCategories().then((ids) => {
        let found = false;

        for (const id of ids) {
          if (decodeURI(pathName).startsWith(utils.parseCategoryUrl(id))) {
            found = true;

            this.#headerInstance.updateActiveTab(id);
            const promise = this.#sidebarInstance.loadSidebar(id);

            this.#tryToIndexFilePathFromId(id, pathName, hash, promise);
          }
        }

        if (!found) {
          window.history.pushState('', '', '/');
          this.#introductionInstance.show();
          this.#headerInstance.onChangeListenerInstance.callInternalListeners("Documentation");
        }

        resolve(found);
      });
    });
  }

  #tryToIndexFilePathFromId(id, pathName, hash, updateActiveFilePromise) {
    config.getAllFilesListFilesById(id).then((files) => {
      let found = false;

      for (const file of files) {
        if (utils.parseCategoryUrl(file) === decodeURI(pathName)) {
          found = true;
          this.#updateLoadedFile(file, hash, updateActiveFilePromise);
          break;
        }
      }

      if (!found) {
        config.getFilesListDefaultFileById(id).then((file) => {
          if (typeof file == 'string') {
            this.#updateLoadedFile(file, null, updateActiveFilePromise);
          }
        });
      }
    });
  }

  #updateLoadedFile(file, hash, updateActiveFilePromise) {
    updateActiveFilePromise.then(() => {
      requestAnimationFrame(() => {
        this.#sidebarInstance.updateActiveFile(file);
      });
    });

    this.#headerInstance.updateCompassVisibilityState(true);
    this.#headerInstance.updateCompassExpandedState(false);
    this.#headerInstance.updateTabsMobileVisibility(false);
    this.#sidebarInstance.updateMobileVisibilityState(false);
    this.#contentInstance.loadFile(file, hash);
  }

  handleCustomCodeInsert(data) {
    if (!debug.isSafeToUseDebugItems()) {
      return;
    }

    this.#contentInstance.handleCustomCodeInsert(data);
  }
}

const homePage = new HomePage();