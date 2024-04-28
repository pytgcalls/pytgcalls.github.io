import * as requestsManager from "./main.requests.js";
import * as debug from "./main.debug.js";

let precachedConfig;

function loadConfig() {
  if (isConfigReady()) {
    return Promise.resolve(precachedConfig);
  } else {
    return new Promise((resolve) => {
      const configPromise = requestsManager.initRequest('config.xml');

      configPromise.then((response) => {
        precachedConfig = response;
        resolve(response);
      });

      configPromise.catch(() => {
        alert("This documentation isn't available in your country");
      });
    });
  }
}

function setAsConfig(text) {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  precachedConfig = text;
}

function resetConfigByDebug() {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  precachedConfig = undefined;
}

function isConfigReady() {
  return typeof precachedConfig != 'undefined';
}

function getTeamMembers() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const teamMembers = dom.querySelectorAll('team > member');

      resolve(teamMembers);
    });
  });
}

function getOwnerData() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const teamMember = dom.querySelector('homepage-config > team > member[owner="true"]');

      resolve(teamMember);
    });
  });
}

function getOwnerCitation() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const citationValue = dom.querySelector('homepage-config > citation > value');

      resolve(citationValue);
    });
  });
}

function getNumericPresPoints() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const presentationPoints = dom.querySelectorAll('homepage-config > numeric-pres-points > item');

      resolve(presentationPoints);
    });
  });
}

function getHomePagePresFiles() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const presFiles = dom.querySelectorAll('homepage-config > pres-items > file');

      resolve(presFiles);
    });
  });
}

function getFooterCategories() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const presFiles = dom.querySelectorAll('homepage-config > footer-links > category');

      resolve(presFiles);
    });
  });
}

function getFooterContributionLink() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const presFiles = dom.querySelector('homepage-config > footer-links > contribution-link');

      resolve(presFiles);
    });
  });
}

function getFooterDescription() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const presFiles = dom.querySelector('homepage-config > footer-links > dsc');

      resolve(presFiles);
    });
  });
}

function getAvailableCategories() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
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

function getAllFilesListFiles() {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const filesListElements = dom.querySelectorAll('config > files-list file');

      let finalList = [];
      for (const element of filesListElements) {
        finalList.push(getFullPathByFileElement(element));
      }

      resolve(finalList);
    });
  });
}

function getTheNextFileAfter(fileName) {
  return new Promise((resolve, reject) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const filesListElementsGlobal = dom.querySelectorAll('config > files-list file');

      let detectedId;
      for (const file of filesListElementsGlobal) {
        if (getFullPathByFileElement(file) === fileName) {
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
          const finalText = getFullPathByFileElement(file);

          if (typeof nextFile == 'undefined') {
            if (found) {
              nextFile = finalText;
            } else if (finalText === fileName) {
              found = true;
            }
          }

          if (typeof previousFile == 'undefined') {
            if (finalText === fileName && typeof previousStateFile != 'undefined') {
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

function getAllFilesListFilesById(id) {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
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

function getFilesListDefaultFileById(id) {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
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

function getFilesListInstanceById(id) {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const filesListElements = dom.querySelector('config > files-list[id="' + id + '"]');

      resolve(filesListElements);
    });
  });
}

function getOptionValueByIdSync(id) {
  if (isConfigReady()) {
    const domHelper = new DOMParser();
    const dom = domHelper.parseFromString(precachedConfig, 'application/xml');
    return dom.querySelector('config > option[id="' + id + '"]');
  }

  return null;
}

function isComplexOptionValueByIdSync(id) {
  if (isConfigReady()) {
    const child = getOptionValueByIdSync(id);
    if (child) {
      return child.childElementCount || !(child.firstChild instanceof Text);
    }
  }

  return false;
}

function getFullPathByFileElement(file) {
  let finalText = '';
  if (file.parentElement.hasAttribute('basepath')) {
    finalText = file.parentElement.getAttribute('basepath');
  }
  finalText += file.textContent;
  return finalText;
}

function getRedirectDataForPath(path) {
  return new Promise((resolve) => {
    loadConfig().then((config) => {
      const domHelper = new DOMParser();
      const dom = domHelper.parseFromString(config, 'application/xml');
      const redirectTo = dom.querySelector('config > redirects > redirect[path="' + path.toLowerCase() + '"]');

      resolve(redirectTo && redirectTo.textContent);
    });
  });
}

export {
    loadConfig,
    setAsConfig,
    resetConfigByDebug,
    isConfigReady,
    getTeamMembers,
    getOwnerData,
    getOwnerCitation,
    getNumericPresPoints,
    getHomePagePresFiles,
    getFooterCategories,
    getFooterContributionLink,
    getFooterDescription,
    getAvailableCategories,
    getAllFilesListFiles,
    getTheNextFileAfter,
    getAllFilesListFilesById,
    getFilesListDefaultFileById,
    getFilesListInstanceById,
    getOptionValueByIdSync,
    isComplexOptionValueByIdSync,
    getRedirectDataForPath
};