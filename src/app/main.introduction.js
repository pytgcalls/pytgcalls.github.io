/*
 * Copyright (c) 2020-2026.
 *
 *  The code in this file is part of the Py-TgCalls project.
 *  Please refer to official links:
 *  * Repo: https://github.com/pytgcalls
 *  * News: https://t.me/pytgcallsnews
 *  * Chat: https://t.me/pytgcallschat
 *  * Documentation: https://pytgcalls.github.io
 *
 *  We consider these above sources to be the only official
 *  sources for news related to this source code.
 *  With <3 by @kuogi (and the fox!)
 */

import * as iconsManager from "./main.icons.js";
import * as config from "./main.config.js";
import ListenerManagerInstance from "./main.listener.js";
import * as homePage from "./main.home.js";
import * as sourceParser from "./main.parser.js";

export const onVisibilityUpdateListenerInstance = new ListenerManagerInstance();

let containerElement;

let currentVscTimeout;

let rightCodeFilesListElement;
let rightCodeHighlightElement;

export function getElement() {
  const container = document.createElement('div');
  container.classList.add('home-container');

  container.addEventListener('scroll', () => {
    document.body.classList.toggle('expanded', container.scrollTop > 0);
  });

  containerElement = container;
  return container;
}

export function show() {
  onVisibilityUpdateListenerInstance.callAllListeners(true);
  composeContainer();
}

export function isVisible() {
  return containerElement != null && containerElement.hasChildNodes();
}

export function hide() {
  containerElement.textContent = '';
  onVisibilityUpdateListenerInstance.callAllListeners(false);

  if (currentVscTimeout != null) {
    clearTimeout(currentVscTimeout);
  }

  resetData();
}

function composeContainer() {
  containerElement.textContent = '';

  const backgroundSurface = document.createElement('div');
  backgroundSurface.classList.add('background-surface');
  const backgroundImage = document.createElement('div');
  backgroundImage.classList.add('background-image');
  const background = document.createElement('div');
  background.classList.add('background');
  const backgroundTint = document.createElement('div');
  backgroundTint.classList.add('background-tint');
  const backgroundShade = document.createElement('div');
  backgroundShade.classList.add('background-shade');
  background.appendChild(backgroundSurface);
  background.appendChild(backgroundImage);
  background.appendChild(backgroundTint);
  background.appendChild(backgroundShade);

  const bigTitle = document.createElement('div');
  bigTitle.classList.add('bigtitle');
  bigTitle.innerHTML = '<div>Stream, record and talk in <span class="gradient-text">Telegram calls</span></div>';
  const subtitle = document.createElement('div');
  subtitle.classList.add('subtitle');
  subtitle.textContent = 'One fast native core, with bindings for Python, Node.js, Rust, Go, C and Android.';
  const buttonIcon = document.createElement('div');
  buttonIcon.classList.add('button-icon');
  buttonIcon.appendChild(document.createElement('div'));
  buttonIcon.appendChild(document.createElement('div'));
  buttonIcon.appendChild(document.createElement('div'));
  const button = document.createElement('div');
  button.classList.add('mgc-button');
  button.addEventListener('click', () => {
    hide();
    homePage.handleAsRedirect('/NTgCalls');
  });
  button.textContent = 'Get started';
  button.appendChild(buttonIcon);
  const textContainer = document.createElement('div');
  textContainer.classList.add('text-container');
  textContainer.appendChild(bigTitle);
  textContainer.appendChild(subtitle);
  textContainer.appendChild(button);
  textContainer.appendChild(composeSmallFileEditor());

  const introduction = document.createElement('div');
  introduction.classList.add('introduction');
  introduction.appendChild(background);
  introduction.appendChild(textContainer);
  containerElement.appendChild(introduction);

  const internalPresPoints = document.createElement('div');
  internalPresPoints.classList.add('int-pres-points');
  internalPresPoints.appendChild(composePresentationPoints());
  const presentationPoints = document.createElement('div');
  presentationPoints.classList.add('pres-points', 'has-margin');
  presentationPoints.appendChild(internalPresPoints);
  containerElement.appendChild(presentationPoints);

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
  numericPresPoints.appendChild(composeNumericPresentation());
  const numericPresentationPoints = document.createElement('div');
  numericPresentationPoints.classList.add('pres-points', 'has-margin');
  numericPresentationPoints.appendChild(backgroundEffectsLayer);
  numericPresentationPoints.appendChild(numericPresPoints);
  containerElement.appendChild(numericPresentationPoints);

  const teamMembers = document.createElement('div');
  teamMembers.classList.add('team-members');
  teamMembers.appendChild(composeTeamMembers());
  containerElement.appendChild(teamMembers);

  const footer = document.createElement('div');
  footer.classList.add('footer');
  footer.appendChild(composeFooter());
  containerElement.appendChild(footer);
}

