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
    for(const callback of this.#callbacks) {
      if ((onlyInternal && callback.isInternal) || !onlyInternal) {
        try {
          callback.callback(data);
        } catch(e) {}
      }
    }
  }
}