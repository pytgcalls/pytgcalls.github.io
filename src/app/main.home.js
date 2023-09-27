class HomePage {
  #headerInstance;
  #sidebarInstance;
  #contentInstance;

  init() {
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

    requestAnimationFrame(() => {
      this.#headerInstance.updateActiveTab('NTgCalls');
      this.#sidebarInstance.loadSidebar('NTgCalls');
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
      console.log('arg');
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
}

const homePage = new HomePage();