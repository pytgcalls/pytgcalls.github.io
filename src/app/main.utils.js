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

export function createLoadingItem(size = 100) {
  const circleItem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circleItem.setAttributeNS(null, 'cx', '50%');
  circleItem.setAttributeNS(null, 'cy', '50%');
  circleItem.setAttributeNS(null, 'r', '20');
  circleItem.setAttributeNS(null, 'fill', 'none');
  const loaderSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  loaderSvg.setAttributeNS(null, 'width', String(size));
  loaderSvg.setAttributeNS(null, 'height', String(size));
  loaderSvg.appendChild(circleItem);
  return loaderSvg;
}

export function generateSectionRefByTextContent(textContent) {
  const alphabet = Array.from(Array(26), (_, i) => String.fromCharCode(i + 65));
  const numbers = Array.from(Array(10), (_, i) => i.toString());
  const chars = ['-', '+'];

  let reformedText = '';
  for (const char of textContent) {
    if (alphabet.includes(char.toUpperCase()) || numbers.includes(char) || chars.includes(char)) {
      reformedText += char;
    } else if (char === ' ') {
      reformedText += '=';
    }
  }

  if (reformedText.length) {
    return reformedText.replaceAll(' ', '-');
  } else {
    throw Error('section has wrong title');
  }
}

export function parseCategoryName(fileName) {
  if (fileName.endsWith('.xml')) {
    fileName = fileName.slice(0, -4);
  }

  if (fileName.endsWith('/')) {
    fileName = fileName.slice(0, -1);
  }

  return fileName;
}

export function getCategoryFileName(fileName) {
  return this.parseCategoryName(fileName).split('/').reverse()[0];
}

export function parseCategoryUrl(fileName) {
  if (fileName.endsWith('.xml')) {
    fileName = fileName.slice(0, -4);
  }

  if (!fileName.startsWith('/')) {
    fileName = '/' + fileName;
  }

  if (fileName.endsWith('/')) {
    fileName = fileName.slice(0, -1);
  }

  return fileName;
}

export function escapeHTML(text) {
  return text.replace(/[\x26\x0A\<>'"]/g, function (r) {
    return "&#" + r.charCodeAt(0) + ";";
  });
}

export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }

  if (document.execCommand) {
    const textarea = document.createElement('textarea');
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.position = "fixed";
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    // noinspection JSDeprecatedSymbols
    const successful = document.execCommand("copy");

    requestAnimationFrame(() => textarea.remove());

    if (successful) {
      return Promise.resolve();
    }
  }

  return Promise.reject();
}

export function waitForAnimationEnd(element, stopPropagation = false) {
  return new Promise((resolve) => element.addEventListener('animationend', (e) => {
    stopPropagation && e.stopPropagation();
    resolve();
  }, { once: true }));
}

export function isElementHidden(element) {
  const rect = element.getBoundingClientRect();
  return rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0;
}