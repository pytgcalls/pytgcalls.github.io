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
      this.#contentInstance.clearBoard();
    });

    this.#sidebarInstance.addOnSelectedFileUpdate((file) => {
      this.#contentInstance.loadFile(file);
    });
  }
}

const homePage = new HomePage();