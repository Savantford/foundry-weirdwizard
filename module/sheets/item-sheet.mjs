import { onManageActiveEffect, onManageInstantEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { i18n } from '../helpers/utils.mjs';
import ListEntryConfig from '../apps/list-entry-config.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
*/

export default class WWItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["weirdwizard", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: null, dropSelector: ".items-area" }] // ".items-area"
    });
  }

  /** @override */
  get template() {
    const path = "systems/weirdwizard/templates/items";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;
    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `item-Weapon-sheet.hbs`
    return `${path}/${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    context.system = context.item.system;

    // Prepare enriched variables for editor
    context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true, relativeTo: this.document });
    
    // Prepare character options
    if (this.item.charOption) {
      await this._prepareCharOption(context);

    } else {
      // Prepare regular items
      await this._prepareRegularItem(context);
    }
    
    return context;
  }

  /* -------------------------------------------- */

  /**
   * Prepare a regular item (Equipment, Talents and Spells) data.
  */

  async _prepareRegularItem(context) {

    if (context.item.type == 'Equipment' && context.item.system.subtype == 'weapon' && context.system.attackRider.value) {
      context.system.attackRider.enriched = await TextEditor.enrichHTML(context.system.attackRider.value, { async: true, relativeTo: this.document });
    }

    context.system.attributeLabel = CONFIG.WW.ATTRIBUTES[context.system.attribute];

    // Prepare common dropdown menu objects
    context.attributes = CONFIG.WW.ROLL_ATTRIBUTES;
    context.against = CONFIG.WW.ROLL_AGAINST;
    context.targetingMethods = CONFIG.WW.TARGETING_METHODS;
    context.templateTypes = CONFIG.WW.TEMPLATE_TYPES;

    // Prepare specific dropdown menu objects
    switch (context.item.type) {
  
      case 'Equipment':
        context.subtypes = CONFIG.WW.EQUIPMENT_SUBTYPES;
        context.coins = CONFIG.WW.COINS;
        context.qualities = CONFIG.WW.EQUIPMENT_QUALITIES;
        context.armorTypes = CONFIG.WW.ARMOR_TYPES;

        if (context.system.subtype == 'weapon') {
          context.requirements = CONFIG.WW.WEAPON_REQUIREMENTS;
          context.grips = CONFIG.WW.WEAPON_GRIPS;
          context.traits = CONFIG.WW.WEAPON_TRAITS;
        }

      break;

      case 'Trait or Talent':
        context.subtypes = CONFIG.WW.TALENT_SUBTYPES;
        context.sources = CONFIG.WW.TALENT_SOURCES;
      break;

      case 'Spell':
        context.tiers = CONFIG.WW.TIERS;
      break;
      
    }

    // Prepare instant effects
    let instEffs = context.system.instant;

    instEffs.forEach((e,id) => {
      const obj = e;
      obj.locLabel = CONFIG.WW.INSTANT_LABELS[e.label];
      obj.locTrigger = CONFIG.WW.INSTANT_TRIGGERS[e.trigger];
      obj.locTarget = CONFIG.WW.EFFECT_TARGETS[e.target];
      obj.icon = CONFIG.WW.INSTANT_ICONS[e.label];
      
      instEffs[id] = obj;
    })
    
    context.instantEffects = instEffs;

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.document.effects);
    
    for (const cat in context.effects) {
      const category = context.effects[cat];
      for (const e in category.effects) {
        const effect = category.effects[e];
        effect.locTrigger = CONFIG.WW.INSTANT_TRIGGERS[effect.trigger];
        effect.locTarget = CONFIG.WW.EFFECT_TARGETS_TARGETED[effect.target];
      }
    }

    // Prepare effect change labels to display
    context.effectChangeLabels = CONFIG.WW.EFFECT_CHANGE_LABELS;

    // Pass down whether the item needs targets or not
    context.needTargets = this.document.needTargets;
    const grantedById = this.document.flags.weirdwizard?.grantedBy;
    if (grantedById) context.grantedBy = this.document.actor.items.get(grantedById).name;
  }

  /* -------------------------------------------- */

  /**
   * Prepare a character option (Ancestry or Path) data.
  */

  async _prepareCharOption(context) {

    const item = context.item;

    // Prepare dropdown objects
    context.spellsLearned = CONFIG.WW.SPELLS_LEARNED;
    
    // Prepare paths
    if (this.document.type === 'Path') {
      context.hasActor = this.document.actor ? true : false;
      
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
    context.benefits = item.system.benefits;

    for (const b in context.benefits) {
      const benefit = context.benefits[b];

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

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    const canConfigure = game.user.isGM;

    if (canConfigure) {
      const sheetIndex = buttons.findIndex(btn => btn.label === "Sheet");

      if (this.item.charOption) {

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

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Input resize
    //resizeInput(html);

    const system = this.document.system;

    // Effects management
    html.find('.effect-control').click(ev => onManageActiveEffect(ev, this.document));
    html.find('.instant-control').click(ev => onManageInstantEffect(ev, this.document));

    // If it's a character option
    if (this.item.charOption) {
      
      // Reference handling
      html.find('.ref-edit').click(ev => this._onRefEdit(ev));
      html.find('.ref-remove').click(ev => this._onRefRemove(ev));
      
      // Handle help
      html.find('.help').click(ev => this._onHelp(ev));

      // Handle array elements
      html.find('.array-button').click(this._onListEntryButtonClicked.bind(this));

    }

  }

  /* -------------------------------------------- */

  async _onRefEdit(event) {
    
    const li = event.currentTarget.closest('.path-item');
    const item = await fromUuid(li.dataset.itemUuid);
    
    await item.compendium.apps[0]._render(true);
    await item.sheet._render(true);
    
  }

  /* -------------------------------------------- */

  async _onRefRemove(event) {
    
    const li = event.currentTarget.closest('.path-item');
    const uuid = li.dataset.itemUuid;
    const ol = event.currentTarget.closest('.items-area');
    const benefit = ol.classList[2];

    // Remove the UUID from the benefit's items
    let benefits = this.item.system.benefits;
    const arr = benefits[benefit].items.filter(v => { return v !== uuid; });
    benefits[benefit].items = arr;

    // Open a dialog to confirm
    const confirm = await Dialog.confirm({
      title: i18n('WW.CharOption.Reference.RemoveDialog.Title'),
      content: `<p>${i18n('WW.CharOption.Reference.RemoveDialog.Msg')}</p><p class="dialog-sure">${i18n('WW.CharOption.Reference.RemoveDialog.Confirm')}</p>`
    });

    if (!confirm) return;

    // Update the item
    this.item.update({ 'system.benefits': benefits });
  }

  async _onHelp(event) {
    let uuid = '';

    // Help is for a Character Option
    if (this.item.charOption) {
      uuid = 'Compendium.weirdwizard.docs.JournalEntry.Lrr8Rl7mRIIoYeW1';
    
    // Help is for Atributte Calls and Inline Rolls
    } else {
      uuid = 'Compendium.weirdwizard.docs.JournalEntry.0xYsAWtUJS591nz9';
    }

    const entry = await fromUuid(uuid);

    entry.sheet.render(true);
  }

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
      oldArray = foundry.utils.getProperty(this.document, arrPath);
    
    const defaultName = (arrPath.includes('languages') && !oldArray.length) ? i18n('WW.Detail.Language.Common') : i18n('WW.Detail.' + dataset.loc + '.New'),
      arr = [...oldArray, { name: defaultName }];
    
    // Update document
    await this.document.update({[arrPath]: arr});
    
    // Add entryId to dataset and render the config window
    dataset.entryId = arr.length-1;
    new ListEntryConfig(this.document, dataset).render(true);
    
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
      arr = [...foundry.utils.getProperty(this.document, arrPath)];
    
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
  /*  Drop item events                            */
  /* -------------------------------------------- */

  /* -------------------------------------------- */
  /*  Drag and Drop                               */
  /* -------------------------------------------- */

  /** @inheritdoc */
  /*_canDragStart(selector) {
    return this.isEditable;
  }*/

  /* -------------------------------------------- */

  /** @inheritdoc */
  /*_canDragDrop(selector) {
    return this.isEditable;
  }*/

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onDragStart(event) {
    
    /*const li = event.currentTarget;
    if ( event.target.classList.contains("content-link") ) return;

    // Create drag data
    let dragData;

    // Owned Items
    if ( li.dataset.itemId ) {
      const item = this.actor.items.get(li.dataset.itemId);
      dragData = item.toDragData();
    }

    // Active Effect
    if ( li.dataset.effectId ) {
      const effect = this.actor.effects.get(li.dataset.effectId);
      dragData = effect.toDragData();
    }

    if ( !dragData ) return;

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));*/
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

    //const rightCol = event.target.closest('.right-col');
    //const areas = rightCol.querySelectorAll(".example");
    
    // Get basic data
    const data = TextEditor.getDragEventData(event);
    const ol = event.target.closest('.items-area');
    
    if (!ol) return;

    $(ol).removeClass('fadeout')

    const benefit = ol.classList[2];

    if (data.type !== "Item") return;

    const item = await fromUuid(data.uuid);
    
    if (!(item.type === 'Equipment' || item.type === 'Trait or Talent' || item.type === 'Spell')) {
      return ui.notifications.warn(i18n('WW.CharOption.TypeWarning'));
    }

    if (!item.pack) return ui.notifications.warn(i18n('WW.CharOption.CompendiumWarning'));
    
    const benefits = this.document.system.benefits;

    benefits[benefit].items.push(data.uuid);

    this.document.update({'system.benefits': benefits});

  }

  /* -------------------------------------------- */

  /**
   * Handle the dropping of ActiveEffect data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    const effect = await ActiveEffect.implementation.fromDropData(data);
    if ( !this.actor.isOwner || !effect ) return false;
    if ( this.actor.uuid === effect.parent?.uuid ) return false;
    return ActiveEffect.create(effect.toObject(), {parent: this.actor});
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if ( !this.actor.isOwner ) return false;
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropItem(event, data) {
    if ( !this.actor.isOwner ) return false;
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    // Handle item sorting within the same Actor
    if ( this.actor.uuid === item.parent?.uuid ) return this._onSortItem(event, itemData);

    // Create the owned item
    return this._onDropItemCreate(itemData);
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if ( !this.actor.isOwner ) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if ( folder.type !== "Item" ) return [];
    const droppedItemData = await Promise.all(folder.contents.map(async item => {
      if ( !(document instanceof Item) ) item = await fromUuid(item.uuid);
      return item.toObject();
    }));
    return this._onDropItemCreate(droppedItemData);
  }

  /* -------------------------------------------- */

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData     The item data requested for creation
   * @returns {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments("Item", itemData);
  }

  /* -------------------------------------------- */

  /**
   * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings
   * @param {Event} event
   * @param {Object} itemData
   * @private
   */
  _onSortItem(event, itemData) {

    // Get the drag source and drop target
    const items = this.actor.items;
    const source = items.get(itemData._id);
    const dropTarget = event.target.closest("[data-item-id]");
    if ( !dropTarget ) return;
    const target = items.get(dropTarget.dataset.itemId);

    // Don't sort on yourself
    if ( source.id === target.id ) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for ( let el of dropTarget.parentElement.children ) {
      const siblingId = el.dataset.itemId;
      if ( siblingId && (siblingId !== source.id) ) siblings.push(items.get(el.dataset.itemId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(source, {target, siblings});
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.actor.updateEmbeddedDocuments("Item", updateData);
  }

  /** @override */
  async _onDropItemCreate(itemData) {
    
    const isAllowed = await this.checkDroppedItem(itemData)
    if (isAllowed) return await super._onDropItemCreate(itemData)
    console.warn('Wrong item type dragged', this.actor, itemData)
  }

  /* -------------------------------------------- */
  /** @override */
  async checkDroppedItem(itemData) {
    const type = itemData.type
    if (['specialaction', 'endoftheround'].includes(type)) return false

    if (type === 'ancestry') {
      const currentAncestriesIds = this.actor.items.filter(i => i.type === 'ancestry').map(i => i._id)
      if (currentAncestriesIds?.length > 0) await this.actor.deleteEmbeddedDocuments('Item', currentAncestriesIds)
      return true
    } else if (type === 'path' && this.actor.system.paths?.length >= 3) return false

    return true
  }


}
