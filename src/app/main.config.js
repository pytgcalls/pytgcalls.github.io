class Config {
  #precachedConfig;

  loadConfig() {
    if (this.isConfigReady()) {
      return Promise.resolve(this.#precachedConfig);
    } else {
      return new Promise((resolve) => {
        const configPromise = requestsManager.initRequest('config.xml');

        configPromise.then((response) => {
          this.#precachedConfig = response;
          resolve(response);
        });

        configPromise.catch(() => {
          alert("This documentation isn't available in your country");
        });
      });
    }
  }

  setAsConfig(text) {
    if (!debug.isSafeToUseDebugItems()) {
      return;
    }

    this.#precachedConfig = text;
  }

  resetConfigByDebug() {
    if (!debug.isSafeToUseDebugItems()) {
      return;
    }

    this.#precachedConfig = undefined;
  }

  isConfigReady() {
    return typeof this.#precachedConfig != 'undefined';
  }

  getTeamMembers() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const teamMembers = dom.querySelectorAll('team > member');

        resolve(teamMembers);
      });
    });
  }

  getOwnerData() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const teamMember = dom.querySelector('homepage-config > team > member[owner="true"]');

        resolve(teamMember);
      });
    });
  }

  getOwnerCitation() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const citationValue = dom.querySelector('homepage-config > citation > value');

        resolve(citationValue);
      });
    });
  }

  getNumericPresPoints() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const presentationPoints = dom.querySelectorAll('homepage-config > numeric-pres-points > item');

        resolve(presentationPoints);
      });
    });
  }

  getHomePagePresFiles() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const presFiles = dom.querySelectorAll('homepage-config > pres-items > file');

        resolve(presFiles);
      });
    });
  }

  getFooterCategories() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const presFiles = dom.querySelectorAll('homepage-config > footer-links > category');

        resolve(presFiles);
      });
    });
  }

  getFooterGrouplink() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const presFiles = dom.querySelector('homepage-config > footer-links > main-group-channel');

        resolve(presFiles);
      });
    });
  }

  getFooterChannelLink() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const presFiles = dom.querySelector('homepage-config > footer-links > main-news-channel');

        resolve(presFiles);
      });
    });
  }

  getFooterDescription() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const presFiles = dom.querySelector('homepage-config > footer-links > dsc');

        resolve(presFiles);
      });
    });
  }

  getAvailableCategories() {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const filesListElements = dom.querySelectorAll('config > files-list');

        let finalList = [];
        for (const element of filesListElements) {
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
        for (const element of filesListElements) {
          finalList.push(this.#getFullPathByFileElement(element));
        }

        resolve(finalList);
      });
    });
  }

  getTheNextFileAfter(fileName) {
    return new Promise((resolve, reject) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const filesListElementsGlobal = dom.querySelectorAll('config > files-list file');

        let detectedId;
        for (const file of filesListElementsGlobal) {
          if (this.#getFullPathByFileElement(file) == fileName) {
            detectedId = file.parentElement;

            if (detectedId.tagName.toUpperCase() === 'GROUP') {
              detectedId = detectedId.parentElement;
            }

            break;
          }
        }

        if (typeof detectedId == 'undefined') {
          reject('dcid not found');
        } else {
          const filesListElements = detectedId.querySelectorAll('file');

          let nextFile, previousFile, previousStateFile;
          let found = false;
          for (const file of filesListElements) {
            const finalText = this.#getFullPathByFileElement(file);

            if (typeof nextFile == 'undefined') {
              if (found) {
                nextFile = finalText;
              } else if (finalText == fileName) {
                found = true;
              }
            }

            if (typeof previousFile == 'undefined') {
              if (finalText == fileName && typeof previousStateFile != 'undefined') {
                previousFile = previousStateFile;
              } else {
                previousStateFile = finalText;
              }
            }
          }

          if (typeof nextFile == 'undefined' && typeof previousFile == 'undefined') {
            reject('path not found');
          } else {
            resolve({
              previousFile,
              nextFile,
              basePath: detectedId.hasAttribute('basepath') ? detectedId.getAttribute('basepath') : ''
            });
          }
        }
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
        for (const element of filesListElements) {
          let finalText = '';
          if (element.parentElement.hasAttribute('basepath')) {
            finalText = element.parentElement.getAttribute('basepath');
          }
          finalText += element.textContent;
          finalList.push(finalText);
        }

        resolve(finalList);
      });
    });
  }

  getFilesListDefaultFileById(id) {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const filesListElement = dom.querySelector('config > files-list[id="' + id + '"]');

        if (filesListElement && filesListElement.hasAttribute('defaultfile')) {
          let fullPath = filesListElement.getAttribute('defaultfile');
          if (filesListElement.hasAttribute('basepath')) {
            fullPath = filesListElement.getAttribute('basepath') + fullPath;
          }

          resolve(fullPath);
        } else {
          resolve();
        }
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
      return dom.querySelector('config > option[id="' + id + '"]');
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

  #getFullPathByFileElement(file) {
    let finalText = '';
    if (file.parentElement.hasAttribute('basepath')) {
      finalText = file.parentElement.getAttribute('basepath');
    }
    finalText += file.textContent;
    return finalText;
  }

  getRedirectDataForPath(path) {
    return new Promise((resolve) => {
      this.loadConfig().then((config) => {
        const domHelper = new DOMParser();
        const dom = domHelper.parseFromString(config, 'application/xml');
        const redirectTo = dom.querySelector('config > redirects > redirect[path="' + path.toLowerCase() + '"]');

        resolve(redirectTo && redirectTo.textContent);
      });
    });
  }
}

const config = new Config();