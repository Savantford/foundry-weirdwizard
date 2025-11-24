import { capitalize, getCompendiumList, i18n } from '../helpers/utils.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * Extend FormApplication to make windows to display a compendium more neatly
 * @extends {ApplicationV2}
*/

export default class CompendiumIndex extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(options = {}) {
    super(options); // This is required for the constructor to work
    
    this.compendium = game.packs.get(options.compendium);
    this.type = options.type ? options.type : 'generic';

    // Enable drag n drop operations
    this.#dragDrop = this.#createDragDropHandlers();
  }

  static DEFAULT_OPTIONS = {
    id: 'compendium-index',
    classes: ['weirdwizard'],
    window: {
      title: 'Compendium Index',
      icon: 'fa-regular fa-rectangle-list',
      resizable: true,
      contentClasses: ['scrollable']
    },
    actions: {
      openSheet: CompendiumIndex.openSheet
    },
    position: {
      width: 800,
      height: 500
    },
    dragDrop: [{ dragSelector: '.item', dropSelector: null }]
  }

  /* -------------------------------------------- */

  static PARTS = {
    header: { template: 'systems/weirdwizard/templates/apps/ci/compendium-index.hbs' },

    generic: { template: 'systems/weirdwizard/templates/apps/ci/ci-generic.hbs' },
    weapons: { template: 'systems/weirdwizard/templates/apps/ci/ci-weapons.hbs' },
    armor: { template: 'systems/weirdwizard/templates/apps/ci/ci-armor.hbs' },
    paths: { template: 'systems/weirdwizard/templates/apps/ci/ci-paths.hbs' },
    professions: { template: 'systems/weirdwizard/templates/apps/ci/ci-professions.hbs' }
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // Completely overriding the parts
    options.parts = ['header', 'generic', 'weapons', 'armor', 'paths', 'professions' ];
    
    return options;
  }

  tabGroups = {'primary': 'generic'};

  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    
    const context = {};

    context.types = CONFIG.WW.COMPENDIUM_TYPES;

    context.compendiumList = getCompendiumList();

    context.tabs = [
      {
        id: 'generic',
        group: 'primary',
        icon: '',
        label: 'Generic',
        active: true,
        cssClass: '',
      },
      {
        id: 'paths',
        group: 'primary',
        icon: '',
        label: 'Paths',
        active: false,
        cssClass: '',
      },
      {
        id: 'professions',
        group: 'primary',
        icon: '',
        label: 'Professions',
        active: false,
        cssClass: '',
      },
      {
        id: 'armor',
        group: 'primary',
        icon: '',
        label: 'Armor',
        active: false,
        cssClass: '',
      },
      {
        id: 'weapons',
        group: 'primary',
        icon: '',
        label: 'Weapons',
        active: false,
        cssClass: '',
      }
      
    ];
    
    // Get dropdown values
    context.selectedCompendium = await this.compendium.collection;
    context.tableType = await this.inferType(this.type);

    // Prepare documents data
    context.documents = await this.compendium.getDocuments();

    for (const d in context.documents) {
      const doc = context.documents[d];

      // Get Availability
      if (doc.system.availability) {
        doc.availabilityLabel = i18n(CONFIG.WW.EQUIPMENT_AVAILABILITIES[doc.system.availability]);
      }

      // Get Price
      if (doc.system.price?.value) {
        const tip = i18n(CONFIG.WW.EQUIPMENT_COINS[doc.system.price.coin].tip);
        const color = CONFIG.WW.EQUIPMENT_COINS[doc.system.price.coin].color;

        doc.priceLabel = `${doc.system.price.value} <i class="fa-solid fa-coins ${color}" data-tooltip="${tip}"></i>`;
      }

      // Get Weapon Requirements
      doc.system.requirementLabel = doc.system.requirements ? i18n(CONFIG.WW.WEAPON_REQUIREMENTS[doc.system.requirements]) : '—';

      // Get Defense stats
      if (doc.type === 'equipment') {

        // Get Armor Type
        if (doc.system.subtype === 'armor') doc.typeLabel = i18n(CONFIG.WW.ARMOR_TYPES[doc.system.armorType]); else doc.typeLabel = i18n('WW.Armor.Shield');

        // Get Defense
        let armored = 0,
        natural = null,
        bonus = null;

        for (const e of doc.effects) {
          for (const c of e.changes) {
            
            if (c.key === 'defense.armored') armored = await c.value;
            if (c.key === 'defense.naturalIncrease') natural = await c.value;
            if (c.key === 'defense.bonus') bonus = await c.value;
          }

        }

        // Set Defense
        doc.defense = bonus ? `+${bonus}` : `${armored} ${await natural ? 'or +' + natural : ''}`;
        if (doc.defense == 0) doc.defense = '—';
      }

      // Prepare traits list for weapons
      if (doc.system.subtype == 'weapon') {

        // Prepare traits list
        let list = '';

        Object.entries(doc.system.traits).map((x) => {

          if (x[1]) {
            let string = i18n('WW.Weapon.Traits.' + capitalize(x[0]) + '.Label');

            if ((x[0] == 'range') || (x[0] == 'reach' && doc.system.range) || (x[0] == 'thrown')) { string += ' ' + doc.system.range; }

            list = list.concat(list ? ', ' + string : string);
          }

        })

        doc.system.traitsList = list ?? '—';

        // Prepare Grip label
        doc.system.gripLabel = CONFIG.WW.WEAPON_GRIPS_SHORT[doc.system.grip] ? i18n(CONFIG.WW.WEAPON_GRIPS_SHORT[doc.system.grip]) : doc.system.grip;
      }

      // Get Tier
      if (doc.type === 'Path') {
        doc.tierLabel = i18n(CONFIG.WW.TIERS[capitalize(doc.system.tier)]);
      }

      // Get Profession Category
      if (doc.type === 'Profession') {
        doc.professionCategory = i18n(CONFIG.WW.PROFESSION_CATEGORIES[doc.system.category]);
      }

    }
    
    return context;
  }

  /* -------------------------------------------- */

  /**
   * Prepare context that is specific to only a single rendered part.
   *
   * It is recommended to augment or mutate the shared context so that downstream methods like _onRender have
   * visibility into the data that was used for rendering. It is acceptable to return a different context object
   * rather than mutating the shared context at the expense of this transparency.
   *
   * @param {string} partId                         The part being rendered
   * @param {ApplicationRenderContext} context      Shared context provided by _prepareContext
   * @returns {Promise<ApplicationRenderContext>}   Context data for a specific part
   * @protected
   */
  /*async _preparePartContext(partId, context) {
    
    
    return context;
  }*/

  /* -------------------------------------------- */

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  _onRender(context, options) {

    // Get Compendium dropdown to get compendium
    const compendiumDropdown = this.element.querySelector('select[data-action=changeCompendium]');

    compendiumDropdown.addEventListener("change", event => {
      this.compendium = game.packs.get(compendiumDropdown.value);

      this.type = 'generic';
      
      // Set type according to the dropdown value
      if (compendiumDropdown.value.includes('weirdwizard.')) {
        const str = compendiumDropdown.value.replace('weirdwizard.', '');
        
        switch (str) {
          case 'armor': this.type = 'armor'; break;
          case 'weapons': this.type = 'weapons'; break;
        }
      }

      // Re-render sheet to update compendium data
      this.render(true);
      
    });
    
    // Get Type dropdown
    const typeDropdown = this.element.querySelector('select[data-action=changeType]');
    
    // Swap to another tab first if the tab is the same
    if (this.type === this.tabGroups.primary) this.changeTab('professions', 'primary', {navElement: typeDropdown});
    this.changeTab(this.inferType(this.type), 'primary', {navElement: typeDropdown});

    // Change tab when Type dropdown is changed
    typeDropdown.addEventListener("change", event => {
      this.type = 'generic';
      this.changeTab(this.inferType(event.currentTarget.value), 'primary', {event, navElement: typeDropdown});
    });

    // Create dragDrop listener
    this.#dragDrop.forEach((d) => d.bind(this.element));

  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static openSheet(event, target) {
    fromUuidSync(target.dataset.itemUuid)?.sheet.render(true);
  }

  /*static changeType(event, app, nav) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const value = event.currentTarget.value;
    app.type = value;
    
    app.changeTab(this.inferType(value), 'primary', {event, navElement: nav});
    
  }*/

  inferType(value, context) {
    
    // Set the type automatically for core Compendia
    switch (value) {
      case 'armor': this.type = 'armor'; break;
      case 'weapons': this.type = 'weapons'; break;
      default: this.type = 'generic'; break;
    }
    
    return this.type;
  }

  /* -------------------------------------------- */
  /*  Drag and Drop Operations                    */
  /* -------------------------------------------- */

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };

      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      
      return new DragDrop(d);
    });
  }

  #dragDrop;

  /* -------------------------------------------- */

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    return true; //this.isEditable;
  }

  /* -------------------------------------------- */

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    return true;//this.isEditable;
  }

  /* -------------------------------------------- */

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    if ( ui.context ) ui.context.close({animate: false});
    const li = event.currentTarget.closest(".item");
    
    const dragData = this._getEntryDragData(li.dataset.itemId);
    if ( !dragData ) return;

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------- */

  /**
   * Get the data transfer object for a Compendium Entry being dragged from this item
   * @param {string} entryId     The Compendium Entry's _id being dragged
   * @returns {Object}
   * @private
   */
  _getEntryDragData(entryId) {
    const entry = this.compendium.get(entryId);
    
    return entry?.toDragData();
  }

  /* -------------------------------------------- */

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) {
    // Do nothing
  }

  /* -------------------------------------------- */

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    
    // Handle different data types
    switch (data.type) {
        // write your cases
    }
  }

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

}
