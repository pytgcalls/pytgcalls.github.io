window.addEventListener('load', () => {
  const splashScreen = document.querySelector('body .splash');
  if (splashScreen) {
    splashScreen.addEventListener('animationend', (e) => {
      if (e.target === splashScreen) {
        splashScreen.remove();
        homePage.init();
      }
    });
  }

  const updateVh = () => {
    document.body.style.setProperty('--vh', (window.innerHeight * 0.01)+'px');
  };

  updateVh();
  window.addEventListener('resize', updateVh);
});