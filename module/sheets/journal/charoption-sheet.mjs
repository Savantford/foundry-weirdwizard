import WWDialog from "../../apps/dialog.mjs";
import { i18n } from "../../helpers/utils.mjs";
import ListEntryConfig from "../configs/list-entry-config.mjs";

/**
 * * The Application responsible for displaying and editing a single JournalEntryPage character option.
 * @extends {JournalPageSheet}
*/

export default class WWCharOptionSheet extends JournalPageSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      closeOnSubmit: false,
      submitOnClose: true,
      submitOnChange: true,
      resizable: true,
      dragDrop: [
        {dragSelector: '.directory-list .item', dropSelector: '.items-area'},
        {dragSelector: '.item-list .item', dropSelector: '.items-area'},
        {dragSelector: '.draggable', dropSelector: '.actor'}
      ],
      secrets: [{parentSelector: ".editor"}]
    });
  }

  /** @override */
  /*static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'charoption'],
    window: {
      icon: 'fa-solid fa-user'
    },
    dragDrop: [
      {dragSelector: null, dropSelector: '.items-area'},
      //{dragSelector: ".directory-list .item", dropSelector: null},
      //{dragSelector: ".item-list .item", dropSelector: null}
    ]
  }*/

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

      // Add help button
      buttons.splice(sheetIndex, 0, {
        label: "Help", // "WW.System.Help" not working
        class: "help",
        icon: "fa-solid fa-question",
        onclick: ev => this._onHelp(ev)
      });

    }

    return buttons;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options={}) { // Swap by _prepareContext() in V2
    const context = super.getData(options);
    this._convertFormats(context);
    
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

    // Prepare Items Area Hint
    context.itemsAreaHint = `
      <p>${i18n("WW.CharOption.DropHere")}</p>
      <p>${i18n("WW.CharOption.Help", { itemType: document.type })}</p>
    `;

    // Prepare common select dropdown
    context.spellsLearned = CONFIG.WW.SPELLS_LEARNED;
    
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
  _convertFormats(renderData) {
    const formats = CONST.JOURNAL_ENTRY_PAGE_FORMATS;
    const text = this.object.text;
    if ( (this.constructor.format === formats.MARKDOWN) && text.content?.length && !text.markdown?.length ) {
      // We've opened an HTML document in a markdown editor, so we need to convert the HTML to markdown for editing.
      renderData.data.text.markdown = this.constructor._converter.makeMarkdown(text.content.trim());
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Reference handling
    html.find('.ref-edit').click(ev => this._onRefEdit(ev));
    html.find('.ref-remove').click(ev => this._onRefRemove(ev));

    // Handle help
    html.find('.help').click(ev => this._onHelp(ev));

    // Handle array elements
    html.find('.array-button').click(this._onListEntryButtonClicked.bind(this));

  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  /*async _onRender(context, options) {
    await super._onRender(context, options);

    // Create dragDrop listener
    this.#dragDrop.forEach((d) => d.bind(this.element));

    new DragDrop({ // Remove in v13; core implementation
      dragSelector: ".draggable",
      dropSelector: null,
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this)
      }
    }).bind(this.element);

    // Drag events for macros.
    /*if (this.actor.isOwner) {
      
      const handler = ev => this._onDragStart(ev)

      html.find('.dropitem').each((i, li) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }

  }*/

  /*async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
  }*/

  /* -------------------------------------------- */
  /*  Array button actions                        */
  /* -------------------------------------------- */

  /**
   * Handle clicked array buttons
   * @param {Event} ev   The originating click event
   * @private
  */

  _onListEntryButtonClicked(ev) {
    const button = ev.currentTarget,
      dataset = Object.assign({}, button.dataset);
    
    switch (dataset.action) {
      case 'add': this._onListEntryButtonAdd(dataset); break;
      case 'edit': this._onListEntryButtonEdit(dataset); break;
      case 'remove': this._onListEntryButtonRemove(dataset); break;
    }
    
  }

  /**
   * Handle adding an array entry
   * @param dataset   The dataset
   * @private
  */
  async _onListEntryButtonAdd(dataset) {
    
    const arrPath = 'system.' + dataset.array,
      arr = foundry.utils.getProperty(this.document, arrPath);
    
    // Push new element with a default name
    const defaultName = (arrPath.includes('languages') && !arr.length) ? i18n('WW.Detail.Language.Common') : i18n('WW.Detail.' + dataset.loc + '.New');
    await arr.push({ name: defaultName })
    
    // Update document
    await this.document.update({[arrPath]: arr});

    // Add entryId to dataset and render the config window
    dataset.entryId = arr.length-1;
    new ListEntryConfig(await this.document, await dataset).render(true);
    
  }
  
  /**
   * Handle edditing a list entry
   * @param {Event} ev   The originating click event
   * @private
  */

  _onListEntryButtonEdit(dataset) {
    
    // Render ListEntryConfig
    new ListEntryConfig(this.document, dataset).render(true);
    
  }

  /**
   * Handle removing an element from an array
   * @param {Event} ev   The originating click event
   * @private
  */

  _onListEntryButtonRemove(dataset) {
    
    const arrPath = 'system.' + dataset.array,
      arr = foundry.utils.getProperty(this.document, arrPath);
    
    // Delete array element
    arr.splice(dataset.entryId, 1);
    
    // Update document
    this.document.update({[arrPath]: arr});
    
  }

  /* -------------------------------------------- */
  /*  Array button actions                        */
  /* -------------------------------------------- */
  
  /**
   * Handle clicked array buttons
   * @param {Event} ev   The originating click event
   * @private
  */

  _onArrayButtonClicked(ev) {
    const button = ev.currentTarget,
      dataset = Object.assign({}, button.dataset);

    
    switch (dataset.action) {
      case 'add': this._onArrayButtonAdd(dataset); break;
      case 'remove': this._onArrayButtonRemove(dataset); break;
    }
    
  }
  
  /* -------------------------------------------- */

  async _onRefEdit(event) {

    const li = event.currentTarget.closest('.item-reference');
    const item = await fromUuid(li.dataset.itemUuid);
    
    await item.compendium.apps[0]._render(true);
    await item.sheet.render(true);

  }

  /* -------------------------------------------- */

  async _onRefRemove(event) {

    const li = event.currentTarget.closest('.item-reference');
    const ol = event.currentTarget.closest('.items-area');

    const benefit = ol.classList[2];
    const uuid = li.dataset.itemUuid;
    const item = await fromUuid(uuid);

    // Open a dialog to confirm
    const confirm = await WWDialog.confirm({
      window: {
        title: 'WW.CharOption.Reference.RemoveDialog.Title',
        icon: 'fa-solid fa-trash'
      },
      content: `
        <div>${i18n('WW.CharOption.Reference.RemoveDialog.Msg')}</div>
        <div class="dialog-sure">${i18n('WW.CharOption.Reference.RemoveDialog.Confirm')}</div>
      `
    });

    if (!confirm) return;

    // Handle delete on Tradition
    if (this.document.type === 'tradition') {
      const spells = this.document.system.spells;
      const talents = this.document.system.talents;
      
      if (item.type === 'Spell') {
        const arr = spells[item.system.tier].filter(v => { return v !== uuid; });
        spells[item.system.tier] = arr;
        
        await this.document.update({ 'system.spells': spells });
      } else if (item.type === 'Trait or Talent') {
        await this.document.update({ 'system.talents': talents.filter(v => { return v !== uuid; }) });
      }
    
    // Handle delete on non-Tradition
    } else {
      // Remove the UUID from the benefit's items
      const benefits = this.document.system.benefits;
      const arr = benefits[benefit].items.filter(v => { return v !== uuid; });
      benefits[benefit].items = arr;

      await this.document.update({'system.benefits': benefits});
    }

  }

  /* -------------------------------------------- */

  async _onHelp(event) {
    const entry = await fromUuid('Compendium.weirdwizard.documentation.JournalEntry.R3pFihgoMAB2Uab5');
    entry.sheet.render(true);
  }

  /* -------------------------------------------- */
  /*  Drag and Drop                               */
  /* -------------------------------------------- */

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * An event that occurs when a drag workflow begins for a draggable item on the sheet.
   * @param {DragEvent} event       The initiating drag start event
   * @returns {Promise<void>}
   * @protected
   * @override
   */
  async _onDragStart(event) {
    const li = event.currentTarget;
    
    let dragData;

    // Items
    if ( li.dataset.itemUuid ) {
      const item = await fromUuid(li.dataset.itemUuid);
      dragData = item.toDragData();
      dragData.grantedBy = this.document.uuid;
    }

    // Journal Entry Pages
    if ( li.dataset.journalPageUuid ) {
      const page = await fromUuid(li.dataset.journalPageUuid);
      dragData = page.toDragData();
      if ( this.document.uuid !== li.dataset.journalPageUuid ) dragData.grantedBy = this.document.uuid;
    }
    
    // Set data transfer
    if ( !dragData ) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /** @inheritdoc */
  _onDragOver(event) {
    const ol = event.target.closest('.items-area');

    if ($(ol).hasClass('fadeout')) return;

    $(ol).addClass('fadeout');

    ol.addEventListener("dragleave", (event) => $(ol).removeClass('fadeout') );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onDrop(event) {
    // Get basic drop event data
    const data = TextEditor.getDragEventData(event);
    const ol = event.target.closest('.items-area');
    
    if (!ol) return;

    $(ol).removeClass('fadeout');

    const benefit = ol.classList[2];

    if (data.type !== "Item") return; // Receive only Items as drops

    const item = await fromUuid(data.uuid);
    
    if (!(item.type === 'Equipment' || item.type === 'Trait or Talent' || item.type === 'Spell')) {
      return ui.notifications.warn(`${i18n('WW.CharOption.TypeWarning')}<br/>${i18n("WW.CharOption.Help", { itemType: this.document.type })}`);
    }

    if (!item.pack) return ui.notifications.warn(`${i18n('WW.CharOption.CompendiumWarning')}<br/>${i18n("WW.CharOption.Help", { itemType: this.document.type })}`);
    
    // Handle drop on Tradition
    if (this.document.type === 'tradition') {
      const spells = this.document.system.spells;
      const talents = this.document.system.talents;

      if (item.type === 'Spell' && !spells[item.system.tier].filter(x => x === item.uuid).length) {
        spells[item.system.tier].push(item.uuid);
        await this.document.update({ 'system.spells': spells });

      } else if (item.type === 'Trait or Talent' && !talents.filter(x => x === item.uuid).length) {
        talents.push(item.uuid);
        await this.document.update({ 'system.talents': talents });

      } else if (item.type === 'Equipment') {
        return ui.notifications.warn(i18n('WW.Tradition.EquipmentWarning'));
      }
    
    // Handle drop on non-Tradition
    } else {
      const benefits = this.document.system.benefits;
      
      benefits[benefit].items.push(item.uuid);

      await this.document.update({'system.benefits': benefits});
    }

  }
  
}