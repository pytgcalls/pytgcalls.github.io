class Debug {
  reloadPageData(reloadConfig = true) {
    if (!this.isSafeToUseDebugItems()) {
      return;
    }

    document.body.innerHTML = '';

    const onReady = () => {
      config.getRedirectDataForPath(window.location.pathname).then((data) => {
        if (data && (data.startsWith('https://') || data.startsWith('http://'))) {
          window.location.href = data;
        } else {
          homePage.init(data || window.location.pathname);
        }
      });
    };

    if (reloadConfig) {
      config.resetConfigByDebug();
      config.loadConfig().then(onReady);
    } else {
      onReady();
    }
  }

  tryCustomPageCode(isConfig = false) {
    if (!this.isSafeToUseDebugItems()) {
      return;
    }

    const customCodeEditor = this.#composeCustomHighlightedEditor({
      language: Prism.languages.html,
      onConfirm: () => {
        this.#handlePopupContainerClose(popupContainer);

        if (isConfig) {
          config.setAsConfig(customCodeEditor.getCode().trim());
          this.reloadPageData(false);
        } else {
          homePage.handleCustomCodeInsert(customCodeEditor.getCode().trim());
        }
      }
    });

    const popupElementTitle = document.createElement('div');
    popupElementTitle.classList.add('title');
    popupElementTitle.textContent = 'Try custom page code';
    const popupElementDescription = document.createElement('div');
    popupElementDescription.classList.add('description');
    popupElementDescription.textContent = 'Insert here your custom code to save. Then, press SHIFT+M to confirm.';
    const popupElement = document.createElement('div');
    popupElement.classList.add('popup-element');
    popupElement.appendChild(popupElementTitle);
    popupElement.appendChild(popupElementDescription);
    popupElement.appendChild(customCodeEditor.element);
    const popupContainer = document.createElement('div');
    popupContainer.classList.add('popup-container');
    popupContainer.appendChild(popupElement);
    document.body.appendChild(popupContainer);

    popupContainer.addEventListener('click', (e) => {
      const currentPopupElementRect = popupElement.getBoundingClientRect();

      let isOutside = e.clientX < currentPopupElementRect.left;
      isOutside = isOutside || e.clientX > currentPopupElementRect.left + currentPopupElementRect.width;
      isOutside = isOutside || e.clientY < currentPopupElementRect.top;
      isOutside = isOutside || e.clientY > currentPopupElementRect.top + currentPopupElementRect.height;

      if (isOutside) {
        this.#handlePopupContainerClose(popupContainer);
      }
    });
  }

  #handlePopupContainerClose(popupContainer) {
    popupContainer.classList.add('disappear');
    popupContainer.addEventListener('animationend', () => {
      popupContainer.remove();
    }, { once: true });
  }

  #composeCustomHighlightedEditor({ language, onConfirm }) {
    const transparentTextarea = document.createElement('textarea');
    transparentTextarea.setAttribute('placeholder', 'Insert here your code');
    const prismCode = document.createElement('div');
    prismCode.classList.add('prism-code');
    const customEditor = document.createElement('div');
    customEditor.classList.add('custom-editor');
    customEditor.appendChild(transparentTextarea);
    customEditor.appendChild(prismCode);

    Prism.hooks.add("before-highlight", (env) => {
      env.code = env.element.innerText;
    });

    const syncTextArea = () => {
      customEditor.style.setProperty('--width', transparentTextarea.scrollWidth + 'px');
      customEditor.style.setProperty('--height', transparentTextarea.scrollHeight + 'px');

      customEditor.classList.add('defined-width');
      customEditor.classList.add('defined-height');

      let code = transparentTextarea.value;
      code = Prism.highlight(code, language, 'html');
      code = code.replaceAll('\n', '<br/>');

      if (code.startsWith('<br/>')) {
        code = code.slice(5);
      }

      prismCode.innerHTML = code;
    };

    const handleKeyDown = (e) => {
      if (e.key == 'Tab') {
        e.preventDefault();

        const currentInputPosition = transparentTextarea.selectionStart;
        const currentInputValue = transparentTextarea.value;

        let newInputValue = currentInputValue.substring(0, currentInputPosition);
        newInputValue += "	"; // tabs
        newInputValue += currentInputValue.substring(currentInputPosition, currentInputValue.length);

        transparentTextarea.value = newInputValue;
        transparentTextarea.selectionStart = currentInputPosition + 1;
        transparentTextarea.selectionEnd = currentInputPosition + 1;

        syncTextArea();
      } else if (e.key == 'M' && e.shiftKey) {
        e.preventDefault();
        onConfirm();
      } else {
        console.log("Recv", e);
      }
    };

    transparentTextarea.addEventListener('input', syncTextArea);
    transparentTextarea.addEventListener('keydown', handleKeyDown);

    return {
      element: customEditor,
      getCode: () => transparentTextarea.value
    };
  }

  isSafeToUseDebugItems() {
    return window.location.protocol == 'http:';
  }
}

var debug = new Debug();