class RequestsManager {
  #doesLoadViaUserContentWork = true;

  #pypiDataPromise;
  #pypiDataResult;

  initRequest(fileName, repoName = 'pytgcalls/docsdata') {
    return new Promise((resolve, reject) => {
      this.#tryToLoadWithUserContent(repoName, fileName).then(resolve).catch(() => {
        this.#doesLoadViaUserContentWork = false;
        this.#tryToLoadWithApi(repoName, fileName).then(resolve).catch(reject);
      });
    });
  }

  
  #tryToLoadWithUserContent(repoName, fileName) {
    if (!this.#doesLoadViaUserContentWork) {
      return Promise.reject('Ignoring githubusercontent as it isnt available');
    } else {
      return new Promise((resolve, reject) => {
        const XML = new XMLHttpRequest();
        XML.timeout = 3500;
        XML.open('GET', 'https://raw.githubusercontent.com/' + repoName + '/master/' + fileName, true);
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

  #tryToLoadWithApi(repoName, fileName) {
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

  retrievePackageData() {
    if (typeof this.#pypiDataResult != 'undefined') {
      return Promise.resolve(this.#pypiDataResult);
    } else if (typeof this.#pypiDataPromise != 'undefined') {
      return this.#pypiDataPromise;
    } else {
      this.#pypiDataPromise = new Promise((resolve, reject) => {
        const packageName = config.getOptionValueByIdSync('PYPI_PACKAGE');
        if (!packageName) {
          throw new Error('PYPI_PACKAGE isnt\'t a valid config option');
        }

        const XML = new XMLHttpRequest();
        XML.open('GET', 'https://pypi.org/pypi/' + packageName.textContent + '/json', true);
        XML.send();
        XML.addEventListener('readystatechange', (e) => {
          if (e.target.readyState === 4) {
            if (e.target.status === 200) {
              const response = JSON.parse(e.target.responseText);
              if (typeof response['info'] === 'object') {
                this.#pypiDataResult = response;
                this.#pypiDataPromise = undefined;
                resolve(this.#pypiDataResult);
              } else {
                reject('Failed to parse pypi api response');
              }
            } else {
              reject('Failed to get data from pypi api');
            }
          }
        });
      });
      return this.#pypiDataPromise;
    }
  }
}

const requestsManager = new RequestsManager();
