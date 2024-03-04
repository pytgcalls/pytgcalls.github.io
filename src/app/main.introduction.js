class Introduction {
  onVisibilityUpdateListenerInstance;

  #container;
  #isCurrentlyEnabled = false;
  #isCurrentlyDisappearing = false;
  #offscreenCanvas;
  #introduction;

  #rightCodeFilesList;
  #rightCodeHighlight;

  constructor() {
    this.onVisibilityUpdateListenerInstance = new ListenerManagerInstance();
  }

  getElement() {
    const container = document.createElement('div');
    container.classList.add('home-container');

    container.addEventListener('scroll', () => {
      document.body.classList.toggle('expanded', container.scrollTop > 0);
    });

    this.#container = container;
    return container;
  }

  show() {
    const executeUiUpdate = () => {
      this.#isCurrentlyEnabled = true;
      this.onVisibilityUpdateListenerInstance.callAllListeners(true);
      this.#composeContainer();
    };

    if (this.#isCurrentlyDisappearing instanceof Promise) {
      this.#isCurrentlyDisappearing.then(executeUiUpdate);
    } else {
      executeUiUpdate();
    }

    setTimeout(() => {
      const introductionRect = this.#introduction.getBoundingClientRect();
      this.#offscreenCanvas.width = introductionRect.width;
      this.#offscreenCanvas.height = introductionRect.height;
      offScreenHelper.grantCanvasToWorker(this.#offscreenCanvas);
    }, 1500);
  }

  hide() {
    if (this.#isCurrentlyDisappearing instanceof Promise) {
      return this.#isCurrentlyDisappearing;
    } else if (this.#isCurrentlyEnabled) {
      this.#container.scrollTo(0, 0);

      this.#isCurrentlyDisappearing = new Promise((resolve) => {
        this.#isCurrentlyEnabled = false;

        this.#container.classList.add('disappear');
        this.#container.addEventListener('animationend', () => {
          this.#container.classList.remove('disappear');
          this.#container.textContent = '';
          this.onVisibilityUpdateListenerInstance.callAllListeners(false);

          this.#isCurrentlyDisappearing = false;

          resolve();
        }, { once: true });
      });
      return this.#isCurrentlyDisappearing;
    } else {
      return Promise.resolve();
    }
  }

  #composeContainer() {
    this.#container.textContent = '';

    const backgroundCanvas = document.createElement('canvas');
    backgroundCanvas.classList.add('background-canvas');
    const backgroundImage = document.createElement('div');
    backgroundImage.classList.add('background-image');
    const background = document.createElement('div');
    background.classList.add('background');
    background.appendChild(backgroundCanvas);
    background.appendChild(backgroundImage);
    this.#offscreenCanvas = backgroundCanvas;

    const bigTitle = document.createElement('div');
    bigTitle.classList.add('bigtitle');
    bigTitle.innerHTML = 'A simplified implementation of<br/>Telegram Group Calls in a<br/>seamless way';
    const buttonIcon = document.createElement('div');
    buttonIcon.classList.add('button-icon');
    buttonIcon.appendChild(document.createElement('div'));
    buttonIcon.appendChild(document.createElement('div'));
    buttonIcon.appendChild(document.createElement('div'));
    const button = document.createElement('div');
    button.classList.add('button');
    button.textContent = 'Get started with Telegram Calls';
    button.appendChild(buttonIcon);
    const textContainer = document.createElement('div');
    textContainer.classList.add('text-container');
    textContainer.appendChild(bigTitle);
    textContainer.appendChild(button);
    textContainer.appendChild(this.#composeSmallFileEditor());

    const introduction = document.createElement('div');
    introduction.classList.add('introduction');
    introduction.appendChild(background);
    introduction.appendChild(textContainer);
    this.#container.appendChild(introduction);
    this.#introduction = introduction;
  }

  #composeSmallFileEditor() {
    const topBar = document.createElement('div');
    topBar.classList.add('vsc-top-bar');
    topBar.appendChild(document.createElement('div'));
    topBar.appendChild(document.createElement('div'));
    topBar.appendChild(document.createElement('div'));

    const filesIcon = document.createElement('img');
    filesIcon.classList.add('active');
    filesIcon.src = '/src/assets/vsc/files.svg';
    const searchIcon = document.createElement('img');
    searchIcon.src = '/src/assets/vsc/search.svg';
    const runDebugIcon = document.createElement('img');
    runDebugIcon.src = '/src/assets/vsc/debug.svg';
    const extensionsIcon = document.createElement('img');
    extensionsIcon.src = '/src/assets/vsc/extensions.svg';
    const leftIcons = document.createElement('div');
    leftIcons.classList.add('vsc-left-icons');
    leftIcons.appendChild(filesIcon);
    leftIcons.appendChild(searchIcon);
    leftIcons.appendChild(runDebugIcon);
    leftIcons.appendChild(extensionsIcon);

    const rightCodeFilesList = document.createElement('div');
    rightCodeFilesList.classList.add('vsc-files-list');
    const rightCodeHighlight = document.createElement('div');
    rightCodeHighlight.classList.add('vsc-code-high');
    const rightCodeContainer = document.createElement('div');
    rightCodeContainer.classList.add('vsc-right-code');
    rightCodeContainer.appendChild(rightCodeFilesList);
    rightCodeContainer.appendChild(rightCodeHighlight);

    this.#rightCodeFilesList = rightCodeFilesList;
    this.#rightCodeHighlight = rightCodeHighlight;

    config.getHomePagePresItems().then((items) => {
      this.#animateNewCodeAddition('pytgcalls.py', items[0].querySelector('syntax-highlight'));

      setTimeout(() => {
        this.#animateNewCodeAddition('ciao.py', items[1].querySelector('syntax-highlight'));
      }, 5000);
      //rightCodeHighlight.appendChild(sourceParser.handleHomepageSyntaxHighlightElement(items[0].querySelector('syntax-highlight')));
    });

    const bottomContainer = document.createElement('div');
    bottomContainer.classList.add('vsc-bottom-container');
    bottomContainer.appendChild(leftIcons);
    bottomContainer.appendChild(rightCodeContainer);

    const container = document.createElement('div');
    container.classList.add('vsc-mockup');
    container.appendChild(topBar);
    container.appendChild(bottomContainer);
    return container;
  }

  #animateNewCodeAddition(tabName, syntaxHighlightElement) {
    const rightCodeFileClose = document.createElement('img');
    rightCodeFileClose.classList.add('file-close');
    rightCodeFileClose.src = '/src/assets/xmark.svg';
    const rightCodeFile = document.createElement('div');
    rightCodeFile.classList.add('file');
    rightCodeFile.textContent = tabName;
    rightCodeFile.appendChild(rightCodeFileClose);

    if (this.#rightCodeFilesList.childNodes.length > 0) {
      const currentFileName = this.#rightCodeFilesList.childNodes[0];
      currentFileName.classList.add('disappear');
      currentFileName.addEventListener('animationend', () => {
        currentFileName.remove();
        this.#rightCodeFilesList.appendChild(rightCodeFile);
      }, { once: true });
    } else {
      this.#rightCodeFilesList.appendChild(rightCodeFile);
    }

    const linesList = document.createElement('div');
    linesList.classList.add('lines-list');
    for(let i = 0; i < syntaxHighlightElement.textContent.split('\n').length; i++) {
      const lineNumber = document.createElement('div');
      lineNumber.style.setProperty('--id', i+1);
      lineNumber.textContent = String(i+1);
      linesList.appendChild(lineNumber);
    }

    const handledSyntax = sourceParser.handleHomepageSyntaxHighlightElement(syntaxHighlightElement);
    handledSyntax.classList.add('animated');

    let reformedHtml = '';
    let i = 0;
    for(const child of handledSyntax.childNodes) {
      if (child instanceof HTMLBRElement || (child instanceof HTMLDivElement && child.classList.contains('spacer'))) {
        reformedHtml += child.outerHTML;
      } else if (child instanceof HTMLSpanElement && child.classList.contains('token')) {
        i++;
        child.style.setProperty('--id', i+1);
        reformedHtml += child.outerHTML;
      } else if (child instanceof Text) {
        i++;
        const spanElement = document.createElement('span');
        spanElement.classList.add('fakespan');
        spanElement.style.setProperty('--id', i+1);
        spanElement.textContent = child.textContent;
        reformedHtml += spanElement.outerHTML;
      }
    }
    handledSyntax.innerHTML = reformedHtml;

    const currentLL = this.#rightCodeHighlight.querySelector('.lines-list');
    const currentSH = this.#rightCodeHighlight.querySelector('.syntax-highlight');
    if (!currentLL && !currentSH) {
      this.#rightCodeHighlight.appendChild(linesList);
      this.#rightCodeHighlight.appendChild(handledSyntax);
    } else {
      currentSH.classList.add('disappear');
      currentLL.classList.add('disappear');

      Promise.all([
        new Promise((resolve) => {
          currentSH.addEventListener('animationend', resolve, { once: true });
        }),
        new Promise((resolve) => {
          currentLL.addEventListener('animationend', resolve, { once: true });
        }),
      ]).then(() => {
        this.#rightCodeHighlight.textContent = '';

        this.#rightCodeHighlight.appendChild(linesList);
        this.#rightCodeHighlight.appendChild(handledSyntax);
      })
    }
  }
} 