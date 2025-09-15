import WWDialog from "../../apps/dialog.mjs";
import { EntrySettingsDisplay } from "../../apps/entry-settings-display.mjs";
import { defaultListEntryKey, defaultListEntryName, i18n } from "../../helpers/utils.mjs";
import WWSheetMixin from "../ww-sheet.mjs";

const JournalEntryPageHandlebarsSheet = foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet;
/**
 * * The Application responsible for displaying and editing a single JournalEntryPage character option.
 * @extends {JournalEntryPageHandlebarsSheet}
*/

export default class WWCharOptionSheet extends WWSheetMixin(JournalEntryPageHandlebarsSheet) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['charoption'],
    window: {
      icon: 'fa-regular fa-scroll',
      controls: [
        {
          action: "openHelp",
          icon: "fa-solid fa-question",
          label: "WW.System.CharOptionHelp",
          ownership: "OBSERVER"
        }
      ]
    },
    secrets: [
      { parentSelector: ".editor" }
    ],
    actions: {
      openHelp: this.#onOpenHelp,

      entryCreate: this.#onEntryCreate,
      entryEdit: this.#onEntryEdit,
      entryRemove: this.#onEntryRemove,
      entrySettings: this.#onEntrySettingsDisplay,

      refEdit: this.#onRefEdit,
      refRemove: this.#onRefRemove
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

  /** @override */
  _configureRenderParts(options) {
    const parts = this.isView ? this.constructor.VIEW_PARTS : this.constructor.EDIT_PARTS;
    return foundry.utils.deepClone(parts);
  }

  /* -------------------------------------------- */

  /**
   * @inheritdoc
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.text = { ...this.page.text };
    this.#convertFormats(context);

    const docData = this.page;
    const TextEditor = foundry.applications.ux.TextEditor.implementation;

    context.page = docData, // Use a safe clone of the document data for further operations.
    context.system = docData.system,
    context.folder = await docData.folder,
    context.flags = docData.flags,
    context.dtypes = ['String', 'Number', 'Boolean']
    context.singlePage = options?.window?.title ? true : false;

    context.editor = {
      engine: "prosemirror",
      collaborate: true,
      content: await TextEditor.enrichHTML(context.page.text.content, {
        relativeTo: this.page,
        secrets: this.page.isOwner
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
    if (this.page.system.benefits) {
      context.benefits = {...await this.page.system.benefits};
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
    if (this.isPath) {
      context.tiers = CONFIG.WW.PATH_TIERS;
    }

    // Prepare professions
    if (this.isProfession) {
      context.professionCategories = CONFIG.WW.PROFESSION_CATEGORIES;
    }

    // Prepare Traditions
    if (this.isTradition) {

      // Prepare talents
      const talents = this.page.system.talents;
      context.talents = [];
      
      for (const t in talents) {
        const talent = await fromUuid(talents[t]);
        
        // Prepare enriched variables for editor
        talent.system.description.enriched = await TextEditor.enrichHTML(talent.system.description.value, { secrets: talent.isOwner, relativeTo: talent });

        context.talents.push(talent);
      }

      // Prepare spells
      const spells = this.page.system.spells;
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
          spell.system.description.enriched = await TextEditor.enrichHTML(spell.system.description.value, { secrets: spell.isOwner, relativeTo: spell });

          context.spells[tier].push(spell);
        }
      }
    }
    
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Initialize Drag and Drop handlers
    const dragDropPairs = [
      {
        dragSelector: '.directory-list .item',
        dropSelector: '.items-area'
      }, {
        dragSelector: '.item-list .item',
        dropSelector: '.items-area'
      }, {
        dragSelector: '.draggable',
        dropSelector: '.actor'
      }, {
        dragSelector: '#entry-settings-display .draggable',
        dropSelector: '.benefit-block'
      }
    ];

    for (const dragDropPair of dragDropPairs) {
      new foundry.applications.ux.DragDrop.implementation({
        dragSelector: dragDropPair.dragSelector,
        dropSelector: dragDropPair.dropSelector,
        permissions: {
          dragstart: () => game.user.isGM,
          drop: () => this.isEditable,
        },
        callbacks: {
          dragstart: this._onDragStart.bind(this),
          dragover: this._onDragOver.bind(this),
          drop: this._onDrop.bind(this),
        },
      }).bind(this.element);
    }
  }

  /* -------------------------------------------- */
  /*  General purpose actions                     */
  /* -------------------------------------------- */

  static async #onOpenHelp() {
    const entry = await fromUuid('Compendium.weirdwizard.documentation.JournalEntry.R3pFihgoMAB2Uab5');
    entry.sheet.render(true);
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
  static async #onEntryCreate(event, button) {
    // Get data
    const dataset = Object.assign({}, button.dataset),
      listKey = dataset.listKey,
      listPath = dataset.listPath,
      path = 'system.' + listPath,
      obj = foundry.utils.getProperty(this.page, path),
      entryKey = defaultListEntryKey(obj, listKey),
      entryName = defaultListEntryName(obj, listKey),
    entry = { name: entryName };

    obj[entryKey] = entry;
    
    // Update document
    await this.page.update({ [path]: obj });

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
      content: await foundry.applications.handlebars.renderTemplate('systems/weirdwizard/templates/configs/list-entry-dialog.hbs', context),
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

    await this.page.update({ [path]: obj });

  }

  /**
   * Handle editing a list entry
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  static async #onEntryEdit(event, button) {
    // Get data
    const dataset = button.dataset,
      listPath = dataset.listPath,
      path = 'system.' + listPath,
      obj = foundry.utils.getProperty(this.page, path),
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
      content: await foundry.applications.handlebars.renderTemplate('systems/weirdwizard/templates/configs/list-entry-dialog.hbs', context),
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
    
    // Delete old key if key has changed
    if (entryKey !== dialogInput.key) obj['-=' + entryKey] = null;
    
    await this.page.update({ [path]: obj });

  }

  /**
   * Handle removing an entry from a list
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  static async #onEntryRemove(event, button) {
    if (event.currentTarget.classList.contains('benefit-block')) event.stopPropagation();
    
    const dataset = Object.assign({}, button.dataset),
      listPath = dataset.listPath,
      path = 'system.' + listPath,
      obj = foundry.utils.getProperty(this.page, path),
    key = dataset.entryKey;
    
    const newObj = {...obj }; 
    delete await newObj[key];
    
    // Update document
    await this.page.update({ [`${path}.-=${key}`]: null });
    
  }

  /**
    * Handle removing an element from an array
    * @param {Event} event          The originating click event
    * @param {HTMLElement} button   The button element originating the click event
    * @private
   */
  static #onEntrySettingsDisplay(event, button) {
    const dataset = Object.assign({}, button.dataset),
      listKey = dataset.listKey;

    new EntrySettingsDisplay({ listKey: listKey }).render(true);
  }

  /* -------------------------------------------- */
  /*  Char Options reference actions              */
  /* -------------------------------------------- */

  static async #onRefEdit(event, button) {
    const li = button.closest('.item-reference');
    const item = await fromUuid(li.dataset.itemUuid);
    
    await item.compendium.apps[0].render(true);
    await item.sheet.render(true);

  }

  /* -------------------------------------------- */

  static async #onRefRemove(event, button) {
    const li = button.closest('.item-reference');
    const ol = button.closest('.items-area');

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

    // Handle deletion
    if (this.isTradition) { // Is a Tradition
      const spells = this.page.system.spells;
      const talents = this.page.system.talents;
      
      if (item.type === 'spell') {
        const arr = spells[item.system.tier].filter(v => { return v !== uuid; });
        spells[item.system.tier] = arr;
        
        await this.page.update({ 'system.spells': spells });
      } else if (item.type === 'talent') {
        await this.page.update({ 'system.talents': talents.filter(v => { return v !== uuid; }) });
      }
    
    } else { // Not a Tradition
      // Remove the UUID from the benefit's items
      const benefits = this.page.system.benefits;
      const arr = benefits[benefit].items.filter(v => { return v !== uuid; });
      benefits[benefit].items = arr;

      await this.page.update({'system.benefits': benefits});
    }

  }

  /* -------------------------------------------- */
  /*  Drag and Drop                               */
  /* -------------------------------------------- */

  /**
   * An event that occurs when a drag workflow begins for a draggable item on the sheet.
   * @param {DragEvent} event       The initiating drag start event
   * @returns {Promise<void>}
   * @protected
   * @override
   */
  async _onDragStart(event) {
    const el = event.currentTarget;
    
    let dragData;

    // Items
    const itemUuid = el.dataset.itemUuid || el.closest('[data-item-uuid]')?.dataset.itemUuid;
    if ( itemUuid ) {
      const item = await fromUuid(itemUuid);
      dragData = item.toDragData();
      dragData.grantedBy = this.document.uuid;
    }
    
    // Journal Entry Pages
    const pageUuid = el.dataset.journalPageUuid || el.closest('[data-journal-page-uuid]')?.dataset.journalPageUuid;
    if ( pageUuid ) {
      const page = await fromUuid(pageUuid);
      dragData = page.toDragData();
      if ( this.document.uuid !== pageUuid ) dragData.grantedBy = this.document.uuid;
    }
    
    // Set data transfer
    if ( !dragData ) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------- */

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
  async _onDrop(event) {
    event.stopPropagation();
    
    if ( !this.isEditable ) return;
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    const journalEntry = this.document;
    const allowed = Hooks.call("dropJournalEntryPageSheetData", journalEntry, this, data);
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

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onDropDocument(event, item) {
    // Ignore other document types
    if (item.documentName !== 'Item') return;

    // Fade out the area around the correct drop places
    const ol = event.target.closest('.items-area');
    
    if (!ol) return;

    $(ol).removeClass('fadeout');

    const benefit = ol.classList[2];
    
    // Check if document is from the correct allowed types
    const docType = this.document.type;
    let allowedTypes = ['equipment', 'talent', 'spell'];

    if (docType === 'ancestry' || docType === 'tradition') allowedTypes = ['talent', 'spell'];
    if (docType === 'profession') allowedTypes = ['equipment'];

    // Return if not from an apropriate type
    if (allowedTypes.includes(document.type)) return await ui.notifications.warn(`
      ${i18n('WW.CharOption.TypeWarning')}
      <br/>
      ${i18n("WW.CharOption.Help", { itemType: item.type })}
    `);
    
    // Return with warning if not in a pack
    if (!item.pack) return await ui.notifications.warn(`
      ${i18n('WW.CharOption.CompendiumWarning')}
      <br/>
      ${i18n("WW.CharOption.Help", { itemType: item.type })}
    `);
    
    // Handle drop on Tradition
    if (this.isTradition) {
      const spells = this.document.system.spells;
      const talents = this.document.system.talents;

      if (item.type === 'spell' && !spells[item.system.tier].filter(x => x === item.uuid).length) {
        spells[item.system.tier].push(item.uuid);
        await this.document.update({ 'system.spells': spells });

      } else if (item.type === 'talent' && !talents.filter(x => x === item.uuid).length) {
        talents.push(item.uuid);
        await this.document.update({ 'system.talents': talents });

      } else if (item.type === 'equipment') {
        return ui.notifications.warn(i18n('WW.Tradition.EquipmentWarning'));
      }
    
    // Handle drop on non-Tradition
    } else {
      const benefits = this.document.system.benefits;
      
      await benefits[benefit].items.push(item.uuid);

      await this.document.update({'system.benefits': benefits});
    }

  }

  /* -------------------------------------------- */

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

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

  get isAncestry() {
    return this.document.type === 'ancestry';
  }

  get isPath() {
    return this.document.type === 'path';
  }

  get isProfession() {
    return this.document.type === 'profession';
  }

  get isTradition() {
    return this.document.type === 'tradition';
  }

  /* -------------------------------------------- */
  /*  Conversion                                  */
  /* -------------------------------------------- */

  /**
   * From {JournalEntryPageTextSheet}
   * Lazily convert text formats if we detect the document being opened in a different format.
   * @param {ApplicationRenderContext} context
   */
  #convertFormats(context) {
    const formats = CONST.JOURNAL_ENTRY_PAGE_FORMATS;
    const text = this.page.text;
    if ( (this.constructor.format === formats.MARKDOWN) && text.content?.length && !text.markdown?.length ) {
      // We've opened an HTML document in a markdown editor, so we need to convert the HTML to markdown for editing.
      context.text.markdown = this.constructor._converter.makeMarkdown(text.content.trim());
    }
  }
  
}