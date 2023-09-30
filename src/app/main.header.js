class Header {
  onChangeListenerInstance;
  onSidebarUpdateListenerInstance;
  onCompassUpdateListenerInstance;

  #headerMenu;
  #headerCompass;
  #headerDescription;
  #headerProjectName;
  #fakeHeaderTitle;

  constructor() {
    this.onChangeListenerInstance = new ListenerManagerInstance();
    this.onSidebarUpdateListenerInstance = new ListenerManagerInstance();
    this.onCompassUpdateListenerInstance = new ListenerManagerInstance();
  }

  getElement() {
    const headerMenu = document.createElement('div');
    headerMenu.classList.add('menu');
    headerMenu.addEventListener('click', () => {
      this.onSidebarUpdateListenerInstance.callAllListeners();
    });
    headerMenu.appendChild(document.createElement('div'));
    headerMenu.appendChild(document.createElement('div'));
    headerMenu.appendChild(document.createElement('div'));
    this.#headerMenu = headerMenu;

    const headerIcon = document.createElement('img');
    headerIcon.src = '/src/assets/splash/telegram-logo.svg';
    
    const headerProjectName = document.createElement('div');
    headerProjectName.classList.add('project-name');
    this.#headerProjectName = headerProjectName;
    const headerTitle = document.createElement('div');
    headerTitle.classList.add('title');
    headerTitle.appendChild(headerProjectName);
    headerTitle.appendChild(headerIcon);
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
    header.appendChild(headerMenu);
    header.appendChild(headerTitle);
    header.appendChild(fakeHeaderTitle);
    header.appendChild(headerCompass);
    header.appendChild(headerDescription);

    this.#createTabsByConfig();
    this.#appendTitleUpdateOnActiveTabUpdate();

    setTimeout(() => {
      this.#initTooltip(headerTitle);
    }, 150);

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

    for(const id of ids) {
      tabsContainer.appendChild(this.#createSingleTab(id, ignoreOnChange));
    }

    if (!ignoreOnChange) {
      this.onChangeListenerInstance.addListener({
        callback: (id) => {
          if (ids.indexOf(id) !== -1) {
            tabsContainer.style.setProperty('--id', ids.indexOf(id).toString());
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

  updateCompassVisibilityState(state) {
    this.#headerCompass.classList.toggle('visible', state);
  }

  updateCompassExpandedState(state) {
    this.#headerCompass.classList.toggle('show', state);
  }

  #appendTitleUpdateOnActiveTabUpdate() {
    this.onChangeListenerInstance.addListener({
      callback: (id) => {
        if (this.#headerProjectName.textContent === id) {
          return;
        }
  
        document.title = id + ' Documentation';
  
        if (!this.#headerProjectName.hasChildNodes()) {
          this.#headerProjectName.textContent = id;
  
          const rect = this.#headerProjectName.getBoundingClientRect();
          this.#headerProjectName.style.setProperty('--width', rect.width.toString() + 'px');
        } else {
          this.#fakeHeaderTitle.textContent = id;
          const rect = this.#fakeHeaderTitle.getBoundingClientRect();
          this.#headerProjectName.style.setProperty('--width', rect.width.toString() + 'px');
  
          this.#headerProjectName.classList.add('updating');
          this.#headerProjectName.addEventListener('transitionend', () => {
            this.#headerProjectName.classList.remove('updating');
            this.#headerProjectName.textContent = id;
          }, { once: true });
        }
      },
      isInternal: true
    });
  }

  #initTooltip(element) {
    if (window.innerWidth < 1330) {
      const elementRect = element.getBoundingClientRect();

      let handler;
      if (localStorage.getItem('showSuggestions') !== 'true') {
        localStorage.setItem('showSuggestions', 'true');
        handler = this.#createTooltip(elementRect, document.createTextNode('Click here to select the documentation of your favorite library'));
        setTimeout(() => {
          handler();
        }, 5000);
      }

      let currentHandler = handler;
      
      element.addEventListener('click', (e) => {
        e.stopPropagation();
        currentHandler && currentHandler();

        config.getAvailableCategories().then((ids) => {
          const elementRect = element.getBoundingClientRect();
          const tabsContainer = this.#generateTabsContainer(ids, true);

          currentHandler = this.#createTooltip(elementRect, tabsContainer, true);
        });
      });
    }
  }

  #createTooltip(elementRect, element, hasTabs = false) {
    const tooltipTriangle = document.createElement('div');
    tooltipTriangle.classList.add('triangle');
    const tooltipText = document.createElement('div');
    tooltipText.classList.add('tooltip-text');
    tooltipText.appendChild(element);
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.classList.toggle('has-tabs', hasTabs);
    tooltip.style.setProperty('--center-x', elementRect.left + 'px');
    tooltip.style.setProperty('--center-y', elementRect.top + 'px');
    tooltip.appendChild(tooltipTriangle);
    tooltip.appendChild(tooltipText);

    document.body.appendChild(tooltip);

    const width = tooltip.getBoundingClientRect();
    tooltip.style.setProperty('--center-x', (elementRect.left + elementRect.width / 2 - width.width / 2) + 'px');
    tooltip.classList.add('visible');

    const handler = () => {
      tooltip.classList.add('remove');
      tooltip.addEventListener('animationend', () => {
        tooltip.remove();
      }, { once: true });

      window.removeEventListener('resize', handler);
      document.body.removeEventListener('click', handler);
    };

    window.addEventListener('resize', handler);
    document.body.addEventListener('click', handler);

    return handler;
  }
}

/*
  */