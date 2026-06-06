// @ts-check

/**
 * @param {{
 *  message: string;
 *  showCancel: boolean;
 *  showPrompt: boolean;
 *  onClose: (value: string | boolean) => void;
 * }} state
 * @returns {HTMLDialogElement}
 */
function render(state) {
  const template = document.createElement("div");
  const id = crypto.randomUUID();

  template.innerHTML = `<dialog id="${id}" small class="trim">
    <p></p>
    ${state.showPrompt ? `<input type="text" autofocus />` : ""}
    <footer>
      ${
        state.showCancel
          ? `<button autofocus commandfor="${id}" command="close" variant="secondary">Cancel</button>`
          : ""
      }
      <button
        ${state.showCancel ? "" : "autofocus"}
        commandfor="${id}"
        command="--confirm"
      >
        OK
      </button>
    </footer>
  </dialog>`;

  const dialog = template.querySelector("dialog");
  if (!dialog) throw new Error("failed to instantiate dialog");

  const messageEl = dialog.querySelector("p");
  if (!messageEl) throw new Error("failed to instantiate dialog");
  messageEl.textContent = state.message;

  const inputEl = dialog.querySelector("input");
  inputEl?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) {
      return;
    }

    returnValue = event.target?.value;
    dialog.close();
  });

  /** @type {string | boolean } */
  let returnValue = false;

  dialog.addEventListener("command", (event) => {
    // @ts-expect-error CommandEvent not available in types
    if (event.command !== "--confirm") return;
    returnValue = state.showPrompt ? (inputEl?.value ?? "") : true;
    dialog.close();
  });

  dialog.addEventListener("close", () => {
    state.onClose(returnValue);

    dialog.addEventListener("transitionend", (event) => {
      if (event.propertyName === "display") dialog.remove();
    });
  });

  return dialog;
}

/**
 * @param {string} message
 * @returns {Promise<void>}
 */
export function alert(message) {
  /** @type {PromiseWithResolvers<void>} */
  const { promise, resolve } = Promise.withResolvers();

  const onClose = () => {
    resolve(undefined);
  };

  const dialog = document.body.appendChild(
    render({ message, showCancel: false, showPrompt: false, onClose }),
  );

  dialog.showModal();

  return promise;
}

/**
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function confirm(message) {
  /** @type {PromiseWithResolvers<boolean>} */
  const { promise, resolve } = Promise.withResolvers();

  /** @param {string | boolean} value */
  const onClose = (value) => {
    resolve(!!value);
  };

  const dialog = document.body.appendChild(
    render({ message, showCancel: true, showPrompt: false, onClose }),
  );

  dialog.showModal();

  return promise;
}

/**
 * @param {string} message
 * @returns {Promise<string | null>}
 */
export function prompt(message) {
  /** @type {PromiseWithResolvers<string | null>} */
  const { promise, resolve } = Promise.withResolvers();

  /** @param {string | boolean} value */
  const onClose = (value) => {
    resolve(value === false ? null : value.toString());
  };

  const dialog = document.body.appendChild(
    render({ message, showCancel: true, showPrompt: true, onClose }),
  );

  dialog.showModal();

  return promise;
}
