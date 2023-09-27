window.addEventListener('load', () => {
  const splashScreen = document.querySelector('body .splash');
  if (splashScreen) {
    let promisesList = [];
    
    promisesList.push(new Promise((resolve) => {
      splashScreen.addEventListener('animationend', (e) => {
        if (e.target === splashScreen) {
          resolve();
        }
      });
    }));

    promisesList.push(config.loadConfig());

    Promise.all(promisesList).then(() => {
      splashScreen.remove();
      homePage.init(window.location.pathname);
    });
  }
});