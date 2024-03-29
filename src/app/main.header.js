class Header {
  onChangeListenerInstance;
  onSidebarUpdateListenerInstance;
  onCompassUpdateListenerInstance;
  onTabsVisibilityUpdateListenerInstance;

  #header;
  #headerMenu;
  #headerExpanded;
  #headerCompass;
  #headerDescription;
  #headerProjectName;
  #headerTitle;
  #fakeHeaderTitle;

  #hasSelectedTab = false;

  constructor() {
    this.onChangeListenerInstance = new ListenerManagerInstance();
    this.onSidebarUpdateListenerInstance = new ListenerManagerInstance();
    this.onCompassUpdateListenerInstance = new ListenerManagerInstance();
    this.onTabsVisibilityUpdateListenerInstance = new ListenerManagerInstance();
  }

  getElement() {
    const headerMenu = document.createElement('div');
    headerMenu.classList.add('menu');
    headerMenu.addEventListener('click', () => {
      if (header.classList.contains('tabs-expanded')) {
        header.classList.remove('tabs-expanded');
        this.onTabsVisibilityUpdateListenerInstance.callAllListeners(false);
      } else if (!this.#hasSelectedTab) {
        header.classList.add('tabs-expanded');
        this.onTabsVisibilityUpdateListenerInstance.callAllListeners(true);
      } else {
        this.onSidebarUpdateListenerInstance.callAllListeners(true);
      }
    });
    headerMenu.appendChild(document.createElement('div'));
    headerMenu.appendChild(document.createElement('div'));
    headerMenu.appendChild(document.createElement('div'));
    this.#headerMenu = headerMenu;

    const headerExpandSidebar = document.createElement('img');
    headerExpandSidebar.classList.add('expand-sidebar');
    headerExpandSidebar.addEventListener('click', () => {
      this.onSidebarUpdateListenerInstance.callAllListeners(false);
    });
    headerExpandSidebar.src = '/src/icons/tablecolumns.svg';
    this.#headerExpanded = headerExpandSidebar;

    const headerIcon = document.createElement('img');
    headerIcon.src = '/src/assets/splash/telegram-logo.svg';
    
    const headerProjectName = document.createElement('div');
    headerProjectName.classList.add('project-name');
    this.#headerProjectName = headerProjectName;
    const headerTitle = document.createElement('div');
    headerTitle.classList.add('title');
    headerTitle.addEventListener('click', () => {
      const state = header.classList.toggle('tabs-expanded');
      this.onTabsVisibilityUpdateListenerInstance.callAllListeners(state);
    });
    headerTitle.appendChild(headerProjectName);
    headerTitle.appendChild(headerIcon);
    this.#headerTitle = headerTitle;
    const fakeHeaderTitle = document.createElement('div');
    fakeHeaderTitle.classList.add('fake-title');
    this.#fakeHeaderTitle = fakeHeaderTitle;

    const headerCompass = document.createElement('img');
    headerCompass.classList.add('header-compass');
    headerCompass.addEventListener('click', () => {
      this.onCompassUpdateListenerInstance.callAllListeners();
    });
    headerCompass.src = '/src/icons/compass.svg';
    this.#headerCompass = headerCompass;

    const headerDescription = document.createElement('div');
    headerDescription.classList.add('description');
    this.#headerDescription = headerDescription;

    const header = document.createElement('div');
    header.classList.add('header');
    header.addEventListener('dblclick', () => {
      document.body.classList.toggle('disable-blur');
    });
    header.appendChild(headerExpandSidebar);
    header.appendChild(headerMenu);
    header.appendChild(headerTitle);
    header.appendChild(fakeHeaderTitle);
    header.appendChild(headerCompass);
    header.appendChild(headerDescription);
    this.#header = header;

    this.#createTabsByConfig();
    this.#appendTitleUpdateOnActiveTabUpdate();

    return header;
  }

  #createTabsByConfig() {
    config.getAvailableCategories().then((ids) => {
      const tabsContainer = this.#generateTabsContainer(ids);

      this.#headerDescription.textContent = '';
      this.#headerDescription.appendChild(tabsContainer);
    });
  }

  #generateTabsContainer(ids, ignoreOnChange = false) {
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('tabs');

    for (const id of ids) {
      tabsContainer.appendChild(this.#createSingleTab(id, ignoreOnChange));
    }

    tabsContainer.style.setProperty('--length', ids.length.toString());

    if (!ignoreOnChange) {
      this.onChangeListenerInstance.addListener({
        callback: (id) => {
          if (ids.indexOf(id) !== -1) {
            tabsContainer.style.setProperty('--id', ids.indexOf(id).toString());
            this.#hasSelectedTab = true;
          }
        },
        isInternal: true,
        ref: tabsContainer
      });
    }

    return tabsContainer;
  }

  #createSingleTab(id, ignoreOnChange) {
    const tab = document.createElement('div');
    tab.classList.add('tab');
    tab.addEventListener('click', () => {
      window.history.pushState('', '', '/' + id);
      this.#globalUpdateActiveTab(id);
    });
    tab.textContent = id;

    if (!ignoreOnChange) {
      this.onChangeListenerInstance.addListener({
        callback: (activeId) => {
          tab.classList.toggle('active', activeId === id);
        },
        isInternal: true,
        ref: tab
      });
    }

    return tab;
  }

  updateActiveTab(id) {
    this.onChangeListenerInstance.callInternalListeners(id);
  }

  #globalUpdateActiveTab(id) {
    this.onChangeListenerInstance.callAllListeners(id);
  }

  updateSidebarMobileVisibilityState(state) {
    this.#headerMenu.classList.toggle('show', state);
  }

  updateSidebarDesktopExpandedState(state) {
    this.#headerExpanded.classList.toggle('show', state);
  }

  updateCompassVisibilityState(state) {
    this.#headerCompass.classList.toggle('visible', state);
  }

  updateCompassExpandedState(state) {
    this.#headerCompass.classList.toggle('show', state);
  }

  updateTabsMobileVisibility(state) {
    this.#header.classList.toggle('tabs-expanded', state);
  }

  #appendTitleUpdateOnActiveTabUpdate() {
    this.onChangeListenerInstance.addListener({
      callback: (id) => {
        if (this.#headerProjectName.textContent === id) {
          return;
        }
  
        document.title = id + ' Documentation';
  
        this.#fakeHeaderTitle.textContent = id;
        const rect = this.#fakeHeaderTitle.getBoundingClientRect();
        this.#headerProjectName.style.setProperty('--width', rect.width.toString() + 'px');

        this.#headerProjectName.classList.add('updating');
        this.#headerProjectName.addEventListener('transitionend', () => {
          this.#headerProjectName.classList.remove('updating');
          this.#headerProjectName.textContent = id;
        }, { once: true });
      },
      isInternal: true
    });
  }

  highlightTabsForSelection() {
    setTimeout(() => {
      tooltip.init({
        title: 'Select your language',
        text: 'You can choose the programming language by pressing here.',
        container: this.#detectContainerForTooltips()
      });
    }, 800);
  }

  highlightTabsForIntroduction() {
    setTimeout(() => {
      tooltip.init({
        title: 'Select your library',
        text: 'When you are ready, you can go to the library documentation of your favorite language by selecting it above.',
        container: this.#detectContainerForTooltips()
      });
    }, 800);
  }

  #detectContainerForTooltips() {
    return (
      window.matchMedia('screen and (max-width: 1330px)').matches
      ? this.#headerTitle : this.#headerDescription
    );
  }
}