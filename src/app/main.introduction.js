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
    title2.textContent = 'Available as libraries in all your favorite languages';
    const animationContainer = document.createElement('div');
    animationContainer.classList.add('animation');
    animationContainer.appendChild(title);
    animationContainer.appendChild(title2);

    const introduction = document.createElement('div');
    introduction.classList.add('introduction');
    introduction.appendChild(animationContainer);

    this.#container.appendChild(introduction);
  }
}