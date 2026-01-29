import { i18n, plusify } from '../helpers/utils.mjs';
import IndexFilter from '../ux/index-filter.mjs';

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
    this.searchFilters = config.filters ?? {};
    if (config.preset) this._applyPreset(config.preset);

    // Initialize sort options
    this.sortOptions = { field: 'name', reverse: false };
  }

  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'compendium-index'],
    window: {
      title: "WW.Index.Label",
      icon: 'fa-solid fa-hat-wizard',
      resizable: true,
      controls: [
        {
          action: "resyncDocuments",
          icon: "fa-solid fa-rotate",
          label: "WW.Index.ResyncDocuments",
          ownership: "VIEWER"
        }, {
          action: "createRollTable",
          icon: "fa-solid fa-dice",
          label: "WW.Index.RollTable.Text",
          ownership: "VIEWER"
        }
      ]
    },
    actions: {
      openSheet: CompendiumIndex.#openSheet,
      sort: CompendiumIndex.#sortDocuments,

      // Window header menu
      openHelp: CompendiumIndex.#onOpenHelp,
      resyncDocumetns: CompendiumIndex.#onResyncDocuments,
      createRollTable: CompendiumIndex.#createRollTable
    },
    position: {
      width: 1130,
      height: 550
    }
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
          handler: this.#onSubmit,
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
        'systems/weirdwizard/templates/apps/index/views/spells.hbs',
        'systems/weirdwizard/templates/apps/index/parts/col-header.hbs'
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
      searchQuery: this.searchQuery,
      si: this.sortingIcons
    };
    
    // Prepare documents data
    if (!this.sourceCompendia) this.sourceCompendia = CompendiumIndex.getCompendiumArray().map(x => x.value);
    if (!this.fullDocumentList) await this._updateFullDocumentData();

    // Prepare layout elements
    await this._prepareFilterCheckboxes(context);
    await this._prepareColumnHeaders(context);
    await this._prepareDisplayedDocuments(context);
    
    return context;
  }

  /* -------------------------------------------- */

  async _prepareFilterCheckboxes(context) {
    context.filters = [];
    const fields = foundry.data.fields;
    const appliedFilters = {};
    this.searchFilters.forEach(x => appliedFilters[x.field] = x.value);

    context.fields = {
      set: new fields.SetField(new fields.StringField())
    };
    
    // Source Compendia filter
    context.filters.push({
      name: 'sourceCompendia',
      title: i18n("WW.Index.Filters.SourceCompendia"),
      value: this.sourceCompendia ?? CompendiumIndex.getCompendiumArray().map(x => x.value),
      options: CompendiumIndex.getCompendiumArray(),
      hidden: false
    })

    // Create view filters reference
    const viewFilters = {
      'generic': [],

      /* Equipment Views */
      'equipment': ['system.subtype', 'system.availability'],
      'armor': ['system.armorType', 'system.availability'],
      'weapons': ['system.availability', 'system.grip', 'system.traits'],

      /* Character Option Views */
      'ancestries': [],
      'paths': ['system.tier'],
      'professions': [],
      'traditions': [],

      /* Other */
      'creatures': [],
      'talents': [],
      'spells': ['system.tier']
    };

    // Render Other filters
    for (const [filterKey, filterData] of Object.entries(this.filtersData)) {
      const appliedFilter = foundry.utils.getProperty(appliedFilters, filterKey);
      
      // Add filter only if view requires it
      context.filters.push({
        name: filterKey,
        title: i18n(CONFIG.WW.COMPENDIUM_INDEX_FILTER_LABELS[filterKey]),
        value: appliedFilter ?? filterData?.map(x => x.value),
        options: filterData,
        hidden: filterKey === 'type' ? false : !viewFilters[this.view].includes(filterKey)
      })
    }
    
    this.multiCheckboxesData = await context.filters;
  }

  /* -------------------------------------------- */

  async _prepareDisplayedDocuments(context) {
    const filteredDocuments = this.search({ query: this.searchQuery, filters: this.searchFilters });

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
    this.filteredDocuments = filteredDocuments;
    context.documents = filteredDocuments;
  }

  async _prepareColumnHeaders(context) {
    const colHeaders = {};

    for (const [key, data] of Object.entries(CompendiumIndex.colHeaders)) {
      if (data.views.includes(this.view) || data.views.includes('all')) {
        colHeaders[key] = {
          label: CompendiumIndex.colHeaders[key].label,
          field: key,
          css: CompendiumIndex.colHeaders[key].css,
          sortIcon: this.sortingIcons[key]
        }
      }
    }

    context.colHeaders = colHeaders;
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
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
        dataset: { action: "openHelp", tooltip: "WW.Index.Help" }
      })
    ];
    
    this.window.controls?.after(...buttons);

    return frame;
  }

  /* -------------------------------------------- */
  
  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Initialize Drag and Drop handlers
    const dragDropPairs = [
      {
        dragSelector: '.item .item-name',
        dropSelector: null
      }
    ];

    for (const dragDropPair of dragDropPairs) {
      new foundry.applications.ux.DragDrop.implementation({
        dragSelector: dragDropPair.dragSelector,
        dropSelector: dragDropPair.dropSelector,
        permissions: {
          dragstart: () => true,
          drop: () => true,
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
  /*  Core Functionality                          */
  /* -------------------------------------------- */

  async _updateFullDocumentData(sourceCompendia = this.sourceCompendia) {
    let docList = [];
    
    const validTypes = this.filtersData['type'].map(x => x.value);

    for (const pack of game.packs) {
      if (sourceCompendia && !sourceCompendia?.includes(pack.metadata.id)) continue;
      
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
        allowedDocs.forEach(x => {
          x.documentName = pack.documentName;
        });

        docList = [... docList, ... allowedDocs];
      }
      
    }

    // Prepare formatted document data
    for (const [d, doc] of Object.entries(docList)) {
      // Assign Journal Entry Page specific fields to corresponding Actor/Item fields
      if (doc.src) doc.img = doc.src;
      doc.system.descriptionEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        doc.text ? doc.text.content : doc.system.description, { secrets: doc.isOwner }
      );

      // Get (sub)type labels
      doc.typeLabel = i18n(CONFIG[doc.documentName].typeLabels[doc.type]);
      const subtypes = {...CONFIG.WW.EQUIPMENT_SUBTYPES, ...CONFIG.WW.TALENT_SUBTYPES};

      if (doc.type === 'equipment') {
        doc.equipmentSubtype = i18n(subtypes[doc.system.subtype]) ?? doc.typeLabel;
      }

      if (doc.type === 'talent') {
        doc.talentType = doc.system.source === 'none'
        ? `${i18n("TYPES.Actor.npc")}: ${i18n(CONFIG.WW.TALENT_SUBTYPES[doc.system.subtype])}`
        : i18n(CONFIG.WW.TALENT_SOURCE_LABELS[doc.system.source]);
      }

      if (doc.talentType) doc.genericTypeLabel = doc.talentType;
      else if (doc.equipmentSubtype) doc.genericTypeLabel = doc.equipmentSubtype;
      else doc.genericTypeLabel = doc.typeLabel;

      // Get tooltip
      //doc.tooltip = doc.toCard();

      // Prepare Equipment specifics
      if (doc.type === 'equipment') {
        // Get Availability
        doc.equipmentAvailability = i18n(CONFIG.WW.EQUIPMENT_AVAILABILITIES[doc.system.availability]);

        // Get Price
        if (doc.system.price?.value) {
          const tip = i18n(CONFIG.WW.EQUIPMENT_COINS[doc.system.price.coin].tip);
          const color = CONFIG.WW.EQUIPMENT_COINS[doc.system.price.coin].color;

          doc.equipmentPrice = `${doc.system.price.value} <i class="fa-solid fa-coins ${color}" data-tooltip="${tip}"></i>`;
        }

        // Equipment Uses
        doc.equipmentUses = doc.system.uses.max === 0 ? 'inf' : doc.system.uses.max;

        // Get Requirements
        doc.weaponRequirement = doc.system.requirements ? i18n(CONFIG.WW.EQUIPMENT_REQUIREMENTS[doc.system.requirements]) : '—';

        // Get Defense Stats
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

        // Set Defense and Armor Type labels
        doc.armorDefense = bonus ? `+${bonus}` : `${armored} ${natural ? 'or +' + natural : ''}`;

        if (doc.system.subtype === 'armor') doc.armorType = i18n(CONFIG.WW.ARMOR_TYPES[doc.system.armorType]);
        else if (doc.armorDefense != 0) doc.armorType = i18n('WW.Armor.Shield');
        if (doc.armorDefense == 0) doc.armorDefense = '—';

        // Prepare Weapon specifics
        if (doc.system.subtype == 'weapon') {
          doc.weaponRange = doc.system.traits.range ? i18n("WW.Weapon.Ranged") : i18n("WW.Weapon.Melee");
          doc.weaponGrip = CONFIG.WW.WEAPON_GRIPS_SHORT[doc.system.grip] ? i18n(CONFIG.WW.WEAPON_GRIPS_SHORT[doc.system.grip]) : doc.system.grip;
          doc.weaponDamage = doc.system.damage;

          // Prepare Weapon Traits
          let traits = '';

          for (const [key,trait] of Object.entries(CONFIG.WW.WEAPON_TRAITS)) {
            if (doc.system.traits[key]) {
              traits += `<span class="info" data-tooltip="${trait.tip}">
                ${i18n(trait.label)} 
                ${(key === "range" || key === "thrown") ? doc.system.range : ''}
              </span>`;
            }
          }

          doc.weaponTraits = traits;
        }

      }
      
      // Prepare Trait & Talent specifics
      if (doc.type === 'talent') {
        doc.talentMagical = doc.system.magical ?? false;
        doc.talentUses = doc.system.uses.max === 0 ? 'inf' : doc.system.uses.max;
        
        // Used By
        let talentUsedBy = '';
        if (doc.system.usedBy) {
          for (const uuid of doc.system.usedBy) {
            talentUsedBy += `<li class="info">@UUID[${uuid}]</li>`;
          }
        }
        doc.talentUsedBy = talentUsedBy ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(`<ol>${talentUsedBy}</ol>`, { secrets: doc.isOwner }) : '—'; 
      }

      // Prepare Spell specifics
      if (doc.type === 'spell') {
        doc.spellTier = i18n(CONFIG.WW.TIERS[doc.system.tier]);
        doc.spellTradition = doc.system.tradition ?? '—';
        const castingsLabel = doc.system.casting && (doc.system.casting.replace(/\s/g,'') !== '<p></p>') ? doc.system.casting : `<p>${doc.system.uses.max}</p>`;
        doc.spellCastings = castingsLabel ?? '—';
        doc.spellTarget = doc.system.target ?? '—';
        doc.spellDuration = doc.system.duration ?? '—';
      }

      // Prepare Ancestry specifics
      if (doc.type === 'ancestry') {
        const benefit = doc.system.benefits.benefit1;
        
        // Health
        const {sizeNormal, speedNormal, ...stats} = benefit.stats;
        let ancestryStats = '';
        for (const [k, v] of Object.entries(stats)) {
          let label = k === 'healthIncrease' ? "WW.Health.Short" : "WW.Defense.NaturalShort";
          if (v) ancestryStats += `<li><b>${i18n(label)}:</b> ${plusify(v)}</li>`;
        }
        doc.ancestryStats = ancestryStats ? `<ol>${ancestryStats}</ol>` : '—';

        // Size
        doc.ancestrySize = CONFIG.WW.SIZE_FRACTIONS[sizeNormal] ?? sizeNormal;
        
        // Speed
        let movementTraits = '';
        if (benefit.movementTraits) {
          for (const [_, v] of Object.entries(benefit.movementTraits)) {     
            movementTraits += `<li class="info" data-tooltip="${v.desc}">${v.name}</li>`;
          }
        }
        doc.ancestrySpeed = movementTraits ? `${speedNormal} (<ol>${movementTraits}</ol>)` : speedNormal;

        // Descriptors
        let descriptors = '';
        for (const [_, v] of Object.entries(benefit.descriptors)) {     
          descriptors += `<li class="info" data-tooltip="${v.desc}">${v.name}</li>`;
        }
        doc.ancestryDescriptors = descriptors ? `<ol>${descriptors}</ol>` : '—';

        // Senses
        let senses = '';
        for (const [_, v] of Object.entries(benefit.senses)) {     
          senses += `<li class="info" data-tooltip="${v.desc}">${v.name}</li>`;
        }
        doc.ancestrySenses = senses ? `<ol>${senses}</ol>` : '—';

        // Languages
        let languages = '';
        for (const [_, v] of Object.entries(benefit.languages)) {     
          languages += `<li class="info" data-tooltip="${v.desc}">${v.name}</li>`;
        }
        doc.ancestryLanguages = languages ? `<ol>${languages}</ol>` : '—';

        // Immunities
        let immunities = '';
        if (benefit.immunities) {
          for (const [_, v] of Object.entries(benefit.immunities)) {     
            immunities += `<li class="info" data-tooltip="${v.desc}">${v.name}</li>`;
          }
        }
        doc.ancestryImmunities = immunities ? `<ol>${immunities}</ol>` : '—';

        // Traits
        let traits = '';
        for (const uuid of benefit.items) {
          traits += `<li class="info">@UUID[${uuid}]</li>`;
        }
        doc.ancestryTraits = traits ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(`<ol>${traits}</ol>`, { secrets: doc.isOwner }) : '—';
      }

      // Prepare Path specifics
      if (doc.type === 'path') {
        doc.pathTier = i18n(CONFIG.WW.TIERS[doc.system.tier]);

        const bs = {
          natural: '',
          armored: '',
          health: '',
          speed: '',
          bonusDamage: '',
          traditions: '',
          spells: '',
          talents: ''
        };

        for await (const [_, v] of Object.entries(doc.system.benefits)) {
          const lv = `<b>${i18n("WW.CharOption.BenefitsSummaryLevel", {level: v.levelReq})}:</b>`;
          
          // Natural Defense
          if (v.stats.naturalIncrease || v.stats.naturalSet) {
            const value = v.stats.naturalSet > 0 ? v.stats.naturalSet : `+${v.stats.naturalIncrease}`;
            
            bs.natural += `${bs.natural ? '<br>' : ''}${lv} ${value}`;
          }

          // Armored Defense
          if (v.stats.armoredIncrease) bs.armored += `${bs.armored ? '<br>' : ''}${lv} +${v.stats.armoredIncrease}`;

          // Health
          if (v.stats.healthIncrease || v.stats.healthStarting) {
            const value = v.stats.healthStarting > 0 ? v.stats.healthStarting : `+${v.stats.healthIncrease}`;

            bs.health += `${bs.health ? '<br>' : ''}${lv} ${value}`;
          }

          // Bonus Damage
          if (v.stats.bonusDamage) bs.bonusDamage += `${bs.bonusDamage ? '<br>' : ''}${lv} +${v.stats.bonusDamage}d6`;
          
          // Speed
          if (v.stats.speedIncrease) bs.speed += `${bs.speed ? '<br>' : ''}${lv} +${v.stats.speedIncrease}`;

          // Traditions
          if (Object.keys(v.traditions).length) {
            bs.traditions += `${bs.traditions ? '<br>' : ''}<ol>${lv} `;

            for (const [_, trad] of Object.entries(v.traditions)) {
              bs.traditions += `<li class="info" data-tooltip="${trad.desc}">${trad.name}</li>`;
            }

            bs.traditions += `</ol>`;
          }

          // Spells
          if (v.spells && v.spells !== '0') bs.spells += `${bs.spells ? '<br>' : ''}${lv} ${i18n(CONFIG.WW.SPELLS_LEARNED[v.spells])}`;
          
          // Talents
          if (v.items.length) {
            bs.talents += `${bs.talents ? '<br>' : ''}<ol>${lv} `;

            for (const uuid of v.items) {
              bs.talents += `<li>${await foundry.applications.ux.TextEditor.implementation.enrichHTML(`@UUID[${uuid}]`, { secrets: doc.isOwner })}</li>`;
            }

            bs.talents += `</ol>`;
          }
          
        }

        doc.pathNatural = bs.natural;
        doc.pathArmored = bs.armored;
        doc.pathHealth = bs.health;
        doc.pathBonusDamage = bs.bonusDamage;
        doc.pathSpeed = bs.speed;
        doc.pathTraditions = bs.traditions;
        doc.pathSpells = bs.spells;
        doc.pathTalents = bs.talents;
        //doc.ancestryImmunities = traditions ? `<ol>${traditions}</ol>` : '—';
      }

      // Prepare Profession specifics
      if (doc.type === 'profession') {
        const benefit = doc.system.benefits.benefit1;

        // Category
        doc.professionCategory = i18n(CONFIG.WW.PROFESSION_CATEGORIES[doc.system.category]);

        // Languages
        let languages = '';
        for (const [_, v] of Object.entries(benefit.languages)) {     
          languages += `<li class="info" data-tooltip="${v.desc}">${v.name}</li>`;
        }
        doc.professionLanguages = languages ? `<ol>${languages}</ol>` : '—';
        
        // Traits
        let equipment = '';
        for (const uuid of benefit.items) {
          equipment += `<li class="info">@UUID[${uuid}]</li>`;
        }
        doc.professionEquipment = equipment ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(`<ol>${equipment}</ol>`, { secrets: doc.isOwner }) : '—';
      }

      // Prepare Tradition specifics
      if (doc.type === 'tradition') {
        // Talents
        let talents = '';
        for (const uuid of doc.system.talents) {
          talents += `<li class="info">@UUID[${uuid}]</li>`;
        }
        doc.traditionTalents = talents ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(`<ol>${talents}</ol>`, { secrets: doc.isOwner }) : '—';

        // Novice Spells
        let novice = '';
        for (const uuid of doc.system.spells.novice) {
          novice += `<li class="info">@UUID[${uuid}]</li>`;
        }
        doc.traditionNoviceSpells = novice ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(`<ol>${novice}</ol>`, { secrets: doc.isOwner }) : '—';

        // Expert Spells
        let expert = '';
        for (const uuid of doc.system.spells.expert) {
          expert += `<li class="info">@UUID[${uuid}]</li>`;
        }
        doc.traditionExpertSpells = expert ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(`<ol>${expert}</ol>`, { secrets: doc.isOwner }) : '—';

        // Master Spells
        let master = '';
        for (const uuid of doc.system.spells.master) {
          master += `<li class="info">@UUID[${uuid}]</li>`;
        }
        doc.traditionMasterSpells = master ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(`<ol>${master}</ol>`, { secrets: doc.isOwner }) : '—';
      }

      // Prepare NPC specifics
      if (doc.type === 'npc') {
        const attributes = doc.system.attributes;
        const stats = doc.system.stats;
        const npc = await fromUuid(doc.uuid);
        
        // Group (Folder)
        doc.creatureGroup = doc.folder ? npc.folder.name : '—';

        // Difficulty 
        doc.creatureDifficulty = stats.difficulty ?? '—';

        // Descriptors
        let descriptors = '';
        for (const [_, v] of Object.entries(doc.system.listEntries.descriptors)) {     
          descriptors += `<li class="info" data-tooltip="${v.desc}">${v.name}</li>`;
        }
        doc.creatureDescriptors = descriptors ? `<ol>${descriptors}</ol>` : '—';
        
        // Attributes
        doc.creatureStrength = attributes.str.value ?? '—';
        doc.creatureAgility = attributes.agi.value ?? '—';
        doc.creatureIntellect = attributes.int.value ?? '—';
        doc.creatureWill = attributes.wil.value ?? '—';

        // Other Stats
        doc.creatureDefense = stats.defense.natural ?? '—';
        doc.creatureHealth = stats.health.normal ?? '—';
        doc.creatureSize = stats.size ?? '—';
        doc.creatureSpeed = stats.speed.normal ?? '—';
      }
    }

    // Update full document list
    this.fullDocumentList = docList;
  }

  /* -------------------------------------------- */

  /**
   * Find all Documents which match a given search term using a full-text search against their indexed HTML fields
   * and their name. If filters are provided, results are filtered to only those that match the provided values.
   * Adapted from DocumentCollection#search()
   * @param {object} search                      An object configuring the search
   * @param {string} [search.query]              A case-insensitive search string
   * @param {FieldFilter[]} [search.filters]     An array of filters to apply
   * @param {string[]} [search.exclude]          An array of document IDs to exclude from search results
   * @returns {TDocument[]|object[]}
   */
  search({query="", filters=[], exclude=[]}) {
    query = IndexFilter.cleanQuery(query);
    const regex = new RegExp(RegExp.escape(query), "i");
    const DocumentCollection = foundry.documents.abstract.DocumentCollection;
    
    // Iterate over all index members or documents
    const results = [];
    
    for ( const doc of this.fullDocumentList ) {
      if ( exclude.includes(doc._id) ) continue; // Explicitly exclude this document
      let matched = !query;

      // Do a full-text search against any searchable fields based on metadata
      if ( query ) {
        const searchFields = DocumentCollection.getSearchableFields(doc.documentName, doc.type);
        const match = CompendiumIndex.#searchTextFields(doc, searchFields, regex);
        if ( !match ) continue; // Query did not match, no need to continue
        matched = true;
      }

      // Apply filters
      for ( const filter of filters ) {
        const match = IndexFilter.evaluateFilter(doc, filter);
        
        if ( !match ) {
          matched = false;
          break; // Filter did not match, no need to continue
        }
      }
      if ( matched ) results.push(doc);
    }

    // Sort documents and reverse if needed
    const field = this.sortOptions.field;

    const sorted = results.sort((a, b) => {
      const valueA = foundry.utils.getProperty(a, field) + '' ?? '';
      const valueB = foundry.utils.getProperty(b, field) + '' ?? '';
      
      return valueA.localeCompare(valueB, game.i18n.lang)
    });
    
    return this.sortOptions.reverse ? sorted.reverse() : sorted;
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
        if ( IndexFilter.testQuery(rgx, v) ) return true;
      }
      else if ( Array.isArray(v) ) {
        if ( v.some(x => IndexFilter.testQuery(rgx, x)) ) return true;
      }
      else if ( typeof v === "object" ) {
        const m = CompendiumIndex.#searchTextFields(v, field, rgx, domParser);
        if ( m ) return true;
      }
    }
    return false;
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
        this.searchFilters = {
          'type': ['equipment']
        };
      break;

      case 'armor': 
        this.view = 'armor';
        this.searchFilters = {
          'type': ['equipment'],
          'system.subtype': ['armor']
        }
      break;

      case 'weapons':
        this.view = 'weapons';
        this.searchFilters = {
          'type': ['equipment'],
          'system.subtype': ['weapon']
        }
      break;

      case 'hirelings':
        this.view = 'creatures';
        this.searchFilters = {
          sourceCompendia: ['weirdwizard.hirelings'],
          'type': ['npc']
        }
      break;

      /* Character Option Presets */
      case 'ancestries':
        this.view = 'ancestries';
        this.searchFilters = {
          'type': ['ancestry']
        }
      break;

      case 'professions':
        this.view = 'professions';
        this.searchFilters = {
          'type': ['profession']
        }
      break;

      case 'novice':
        this.view = 'paths';
        this.searchFilters = {
          'type': ['path'],
          'system.tier': ['novice']
        }
      break;

      case 'expert':
        this.view = 'paths';
        this.searchFilters = {
          'type': ['path'],
          'system.tier': ['expert']
        }
      break;

      case 'master':
        this.view = 'paths';
        this.searchFilters = {
          'type': ['path'],
          'system.tier': ['master']
        }
      break;

      case 'traditions':
        this.view = 'traditions';
        this.searchFilters = {
          'type': ['tradition']
        }
      break;

      /* Other Presets */
      case 'creatures':
        this.view = 'creatures';
        this.searchFilters = {
          'type': ['npc']
        }
      break;

      case 'talents':
        this.view = 'talents';
        this.searchFilters = {
          'type': ['talent']
        }
      break;
      
      case 'spells':
        this.view = 'spells';
        this.searchFilters = {
          'type': ['spell']
        }
      break;
      
    }
    
    return this.view;
  }

  /* -------------------------------------------- */

  /* Returns a data object containing arrays of filter's value and label */
  get filtersData () {
    const filters = {};

    // Document Type
    filters['type'] = [];
    const docTypes = [CONFIG.Actor, CONFIG.Item, CONFIG.JournalEntryPage];
    const ignoredDocs = ['base', 'group', 'Ancestry', 'Profession', 'Path', 'text', 'image', 'pdf', 'video'];
    
    docTypes.forEach(type => {
      for (const typeKey in type.typeLabels) {
        if (ignoredDocs.includes(typeKey)) continue;

        filters['type'].push({
          value: typeKey,
          label: i18n(type.typeLabels[typeKey]),
          //group: type.documentClass.documentName
        })
      }
    })

    // Other Filters
    const L = CONFIG.WW;
    const filtersRef = {
      'system.tier': {
        views: ['paths', 'spells'],
        locMap: L.TIERS
      },

      // Weapons view
      'system.grip': {
        views: ['weapons'],
        locMap: L.WEAPON_GRIPS
      }
    }

    // Add View-specific filters
    for (const filterKey in filtersRef) {
      const { views, locMap } = filtersRef[filterKey];
      filters[filterKey] = [];

      for (const [key, loc] of Object.entries(locMap)) {
        filters[filterKey].push({
          value: key,
          label: i18n(loc)
        })
      }
    }

    return filters;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _attachPartListeners(partId, element, options) {
    super._attachPartListeners(partId, element, options);

    if ( partId === "sidebar" ) {
      // Search input
      const searchInput = this.element.querySelector("input[type=search]");
      searchInput.addEventListener("input", (event) => this.#onSearch(event));

      // Right click on multi-checkboxes
      const multiCheckboxes = this.element.querySelectorAll("multi-checkbox");
      multiCheckboxes.forEach(x => x.addEventListener("contextmenu", (event) => this.#onFilterRightClick(event)))
    }
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
  */
  #onSearch(event) {
    event.preventDefault();
    this.searchQuery = event.target.value;
    this.render({ parts: ['view'] });
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
  */
  #onFilterRightClick(event, element) {
    event.preventDefault();

    const label = event.target.closest('label.checkbox');
    if (!label) return;
    const multiCheckbox = label.closest('multi-checkbox');
    const { value, checked } = label.querySelector('input');
    
    // Cross reference with multiCheckboxesData
    const multicheckboxData = [...this.multiCheckboxesData.find(x => x.name === multiCheckbox.name).options];
    const checkedData = multicheckboxData.find(x => x.value === value);
    const selectedValues = multiCheckbox.value;

    // Process checkbox groups
    if (checkedData.group) {
      // Remove group from selected values
      const group = multicheckboxData.filter(x => x.group === checkedData.group && x.value !== value);
      const arr = selectedValues.filter(x => !group.map(x => x.value).includes(x));

      multiCheckbox.value = [...arr, value];
    } else {
      multiCheckbox.value = [value];
    }
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static async #openSheet(event, target) {
    const doc = await fromUuid(target.dataset.docUuid);
    
    return doc.documentName === 'JournalEntryPage' ? doc.viewPage() : doc.sheet.render(true);
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static #sortDocuments(event, target) {
    const field = target.dataset.field;
    
    this.sortOptions = {
      field: field,
      reverse: field === this.sortOptions.field && !this.sortOptions.reverse ? true : false
    }
    
    this.render();
  }

  /* -------------------------------------------- */

  static async #onOpenHelp() {
    const entry = await fromUuid('Compendium.weirdwizard.documentation.JournalEntry.QVPARrip4J6pNUPN');
    entry.sheet.render(true);
  }

  /* -------------------------------------------- */

  static async #onResyncDocuments() {
    await this._updateFullDocumentData();
    
    this.render();
  }

  /* -------------------------------------------- */

  static async #createRollTable(event, target) {
    const table = await RollTable.create({
      name: i18n("WW.Index.RollTable.Title"),
      results: this.filteredDocuments.map((item, index) => {
        return ({
          img: item.img,
          text: `@UUID[${item.uuid}]`,//text: item.system.descriptionEnriched,
          type: CONST.TABLE_RESULT_TYPES.DOCUMENT,
          range: [index+1,index+1]
        })
      })
    })

    table.sheet.render(true);
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
    const {view, searchQuery, sourceCompendia, ...filters} = formData.object;

    this.view = view;
    this.searchQuery = searchQuery;
    this.searchFilters = filters;

    // Update full document data if it does not exist
    if (sourceCompendia !== this.sourceCompendia) {
      this.sourceCompendia = sourceCompendia;
      await this._updateFullDocumentData(sourceCompendia);
    }
    
    return this.render();
  }

  /* -------------------------------------------- */
  /*  Drag and Drop Operations                    */
  /* -------------------------------------------- */

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDragStart(event) {
    const li = event.currentTarget.closest(".item");
    let dragData;

    // Dragging document
    if ( li.dataset.docUuid ) {
      const document = await fromUuid(li.dataset.docUuid);
      if (!document) return;
      dragData = document.toDragData();
    }

    // Set data for transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
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
    // Do nothing
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

  /* -------------------------------------------- */

  #searchFilters = [];

  get searchFilters() {
    return this.#searchFilters;
  }

  set searchFilters(raw) {
    const searchFilters = [];
    
    for (const [key, value] of Object.entries(raw)) {
      searchFilters.push({
        field: key,
        operator: foundry.applications.ux.SearchFilter.OPERATORS.CONTAINS,
        value: value ?? this.filtersData[key].map(x => x.value)
      })
    }
    
    this.#searchFilters = searchFilters;
  }
  
  /* -------------------------------------------- */

  static get colHeaders() {
    return {
      // General Fields
      'name': {
        label: "WW.Item.Name",
        css: "item-name",
        views: ['all']
      },
      'genericTypeLabel': {
        label: "WW.Item.Type",
        css: "flex-width-90",
        views: ['generic']
      },
      'equipmentSubtype': {
        label: "WW.Item.Type",
        css: "flex-width-60",
        views: ['equipment']
      },
      // Armor
      'armorType': {
        label: "WW.Armor.Type",
        css: "flex-width-60",
        views: ['armor']
      },
      'armorDefense': {
        label: "WW.Defense.Label",
        css: "flex-width-60",
        views: ['armor']
      },
      // Equipment
      'equipmentAvailability': {
        label: "WW.Equipment.Availability.Short",
        css: "flex-width-80",
        views: ['equipment', 'armor', 'weapons']
      },
      'equipmentPrice': {
        label: "WW.Equipment.Price",
        css: "flex-width-60",
        views: ['equipment', 'armor', 'weapons']
      },
      'equipmentUses': {
        label: "WW.Equipment.Uses",
        css: "",
        views: ['equipment']
      },
      // Weapons
      'weaponRequirement': {
        label: "WW.Equipment.Requirement.Label",
        css: "flex-width-90",
        views: ['weapons']
      },
      'weaponRange': {
        label: "WW.Weapon.Type",
        css: "flex-width-60",
        views: ['weapons']
      },
      'weaponGrip': {
        label: "WW.Weapon.Grip.Label",
        css: "flex-width-60",
        views: ['weapons']
      },
      'weaponDamage': {
        label: "WW.Damage.Label",
        css: "flex-width-60",
        views: ['weapons']
      },
      'weaponTraits': {
        label: "WW.Weapon.Traits.Label",
        css: "item-traits",
        views: ['weapons']
      },
      // Ancestries
      'ancestryDescriptors': {
        label: "WW.ListEntry.Descriptor.Label",
        css: "",
        views: ['ancestries']
      },
      'ancestrySenses': {
        label: "WW.ListEntry.Sense.Label",
        css: "",
        views: ['ancestries']
      },
      'ancestryLanguages': {
        label: "WW.ListEntry.Language.Label",
        css: "",
        views: ['ancestries']
      },
      'ancestryStats': {
        label: `${i18n("WW.Defense.Label")} & ${i18n("WW.Health.Label")}`,
        css: "flex-width-70",
        views: ['ancestries']
      },
      'ancestrySize': {
        label: "WW.Stats.Size",
        css: "flex-width-50",
        views: ['ancestries']
      },
      'ancestrySpeed': {
        label: "WW.Stats.Speed",
        css: "",
        views: ['ancestries']
      },
      'ancestryImmunities': {
        label: "WW.ListEntry.Immunity.Label",
        css: "",
        views: ['ancestries']
      },
      'ancestryTraits': {
        label: "WW.Weapon.Traits.Label",
        css: "item-last",
        views: ['ancestries']
      },
      // Paths
      'pathTier': {
        label: "WW.Item.Tier",
        css: "flex-width-60",
        views: ['paths']
      },
      'pathNatural': {
        label: "WW.Defense.Natural",
        css: "flex-width-60",
        views: ['paths']
      },
      'pathArmored': {
        label: "WW.Defense.Armored",
        css: "flex-width-60",
        views: ['paths']
      },
      'pathHealth': {
        label: "WW.Health.Label",
        css: "flex-width-60",
        views: ['paths']
      },
      'pathBonusDamage': {
        label: "WW.Damage.Bonus",
        css: "flex-width-60",
        views: ['paths']
      },
      'pathSpeed': {
        label: "WW.Stats.Speed",
        css: "flex-width-60",
        views: ['paths']
      },
      'pathTraditions': {
        label: "WW.Tradition.Label",
        css: "flex-width-70",
        views: ['paths']
      },
      'pathSpells': {
        label: "WW.Spells.Label",
        css: "flex-width-90",
        views: ['paths']
      },
      'pathTalents': {
        label: "WW.CharOptions.PathTalents",
        css: "item-last",
        views: ['paths']
      },
      // Professions
      'professionCategory': {
        label: "WW.Profession.Category",
        css: "flex-width-60",
        views: ['professions']
      },
      'professionLanguages': {
        label: "WW.ListEntry.Language.Bonus",
        css: "",
        views: ['professions']
      },
      'professionEquipment': {
        label: "TYPES.Item.equipment",
        css: "",
        views: ['professions']
      },
      // Traditions
      'traditionTalents': {
        label: "WW.Tradition.Talents",
        css: "",
        views: ['traditions']
      },
      'traditionNoviceSpells': {
        label: "WW.Spells.Novice",
        css: "",
        views: ['traditions']
      },
      'traditionExpertSpells': {
        label: "WW.Spells.Expert",
        css: "",
        views: ['traditions']
      },
      'traditionMasterSpells': {
        label: "WW.Spells.Master",
        css: "",
        views: ['traditions']
      },
      // Creatures
      'creatureGroup': {
        label: "TYPES.Actor.group",
        css: "flex-width-60",
        views: ['creatures']
      },
      'creatureDifficulty': {
        label: "WW.Stats.Difficulty",
        css: "flex-width-70",
        views: ['creatures']
      },
      'creatureDescriptors': {
        label: "WW.ListEntry.Descriptor.Label",
        css: "",
        views: ['creatures']
      },
      'creatureStrength': {
        label: "WW.Attributes.Strength",
        css: "flex-width-70",
        views: ['creatures']
      },
      'creatureAgility': {
        label: "WW.Attributes.Agility",
        css: "flex-width-60",
        views: ['creatures']
      },
      'creatureIntellect': {
        label: "WW.Attributes.Intellect",
        css: "flex-width-70",
        views: ['creatures']
      },
      'creatureWill': {
        label: "WW.Attributes.Will",
        css: "flex-width-50",
        views: ['creatures']
      },
      'creatureDefense': {
        label: "WW.Defense.Label",
        css: "flex-width-60",
        views: ['creatures']
      },
      'creatureHealth': {
        label: "WW.Health.Label",
        css: "flex-width-60",
        views: ['creatures']
      },
      'creatureSize': {
        label: "WW.Stats.Size",
        css: "flex-width-50",
        views: ['creatures']
      },
      'creatureSpeed': {
        label: "WW.Stats.Speed",
        css: "flex-width-50",
        views: ['creatures']
      },
      // Traits & Talents
      'talentType': {
        label: "WW.Item.Type",
        css: "flex-width-60",
        views: ['talents']
      },
      'talentMagical': {
        label: "WW.Talent.Magical",
        css: "flex-width-50",
        views: ['talents']
      },
      'talentUses': {
        label: "WW.Talent.Uses",
        css: "",
        views: ['talents']
      },
      'talentUsedBy': {
        label: "WW.Item.UsedBy",
        css: "",
        views: ['talents']
      },
      // Spells
      'spellTier': {
        label: "WW.Item.Tier",
        css: "flex-width-60",
        views: ['spells']
      },
      'spellTradition': {
        label: "WW.Spell.Tradition",
        css: "flex-width-60",
        views: ['spells']
      },
      'spellCastings': {
        label: "WW.Spell.Castings",
        css: "",
        views: ['spells']
      },
      'spellTarget': {
        label: "WW.Spell.Target",
        css: "",
        views: ['spells']
      },
      'spellDuration': {
        label: "WW.Spell.Duration",
        css: "",
        views: ['spells']
      },
      // Description
      'system.descriptionEnriched': {
        label: "WW.Item.Description",
        css: "item-last",
        views: ['generic', 'equipment', 'armor', 'professions', 'talents', 'spells']
      }      
    };
  }

  get sortingIcons() {
    const icons = {};
    
    Object.keys(CompendiumIndex.colHeaders).forEach(x => {
      let icon = 'sort';
      if (this.sortOptions.field === x) icon = this.sortOptions.reverse ? 'arrow-up-short-wide' : 'arrow-down-short-wide';

      icons[x] = `fas fa-${icon}`;
    })

    return icons;
  }

  /* -------------------------------------------- */
  /*  Static Utility Methods                      */
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

  /* Returns an array of compendia UUIDs */
  static getCompendiumArray() {
    const arr = [];
    const allowedTypes = ["Actor", "Item", "JournalEntry"];

    for (const pack of game.packs) {
      const data = pack.metadata;
      
      if (!allowedTypes.includes(data.type)) continue; // Skip document types not allowed

      // Package Name exists in the system's group list
      const compGroups = CONFIG.WW.COMPENDIUM_GROUPS;
      const group = Object.hasOwn(compGroups, data.packageName) ? compGroups[data.packageName] : compGroups[data.packageType];
      
      arr.push({
        value: data.id,
        label: data.label,
        group: i18n(group)
      })

    }

    return arr;
  }

  /* -------------------------------------------- */

  static defineCompendiumIndexFields() {
    // Actors
    CONFIG.Actor.compendiumIndexFields = [
      'system.description',
      'folder',
      // Attributes
      'system.attributes.str.value',
      'system.attributes.agi.value',
      'system.attributes.int.value',
      'system.attributes.wil.value',
      // Stats
      'system.stats.difficulty',
      'system.stats.defense.natural',
      'system.stats.health.normal',
      'system.stats.size',
      'system.stats.speed.normal',
      // List Entries
      'system.listEntries'
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
      'system.requirements',
      'system.grip',
      'system.damage',
      'system.traits',
      // Talent specific
      'system.source',
      'system.magical',
      'system.uses.max',
      'system.usedBy',
      // Spell specific
      'system.tier',
      'system.tradition',
      'system.casting',
      'system.target',
      'system.duration'
    ];

    // Journal Entries
    CONFIG.JournalEntry.compendiumIndexFields = [
      'pages.name',
      'pages.type',
      'pages.src',
      'pages.text',
      'pages.system.tier',
      'pages.system.category',
      'pages.system.listEntries',
      'pages.system.benefits',
      'pages.system.talents',
      'pages.system.spells'
    ];
  }
}