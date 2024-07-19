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

import * as iconsManager from "./main.icons.js";

let closeCallbacksList = [];

export function init({
  childElement,
  container,
  hasTabs = false,
  closeOnClick = true,
  moreSpace = false
}) {
  closeTooltips();

  const elementRect = container.getBoundingClientRect();

  const tooltipArrow = iconsManager.get('special', 'tooltip');
  const tooltip = document.createElement('div');
  tooltip.classList.add('tooltip');
  tooltip.classList.toggle('has-tabs', hasTabs);
  tooltip.classList.toggle('more-space', moreSpace);
  tooltip.style.setProperty('--center-x', '0px');
  tooltip.style.setProperty('--center-y', elementRect.top + 'px');
  tooltip.appendChild(tooltipArrow);
  tooltip.appendChild(childElement);
  document.body.appendChild(tooltip);

  const tooltipRect = tooltip.getBoundingClientRect();

  let newLeftPosition = elementRect.left;
  newLeftPosition += elementRect.width / 2;
  newLeftPosition -= tooltipRect.width / 2;

  if (newLeftPosition + tooltipRect.width >= window.innerWidth) {
    newLeftPosition = window.innerWidth - tooltipRect.width - 7.5;
    tooltip.classList.add('out-of-space');
    tooltip.style.setProperty('--origin-x', elementRect.left + elementRect.width / 2 - newLeftPosition + 'px');
    tooltip.style.setProperty('--origin-y', (tooltipRect.top * 2 + 40) + 'px');
  }

  tooltip.style.setProperty('--center-x', newLeftPosition + 'px');
  tooltip.classList.add('visible');
  container.classList.add('focused-tooltip');

  const resizeHandler = () => closeTooltips();
  let clickHandler = resizeHandler;

  if (!closeOnClick) {
    clickHandler = (e) => {
      if (e.target !== tooltip && !tooltip.contains(e.target)) {
        closeTooltips();
      }
    };
  }

  window.addEventListener('resize', resizeHandler);
  document.body.addEventListener('click', clickHandler);

  closeCallbacksList.push(() => {
    tooltip.classList.add('remove');
    tooltip.addEventListener('animationend', () => {
      tooltip.remove();
    }, { once: true });

    container.classList.remove('focused-tooltip');

    window.removeEventListener('resize', resizeHandler);
    document.body.removeEventListener('click', clickHandler);
  });
}

export function closeTooltips() {
  for (const callback of closeCallbacksList) {
    try {
      callback();
    } catch (e) { }
  }
  closeCallbacksList = [];
}