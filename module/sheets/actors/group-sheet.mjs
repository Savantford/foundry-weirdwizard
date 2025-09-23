import { i18n } from '../../helpers/utils.mjs';
import WWSheetMixin from '../ww-sheet.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ActorSheetV2 = foundry.applications?.sheets?.ActorSheetV2 ?? (class {});

/**
 * Extend the basic ActorSheetV2 with modifications tailored for SotWW
 * @extends {ActorSheetV2}
 */
export default class WWGroupSheet extends WWSheetMixin(ActorSheetV2) {

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
      contentClasses: ['scrollable'],
      controls: [
      ]
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
  }

  /* -------------------------------------------- */
  static PARTS = {
    main: { template: 'systems/weirdwizard/templates/actors/group/main.hbs' }
  }

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    const actorData = this.actor;
    
    // Ensure editMode has a value
    if (this.editMode === undefined) this.editMode = false;
    
    const context = {
      actor: actorData, // Use a safe clone of the actor data for further operations.
    
      system: actorData.system, // Add the actor's data to context.system for easier access, as well as flags.
      folder: await actorData.folder,
      flags: actorData.flags,
      dtypes: ['String', 'Number', 'Boolean'],
      //tabs: this._getTabs(options.parts),

      level: actorData.system.level,
      tier: i18n(CONFIG.WW.TIERS[actorData.system.tier]),
      wrongLevels: actorData.system.wrongLevels
    }

    // Prepare Members
    context.members = { active: [], inactive: [], retired: [], dead: [] };

    for (const cat in actorData.system.membersList) {
      for (const m of actorData.system.membersList[cat]) {
        context.members[cat].push(await m.toAnchor());
      }
    }

    // Prepare Equipment
    context.equipment = { total: [], active: [], inactive: [] };

    for (const cat in actorData.system.equipmentList) {
      for (const i of actorData.system.equipmentList[cat]) {
        const item = {... i};
        item.ownerLink = await i.parent.toAnchor();
        item.subtypeLabel = CONFIG.WW.EQUIPMENT_SUBTYPES[i.system.subtype];

        context.equipment[cat].push(item);
      }
    }

    // Prepare Items
    context.items = this.actor.items.contents.toSorted((a, b) => a.sort - b.sort);
    //await this._prepareItems(context);

    // Add roll data for Prose Mirror editors
    context.rollData = actorData.getRollData();
    
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


  /* -------------------------------------------- */
  /*  Miscellaneous actions                       */
  /* -------------------------------------------- */

  static #onToggleEditMode() {
    this.editMode = !this.editMode;
    
    this.render(true);
  }

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
   * Handle a droped List Entry on the Character Option Sheet.
   */
  async _onDropListEntry(event, dataset) {
    const div = event.target.closest('.benefit-block');

    if (!div) return;

    $(div).removeClass('fadeout');

    const { listKey: listKey, entryKey: key, entryName: name, desc: desc } = dataset;

    const benefit = div.dataset.benefitId,
      path = `system.benefits.${benefit}.${listKey}`,
      obj = { ...foundry.utils.getProperty(this.document, path) };

    const entry = {
      name: name,
      desc: desc
    };

    obj[key] = entry;

    await this.document.update({ [path]: obj });
  }

  /* -------------------------------------------- */
  /*  Utility methods                             */
  /* -------------------------------------------- */

  
  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

}