import { i18n } from "../../helpers/utils.mjs";
/**
 * * The Application responsible for displaying and editing a single JournalEntryPage character option.
 * @extends {JournalPageSheet}
*/

export default class WWCharOptionSheet extends JournalPageSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'charoption'],
    window: {
      icon: 'fas fa-user'
    }
  }

  /** @override */
  get template() {
    const mode = this.isEditable ? "edit" : "view";

    return `systems/weirdwizard/templates/journal/${this.document.type}-${mode}.hbs`;
    
  }

  /** @override */
  /*static PARTS = { // App V2 only
    //
  }*/

  /** @override */
  /*_configureRenderOptions(options) { // App V2 only
    super._configureRenderOptions(options);

    // Completely overriding the parts
    options.parts = ['menu', 'sidetabs', 'namestripe', 'banner', 'summary', 'details', 'equipment', 'talents', 'spells', 'effects'];
    
    return options;
  }*/

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    const canConfigure = game.user.isGM;

    if (canConfigure) {
      const sheetIndex = buttons.findIndex(btn => btn.label === "Sheet");

      if (this.item.isCharOption) {

        // Add help button
        buttons.splice(sheetIndex, 0, {
          label: "WW.System.Help",
          class: "help",
          icon: "fas fa-question",
          onclick: ev => this._onHelp(ev)
        });

      }

    }

    return buttons;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options={}) { // Swap by _prepareContext() in V2
    const context = super.getData(options);
    this._convertFormats(context);

    console.log('getData')
    console.log(this.document)
    const docData = this.document;

    context.document = docData, // Use a safe clone of the document data for further operations.
    context.system = docData.system,
    context.folder = await docData.folder,
    context.flags = docData.flags,
    context.dtypes = ['String', 'Number', 'Boolean']

    context.editor = {
      engine: "prosemirror",
      collaborate: true,
      content: await TextEditor.enrichHTML(context.document.text.content, {
        relativeTo: this.document,
        secrets: this.document.isOwner
      })
    };
    
    // Prepare enriched variables for editor
    context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true, secrets: this.document.isOwner, relativeTo: this.document });

    // Prepare Items Area Hint
    context.itemsAreaHint = `
      <p>${i18n("WW.CharOption.DropHere")}</p>
      <p>${i18n("WW.CharOption.Help", { itemType: document.type })}</p>
    `;

    // Prepare dropdown objects
    context.spellsLearned = CONFIG.WW.SPELLS_LEARNED;

    // Prepare paths
    if (this.document.type === 'Path') {

      if (context.hasActor) {
        context.tierLoc = i18n(CONFIG.WW.PATH_TIERS[this.document.system.tier]);
      } else {
        context.tiers = CONFIG.WW.PATH_TIERS;
      }
    }

    // Prepare Professions
    if (this.document.type === 'Profession') {
      context.professionCategories = CONFIG.WW.PROFESSION_CATEGORIES;
    }

    // Prepare Benefits list
    if (this.document.system.benefits) {
      context.benefits = document.system.benefits;

      for (const b in context.benefits) {

        const benefit = context.benefits[b];

        // Prepare information for granted items
        benefit.itemsInfo = [];

        for (const i of benefit.items) {

          const retrieved = await fromUuid(i);

          benefit.itemsInfo.push({
            uuid: i,
            name: retrieved ? retrieved.name : i18n('WW.CharOption.Unknown'),
            description: retrieved ? retrieved.system.description.value : i18n('WW.CharOption.MissingRef'),
            missing: retrieved ? false : true
          });

        }

      }
    }
    
    return context;
  }

  /* -------------------------------------------- */

  /**
   * Lazily convert text formats if we detect the document being saved in a different format.
   * @param {object} renderData  Render data.
   * @protected
   */
  _convertFormats(renderData) {
    const formats = CONST.JOURNAL_ENTRY_PAGE_FORMATS;
    const text = this.object.text;
    if ( (this.constructor.format === formats.MARKDOWN) && text.content?.length && !text.markdown?.length ) {
      // We've opened an HTML document in a markdown editor, so we need to convert the HTML to markdown for editing.
      renderData.data.text.markdown = this.constructor._converter.makeMarkdown(text.content.trim());
    }
  }
  
}