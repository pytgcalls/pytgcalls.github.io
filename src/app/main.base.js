window.addEventListener('load', () => {
  const splashScreen = document.querySelector('body .splash');
  if (splashScreen) {
    let promisesList = [];
    
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