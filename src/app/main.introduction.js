class Introduction {
  onVisibilityUpdateListenerInstance;

  #container;

  constructor() {
    this.onVisibilityUpdateListenerInstance = new ListenerManagerInstance();
  }

  getElement() {
    const container = document.createElement('div');
    container.classList.add('home-container');

    this.#container = container;
    return container;
  }

  show() {
    this.onVisibilityUpdateListenerInstance.callAllListeners(true);
    this.#composeContainer();
  }

  hide() {
    this.onVisibilityUpdateListenerInstance.callAllListeners(false);
    this.#container.textContent = '';
  }

  #composeContainer() {
    console.log('ARRIVED AS COMPOS');
    this.#container.textContent = '';

    const title = document.createElement('div');
    title.classList.add('title1');
    title.textContent = 'A single native library';
    const title2 = document.createElement('div');
    title2.classList.add('title2');
    title2.textContent = 'Available as libraries';
    const title3 = document.createElement('div');
    title3.classList.add('title3');
    title3.textContent = 'in all your favorite languages';
    const bigTitle = document.createElement('div');
    bigTitle.classList.add('bigtitle');
    bigTitle.textContent = 'Native Tg Calls';
    const bigTitleDescription = document.createElement('div');
    bigTitleDescription.classList.add('bigtitle-description');
    bigTitleDescription.textContent = 'YOUR CALLS LIBRARY';
    const animationContainer = document.createElement('div');
    animationContainer.classList.add('animation');
    animationContainer.appendChild(title);
    animationContainer.appendChild(title2);
    animationContainer.appendChild(title3);
    animationContainer.appendChild(bigTitle);
    animationContainer.appendChild(bigTitleDescription);

    const animatedGif = document.createElement('img');
    animatedGif.classList.add('animated-gif');
    animatedGif.src = '/src/assets/telegram.gif';

    const introduction = document.createElement('div');
    introduction.classList.add('introduction');
    introduction.appendChild(animatedGif);
    introduction.appendChild(animationContainer);

    this.#container.appendChild(introduction);
  }
}