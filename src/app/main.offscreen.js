class OffScreenHelper {
  #initedWorker;

  #initWorker() {
    if (typeof this.#initedWorker == 'undefined') {
      this.#initedWorker = new Worker("/worker.js");
    }
  }

  grantCanvasToWorker(canvasElement) {
    this.#initWorker();

    const offscreen = canvasElement.transferControlToOffscreen();
    this.#initedWorker.postMessage({ element: offscreen }, [offscreen]);
  }
}

const offScreenHelper = new OffScreenHelper();