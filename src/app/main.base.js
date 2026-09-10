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

import * as config from "./main.config.js";
import * as devicesManager from "./main.devices.js";
import * as homePage from "./main.home.js";
import {handleSettings} from "./main.settings.js";

function startApp() {
  const splashScreen = document.querySelector('body .splash');
  if (splashScreen) {
    let promisesList = [];

    let splashTimeout;
    if (splashScreen.classList.contains('faster')) {
      splashTimeout = setTimeout(() => {
        splashScreen.classList.add('show');
      }, 300);
    }

    promisesList.push(new Promise((resolve) => {
      if (splashScreen.classList.contains('faster')) {
        resolve();
      } else {
        const fallbackTimer = setTimeout(resolve, 800);
        splashScreen.addEventListener('animationend', (e) => {
          clearTimeout(fallbackTimer);
          resolve();
        }, { once: true });
      }
    }));

    promisesList.push(config.loadConfig().catch(() => null));

    Promise.all(promisesList).then(() => {
      if (splashTimeout != null) {
        clearTimeout(splashTimeout);
      }

      if (devicesManager.isAndroid()) {
        document.body.classList.add('reduce-blur');
      }

      reloadScreenData();
      splashScreen.remove();
      handleSettings();

      config.getRedirectDataForPath(window.location.pathname).then((data) => {
        if (data instanceof String && (data.startsWith('https://') || data.startsWith('http://'))) {
          window.location.href = data;
        } else {
          homePage.init(data || window.location.pathname);
        }
      }).catch(() => {
        homePage.init(window.location.pathname);
      });
    }).catch(() => {
      splashScreen.remove();
      handleSettings();
      homePage.init(window.location.pathname);
    });
  } else {
    reloadScreenData();
    handleSettings();
    homePage.init(window.location.pathname);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startApp();
} else {
  window.addEventListener('DOMContentLoaded', startApp, { once: true });
  window.addEventListener('load', startApp, { once: true });
}

window.addEventListener('popstate', () => {
  homePage.handleAsRedirect(window.location.pathname, true);
});

function reloadScreenData() {
  document.body.style.setProperty('--wd', window.innerWidth.toString());
}

window.addEventListener('resize', reloadScreenData);