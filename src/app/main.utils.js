class Utils {
  #precachedConfig;

  createLoadingItem(size = 100) {
    const circleItem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circleItem.setAttributeNS(null, 'cx', '50%');
    circleItem.setAttributeNS(null, 'cy', '50%');
    circleItem.setAttributeNS(null, 'r', '20');
    circleItem.setAttributeNS(null, 'fill', 'none');
    const loaderSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    loaderSvg.setAttributeNS(null, 'width', String(size));
    loaderSvg.setAttributeNS(null, 'height', String(size));
    loaderSvg.appendChild(circleItem);
    return loaderSvg;
  }

  calculateSize(size, useBinaryUnits = true, addSpace = false) {
    const binaryUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    const basicUnits = ['B', 'KB', 'MB', 'GB', 'TB'];
    const units = useBinaryUnits ? binaryUnits : basicUnits;
    const divisorParam = useBinaryUnits ? 1024 : 1000;
  
    let divisionCounter = 0;
    let currentDivisor = size;
    while(currentDivisor >= divisorParam && divisionCounter < 4){
      divisionCounter++;
      currentDivisor /= divisorParam;
    }
    
    let finalString = '';
    finalString += currentDivisor.toFixed(1);
    finalString += addSpace ? ' ' : '';
    finalString += units[divisionCounter];
    return finalString;
  }

  loadConfig() {
    if (typeof this.#precachedConfig !== 'undefined') {
      return Promise.resolve(this.#precachedConfig);
    } else {
      return new Promise((resolve) => {
        const XML = new XMLHttpRequest();
        XML.open('GET', 'https://raw.githubusercontent.com/pytgcalls/docsdata/master/config.xml?cache='+String(Math.random()), true);
        XML.send();
        XML.addEventListener('readystatechange', (e) => {
          if (e.target.readyState === 4 && e.target.status === 200) {
            this.#precachedConfig = e.target.response;
            resolve(this.#precachedConfig);
          }
        });
      });
    }
  }

  generateSectionRefByTextContent(textContent) {
    const alpha = Array.from(Array(26)).map((_, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x));

    const chars = ['-', '+'];

    let reformedText = '';
    for(const char of textContent) {
      if (alphabet.includes(char.toUpperCase()) || chars.includes(reformedText)) {
        reformedText += char;
      } else if (char == ' ') {
        reformedText += '=';
      }
    }

    if (reformedText.length) {
      return reformedText.replaceAll(' ', '-');
    } else {
      throw Error('section has wrong title');
    }
  }
}

const utils = new Utils();