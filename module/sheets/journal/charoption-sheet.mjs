import WWDialog from "../../apps/dialog.mjs";
import { EntrySettingsDisplay } from "../../apps/entry-settings-display.mjs";
import { defaultListEntryKey, defaultListEntryName, i18n } from "../../helpers/utils.mjs";

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
        {dragSelector: '.draggable', dropSelector: '.actor'},
        {dragSelector: '#entry-settings-display .draggable', dropSelector: null}
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
      context.benefits = {...await this.document.system.benefits};
      context.listEntries = {};
      
      const listKeys = ['senses', 'descriptors', 'languages', 'immunities', 'movementTraits', 'traditions'];

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

        // Prepare key for granted list entries
        context.listEntries[b] = {};

        for (const listKey in benefit) {
          const list = await benefit[listKey];
          
          // Check for the listKeys and if it's an array
          if (benefit.hasOwnProperty(listKey) && listKeys.includes(listKey)) {
            const arr = [];

            for (const entryKey in list) {
              const entry = list[entryKey];

              arr.push({ ...await entry, key: entryKey });
            }
            
            context.listEntries[b][listKey] = arr;
            
          }

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
    /*if (this.document.isOwner) {
      
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
   * @param {Event} event   The originating click event
   * @private
  */

  _onListEntryButtonClicked(event) { // Use actions in v13 instead
    const button = event.currentTarget,
      dataset = Object.assign({}, button.dataset);
    
    switch (dataset.action) {
      case 'entryCreate': this.#onEntryCreate(event, button); break;
      case 'entryEdit': this.#onEntryEdit(event, button); break;
      case 'entryRemove': this.#onEntryRemove(event, button); break;
      case 'entrySettings': this.#onEntrySettingsDisplay(event, button); break;
    }
    
  }

  /* -------------------------------------------- */
  /*  List entry handling actions                 */
  /* -------------------------------------------- */

  /**
   * Handle adding an array entry
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  async #onEntryCreate(event, button) {
    // Get data
    const dataset = Object.assign({}, button.dataset),
      listKey = dataset.listKey,
      listPath = dataset.listPath,
      path = 'system.' + listPath,
      obj = foundry.utils.getProperty(this.document, path),
      entryKey = defaultListEntryKey(this.document, listKey, path),
      entryName = defaultListEntryName(this.document, listKey, path),
      entry = { name: entryName };

    obj[entryKey] = entry;
    
    // Update document
    await this.document.update({ [path]: obj });

    const context = {
      entry: entry,
      key: entryKey,
      showKey: true
    };

    // Show a dialog 
    const dialogInput = await WWDialog.input({
      window: {
        icon: "fa-solid fa-edit",
        title: 'WW.Settings.Entry.Edit',
      },
      content: await renderTemplate('systems/weirdwizard/templates/configs/list-entry-dialog.hbs', context),
      ok: {
        label: 'EFFECT.Submit',
        icon: 'fa-solid fa-save'
      },
      buttons: [
        {
          label: 'WW.System.Dialog.Cancel',
          icon: 'fa-solid fa-xmark'
        },
      ]
    });

    // Return if cancelled
    if (!dialogInput) return;

    // Return with warning if the key or name are missing
    if (!dialogInput.key || !dialogInput.name) return ui.notifications.warn(i18n('WW.Settings.Entry.EditWarning'));

    obj[dialogInput.key] = dialogInput;

    delete await obj[dialogInput.key].key;

    await this.document.update({ [path]: obj });

  }

  /**
   * Handle editing a list entry
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  async #onEntryEdit(event, button) {

    // Get data
    const dataset = button.dataset,
      listPath = dataset.listPath,
      path = 'system.' + listPath,
      obj = foundry.utils.getProperty(this.document, path),
      entryKey = dataset.entryKey,
    entry = obj[entryKey];
    
    const context = {
      entry: await entry,
      key: entryKey,
      showKey: true
    };

    // Show a dialog 
    const dialogInput = await WWDialog.input({
      window: {
        icon: "fa-solid fa-edit",
        title: 'WW.Settings.Entry.Edit',
      },
      content: await renderTemplate('systems/weirdwizard/templates/configs/list-entry-dialog.hbs', context),
      ok: {
        label: 'EFFECT.Submit',
        icon: 'fa-solid fa-save'
      },
      buttons: [
        {
          label: 'WW.System.Dialog.Cancel',
          icon: 'fa-solid fa-xmark'
        },
      ]
    });

    // Return if cancelled
    if (!dialogInput) return;

    // Return with warning if the key or name are missing
    if (!dialogInput.key || !dialogInput.name) return ui.notifications.warn(i18n('WW.Settings.Entry.EditWarning'));

    obj[dialogInput.key] = dialogInput;

    delete await obj[dialogInput.key].key;

    await this.document.update({ [path]: obj });

  }

  /**
   * Handle removing an entry from a list
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  async #onEntryRemove(event, button) {
    const dataset = Object.assign({}, button.dataset),
      listPath = dataset.listPath,
      path = 'system.' + listPath,
      baseObj = foundry.utils.getProperty(this.document.token?.baseActor, path),
    key = dataset.entryKey;
    
    // Update document
    if (baseObj && baseObj?.hasOwnProperty(key)) {
      await this.document.update({ [`${path}.${key}`]: null }); // If the key exists in the Base Actor, null it
    } else {
      console.log('deleting')
      await this.document.update({ [`${path}.-=${key}`]: null }); // Delete key otherwise
    }

  }

  /**
    * Handle removing an element from an array
    * @param {Event} event          The originating click event
    * @param {HTMLElement} button   The button element originating the click event
    * @private
   */
  #onEntrySettingsDisplay(event, button) {
    const dataset = Object.assign({}, button.dataset),
      listKey = dataset.listKey;

    new EntrySettingsDisplay({ listKey: listKey }).render(true);
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
    // Highlight items area or benefit block
    const ol = event.target.closest('.items-area') ?? event.target.closest('.benefit-block');

    if (!ol) return;

    if ($(ol).hasClass('fadeout')) return;

    $(ol).addClass('fadeout');

    ol.addEventListener("dragleave", (event) => $(ol).removeClass('fadeout') );
  }

  /* -------------------------------------------- */

  /**
   * @override
   * An event that occurs when data is dropped into a drop target.
   * @param {DragEvent} event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDrop(event) { // Delete in v13; core behavior
    if ( !this.isEditable ) return;
    const data = TextEditor.getDragEventData(event);
    const journalEntry = this.document;
    const allowed = Hooks.call("dropActorSheetData", journalEntry, this, data);
    if ( allowed === false ) return;
    
    // Dropped Documents
    const documentClass = getDocumentClass(data.type);
    if ( documentClass ) {
      const document = await documentClass.fromDropData(data);
      await this._onDropDocument(event, document);
    }

    // Dropped List Entry
    if (data.listKey) {
      await this._onDropListEntry(event, data);
    }

  }

  /** @inheritdoc */
  async _onDropDocument(event, document) {
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

  /**
   * Handle a droped List Entry on the Character Option Sheet.
   */
  async _onDropListEntry(event, dataset) {
    const div = event.target.closest('.benefit-block');
    
    if (!div) return;

    $(div).removeClass('fadeout');

    const { listKey: listKey, entryKey: key, entryName: name, desc: desc } = dataset;

    const benefit = div.dataset.benefitId,
      path = `system.benefits.${benefit}.${listKey}`,
    obj = {... foundry.utils.getProperty(this.document, path)};
    
    const entry = {
      name: name,
      desc: desc
    };

    obj[key] = entry;
    
    await this.document.update({ [path]: obj });
  }
  
}