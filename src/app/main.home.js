class HomePage {
  #COLORS = ['red', 'green', 'blue', 'yellow'];
  
  #headerInstance;
  #sidebarInstance;
  #contentInstance;
  #introductionInstance;

  init(pathName) {
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
      if (typeof pathName === 'string' && pathName.length) {
        this.#chooseRightTab(pathName, window.location.hash);
      } else {
        this.#introductionInstance.show();
        //this.#headerInstance.updateActiveTab('NTgCalls');
        //this.#sidebarInstance.loadSidebar('NTgCalls');
      }  
    });

    this.#introductionInstance.onVisibilityUpdateListenerInstance.addListener({
      callback: (state) => {
        pageContainer.classList.toggle('as-home', state);
      }
    });

    this.#headerInstance.onChangeListenerInstance.addListener({
      callback: (id) => {
        this.#introductionInstance.hide();

        const promise = this.#sidebarInstance.loadSidebar(id);
        this.#sidebarInstance.focusOnSidebar();
        this.#headerInstance.updateCompassVisibilityState(false);
        this.#headerInstance.updateCompassExpandedState(false);
        this.#contentInstance.clearBoard();
  
        config.getFilesListDefaultFileById(id).then((file) => {
          if (typeof file == 'string') {
            this.#updateLoadedFile(file, null, promise);
          }
        });
      }
    });

    this.#headerInstance.onSidebarUpdateListenerInstance.addListener({
      callback: () => {
        const state = this.#sidebarInstance.updateMobileVisibilityState();
        this.#headerInstance.updateSidebarMobileVisibilityState(state);
        this.#headerInstance.updateCompassExpandedState(false);
        this.#contentInstance.updateMobileSectionsVisibilityState(false);
      }
    });

    this.#headerInstance.onCompassUpdateListenerInstance.addListener({
      callback: () => {
        const state = this.#contentInstance.updateMobileSectionsVisibilityState();
        this.#headerInstance.updateCompassExpandedState(state);
        this.#sidebarInstance.updateMobileVisibilityState(false);
        this.#headerInstance.updateSidebarMobileVisibilityState(false);
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
      let hash;
      if (pathName.indexOf('#') !== -1) {
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
          const promise = this.#sidebarInstance.loadSidebar(id);

          this.#tryToIndexFilePathFromId(id, pathName, hash, promise);
        }
      }
      
      if (!found) {
        window.history.pushState('', '', '/');
        this.#introductionInstance.show();
      }
    });
  }

  #tryToIndexFilePathFromId(id, pathName, hash, updateActiveFilePromise) {
    config.getAllFilesListFilesById(id).then((files) => {
      let found = false;

      for(const file of files) {
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

    this.#contentInstance.loadFile(file, hash);
  }
}

const homePage = new HomePage();