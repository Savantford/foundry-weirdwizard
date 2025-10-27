/**
 * Extend DialogV2 with a few alterations
 * @extends {DialogV2}
*/
export default class WWDialog extends foundry.applications.api.DialogV2 {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["weirdwizard"],
    position: {
      width: 400,
      height: "auto",
    }
  };

  /* -------------------------------------------- */

  /**
   * A utility helper to generate a dialog for user input.
   * @param {Partial<ApplicationConfiguration & DialogV2Configuration & DialogV2WaitOptions>} [config]
   * @param {Partial<DialogV2Button>} [config.ok]   Options to overwrite the default confirmation button configuration.
   * @returns {Promise<any>}                        Resolves to the data of the form if the ok button was pressed,
   *                                                or the value returned by that button's callback. If additional
   *                                                buttons were provided, the Promise resolves to the identifier of
   *                                                the one that was pressed, or the value returned by its callback.
   *                                                If the dialog was dismissed, and rejectClose is false, the Promise
   *                                                resolves to null.
   */
  static async input({ok, ...config}={}) {
    const callback = (_event, button) => new FormDataExtended(button.form).object;
    return this.prompt({ok: {callback, ...ok}, ...config});
  }

}

