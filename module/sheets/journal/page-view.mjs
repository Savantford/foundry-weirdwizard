import { i18n } from "../../helpers/utils.mjs";

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const DocumentSheetV2 = foundry.applications?.api?.DocumentSheetV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * * The Application responsible for displaying and editing a single JournalEntryPage character option.
 * @extends {JournalPageSheet}
*/

export default class WWPageView extends HandlebarsApplicationMixin(DocumentSheetV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'charoption'],
    tag: 'article',
    window: {
      title: this.title, // Custom title display
      icon: 'far fa-scroll',
      resizable: true,
      contentClasses: ['journal-entry-content', 'scrollable'],
    },
    position: {
      width: 570,
      height: 600
    }
  }

  /** @override */
  static PARTS = {
    ancestry: { template: 'systems/weirdwizard/templates/journal/ancestry-view.hbs' },
    path: { template: 'systems/weirdwizard/templates/journal/path-view.hbs' },
    profession: { template: 'systems/weirdwizard/templates/journal/profession-view.hbs' },
    tradition: { template: 'systems/weirdwizard/templates/journal/tradition-view.hbs' }
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // Completely overriding the parts
    options.parts = [this.document.type];
    
    return options;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  /*_getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    const canConfigure = game.user.isGM;

    if (canConfigure) {
      const sheetIndex = buttons.findIndex(btn => btn.label === "Sheet");

      // Add help button
      buttons.splice(sheetIndex, 0, {
        label: "Help", // "WW.System.Help" not working
        class: "help",
        icon: "fas fa-question",
        onclick: ev => this._onHelp(ev)
      });

    }

    return buttons;
  }*/

  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    const docData = this.document;

    const context = {
      document: docData, // Use a safe clone of the document data for further operations.
      system: docData.system,
      folder: await docData.folder,
      flags: docData.flags,
      dtypes: ['String', 'Number', 'Boolean']
    }

    context.data = {
      name: this.document.name,
      title: {
        show: true,
        level: 1
      }
    }

    //this._convertFormats(context);
    
    context.editor = {
      engine: "prosemirror",
      collaborate: true,
      content: await TextEditor.enrichHTML(context.document.text.content, {
        relativeTo: this.document,
        secrets: this.document.isOwner
      })
    };
    
    // Prepare Items Area Hint
    /*context.itemsAreaHint = `
      <p>${i18n("WW.CharOption.DropHere")}</p>
      <p>${i18n("WW.CharOption.Help", { itemType: document.type })}</p>
    `;*/

    // Prepare common select dropdown
    //context.spellsLearned = CONFIG.WW.SPELLS_LEARNED;
    
    // Prepare Benefits list
    if (this.document.system.benefits) {
      context.benefits = this.document.system.benefits;

      for (const b in context.benefits) {

        const benefit = context.benefits[b];

        // Prepare information for granted items
        benefit.itemsInfo = [];

        for (const i of benefit.items) {

          const retrieved = await fromUuid(i);

          benefit.itemsInfo.push({
            uuid: i,
            name: retrieved ? retrieved.name : i18n('WW.CharOption.Unknown'),
            img: retrieved ? retrieved.img : '',
            description: retrieved ? retrieved.system.description.value : i18n('WW.CharOption.MissingRef'),
            missing: retrieved ? false : true
          });

        }

      }
    }

    // Prepare paths
    if (this.document.type === 'path') {
      context.tiers = CONFIG.WW.PATH_TIERS;
    }

    // Prepare professions
    if (this.document.type === 'profession') {
      context.professionCategories = CONFIG.WW.PROFESSION_CATEGORIES;
    }

    // Prepare Traditions
    if (this.document.type === 'tradition') {

      // Prepare talents
      const talents = this.document.system.talents;
      context.talents = [];
      
      for (const t in talents) {
        const talent = await fromUuid(talents[t]);
        
        // Prepare enriched variables for editor
        talent.system.description.enriched = await TextEditor.enrichHTML(talent.system.description.value, { async: true, secrets: talent.isOwner, relativeTo: talent });

        context.talents.push(talent);
      }

      // Prepare spells
      const spells = this.document.system.spells;
      context.spells = {
        novice: [],
        expert: [],
        master: [],
      };

      for (const tier in spells) {
        const list = spells[tier];
        
        for (const s in list) {
          const spell = await fromUuid(list[s]);

          // Prepare enriched variables for editor
          spell.system.description.enriched = await TextEditor.enrichHTML(spell.system.description.value, { async: true, secrets: spell.isOwner, relativeTo: spell });

          context.spells[tier].push(spell);
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
  /*_convertFormats(renderData) {
    const formats = CONST.JOURNAL_ENTRY_PAGE_FORMATS;
    const text = this.document.text;
    if ( (this.constructor.format === formats.MARKDOWN) && text.content?.length && !text.markdown?.length ) {
      // We've opened an HTML document in a markdown editor, so we need to convert the HTML to markdown for editing.
      renderData.data.text.markdown = this.constructor._converter.makeMarkdown(text.content.trim());
    }
  }*/

  /* -------------------------------------------- */

  /*async _onHelp(event) {
    const entry = await fromUuid('Compendium.weirdwizard.documentation.JournalEntry.R3pFihgoMAB2Uab5');
    entry.sheet.render(true);
  }*/
  
}