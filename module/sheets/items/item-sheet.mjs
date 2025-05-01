import { i18n } from '../../helpers/utils.mjs';
import ListEntryConfig from '../configs/list-entry-config.mjs';
import MultiChoice from '../../apps/multi-choice.mjs';
import {
  createActiveEffect, deleteActiveEffect, editActiveEffect,
  createInstantEffect, deleteInstantEffect, editInstantEffect,
  prepareActiveEffectCategories
} from '../../helpers/effect-actions.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ItemSheetV2 = foundry.applications?.sheets?.ItemSheetV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * Extend the basic ItemSheetV2 with modifications tailored for SotWW
 * @extends {ItemSheetV2}
*/

export default class WWItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  constructor(options = {}) {
    super(options); // Required for the constructor to work 
  }
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'item'],
    tag: 'form',
    window: {
      title: this.title, // Custom title display
      icon: 'far fa-scroll',
      resizable: true,
      contentClasses: ['scrollable']
    },
    actions: {
      editImage: this.#onEditImage, // delete in V13; core functionality
      showItemArtwork: this.#onShowItemArtwork,
      traitsMenu: this.#onTraitsMenuOpen,

      instantCreate: this.#onInstantEffectCreate,
      instantEdit: this.#onInstantEffectEdit,
      instantRemove: this.#onInstantEffectRemove,
      
      effectCreate: this.#onActiveEffectCreate,
      effectEdit: this.#onActiveEffectEdit,
      effectRemove: this.#onActiveEffectRemove
    },
    form: {
      handler: this.#onSubmitDocumentForm, // delete in v13, core functionality
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 520,
      height: 480
    }
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    const {constructor: cls, id, name, type} = this.document;
    const prefix = cls.hasTypeData && type !== "base" ? CONFIG[cls.documentName].typeLabels[type] : cls.metadata.label;
    return `${name ?? id} - ${game.i18n.localize(prefix)}`;
  }

  /* -------------------------------------------- */

  /** @override */
  static PARTS = {
    sidetabs: { template: 'systems/weirdwizard/templates/items/common/side-tabs.hbs' },
    
    details: {
      template: 'systems/weirdwizard/templates/items/details/tab.hbs',
      templates: [
        'systems/weirdwizard/templates/items/common/name-stripe.hbs',
        'systems/weirdwizard/templates/items/common/item-ribbon.hbs',
        'systems/weirdwizard/templates/items/common/portrait.hbs',
        'systems/weirdwizard/templates/items/details/equipment.hbs',
        'systems/weirdwizard/templates/items/details/weapon.hbs',
        'systems/weirdwizard/templates/items/details/talent.hbs',
        'systems/weirdwizard/templates/items/details/spell.hbs'
      ],
    },

    automation: {
      template: 'systems/weirdwizard/templates/items/automation/tab.hbs',
      templates: [
        'systems/weirdwizard/templates/items/automation/settings.hbs',
        'systems/weirdwizard/templates/items/automation/effects.hbs'
      ]
    },
    
  }
  
  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    const itemData = this.item;
    const isOwner = this.item.isOwner;

    // Ensure editMode has a value
    if (this.editMode === undefined) this.editMode = false;

    const context = {
      item: itemData, // Use a safe clone of the item data for further operations.
    
      system: itemData.system, // Use a safe clone of the item data for further operations.
      folder: await itemData.folder,
      flags: itemData.flags,
      dtypes: ['String', 'Number', 'Boolean'],
      tabs: this._getTabs(options.parts)
    }
    
    // Prepare enriched variables for editor
    context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true, secrets: isOwner, relativeTo: this.document });

    // Record if the item has an actor
    context.hasActor = this.document.actor ? true : false;
    
    // Prepare character options
    if (context.item.type == 'Equipment' && context.item.system.subtype == 'weapon' && context.system.attackRider.value) {
      context.system.attackRider.enriched = await TextEditor.enrichHTML(context.system.attackRider.value, { async: true, secrets: isOwner, relativeTo: this.document });
    }

    // Prepare attribute labels
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
        context.availabilities = CONFIG.WW.EQUIPMENT_AVAILABILITIES;
        context.armorTypes = CONFIG.WW.ARMOR_TYPES;

        if (context.system.subtype == 'weapon') {
          context.requirements = CONFIG.WW.WEAPON_REQUIREMENTS;
          context.grips = CONFIG.WW.WEAPON_GRIPS;
          context.traits = CONFIG.WW.WEAPON_TRAITS;
          context.hasTraits = Object.values(context.system.traits).filter(v => !!v).length ? true : false;
        }

      break;

      case 'Trait or Talent':
        context.subtypes = CONFIG.WW.TALENT_SUBTYPES;
        context.sources = CONFIG.WW.TALENT_SOURCES;

        // Relative to Level Uses
        context.usesLevelRelative = CONFIG.WW.USES_LEVEL_RELATIVE;
        context.belongsToNPC = (context.hasActor && this.document?.actor?.type === 'NPC') ? true : false;
        
        if (context.hasActor && this.document?.actor?.type === 'Character') {
          const level = this.document.actor.system.stats.level;
          const half = Math.floor(level / 2) > 0 ? Math.floor(level / 2) : 1;

          switch (context.system.uses.levelRelative) {
            case 'full': context.system.uses.max = level; break;
            case 'half': context.system.uses.max = half; break;
          }
        }
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
      obj.img = CONFIG.WW.INSTANT_ICONS[e.label];
      
      instEffs[id] = obj;
    })
    
    context.instantEffects = instEffs;

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.document.effects);
    
    for (const cat in context.effects) {
      const category = context.effects[cat];
      for (const e in category.effects) {
        const effect = category.effects[e];
        const system = effect.system;
        effect.locTrigger = CONFIG.WW.INSTANT_TRIGGERS[system.trigger];
        effect.locTarget = CONFIG.WW.EFFECT_TARGETS_TARGETED[system.target];
      }
    }

    // Prepare effect change labels to display
    context.effectChangeLabels = CONFIG.WW.EFFECT_CHANGE_LABELS;

    // Pass down whether the item needs targets or not
    context.needTargets = this.document.needTargets;
    const grantedById = this.document.flags.weirdwizard?.grantedBy;
    if (grantedById) context.grantedBy = await fromUuid(grantedById).name;
    
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      // Details tab
      case 'details':
        context.tab = context.tabs[partId];

        let file = '';
        switch (this.item.type) {
          case 'Equipment': file = 'equipment'; break;
          case 'Spell': file = 'spell'; break;
          case 'Trait or Talent': file = 'talent'; break;
          default: file = 'talent'; break;
        }

        context.detailsPartial = [`systems/weirdwizard/templates/items/details/${file}.hbs`];
      break;
      
      // Effects tab
      case 'automation':
        context.tab = context.tabs[partId];

        context.effects = prepareActiveEffectCategories(await this.item.effects);

        for (const c in context.effects) {
          context.effects[c].effects = context.effects[c].effects.toSorted((a, b) => a.sort - b.sort);
        }
        
      break;

    }

    return context;
  }

  /* -------------------------------------------- */

  /**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    const type = this.document.type;

    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'details';
    
    // Assign tab properties
    return parts.reduce((tabs, partId) => {
      
      const tab = {
        cssClass: "",
        group: tabGroup,
        // Matches tab property to
        id: '',
        // Icon svg
        icon: '',
        // Run through localization
        label: ''
      };

      switch (partId) {
        case 'sidetabs':
          return tabs;
        case 'details':
          tab.id = 'details';
          tab.label = 'WW.Actor.Details';
          tab.icon = 'systems/weirdwizard/assets/icons/diploma.svg';
          break;
        case 'automation':
          tab.id = 'automation';
          tab.label = 'WW.Effects.TabLabel';
          tab.icon = 'systems/weirdwizard/assets/icons/gear-hammer.svg';
        break;
        default: break;
      }

      // Activate tab
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = "active";
      if (tab.id) tabs[partId] = tab;

      return tabs;
    }, {});
  }

  /* -------------------------------------------- */

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add dynamic classes to app window
    const item = this.item;
    const window = this.element;
    
    window.classList.toggle('magical', item.system.magical);
    window.classList.toggle('weapon', item.system.subtype === 'weapon');

    if ( !game.user.isOwner ) return;

    // Create dragDrop listener
    new DragDrop({ // Remove in v13; core implementation
      dragSelector: ".draggable",
      dropSelector: null,
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this)
      }
    }).bind(this.element);

  }

  /*async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
  }*/

  /* -------------------------------------------- */
  /*  General Event Listeners and Handlers        */
  /* -------------------------------------------- */

  /**
   * Edit a Document image. - delete in V13; core functionality
   * @this {DocumentSheetV2}
   * @type {ApplicationClickAction}
   */
  static async #onEditImage(_event, target) {
    if ( target.nodeName !== "IMG" ) {
      throw new Error("The editImage action is available only for IMG elements.");
    }
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document._source, attr);
    const defaultArtwork = this.document.constructor.getDefaultArtwork?.(this.document._source) ?? {};
    const defaultImage = foundry.utils.getProperty(defaultArtwork, attr);
    const fp = new FilePicker({
      current,
      type: "image",
      redirectToRoot: defaultImage ? [defaultImage] : [],
      callback: path => {
        target.src = path;
        if ( this.options.form.submitOnChange ) {
          const submit = new Event("submit");
          this.element.dispatchEvent(submit);
        }
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    await fp.browse();
  }

  static #onShowItemArtwork(_event, target) {
    const item = this.item;
    // Construct the Application instance
    const ip = new ImagePopout(item.img, {
      title: item.name,
      uuid: item.uuid
    });

    // Display the image popout
    ip.render(true);
  }

  /**
      * Handle opening of a context menu from a chat button.
      * @param {HTMLElement} element     The element the menu opens on.
    */
  static #onTraitsMenuOpen(event, button) {
    
    // Create MultiChoice instance
    const rect = button.getBoundingClientRect();

    new MultiChoice({
      purpose: 'editWeaponTraits',
      document: this.document,
      position: {
        left: rect.right,
        top: rect.top
      },
      sections: [
        {
          title: 'WW.Weapon.Traits.Title',
          choices: CONFIG.WW.WEAPON_TRAITS,
          noCollapse: true
        },
        {
          type: 'attackRider',
          title: 'WW.Attack.Rider',
          attackRider: {
            value: this.document.system.attackRider?.value,
            name: this.document.system.attackRider?.name
          },
          noCollapse: true
        }

      ]
    }).render(true);

  }

  /* -------------------------------------------- */
  /*  Instant Effect handling actions             */
  /* -------------------------------------------- */

  static #onInstantEffectCreate(event, button) {
    createInstantEffect(this.document);
  }

  static #onInstantEffectEdit(event, button) {
    const id = button.dataset.effectId;
    const effect = this.document.system.instant[id];
    effect.id = id;

    editInstantEffect(effect, this.document);
  }

  static #onInstantEffectRemove(event, button) {
    const id = button.dataset.effectId;
    const effect = this.document.system.instant[id];
    effect.id = id;

    deleteInstantEffect(effect, this.document);
  }

  /* -------------------------------------------- */
  /*  Active Effect handling actions              */
  /* -------------------------------------------- */

  static #onActiveEffectCreate(event, button) {
    const dataset = Object.assign({}, button.dataset);

    createActiveEffect(dataset, this.document);
  }

  static #onActiveEffectEdit(event, button) {
    const effect = this.document.effects.get(button.dataset.effectId);

    editActiveEffect(effect, this.document);
  }

  static #onActiveEffectRemove(event, button) {
    const effect = this.document.effects.get(button.dataset.effectId);

    deleteActiveEffect(effect, this.document);
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
  /* -------------------------------------------- */

  /**
   * Process form submission for the sheet
   * @this {DocumentSheetV2}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async #onSubmitDocumentForm(event, form, formData) {
    if ( !this.isEditable ) return;
    
    //formData.object['system.stats.damage.value'] = formData.object.damage;
    
    const submitData = this._prepareSubmitData(event, form, formData);
    await this._processSubmitData(event, form, submitData);
  }

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

  /* -------------------------------------------- */

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
      return ui.notifications.warn(`${i18n('WW.CharOption.TypeWarning')}<br/>${i18n("WW.CharOption.Help", { itemType: this.document.type })}`);
    }

    if (!item.pack) return ui.notifications.warn(`${i18n('WW.CharOption.CompendiumWarning')}<br/>${i18n("WW.CharOption.Help", { itemType: this.document.type })}`);
    
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
    
    const isAllowed = await this.checkDroppedItem(itemData);
    if (isAllowed) return await super._onDropItemCreate(itemData);
    console.warn('Wrong item type dragged', this.actor, itemData);
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
