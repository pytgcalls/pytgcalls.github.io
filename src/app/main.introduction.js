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

    const squadFormTitle = document.createElement('div');
    squadFormTitle.classList.add('squad-title');
    squadFormTitle.textContent = 'A large structure ...';
    const squadFormGrid = document.createElement('div');
    squadFormGrid.classList.add('grid');
    squadFormGrid.appendChild(this.#composeSquareFormGrid());
    const squadForm = document.createElement('div');
    squadForm.classList.add('squad-form');
    squadForm.appendChild(squadFormTitle);
    squadForm.appendChild(squadFormGrid);
    
    const projectsCardTitle = document.createElement('div');
    projectsCardTitle.classList.add('projects-title');
    projectsCardTitle.textContent = '... for your favorite language ...';
    const projectsCard = document.createElement('div');
    projectsCard.classList.add('projects-card');
    projectsCard.appendChild(projectsCardTitle);
    projectsCard.appendChild(this.#composeProjectsGrid());

    const row = document.createElement('div');
    row.classList.add('row');
    row.appendChild(squadForm);
    row.appendChild(projectsCard);

    this.#container.appendChild(row);

    const teamCardTitle = document.createElement('div');
    teamCardTitle.classList.add('projects-title');
    teamCardTitle.textContent = '... written by a big team';
    const teamCard = document.createElement('div');
    teamCard.classList.add('team-card');
    teamCard.appendChild(teamCardTitle);
    teamCard.appendChild(this.#composeTeamGrid());

    this.#container.appendChild(teamCard);
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
      
      for(const member of members) {
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