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

let closeCallbacksList = [];

function init({
  childElement,
  title,
  text,
  container,
  hasTabs = false
}) {
  closeTooltips();

  const elementRect = container.getBoundingClientRect();

  const tooltipTriangle = document.createElement('div');
  tooltipTriangle.classList.add('triangle');
  const tooltip = document.createElement('div');
  tooltip.classList.add('tooltip');
  tooltip.classList.toggle('has-tabs', hasTabs);
  tooltip.style.setProperty('--center-x', '0px');
  tooltip.style.setProperty('--center-y', elementRect.top + 'px');
  tooltip.appendChild(tooltipTriangle);

  if (childElement instanceof Element) {
    tooltip.appendChild(childElement);
  } else {
    if (typeof title == 'string') {
      const titleElement = document.createElement('div');
      titleElement.classList.add('title-element');
      titleElement.textContent = title;
      tooltip.appendChild(titleElement);
    }

    if (typeof text == 'string') {
      const textElement = document.createElement('div');
      textElement.classList.add('text-element');
      textElement.textContent = text;
      tooltip.appendChild(textElement);
    }
  }

  document.body.appendChild(tooltip);

  const tooltipRect = tooltip.getBoundingClientRect();
  let newLeftPosition = elementRect.left;
  newLeftPosition += elementRect.width / 2;
  newLeftPosition -= tooltipRect.width / 2;

  tooltip.style.setProperty('--center-x', newLeftPosition + 'px');
  tooltip.classList.add('visible');
  container.classList.add('focused-tooltip');

  const handler = () => {
    closeTooltips();
  };

  window.addEventListener('resize', handler);
  document.body.addEventListener('click', handler);

  closeCallbacksList.push(() => {
    tooltip.classList.add('remove');
    tooltip.addEventListener('animationend', () => {
      tooltip.remove();
    }, { once: true });

    container.classList.remove('focused-tooltip');

    window.removeEventListener('resize', handler);
    document.body.removeEventListener('click', handler);
  });
}

function closeTooltips() {
  for (const callback of closeCallbacksList) {
    try {
      callback();
    } catch (e) { }
  }
  closeCallbacksList = [];
}

export {
  init,
  closeTooltips
};