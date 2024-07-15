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

function handleSettings() {
    handleDesktopMode();
    handleReduceBlur();
}

function getForceGithubAPIStatus() {
    const storageData = localStorage.getItem('forceGithubAPI');
    return storageData === 'true';
}

function updateForceGithubAPI(status) {
    localStorage.setItem('forceGithubAPI', String(status));
}

function getCollapseLongCodeStatus() {
    const storageData = localStorage.getItem('collapseLongCode');
    return storageData === 'true' || storageData == null;
}

function updateCollapseLongCode(status) {
    localStorage.setItem('collapseLongCode', String(status));
}
function getForceDesktopModeStatus() {
    const storageData = localStorage.getItem('desktopMode');
    return storageData === 'true';
}

function updateDesktopMode(status) {
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
function getReduceBlurStatus() {
    const storageData = localStorage.getItem('reduceBlur');

    if (storageData === null && window.innerWidth < 800) {
        return true;
    }

    return storageData === 'true';
}

function updateReduceBlur(status) {
    localStorage.setItem('reduceBlur', String(status));
    handleReduceBlur();
}

function handleReduceBlur() {
    document.body.classList.toggle('reduce-blur', getReduceBlurStatus());
}

export {
    handleSettings,
    getForceGithubAPIStatus,
    updateForceGithubAPI,
    getCollapseLongCodeStatus,
    updateCollapseLongCode,
    getForceDesktopModeStatus,
    updateDesktopMode,
    getReduceBlurStatus,
    updateReduceBlur,
};