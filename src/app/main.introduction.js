class Introduction {
  onVisibilityUpdateListenerInstance;

  #container;
  #isCurrentlyEnabled = false;
  #isCurrentlyDisappearing = false;

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

    const title = document.createElement('div');
    title.classList.add('title1');
    title.textContent = 'Play what you want';
    const title2 = document.createElement('div');
    title2.classList.add('title2');
    title2.textContent = 'whenever you want';
    const title3 = document.createElement('div');
    title3.classList.add('title3');
    title3.textContent = 'in all your favorite groups';
    const bigTitle = document.createElement('div');
    bigTitle.classList.add('bigtitle');
    bigTitle.textContent = 'NTgCalls';
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
    
    this.#container.appendChild(this.#composeItemsPres());

  }

  #composeItemsPres() {
    const finalPresentation = document.createElement('div');
    finalPresentation.classList.add('final-pres');

    config.getHomePagePresItems().then((items) => {
      const fragment = document.createDocumentFragment();

      let elementsRf = '';
      let itemsList = [];
      for(const [i, item] of items.entries()) {
        const title = item.querySelector('title');
        const description = item.querySelector('description');
        const syntaxHighlight = item.querySelector('syntax-highlight');
        const discoverRef = item.querySelector('discover-ref');

        if (!title || !description || !syntaxHighlight || !discoverRef) {
          throw new Error('homepage final-pres elements must contain title,description,syntax-highlight,discover-ref');
        }

        if (!title.textContent.trim() || !description.textContent.trim() || !syntaxHighlight.textContent.trim() || !discoverRef.textContent.trim()) {
          throw new Error('specified elements can\'t be empty');
        }

        const presItemValuesTitle = document.createElement('div');
        presItemValuesTitle.classList.add('title');
        presItemValuesTitle.textContent = title.textContent;
        const presItemValuesDescription = document.createElement('div');
        presItemValuesDescription.classList.add('description');
        presItemValuesDescription.textContent = description.textContent;
        const presItemValuesLinkIcon = document.createElement('img');
        presItemValuesLinkIcon.src = '/src/assets/arrowright.svg';
        const presItemValuesLink = document.createElement('div');
        presItemValuesLink.classList.add('href');
        presItemValuesLink.addEventListener('click', () => {
          this.hide().then(() => {
            homePage.handleAsRedirect(discoverRef.textContent);
          });
        });
        presItemValuesLink.textContent = 'Learn more about this topic';
        presItemValuesLink.appendChild(presItemValuesLinkIcon);
        const presItemValues = document.createElement('div');
        presItemValues.classList.add('pres-item-values');
        presItemValues.appendChild(presItemValuesTitle);
        presItemValues.appendChild(presItemValuesDescription);
        presItemValues.appendChild(presItemValuesLink);

        const presItem = document.createElement('div');
        presItem.classList.add('pres-item');
        presItem.appendChild(presItemValues);
        presItem.appendChild(sourceParser.handleHomepageSyntaxHighlightElement(syntaxHighlight));

        for(let j = 0; j < 20; j++) {
          const cIcon = document.createElement('img');
          cIcon.style.setProperty('--x', Math.floor(Math.random() * 100));
          cIcon.style.setProperty('--y', Math.floor(Math.random() * 100));
          if (i == 0) {
            cIcon.src = '/src/icons/play.svg';
          } else if (i == 1) {
            cIcon.src = '/src/icons/angellist.svg';
          } else if (i == 2) {
            cIcon.src = '/src/icons/microphone_fa.svg';
          }
          presItem.appendChild(cIcon);
        }

        itemsList.push(presItem);
        fragment.append(presItem);
        elementsRf += i+1 + "<br/>";
      }

      const leftArrow = document.createElement('img');
      leftArrow.src = '/src/assets/arrowleft.svg';
      const leftArrowContainer = document.createElement('div');
      leftArrowContainer.classList.add('arc', 'left-arrow-container');
      leftArrowContainer.appendChild(leftArrow);
      const currentPage = document.createElement('div');
      currentPage.classList.add('page');
      currentPage.innerHTML = elementsRf;
      const rightArrow = document.createElement('img');
      rightArrow.src = '/src/assets/arrowright.svg';
      const rightArrowContainer = document.createElement('div');
      rightArrowContainer.classList.add('arc', 'right-arrow-container');
      rightArrowContainer.appendChild(rightArrow);
      const pagesIndicator = document.createElement('div');
      pagesIndicator.classList.add('pages-indicator');
      pagesIndicator.appendChild(leftArrowContainer);
      pagesIndicator.appendChild(currentPage);
      pagesIndicator.appendChild(rightArrowContainer);
      fragment.prepend(pagesIndicator);

      finalPresentation.appendChild(fragment);
      finalPresentation.style.setProperty('--visible-state', utils.calculateVisibleArea(finalPresentation));
      
      const calculateMostVisibleElement = () => {
        let itemsAssoc = [];
        for(const item of itemsList) {
          itemsAssoc.push({
            item,
            visible: utils.calculateVisibleArea(item)
          });
        }

        itemsAssoc.sort((a, b) => b.visible - a.visible);

        return itemsAssoc[0];
      };

      this.#container.addEventListener('scroll', (e) => {
        const area = utils.calculateVisibleArea(finalPresentation);
        if (area > 0) {
          e.preventDefault();
        }
        
        finalPresentation.style.setProperty('--visible-state', area);
      });

      leftArrow.addEventListener('click', () => {
        const currentItemID = itemsList.indexOf(calculateMostVisibleElement().item);
        if (currentItemID != 0) {
          itemsList[currentItemID-1].scrollIntoView({
            behavior: 'smooth'
          });
        }
      });

      rightArrow.addEventListener('click', () => {
        const currentItemID = itemsList.indexOf(calculateMostVisibleElement().item);
        if (currentItemID != itemsList.length - 1) {
          itemsList[currentItemID+1].scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });

    return finalPresentation;
  }

  #composeSquareFormGrid() {
    const initialElement = document.createElement('div');
    initialElement.classList.add('initial');
    initialElement.textContent = 'Native Tg Calls';
    
    const defElements = document.createElement('div');
    defElements.classList.add('def-elements');
    defElements.appendChild(this.#composeSquareFormGridIcon(
      '/src/icons/c.svg',
      '#394aaa'
    ));
    defElements.appendChild(this.#composeSquareFormGridIcon(
      '/src/icons/c++.svg',
      '#0f63a2'
    ));
    defElements.appendChild(this.#composeSquareFormGridIcon(
      '/src/icons/python.svg',
      '#242938'
    ));
    defElements.appendChild(this.#composeSquareFormGridIcon(
      '/src/icons/go.svg',
      '#00a5d7'
    ));

    const squadFormElements = document.createElement('div');
    squadFormElements.classList.add('elements');
    squadFormElements.appendChild(initialElement);
    squadFormElements.appendChild(defElements);

    return squadFormElements;
  }

  #composeSquareFormGridIcon(src, color) {
    const squadFormGridIcon = document.createElement('img');
    squadFormGridIcon.src = src;
    const squadFormGridContainer = document.createElement('div');
    squadFormGridContainer.classList.add('grid-container');
    squadFormGridContainer.style.setProperty('--color', color);
    squadFormGridContainer.appendChild(squadFormGridIcon);
    return squadFormGridContainer;
  }

  #composeProjectsGrid() {
    const fragment = document.createDocumentFragment();
    fragment.append(this.#composeSquareProjectsGrid(
      'pytgcalls', 'ntgcalls', 'C++'
    ));
    fragment.append(this.#composeSquareProjectsGrid(
      'pytgcalls', 'pytgcalls', 'Python'
    ));
    fragment.append(this.#composeSquareProjectsGrid(
      'roj1512', 'ntgcalls_deno', 'Typescript'
    ));
    fragment.append(this.#composeSquareProjectsGrid(
      'null-nick', 'gotgcalls', 'Go'
    ));
    return fragment;
  }

  #composeSquareProjectsGrid(userName, repoName, language) {
    const projectLogo = document.createElement('img');
    projectLogo.src = 'https://github.com/' + userName + '.png?size=40';
    const projectName = document.createElement('div');
    projectName.classList.add('project-name');
    projectName.textContent = repoName;
    const projectLanguage = document.createElement('div');
    projectLanguage.classList.add('project-language');
    projectLanguage.textContent = 'Written in ' + language;
    const container = document.createElement('a');
    container.href = 'https://github.com/' + userName + '/' + repoName;
    container.target = '_blank';
    container.classList.add('project');
    container.appendChild(projectLogo);
    container.appendChild(projectName);
    container.appendChild(projectLanguage);

    return container;
  }

  #composeTeamGrid() {
    const teamGrid = document.createElement('div');
    teamGrid.classList.add('team-grid');

    config.getTeamMembers().then((members) => {
      const fragment = document.createDocumentFragment();
      let validMembersCount = 0;
      
      for (const member of members) {
        const name = member.querySelector('name');
        const role = member.querySelector('role');
        const github = member.querySelector('github-username');
        const telegram = member.querySelector('telegram-username');

        if (name && role && github && telegram && github.textContent.trim() && telegram.textContent.trim()) {
          validMembersCount++;

          const memberImage = document.createElement('img');
          memberImage.src = 'https://github.com/' + github.textContent + '.png?size=90';
          const memberName = document.createElement('div');
          memberName.classList.add('member-name');
          memberName.textContent = name.textContent.trim();
          const memberRole = document.createElement('div');
          memberRole.classList.add('member-role');
          memberRole.textContent = role.textContent.trim();

          const githubLogoIcon = document.createElement('img');
          githubLogoIcon.src = '/src/icons/github.svg';
          const githubLogo = document.createElement('a');
          githubLogo.href = 'https://github.com/' + github.textContent.trim();
          githubLogo.target = '_blank';
          githubLogo.appendChild(githubLogoIcon);

          const telegramLogoIcon = document.createElement('img');
          telegramLogoIcon.src = '/src/assets/splash/telegram-logo.svg';
          const telegramLogo = document.createElement('a');
          telegramLogo.href = 'tg://resolve?username=' + telegram.textContent.trim();
          telegramLogo.appendChild(telegramLogoIcon);

          const memberIcons = document.createElement('div');
          memberIcons.classList.add('icons');
          memberIcons.appendChild(githubLogo);
          memberIcons.appendChild(telegramLogo);

          const memberContainer = document.createElement('div');
          memberContainer.classList.add('member');
          memberContainer.appendChild(memberImage);
          memberContainer.appendChild(memberName);
          memberContainer.appendChild(memberRole);
          memberContainer.appendChild(memberIcons);
          fragment.append(memberContainer);
        }
      }

      teamGrid.style.setProperty('--items', validMembersCount.toString());
      teamGrid.appendChild(fragment);
    });

    return teamGrid;
  }
} 