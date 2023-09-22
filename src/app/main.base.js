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
});