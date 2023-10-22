class RequestsManager {
  #doesLoadViaUserContentWork = true;

  initRequest(fileName) {
    return new Promise((resolve, reject) => {
      const userContentPromise = this.#tryToLoadWithUserContent(fileName);
      userContentPromise.then(resolve);
      userContentPromise.catch(() => {
        this.#doesLoadViaUserContentWork = false;

        const apiPromise = this.#tryToLoadWithApi(fileName);
        apiPromise.then(resolve);
        apiPromise.catch(reject);
      });
    });
  }

  
  #tryToLoadWithUserContent(fileName) {
    if (!this.#doesLoadViaUserContentWork) {
      return Promise.reject('Ignoring githubusercontent as it isnt available');
    } else {
      return new Promise((resolve, reject) => {
        const XML = new XMLHttpRequest();
        XML.timeout = 3500;
        XML.open('GET', 'https://raw.githubusercontent.com/pytgcalls/docsdata/master/' + fileName, true);
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

  #tryToLoadWithApi(fileName) {
    return new Promise((resolve, reject) => {
      const XML = new XMLHttpRequest();
      XML.open('GET', 'https://api.github.com/repos/pytgcalls/docsdata/contents/' + fileName, true);
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
}

const requestsManager = new RequestsManager();