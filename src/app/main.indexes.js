import * as config from "./main.config.js";
import * as requestsManager from "./main.requests.js";
import * as sourceParser from "./main.parser.js";
import * as debug from "./main.debug.js";

let hasIndexed = false;
let isCurrentlyIndexing = false;
let indexes = {};
let indexes_caching = {};

function initFull(callback) {
  if (hasIndexed) {
    return Promise.resolve();
  } else if (isCurrentlyIndexing) {
    return Promise.reject();
  }

  const hasCallback = typeof callback === 'function';

  return new Promise((resolve) => {
    isCurrentlyIndexing = true;
    hasCallback && callback(0, 0);

    let i = 0;

    config.getAllFilesListFiles().then((files) => {
      hasCallback && callback(0, files.length);

      const handleIndexingWithResponse = (i, file, response, status) => {
        hasCallback && callback(i, files.length);

        if (status === 200) {
          indexes[file] = sourceParser.handleSearchIndexByText(response);
          indexes_caching[file] = response;
        }

        if (i === files.length) {
          isCurrentlyIndexing = false;
          hasIndexed = true;
          resolve();
        }
      };

      // TODO: wait for animationend event
      setTimeout(() => {
        for (const file of files) {
          if (indexes_caching[file]) {
            i++;
            handleIndexingWithResponse(i, file, indexes_caching[file], 200);
          } else {
            requestsManager.initRequest(file).then((data) => {
              i++;
              handleIndexingWithResponse(i, file, data, 200);
            }).catch(() => {
              i++;
              handleIndexingWithResponse(i, file, undefined, 500);
            });
          }
        }
      }, 700);
    });
  });
}

function clearFullFromDebug() {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  hasIndexed = false;
  isCurrentlyIndexing = false;
  indexes = {};
  indexes_caching = {};
}

function getIndexedValue(file) {
  return indexes[file];
}

function getFullIndexedValue(file) {
  return indexes_caching[file];
}

function saveAsFullIndexedValue(file, data) {
  indexes_caching[file] = data;
}

export {
  hasIndexed,
  isCurrentlyIndexing,
  initFull,
  clearFullFromDebug,
  getIndexedValue,
  getFullIndexedValue,
  saveAsFullIndexedValue,
}