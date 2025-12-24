function render(state: {
  message: string;
  showCancel: boolean;
  showPrompt: boolean;
  onClose: (value: string | boolean) => void;
}) {
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

  let returnValue: string | boolean = false;

  dialog.addEventListener("command", (event) => {
    // @ts-expect-error CommandEvent not available in types
    if (event.command !== "--confirm") return;

    returnValue = state.showPrompt
      ? (dialog.querySelector("input")?.value ?? "")
      : true;

    dialog.close();
  });

  dialog.addEventListener("close", () => {
    state.onClose(returnValue);

    dialog.addEventListener("transitionend", (event) => {
      if (event.propertyName === "display") dialog.remove()
    })
  });

  const messageEl = dialog.querySelector("p");
  messageEl!.textContent = state.message;

  return dialog;
}

export function alert(message: string): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();

  const onClose = () => {
    resolve();
  };

  const dialog = document.body.appendChild(
    render({ message, showCancel: false, showPrompt: false, onClose }),
  );

  dialog.showModal();

  return promise;
}

export function confirm(message: string): Promise<boolean> {
  const { promise, resolve } = Promise.withResolvers<boolean>();

  const onClose = (value: boolean | string) => {
    resolve(!!value);
  };

  const dialog = document.body.appendChild(
    render({ message, showCancel: true, showPrompt: false, onClose }),
  );

  dialog.showModal();

  return promise;
}

export function prompt(message: string): Promise<string | null> {
  const { promise, resolve } = Promise.withResolvers<string | null>();

  const onClose = (value: boolean | string) => {
    resolve(value === false ? null : value.toString());
  };

  const dialog = document.body.appendChild(
    render({ message, showCancel: true, showPrompt: true, onClose }),
  );

  dialog.showModal();

  return promise;
}
