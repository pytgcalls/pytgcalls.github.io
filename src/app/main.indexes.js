class IndexesManager {
  #hasIndexed = false;
  #isCurrentlyIndexing = false;
  #indexes = {};
  #indexes_caching = {};

  initFull(callback) {
    if (this.#hasIndexed) {
      return Promise.resolve();
    } else if (this.#isCurrentlyIndexing) {
      return Promise.reject();
    }

    const hasCallback = typeof callback === 'function';

    return new Promise((resolve) => {
      this.#isCurrentlyIndexing = true;
      hasCallback && callback(0, 0);

      let i = 0;

      config.getAllFilesListFiles().then((files) => {
        hasCallback && callback(0, files.length);

        const handleIndexingWithResponse = (i, file, response, status) => {
          hasCallback && callback(i, files.length);

          if (status === 200) {
            this.#indexes[file] = sourceParser.handleSearchIndexByText(response);
            this.#indexes_caching[file] = response;
          }

          if (i === files.length) {
            this.#isCurrentlyIndexing = false;
            this.#hasIndexed = true;
            resolve();
          }
        };

        // TODO: wait for animationend event
        setTimeout(() => {
          for (const file of files) {
            if (this.#indexes_caching[file]) {
              i++;
              handleIndexingWithResponse(i, file, this.#indexes_caching[file], 200);
            } else {
              requestsManager.initRequest(file).then((data) => {
                i++;
                handleIndexingWithResponse(i, file, data, 200);
              }).catch(() => {
                i++;
                handleIndexingWithResponse(i, file, data, 500);
              });
            }
          }
        }, 700);
      });
    });
  }

  clearFullFromDebug() {
    if (!debug.isSafeToUseDebugItems()) {
      return;
    }

    this.#hasIndexed = false;
    this.#isCurrentlyIndexing = false;
    this.#indexes = {};
    this.#indexes_caching = {};
  }

  hasIndexed() {
    return this.#hasIndexed;
  }

  isCurrentlyIndexing() {
    return this.#isCurrentlyIndexing;
  }

  getIndexedValue(file) {
    return this.#indexes[file];
  }

  getFullIndexedValue(file) {
    return this.#indexes_caching[file];
  }

  saveAsFullIndexedValue(file, data) {
    this.#indexes_caching[file] = data;
  }
}

const indexesManager = new IndexesManager();