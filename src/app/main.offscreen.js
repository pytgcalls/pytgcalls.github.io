class OffScreenHelper {
  #initedWorker;
  #pendingPromise;
  #isReady = false;

  #initWorker() {
    if (typeof this.#initedWorker == 'undefined') {
      this.#initedWorker = new Worker("/worker.js");

      this.#pendingPromise = new Promise((resolve) => {
        this.#initedWorker.addEventListener('message', (e) => {
          if (e.data && e.data.ready) {
            this.#isReady = true;
            resolve();
          }
        }, { once: true });
      });

      this.#initedWorker.postMessage({ ready: false });
      return this.#pendingPromise;
    } else if (!this.#isReady) {
      return this.#pendingPromise;
    } else {
      return Promise.resolve();
    }
  }

  grantCanvasToWorker(canvasElement) {
    this.#initWorker().then(() => {
      console.log('sendng');
      const offscreen = canvasElement.transferControlToOffscreen();
      this.#initedWorker.postMessage({ element: offscreen }, [offscreen]);
    });
  }
}

const offScreenHelper = new OffScreenHelper();