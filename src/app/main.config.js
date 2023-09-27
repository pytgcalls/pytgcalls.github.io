class Config {
  #precachedConfig;

  loadConfig() {
    if (this.isConfigReady()) {
      return Promise.resolve(this.#precachedConfig);
    } else {
      return new Promise((resolve) => {
        const XML = new XMLHttpRequest();
        XML.open('GET', 'https://raw.githubusercontent.com/pytgcalls/docsdata/master/config.xml?cache='+String(Math.random()), true);
        XML.send();
        XML.addEventListener('readystatechange', (e) => {
          if (e.target.readyState === 4 && e.target.status === 200) {
            this.#precachedConfig = e.target.response;
            resolve(this.#precachedConfig);
          }
        });
      });
    }
  }

  isConfigReady() {
    return typeof this.#precachedConfig != 'undefined';
  }

  getAvailableCategories() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const filesListElements = dom.querySelectorAll('config > files-list');

        let finalList = [];
        for(const element of filesListElements) {
          if (element.hasAttribute('id')) {
            finalList.push(element.getAttribute('id'));
          }
        }
    
        resolve(finalList);
      });
    });
  }

  getAllFilesListFiles() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const filesListElements = dom.querySelectorAll('config > files-list file');

        let finalList = [];
        for(const element of filesListElements) {
          let finalText = '';
          if (element.parentNode.hasAttribute('basepath')) {
            finalText = element.parentNode.getAttribute('basepath');
          }
          finalText += element.textContent;
          finalList.push(finalText);
        }
    
        resolve(finalList);
      });
    });
  }

  getAllFilesListFilesById(id) {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const filesListElements = dom.querySelectorAll('config > files-list[id="' + id + '"] file');

        let finalList = [];
        for(const element of filesListElements) {
          let finalText = '';
          if (element.parentNode.hasAttribute('basepath')) {
            finalText = element.parentNode.getAttribute('basepath');
          }
          finalText += element.textContent;
          finalList.push(finalText);
        }
    
        resolve(finalList);
      });
    });
  }

  getFilesListInstanceById(id) {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const filesListElements = dom.querySelector('config > files-list[id="' + id + '"]');
    
        resolve(filesListElements);
      });
    });
  }

  getOptionValueByIdSync(id) {
    if (this.isConfigReady()) {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(this.#precachedConfig, 'application/xml');
      const optionElement = dom.querySelector('config > option[id="' + id + '"]');

      return optionElement;
    }

    return null;
  }

  isComplexOptionValueByIdSync(id) {
    if (this.isConfigReady()) {
      const child = this.getOptionValueByIdSync(id);
      if (child) {
        return child.childElementCount || !(child.firstChild instanceof Text);
      }
    }
    
    return false;
  }
}

var config = new Config();