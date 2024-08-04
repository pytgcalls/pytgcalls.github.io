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

import * as utils from "./main.utils.js";
import ListenerManagerInstance from "./main.listener.js";
import * as iconsManager from "./main.icons.js";
import * as config from "./main.config.js";
import {getLibraryElement} from "./main.header.js";

export const onChangeListenerInstance = new ListenerManagerInstance();

let leftContainer;
let leftSidebar;
let sidebarSticky;

let searchResults;
let searchInputText;

let currentLoadedSidebarId;
let hasLoaded = false;

export function getElement() {
  const leftSidebarElement = document.createElement('div');
  leftSidebarElement.classList.add('left-sidebar', 'expanded');
  leftSidebar = leftSidebarElement;

  const leftContainerElement = document.createElement('div');
  leftContainerElement.classList.add('left-container');
  leftContainerElement.appendChild(leftSidebarElement);
  leftContainer = leftContainerElement;

  return leftContainerElement;
}

export function focusOnSidebar() {
  leftContainer.classList.remove('collapsed');
}

export function updateMobileVisibilityState(forcedState) {
  focusOnSidebar();
  return leftContainer.classList.toggle('show', forcedState);
}

export function updateDesktopCollapsedState(isCollapsed) {
  return leftContainer.classList.toggle('collapsed', isCollapsed);
}

export function loadSidebar(id) {
  if (currentLoadedSidebarId === id) {
    return Promise.resolve();
  }

  const promise = getPromiseBeforeLoadSidebar();

  promise.then(() => {
    hasLoaded = true;

    const content = leftSidebar;
    content.textContent = '';

    const libraryContainer = document.createElement('div');
    libraryContainer.classList.add('library-container');
    libraryContainer.appendChild(getLibraryElement(true).element);
    content.appendChild(libraryContainer);

    currentLoadedSidebarId = id;

    config.getFilesListInstanceById(id).then((child) => {
      const fragment = document.createDocumentFragment();
      const basePathForMainFiles = child.getAttribute('basepath');

      let i = 0;
      for (const file of child.childNodes) {
        if (file instanceof Element) {
          i++;

          switch (file.tagName.toUpperCase()) {
            case 'FILE':
              if (file.textContent !== '.xml' && file.textContent.endsWith('.xml')) {
                fragment.append(handleSidebarFile(file, i, basePathForMainFiles));
              }
              break;
            case 'MICROTAG':
              if (file.textContent.length) {
                fragment.append(handleSidebarMicrotag(file, i));
              }
              break;
            case 'GROUP':
              const groupFilesList = file.querySelectorAll('file');
              if (groupFilesList.length) {
                const basePathForGroupFiles = file.getAttribute('basepath');

                if (!basePathForGroupFiles) {
                  throw new Error("group elements require a basepath");
                } else {
                  fragment.append(handleSidebarGroup(i, basePathForMainFiles, basePathForGroupFiles, groupFilesList));
                }
              }
              break;
          }
        }
      }

      content.appendChild(fragment);
    });
  });

  return promise;
}

function getPromiseBeforeLoadSidebar() {
  if (!hasLoaded) {
    return Promise.resolve();
  } else {
    return new Promise((resolve) => {
      leftSidebar.classList.add('faster');
      leftSidebar.classList.add('disappear');
      leftSidebar.lastChild.addEventListener('animationend', () => {
        leftSidebar.classList.remove('disappear');
        resolve();
      }, { once: true });
    });
  }
}

function handleSidebarFile(file, i, basePathForMainFiles) {
  const fullPath = basePathForMainFiles ? (basePathForMainFiles + file.textContent) : undefined;

  return createSidebarFileElement(
      i.toString(),
      utils.parseCategoryName(file.textContent).replace(basePathForMainFiles ?? '', ''),
      fullPath
  );
}

function handleSidebarMicrotag(file, i) {
  const element = document.createElement('div');
  element.classList.add('microtag');
  element.style.setProperty('--id', i.toString());
  element.textContent = file.textContent;

  return element;
}

function handleSidebarGroup(i, basePathForMainFiles, basePathForGroupFiles, groupFilesList) {
  const elementText = document.createElement('div');
  elementText.classList.add('text');
  elementText.textContent = utils.parseCategoryName(basePathForGroupFiles).replace(basePathForMainFiles ?? '', '');
  const element = document.createElement('div');
  element.classList.add('element');
  element.appendChild(elementText);
  element.appendChild(iconsManager.get('main', 'chevronDown'));

  const elementsGroup = document.createElement('div');
  elementsGroup.classList.add('elements');
  elementsGroup.style.setProperty('--id', i.toString());
  elementsGroup.appendChild(element);

  for (const file of groupFilesList) {
    let fullPath = basePathForGroupFiles + file.textContent;

    const element = createSidebarFileElement(
      i.toString(),
      utils.parseCategoryName(file.textContent).replace(basePathForGroupFiles ?? '', ''),
      fullPath,
    );
    elementsGroup.append(element);
  }

  elementsGroup.style.setProperty('--items', elementsGroup.childNodes.length.toString());
  element.addEventListener('click', () => elementsGroup.classList.toggle('expanded'));

  return elementsGroup;
}

function createSidebarFileElement(id, textContent, contentUri = textContent) {
  const element = document.createElement('div');
  element.classList.add('element');
  element.addEventListener('click', () => globalUpdateActiveFile(contentUri));
  element.style.setProperty('--id', id);
  element.textContent = textContent;

  onChangeListenerInstance.addListener({
    callback: (activePath) => {
      element.classList.toggle('active', contentUri === activePath);
    },
    isInternal: true,
    ref: element
  });

  return element;
}

export function updateActiveFile(file) {
  onChangeListenerInstance.callInternalListeners(file);
}

export function globalUpdateActiveFile(file) {
  onChangeListenerInstance.callAllListeners(file);
}

export function resetData() {
  leftContainer = undefined;
  leftSidebar = undefined;
  sidebarSticky = undefined;

  searchResults = undefined;
  searchInputText = undefined;

  currentLoadedSidebarId = undefined;
  hasLoaded = false;
}