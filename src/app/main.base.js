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

import * as config from "./main.config.js";
import * as devicesManager from "./main.devices.js";
import * as homePage from "./main.home.js";

window.addEventListener('load', () => {
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
        splashScreen.addEventListener('animationend', (e) => {
          if (e.target === splashScreen) {
            resolve();
          }
        });
      }
    }));

    promisesList.push(config.loadConfig());

    Promise.all(promisesList).then(() => {
      if (typeof splashTimeout != 'undefined') {
        clearTimeout(splashTimeout);
      }

      if (devicesManager.isAndroid()) {
        document.body.classList.add('disable-blur');
      }

      reloadScreenData();
      splashScreen.remove();
      config.getRedirectDataForPath(window.location.pathname).then((data) => {
        if (data && (data.startsWith('https://') || data.startsWith('http://'))) {
          window.location.href = data;
        } else {
          homePage.init(data || window.location.pathname);
        }
      });
    });
  }
});

window.addEventListener('popstate', () => {
  homePage.handleAsRedirect(window.location.pathname, true);
});

function reloadScreenData() {
  document.body.style.setProperty('--wd', window.innerWidth.toString());
}

window.addEventListener('resize', reloadScreenData);