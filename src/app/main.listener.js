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

export default class ListenerManagerInstance {
  ultimateDataCall;
  ultimateDataCallInternal;

  #callbacks = [];

  addListener({ callback, isInternal = false, ref = undefined, recallWithCurrentData = false, onUnknownRecall }) {
    this.#callbacks.push({
      callback,
      isInternal,
      ref
    });

    if (recallWithCurrentData) {
      if (isInternal) {
        if (typeof this.ultimateDataCallInternal != 'undefined') {
          callback(this.ultimateDataCallInternal);
        } else {
          onUnknownRecall && onUnknownRecall();
        }
      } else if (!isInternal) {
        if (typeof this.ultimateDataCall != 'undefined') {
          callback(this.ultimateDataCall);
        } else {
          onUnknownRecall && onUnknownRecall();
        }
      }
    }
  }

  callAllListeners(data) {
    this.ultimateDataCall = data;
    return this.#executeListenerCall(data);
  }

  callInternalListeners(data) {
    this.ultimateDataCallInternal = data;
    return this.#executeListenerCall(data, true);
  }

  #executeListenerCall(data, onlyInternal = false) {
    let reparsedCallbacks = [];

    for (const callback of this.#callbacks) {
      if (callback.ref instanceof Element && !document.body.contains(callback.ref)) {
        continue;
      }

      reparsedCallbacks.push(callback);

      if ((onlyInternal && callback.isInternal) || !onlyInternal) {
        try {
          callback.callback(data);
        } catch (e) { }
      }
    }

    this.#callbacks = reparsedCallbacks;
  }
}