/*
 * Copyright (c) 2020-2026.
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
import {getLibraryElement, getVersionElement} from "./main.header.js";

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
  leftContainerElement.appendChild(composeSponsorCard());
  leftContainer = leftContainerElement;

  return leftContainerElement;
}

function pickWeightedSponsor(sponsors) {
  const weights = sponsors.map((sponsor) => {
    const weight = parseFloat(sponsor.getAttribute('weight'));
    return Number.isFinite(weight) ? Math.max(0, weight) : 1;
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  if (total <= 0) {
    return null;
  }

  let roll = Math.random() * total;

  return sponsors.find((sponsor, index) => (roll -= weights[index]) < 0)
    ?? sponsors[sponsors.length - 1];
}

function composeSponsorCard() {
  const card = document.createElement('a');
  card.classList.add('sponsor-card');
  card.target = '_blank';
  card.rel = 'noopener';
  card.style.display = 'none';

  const badgeText = document.createElement('span');
  const badge = document.createElement('div');
  badge.classList.add('sponsor-badge');
  badge.appendChild(iconsManager.get('main', 'bolt'));
  badge.appendChild(badgeText);

  const logo = document.createElement('img');
  logo.classList.add('sponsor-logo');
  logo.alt = '';
  logo.style.display = 'none';

  const title = document.createElement('div');
  title.classList.add('sponsor-title');
  const description = document.createElement('div');
  description.classList.add('sponsor-description');
  const texts = document.createElement('div');
  texts.classList.add('sponsor-texts');
  texts.appendChild(title);
  texts.appendChild(description);

  const body = document.createElement('div');
  body.classList.add('sponsor-body');
  body.appendChild(logo);
  body.appendChild(texts);

  const buttonText = document.createElement('span');
  const button = document.createElement('div');
  button.classList.add('sponsor-button');
  button.appendChild(buttonText);
  button.appendChild(iconsManager.get('main', 'arrowRight'));

  const disclaimer = document.createElement('div');
  disclaimer.classList.add('sponsor-disclaimer');
  disclaimer.textContent = 'PyTgCalls is not affiliated with or endorsed by this sponsor';

  card.appendChild(badge);
  card.appendChild(body);
  card.appendChild(button);
  card.appendChild(disclaimer);

  config.getSponsorsData().then((sponsors) => {
    const sponsor = pickWeightedSponsor(Array.from(sponsors));

    if (!sponsor) {
      return;
    }

    const href = sponsor.getAttribute('href');
    const titleNode = sponsor.querySelector('title');

    if (!href || !href.trim() || !titleNode || !titleNode.textContent.trim()) {
      return;
    }

    card.href = href.trim();
    title.textContent = titleNode.textContent.trim();

    const badgeNode = sponsor.querySelector('badge');
    badgeText.textContent = badgeNode && badgeNode.textContent.trim()
      ? badgeNode.textContent.trim()
      : 'Sponsored';

    const descriptionNode = sponsor.querySelector('description');
    if (descriptionNode && descriptionNode.textContent.trim()) {
      description.textContent = descriptionNode.textContent.trim();
    } else {
      description.remove();
    }

    const buttonNode = sponsor.querySelector('button');
    if (buttonNode && buttonNode.textContent.trim()) {
      buttonText.textContent = buttonNode.textContent.trim();
    } else {
      button.remove();
    }

    const logoNode = sponsor.querySelector('logo');
    if (logoNode && logoNode.textContent.trim()) {
      logo.src = logoNode.textContent.trim();
      logo.style.display = '';
    }

    card.style.display = '';
    card.classList.add('appear');
  });

  return card;
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
    libraryContainer.appendChild(getVersionElement(document.createElement('div')));

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
      const isActive = contentUri === activePath;
      element.classList.toggle('active', isActive);
      if (isActive && element.parentElement && element.parentElement.classList.contains('elements')) {
        element.parentElement.classList.add('expanded');
      }
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