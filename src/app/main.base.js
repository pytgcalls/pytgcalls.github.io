const splashItem = document.querySelector('body .splash .audio-shader .waves');
for (let i = 0; i < 300 / 6; i++) {
  const value = Math.floor(Math.random() * (100 - 30)) + 30;

  const wave = document.createElement('div');
  wave.classList.add('wave');
  wave.style.setProperty('--i', i);
  wave.style.setProperty('--value', value);
  splashItem.appendChild(wave);
}

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
});