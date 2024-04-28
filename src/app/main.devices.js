function isAndroid() {
  return navigator.userAgent && /android/.test(navigator.userAgent);
}

function isiPhone() {
  return navigator.userAgent && /iPhone/.test(navigator.userAgent);
}

function isiPad() {
  return navigator.userAgent && /iPad/.test(navigator.userAgent);
}

function isMac() {
  return navigator.userAgent && /mac/.test(navigator.userAgent);
}

function isAnAppleDevice() {
  return isiPad() || isiPhone() || isMac();
}

export {
  isAndroid,
  isiPhone,
  isiPad,
  isMac,
  isAnAppleDevice
};