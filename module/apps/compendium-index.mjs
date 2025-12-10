import { capitalize, getCompendiumList, getDocumentTypeList, i18n } from '../helpers/utils.mjs';

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
    
    if (options.filters) this.filters = options.filters;

    // Enable drag n drop operations
    this.#dragDrop = this.#createDragDropHandlers();
  }

  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'compendium-index'],
    window: {
      title: "WW.Index.Label",
      icon: 'fa-solid fa-hat-wizard',
      resizable: true
    },
    actions: {
      openSheet: CompendiumIndex.#openSheet
    },
    position: {
      width: 800,
      height: 500
    },
    dragDrop: [{ dragSelector: '.item', dropSelector: null }]
  }

  /**
   * The current view
   * @type {"edit"|"view"}
   */
  static #DEFAULT_VIEW = "generic";

  /* -------------------------------------------- */

  static PARTS = {
    sidebar: { template: 'systems/weirdwizard/templates/apps/index/sidebar.hbs' },
    view: {
      template: 'systems/weirdwizard/templates/apps/index/view.hbs',
      templates: [
        'systems/weirdwizard/templates/apps/index/views/generic.hbs',
        'systems/weirdwizard/templates/apps/index/views/weapons.hbs',
        'systems/weirdwizard/templates/apps/index/views/armor.hbs',
        'systems/weirdwizard/templates/apps/index/views/paths.hbs',
        'systems/weirdwizard/templates/apps/index/views/professions.hbs'
      ]
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);

    context.views = CONFIG.WW.COMPENDIUM_INDEX_VIEWS;
    context.view = this.view;
    
    // Prepare part data
    await this._prepareFilters(context);
    await this._prepareView(context);
    
    return context;
  }

  /* -------------------------------------------- */

  async _prepareFilters(context) {
    context.filters = [];
    const fields = foundry.data.fields;
    const fs = this.filters;

    context.fields = {
      set: new fields.SetField(new fields.StringField())
    }

    // Source
    context.filters.push({
      name: 'filters.sourceCompendia',
      title: i18n("WW.Index.Filters.SourceCompendia"),
      value: fs.sourceCompendia ?? [],
      options: Object.values(getCompendiumList())
    })

    // Document types
    context.filters.push({
      name: 'filters.documentTypes',
      title: i18n("WW.Index.Filters.DocumentTypes"),
      value: fs.documentTypes ?? [],
      options: Object.values(getDocumentTypeList())
    })
  }

  /* -------------------------------------------- */

  async _prepareView(context) {
    
    // Old - Compendium
    if (this.compendium) {
      // Get dropdown values

      //context.selectedCompendium = this.compendium ? await this.compendium.collection : null;
      context.view = this.view;

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
    }
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preRender(context, options) {
    await super._preRender(context, options);

    // Wipe the window content after the first render
    if (!options.isFirstRender) {
      this.element.querySelector(".window-content").innerHTML = "";
    }
  }

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
    /*const compendiumDropdown = this.element.querySelector('select[data-action=changeCompendium]');

    compendiumDropdown.addEventListener("change", event => {
      this.compendium = game.packs.get(compendiumDropdown.value);

      this.view = 'generic';
      
      // Set view according to the dropdown value
      if (compendiumDropdown.value.includes('weirdwizard.')) {
        const str = compendiumDropdown.value.replace('weirdwizard.', '');
        
        switch (str) {
          case 'armor': this.view = 'armor'; break;
          case 'weapons': this.view = 'weapons'; break;
        }
      }

      // Re-render sheet to update compendium data
      this.render(true);
      
    });*/
    
    // View selection dropdown functionality
    const viewDropdown = this.element.querySelector('select[data-action=changeView]');
    viewDropdown.addEventListener("change", event => this._onChangeView(event));

    // Collapsible filters - not working
    const filters = this.element.querySelector(".filter");
    window.getSelection().collapse(filters, 0);

    // Create dragDrop listener
    //this.#dragDrop.forEach((d) => d.bind(this.element));

  }

  /* -------------------------------------------- */

  /**
   * Alternate between the available views.
   * @param {PointerEvent} event - The originating change event
   * @this {CompendiumIndex}
   */
  async _onChangeView(event) {
    const el = event.currentTarget;
    this.view = el.value;
    console.log(this)
    await this.render();
  }

  /* -------------------------------------------- */

  inferView(value, context) {
    
    // Set the view automatically for core Compendia
    switch (value) {
      case 'armor': this.view = 'armor'; break;
      case 'weapons': this.view = 'weapons'; break;
      default: this.view = 'generic'; break;
    }
    
    return this.view;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static async #openSheet(event, target) {
    return fromUuid(target.dataset.itemUuid)?.sheet.render(true);
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
    
    // Handle different data views
    switch (data.view) {
        // write your cases
    }
  }

  /* -------------------------------------------- */
  /*  Getters and Setters                         */
  /* -------------------------------------------- */

  /**
   * The operational view of this sheet
   * @type {"edit"|"view"}
   */
  get view() {
    return this.#view;
  }

  /**
   * Change the operational view of the app. Changing this value will also change the view in which subsequent
   * Compendium Index instances first render.
   * @param {"edit"|"view"} value
   */
  set view(value) {
    this.#view = CompendiumIndex.#DEFAULT_VIEW = value;
  }

  #view = CompendiumIndex.#DEFAULT_VIEW;

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  /**
   * Adapted from D&D 5e system's code. Thank you!
   * Inject the compendium index button into the compendium sidebar.
   * @param {HTMLElement} html  HTML of the sidebar being rendered.
   */
  static injectSidebarButton(html) {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("open-compendium-index");
    button.innerHTML = `
        <i class="fa-solid fa-hat-wizard" inert></i>
        ${game.i18n.localize("WW.Index.Open")}
      `;
    button.addEventListener("click", event => (new CompendiumIndex()).render({ force: true }));''

    let headerActions = html.querySelector(".header-actions");
    
    headerActions.append(button);
  }

}
