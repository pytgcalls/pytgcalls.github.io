/*
 * Copyright (c) 2020-2026.
 *
 *  The code in this file is part of the PyTgCalls project.
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

import * as emojisParser from "./main.emojis.js";
import * as requestsManager from "./main.requests.js";
import * as utils from "./main.utils.js";
import * as iconsManager from "./main.icons.js";
import * as config from "./main.config.js";
import * as homePage from "./main.home.js";
import * as syntaxManager from "./main.syntax.js";
import patienceDiff from "../lib/patiencediff.js";
import Prism from "../lib/prism.js";
import {getCollapseLongCodeStatus} from "./main.settings.js";

const LANG_BLOCK_GROUP = 'languages';
const LANGUAGE_NAMES = {
  python: 'Python',
  c: 'C',
  node: 'Node.js',
  java: 'Java',
  rust: 'Rust',
};
import {waitForAnimationEnd} from "./main.utils.js";

const CHANGELOG_METADATA = {
  '2.3.0': { date: 'Sep 10, 2026', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', isLatest: true, releaseUrl: 'https://pypi.org/project/py-tgcalls/2.3.0/' },
  'v2.3.0': { date: 'Sep 10, 2026', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', isLatest: true, releaseUrl: 'https://pypi.org/project/py-tgcalls/2.3.0/' },
  '2.2.11': { date: 'Aug 18, 2026', type: 'bugfix', label: 'Patch Release', icon: 'bug', color: 'blue', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.2.11/' },
  'v2.2.11': { date: 'Aug 18, 2026', type: 'bugfix', label: 'Patch Release', icon: 'bug', color: 'blue', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.2.11/' },
  '2.2.X': { date: 'Jul 02, 2026', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.2.0/' },
  'v2.2.X': { date: 'Jul 02, 2026', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.2.0/' },
  '2.1.X': { date: 'May 14, 2026', type: 'major', label: 'Major Update', icon: 'rocket', color: 'green', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.1.0/' },
  'v2.1.X': { date: 'May 14, 2026', type: 'major', label: 'Major Update', icon: 'rocket', color: 'green', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.1.0/' },
  '2.0.3': { date: 'Mar 21, 2026', type: 'bugfix', label: 'Patch Release', icon: 'bug', color: 'blue', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.0.3/' },
  'v2.0.3': { date: 'Mar 21, 2026', type: 'bugfix', label: 'Patch Release', icon: 'bug', color: 'blue', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.0.3/' },
  '2.0.X': { date: 'Jan 10, 2026', type: 'major', label: 'Major Update', icon: 'rocket', color: 'green', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.0.0/' },
  'v2.0.X': { date: 'Jan 10, 2026', type: 'major', label: 'Major Update', icon: 'rocket', color: 'green', releaseUrl: 'https://pypi.org/project/py-tgcalls/2.0.0/' },
  '1.2.X': { date: 'Oct 02, 2025', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/1.2.1/' },
  'v1.2.X': { date: 'Oct 02, 2025', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/1.2.1/' },
  '1.1.6': { date: 'Aug 16, 2025', type: 'improvements', label: 'Contest / News', icon: 'chart', color: 'orange', releaseUrl: 'https://github.com/pytgcalls/pytgcalls/discussions/199' },
  '#PyTgCon2K24': { date: 'Aug 16, 2025', type: 'improvements', label: 'Contest / News', icon: 'chart', color: 'orange', releaseUrl: 'https://github.com/pytgcalls/pytgcalls/discussions/199' },
  '1.1.X': { date: 'Jun 11, 2025', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/1.1.6/' },
  'v1.1.X': { date: 'Jun 11, 2025', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/1.1.6/' },
  '1.0.X': { date: 'Apr 09, 2025', type: 'major', label: 'Major Update', icon: 'rocket', color: 'green', releaseUrl: 'https://pypi.org/project/py-tgcalls/1.0.9/' },
  'v1.0.X': { date: 'Apr 09, 2025', type: 'major', label: 'Major Update', icon: 'rocket', color: 'green', releaseUrl: 'https://pypi.org/project/py-tgcalls/1.0.9/' },
  '0.9.X': { date: 'Jan 15, 2025', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.9.7/' },
  'v0.9.X': { date: 'Jan 15, 2025', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.9.7/' },
  'Google Partnership!': { date: 'Jul 15, 2023', type: 'improvements', label: 'News / Milestone', icon: 'chart', color: 'orange', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.9.7/' },
  '0.8.3': { date: 'Nov 21, 2024', type: 'bugfix', label: 'Patch Release', icon: 'bug', color: 'blue', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.8.6/' },
  'v0.8.3': { date: 'Nov 21, 2024', type: 'bugfix', label: 'Patch Release', icon: 'bug', color: 'blue', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.8.6/' },
  '0.8.X': { date: 'Oct 03, 2024', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.8.6/' },
  'v0.8.X': { date: 'Oct 03, 2024', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.8.6/' },
  '0.7.X': { date: 'Aug 20, 2024', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.7.4/' },
  'v0.7.X': { date: 'Aug 20, 2024', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.7.4/' },
  '0.6.X': { date: 'Aug 05, 2024', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.6.0/' },
  'v0.6.X': { date: 'Aug 05, 2024', type: 'minor', label: 'Minor Update', icon: 'tag', color: 'purple', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.6.0/' },
  '0.5.X': { date: 'Jul 15, 2024', type: 'major', label: 'Initial Release', icon: 'rocket', color: 'green', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.5.5/' },
  'v0.5.X': { date: 'Jul 15, 2024', type: 'major', label: 'Initial Release', icon: 'rocket', color: 'green', releaseUrl: 'https://pypi.org/project/py-tgcalls/0.5.5/' },
};

export function getContentByData(text, fileName = '') {
  const currentElement = document.createElement('div');
  currentElement.classList.add('page');

  const parser = new DOMParser();
  let doc;
  try {
    doc = parser.parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror') || !doc.documentElement) {
      doc = parser.parseFromString(text, 'text/html');
    }
  } catch (_) {
    doc = parser.parseFromString(text, 'text/html');
  }

  const currentPage = doc.querySelector('page, PAGE') || doc.body || doc.documentElement;
  if (currentPage) {
    const pageH1 = currentPage.querySelector('h1, H1');
    const h1Text = pageH1 ? pageH1.textContent.trim().toLowerCase() : '';
    const isChangelogs = h1Text.includes('changelog') ||
      (typeof fileName === 'string' && fileName.toLowerCase().includes('changelog')) ||
      (typeof window !== 'undefined' && window.location.pathname && window.location.pathname.toLowerCase().includes('changelog'));

    if (isChangelogs) {
      try {
        renderChangelogsPage(currentPage, currentElement);
      } catch (e) {
        console.error('renderChangelogsPage error:', e);
      }
    } else {
      renderDocBreadcrumb(fileName, currentPage, currentElement);
      handleRecursive(currentPage, currentElement);
    }
  }

  return currentElement;
}

function renderDocBreadcrumb(fileName, currentPage, currentElement) {
  const pageH1 = currentPage.querySelector('h1, H1');
  const pageTitle = pageH1 ? pageH1.textContent.trim() : '';

  let pathParts = [];
  if (typeof fileName === 'string' && fileName.trim()) {
    const cleanPath = fileName.replace(/\.xml$/i, '').replace(/^\/+/, '');
    pathParts = cleanPath.split('/').filter(Boolean);
  }

  if (pathParts.length === 0 && typeof window !== 'undefined' && window.location.pathname) {
    const cleanPath = window.location.pathname.replace(/^\/+/, '');
    pathParts = cleanPath.split('/').filter(Boolean);
  }

  if (pathParts.length > 0 || pageTitle) {
    const breadcrumb = document.createElement('div');
    breadcrumb.classList.add('doc-page-breadcrumb');

    const homeIcon = iconsManager.get('main', 'home');
    homeIcon.classList.add('breadcrumb-home');
    breadcrumb.appendChild(homeIcon);

    const bSep1 = document.createElement('span');
    bSep1.classList.add('breadcrumb-sep');
    bSep1.textContent = '/';
    breadcrumb.appendChild(bSep1);

    const libName = pathParts[0] || 'Docs';
    const bLib = document.createElement('span');
    bLib.classList.add('breadcrumb-item');
    bLib.textContent = libName;
    breadcrumb.appendChild(bLib);

    if (pathParts.length > 2) {
      for (let i = 1; i < pathParts.length - 1; i++) {
        const bSep = document.createElement('span');
        bSep.classList.add('breadcrumb-sep');
        bSep.textContent = '/';
        breadcrumb.appendChild(bSep);

        const bSection = document.createElement('span');
        bSection.classList.add('breadcrumb-item');
        bSection.textContent = pathParts[i];
        breadcrumb.appendChild(bSection);
      }
    }

    const currentTitle = pageTitle || (pathParts.length > 1 ? pathParts[pathParts.length - 1] : '');
    if (currentTitle && currentTitle !== libName) {
      const bSepLast = document.createElement('span');
      bSepLast.classList.add('breadcrumb-sep');
      bSepLast.textContent = '/';
      breadcrumb.appendChild(bSepLast);

      const bCurrent = document.createElement('span');
      bCurrent.classList.add('breadcrumb-current');
      bCurrent.textContent = currentTitle;
      breadcrumb.appendChild(bCurrent);
    }

    currentElement.appendChild(breadcrumb);
  }
}

function renderChangelogsPage(currentPage, currentElement) {
  currentElement.classList.add('changelog-page-wrapper');

  // 1. Breadcrumb
  const breadcrumb = document.createElement('div');
  breadcrumb.classList.add('changelog-breadcrumb');
  const homeIcon = iconsManager.get('main', 'home');
  homeIcon.classList.add('breadcrumb-home');
  breadcrumb.appendChild(homeIcon);
  const bSep1 = document.createElement('span');
  bSep1.classList.add('breadcrumb-sep');
  bSep1.textContent = '/';
  breadcrumb.appendChild(bSep1);
  const bIntro = document.createElement('span');
  bIntro.classList.add('breadcrumb-item');
  bIntro.textContent = 'Introduction';
  breadcrumb.appendChild(bIntro);
  const bSep2 = document.createElement('span');
  bSep2.classList.add('breadcrumb-sep');
  bSep2.textContent = '/';
  breadcrumb.appendChild(bSep2);
  const bCurrent = document.createElement('span');
  bCurrent.classList.add('breadcrumb-current');
  bCurrent.textContent = 'Changelogs';
  breadcrumb.appendChild(bCurrent);
  currentElement.appendChild(breadcrumb);

  // 2. Title & Subtitle
  const title = document.createElement('h1');
  title.classList.add('changelog-title');
  title.textContent = 'Changelogs';
  currentElement.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.classList.add('changelog-subtitle');
  subtitle.textContent = 'Stay up to date with the latest changes, improvements, and bug fixes in PyTgCalls.';
  currentElement.appendChild(subtitle);

  // 3. Hero Card
  const heroCard = document.createElement('div');
  heroCard.classList.add('changelog-hero-card');

  const heroLeft = document.createElement('div');
  heroLeft.classList.add('hero-left');

  const heroGithubBadge = document.createElement('div');
  heroGithubBadge.classList.add('hero-github-badge');
  heroGithubBadge.appendChild(iconsManager.get('socials', 'github'));
  heroLeft.appendChild(heroGithubBadge);

  const heroTexts = document.createElement('div');
  heroTexts.classList.add('hero-texts');

  const heroHeading = document.createElement('h2');
  heroHeading.classList.add('hero-heading');
  heroHeading.textContent = 'Open Source & Community Driven';
  heroTexts.appendChild(heroHeading);

  const heroSub = document.createElement('p');
  heroSub.classList.add('hero-subtext');
  heroSub.textContent = 'PyTgCalls is constantly evolving with the help of the community.';
  heroTexts.appendChild(heroSub);

  const heroActions = document.createElement('div');
  heroActions.classList.add('hero-actions');

  function formatStatCount(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toLocaleString();
  }

  const repoStatsConfig = [
    {
      repo: 'pytgcalls/pytgcalls',
      name: 'pytgcalls',
      url: 'https://github.com/pytgcalls/pytgcalls',
      defaultStars: 430,
      defaultForks: 209
    },
    {
      repo: 'pytgcalls/ntgcalls',
      name: 'ntgcalls',
      url: 'https://github.com/pytgcalls/ntgcalls',
      defaultStars: 117,
      defaultForks: 43
    }
  ];

  repoStatsConfig.forEach((item) => {
    const card = document.createElement('a');
    card.classList.add('hero-repo-stat-card');
    card.href = item.url;
    card.target = '_blank';
    card.rel = 'noopener';
    card.title = `View ${item.name} on GitHub`;

    const repoHeader = document.createElement('div');
    repoHeader.classList.add('repo-name-group');
    repoHeader.appendChild(iconsManager.get('socials', 'github'));
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('repo-title');
    nameSpan.textContent = item.name;
    repoHeader.appendChild(nameSpan);

    const statsGroup = document.createElement('div');
    statsGroup.classList.add('repo-stats-pills');

    const starPill = document.createElement('div');
    starPill.classList.add('repo-stat-pill', 'stars-pill');
    starPill.title = `${item.name} Stars on GitHub`;
    starPill.appendChild(iconsManager.get('main', 'star'));
    const starCount = document.createElement('span');
    starCount.classList.add('stat-count');
    starCount.textContent = formatStatCount(item.defaultStars);
    starPill.appendChild(starCount);

    const forkPill = document.createElement('div');
    forkPill.classList.add('repo-stat-pill', 'forks-pill');
    forkPill.title = `${item.name} Forks on GitHub`;
    forkPill.appendChild(iconsManager.get('main', 'codeFork'));
    const forkCount = document.createElement('span');
    forkCount.classList.add('stat-count');
    forkCount.textContent = formatStatCount(item.defaultForks);
    forkPill.appendChild(forkCount);

    statsGroup.appendChild(starPill);
    statsGroup.appendChild(forkPill);

    card.appendChild(repoHeader);
    card.appendChild(statsGroup);
    heroActions.appendChild(card);

    requestsManager.getGitHubRepoStats(item.repo).then((stats) => {
      if (stats) {
        if (typeof stats.stars === 'number') {
          starCount.textContent = formatStatCount(stats.stars);
        }
        if (typeof stats.forks === 'number') {
          forkCount.textContent = formatStatCount(stats.forks);
        }
      }
    });
  });

  heroTexts.appendChild(heroActions);
  heroLeft.appendChild(heroTexts);
  heroCard.appendChild(heroLeft);

  const heroRight = document.createElement('div');
  heroRight.classList.add('hero-right');
  heroRight.innerHTML = `
    <div class="hero-mockup-wrapper">
      <div class="hero-mockup-card">
        <div class="mockup-header">
          <span class="mockup-tag">Changelog</span>
          <span class="mockup-pill">v2.3.0</span>
        </div>
        <div class="mockup-content">
          <div class="mockup-heading">What's Changed</div>
          <p class="mockup-paragraph">Stream optimizations, stability fixes, and improved call lifecycle handling.</p>
        </div>
        <div class="mockup-refresh-icon">
          ${iconsManager.get('main', 'refresh').outerHTML}
        </div>
      </div>
      <div class="hero-note">
        <span class="note-text">Better Calls Every Release</span>
        <svg class="note-arrow" viewBox="0 0 65 45" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M55 6 C38 6, 22 20, 12 38" stroke="#79c0ff" stroke-width="1.8" stroke-dasharray="3.5 3.5"/>
          <path d="M6 30 L11 39 L21 34" stroke="#79c0ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  `;
  heroCard.appendChild(heroRight);
  currentElement.appendChild(heroCard);

  // 4. Filter Bar
  const filterBar = document.createElement('div');
  filterBar.classList.add('changelog-filter-bar');

  const filterOptions = [
    { id: 'all', label: 'All', icon: 'layerGroup' },
    { id: 'major', label: 'Major Releases', icon: 'rocket' },
    { id: 'minor', label: 'Minor Updates', icon: 'tag' },
    { id: 'bugfix', label: 'Bug Fixes', icon: 'bug' },
    { id: 'improvements', label: 'Improvements', icon: 'chart' }
  ];

  filterOptions.forEach((opt, idx) => {
    const pill = document.createElement('button');
    pill.classList.add('filter-pill');
    if (idx === 0) pill.classList.add('active');
    pill.setAttribute('data-filter', opt.id);
    pill.appendChild(iconsManager.get('main', opt.icon));
    pill.appendChild(document.createTextNode(' ' + opt.label));
    filterBar.appendChild(pill);
  });
  currentElement.appendChild(filterBar);

  // 5. Cards list
  const cardsContainer = document.createElement('div');
  cardsContainer.classList.add('changelog-cards-list');

  let categories = [...currentPage.querySelectorAll('category, CATEGORY, Category')];
  if (categories.length === 0) {
    const banners = [...currentPage.querySelectorAll('banner, BANNER, Banner')];
    categories = banners.map(b => b.parentElement || b);
  }

  let releaseIndex = 0;

  categories.forEach((cat) => {
    const banner = cat.querySelector('banner, BANNER, Banner') || (cat.tagName && cat.tagName.toUpperCase() === 'BANNER' ? cat : null);
    const subtext = cat.querySelector('subtext, SUBTEXT, Subtext');
    if (!banner) return;

    const version = banner.getAttribute('version') || banner.getAttribute('VERSION') || '2.3.0';
    const minititle = banner.getAttribute('minititle') || banner.getAttribute('MINITITLE') || 'MINOR UPDATE';
    const bigtitle = banner.getAttribute('bigtitle') || banner.getAttribute('BIGTITLE') || ('PyTgCalls v' + version);
    const description = banner.getAttribute('description') || banner.getAttribute('DESCRIPTION') || '';
    const cleanVersion = bigtitle.replace(/^PyTgCalls\s+/i, '').trim();

    const meta = CHANGELOG_METADATA[cleanVersion] || CHANGELOG_METADATA[version] || {
      date: '2026',
      type: minititle.toLowerCase().includes('major') ? 'major' : (minititle.toLowerCase().includes('patch') || minititle.toLowerCase().includes('bug') ? 'bugfix' : (minititle.toLowerCase().includes('improve') ? 'improvements' : 'minor')),
      label: minititle.charAt(0) + minititle.slice(1).toLowerCase(),
      icon: minititle.toLowerCase().includes('major') ? 'rocket' : (minititle.toLowerCase().includes('patch') || minititle.toLowerCase().includes('bug') ? 'bug' : (minititle.toLowerCase().includes('improve') ? 'chart' : 'tag')),
      color: minititle.toLowerCase().includes('major') ? 'green' : (minititle.toLowerCase().includes('patch') || minititle.toLowerCase().includes('bug') ? 'blue' : (minititle.toLowerCase().includes('improve') ? 'orange' : 'purple')),
      isLatest: releaseIndex === 0
    };

    const card = document.createElement('div');
    card.classList.add('changelog-release-card');
    card.setAttribute('data-category', meta.type);
    card.id = 'version-' + cleanVersion.replace(/[^a-zA-Z0-9]/g, '-');

    // Header
    const header = document.createElement('div');
    header.classList.add('changelog-card-header');

    // Icon Badge
    const iconBadge = document.createElement('div');
    iconBadge.classList.add('changelog-icon-badge', meta.color);
    iconBadge.appendChild(iconsManager.get('main', meta.icon));
    header.appendChild(iconBadge);

    // Info
    const info = document.createElement('div');
    info.classList.add('changelog-card-info');

    const titleRow = document.createElement('div');
    titleRow.classList.add('changelog-title-row');

    const vTitle = document.createElement('span');
    vTitle.classList.add('changelog-version-name', 'big-title');
    vTitle.textContent = cleanVersion;
    titleRow.appendChild(vTitle);

    if (meta.isLatest || releaseIndex === 0) {
      const latestBadge = document.createElement('span');
      latestBadge.classList.add('changelog-tag-latest');
      latestBadge.textContent = 'Latest';
      titleRow.appendChild(latestBadge);
    }
    info.appendChild(titleRow);

    const metaText = document.createElement('div');
    metaText.classList.add('changelog-card-meta');
    metaText.textContent = `${meta.date} · ${meta.label}`;
    info.appendChild(metaText);

    if (description) {
      const descText = document.createElement('div');
      descText.classList.add('changelog-card-desc');
      descText.textContent = description;
      info.appendChild(descText);
    }

    header.appendChild(info);

    // Details button
    const detailsBtn = document.createElement('a');
    detailsBtn.classList.add('changelog-btn-details');
    const btnTitle = banner.getAttribute('presentationbuttontitle') || 'View Details';
    detailsBtn.textContent = btnTitle + ' ';
    const btnArrow = iconsManager.get('main', 'arrowRight');
    detailsBtn.appendChild(btnArrow);

    const presentationUrl = banner.getAttribute('presentationbuttonurl');
    const releaseUrl = presentationUrl || meta.releaseUrl || ('https://pypi.org/project/py-tgcalls/' + cleanVersion.replace(/^v/i, ''));
    detailsBtn.href = releaseUrl;
    detailsBtn.target = '_blank';
    detailsBtn.rel = 'noopener';
    header.appendChild(detailsBtn);

    card.appendChild(header);

    // Accordion Toggle
    const accordionToggle = document.createElement('div');
    accordionToggle.classList.add('changelog-accordion-toggle');
    const chevron = iconsManager.get('main', 'chevronDown');
    chevron.classList.add('toggle-chevron');
    accordionToggle.appendChild(chevron);
    accordionToggle.appendChild(document.createTextNode(" What's new?"));

    // Accordion Body
    const detailsBody = document.createElement('div');
    detailsBody.classList.add('changelog-details-body');

    if (releaseIndex === 0) {
      accordionToggle.classList.add('is-open');
      detailsBody.classList.add('is-open');
    }

    accordionToggle.addEventListener('click', () => {
      const isOpen = accordionToggle.classList.toggle('is-open');
      detailsBody.classList.toggle('is-open', isOpen);
    });

    const imageUrl = banner.getAttribute('imageurl') || banner.getAttribute('IMAGEURL');
    if (imageUrl) {
      const bannerImg = document.createElement('img');
      bannerImg.classList.add('changelog-banner-img');
      bannerImg.src = imageUrl;
      bannerImg.alt = cleanVersion;
      bannerImg.loading = 'lazy';
      detailsBody.appendChild(bannerImg);
    }

    if (subtext) {
      try {
        handleRecursive(subtext, detailsBody);
      } catch (subErr) {
        console.warn('Error parsing subtext for changelog:', subErr);
      }
    }

    card.appendChild(accordionToggle);
    card.appendChild(detailsBody);

    cardsContainer.appendChild(card);
    releaseIndex++;
  });

  currentElement.appendChild(cardsContainer);

  // Filter interaction
  filterBar.querySelectorAll('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      filterBar.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.getAttribute('data-filter');
      cardsContainer.querySelectorAll('.changelog-release-card').forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter || (filter === 'minor' && cat === 'minor') || (filter === 'major' && cat === 'major') || (filter === 'bugfix' && (cat === 'bugfix' || cat === 'patch')) || (filter === 'improvements' && (cat === 'minor' || cat === 'improvements'))) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

export function handleRecursive(currentDom, elementDom) {
  tryToReduceTags(currentDom);

  for (const element of currentDom.childNodes) {
    if (element instanceof Text) {
      elementDom.appendChild(emojisParser.parse(element.textContent));
    } else if (element.nodeType === 8) {
      // Ignore XML/HTML comment nodes
      continue;
    } else if (!element.tagName || !syntaxManager.AVAILABLE_ELEMENTS.includes(element.tagName.toUpperCase())) {
      console.warn("Unrecognized or custom element:", element.tagName);
      const fallbackDiv = document.createElement('div');
      handleRecursive(element, fallbackDiv);
      elementDom.appendChild(fallbackDiv);
    } else {
      let newElement = document.createElement('div');
      newElement = checkAndManageElement(element, newElement, elementDom);

      let containsCustomTags = false;
      for (const data of element.querySelectorAll('*')) {
        if (!(data instanceof Text) && data.tagName.toUpperCase() !== syntaxManager.BR) {
          containsCustomTags = true;
          break;
        }
      }

      if (element.hasAttribute('noref')) {
        newElement.setAttribute('noref', element.getAttribute('noref'));
      }

      if ([syntaxManager.TEXT, syntaxManager.TABLE_ITEM].includes(element.tagName.toUpperCase())) {
        const spacesMultiplier = '<br/>'.repeat(element.tagName.toUpperCase() === syntaxManager.TABLE_ITEM ? 1 : 2);
        if (typeof element.innerHTML === 'string') {
          element.innerHTML = element.innerHTML.replaceAll('\n\n', spacesMultiplier);
          containsCustomTags = true;
        }
      }

      if ([syntaxManager.SYNTAX_HIGHLIGHT, syntaxManager.SYNTAX_HIGHLIGHT_INLINE].includes(element.tagName.toUpperCase())) {
        if (containsCustomTags) {
          throw new Error("Syntax highlight can't contain other tags");
        }

        newElement = handleSyntaxHighlight(element, newElement, false, '', element.tagName.toUpperCase() === syntaxManager.SYNTAX_HIGHLIGHT_INLINE);
        elementDom.appendChild(newElement);
      } else if (element.tagName.toUpperCase() === syntaxManager.GITHUB_REF) {
        handleGithubRef(newElement);
        elementDom.appendChild(newElement);
      } else if (element.tagName.toUpperCase() === syntaxManager.MULTI_SYNTAX) {
        handleMultiSyntax(element, newElement);
        elementDom.appendChild(newElement);
      } else if (element.tagName.toUpperCase() === syntaxManager.LANG_TABS) {
        handleLangTabs(element, newElement);
        elementDom.appendChild(newElement);
      } else if (element.tagName.toUpperCase() === syntaxManager.LANG_BLOCK) {
        handleRecursive(element, newElement);
        handleLangBlock(element, newElement);
        elementDom.appendChild(newElement);
      } else if (element.tagName.toUpperCase() === syntaxManager.BANNER || element.tagName.toUpperCase() === syntaxManager.BANNER_PEER_2_PEER) {
        if (containsCustomTags) {
          throw new Error("Banner can't contain other tags");
        }

        elementDom.appendChild(handlePostQueryElement(element, newElement));
      } else if (element.tagName.toUpperCase() === syntaxManager.SEARCH_HIGHLIGHT) {
        const markElement = document.createElement('span');
        markElement.classList.add('ids');
        markElement.innerHTML = element.innerHTML;
        elementDom.appendChild(markElement);
      } else {
        if (containsCustomTags) {
          handleRecursive(element, newElement);
        } else {
          newElement.appendChild(emojisParser.parse(element.textContent));
        }

        newElement = handlePostQueryElement(element, newElement);
        elementDom.appendChild(newElement);
      }
    }
  }
}

function updateTabsIndicator(tabsContainer) {
  const active = tabsContainer.querySelector('.tab.active');

  if (!active) {
    return;
  }

  tabsContainer.style.setProperty('--tab-x', active.offsetLeft + 'px');
  tabsContainer.style.setProperty('--tab-w', active.offsetWidth + 'px');
}

function handleLangTabs(element, newElement) {
  const group = element.getAttribute('id') || LANG_BLOCK_GROUP;
  const languages = [...element.parentElement.querySelectorAll('lang-block')]
      .map((block) => block.getAttribute('language'))
      .filter((language, id, list) => language && list.indexOf(language) === id);

  if (!languages.length) {
    throw new Error('lang-tabs requires sibling lang-block elements');
  }

  newElement.classList.add('multisyntax', 'lang-tabs');

  const tabsContainer = document.createElement('div');
  tabsContainer.classList.add('tabs');
  tabsContainer.style.setProperty('--i', languages.length);
  newElement.appendChild(tabsContainer);

  for (const [id, language] of languages.entries()) {
    const tabElement = document.createElement('div');
    tabElement.classList.add('tab');
    tabElement.textContent = LANGUAGE_NAMES[language] || language;
    tabElement.addEventListener('click', () => {
      const currentState = homePage.onChangeFavoriteSyntaxTab.ultimateDataCall || {};
      currentState[group] = language;
      homePage.onChangeFavoriteSyntaxTab.callAllListeners(currentState);
      localStorage.setItem('currentTabDataIndexes', JSON.stringify(currentState));
    });
    tabsContainer.appendChild(tabElement);

    homePage.onChangeFavoriteSyntaxTab.addListener({
      callback: (data) => {
        const currentLanguage = data[group];
        const isActive = currentLanguage ? currentLanguage === language : !id;
        tabElement.classList.toggle('active', isActive);
        if (isActive) {
          tabsContainer.style.setProperty('--eid', String(id));
          updateTabsIndicator(tabsContainer);
        }
      },
      ref: tabElement,
      recallWithCurrentData: true,
    });
  }

  new ResizeObserver(() => updateTabsIndicator(tabsContainer)).observe(tabsContainer);
}

function handleLangBlock(element, newElement) {
  const language = element.getAttribute('language');

  if (!language) {
    throw new Error('lang-block requires a language attribute');
  }

  newElement.classList.add('lang-block');

  homePage.onChangeFavoriteSyntaxTab.addListener({
    callback: (data) => {
      const currentLanguage = data[LANG_BLOCK_GROUP];
      const isActive = currentLanguage ? currentLanguage === language : element.hasAttribute('default');
      newElement.classList.toggle('hidden', !isActive);
    },
    ref: newElement,
    recallWithCurrentData: true,
  });
}

export function detectLanguageByElement(element) {
  let language = {
    prism: Prism.languages.python,
    name: 'Python',
    icon: {
      category: 'languages',
      name: 'python',
    }
  };

  if (element.hasAttribute('language')) {
    switch (element.getAttribute('language')) {
      case 'go':
        language.prism = Prism.languages.go;
        language.name = 'Go';
        language.icon.name = 'go';
        break;
      case 'c':
        language.prism = Prism.languages.c;
        language.name = 'C';
        language.icon.name = 'c';
        break;
      case 'cpp':
        language.prism = Prism.languages.cpp;
        language.name = 'C++';
        language.icon.name = 'cpp';
        break;
      case 'bash':
        // noinspection JSUnresolvedReference
        language.prism = Prism.languages.bash;
        language.name = 'Bash';
        language.icon.name = '';
        break;
      case 'java':
        language.prism = Prism.languages.java;
        language.name = 'Java';
        language.icon.name = 'java';
        break;

      case 'javascript':
        language.prism = Prism.languages.javascript;
        language.name = 'JavaScript';
        language.icon.name = '';
        break;

      case 'rust':
        language.prism = Prism.languages.rust;
        language.name = 'Rust';
        language.icon.name = '';
        break;
    }
  }

  return language;
}

export function getLanguageColorByName(name) {
  // reference: https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml
  switch (name) {
    case 'Python':
      return '#3572A5';
    case 'Go':
      return '#00ADD8';
    case 'C':
      return '#555555';
    case 'C++':
      return '#f34b7d';
    case 'PHP':
      return '#4F5D95';
    case 'TypeScript':
      return '#3178c6';
    case 'Rust':
      return '#dea584';
    default:
      return '#000000';
  }
}

function checkAndManageElement(element, newElement, elementDom) {
  if (element.tagName.toUpperCase() === syntaxManager.LINK) {
    newElement = document.createElement('a');
    const href = element.getAttribute('href') || '#';
    newElement.href = href;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      newElement.target = '_blank';
      newElement.rel = 'noopener';
    }
  } else if (element.tagName.toUpperCase() === syntaxManager.BANNER) {
    newElement.classList.add('banner');

    const isValidQuery = (
      element.getAttribute('imageurl')
      && element.hasAttribute('imageheight') && !isNaN(parseInt(element.getAttribute('imageheight')))
      && element.hasAttribute('imagewidth') && !isNaN(parseInt(element.getAttribute('imagewidth')))
      && element.getAttribute('minititle')
      && element.getAttribute('bigtitle')
      && element.getAttribute('description')
      && element.getAttribute('version')
      && element.hasAttribute('mainbg') && element.getAttribute('mainbg').startsWith('#')
    );

    if (isValidQuery) {
      newElement.style.setProperty('--mainbg', element.getAttribute('mainbg'));

      const mainImage = document.createElement('img');
      mainImage.classList.add('main-image');
      mainImage.loading = 'lazy';
      mainImage.style.setProperty('--width', element.getAttribute('imagewidth'));
      mainImage.style.setProperty('--height', element.getAttribute('imageheight'));
      mainImage.src = element.getAttribute('imageurl');

      const miniTitleContainer = document.createElement('div');
      miniTitleContainer.classList.add('mini-title');
      miniTitleContainer.appendChild(emojisParser.parse(element.getAttribute('minititle')));
      const bigTitleContainer = document.createElement('div');
      bigTitleContainer.classList.add('big-title');
      bigTitleContainer.appendChild(emojisParser.parse(element.getAttribute('bigtitle')));
      const bottomContainer = document.createElement('div');
      bottomContainer.classList.add('bottom-container');
      bottomContainer.appendChild(miniTitleContainer);
      bottomContainer.appendChild(bigTitleContainer);

      const imageLoaderItem = utils.createLoadingItem();

      const bannerContainer = document.createElement('div');
      bannerContainer.classList.add('banner-container');
      bannerContainer.appendChild(mainImage);
      bannerContainer.appendChild(imageLoaderItem);
      bannerContainer.appendChild(bottomContainer);
      newElement.appendChild(bannerContainer);

      mainImage.addEventListener('load', () => {
        imageLoaderItem.remove();
        mainImage.classList.add('loaded');
      }, { once: true });

      const descriptionContainer = document.createElement('div');
      descriptionContainer.classList.add('description');
      descriptionContainer.appendChild(emojisParser.parse(element.getAttribute('description')));
      newElement.appendChild(descriptionContainer);

      const presentationTitle = document.createElement('div');
      presentationTitle.classList.add('pres-title');
      presentationTitle.textContent = element.getAttribute('presentationtitle') || 'PyTgCalls';
      const presentationDescription = document.createElement('div');
      presentationDescription.classList.add('pres-description');
      presentationDescription.textContent = element.getAttribute('presentationdescription') || 'Async client API for the Telegram calls';
      const presentation = document.createElement('div');
      presentation.classList.add('lib-details');
      presentation.appendChild(presentationTitle);
      presentation.appendChild(presentationDescription);

      const leftIcon = document.createElement('img');
      leftIcon.classList.add('icon');
      leftIcon.src = element.getAttribute('presentationimage') || '/src/assets/pytgcalls.svg';

      const presContainer = document.createElement('div');
      presContainer.classList.add('presentation-data');
      presContainer.appendChild(leftIcon);
      presContainer.appendChild(presentation);

      const updateButton = document.createElement('a');
      updateButton.classList.add('update');
      updateButton.target = '_blank';
      updateButton.textContent = element.getAttribute('presentationbuttontitle') || 'Update';

      if (element.hasAttribute('presentationbuttonurl') && element.getAttribute('presentationbuttonurl').startsWith('https://')) {
        updateButton.href = element.getAttribute('presentationbuttonurl');
      } else {
        const currentVersion = element.getAttribute('version');
        if (currentVersion && currentVersion.endsWith('X')) {
          const searchForVersion = currentVersion.replace(/X+$/g, '');
          if (searchForVersion !== '') {
            requestsManager.retrievePackageData().then((data) => {
              for (const key of Object.keys(data['releases']).reverse()) {
                if (key.startsWith(searchForVersion)) {
                  updateButton.href = 'https://pypi.org/project/py-tgcalls/' + key;
                  break;
                }
              }
            });
          }
        } else if (currentVersion) {
          updateButton.href = 'https://pypi.org/project/py-tgcalls/' + currentVersion;
        }
      }

      const libPresentationRow = document.createElement('div');
      libPresentationRow.classList.add('lib-presentation');
      libPresentationRow.appendChild(presContainer);
      libPresentationRow.appendChild(updateButton);
      newElement.appendChild(libPresentationRow);
    } else {
      console.warn("Invalid banner data, rendering minimal placeholder");
    }
  } else if (element.tagName.toUpperCase() === syntaxManager.LIST) {
    newElement = document.createElement('ul');

    if (element.getAttribute('style') === 'numbers') {
      newElement.classList.add('with-numbers');
    }
  } else if (element.tagName.toUpperCase() === syntaxManager.TABLE_ITEM && elementDom.tagName === 'UL') {
    newElement = document.createElement('li');
  } else if (syntaxManager.BOLD.includes(element.tagName.toUpperCase())) {
    newElement = document.createElement('b');
  } else if (syntaxManager.ITALIC.includes(element.tagName.toUpperCase())) {
    newElement = document.createElement('i');
  } else if (element.tagName.toUpperCase() === syntaxManager.BR) {
    newElement = document.createElement('br');
  } else if (element.tagName.toUpperCase() === syntaxManager.CATEGORY_TITLE) {
    newElement.classList.toggle(element.tagName.toLowerCase());

    let newContent = element.innerHTML.replaceAll('\n', '<br/>');
    if (newContent.startsWith('<br/>')) {
      newContent = newContent.slice(5);
    }
    element.innerHTML = newContent;
  } else if (element.tagName.toUpperCase() === syntaxManager.TABLE) {
    newElement = document.createElement('table');
  } else if (element.tagName.toUpperCase() === syntaxManager.TABLE_DEFINITIONS) {
    newElement = document.createElement('tr');
    newElement.classList.add('as-definitions');
  } else if (element.tagName.toUpperCase() === syntaxManager.TABLE_ITEM && elementDom.tagName === syntaxManager.TABLE) {
    newElement = document.createElement('tr');
  } else if (element.tagName.toUpperCase() === syntaxManager.TABLE_COLUMN) {
    if (elementDom.classList.contains('as-definitions')) {
      newElement = document.createElement('th');
    } else {
      newElement = document.createElement('td');
    }
  } else if (element.tagName.toUpperCase() === syntaxManager.DOCS_REF) {
    newElement.classList.add('docs-ref');
    newElement.addEventListener('click', () => {
      if (element.hasAttribute('link')) {
        homePage.handleAsRedirect(element.getAttribute('link'));
      } else {
        throw new Error('invalid link for docs-ref');
      }
    });
  } else if (element.tagName.toUpperCase() === syntaxManager.GITHUB_REF) {
    newElement = document.createElement('a');
    newElement.classList.add('github-ref');
    newElement.target = '_blank';

    if (!element.hasAttribute('reponame') || !element.hasAttribute('user')) {
      throw new Error('invalid repository name/user for github-ref');
    }

    newElement.setAttribute('reponame', element.getAttribute('reponame'));
    newElement.setAttribute('user', element.getAttribute('user'));
  } else if (element.tagName.toUpperCase() === syntaxManager.EXAMPLE_REF) {
    newElement = document.createElement('a');
    newElement.classList.add('ref-shi');
    newElement.target = '_blank';

    if (!element.hasAttribute('url')) {
      throw new Error('invalid data for ref-shi');
    }

    newElement.href = 'https://github.com/pytgcalls/pytgcalls/tree/master/' + element.getAttribute('url');
  } else {
    newElement.classList.toggle(element.tagName.toLowerCase());
  }

  return newElement;
}

export function tryToReduceTags(element) {
  if (!element || !element.querySelectorAll) return;

  const handleItem = (child) => {
    const optionId = child.getAttribute('id');
    const currentOptionData = config.getOptionValueByIdSync(optionId);

    if (currentOptionData) {
      const isComplex = config.isComplexOptionValueByIdSync(optionId);

      if (isComplex) {
        const fragment = document.createDocumentFragment();
        fragment.append(...currentOptionData.cloneNode(true).childNodes);
        child.replaceWith(fragment);
      } else {
        child.replaceWith(document.createTextNode(currentOptionData.textContent));
      }
    } else {
      console.warn("A config key that doesn't exist has been requested: " + optionId);
      child.remove();
    }
  };

  if (element.tagName && element.tagName.toUpperCase() === syntaxManager.CONFIG) {
    handleItem(element);
  }

  for (const child of element.querySelectorAll('config')) {
    handleItem(child);
  }
}

function handlePostQueryElement(element, newElement) {
  if ([syntaxManager.H1, syntaxManager.H2, syntaxManager.H3, syntaxManager.BANNER].includes(element.tagName.toUpperCase())) {
    let destElement = newElement;
    if (element.tagName.toUpperCase() === syntaxManager.BANNER) {
      const bigTitle = newElement.querySelector('.bottom-container > .big-title');
      if (bigTitle) {
        destElement = bigTitle;
      } else {
        return;
      }
    }

    destElement.classList.add('has-hashtag-ref');
    destElement.addEventListener('click', () => {
      const ref = utils.generateSectionRefByTextContent(destElement.textContent);
      window.history.pushState('', '', '#' + ref);
      newElement.scrollIntoView();
    });
  } else if (element.tagName.toUpperCase() === syntaxManager.ALERT) {
    const elementHeaderText = document.createElement('div');
    elementHeaderText.classList.add('alert-title');
    const elementHeader = document.createElement('div');
    elementHeader.classList.add('alert-header');
    elementHeader.appendChild(elementHeaderText);

    const elementData = document.createElement('div');
    elementData.classList.add('alert-content');
    elementData.append(...newElement.childNodes);

    const compElement = document.createElement('div');
    compElement.classList.add('alert');
    compElement.appendChild(elementHeader);
    compElement.appendChild(elementData);

    if (['note', 'warning', 'important'].includes(element.getAttribute('type'))) {
      compElement.dataset.type = element.getAttribute('type');

      switch (element.getAttribute('type')) {
        case 'important':
          elementHeader.prepend(iconsManager.get('main', 'important'));
          elementHeaderText.textContent = 'Important!';
          break;
        case 'note':
          elementHeader.prepend(iconsManager.get('main', 'note'));
          elementHeaderText.textContent = 'Note';
          break;
        case 'warning':
          elementHeader.prepend(iconsManager.get('main', 'warning'));
          elementHeaderText.textContent = 'Warning!';
          break;
      }

    } else {
      throw new Error("An unknown type has been specified for ALERT element");
    }

    newElement.replaceWith(compElement);
    return compElement;
  } else if (element.tagName.toUpperCase() === syntaxManager.BANNER_PEER_2_PEER) {
    const elementHeaderText = document.createElement('div');
    elementHeaderText.classList.add('alert-title');
    elementHeaderText.textContent = 'Security';
    const elementHeader = document.createElement('div');
    elementHeader.classList.add('alert-header');
    elementHeader.appendChild(iconsManager.get('main', 'check'));
    elementHeader.appendChild(elementHeaderText);

    const elementLockAnimation = document.createElement('img');
    elementLockAnimation.setAttribute('loading', 'lazy');
    elementLockAnimation.src = '/src/assets/speed.gif';

    const elementTitle = document.createElement('div');
    elementTitle.classList.add('alert-title');
    elementTitle.appendChild(document.createTextNode("Don't give up on safety and speed!"));

    const elementData = document.createElement('div');
    elementData.classList.add('alert-content');
    elementData.textContent = "Calls that are made through NTgCalls are 100% encrypted as if you were making them from your trusted Telegram app. All this in just a few lines of code, thanks to the work of our amazing team.";

    const compElement = document.createElement('div');
    compElement.classList.add('alert');
    compElement.dataset.type = 'p2p';
    compElement.appendChild(elementHeader);
    compElement.appendChild(elementLockAnimation);
    compElement.appendChild(elementTitle);
    compElement.appendChild(elementData);

    newElement.replaceWith(compElement);
    return compElement;
  }

  return newElement;
}

function handleSyntaxHighlight(element, newElement, hideTags = false, customTextContent = '', forceDisableCollapse = false) {
  let code = customTextContent || element.textContent;
  // noinspection JSUnresolvedReference
  code = Prism.highlight(code, detectLanguageByElement(element).prism, 'html');
  code = code.replaceAll('\n', '<br/>');

  if (code.startsWith('<br/>')) {
    code = code.slice(5);
  }

  const rows = code.split('<br/>').length;

  code = handleTabsWithSpacer(code);
  newElement.innerHTML = code;
  newElement.style.setProperty('--length', String(rows - 1));

  const updateMark = (startAt, endAt) => {
    newElement.style.setProperty('--start-mark', startAt);
    newElement.style.setProperty('--offset-mark', String(endAt - startAt));
    newElement.classList.add('has-mark');
  };

  let hasValidMarkParameter = false;
  if (element.hasAttribute('mark')) {
    const markData = element.getAttribute('mark');
    if (markData.indexOf('-') === -1) {
      const startAt = parseInt(markData);

      if (!isNaN(startAt)) {
        hasValidMarkParameter = true;
        updateMark(startAt, startAt);
      }
    } else {
      const startAt = parseInt(markData.split('-')[0]);
      const endAt = parseInt(markData.split('-')[1]);

      if (!isNaN(startAt) && !isNaN(endAt)) {
        hasValidMarkParameter = true;
        updateMark(Math.min(startAt, endAt), Math.max(startAt, endAt));
      }
    }
  }

  if (element.tagName.toUpperCase() !== syntaxManager.SYNTAX_HIGHLIGHT_INLINE && !hideTags && !hasValidMarkParameter && rows > 2) {
    let successTimeout;

    const languageTagText = document.createElement('span');
    languageTagText.textContent = detectLanguageByElement(element).name;
    const languageTag = document.createElement('div');
    languageTag.classList.add('tag');
    languageTag.appendChild(iconsManager.get('main', 'code'));
    languageTag.appendChild(languageTagText);

    const copyTagSuccess = iconsManager.get('main', 'check');
    copyTagSuccess.classList.add('success');
    const copyTagText = document.createElement('span');
    copyTagText.textContent = 'Copy';
    const copyTag = document.createElement('div');
    copyTag.classList.add('tag', 'is-clickable');
    copyTag.addEventListener('click', () => {
      utils.copyToClipboard(element.textContent).then(() => {
        if (successTimeout) {
          clearTimeout(successTimeout);
        }

        copyTag.classList.add('success');
        successTimeout = setTimeout(() => {
          copyTag.classList.remove('success');
          successTimeout = undefined;
        }, 3000);
      }).catch(() => {

      });
    });
    copyTag.appendChild(copyTagSuccess);
    copyTag.appendChild(iconsManager.get('main', 'copy'));
    copyTag.appendChild(copyTagText);

    const tagsContainer = document.createElement('div');
    tagsContainer.classList.add('tags-container');
    tagsContainer.appendChild(languageTag);
    tagsContainer.appendChild(copyTag);
    newElement.appendChild(tagsContainer);
  }

  return forceDisableCollapse ? newElement : updateSyntaxHighlightWithCollapsable(newElement, rows);
}

function updateSyntaxHighlightWithCollapsable(element, rows) {
  const isExpandable = rows > 12 && getCollapseLongCodeStatus();

  const expandableView = document.createElement('div');
  expandableView.classList.add('expandable');
  expandableView.addEventListener('click', () => externalContainer.classList.add('expanded', 'with-animation'));

  const inner = document.createElement('div');
  inner.classList.add('expandable-inner');
  inner.appendChild(iconsManager.get('main', 'chevronDown').firstChild);

  const label = document.createElement('span');
  label.textContent = 'Click to expand';
  inner.appendChild(label);

  expandableView.appendChild(inner);

  const externalContainer = document.createElement('div');
  externalContainer.classList.add('external-sh');
  externalContainer.classList.toggle('expanded', !isExpandable);
  externalContainer.classList.toggle('is-expandable', isExpandable);
  externalContainer.appendChild(element);
  isExpandable && externalContainer.appendChild(expandableView);

  return externalContainer;
}

function handleTabsWithSpacer(code) {
  let firstRowSpacesCount = 0;
  const firstRow = code.split('<br/>')[0];
  for (let char of firstRow) {
    if (char === ' ') {
      firstRowSpacesCount++;
    } else {
      break;
    }
  }

  let baseString = ' '.repeat(firstRowSpacesCount);

  for (let i = 20; i > 1; i--) {
    const newSpacer = baseString + (' '.repeat(i));
    const replacer = '<div class="spacer" style="--id: ' + i + '">&nbsp;</div>';
    code = code.replaceAll(newSpacer, replacer);
  }

  return code;
}

function handleMultiSyntax(element, newElement) {
  const exportAsBlame = element.hasAttribute('as-blame');

  if (!element.getAttribute('id') && !exportAsBlame) {
    throw new Error('multisyntax must have id tag');
  }

  if (!element.querySelector('tabs > tab') && !exportAsBlame) {
    throw new Error('multisyntax must contains tabs');
  }

  if (!element.querySelector('syntax-highlight')) {
    throw new Error('multisyntax must contains syntax highlight elements');
  }

  if (exportAsBlame && element.querySelectorAll('syntax-highlight').length !== 2) {
    throw new Error('multisyntax must contains 2 elements to enable as-blame-mode');
  }

  newElement.classList.add('multisyntax');

  if (exportAsBlame) {
    const syntaxHighlightElements = element.querySelectorAll('syntax-highlight');

    const firstElement = syntaxHighlightElements[0];
    const secondElement = syntaxHighlightElements[1];

    if (detectLanguageByElement(firstElement).name !== detectLanguageByElement(secondElement).name) {
      throw new Error('multisyntax as-blame-mode must contains 2 elements with the same language property');
    }

    if (firstElement.hasAttribute('mark') || secondElement.hasAttribute('mark')) {
      throw new Error('multisyntax as-blame-mode doesn\'t support mark property');
    }

    // noinspection JSUnresolvedReference
    requestAnimationFrame(() => {
      tryToReduceTags(firstElement);
      tryToReduceTags(secondElement);

      const firstElementLines = firstElement.textContent.split("\n");
      const secondElementLines = secondElement.textContent.split("\n");
      const diff = patienceDiff(firstElementLines, secondElementLines);

      let addedRows = [];
      let removedRows = [];
      let finalCode = '';
      let i = 0;
      for (const line of diff.lines) {
        if (line.aIndex < 0) { // added row
          addedRows.push(i);
        } else if (line.bIndex < 0) { // removed row
          removedRows.push(i);
        }

        i++;

        finalCode += line.line + "\n";
      }
      if (finalCode.endsWith("\n")) {
        finalCode = finalCode.slice(0, -2);
      }

      const fakeResyntaxElement = firstElement.cloneNode(false);
      fakeResyntaxElement.innerHTML = finalCode;

      let containsCustomTags = false;
      for (const data of fakeResyntaxElement.querySelectorAll('*')) {
        if (!(data instanceof Text) && data.tagName.toUpperCase() !== syntaxManager.BR) {
          containsCustomTags = true;
          break;
        }
      }

      if (containsCustomTags) {
        throw new Error("Syntax highlight can't contain other tags");
      }

      const internalElement = document.createElement('div');
      newElement.classList.remove('multisyntax');
      internalElement.classList.add('syntax-highlight');
      internalElement.classList.add('has-blame');
      handleSyntaxHighlight(fakeResyntaxElement, internalElement, true, finalCode, true);

      newElement.classList.add('external-sh', 'expanded');
      newElement.appendChild(internalElement);

      for (const addedRow of addedRows) {
        const tempMark = document.createElement('div');
        tempMark.classList.add('temp-mark', 'added-row');
        tempMark.style.setProperty('--start-mark', addedRow);
        internalElement.appendChild(tempMark);
      }

      for (const addedRow of removedRows) {
        const tempMark = document.createElement('div');
        tempMark.classList.add('temp-mark', 'removed-row');
        tempMark.style.setProperty('--start-mark', addedRow);
        internalElement.appendChild(tempMark);
      }
    });

    return;
  }

  const tabsContainer = document.createElement('div');
  tabsContainer.classList.add('tabs');
  tabsContainer.style.setProperty('--i', element.querySelectorAll('tabs > tab').length);
  newElement.appendChild(tabsContainer);

  let tabIds = [];
  for (const [id, tab] of Object.entries(element.querySelectorAll('tabs > tab'))) {
    if (!tab.textContent || !tab.getAttribute('id')) {
      throw new Error('tab has invalid data for multisyntax');
    }

    tabIds.push(tab.getAttribute('id'));

    const tabElement = document.createElement('div');
    tabElement.classList.add('tab');
    tabElement.addEventListener('click', () => {
      if (!homePage.onChangeFavoriteSyntaxTabAnimationState.ultimateDataCall) {
        let currentState = homePage.onChangeFavoriteSyntaxTab.ultimateDataCall;
        currentState[element.getAttribute('id')] = tab.getAttribute('id');
        homePage.onChangeFavoriteSyntaxTab.callAllListeners(currentState);
        localStorage.setItem('currentTabDataIndexes', JSON.stringify(currentState));
      }
    });
    tabElement.textContent = tab.textContent;
    tabsContainer.appendChild(tabElement);

    homePage.onChangeFavoriteSyntaxTab.addListener({
      callback: (data) => {
        const currentData = data[element.getAttribute('id')];
        if (currentData && tabIds.includes(currentData)) {
          tabElement.classList.toggle('active', tab.getAttribute('id') === currentData);
          if (tab.getAttribute('id') === currentData) {
            tabsContainer.style.setProperty('--eid', parseInt(id));
            updateTabsIndicator(tabsContainer);
          }
        } else if (!currentData && !parseInt(id)) {
          tabElement.classList.add('active');
          tabsContainer.style.setProperty('--eid', '0');
          updateTabsIndicator(tabsContainer);
        }
      },
      ref: tabElement,
      recallWithCurrentData: true,
    });
  }

  new ResizeObserver(() => updateTabsIndicator(tabsContainer)).observe(tabsContainer);

  const syntaxHighlightContainer = document.createElement('div');
  syntaxHighlightContainer.classList.add('sy-container');
  newElement.appendChild(syntaxHighlightContainer);

  let syntaxIds = [];

  for (const [id, syntax] of Object.entries(element.querySelectorAll('syntax-highlight'))) {
    if (!syntax.getAttribute('id')) {
      throw new Error('syntax has invalid data for multisyntax');
    }

    syntaxIds.push(syntax.getAttribute('id'));

    let syntaxElement = document.createElement('div');

    tryToReduceTags(syntax);
    syntaxElement = checkAndManageElement(syntax, syntaxElement, document.createElement('div'));

    let containsCustomTags = false;
    for (const data of syntax.querySelectorAll('*')) {
      if (!(data instanceof Text) && data.tagName.toUpperCase() !== syntaxManager.BR) {
        containsCustomTags = true;
        break;
      }
    }

    if (containsCustomTags) {
      throw new Error("Syntax highlight can't contain other tags");
    }

    syntaxElement = handleSyntaxHighlight(syntax, syntaxElement, true);
    syntaxHighlightContainer.appendChild(syntaxElement);

    homePage.onChangeFavoriteSyntaxTab.addListener({
      callback: (data) => {
        const currentData = data[element.getAttribute('id')];
        if (currentData && syntaxIds.includes(currentData)) {
          const activeItem = syntaxHighlightContainer.querySelector('.active');
          if (activeItem) {
            if (activeItem !== syntaxElement && syntax.getAttribute('id') === currentData) {
              homePage.onChangeFavoriteSyntaxTabAnimationState.callAllListeners(true);

              const childNodes = [...syntaxHighlightContainer.childNodes];
              let updatedChildren = [];
              for (const syntax of childNodes) {
                if (syntax !== syntaxElement && syntax !== activeItem) {
                  updatedChildren.push(syntax);
                  syntax.classList.add('hidden');
                }
              }

              const asBack = childNodes.indexOf(activeItem) > childNodes.indexOf(syntaxElement);

              const activeItemRect = activeItem.getBoundingClientRect();
              syntaxHighlightContainer.style.setProperty('--height', activeItemRect.height + 'px');
              syntaxHighlightContainer.classList.add('preparing-animation');

              const currentItemRect = syntaxElement.getBoundingClientRect();
              syntaxHighlightContainer.style.setProperty('--to-height', currentItemRect.height + 'px');
              activeItem.classList.add('disappearing');
              syntaxHighlightContainer.classList.add('animating');
              syntaxHighlightContainer.classList.toggle('animating-asback', asBack);
              syntaxHighlightContainer.classList.remove('preparing-animation');
              syntaxElement.classList.add('appearing');

              Promise.all([
                waitForAnimationEnd(syntaxHighlightContainer),
                waitForAnimationEnd(activeItem),
                waitForAnimationEnd(syntaxElement)
              ]).then(() => {
                syntaxElement.classList.remove('appearing');
                syntaxElement.classList.add('active');
                activeItem.classList.remove('disappearing');
                activeItem.classList.remove('active');
                syntaxHighlightContainer.classList.remove('animating');
                syntaxHighlightContainer.classList.remove('animating-asback');
                homePage.onChangeFavoriteSyntaxTabAnimationState.callAllListeners(false);

                for (const child of updatedChildren) {
                  child.classList.remove('hidden');
                }
              });
            }
          } else {
            syntaxElement.classList.toggle('active', syntax.getAttribute('id') === currentData);
          }
        } else {
          syntaxElement.classList.toggle('active', !parseInt(id));
        }
      },
      ref: syntaxElement,
      recallWithCurrentData: true,
    });
  }
}

function handleGithubRef(element) {
  if (!element.hasAttribute('user') || !element.hasAttribute('reponame')) {
    throw new Error('github ref doesnt have link');
  }

  if (element.getAttribute('user').indexOf('/') !== -1 || element.getAttribute('reponame').indexOf('/') !== -1) {
    throw new Error('github ref has an invalid format');
  }

  const loader = utils.createLoadingItem();

  element.removeAttribute('href');
  element.classList.add('is-loading');
  element.appendChild(loader);

  const githubCacheKey = 'githubData_' + element.getAttribute('user') + '_' + element.getAttribute('reponame');

  const isValidCacheContent = (cacheContent, checkingFromCache = false) => {
    let isValidContent = (
        typeof cacheContent['full_name'] == 'string' && cacheContent['full_name'].trim()
        && (typeof cacheContent['description'] == 'string' || cacheContent['description'] == null)
        && typeof cacheContent['html_url'] == 'string' && cacheContent['html_url'].trim()
        && typeof cacheContent['owner'] == 'object'
        && typeof cacheContent['owner']['avatar_url'] == 'string' && cacheContent['owner']['avatar_url'].trim()
        && typeof cacheContent['language'] == 'string' && cacheContent['language'].trim()
        && typeof cacheContent['forks'] == 'number'
        && typeof cacheContent['stargazers_count'] == 'number'
    );

    if (checkingFromCache && isValidContent) {
      isValidContent = (
          typeof cacheContent['svd_time'] == 'number'
          && (new Date().getTime() - cacheContent['svd_time']) < 86400 * 1000
          // max cache 1d
      );
    }

    return isValidContent;
  };

  const filterResponse = (cacheContent) => {
    return {
      full_name: cacheContent['full_name'],
      description: cacheContent['description'],
      html_url: cacheContent['html_url'],
      owner: {
        avatar_url: cacheContent['owner']['avatar_url']
      },
      language: cacheContent['language'],
      forks: cacheContent['forks'],
      stargazers_count: cacheContent['stargazers_count'],
      svd_time: cacheContent['svd_time']
    };
  }

  const handleElementUpdate = (response) => {
    requestAnimationFrame(() => {
      element.classList.remove('is-loading');
      element.textContent = '';
      element.setAttribute('href', response['html_url']);
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');

      // Top Row: Badge + External Link Icon
      const topRow = document.createElement('div');
      topRow.classList.add('repo-top-row');

      const recommendedBadge = document.createElement('div');
      recommendedBadge.classList.add('recommended-badge');
      recommendedBadge.appendChild(iconsManager.get('main', 'star'));
      const badgeSpan = document.createElement('span');
      badgeSpan.textContent = 'Recommended by our staff';
      recommendedBadge.appendChild(badgeSpan);

      const githubLinkIcon = document.createElement('div');
      githubLinkIcon.classList.add('repo-external-icon');
      githubLinkIcon.appendChild(iconsManager.get('main', 'upRightFromSquare'));

      topRow.appendChild(recommendedBadge);
      topRow.appendChild(githubLinkIcon);

      // Main Presentation Row
      const repoPresentation = document.createElement('div');
      repoPresentation.classList.add('repo-presentation');

      const repoDetails = document.createElement('div');
      repoDetails.classList.add('repo-details');

      const repoTitle = document.createElement('div');
      repoTitle.classList.add('repo-title');
      const fullName = response['full_name'] || '';
      if (fullName.includes('/')) {
        const [owner, repo] = fullName.split('/');
        const ownerSpan = document.createElement('span');
        ownerSpan.classList.add('repo-owner');
        ownerSpan.textContent = owner;
        const slashSpan = document.createElement('span');
        slashSpan.classList.add('repo-slash');
        slashSpan.textContent = '/';
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('repo-name');
        nameSpan.textContent = repo;
        repoTitle.appendChild(ownerSpan);
        repoTitle.appendChild(slashSpan);
        repoTitle.appendChild(nameSpan);
      } else {
        repoTitle.textContent = fullName;
      }

      const repoDescription = document.createElement('div');
      repoDescription.classList.add('repo-description');
      repoDescription.textContent = response['description'] || 'No description provided.';

      repoDetails.appendChild(repoTitle);
      repoDetails.appendChild(repoDescription);

      const repoAvatarWrapper = document.createElement('div');
      repoAvatarWrapper.classList.add('repo-avatar-wrapper');
      const repoOwnerImage = document.createElement('img');
      repoOwnerImage.src = response['owner']['avatar_url'];
      repoOwnerImage.alt = fullName;
      repoOwnerImage.loading = 'lazy';
      repoAvatarWrapper.appendChild(repoOwnerImage);

      repoPresentation.appendChild(repoDetails);
      repoPresentation.appendChild(repoAvatarWrapper);

      // Footer Stats Row
      const repoValues = document.createElement('div');
      repoValues.classList.add('repo-values');

      const statsLeft = document.createElement('div');
      statsLeft.classList.add('repo-stats-group');

      if (response['language']) {
        const repoLanguage = document.createElement('div');
        repoLanguage.classList.add('value', 'repo-language');
        repoLanguage.style.setProperty('--color', getLanguageColorByName(response['language']));
        const langText = document.createElement('span');
        langText.textContent = response['language'];
        repoLanguage.appendChild(langText);
        statsLeft.appendChild(repoLanguage);
      }

      const repoStars = document.createElement('div');
      repoStars.classList.add('value', 'repo-stars');
      repoStars.appendChild(iconsManager.get('main', 'star'));
      const starText = document.createElement('span');
      starText.textContent = Number(response['stargazers_count'] || 0).toLocaleString();
      repoStars.appendChild(starText);
      statsLeft.appendChild(repoStars);

      const repoForks = document.createElement('div');
      repoForks.classList.add('value', 'repo-forks');
      repoForks.appendChild(iconsManager.get('main', 'codeFork'));
      const forkText = document.createElement('span');
      forkText.textContent = Number(response['forks'] || 0).toLocaleString();
      repoForks.appendChild(forkText);
      statsLeft.appendChild(repoForks);

      const viewRepoBtn = document.createElement('div');
      viewRepoBtn.classList.add('repo-view-action');
      viewRepoBtn.innerHTML = `<span>View on GitHub</span> ${iconsManager.get('main', 'arrowRight').outerHTML}`;

      repoValues.appendChild(statsLeft);
      repoValues.appendChild(viewRepoBtn);

      element.appendChild(topRow);
      element.appendChild(repoPresentation);
      element.appendChild(repoValues);
    });
  };

  requestAnimationFrame(() => {
    const dataFromCache = localStorage.getItem(githubCacheKey);
    if (dataFromCache) {
      try {
        const parsedData = JSON.parse(dataFromCache);
        if (isValidCacheContent(parsedData, true)) {
          handleElementUpdate(parsedData);
          return;
        }
      } catch(e) {}
    }

    const XML = new XMLHttpRequest();
    XML.open('GET', 'https://api.github.com/repos/' + element.getAttribute('user') + '/' + element.getAttribute('reponame'), true);
    XML.send();
    XML.addEventListener('readystatechange', (e) => {
      if (e.target.readyState === 4 && e.target.status === 200) {
        const response = JSON.parse(e.target.response);

        if (response['message']) {
          throw new Error('the repository is invalid');
        } else {
          if (isValidCacheContent(response)) {
            handleElementUpdate(response);

            response['svd_time'] = new Date().getTime();
            localStorage.setItem(githubCacheKey, JSON.stringify(filterResponse(response)));
          }
        }
      }
    });
  });
}

export function handleHomepageSyntaxHighlightElement(element) {
  let newElement = document.createElement('div');
  tryToReduceTags(element);
  newElement = checkAndManageElement(element, newElement, document.createElement('div'));
  newElement = handleSyntaxHighlight(element, newElement, true, '', true);
  return newElement;
}