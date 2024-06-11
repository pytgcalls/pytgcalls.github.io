import * as debug from "./main.debug.js";
import * as config from "./main.config.js";

let doesLoadViaUserContentWork = true;

let pypiDataPromise;
let pypiDataResult;

let alternativesList = {};

function initRequest(fileName, repoName = 'pytgcalls/docsdata') {
  return new Promise((resolve, reject) => {
    const isUsingAnAlternative = !!alternativesList[repoName];
    tryToLoadWithUserContent(repoName, fileName).then(resolve).catch(() => {
      doesLoadViaUserContentWork = false;

      if (isUsingAnAlternative) {
        alert("Connection to your custom docsdata server failed! We're using GitHub as fallback. Check your port.");
      }

      tryToLoadWithApi(repoName, fileName).then(resolve).catch(reject);
    });
  });
}

function setAsDebugAlternative(original, alternative) {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  alternativesList[original] = alternative;
  doesLoadViaUserContentWork = true;
}

function tryToLoadWithUserContent(repoName, fileName) {
  if (!doesLoadViaUserContentWork) {
    return Promise.reject('Ignoring githubusercontent as it isn\'t available');
  } else {
    return new Promise((resolve, reject) => {
      let completeUrl = 'https://raw.githubusercontent.com/' + repoName + '/master/' + fileName;
      if (alternativesList[repoName]) {
        completeUrl = alternativesList[repoName] + '/' + fileName;
      }

      const XML = new XMLHttpRequest();
      XML.timeout = 3500;
      XML.open('GET', completeUrl, true);
      XML.send();
      XML.addEventListener('readystatechange', (e) => {
        if (e.target.readyState === 4) {
          if (e.target.status === 200) {
            resolve(e.target.response);
          } else {
            reject('Unable to resolve domain via githubusercontent');
          }
        }
      });
    });
  }
}

function tryToLoadWithApi(repoName, fileName) {
  return new Promise((resolve, reject) => {
    const XML = new XMLHttpRequest();
    XML.open('GET', 'https://api.github.com/repos/' + repoName + '/contents/' + fileName, true);
    XML.send();
    XML.addEventListener('readystatechange', (e) => {
      if (e.target.readyState === 4) {
        if (e.target.status === 200) {
          const response = JSON.parse(e.target.responseText);
          if (typeof response['content'] === 'string' && response['content'].length > 0) {
            resolve(atob(response['content']));
          } else {
            reject('Failed to parse github api response');
          }
        } else {
          reject('Failed to get data from github api');
        }
      }
    });
  });
}

function retrievePackageData() {
  if (typeof pypiDataResult != 'undefined') {
    return Promise.resolve(pypiDataResult);
  } else if (typeof pypiDataPromise != 'undefined') {
    return pypiDataPromise;
  } else {
    pypiDataPromise = new Promise((resolve, reject) => {
      const packageName = config.getOptionValueByIdSync('PYPI_PACKAGE');
      if (!packageName) {
        throw new Error('PYPI_PACKAGE isn\'t a valid config option');
      }

      const XML = new XMLHttpRequest();
      XML.open('GET', 'https://pypi.org/pypi/' + packageName.textContent + '/json', true);
      XML.send();
      XML.addEventListener('readystatechange', (e) => {
        if (e.target.readyState === 4) {
          if (e.target.status === 200) {
            const response = JSON.parse(e.target.responseText);
            if (typeof response['info'] === 'object') {
              pypiDataResult = response;
              pypiDataPromise = undefined;
              resolve(pypiDataResult);
            } else {
              reject('Failed to parse pypi api response');
            }
          } else {
            reject('Failed to get data from pypi api');
          }
        }
      });
    });
    return pypiDataPromise;
  }
}

export {
  initRequest,
  setAsDebugAlternative,
  retrievePackageData
};