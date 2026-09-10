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

import * as debug from "./main.debug.js";
import * as config from "./main.config.js";
import {getForceGithubAPIStatus} from "./main.settings.js";

class ForceGitHubApiReason {
  static NONE = 0;
  static REQUEST_FAILED = 1;
  static USER_CHOICE = 2;
}

let forceApiReason = ForceGitHubApiReason.NONE;

let pypiDataPromise;
let pypiDataResult;

let alternativesList = {};

const DEFAULT_DOCS_REF = 'master';
let docsRef = readInitialDocsRef();

function readInitialDocsRef() {
  const fromUrl = new URLSearchParams(window.location.search).get('ref');

  if (fromUrl) {
    localStorage.setItem('docsRef', fromUrl);
    return fromUrl;
  }

  return localStorage.getItem('docsRef') || DEFAULT_DOCS_REF;
}

export function getDocsRef() {
  return docsRef;
}

export function fallbackToDefaultDocsRef() {
  if (docsRef === DEFAULT_DOCS_REF) {
    return false;
  }

  localStorage.removeItem('docsRef');
  window.location.reload();
  return true;
}

export function setDocsRef(ref) {
  const newRef = ref || DEFAULT_DOCS_REF;

  if (newRef === docsRef) {
    return;
  }

  if (newRef === DEFAULT_DOCS_REF) {
    localStorage.removeItem('docsRef');
  } else {
    localStorage.setItem('docsRef', newRef);
  }

  window.location.reload();
}

export async function initRequest(fileName, repoName = 'pytgcalls/docsdata') {
  const isUsingAnAlternative = !!alternativesList[repoName];
  const forceApi = getForceGithubAPIStatus();

  if (forceApi && !isUsingAnAlternative) {
    return await tryToLoadWithApi(repoName, fileName);
  }

  try {
    return await tryToLoadWithUserContent(repoName, fileName);
  } catch (e) {
    console.warn(`[RequestsManager] UserContent load failed for ${fileName}, falling back to GitHub API:`, e);
    if (isUsingAnAlternative) {
      alert("Connection to your custom docsdata server failed! We're using GitHub as fallback. Check your port.");
    }
    return await tryToLoadWithApi(repoName, fileName);
  }
}

export function setAsDebugAlternative(original, alternative) {
  if (!debug.isSafeToUseDebugItems()) {
    return;
  }

  alternativesList[original] = alternative;
  forceApiReason = ForceGitHubApiReason.NONE;
}

function tryToLoadWithUserContent(repoName, fileName) {
  let completeUrl = 'https://raw.githubusercontent.com/' + repoName + '/' + docsRef + '/' + fileName;
  if (alternativesList[repoName]) {
    completeUrl = alternativesList[repoName] + '/' + fileName;
  }

  return fetch(completeUrl, { cache: 'default' })
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    });
}

function tryToLoadWithApi(repoName, fileName) {
  return fetch('https://api.github.com/repos/' + repoName + '/contents/' + fileName + '?ref=' + encodeURIComponent(docsRef), {
    headers: { Accept: 'application/vnd.github.v3+json' }
  })
    .then((res) => {
      if (!res.ok) throw new Error('Failed to get data from github api: ' + res.status);
      return res.json();
    })
    .then((response) => {
      if (typeof response['content'] === 'string' && response['content'].length > 0) {
        const cleanBase64 = response['content'].replace(/\s/g, '');
        const decodedContent = atob(cleanBase64);
        const utf8Content = new TextDecoder('utf-8').decode(new Uint8Array([...decodedContent].map(char => char.charCodeAt(0))));
        return utf8Content;
      }
      throw new Error('Failed to parse github api response');
    });
}

export function retrievePackageData() {
  if (pypiDataResult != null) {
    return Promise.resolve(pypiDataResult);
  } else if (pypiDataPromise != null) {
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

export async function getGitHubRepoStats(repoName) {
  const cacheKey = `gh_stats_${repoName}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (_) {}

  try {
    const res = await fetch(`https://api.github.com/repos/${repoName}`, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) throw new Error('Status ' + res.status);
    const data = await res.json();
    const stats = {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0
    };
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: stats
      }));
    } catch (_) {}
    return stats;
  } catch (e) {
    if (repoName === 'pytgcalls/pytgcalls') {
      return { stars: 430, forks: 209 };
    }
    if (repoName === 'pytgcalls/ntgcalls') {
      return { stars: 117, forks: 43 };
    }
    return { stars: 0, forks: 0 };
  }
}