class DevicesManager {
  isAndroid() {
    return navigator.userAgent && /android/.test(navigator.userAgent);
  }

  isiPhone() {
    return navigator.userAgent && /iPhone/.test(navigator.userAgent);
  }

  isiPad() {
    return navigator.userAgent && /iPad/.test(navigator.userAgent);
  }

  isMac() {
    return navigator.userAgent && /mac/.test(navigator.userAgent);
  }

  isAnAppleDevice() {
    return this.isiPad() || this.isiPhone() || this.isMac();
  }
}

const devicesManager = new DevicesManager();