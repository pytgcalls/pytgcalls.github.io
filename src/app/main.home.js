class HomePage {
  #COLORS = ['red', 'green', 'blue', 'yellow'];
  
  #headerInstance;
  #sidebarInstance;
  #contentInstance;

  init(pathName) {
    this.#headerInstance = new Header();
    this.#sidebarInstance = new Sidebar();
    this.#contentInstance = new Content();

    document.body.innerHTML = '';

    const pageContainer = document.createElement('div');
    pageContainer.classList.add('page-container');
    pageContainer.appendChild(this.#sidebarInstance.getElement());
    pageContainer.appendChild(this.#contentInstance.getElement());
    
    document.body.appendChild(this.#headerInstance.getElement());
    document.body.appendChild(pageContainer);

    for(let i = 0; i < 4; i++) {
      if (this.#COLORS[i]) {
        const randomX = Math.floor(Math.random() * 100);
        const randomY = Math.floor(Math.random() * 100);

        const shadowElement = document.createElement('div');
        shadowElement.classList.add('shadow-element');
        shadowElement.style.setProperty('--x', randomX.toString() + '%');
        shadowElement.style.setProperty('--y', randomY.toString() + '%');
        shadowElement.style.setProperty('--color', this.#COLORS[i]);
        document.body.appendChild(shadowElement);
      }
    }

    requestAnimationFrame(() => {
      if (typeof pathName === 'string') {
        this.#chooseRightTab(pathName, window.location.hash);
      } else {
        this.#headerInstance.updateActiveTab('NTgCalls');
        this.#sidebarInstance.loadSidebar('NTgCalls');
      }  
    });

    this.#headerInstance.addOnActiveTabUpdate((id) => {
      this.#sidebarInstance.loadSidebar(id);
      this.#headerInstance.updateCompassVisibilityState(false);
      this.#headerInstance.updateCompassExpandedState(false);
      this.#contentInstance.clearBoard();
    });

    this.#headerInstance.addOnSidebarUpdateListener(() => {
      const state = this.#sidebarInstance.updateMobileVisibilityState();
      this.#headerInstance.updateSidebarMobileVisibilityState(state);
      this.#headerInstance.updateCompassExpandedState(false);
      this.#contentInstance.updateMobileSectionsVisibilityState(false);
    });

    this.#headerInstance.addOnCompassUpdateListener(() => {
      const state = this.#contentInstance.updateMobileSectionsVisibilityState();
      this.#headerInstance.updateCompassExpandedState(state);
      this.#sidebarInstance.updateMobileVisibilityState(false);
      this.#headerInstance.updateSidebarMobileVisibilityState(false);
    });

    this.#sidebarInstance.addOnSelectedFileUpdate((file) => {
      this.#headerInstance.updateSidebarMobileVisibilityState(false);
      this.#headerInstance.updateCompassVisibilityState(true);
      this.#headerInstance.updateCompassExpandedState(false);
      this.#sidebarInstance.updateMobileVisibilityState(false);
      this.#contentInstance.loadFile(file);
    });

    this.#contentInstance.addOnSelectedSectionListener(() => {
      this.#headerInstance.updateCompassExpandedState(false);
      this.#contentInstance.updateMobileSectionsVisibilityState(false);
    });
  }

  handleAsRedirect(pathName) {
    if (typeof pathName === 'string') {
      let hash;
      if (pathName.indexOf('#') != -1) {
        hash = '#' + pathName.split('#')[1];
        pathName = pathName.split('#')[0];
      }
      this.#chooseRightTab(pathName, hash);
    }
  }
  
  #chooseRightTab(pathName, hash) {
    config.getAvailableCategories().then((ids) => {
      let found = false;

      for(const id of ids) {
        if (decodeURI(pathName).startsWith(utils.parseCategoryUrl(id))) {
          found = true;

          this.#headerInstance.updateActiveTab(id);
          this.#sidebarInstance.loadSidebar(id);

          this.#tryToIndexFilePathFromId(id, pathName, hash);
        }
      }
      
      if (!found) {
        window.history.pushState('', '', '/');
        this.#headerInstance.updateActiveTab('NTgCalls');
        this.#sidebarInstance.loadSidebar('NTgCalls');
      }
    });
  }

  #tryToIndexFilePathFromId(id, pathName, hash) {
    config.getAllFilesListFilesById(id).then((files) => {
      for(const file of files) {
        if (utils.parseCategoryUrl(file) === decodeURI(pathName)) {
          this.#sidebarInstance.updateActiveFile(file);
          this.#contentInstance.loadFile(file, hash);
          break;
        }
      }
    });
  }
}

const homePage = new HomePage();