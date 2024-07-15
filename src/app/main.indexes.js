/*
 * Copyright (c) 2020-2024.
 *
 *  The code in this file is part of the PyTgCalls project.
 *  Please refer to official links:
 *  * Repo: https://github.com/pytgcalls
 *  * News: https://t.me/pytgcallsnews
 *  * Chat: https://t.me/pytgcallschat
 *  * Documentation: https://pytgcalls.github.io
 *
 *  We consider these above sources to be the only official
 *  sources for news related to this source code.
 *  With <3 by @kuogi (and the fox!)
 */

import * as config from "./main.config.js";
import * as requestsManager from "./main.requests.js";
import * as debug from "./main.debug.js";
import {tryToReduceTags} from "./main.parser.js";

const AVAILABLE_TYPES = [
  'method', 'class', 'enum', 'type'
];

const SUPPORTED_ELEMENTS = [
    'TEXT', 'H1', 'H2', 'H3',
    'CATEGORY-TITLE', 'SUBTITLE', 'SUBTEXT'
];

let hasIndexed = false;
let isCurrentlyIndexing = false;
let indexes = {};
let indexes_caching = {};

function initFull() {
  if (hasIndexed) {
    return Promise.resolve();
  } else if (isCurrentlyIndexing) {
    return Promise.reject();
  }

  isCurrentlyIndexing = true;

  return new Promise((resolve) => {
    config.loadConfig().then(() => {
      requestsManager.initRequest('/map.json').then((data) => {
        if (!(data instanceof String)) {
          return;
        }

        try {
          const parsed = JSON.parse(data);

          for (const file in parsed) {
            indexes[file] = parseFile(parsed[file]);
            indexes_caching[file] = parsed[file];
          }

          isCurrentlyIndexing = false;
          hasIndexed = true;
          resolve();
        } catch (e) {
          console.error(e);
        }
      });
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
  indexes[file] = parseFile(data);
  indexes_caching[file] = data;
}

function parseFile(fileContent) {
  let fileIndexes = [];

  try {
    const domHelper = new DOMParser();
    const dom = domHelper.parseFromString(fileContent, 'application/xml');
    const classyElements = dom.querySelectorAll('page *');

    for (const element of classyElements) {
      if (element.hasAttribute('src')) {
        const elementType = element.getAttribute('src');
        if (AVAILABLE_TYPES.includes(elementType)) {
          tryToReduceTags(element);
          fileIndexes.push(new FileIndex(elementType, element.textContent));
        }
      }

      if (SUPPORTED_ELEMENTS.includes(element.tagName.toUpperCase())) {
        tryToReduceTags(element);

        const elementIndex = new ElementIndex(element);

        if (element.previousElementSibling instanceof Element && SUPPORTED_ELEMENTS.includes(element.previousElementSibling.tagName.toUpperCase())) {
          const preChunk = element.previousElementSibling;
          tryToReduceTags(preChunk);
          elementIndex.prependToChunk(preChunk);
        }

        if (element.nextElementSibling instanceof Element && SUPPORTED_ELEMENTS.includes(element.nextElementSibling.tagName.toUpperCase())) {
          const postChunk = element.nextElementSibling;
          tryToReduceTags(postChunk);
          elementIndex.addToChunk(postChunk);
        }

        fileIndexes.push(elementIndex);
      }
    }
  } catch (e) {
    console.error(e);
  }

  return fileIndexes;
}

function getAllIndexedFiles() {
  return Object.keys(indexes);
}

class ElementIndex {
  #chunk;
  #main;

  constructor(element) {
    this.#chunk = [element];
    this.#main = element;
  }

  getMainElement() {
    return this.#main;
  }

  addToChunk(element) {
    this.#chunk.push(element);
  }

  prependToChunk(element) {
    this.#chunk = [
        element,
        ...this.#chunk
    ];
  }

  getChunk() {
    return this.#chunk;
  }
}

class FileIndex {
  #type;
  #name;

  constructor(type, name) {
    this.#type = type;
    this.#name = name;
  }

  getType() {
    return this.#type;
  }

  getName() {
    return this.#name;
  }
}

export {
  hasIndexed,
  isCurrentlyIndexing,
  initFull,
  clearFullFromDebug,
  getIndexedValue,
  getFullIndexedValue,
  saveAsFullIndexedValue,
  getAllIndexedFiles,
  FileIndex,
  ElementIndex,
}