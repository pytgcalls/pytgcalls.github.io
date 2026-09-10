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

let appStarted = false;

function startApp() {
  if (appStarted) return;

  const splashScreen = document.querySelector('body .splash');
  if (splashScreen) {
    let splashTimeout;
    if (splashScreen.classList.contains('faster')) {
      splashTimeout = setTimeout(() => {
        splashScreen.classList.add('show');
      }, 300);
    }

    const launch = () => {
      if (appStarted) return;
      appStarted = true;

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
        if (typeof data === 'string' && (data.startsWith('https://') || data.startsWith('http://'))) {
          window.location.href = data;
        } else {
          homePage.init(data || window.location.pathname);
        }
      }).catch(() => {
        homePage.init(window.location.pathname);
      });
    };

    // Safety timeout: dismiss splash after 1.6s max if anything stalls
    const maxSplashTimer = setTimeout(launch, 1600);

    const animationPromise = new Promise((resolve) => {
      if (splashScreen.classList.contains('faster')) {
        resolve();
      } else {
        const fallbackTimer = setTimeout(resolve, 1550);
        splashScreen.addEventListener('animationend', (e) => {
          if (e.target === splashScreen && e.animationName === 'hideSplash') {
            clearTimeout(fallbackTimer);
            resolve();
          }
        });
      }
    });

    const configPromise = config.loadConfig().catch(() => null);

    Promise.all([animationPromise, configPromise]).then(() => {
      clearTimeout(maxSplashTimer);
      launch();
    }).catch(() => {
      clearTimeout(maxSplashTimer);
      launch();
    });
  } else {
    appStarted = true;
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
