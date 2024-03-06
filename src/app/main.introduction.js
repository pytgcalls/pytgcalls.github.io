class Introduction {
  onVisibilityUpdateListenerInstance;

  #container;
  #isCurrentlyEnabled = false;
  #isCurrentlyDisappearing = false;
  #offscreenCanvas;
  #introduction;

  #currentVscTimeout;

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

    const introductionRect = this.#introduction.getBoundingClientRect();
    this.#offscreenCanvas.width = introductionRect.width;
    this.#offscreenCanvas.height = introductionRect.height;
    offScreenHelper.grantCanvasToWorker(this.#offscreenCanvas);
  }

  hide() {
    if (this.#isCurrentlyDisappearing instanceof Promise) {
      return this.#isCurrentlyDisappearing;
    } else if (this.#isCurrentlyEnabled) {
      if (typeof this.#currentVscTimeout != 'undefined') {
        clearTimeout(this.#currentVscTimeout);
        this.#currentVscTimeout = undefined;
      }

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
    
    const internalPresPoints = document.createElement('div');
    internalPresPoints.classList.add('int-pres-points');
    internalPresPoints.appendChild(this.#composePresentationPoints());
    const presentationPoints = document.createElement('div');
    presentationPoints.classList.add('pres-points');
    presentationPoints.appendChild(internalPresPoints);
    this.#container.appendChild(presentationPoints);
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

    config.getHomePagePresFiles().then((items) => {
      let currentId = 0;

      const proceedWithNextCode = (fallback = false) => {
        currentId++;

        if (currentId == items.length) {
          currentId = 0;
        }

        if (items[currentId].getAttribute('title') && items[currentId].querySelector('syntax-highlight')) {
          this.#animateNewCodeAddition(
            items[currentId].getAttribute('title'),
            items[currentId].querySelector('syntax-highlight')
          ).then(() => {
            this.#currentVscTimeout = setTimeout(() => {
              proceedWithNextCode();
            }, 10000);
          });
        } else if (!fallback) {
          proceedWithNextCode(true);
        }
      };

      proceedWithNextCode();
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

    let removedI = 0;
    const linesList = document.createElement('div');
    linesList.classList.add('lines-list');
    for(let i = 0; i < syntaxHighlightElement.textContent.split('\n').length - 1; i++) {
      if (i == 0 && syntaxHighlightElement.textContent.startsWith('\n')) {
        removedI--;
        continue;
      }

      const lineNumber = document.createElement('div');
      lineNumber.style.setProperty('--id', i + removedI + 1);
      lineNumber.textContent = String(i + removedI + 1);
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

    return Promise.all([
      new Promise((resolve) => {
        linesList.addEventListener('animationend', resolve, { once: true });
      }),
      new Promise((resolve) => {
        handledSyntax.addEventListener('animationend', resolve, { once: true });
      }),
      new Promise((resolve) => {
        rightCodeFile.addEventListener('animationend', resolve, { once: true });
      }),
    ]);
  }

  #composePresentationPoints() {
    const fragment = document.createDocumentFragment();

    const smallBadge = document.createElement('div');
    smallBadge.classList.add('small-badge');
    smallBadge.textContent = 'Ready for Deployment';
    fragment.append(smallBadge);

    const bigTitle = document.createElement('div');
    bigTitle.classList.add('big-text');
    bigTitle.innerHTML = 'Gain the Competitive Advantage<br/>Developers Demand.';
    fragment.append(bigTitle);

    const firstRow = document.createElement('div');
    firstRow.classList.add('row', 'first');
    firstRow.appendChild(this.#composeSinglePresentationPoint('bolt'));
    firstRow.appendChild(this.#composeSinglePresentationPoint('light'));
    const secondRow = document.createElement('div');
    secondRow.classList.add('row', 'second');
    secondRow.appendChild(this.#composeSinglePresentationPoint('devices'));
    secondRow.appendChild(this.#composeSinglePresentationPoint('dictionary'));
    const gridElement = document.createElement('div');
    gridElement.classList.add('grid-element');
    gridElement.appendChild(firstRow);
    gridElement.appendChild(secondRow);
    fragment.append(gridElement);

    return fragment;
  }

  #composeSinglePresentationPoint(type) {
    switch(type) {
      case 'bolt': {
        const lightPseudoElementPattern = document.createElement('img');
        lightPseudoElementPattern.classList.add('pattern');
        lightPseudoElementPattern.src = '/src/assets/costructionpattern.svg';
        const lightPseudoElement = document.createElement('div');
        lightPseudoElement.classList.add('pseudo-bg');
        lightPseudoElement.appendChild(document.createElement('div'));
        lightPseudoElement.appendChild(document.createElement('div'));
        lightPseudoElement.appendChild(document.createElement('div'));
        lightPseudoElement.appendChild(lightPseudoElementPattern);

        const icon = document.createElement('img');
        icon.classList.add('icon');
        icon.src = '/src/assets/bolt.svg';
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('icon-container');
        iconContainer.appendChild(icon);
        
        const containerText = document.createElement('div');
        containerText.classList.add('text');
        containerText.innerHTML = 'Accelerate your coding<br/>process with seamless<br/>and effortless<br/>implementation.';

        const container = document.createElement('div');
        container.classList.add('container', 'light');
        container.appendChild(lightPseudoElement);
        container.appendChild(iconContainer);
        container.appendChild(containerText);

        return container;
      }
      case 'light': {
        const icon = document.createElement('img');
        icon.classList.add('icon');
        icon.src = '/src/assets/energyleaf.svg';
        const backShadow = document.createElement('div');
        backShadow.classList.add('back-shadow');
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('icon-container');
        iconContainer.appendChild(backShadow);
        iconContainer.appendChild(icon);
        
        const containerText = document.createElement('div');
        containerText.classList.add('text', 'short');
        containerText.innerHTML = '35%';
        
        const smallContainerText = document.createElement('div');
        smallContainerText.classList.add('small-text');
        smallContainerText.innerHTML = 'Lighter than alternatives';

        const container = document.createElement('div');
        container.classList.add('container', 'dark');
        container.appendChild(iconContainer);
        container.appendChild(containerText);
        container.appendChild(smallContainerText);

        return container;
      }
      case 'devices': {
        const icon = document.createElement('img');
        icon.classList.add('icon');
        icon.src = '/src/assets/devices.svg';
        
        const windowsIcon = document.createElement('img');
        windowsIcon.classList.add('icon', 'secondary');
        windowsIcon.src = '/src/assets/windows.svg';
        const devicesIcon = document.createElement('img');
        devicesIcon.classList.add('icon', 'secondary');
        devicesIcon.src = '/src/assets/linux.svg';
        const appleIcon = document.createElement('img');
        appleIcon.classList.add('icon', 'secondary');
        appleIcon.src = '/src/assets/apple.svg';

        const backShadow = document.createElement('div');
        backShadow.classList.add('back-shadow');
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('icon-container');
        iconContainer.appendChild(backShadow);
        iconContainer.appendChild(icon);
        iconContainer.appendChild(windowsIcon);
        iconContainer.appendChild(devicesIcon);
        iconContainer.appendChild(appleIcon);
        
        const containerText = document.createElement('div');
        containerText.classList.add('text');
        containerText.innerHTML = 'Compatible with a<br/>wide range of devices<br/>and operating<br/>systems.';

        const container = document.createElement('div');
        container.classList.add('container', 'dark');
        container.appendChild(iconContainer);
        container.appendChild(containerText);

        return container;
      }
      case 'dictionary': {
        const lightPseudoElementPattern = document.createElement('img');
        lightPseudoElementPattern.classList.add('pattern');
        lightPseudoElementPattern.src = '/src/assets/costructionpattern.svg';
        const lightPseudoElement = document.createElement('div');
        lightPseudoElement.classList.add('pseudo-bg');
        lightPseudoElement.appendChild(document.createElement('div'));
        lightPseudoElement.appendChild(document.createElement('div'));
        lightPseudoElement.appendChild(document.createElement('div'));
        lightPseudoElement.appendChild(lightPseudoElementPattern);

        const icon = document.createElement('img');
        icon.classList.add('icon');
        icon.src = '/src/assets/dictionary.svg';
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('icon-container');
        iconContainer.appendChild(icon);
        
        const containerText = document.createElement('div');
        containerText.classList.add('text');
        containerText.innerHTML = 'Achieve Language<br/>Flexibility with Effortless<br/>Integration through C<br/>Bindings.';

        const container = document.createElement('div');
        container.classList.add('container', 'light');
        container.appendChild(lightPseudoElement);
        container.appendChild(iconContainer);
        container.appendChild(containerText);

        return container;
      }
      default:
        return document.createDocumentFragment();
    }
  }
}