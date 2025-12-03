import MultiChoice from '../../apps/multi-choice.mjs';
import {
  createActiveEffect, deleteActiveEffect, editActiveEffect,
  createInstantEffect, deleteInstantEffect, editInstantEffect,
  prepareActiveEffectCategories
} from '../../helpers/effect-actions.mjs';
import WWSheetMixin from '../ww-sheet.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ItemSheetV2 = foundry.applications?.sheets?.ItemSheetV2 ?? (class {});

/**
 * Extend the basic ItemSheetV2 with modifications tailored for SotWW
 * @extends {ItemSheetV2}
*/

export default class WWItemSheet extends WWSheetMixin(ItemSheetV2) {

  constructor(options = {}) {
    super(options); // Required for the constructor to work 
  }
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'item'],
    tag: 'form',
    window: {
      icon: 'fa-regular fa-scroll',
      resizable: true,
      contentClasses: ['scrollable'],
      controls: [
        {
          action: "showItemArtwork",
          icon: "fa-solid fa-image",
          label: "WW.Item.ArtworkShow",
          ownership: "OWNER"
        }
      ]
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
  };

  /* -------------------------------------------- */

  /** @override */
  static PARTS = {
    sidetabs: { template: 'systems/weirdwizard/templates/generic/side-tabs.hbs' },
    
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
    
  };

  /* -------------------------------------------- */

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        {id: 'details', tooltip: 'WW.Actor.Details', icon: 'systems/weirdwizard/assets/icons/diploma.svg', iconType: 'img'},
        {id: 'automation', tooltip: 'WW.Effects.TabLabel', iconType: 'img', icon: 'systems/weirdwizard/assets/icons/gear-hammer.svg', iconType: 'img'}
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
    
    const itemData = this.item;
    const sys = this.item.system;
    const isOwner = this.item.isOwner;
    const TextEditor = foundry.applications.ux.TextEditor.implementation;

    // Ensure editMode has a value
    if (this.editMode === undefined) this.editMode = false;

    context.item = itemData; // Use a safe clone of the item data for further operations.
    
    context.system = itemData.system; // Use a safe clone of the item data for further operations.
    context.folder = await itemData.folder;
    context.flags = itemData.flags;
    context.dtypes = ['String', 'Number', 'Boolean'];
    
    
    // Prepare enriched document reference links
    context.grantedBy = await fromUuid(sys.grantedBy) ?
      await TextEditor.enrichHTML(`@UUID[${sys.grantedBy}]`, { secrets: this.item.isOwner }) : null;
    
    context.usedBy = [];
    
    for (const a of sys.usedBy) {
      if (await fromUuid(a)) await context.usedBy.push(await TextEditor.enrichHTML(`@UUID[${a}]`, { secrets: this.item.isOwner }));
      if (await fromUuid(a)) await context.usedBy.push(await TextEditor.enrichHTML(`@UUID[${a}]`, { secrets: this.item.isOwner }));
    }
    
    // Prepare enriched variables for editor
    context.system.descriptionEnriched = await TextEditor.enrichHTML(context.system.description, { secrets: isOwner, relativeTo: this.document });

    // Record if the item has an actor
    context.hasActor = this.document.actor ? true : false;
    
    // Prepare character options
    if (context.item.type == 'equipment' && context.item.system.subtype == 'weapon' && context.system.attackRider.value) {
      context.system.attackRiderEnriched = await TextEditor.enrichHTML(context.system.attackRider.value, { secrets: isOwner, relativeTo: this.document });
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
  
      case 'equipment':
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

      case 'talent':
        context.subtypes = CONFIG.WW.TALENT_SUBTYPES;
        context.sources = CONFIG.WW.TALENT_SOURCES;

        // Relative to Level Uses
        context.usesLevelRelative = CONFIG.WW.USES_LEVEL_RELATIVE;
        context.belongsToNPC = (context.hasActor && this.document?.actor?.type === 'npc') ? true : false;
        
        if (context.hasActor && this.document?.actor?.type === 'character') {
          const level = this.document.actor.system.stats.level;
          const half = Math.floor(level / 2) > 0 ? Math.floor(level / 2) : 1;
          let third = 2; 
          
          if ( level < 3 ) {
            third = 1;
          } else if ( level > 6 ) {
            third = 3;
          }

          switch (context.system.uses.levelRelative) {
            case 'full': context.system.uses.max = level; break;
            case 'half': context.system.uses.max = half; break;
            case 'third': context.system.uses.max = third; break;
          }
        }
      break;

      case 'spell':
        context.tiers = CONFIG.WW.TIERS;
      break;
      
    }

    // Pass down whether the item needs targets or not
    context.needTargets = this.document.needTargets;
    
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      // Details tab
      case 'details':
        context.tab = context.tabs[partId];

        let file = '';
        switch (this.item.type) {
          case 'equipment': file = 'equipment'; break;
          case 'spell': file = 'spell'; break;
          case 'talent': file = 'talent'; break;
          default: file = 'talent'; break;
        }

        context.detailsPartial = [`systems/weirdwizard/templates/items/details/${file}.hbs`];
      break;
      
      // Effects tab
      case 'automation':
        context.tab = context.tabs[partId];

        // Prepare instant effects
        let instEffs = context.system.instant;

        instEffs.forEach((e,id) => {
          const obj = {...e,
            img: CONFIG.WW.INSTANT_ICONS[e.label],
            labelLoc: CONFIG.WW.INSTANT_LABELS[e.label],
            triggerLoc: CONFIG.WW.INSTANT_TRIGGERS[e.trigger],
            triggerIcon: CONFIG.WW.EFFECT_TRIGGER_ICONS[e.trigger],
            targetLoc: CONFIG.WW.EFFECT_TARGETS[e.target],
            targetIcon: CONFIG.WW.EFFECT_TARGET_ICONS[e.target],
          };
          
          instEffs[id] = obj;
        })
        
        context.instantEffects = instEffs;

        // Prepare active effects
        const actEffs = await prepareActiveEffectCategories(this.document.effects); /* await is needed, ignore linter */
        
        for (const cat in actEffs) {
          const category = actEffs[cat];
          category.effects = category.effects.toSorted((a, b) => a.sort - b.sort);
          
          for (const e in category.effects) {
            const effect = category.effects[e];
            const system = effect.system;
            effect.triggerLoc = CONFIG.WW.INSTANT_TRIGGERS[system.trigger];
            effect.triggerIcon = CONFIG.WW.EFFECT_TRIGGER_ICONS[system.trigger];
            effect.targetLoc = CONFIG.WW.EFFECT_TARGETS_TARGETED[system.target];
            effect.targetIcon = CONFIG.WW.EFFECT_TARGET_ICONS[system.target];
          }
        }

        context.effects = actEffs;

        // Prepare effect change labels to display
        context.effectChangeLabels = CONFIG.WW.EFFECT_CHANGE_PRESET_LABELS;
        
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

    // Create dragDrop flow
    new foundry.applications.ux.DragDrop.implementation({
      dragSelector: ".draggable",
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this)
      },
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
          const submit = new Event("submit", {cancelable: true});
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
      window: {
        title: item.name
      },
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
          collapsed: true
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

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector.
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    return this.isEditable;
  }

  /* -------------------------------------------- */

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector.
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    return this.isEditable;
  }

  /* -------------------------------------------- */

  /**
   * An event that occurs when a drag workflow begins for a draggable item on the sheet.
   * @param {DragEvent} event       The initiating drag start event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDragStart(event) {
    const target = event.currentTarget;
    if ( "link" in event.target.dataset ) return;
    let dragData;

    // Active Effect
    if ( target.dataset.effectId ) {
      const effect = this.item.effects.get(target.dataset.effectId);
      dragData = effect.toDragData();
    }

    // Set data transfer
    if ( !dragData ) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------- */

  /**
   * An event that occurs when a drag workflow moves over a drop target.
   * @param {DragEvent} event
   * @protected
   */
  _onDragOver(event) {}

  /* -------------------------------------------- */

  /**
   * An event that occurs when data is dropped into a drop target.
   * @param {DragEvent} event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDrop(event) {
    const data = TextEditor.implementation.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if ( allowed === false ) return;

    // Dropped Documents
    const documentClass = foundry.utils.getDocumentClass(data.type);
    if ( documentClass ) {
      const document = await documentClass.fromDropData(data);
      await this._onDropDocument(event, document);
    }
  }

}
