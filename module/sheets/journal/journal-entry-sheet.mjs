/**
 * A simple subclass of JournalEntrySheet
 * @param JournalEntrySheet   The base JournalEntrySheet class to be mixed
 */
export class WWJournalEntrySheet extends foundry.applications.sheets.journal.JournalEntrySheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      openHelp: this.#onOpenHelp
    }
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * @inheritdoc
   * Append a Help button to the window's header
   */
  async _renderFrame(options) {
    const frame = await super._renderFrame(options);

    const buttons = [
      game.weirdwizard.utils.constructHTMLButton({
        label: "",
        classes: ["header-control", "icon", "fa-solid", "fa-circle-question"],
        dataset: { action: "openHelp", tooltip: "WW.System.CharOptionHelp" }
      })
    ];

    this.window.controls?.after(...buttons);

    return frame;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static async #onOpenHelp() {
    const entry = await fromUuid('Compendium.weirdwizard.documentation.JournalEntry.R3pFihgoMAB2Uab5');
    entry.sheet.render(true);
  }

}