/*
 * Copyright (c) 2020-2026.
 *
 *  The code in this file is part of the Py-TgCalls project.
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

import * as iconsManager from "./main.icons.js";
import * as config from "./main.config.js";

const STORAGE_KEY = 'dismissedAnnouncement';
const SHOW_DELAY = 2500;

export function init() {
  config.getAnnouncementData().then((announcement) => {
    const id = announcement?.getAttribute('id');
    const href = announcement?.getAttribute('href');
    const titleNode = announcement?.querySelector('title');
    if (!id || !href || !titleNode || isDismissed(id)) {
      return;
    }
    setTimeout(() => show(announcement, id, href.trim(), titleNode.textContent.trim()), SHOW_DELAY);
  });
}

function show(announcement, id, href, titleText) {
  const header = document.createElement('div');
  header.classList.add('announcement-header');

  const badgeNode = announcement.querySelector('badge');
  if (badgeNode && badgeNode.textContent.trim()) {
    const badgeText = document.createElement('span');
    badgeText.textContent = badgeNode.textContent.trim();
    const badge = document.createElement('div');
    badge.classList.add('announcement-badge');
    badge.appendChild(iconsManager.get('main', 'star'));
    badge.appendChild(badgeText);
    header.appendChild(badge);
  }

  const close = document.createElement('button');
  close.classList.add('announcement-close');
  close.setAttribute('aria-label', 'Dismiss');
  close.appendChild(iconsManager.get('main', 'close'));
  header.appendChild(close);

  const link = document.createElement('a');
  link.classList.add('announcement-link');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';

  const imageNode = announcement.querySelector('image');
  const hasImage = Boolean(imageNode && imageNode.textContent.trim());
  if (hasImage) {
    const image = document.createElement('img');
    image.classList.add('announcement-image');
    image.src = imageNode.textContent.trim();
    image.alt = titleText;
    link.appendChild(image);
  } else {
    const title = document.createElement('div');
    title.classList.add('announcement-title');
    title.textContent = titleText;
    link.appendChild(title);
  }

  const descriptionNode = announcement.querySelector('description');
  if (descriptionNode && descriptionNode.textContent.trim()) {
    const description = document.createElement('div');
    description.classList.add('announcement-description');
    description.textContent = descriptionNode.textContent.trim();
    link.appendChild(description);
  }

  const buttonNode = announcement.querySelector('button');
  if (buttonNode && buttonNode.textContent.trim()) {
    const buttonText = document.createElement('span');
    buttonText.textContent = buttonNode.textContent.trim();
    const button = document.createElement('div');
    button.classList.add('announcement-button');
    button.appendChild(buttonText);
    button.appendChild(iconsManager.get('main', 'arrowRight'));
    link.appendChild(button);
  }

  const card = document.createElement('div');
  card.classList.add('announcement');
  card.appendChild(header);
  card.appendChild(link);
  close.addEventListener('click', () => dismiss(card, id));

  document.body.appendChild(card);
  card.classList.add('appear');
}

function dismiss(card, id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch (e) {}
  card.remove();
}

function isDismissed(id) {
  try {
    return localStorage.getItem(STORAGE_KEY) === id;
  } catch (e) {
    return false;
  }
}
