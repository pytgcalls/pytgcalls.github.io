class Utils {
  createLoadingItem(size = 100) {
    const circleItem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circleItem.setAttributeNS(null, 'cx', '50%');
    circleItem.setAttributeNS(null, 'cy', '50%');
    circleItem.setAttributeNS(null, 'r', 20);
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
}

const utils = new Utils();