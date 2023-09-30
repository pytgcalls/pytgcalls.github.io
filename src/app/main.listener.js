class ListenerManagerInstance {
  #callbacks = [];

  addListener({ callback, isInternal = false, ref = undefined }) {
    this.#callbacks.push({
      callback,
      isInternal,
      ref
    });
  }

  callAllListeners(data) {
    return this.#executeListenerCall(data);
  }

  callInternalListeners(data) {
    return this.#executeListenerCall(data, true);
  }

  #executeListenerCall(data, onlyInternal = false) {
    let reparsedCallbacks = [];

    for(const callback of this.#callbacks) {
      if (callback.ref instanceof Element && !document.body.contains(callback.ref)) {
        continue;
      }

      reparsedCallbacks.push(callback);

      if ((onlyInternal && callback.isInternal) || !onlyInternal) {
        try {
          callback.callback(data);
        } catch(e) {}
      }
    }

    this.#callbacks = reparsedCallbacks;
  }
}