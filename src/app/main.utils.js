class Utils {
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

  generateSectionRefByTextContent(textContent) {
    const alphabet = Array.from(Array(26), (_, i) => String.fromCharCode(i + 65));

    const chars = ['-', '+'];

    let reformedText = '';
    for (const char of textContent) {
      if (alphabet.includes(char.toUpperCase()) || chars.includes(char)) {
        reformedText += char;
      } else if (char === ' ') {
        reformedText += '=';
      }
    }

    if (reformedText.length) {
      return reformedText.replaceAll(' ', '-');
    } else {
      throw Error('section has wrong title');
    }
  }

  parseCategoryName(fileName) {
    if (fileName.endsWith('.xml')) {
      fileName = fileName.slice(0, -4);
    }

    if (fileName.endsWith('/')) {
      fileName = fileName.slice(0, -1);
    }

    return fileName;
  }

  getCategoryFileName(fileName) {
    return this.parseCategoryName(fileName).split('/').reverse()[0];
  }

  parseCategoryUrl(fileName) {
    if (fileName.endsWith('.xml')) {
      fileName = fileName.slice(0, -4);
    }

    if (!fileName.startsWith('/')) {
      fileName = '/' + fileName;
    }

    if (fileName.endsWith('/')) {
      fileName = fileName.slice(0, -1);
    }

    return fileName;
  }

  splitSearchResult(text, isZeroSplit = false) {
    if (isZeroSplit) {
      let newText = text.split("").reverse().join("");

      if (newText.length > 30) {
        newText = '...' + newText.slice(0, 30);
      }

      newText = newText.split("").reverse().join("");

      return newText;
    } else {
      if (text.length > 30) {
        text = text.slice(0, 30) + '...';
      }

      return text;
    }
  }
  
	escapeHTML(text){
		return text.replace(/[\x26\x0A\<>'"]/g, function(r){
			return "&#"+r.charCodeAt(0)+";";
		});
	}
}

const utils = new Utils();