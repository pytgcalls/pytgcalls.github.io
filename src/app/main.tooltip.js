class Tooltip {
  #closeCallbacksList = [];

  init({
    childElement,
    title,
    text,
    container,
    hasTabs = false
  }) {
    this.closeTooltips();

    const elementRect = container.getBoundingClientRect();

    const tooltipTriangle = document.createElement('div');
    tooltipTriangle.classList.add('triangle');
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.classList.toggle('has-tabs', hasTabs);
    tooltip.style.setProperty('--center-x', '0px');
    tooltip.style.setProperty('--center-y', elementRect.top + 'px');
    tooltip.appendChild(tooltipTriangle);

    if (childElement instanceof Element) {
      tooltipText.appendChild(childElement);
    } else {
      if (typeof title == 'string') {
        const titleElement = document.createElement('div');
        titleElement.classList.add('title-element');
        titleElement.textContent = title;
        tooltip.appendChild(titleElement);
      }

      if (typeof text == 'string') {
        const textElement = document.createElement('div');
        textElement.classList.add('text-element');
        textElement.textContent = text;
        tooltip.appendChild(textElement);
      }
    }

    document.body.appendChild(tooltip);

    const tooltipRect = tooltip.getBoundingClientRect();
    let newLeftPosition = elementRect.left;
    newLeftPosition += elementRect.width / 2;
    newLeftPosition -= tooltipRect.width / 2;

    tooltip.style.setProperty('--center-x', newLeftPosition + 'px');
    tooltip.classList.add('visible');

    const handler = () => {
      this.closeTooltips();
    };

    window.addEventListener('resize', handler);
    document.body.addEventListener('click', handler);

    this.#closeCallbacksList.push(() => {
      tooltip.classList.add('remove');
      tooltip.addEventListener('animationend', () => {
        tooltip.remove();
      }, { once: true });

      window.removeEventListener('resize', handler);
      document.body.removeEventListener('click', handler);
    });
  }

  closeTooltips() {
    for (const callback of this.#closeCallbacksList) {
      try {
        callback();
      } catch (e) { }
    }
    this.#closeCallbacksList = [];
  }
}

const tooltip = new Tooltip();