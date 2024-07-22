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

let precachedConfig;

export async function loadConfig() {
  if (isConfigReady()) {
    return precachedConfig;
  } else {
    try {
      return precachedConfig = new DOMParser().parseFromString(
          await requestsManager.initRequest('config.xml'),
          'application/xml'
      );
    } catch (e) {
      alert("This documentation isn't available in your country");
    }
  }
}

export function setAsConfig(text) {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  precachedConfig = new DOMParser().parseFromString(
      text,
      'application/xml'
  );
}

export function resetConfigByDebug() {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  precachedConfig = undefined;
}

export function isConfigReady() {
  return precachedConfig != null;
}

export async function getTeamMembers() {
  return (await loadConfig()).querySelectorAll('team > member');
}

export async function getOwnerData() {
  return (await loadConfig()).querySelector('homepage-config > team > member[owner="true"]');
}

export async function getOwnerCitation() {
  return (await loadConfig()).querySelector('homepage-config > citation > value');
}

export async function getNumericPresPoints() {
  return (await loadConfig()).querySelectorAll('homepage-config > numeric-pres-points > item');
}

export async function getHomePagePresFiles() {
  return (await loadConfig()).querySelectorAll('homepage-config > pres-items > file');
}

export async function getFooterCategories() {
  return (await loadConfig()).querySelectorAll('homepage-config > footer-links > category');
}

export async function getFooterContributionLink() {
  return (await loadConfig()).querySelector('homepage-config > footer-links > contribution-link');
}

export async function getFooterDescription() {
  return (await loadConfig()).querySelector('homepage-config > footer-links > dsc');
}

export async function getAvailableCategories() {
  return [...(await loadConfig()).querySelectorAll('config > files-list')].filter(
      (x) => x.hasAttribute('id') && x.hasAttribute('description')
  );
}

export async function getTheNextFileAfter(fileName) {
  const filesListElementsGlobal = (await loadConfig()).querySelectorAll('config > files-list file');

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

  if (detectedId == null) {
    return Promise.reject('detected id not found');
  } else {
    const filesListElements = detectedId.querySelectorAll('file');

    let nextFile, previousFile, previousStateFile;
    let found = false;
    for (const file of filesListElements) {
      const finalText = getFullPathByFileElement(file);

      if (nextFile == null) {
        if (found) {
          nextFile = finalText;
        } else if (finalText === fileName) {
          found = true;
        }
      }

      if (previousFile == null) {
        if (finalText === fileName && previousStateFile != null) {
          previousFile = previousStateFile;
        } else {
          previousStateFile = finalText;
        }
      }
    }

    if (nextFile == 'undefined' && typeof previousFile == null) {
      return Promise.reject('path not found');
    } else {
      return {
        previousFile,
        nextFile,
        basePath: detectedId.hasAttribute('basepath') ? detectedId.getAttribute('basepath') : ''
      };
    }
  }
}

export async function getAllFilesListFilesById(id) {
  const filesListElements = (await loadConfig()).querySelectorAll('config > files-list[id="' + id + '"] file');
  let finalList = [];
  for (const element of filesListElements) {
    let finalText = '';
    if (element.parentElement.hasAttribute('basepath')) {
      finalText = element.parentElement.getAttribute('basepath');
    }
    finalText += element.textContent;
    finalList.push(finalText);
  }
  return finalList;
}

export async function getFilesListDefaultFileById(id) {
  const filesListElement = (await loadConfig()).querySelector('config > files-list[id="' + id + '"]');

  if (filesListElement && filesListElement.hasAttribute('defaultfile')) {
    let fullPath = filesListElement.getAttribute('defaultfile');
    if (filesListElement.hasAttribute('basepath')) {
      fullPath = filesListElement.getAttribute('basepath') + fullPath;
    }

    return fullPath;
  }
}

export async function getFilesListInstanceById(id) {
  return (await loadConfig()).querySelector('config > files-list[id="' + id + '"]');
}

export function getOptionValueByIdSync(id) {
  if (isConfigReady()) {
    return precachedConfig.querySelector('config > option[id="' + id + '"]');
  }

  return null;
}

export function isComplexOptionValueByIdSync(id) {
  if (isConfigReady()) {
    const child = getOptionValueByIdSync(id);
    if (child) {
      return child.childElementCount || !(child.firstChild instanceof Text);
    }
  }

  return false;
}

export function getFullPathByFileElement(file) {
  let finalText = '';
  if (file.parentElement.hasAttribute('basepath')) {
    finalText = file.parentElement.getAttribute('basepath');
  }
  finalText += file.textContent;
  return finalText;
}

export async function getRedirectDataForPath(path) {
  const redirectTo = (await loadConfig()).querySelector('config > redirects > redirect[path="' + path.toLowerCase() + '"]');
  return redirectTo && redirectTo.textContent;
}