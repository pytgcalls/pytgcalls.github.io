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

    promisesList.push(utils.loadConfig());

    Promise.all(promisesList).then(() => {
      splashScreen.remove();
      homePage.init(window.location.pathname);
    });
  }

  const updateVh = () => {
    document.body.style.setProperty('--vh', (window.innerHeight * 0.01)+'px');
  };

  updateVh();
  window.addEventListener('resize', updateVh);
});