function composeSmallFileEditor() {
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

  rightCodeFilesListElement = rightCodeFilesList;
  rightCodeHighlightElement = rightCodeHighlight;

  config.getHomePagePresFiles().then((items) => {
    let currentId = 0;

    const proceedWithNextCode = (fallback = false) => {
      currentId++;

      if (currentId === items.length) {
        currentId = 0;
      }

      if (items[currentId].getAttribute('title') && items[currentId].querySelector('syntax-highlight')) {
        animateNewCodeAddition(
          items[currentId].getAttribute('title'),
          items[currentId].querySelector('syntax-highlight')
        ).then(() => {
          currentVscTimeout = setTimeout(() => {
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

function animateNewCodeAddition(tabName, syntaxHighlightElement) {
  const languageDetails = sourceParser.detectLanguageByElement(syntaxHighlightElement, false, true);

  const rightCodeFileClose = iconsManager.get('main', 'xmark');
  rightCodeFileClose.classList.add('file-close');
  const rightCodeFile = document.createElement('div');
  rightCodeFile.classList.add('file');
  rightCodeFile.textContent = tabName;
  rightCodeFile.appendChild(rightCodeFileClose);

  if (languageDetails.icon.name !== '') {
    const rightCodeFileLanguage = iconsManager.get(languageDetails.icon.category, languageDetails.icon.name);
    rightCodeFileLanguage.classList.add('file-language');
    rightCodeFile.prepend(rightCodeFileLanguage);
  }

  if (rightCodeFilesListElement.childNodes.length > 0) {
    const currentFileName = rightCodeFilesListElement.childNodes[0];
    currentFileName.classList.add('disappear');
    currentFileName.addEventListener('animationend', () => {
      currentFileName.remove();
      rightCodeFilesListElement.appendChild(rightCodeFile);
    }, { once: true });
  } else {
    rightCodeFilesListElement.appendChild(rightCodeFile);
  }

  let removedI = 0;
  const linesList = document.createElement('div');
  linesList.classList.add('lines-list');
  for (let i = 0; i < syntaxHighlightElement.textContent.split('\n').length - 1; i++) {
    if (i === 0 && syntaxHighlightElement.textContent.startsWith('\n')) {
      removedI--;
      continue;
    }

    const lineNumber = document.createElement('div');
    lineNumber.style.setProperty('--id', String(i + removedI + 1));
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
      child.style.setProperty('--id', String(i + 1));
      reformedHtml += child.outerHTML;
    } else if (child instanceof Text) {
      i++;
      const spanElement = document.createElement('span');
      spanElement.classList.add('fakespan');
      spanElement.style.setProperty('--id', String(i + 1));
      spanElement.textContent = child.textContent;
      reformedHtml += spanElement.outerHTML;
    }
  }
  handledSyntax.innerHTML = reformedHtml;

  const currentLL = rightCodeHighlightElement.querySelector('.lines-list');
  const currentSH = rightCodeHighlightElement.querySelector('.syntax-highlight');
  if (!currentLL && !currentSH) {
    rightCodeHighlightElement.appendChild(linesList);
    rightCodeHighlightElement.appendChild(handledSyntax);
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
      rightCodeHighlightElement.textContent = '';

      rightCodeHighlightElement.appendChild(linesList);
      rightCodeHighlightElement.appendChild(handledSyntax);
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

function composePresentationPoints() {
  const fragment = document.createDocumentFragment();

  const smallBadge = document.createElement('div');
  smallBadge.classList.add('small-badge');
  smallBadge.textContent = 'Ready for Production';
  fragment.append(smallBadge);

  const bigTitle = document.createElement('div');
  bigTitle.classList.add('big-text');
  bigTitle.innerHTML = 'Fast, light and ready for <span class="gradient-text">production</span>.';
  fragment.append(bigTitle);

  const firstRow = document.createElement('div');
  firstRow.classList.add('row', 'first');
  firstRow.appendChild(composeSinglePresentationPoint('bolt'));
  firstRow.appendChild(composeSinglePresentationPoint('light'));
  const secondRow = document.createElement('div');
  secondRow.classList.add('row', 'second');
  secondRow.appendChild(composeSinglePresentationPoint('devices'));
  secondRow.appendChild(composeSinglePresentationPoint('dictionary'));
  const gridElement = document.createElement('div');
  gridElement.classList.add('grid-element');
  gridElement.appendChild(firstRow);
  gridElement.appendChild(secondRow);
  fragment.append(gridElement);

  return fragment;
}

function composePointIcon(iconName, label) {
  const chip = document.createElement('div');
  chip.classList.add('icon-chip');
  chip.appendChild(iconsManager.get('cards', iconName));
  chip.appendChild(document.createTextNode(label));
  const iconContainer = document.createElement('div');
  iconContainer.classList.add('pseudo-icons');
  iconContainer.appendChild(chip);
  return iconContainer;
}

function composeSinglePresentationPoint(type) {
  const container = document.createElement('div');
  container.classList.add('container');
  const containerText = document.createElement('div');
  containerText.classList.add('text');

  switch (type) {
    case 'bolt': {
      container.classList.add('light');
      container.appendChild(composePointIcon('stream', 'Quick start'));
      containerText.textContent = 'Join a call and start streaming in a few lines of code.';
      container.appendChild(containerText);
      return container;
    }
    case 'light': {
      container.classList.add('dark');
      container.appendChild(composePointIcon('leaf', 'Lightweight'));
      const metrics = document.createElement('div');
      metrics.classList.add('metrics');
      for (const [value, label] of [['70%', 'Less CPU'], ['4×', 'Audio bitrate']]) {
        const metric = document.createElement('div');
        metric.classList.add('metric');
        const metricValue = document.createElement('div');
        metricValue.classList.add('metric-value');
        metricValue.textContent = value;
        const metricLabel = document.createElement('div');
        metricLabel.classList.add('metric-label');
        metricLabel.textContent = label;
        metric.appendChild(metricValue);
        metric.appendChild(metricLabel);
        metrics.appendChild(metric);
      }
      const smallContainerText = document.createElement('div');
      smallContainerText.classList.add('small-text', 'metrics-note');
      smallContainerText.textContent = 'Up to 70% less CPU and 4× the audio bitrate compared to other Telegram call libraries.';
      const benchmarksLink = document.createElement('a');
      benchmarksLink.classList.add('metrics-link');
      benchmarksLink.href = 'https://github.com/pytgcalls/ntgcalls#benchmarks';
      benchmarksLink.target = '_blank';
      benchmarksLink.textContent = 'See benchmarks';
      benchmarksLink.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>');
      container.appendChild(metrics);
      container.appendChild(smallContainerText);
      container.appendChild(benchmarksLink);
      return container;
    }
    case 'devices': {
      container.classList.add('dark');
      const chip = document.createElement('div');
      chip.classList.add('icon-chip', 'os-chip');
      for (const os of ['windows', 'linux', 'apple', 'android']) {
        chip.appendChild(iconsManager.get('devices', os));
      }
      const iconContainer = document.createElement('div');
      iconContainer.classList.add('pseudo-icons');
      iconContainer.appendChild(chip);
      container.appendChild(iconContainer);
      containerText.innerHTML = 'Runs on Windows, Linux, macOS and <span class="gradient-text">Android</span>.';
      container.appendChild(containerText);
      return container;
    }
    case 'dictionary': {
      container.classList.add('light');
      container.appendChild(composePointIcon('code', 'Multi-language'));
      containerText.textContent = 'Native bindings for Python, Node.js, Rust, Go, C and Java.';
      container.appendChild(containerText);
      return container;
    }
    default:
      return document.createDocumentFragment();
  }
}

function composeSingleNumericPresentationPoint(title, description, origin) {
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

  if (origin !== "") {
    const smallContainerText = document.createElement('div');
    smallContainerText.classList.add('small-text');
    smallContainerText.textContent = origin;
    container.appendChild(smallContainerText);
  }

  return container;
}

function composeOwnerCitation() {
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

  const sparkles = iconsManager.get('cards', 'sparkles');
  sparkles.classList.add('citation-sparkles');

  const container = document.createElement('div');
  container.classList.add('container', 'citation');
  container.appendChild(sparkles);
  container.appendChild(mainIcon);
  container.appendChild(citationElement);
  container.appendChild(ownerRow);

  return container;
}

function composeNumericPresentation() {
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

      firstRow.appendChild(composeSingleNumericPresentationPoint(
        title.trim(),
        description.trim(),
        presPoint.hasAttribute('origin') ? presPoint.getAttribute('origin').trim() : ''
      ));
    }
  });

  const secondRow = document.createElement('div');
  secondRow.classList.add('row', 'citation');
  secondRow.appendChild(composeOwnerCitation());

  const gridElement = document.createElement('div');
  gridElement.classList.add('grid-element');
  gridElement.appendChild(firstRow);
  gridElement.appendChild(secondRow);
  fragment.append(gridElement);

  return fragment;
}

function composeTeamMembers() {
  const fragment = document.createDocumentFragment();

  const bigTitle = document.createElement('div');
  bigTitle.classList.add('big-text');
  bigTitle.textContent = 'Team Members';

  const description = document.createElement('div');
  description.classList.add('description');
  description.textContent = 'The people who build, test and maintain Py-TgCalls and NTgCalls.';

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
        if (rolePart !== '') {
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
      githubButton.appendChild(document.createTextNode('GitHub'));

      const memberButtons = document.createElement('div');
      memberButtons.classList.add('buttons');
      memberButtons.appendChild(telegramButton);
      memberButtons.appendChild(githubButton);

      const memberContainer = document.createElement('div');
      memberContainer.classList.add('member');
      memberContainer.appendChild(memberTopContainer);
      memberContainer.appendChild(memberButtons);

      if (validMembersCount > minimumDiv) {
        validMembersCountSecond++;
        secondCarousel.appendChild(memberContainer);
        secondMembersChildren.push(memberContainer);
      } else {
        validMembersCountFirst++;
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

function composeFooter() {
  const fragment = document.createDocumentFragment();

  const dedSectionTitle = document.createElement('div');
  dedSectionTitle.classList.add('title');
  dedSectionTitle.textContent = 'Py-TgCalls Foundation';
  const dedSectionDescription = document.createElement('div');
  dedSectionDescription.classList.add('description');
  dedSectionDescription.textContent = 'Help us make these docs great!';
  const dedSectionDescriptionMini = document.createElement('div');
  dedSectionDescriptionMini.classList.add('mini-description');
  dedSectionDescriptionMini.textContent = 'All GitHub docs are open source. See something that\'s wrong or unclear? Submit a pull request.';

  const buttonIcon = document.createElement('div');
  buttonIcon.classList.add('button-icon');
  buttonIcon.appendChild(document.createElement('div'));
  buttonIcon.appendChild(document.createElement('div'));
  buttonIcon.appendChild(document.createElement('div'));
  const button = document.createElement('a');
  button.classList.add('mgc-button');
  button.textContent = 'Make a contribution';
  button.appendChild(buttonIcon);

  const dedSection = document.createElement('div');
  dedSection.classList.add('ded-section');
  dedSection.appendChild(dedSectionTitle);
  dedSection.appendChild(dedSectionDescription);
  dedSection.appendChild(dedSectionDescriptionMini);
  dedSection.appendChild(button);

  const linksContainer = document.createElement('div');
  linksContainer.classList.add('links-container');
  linksContainer.appendChild(dedSection);
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

  config.getFooterContributionLink().then((contribLink) => {
    if (contribLink && contribLink.textContent.trim()) {
      button.href = contribLink.textContent.trim();
      button.target = '_blank';
    }
  });

  config.getFooterDescription().then((description) => {
    if (description && description.textContent.trim()) {
      descriptionElement.textContent = description.textContent.trim();
    }
  });

  return fragment;
}

export function resetData() {
  containerElement = undefined;

  currentVscTimeout = undefined;

  rightCodeFilesListElement = undefined;
  rightCodeHighlightElement = undefined;
}