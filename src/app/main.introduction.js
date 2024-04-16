class Introduction {
  onVisibilityUpdateListenerInstance;

  #container;

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
    this.onVisibilityUpdateListenerInstance.callAllListeners(true);
    this.#composeContainer();
  }

  hide() {
    this.#container.textContent = '';
    this.onVisibilityUpdateListenerInstance.callAllListeners(false);

    if (typeof this.#currentVscTimeout != 'undefined') {
      clearTimeout(this.#currentVscTimeout);
    }
  }

  #composeContainer() {
    this.#container.textContent = '';

    const backgroundSurface = document.createElement('div');
    backgroundSurface.classList.add('background-surface');
    const backgroundImage = document.createElement('div');
    backgroundImage.classList.add('background-image');
    const background = document.createElement('div');
    background.classList.add('background');
    background.appendChild(backgroundSurface);
    background.appendChild(backgroundImage);

    const bigTitle = document.createElement('div');
    bigTitle.classList.add('bigtitle');
    bigTitle.innerHTML = 'A simplified implementation of<br/>Telegram Group Calls in a<br/>seamless way';
    const buttonIcon = document.createElement('div');
    buttonIcon.classList.add('button-icon');
    buttonIcon.appendChild(document.createElement('div'));
    buttonIcon.appendChild(document.createElement('div'));
    buttonIcon.appendChild(document.createElement('div'));
    const button = document.createElement('div');
    button.classList.add('mgc-button');
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

    const internalPresPoints = document.createElement('div');
    internalPresPoints.classList.add('int-pres-points');
    internalPresPoints.appendChild(this.#composePresentationPoints());
    const presentationPoints = document.createElement('div');
    presentationPoints.classList.add('pres-points', 'has-margin');
    presentationPoints.appendChild(internalPresPoints);
    this.#container.appendChild(presentationPoints);

    const bottomNocheEffect = document.createElement('img');
    bottomNocheEffect.classList.add('bottom-noche');
    bottomNocheEffect.src = '/src/assets/noche-effect-background.webp';
    const rightNocheEffect = document.createElement('img');
    rightNocheEffect.classList.add('right-noche');
    rightNocheEffect.src = '/src/assets/right-noche-effect.webp';
    const backgroundEffectsLayer = document.createElement('div');
    backgroundEffectsLayer.classList.add('background-effects');
    backgroundEffectsLayer.appendChild(bottomNocheEffect);
    backgroundEffectsLayer.appendChild(rightNocheEffect);

    const numericPresPoints = document.createElement('div');
    numericPresPoints.classList.add('int-pres-points');
    numericPresPoints.appendChild(this.#composeNumericPresentation());
    const numericPresentationPoints = document.createElement('div');
    numericPresentationPoints.classList.add('pres-points', 'has-margin');
    numericPresentationPoints.appendChild(backgroundEffectsLayer);
    numericPresentationPoints.appendChild(numericPresPoints);
    this.#container.appendChild(numericPresentationPoints);

    const teamMembers = document.createElement('div');
    teamMembers.classList.add('team-members');
    teamMembers.appendChild(this.#composeTeamMembers());
    this.#container.appendChild(teamMembers);

    const footer = document.createElement('div');
    footer.classList.add('footer');
    footer.appendChild(this.#composeFooter());
    this.#container.appendChild(footer);
  }

  #composeSmallFileEditor() {
    const topBar = document.createElement('div');
    topBar.classList.add('vsc-top-bar');
    topBar.appendChild(document.createElement('div'));
    topBar.appendChild(document.createElement('div'));
    topBar.appendChild(document.createElement('div'));

    const filesIcon = iconsManager.get('vsc', 'files');
    filesIcon.classList.add('active');
    const leftIcons = document.createElement('div');
    leftIcons.classList.add('vsc-left-icons');
    leftIcons.appendChild(filesIcon);
    leftIcons.appendChild(iconsManager.get('vsc', 'search'));
    leftIcons.appendChild(iconsManager.get('vsc', 'debug'));
    leftIcons.appendChild(iconsManager.get('vsc', 'extensions'));

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
    const languageDetails = sourceParser.detectLanguageByElement(syntaxHighlightElement, false, true);

    const rightCodeFileClose = iconsManager.get('main', 'xmark');
    rightCodeFileClose.classList.add('file-close');
    const rightCodeFile = document.createElement('div');
    rightCodeFile.classList.add('file');
    rightCodeFile.textContent = tabName;
    rightCodeFile.appendChild(rightCodeFileClose);

    if (languageDetails.icon.name != '') {
      const rightCodeFileLanguage = iconsManager.get(languageDetails.icon.category, languageDetails.icon.name);
      rightCodeFileLanguage.classList.add('file-language');
      rightCodeFile.prepend(rightCodeFileLanguage);
    }

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
    for (let i = 0; i < syntaxHighlightElement.textContent.split('\n').length - 1; i++) {
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
    for (const child of handledSyntax.childNodes) {
      if (child instanceof HTMLBRElement || (child instanceof HTMLDivElement && child.classList.contains('spacer'))) {
        reformedHtml += child.outerHTML;
      } else if (child instanceof HTMLSpanElement && child.classList.contains('token')) {
        i++;
        child.style.setProperty('--id', i + 1);
        reformedHtml += child.outerHTML;
      } else if (child instanceof Text) {
        i++;
        const spanElement = document.createElement('span');
        spanElement.classList.add('fakespan');
        spanElement.style.setProperty('--id', i + 1);
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
    switch (type) {
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

        const iconContainer = document.createElement('div');
        iconContainer.classList.add('pseudo-icons');
        iconContainer.appendChild(iconsManager.get('main', 'bolt'));

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
        const backShadow = document.createElement('div');
        backShadow.classList.add('back-shadow');
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('pseudo-icons');
        iconContainer.appendChild(backShadow);
        iconContainer.appendChild(iconsManager.get('main', 'energyleaf'));

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
        const icon = iconsManager.get('main', 'devices');

        const windowsIcon = iconsManager.get('devices', 'windows');
        windowsIcon.classList.add('secondary');
        const devicesIcon = iconsManager.get('devices', 'linux');
        devicesIcon.classList.add('secondary');
        const appleIcon = iconsManager.get('devices', 'apple');
        appleIcon.classList.add('secondary');

        const backShadow = document.createElement('div');
        backShadow.classList.add('back-shadow');
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('pseudo-icons');
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

        const iconContainer = document.createElement('div');
        iconContainer.classList.add('pseudo-icons');
        iconContainer.appendChild(iconsManager.get('main', 'dictionary'));

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

  #composeSingleNumericPresentationPoint(title, description, origin) {
    const bigTitle = document.createElement('div');
    bigTitle.classList.add('text', 'short');
    bigTitle.textContent = title;

    const containerText = document.createElement('div');
    containerText.classList.add('text');
    containerText.textContent = description;

    const container = document.createElement('div');
    container.classList.add('container', 'numeric');
    container.appendChild(bigTitle);
    container.appendChild(containerText);

    if (origin != "") {
      const smallContainerText = document.createElement('div');
      smallContainerText.classList.add('small-text');
      smallContainerText.textContent = origin;
      container.appendChild(smallContainerText);
    }

    return container;
  }

  #composeOwnerCitation() {
    const mainIcon = iconsManager.get('special', 'quote');
    mainIcon.classList.add('citation-icon');

    const citationElement = document.createElement('div');
    citationElement.classList.add('citation-text');

    config.getOwnerCitation().then((citation) => {
      if (citation && citation.textContent.trim()) {
        citationElement.textContent = citation.textContent.trim();
      }
    });

    const ownerImage = document.createElement('img');
    ownerImage.classList.add('owner-image');
    const ownerTitle = document.createElement('div');
    ownerTitle.classList.add('owner-title');
    const ownerDescription = document.createElement('div');
    ownerDescription.classList.add('owner-description');
    const ownerDetails = document.createElement('div');
    ownerDetails.classList.add('owner-details');
    ownerDetails.appendChild(ownerTitle);
    ownerDetails.appendChild(ownerDescription);
    const ownerRow = document.createElement('div');
    ownerRow.classList.add('owner-row');
    ownerRow.appendChild(ownerImage);
    ownerRow.appendChild(ownerDetails);

    config.getOwnerData().then((ownerData) => {
      if (ownerData) {
        const name = ownerData.querySelector('name');
        const role = ownerData.querySelector('role');
        const github = ownerData.querySelector('github-username');

        if (!name || !name.textContent.trim() || !role || !role.textContent.trim() || !github || !github.textContent.trim()) {
          return;
        }

        ownerImage.src = "https://github.com/" + github.textContent.trim() + ".png?size=90";
        ownerTitle.textContent = name.textContent.trim();
        ownerDescription.textContent = role.textContent.trim();
      }
    });

    const container = document.createElement('div');
    container.classList.add('container', 'citation');
    container.appendChild(mainIcon);
    container.appendChild(citationElement);
    container.appendChild(ownerRow);

    return container;
  }

  #composeNumericPresentation() {
    const fragment = document.createDocumentFragment();

    const smallBadge = document.createElement('div');
    smallBadge.classList.add('small-badge');
    smallBadge.textContent = 'High-End Library';
    fragment.append(smallBadge);

    const bigTitle = document.createElement('div');
    bigTitle.classList.add('big-text');
    bigTitle.innerHTML = 'The Industry Standard';
    fragment.append(bigTitle);

    const firstRow = document.createElement('div');
    firstRow.classList.add('row', 'numeric');

    config.getNumericPresPoints().then((points) => {
      for (const presPoint of points) {
        const title = presPoint.getAttribute('title');
        const description = presPoint.getAttribute('description');

        if (!title || !description || !title.trim() || !description.trim()) {
          continue;
        }

        firstRow.appendChild(this.#composeSingleNumericPresentationPoint(
          title.trim(),
          description.trim(),
          presPoint.hasAttribute('origin') ? presPoint.getAttribute('origin').trim() : ''
        ));
      }
    });

    const secondRow = document.createElement('div');
    secondRow.classList.add('row', 'citation');
    secondRow.appendChild(this.#composeOwnerCitation());

    const gridElement = document.createElement('div');
    gridElement.classList.add('grid-element');
    gridElement.appendChild(firstRow);
    gridElement.appendChild(secondRow);
    fragment.append(gridElement);

    return fragment;
  }

  #composeTeamMembers() {
    const fragment = document.createDocumentFragment();

    const bigTitle = document.createElement('div');
    bigTitle.classList.add('big-text');
    bigTitle.textContent = 'Team Members';

    const description = document.createElement('div');
    description.classList.add('description');
    description.textContent = 'Each member contributes their specific skills and knowledge to the team. They can include technical expertise, communication skills, problem-solving abilities or creative thinking.';

    const intTeamMembers = document.createElement('div');
    intTeamMembers.classList.add('int-team-members');
    intTeamMembers.appendChild(bigTitle);
    intTeamMembers.appendChild(description);
    fragment.append(intTeamMembers);

    const firstCarousel = document.createElement('div');
    firstCarousel.classList.add('carousel');
    const secondCarousel = document.createElement('div');
    secondCarousel.classList.add('carousel', 'reverse');
    const carouselContainer = document.createElement('div');
    carouselContainer.classList.add('carousel-container');
    carouselContainer.appendChild(firstCarousel);
    carouselContainer.appendChild(secondCarousel);
    fragment.append(carouselContainer);

    config.getTeamMembers().then((members) => {
      let validMembersCount = 0;
      let validMembersCountFirst = 0;
      let validMembersCountSecond = 0;
      let firstMembersChildren = [];
      let secondMembersChildren = [];

      const validChildrenCount = [...members].filter((x) => (
        x.querySelector('name') && x.querySelector('name').textContent.trim()
        && x.querySelector('role') && x.querySelector('role').textContent.trim()
        && x.querySelector('github-username') && x.querySelector('github-username').textContent.trim()
        && x.querySelector('telegram-username') && x.querySelector('telegram-username').textContent.trim()
      )).length;

      const minimumDiv = parseInt(validChildrenCount / 2);

      for (const member of members) {
        const name = member.querySelector('name');
        const role = member.querySelector('role');
        const github = member.querySelector('github-username');
        const telegram = member.querySelector('telegram-username');

        if (!name || !name.textContent.trim() || !role || !role.textContent.trim()) {
          continue;
        }

        if (!github || !github.textContent.trim() || !telegram || !telegram.textContent.trim()) {
          continue;
        }

        validMembersCount++;

        const memberImage = document.createElement('img');
        memberImage.src = 'https://github.com/' + github.textContent + '.png?size=90';

        const memberName = document.createElement('div');
        memberName.classList.add('member-name');
        memberName.textContent = name.textContent.trim();
        const memberRole = document.createElement('div');
        memberRole.classList.add('member-role');
        const memberDetails = document.createElement('div');
        memberDetails.classList.add('member-details');
        memberDetails.appendChild(memberName);
        memberDetails.appendChild(memberRole);

        for (const rolePart of role.textContent.trim().split(', ')) {
          if (rolePart != '') {
            const rolePartElement = document.createElement('span');
            rolePartElement.classList.add('member-role-part');
            rolePartElement.textContent = rolePart;
            memberRole.appendChild(rolePartElement);
          }
        }

        const memberTopContainer = document.createElement('div');
        memberTopContainer.classList.add('member-top-container');
        memberTopContainer.appendChild(memberImage);
        memberTopContainer.appendChild(memberDetails);

        const telegramButton = document.createElement('a');
        telegramButton.href = 'tg://resolve?username=' + telegram.textContent.trim();
        telegramButton.appendChild(iconsManager.get('socials', 'telegram'));
        telegramButton.appendChild(document.createTextNode('Telegram'));

        const githubButton = document.createElement('a');
        githubButton.href = 'https://github.com/' + github.textContent.trim();
        githubButton.target = '_blank';
        githubButton.appendChild(iconsManager.get('socials', 'github'));
        githubButton.appendChild(document.createTextNode('Github'));

        const memberButtons = document.createElement('div');
        memberButtons.classList.add('buttons');
        memberButtons.appendChild(telegramButton);
        memberButtons.appendChild(githubButton);

        const memberContainer = document.createElement('div');
        memberContainer.classList.add('member');
        memberContainer.appendChild(memberTopContainer);
        memberContainer.appendChild(memberButtons);

        if (validMembersCount > minimumDiv) {
          validMembersCountFirst++;
          secondCarousel.appendChild(memberContainer);
          secondMembersChildren.push(memberContainer);
        } else {
          validMembersCountSecond++;
          firstCarousel.appendChild(memberContainer);
          firstMembersChildren.push(memberContainer);
        }
      }

      let multiplier = 1;
      for (const child of firstMembersChildren) {
        const newChild = child.cloneNode(true);
        newChild.classList.add('clone');
        firstCarousel.appendChild(newChild);
      }

      for (const child of secondMembersChildren) {
        const newChild = child.cloneNode(true);
        newChild.classList.add('clone');
        secondCarousel.appendChild(newChild);
      }

      if (window.innerWidth > 2000) {
        multiplier = 2;

        for (const child of firstMembersChildren) {
          const newChild = child.cloneNode(true);
          newChild.classList.add('clone');
          firstCarousel.appendChild(newChild);
        }

        for (const child of secondMembersChildren) {
          const newChild = child.cloneNode(true);
          newChild.classList.add('clone');
          secondCarousel.appendChild(newChild);
        }
      }

      firstCarousel.style.setProperty('--items', (validMembersCountFirst + firstMembersChildren.length * multiplier).toString());
      firstCarousel.style.setProperty('--items-translate', validMembersCountFirst.toString());

      secondCarousel.style.setProperty('--items', (validMembersCountSecond + secondMembersChildren.length * multiplier).toString());
      secondCarousel.style.setProperty('--items-translate', validMembersCountSecond.toString());
    });

    return fragment;
  }

  #createSingleFooterDedicatedSection(iconCategory, iconName, title) {
    const icon = iconsManager.get(iconCategory, iconName);

    const titleElement = document.createElement('div');
    titleElement.classList.add('title');
    titleElement.innerHTML = title;

    const buttonIcon = document.createElement('div');
    buttonIcon.classList.add('button-icon');
    buttonIcon.appendChild(document.createElement('div'));
    buttonIcon.appendChild(document.createElement('div'));
    buttonIcon.appendChild(document.createElement('div'));
    const linkElement = document.createElement('a');
    linkElement.classList.add('mgc-button');
    linkElement.target = '_blank';
    linkElement.textContent = "Discover more...";
    linkElement.appendChild(buttonIcon);

    const dedSection = document.createElement('div');
    dedSection.classList.add('ded-section');
    dedSection.appendChild(icon);
    dedSection.appendChild(titleElement);
    dedSection.appendChild(linkElement);

    return {
      element: dedSection,
      setLink: (link) => {
        linkElement.href = link;
      }
    };
  }

  #composeFooter() {
    const fragment = document.createDocumentFragment();

    const bigTitle = document.createElement('div');
    bigTitle.classList.add('big-text');
    bigTitle.textContent = 'The Project';
    fragment.append(bigTitle);

    const groupElement = this.#createSingleFooterDedicatedSection(
      'main', 'group', 'Ask for support<br/>in our official group'
    );
    const channelElement = this.#createSingleFooterDedicatedSection(
      'main', 'newspaper', 'Be updated<br/>in our channel'
    );
    const linksContainer = document.createElement('div');
    linksContainer.classList.add('links-container');
    linksContainer.appendChild(groupElement.element);
    linksContainer.appendChild(channelElement.element);
    fragment.append(linksContainer);

    const descriptionElement = document.createElement('div');
    descriptionElement.classList.add('description');
    fragment.append(descriptionElement);

    config.getFooterCategories().then((categories) => {
      for (const category of categories) {
        const title = category.getAttribute('title');

        if (!title || !title.trim()) {
          continue;
        }

        const categoryTitle = document.createElement('div');
        categoryTitle.classList.add('category-title');
        categoryTitle.textContent = title.trim();
        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('category-container');
        categoryContainer.appendChild(categoryTitle);

        for (const links of category.querySelectorAll('link')) {
          const linkTitle = links.textContent;
          const linkHref = links.getAttribute('href');

          if (!linkTitle || !linkTitle.textContent || !linkHref || !linkHref.textContent) {
            const categoryLink = document.createElement('a');
            categoryLink.href = linkHref.trim();
            categoryLink.target = '_blank';
            categoryLink.textContent = linkTitle.trim();
            categoryContainer.appendChild(categoryLink);
          }
        }

        linksContainer.appendChild(categoryContainer);
      }
    });

    config.getFooterGrouplink().then((groupLink) => {
      if (groupLink && groupLink.textContent.trim()) {
        groupElement.setLink(groupLink.textContent.trim());
        // TODO: check grouplink validity
      }
    });

    config.getFooterChannelLink().then((channelLink) => {
      if (channelLink && channelLink.textContent.trim()) {
        channelElement.setLink(channelLink.textContent.trim());
        // TODO: check channellink validity
      }
    });

    config.getFooterDescription().then((description) => {
      if (description && description.textContent.trim()) {
        descriptionElement.textContent = description.textContent.trim();
      }
    });

    return fragment;
  }
}