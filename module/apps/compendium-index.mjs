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
  constructor(config = {}) {
    super(config); // Required for "this." to work
    
    // Apply config
    this.view = config.view ?? 'generic';
    this.filters = config.filters ?? {};
    if (config.preset) this._applyPreset(config.preset);

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
    sidebar: {
      template: 'systems/weirdwizard/templates/apps/index/sidebar.hbs',
      scrollable: ['.filters'],
      forms: {
        "form": { // <-- this is actually a CSS selector
          handler: this.#onSubmit, // In case I need a custom handler
          submitOnChange: true,
          closeOnSubmit: false
        }
      }
    },
    view: {
      template: 'systems/weirdwizard/templates/apps/index/view.hbs',
      scrollable: ['.item-list'],
      templates: [
        'systems/weirdwizard/templates/apps/index/views/generic.hbs',

        'systems/weirdwizard/templates/apps/index/views/equipment.hbs',
        'systems/weirdwizard/templates/apps/index/views/armor.hbs',
        'systems/weirdwizard/templates/apps/index/views/weapons.hbs',
        
        'systems/weirdwizard/templates/apps/index/views/ancestries.hbs',
        'systems/weirdwizard/templates/apps/index/views/paths.hbs',
        'systems/weirdwizard/templates/apps/index/views/professions.hbs',
        'systems/weirdwizard/templates/apps/index/views/traditions.hbs',

        'systems/weirdwizard/templates/apps/index/views/creatures.hbs',
        'systems/weirdwizard/templates/apps/index/views/talents.hbs',
        'systems/weirdwizard/templates/apps/index/views/spells.hbs'
      ]
    }
  }

  // =========================================================================
  //                                     STATE
  // =========================================================================
  activeTab = "Item";
  allFilters = [];
  packBlackList = [];
  _searchQuery = "";
  /** State for virtual scrolling */
  scrollState = {
    throttle: false,
    height: 50,
    // Estimated height of a single result row
    entries: []
  };
  // =========================================================================
  //                               STATIC API
  // =========================================================================
  
  /**
  * Returns an object containing all available, filterable search options.
  * This includes document types, sub-types, and available packs.
  *
  * @returns An object with structured search options.
  */
  static getSearchFilters() {
    const groupedPacks = Object.groupBy(game.packs, (pack) => pack.metadata.type);
    const searchOptions = {};
    for (const [type, packs] of Object.entries(groupedPacks)) {
      searchOptions[type] = {
        packs: packs.map((pack) => pack.collection),
        types: foundry.documents[type].TYPES
      };
    }
    return searchOptions;
  }
  
  // =========================================================================
  //                         CORE DATA & RENDERING LOGIC
  // =========================================================================
  /**
   * Asynchronously refreshes the compendium entries for the browser instance
   * by calling the static search API with the current state.
   */
  async _refreshEntries() {
    if (this.scrollState.throttle) return;
    this.scrollState.throttle = true;
    const selectedTypes = this.allFilters.filter((f2) => f2.selected).map((f2) => f2.id);
    const selectedPacks = game.packs.filter((p2) => !this.packBlackList.includes(p2.collection)).map((p2) => p2.collection);
    let entries = await _CompendiumBrowser.search(
      this.activeTab,
      {
        queryName: this._searchQuery,
        types: selectedTypes.length ? selectedTypes : void 0,
        packs: selectedPacks.length ? selectedPacks : void 0
      }
    );
    entries = entries.map((entry) => ({
      ...entry,
      sourcePack: game.packs.get(entry.sourcePack).title,
      type: game.i18n.localize(`TYPES.${this.activeTab}.${entry.type}`)
    })).sort((a2, b2) => a2.name.localeCompare(b2.name, game.i18n.lang));
    this.scrollState.entries = entries;
    this.scrollState.throttle = false;
    if (entries.length === 0) {
      const loading = this.element.querySelector(".compendium-list .loading");
      const noResults = this.element.querySelector(".compendium-list .no-results");
      if (loading) loading.hidden = true;
      if (noResults) noResults.hidden = false;
    }
  }
  /** Renders a slice of the results for virtual scrolling. */
  async _renderResultSlice(indexStart, indexEnd) {
    if (this.scrollState.throttle) return;
    this.scrollState.throttle = true;
    const container = this.element.querySelector(".compendium-list");
    if (!container) return;
    const toRender = [];
    const topPadDiv = document.createElement("div");
    topPadDiv.className = "top-pad";
    topPadDiv.style.height = `${indexStart * this.scrollState.height}px`;
    toRender.push(topPadDiv);
    if (indexStart % 2 === 0) {
      const topOddPadDiv = document.createElement("div");
      topOddPadDiv.className = "top-pad";
      topOddPadDiv.style.height = `0px`;
      toRender.push(topOddPadDiv);
    }
    indexStart = Math.max(0, indexStart);
    indexEnd = Math.min(this.scrollState.entries.length, indexEnd);
    for (let idx = indexStart; idx < indexEnd; idx++) {
      const entry = this.scrollState.entries[idx];
      const html = await foundry.applications.handlebars.renderTemplate(
        "systems/shadowrun5e/dist/templates/apps/compendium-browser/entries.hbs",
        { entry }
      );
      const template = document.createElement("template");
      template.innerHTML = html;
      toRender.push(template.content.firstElementChild);
    }
    const bottomPadDiv = document.createElement("div");
    bottomPadDiv.className = "bottom-pad";
    bottomPadDiv.style.height = `${(this.scrollState.entries.length - indexEnd) * this.scrollState.height}px`;
    toRender.push(bottomPadDiv);
    container.replaceChildren(...toRender);
    this.scrollState.throttle = false;
  }
  /** Handles scroll events to implement virtual scrolling for the results list. */
  async _scrollResults(event) {
    const target = event.target;
    if (this.scrollState.throttle || !target?.matches(".compendium-list")) return;
    const { scrollTop, clientHeight } = target;
    const entriesPerScreen = Math.ceil(clientHeight / this.scrollState.height);
    const startIndex = Math.max(0, Math.floor(scrollTop / this.scrollState.height) - 2 * entriesPerScreen);
    const endIndex = Math.min(this.scrollState.entries.length, startIndex + 5 * entriesPerScreen);
    await this._renderResultSlice(startIndex, endIndex);
  }

  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    const context = {
      ...await super._prepareContext(options),
      views: CONFIG.WW.COMPENDIUM_INDEX_VIEWS,
      view: this.view,
      weaponTraits: CONFIG.WW.WEAPON_TRAITS,
      searchQuery: this.searchQuery
    };
    
    // Prepare documents data
    if (!this.allDocuments) this.allDocuments = await this.#fullDocumentData();
    await this._prepareFilters(context);
    await this._prepareDisplayedDocuments(context);
    
    return context;
  }

  /* -------------------------------------------- */

  async _prepareFilters(context) {
    context.filters = [];
    const fields = foundry.data.fields;
    const fs = {};
    this.filters.forEach(x => fs[x.field] = x.value);

    context.fields = {
      set: new fields.SetField(new fields.StringField())
    }
    
    // Source Compendia
    context.filters.push({
      name: 'filters.sourceCompendia',
      title: i18n("WW.Index.Filters.SourceCompendia"),
      value: fs?.sourceCompendia ?? Object.values(getCompendiumList()).map(x => x.value),
      options: Object.values(getCompendiumList())
    })

    // Document Types
    context.filters.push({
      name: 'filters.type',
      title: i18n("WW.Index.Filters.DocumentTypes"),
      value: fs?.type ?? Object.values(getDocumentTypeList()).map(x => x.value),
      options: Object.values(getDocumentTypeList())
    })
  }

  /* -------------------------------------------- */

  async _prepareDisplayedDocuments(context) {
    // Prepare pagination
    /*let pages = [];

    // A service function that simulates an API call
    const fetchUsersApi = async (limit, skip) => {
      // In a real app, you would use fetch() here
      console.log(`Fetching limit=${limit}, skip=${skip}`);
      const perPage = 50;
      const users = Array(perPage).fill().map((_, i) => ({ name: `user${i}`, id: `id_${i}` }));

      const pageData = users.slice(skip, skip + limit);
      return {
        data: pageData,
        nextSkip: skip + pageData.length,
        hasMore: (skip + pageData.length) < perPage
      };
    };

    // The async generator function for pagination
    async function* userGenerator(limit = 10) {
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await fetchUsersApi(limit, skip);
        yield* result.data; // Yield each user individually
        skip = result.nextSkip;
        hasMore = result.hasMore;
      }
    }

    // How to consume the generator
    async function loadAllUsers() {
      console.log("Starting to load users...");
      const generator = userGenerator(5); // Load 5 users per "page"

      for await (const user of generator) {
        // This loop automatically calls generator.next() until done
        console.log(user.name);
        pages.push(user)

        // You can add logic here to stop early if needed,
        // or wait for a "load more" button click in a UI context
      }
      console.log("Finished loading all users.");
    }

    // Run the example
    await loadAllUsers();
    console.log(await pages)
    console.log(docList)*/
    console.log(this.filters)
    const searchResults = this.search({ filters: this.filters });
    context.documents = searchResults;
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preRender(context, options) {
    await super._preRender(context, options);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  /*async _onFirstRender(context, options) {
    this.filteredDocuments ?? searchResults;

    return super._onFirstRender(context, options);
  }*/

  /* -------------------------------------------- */
  
  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  /*async _onRender(context, options) {
    await super._onRender(context, options);

    // Collapsible filters - not working
    const filters = this.element.querySelector(".filter");
    window.getSelection().collapse(filters, 0);

    // Create dragDrop listener
    //this.#dragDrop.forEach((d) => d.bind(this.element));

  }*/

  /* -------------------------------------------- */

  async #fullDocumentData() {
    // Prepare documents list
    let docList = [];
    
    // Convert filters to object of arrays
    const filters = {};
    this.filters.forEach(x => filters[x.field] = x.value);

    //Object.entries(
    const validTypes = Object.values(getDocumentTypeList()).map(x => x.value);

    for (const pack of game.packs) {
      if (filters.sourceCompendia && !filters.sourceCompendia?.includes(pack.metadata.id)) continue;
      
      // Get Journal Pages instead of Entries
      if (pack.metadata.type === "JournalEntry") {
        const packDocs = Array.from(await pack.getIndex());
        
        for (const entry of packDocs) {
          const allowedDocs = [...await entry.pages].filter(p => validTypes.includes(p.type));
          allowedDocs.forEach(x => {
            x.uuid = foundry.utils.buildUuid({parent: entry, id: x._id, documentName: 'JournalEntryPage'});
            x.documentName = 'JournalEntryPage';
          });
          
          docList = [... docList, ... allowedDocs];
        }
      } else {
        const allowedDocs = [... Array.from(await pack.getIndex())].filter(d => validTypes.includes(d.type));
        allowedDocs.forEach(x => x.documentName = pack.documentName);

        docList = [... docList, ... allowedDocs];
      }
      
    }

    // Prepare formatted document data
    for (const [d, doc] of Object.entries(docList)) {
      // Assign Journal Entry Page specific fields to corresponding Actor/Item fields
      if (doc.src) doc.img = doc.src;
      doc.system.descriptionEnriched = await TextEditor.enrichHTML(doc.text ? doc.text.content : doc.system.description, { secrets: doc.isOwner });

      // Get type and subtype labels
      doc.typeLabel = i18n(CONFIG[doc.documentName].typeLabels[doc.type]);
      const subtypes = {...CONFIG.WW.EQUIPMENT_SUBTYPES, ...CONFIG.WW.TALENT_SUBTYPES};
      doc.subtypeLabel = doc.system.subtype ? i18n(subtypes[doc.system.subtype]) : null;

      // Get tooltip
      //doc.tooltip = doc.toCard();

      // Get Availability
      if (doc.system.availability) doc.availabilityLabel = i18n(CONFIG.WW.EQUIPMENT_AVAILABILITIES[doc.system.availability]);

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
        if (doc.system.subtype === 'armor') doc.armorTypeLabel = i18n(CONFIG.WW.ARMOR_TYPES[doc.system.armorType]); else doc.armorTypeLabel = i18n('WW.Armor.Shield');

        // Get Defense
        let armored = 0,
          natural = null,
          bonus = null;

        for (const e of doc.effects) {
          for (const c of e.changes) {

            if (c.key === 'defense.armored') armored = c.value;
            if (c.key === 'defense.naturalIncrease') natural = c.value;
            if (c.key === 'defense.bonus') bonus = c.value;
          }

        }

        // Set Defense
        doc.defense = bonus ? `+${bonus}` : `${armored} ${natural ? 'or +' + natural : ''}`;
        if (doc.defense == 0) doc.defense = '—';
      }

      // Prepare traits list for weapons
      if (doc.system.subtype == 'weapon') {
        // Prepare Grip label
        doc.system.gripLabel = CONFIG.WW.WEAPON_GRIPS_SHORT[doc.system.grip] ? i18n(CONFIG.WW.WEAPON_GRIPS_SHORT[doc.system.grip]) : doc.system.grip;
      }

      // Get Tier
      if (doc.type === 'path') {
        doc.tierLabel = i18n(CONFIG.WW.TIERS[doc.system.tier]);
      }

      // Get Profession Category
      if (doc.type === 'profession') {
        doc.professionCategory = i18n(CONFIG.WW.PROFESSION_CATEGORIES[doc.system.category]);
      }

    }

    return docList;
  }

  /* -------------------------------------------- */

  _applyPreset(preset) {
    // Set the parameters for the filter
    switch (preset) {
      case 'all':
        this.view = 'generic';
      break;

      /* Equipment Presets */
      case 'equipment': 
        this.view = 'equipment';
        this.filters = {
          'type': ['equipment']
        };
      break;

      case 'armor': 
        this.view = 'armor';
        this.filters = {
          'type': ['equipment'],
          'system.subtype': ['armor']
        }
      break;

      case 'weapons':
        this.view = 'weapons';
        this.filters = {
          'type': ['equipment'],
          'system.subtype': ['weapon']
        }
      break;

      case 'hirelings':
        this.view = 'creatures';
        this.filters = {
          sourceCompendia: ['weirdwizard.hirelings'],
          'type': ['npc']
        }
      break;

      /* Character Option Presets */
      case 'ancestries':
        this.view = 'ancestries';
        this.filters = {
          'type': ['ancestry']
        }
      break;

      case 'professions':
        this.view = 'professions';
        this.filters = {
          'type': ['profession']
        }
      break;

      case 'novice':
        this.view = 'paths';
        this.filters = {
          'type': ['path'],
          tiers: ['novice']
        }
      break;

      case 'expert':
        this.view = 'paths';
        this.filters = {
          'type': ['path'],
          tiers: ['expert']
        }
      break;

      case 'master':
        this.view = 'paths';
        this.filters = {
          'type': ['path'],
          tiers: ['master']
        }
      break;

      case 'traditions':
        this.view = 'traditions';
        this.filters = {
          'type': ['tradition']
        }
      break;

      /* Other Presets */
      case 'creatures':
        this.view = 'creatures';
        this.filters = {
          'type': ['npc']
        }
      break;

      case 'talents':
        this.view = 'talents';
        this.filters = {
          'type': ['talent']
        }
      break;
      
      case 'spells':
        this.view = 'spells';
        this.filters = {
          'type': ['spell']
        }
      break;
      
    }
    
    return this.view;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _attachPartListeners(partId, element, options) {
    super._attachPartListeners(partId, element, options);
    if ( partId === "sidebar" ) {
      const searchInput = this.element.querySelector("input[type=search]");
      //searchInput.addEventListener("change", (event) => this.#onSearch(event));
    }
  }
  
  /* -------------------------------------------- */

  /**
   * Find all Documents which match a given search term using a full-text search against their indexed HTML fields
   * and their name. If filters are provided, results are filtered to only those that match the provided values.
   * @param {object} search                      An object configuring the search
   * @param {string} [search.query]              A case-insensitive search string
   * @param {FieldFilter[]} [search.filters]     An array of filters to apply
   * @param {string[]} [search.exclude]          An array of document IDs to exclude from search results
   * @returns {TDocument[]|object[]}
   */
  search({query= "", filters=[], exclude=[]}) {
    
    query = foundry.applications.ux.SearchFilter.cleanQuery(query);
    const regex = new RegExp(RegExp.escape(query), "i");
    console.log(query)
    console.log(filters)
    // Iterate over all index members or documents
    const results = [];
    
    for ( const doc of this.allDocuments ) {
      if ( exclude.includes(doc._id) ) continue; // Explicitly exclude this document
      let matched = !query;

      // Do a full-text search against any searchable fields based on metadata
      if ( query ) {
        const searchFields = foundry.documents.abstract.DocumentCollection.getSearchableFields(doc.documentName, doc.type);
        const match = CompendiumIndex.#searchTextFields(doc, searchFields, regex);
        if ( !match ) continue; // Query did not match, no need to continue
        matched = true;
      }

      // Apply filters
      for ( const filter of filters ) {
        const match = foundry.applications.ux.SearchFilter.evaluateFilter(doc, filter);
        
        if ( !match ) {
          matched = false;
          break; // Filter did not match, no need to continue
        }
      }
      if ( matched ) results.push(doc);
    }
    
    return results;
  }

  /* -------------------------------------------- */

  /**
   * Recursively search text fields.
   * @param {object} data
   * @param {Record<string, SearchableField>} searchFields
   * @param {RegExp} rgx
   * @param {DOMParser} [domParser]
   */
  static #searchTextFields(data, searchFields, rgx, domParser) {
    for ( const [k, field] of Object.entries(searchFields) ) {
      let v = data[k];
      if ( !v ) continue;
      if ( typeof v === "string" ) {
        if ( field instanceof foundry.data.fields.HTMLField ) {
          domParser ??= new DOMParser();
          // TODO: Ideally we would search the text content of enriched HTML
          v = domParser.parseFromString(v, "text/html").body.textContent;
        }
        if ( foundry.applications.ux.SearchFilter.testQuery(rgx, v) ) return true;
      }
      else if ( Array.isArray(v) ) {
        if ( v.some(x => foundry.applications.ux.SearchFilter.testQuery(rgx, x)) ) return true;
      }
      else if ( typeof v === "object" ) {
        const m = CompendiumIndex.#searchTextFields(v, field, rgx, domParser);
        if ( m ) return true;
      }
    }
    return false;
  }

  /* -------------------------------------------- */

  /** Handles the click event for the 'clear search' button, resetting the query. */
  _onClearSearch() {
    this.searchQuery = "";
    void this.render({ parts: ["filters", this.activeTab === "Settings" ? "settings" : "results"] });
  }

  /* -------------------------------------------- */

  /** Handles the `change` event for a type filter checkbox. */
  _onFilterChange(type, selected) {
    const typeEntry = this.allFilters.find((t2) => t2.id === type);
    if (typeEntry) typeEntry.selected = selected;
    void this.render({ parts: [this.activeTab === "Settings" ? "settings" : "results"] });
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static async #openSheet(event, target) {
    const doc = await fromUuid(target.dataset.itemUuid);
    
    return doc.documentName === 'JournalEntryPage' ? doc.viewPage() : doc.sheet.render(true);
  }

  /* -------------------------------------------- */
  /*  Form handling                               */
  /* -------------------------------------------- */

  /**
   * Handle the sidebar's form submission
   * @this {DocumentSheetV2}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async #onSubmit(event, form, formData) {
    const obj = foundry.utils.expandObject(formData.object);
    
    // Save view and filters
    this.view = obj.view;
    this.filters = obj.filters;
    this.searchQuery = obj.searchQuery;
    
    return this.render();
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

  #view = CompendiumIndex.#DEFAULT_VIEW;

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

  #filters = [];

  get filters() {
    return this.#filters;
  }

  set filters(rawFilters) {
    console.log(rawFilters)
    const filters = [];

    // Push document Type
    filters.push({
      field: 'type',
      operator: SearchFilter.OPERATORS.CONTAINS,
      value: rawFilters.type ?? Object.values(getDocumentTypeList()).map(x => x.value)
    })
    console.log(filters)
    
    this.#filters = filters;
  }

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  /* -------------------------------------------- */
  /*  Utility Methods                             */
  /* -------------------------------------------- */

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

  /* -------------------------------------------- */

  static defineCompendiumIndexFields() {
    // Actors
    CONFIG.Actor.compendiumIndexFields = [
      'system.description'
    ];

    // Items
    CONFIG.Item.compendiumIndexFields = [
      'system.description',
      'system.subtype',
      'effects.changes',
      // Equipment specific
      'system.armorType',
      'system.availability',
      'system.price',
      'system.grip',
      'system.damage',
      'system.traits'
    ];

    // Journal Entries
    CONFIG.JournalEntry.compendiumIndexFields = [
      'pages.name',
      'pages.type',
      'pages.src',
      'pages.text',
      'pages.system.tier',
      'pages.system.category'
    ];
  }
}
