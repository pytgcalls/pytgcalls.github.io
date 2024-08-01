/*
 * Copyright (c) 2020-2024.
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

export function handleSettings() {
    handleDesktopMode();
    handleReduceBlur();
    handlePageFontSize();
}

export function getForceGithubAPIStatus() {
    const storageData = localStorage.getItem('forceGithubAPI');
    return storageData === 'true';
}

export function updateForceGithubAPI(status) {
    localStorage.setItem('forceGithubAPI', String(status));
}

export function getCollapseLongCodeStatus() {
    const storageData = localStorage.getItem('collapseLongCode');
    return storageData === 'true' || storageData == null;
}

export function updateCollapseLongCode(status) {
    localStorage.setItem('collapseLongCode', String(status));
}
export function getForceDesktopModeStatus() {
    const storageData = localStorage.getItem('desktopMode');
    return storageData === 'true';
}

export function updateDesktopMode(status) {
    localStorage.setItem('desktopMode', String(status));
    handleDesktopMode();
}

function handleDesktopMode() {
    let metaViewPortTag = document.head.querySelector('meta[name="viewport"]');
    if (getForceDesktopModeStatus() && metaViewPortTag) {
        metaViewPortTag.remove();
    } else if (!getForceDesktopModeStatus() && !metaViewPortTag) {
        metaViewPortTag = document.createElement('meta');
        metaViewPortTag.setAttribute('name', 'viewport');
        metaViewPortTag.setAttribute('content', 'width=device-width, initial-scale=1.0');
        document.head.appendChild(metaViewPortTag);
    }
}

export function getReduceBlurStatus() {
    const storageData = localStorage.getItem('reduceBlur');

    if (storageData == null && window.innerWidth < 800) {
        return true;
    }

    return storageData === 'true';
}

export function updateReduceBlur(status) {
    localStorage.setItem('reduceBlur', String(status));
    handleReduceBlur();
}

function handleReduceBlur() {
    document.body.classList.toggle('reduce-blur', getReduceBlurStatus());
}

function handlePageFontSize() {
    document.body.style.setProperty('--font-size', parseFontSizeFromDatabase()+'px');
}

export function increaseFontSize() {
    localStorage.setItem('fontSize', parseFontSizeFromDatabase()+1);
    handlePageFontSize();
}

export function decreaseFontSize() {
    localStorage.setItem('fontSize', parseFontSizeFromDatabase()-1);
    handlePageFontSize();
}

function parseFontSizeFromDatabase() {
    const storageData = localStorage.getItem('fontSize');

    if (!isNaN(parseInt(storageData))) {
        const parsedStorageData = parseInt(storageData);

        if (parsedStorageData > -10 && parsedStorageData < 10) {
            return parsedStorageData;
        }
    }

    localStorage.removeItem('fontSize');
    return 0;
}

export function canIncreaseFontSize() {
    return parseFontSizeFromDatabase() !== 9;
}

export function canDecreaseFontSize() {
    return parseFontSizeFromDatabase() !== -9;
}

export function isDefaultFontSize() {
    return parseFontSizeFromDatabase() === 0;
}