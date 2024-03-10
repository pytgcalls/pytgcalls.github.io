self.addEventListener('message', (e) => {
  if (e.data && typeof e.data.ready == 'boolean') {
    self.postMessage({ ready: true });
    return;
  }

  if (e.data && e.data.element) {
    const context = e.data.element.getContext('2d');

    const ballSize = 1.5;
    const spaceX = 15;
    const spaceY = 15;

    let x = 0;
    let y = 0;

    while (y < e.data.element.height) {
      const isSqRow = y % 10 == 0 && y != 0;

      x = 0;
      while (x < e.data.element.width) {
        const isSqPoint = x % 15 == 0;

        if (isSqPoint && isSqRow) {
          context.beginPath();
          context.moveTo(x, y - 8);
          context.lineTo(x, y + 8);
          context.strokeStyle = "#151456";
          context.stroke();
          context.closePath();

          context.beginPath();
          context.moveTo(x - 8, y);
          context.lineTo(x + 8, y);
          context.strokeStyle = "#151456";
          context.stroke();
          context.closePath();
        } else {
          context.beginPath();
          context.arc(x, y, ballSize, 0, Math.PI * 2);
          context.fillStyle = "#151456";
          context.fill();
          context.closePath();
        }

        x += (ballSize * 2) + spaceX;
      }

      y += (ballSize * 2) + spaceY;
    }
  }
});