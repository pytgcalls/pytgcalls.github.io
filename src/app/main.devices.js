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

export function isAndroid() {
  return navigator.userAgent && /android/.test(navigator.userAgent);
}

export function isiPhone() {
  return navigator.userAgent && /iPhone/.test(navigator.userAgent);
}

export function isiPad() {
  return navigator.userAgent && /iPad/.test(navigator.userAgent);
}

export function isMac() {
  return navigator.userAgent && /mac/.test(navigator.userAgent);
}

export function isAnAppleDevice() {
  return isiPad() || isiPhone() || isMac();
}
