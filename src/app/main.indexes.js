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

import * as requestsManager from "./main.requests.js";
import * as debug from "./main.debug.js";
import {tryToReduceTags} from "./main.parser.js";
import {loadConfig} from "./main.config.js";

const AVAILABLE_TYPES = [
  'method', 'class', 'enum', 'type'
];

const SUPPORTED_ELEMENTS = [
    'TEXT', 'H1', 'H2', 'H3',
    'CATEGORY-TITLE', 'SUBTITLE', 'SUBTEXT'
];

export let hasIndexed = false;
export let isCurrentlyIndexing = false;
let indexes = {};
let indexes_caching = {};

export async function initFull() {
  if (hasIndexed) {
    return Promise.resolve();
  } else if (isCurrentlyIndexing) {
    return Promise.reject();
  }

  isCurrentlyIndexing = true;
  await loadConfig();
  let data = JSON.parse(await requestsManager.initRequest('/map.json'));
  for (const file in data) {
    indexes[file] = parseFile(file, data[file]);
    indexes_caching[file] = data[file];
  }
  isCurrentlyIndexing = false;
  hasIndexed = true;
  return Promise.resolve();
}

export function clearFullFromDebug() {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  hasIndexed = false;
  isCurrentlyIndexing = false;
  indexes = {};
  indexes_caching = {};
}

export function getIndexedValue(file) {
  return indexes[file];
}

export function getFullIndexedValue(file) {
  return indexes_caching[file];
}

export function saveAsFullIndexedValue(file, data) {
  indexes[file] = parseFile(file, data);
  indexes_caching[file] = data;
}

function parseFile(filePath, fileContent) {
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
          fileIndexes.push(new FileIndex(elementType, element.textContent, filePath));
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

export function getAllIndexedFiles() {
  return Object.keys(indexes);
}

export class ElementIndex {
  #chunk;
  #main;

  constructor(element) {
    this.#chunk = [element];
    this.#main = element;
  }

  get mainElement() {
    return this.#main;
  }

  get chunk() {
    return this.#chunk;
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
}

export class FileIndex {
  #type;
  #name;
  #filePath;

  constructor(type, name, filePath) {
    this.#type = type;
    this.#name = name;
    this.#filePath = filePath;
  }

  get type() {
    return this.#type;
  }

  get name() {
    return this.#name;
  }

  get filePath() {
    return this.#filePath;
  }
}