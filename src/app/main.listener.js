class ListenerManagerInstance {
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
      } else if(!isInternal) {
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