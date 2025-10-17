import { defaultListEntryKey, defaultListEntryName, i18n } from '../../helpers/utils.mjs';
import { EntrySettingsDisplay } from '../../apps/entry-settings-display.mjs';
import WWActorSheet from './base-actor-sheet.mjs';
import WWDialog from '../../apps/dialog.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ActorSheetV2 = foundry.applications?.sheets?.ActorSheetV2 ?? (class {});

/**
 * Extend the basic ActorSheetV2 with modifications tailored for SotWW
 * @extends {ActorSheetV2}
 */
export default class WWGroupSheet extends WWActorSheet {

  constructor(options = {}) {
    super(options); // Required for the constructor to work 
  }
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'group'],
    tag: 'form',
    window: {
      icon: 'fa-solid fa-users',
      resizable: true,
      contentClasses: ['standard-form'],
      controls: []
    },
    actions: {
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 500,
      height: 500
    }
  };

  static PARTS = {
    header: {template: 'systems/weirdwizard/templates/actors/group/header.hbs'},
    tabs: {template: 'systems/weirdwizard/templates/generic/side-tabs.hbs'},
    details: {template: 'systems/weirdwizard/templates/actors/group/details.hbs'},
    resources: {
      template: 'systems/weirdwizard/templates/actors/group/resources.hbs',
      templates: ['systems/weirdwizard/templates/actors/tabs/list-entry.hbs']
    }
  };

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        {id: "details", icon: "systems/weirdwizard/assets/icons/scroll-quill.svg", iconType: "img", tooltip: 'WW.Group.GeneralInfo'},
        {id: "resources", icon: "systems/weirdwizard/assets/icons/locked-chest.svg", iconType: "img", tooltip: 'WW.Group.Resources'}
      ],
      initial: "details",
      labelPrefix: "EFFECT.TABS"
    }
  };

  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);
    const actorData = this.actor;

    context.tier = i18n(CONFIG.WW.TIERS[actorData.system.tier]);
    
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);
    
    if (partId in partContext.tabs) partContext.tab = partContext.tabs[partId];

    switch (partId) {
      case 'details': {
        // Prepare Members
        partContext.members = { active: [], inactive: [], retired: [], dead: [] };

        for (const cat in context.actor.system.membersList) {
          for (const m of context.actor.system.membersList[cat]) {
            partContext.members[cat].push(await m.toAnchor());
          }
        }

        // Prepare Text Editors
        const TextEditor = foundry.applications.ux.TextEditor.implementation;
        const details = context.system.details;
        
        partContext.enrichedDetails = {
          origin: await TextEditor.enrichHTML(details.origin, { secrets: this.actor.isOwner }),
          achievements: await TextEditor.enrichHTML(details.achievements, { secrets: this.actor.isOwner }),
          notes: await TextEditor.enrichHTML(details.notes, { secrets: this.actor.isOwner }),
        }
      } break;
      case 'resources': {
        // Prepare form fields
        partContext.fortune = {
          name: `system.resources.fortune`,
          value: context.system.resources.fortune,
          field: new foundry.data.fields.BooleanField()
        }

        // Prepare list entries
        const listEntries = {};

        for (const listKey in context.system.listEntries) {
          const list = context.system.listEntries[listKey];
          
          listEntries[listKey] = [];
          
          for (const entryKey in list) {
            const entry = list[entryKey];
            
            if (entry) listEntries[listKey].push({ ...entry, key: entryKey });
          }

        }
        
        partContext.listEntries = listEntries;

        // Prepare Equipment
        partContext.equipment = { total: [], active: [], inactive: [] };

        for (const cat in context.actor.system.equipmentList) {
          for (const i of context.actor.system.equipmentList[cat]) {
            const item = {... i};
            item.ownerLink = await i.parent.toAnchor();
            item.subtypeLabel = CONFIG.WW.EQUIPMENT_SUBTYPES[i.system.subtype];

            partContext.equipment[cat].push(item);
          }
        }

        // Prepare Items
        partContext.items = this.actor.items.contents.toSorted((a, b) => a.sort - b.sort);
        //await this._prepareItems(context);

      } break;
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
        dragSelector: '.directory-item.actor',
        dropSelector: '.members-area'
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
  /*  General Event Listeners and Handlers        */
  /* -------------------------------------------- */

  static async #onGroupRest() {
    // Rest all characters
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

    // Actors
    const actorUuid = el.dataset.actorUuid || el.closest('[data-actor-uuid]')?.dataset.actorUuid;
    if (actorUuid) {
      const actor = await fromUuid(actorUuid);
      dragData = actor.toDragData();
      dragData.grantedBy = this.document.uuid;
    }

    // Set data transfer
    if (!dragData) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onDragOver(event) {
    // Highlight members area
    const ol = event.target.closest('.members-area');

    if (!ol) return;

    if ($(ol).hasClass('fadeout')) return;

    $(ol).addClass('fadeout');

    ol.addEventListener("dragleave", (event) => $(ol).removeClass('fadeout'));
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
    
    if (!this.isEditable) return;
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    const journalEntry = this.document;
    const allowed = Hooks.call("dropJournalEntryPageSheetData", journalEntry, this, data);
    if (allowed === false) return;

    // Dropped Documents
    const documentClass = getDocumentClass(data.type);
    if (documentClass) {
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
  async _onDropDocument(event, actor) {
    // Ignore other document types
    if (actor.documentName !== 'Actor') return;

    // Fade out the area around the correct drop places
    const ol = event.target.closest('.members-area');

    if (!ol) return;

    $(ol).removeClass('fadeout');
    
    const memberCat = ol.classList[1];

    // Check if document is from the correct allowed types
    const allowedTypes = ['character', 'npc', 'vehicle'];

    // Return if not from an appropriate type
    if (allowedTypes.includes(document.type)) return await ui.notifications.warn(`
        ${i18n('WW.CharOption.TypeWarning')}
        <br/>
        ${i18n("WW.CharOption.Help", { actorType: actor.type })}
      `);

    // Handle drop
    const memberCats = this.document.system.members;

    await memberCats[memberCat].push(actor.uuid);

    await this.document.update({ 'system.members': memberCats });

  }

  /* -------------------------------------------- */

  /**
   * Handle a droped List Entry on the Actor Sheet.
   */
  async _onDropListEntry(event, data) {
    const { listKey: listKey, entryKey: key, entryName: name, desc: desc } = data,
    obj = {... this.actor.system.listEntries[listKey]};
    
    const entry = {
      name: name,
      desc: desc
    };

    obj[key] = entry;
    
    await this.actor.update({ ['system.listEntries.' + listKey]: obj });
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

}