import {
  capitalize,
  defaultListEntryKey,
  defaultListEntryName,
  escape,
  i18n,
  plusify,
  sum,
  sysPath
} from '../../helpers/utils.mjs';
import { diceTotalHtml } from '../../sidebar/chat-html-templates.mjs';
import { mapRange } from '../../canvas/canvas-functions.mjs';
import MultiChoice from '../../apps/multi-choice.mjs';
import { createActiveEffect, deleteActiveEffect, editActiveEffect, prepareActiveEffectCategories } from '../../helpers/effect-actions.mjs';
import RollAttribute from '../../dice/roll-attribute.mjs';
import TargetingHUD from '../../apps/targeting-hud.mjs';
import WWDialog from '../../apps/dialog.mjs';
import WWPageView from '../journal/page-view.mjs';
import WWRoll from '../../dice/roll.mjs';
import { EntrySettingsDisplay } from '../../apps/entry-settings-display.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ActorSheetV2 = foundry.applications?.sheets?.ActorSheetV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * Extend the basic ActorSheetV2 with modifications tailored for SotWW
 * @extends {ActorSheetV2}
*/

export default class WWActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  constructor(options = {}) {
    super(options); // Required for the constructor to work 
  }
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'actor'],
    tag: 'form',
    window: {
      title: this.title, // Custom title display
      icon: 'fa-regular fa-scroll',
      resizable: true,
      contentClasses: ['scrollable'],
      controls: [
        {
          action: "embedInChat",
          icon: "fa-solid fa-scroll",
          label: "WW.System.Embed",
          ownership: "OWNER"
        },
        {
          action: "linkInChat",
          icon: "fa-solid fa-link",
          label: "WW.System.Link",
          ownership: "OWNER"
        },
        {
          action: "openTour",
          icon: "fa-solid fa-person-hiking",
          label: "WW.System.Tour",
          ownership: "OWNER"
        }
      ]
    },
    actions: {
      editImage: this.#onEditImage, // delete in V13; core functionality
      embedInChat: this.#embedInChat,
      linkInChat: this.#linkInChat,
      startRest: this.#onRest,
      resetSheet: this.#onSheetReset,

      editModeToggle: this.#onToggleEditMode,
      dispositionToggle: this.#onDispositionToggle,
      incapacitatedRoll: this.#onIncapacitatedRoll,
      attributeRoll: this.#onAttributeRoll,
      afflictionsMenu: this.#onAfflictionsMenuOpen,
      folderEdit: this.#onFolderEdit,

      entryCreate: this.#onEntryCreate,
      entryEdit: this.#onEntryEdit,
      entryRemove: this.#onEntryRemove,
      entrySettings: this.#onEntrySettingsDisplay,

      journalView: this.#onJournalView,
      journalRemove: this.#onJournalRemove,
      journalHelp: this.#onJournalHelp,
      journalInvalid: this.#onJournalInvalid,

      itemCreate: this.#onItemCreate,
      itemEdit: this.#onItemEdit,
      itemRemove: this.#onItemRemove,

      itemLabelClick: this.#onItemLabelClick,
      itemScroll: this.#onItemScroll,
      itemToggleEffects: this.#onItemToggleEffects,
      itemToggleReloaded: this.#onItemToggleReloaded,
      itemUpdateUses: this.#onItemUpdateUses,
      containerCollapse: this.#onContainerCollapse,

      effectCreate: this.#onEffectCreate,
      effectEdit: this.#onEffectEdit,
      effectToggle: this.#onEffectToggle,
      effectRemove: this.#onEffectRemove
    },
    form: {
      handler: this.#onSubmitDocumentForm, // delete in v13, core functionality
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 860,
      height: 500
    }
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    const {constructor: cls, id, name, type} = this.actor;
    const prefix = cls.hasTypeData && type !== "base" ? CONFIG[cls.documentName].typeLabels[type] : cls.metadata.label;
    return `${name ?? id} - ${game.i18n.localize(prefix)}`;
  }

  /* -------------------------------------------- */
  static PARTS = {
    // Handled by the subclasses
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // Handled by the subclass
    
    return options;
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
    const type = this.actor.type;

    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = this.actor.limited ? 'details' : 'summary';
    
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
        case 'summary':
          tab.id = 'summary';
          tab.label = 'WW.Actor.Summary';
          tab.icon = 'systems/weirdwizard/assets/icons/diploma.svg';
          break;
        case 'details':
          if (type === 'Character') {
            tab.id = 'details';
            tab.label = 'WW.Actor.Details';
            tab.icon = 'systems/weirdwizard/assets/icons/scroll-quill.svg';
          }
          break;
        case 'equipment':
          if (type === 'Character') {
            tab.id = 'equipment';
            tab.label = 'WW.Equipment.Label';
            tab.icon = 'systems/weirdwizard/assets/icons/backpack.svg';
          }
          break;
        case 'talents':
          if (type === 'Character') {
            tab.id = 'talents';
            tab.label = 'WW.Talents.Label';
            tab.icon = 'systems/weirdwizard/assets/icons/skills.svg';
          }
          break;
        case 'spells':
          if (type === 'Character') {
            tab.id = 'spells';
            tab.label = 'WW.Spells.Label';
            tab.icon = 'systems/weirdwizard/assets/icons/spell-book.svg';
          }
          break;
        case 'description':
          if (type === 'NPC') {
            tab.id = 'description';
            tab.label = 'WW.Item.Description';
            tab.icon = 'systems/weirdwizard/assets/icons/scroll-quill.svg';
          }
          break;
        case 'effects':
          tab.id = 'effects';
          tab.label = 'WW.Effects.Label';
          tab.icon = '/icons/svg/aura.svg';
          break;
        default: break;
      }

      // Activate tab
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = "active";
      if (tab.id) tabs[partId] = tab;

      return tabs;
    }, {});
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
      charOptions: actorData.charOptions,
      folder: await actorData.folder,
      flags: actorData.flags,
      dtypes: ['String', 'Number', 'Boolean'],
      editMode: this.editMode, // Pass editMode state
      tabs: this._getTabs(options.parts),
      afflictions: this.appliedAfflictions,

      itemSources: CONFIG.WW.TALENT_SOURCES,
      tiers: CONFIG.WW.TIERS,

      injured: actorData.injured,
      incapacitated: actorData.incapacitated,
      dead: actorData.dead
    }
    
    // Prepare attributes
    for (let attr of Object.values(context.system.attributes)) {
      attr.isCheckbox = attr.dtype === 'Boolean';
    }

    // Localize attribute names
    for (let [k, v] of Object.entries(context.system.attributes)) {
      v.label = i18n(CONFIG.WW.ATTRIBUTES[k] ?? k);
    }

    // Prepare Disposition
    context.disposition = await this.actor?.token ? await this.actor.token.disposition : await this.actor.prototypeToken.disposition;

    // Prepare Health data
    const damage = actorData.system.stats.damage.value;
    const health = actorData.system.stats.health;
    const current = health.current;
    const temp = health.temp;

    // Get Health percentages
    context.healthPct = current > 0 ? (damage / current) * 100 : 100;
    context.tempHealthPct = current > 0 ? (temp < current ? (temp / current) * 100 : 100) : 0;

    // Get the degrees on the HSV wheel, going from 30° (greenish-yellow) to 120° (green)
    const degrees = mapRange((current ? damage : 1), 0, (current ? current : 1), 30, 120);
    // Invert the degrees and map them from 0 to a third
    context.healthHue = mapRange(120 - degrees, 0, 120, 0, 1 / 3);

    // Prepare Sizes
    context.sizes = Object.entries(CONFIG.WW.SIZES).map(([k, v]) => ({key: k, label: v})).sort((a,b) => a.key - b.key);
    context.size = CONFIG.WW.SIZES[context.system.stats.size];

    // Prepare hasEffect for use in templates
    context.hasEffect = {};

    CONFIG.statusEffects.forEach(function (e) {
      context.hasEffect[e.id] = actorData.statuses.has(e.id);
    })

    /* Tooltips */

    // Health tooltip
    context.healthTooltip = escape(`
      <p>${i18n("WW.Health.Current")}: ${health.current}</p>
      <p>${i18n("WW.Health.NormalScore")}: ${health.normal}</p>
      <p>${i18n("WW.Health.Temporary")}: ${health.temp}</p>
      <p>${i18n("WW.Health.Lost")}: ${health.lost}</p>
    `);

    if (!health.normal || health.temp) context.healthTooltip += `<hr/>`;
    if (!health.normal) context.healthTooltip += escape(`<p>• ${i18n('WW.Health.NormalHint')}</p>`);
    if (health.temp) context.healthTooltip += escape(`<p>• ${i18n("WW.Health.CurrentHint")}</p>`);

    // Speed tooltip
    context.speedTooltip = escape(`
      <p>${i18n("WW.Stats.NormalSpeed")}: ${actorData.system.stats.speed.normal}</p>
      <p>• ${i18n('WW.Stats.AutomationHint', { stat: i18n("WW.Stats.NormalSpeed") })}</p>
    `);

    // Size tooltip
    context.sizeTooltip = escape(`
      <p>${i18n('WW.Stats.AutomationHint', { stat: i18n("WW.Stats.Size") })}</p>
    `);

    // Bonus Damage Tooltip
    context.bonusDamageTooltip = escape(`
      <p>${i18n('WW.Stats.AutomationHint', { stat: i18n("WW.Damage.Bonus") })}</p>
    `);

    // Prepare Items
    context.items = this.actor.items.contents.toSorted((a, b) => a.sort - b.sort);
    await this._prepareItems(context);

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
    
    context.listEntries = listEntries;

    // Prepare character data
    if (actorData.type == 'Character') await this._prepareCharacterData(context);

    // Prepare NPC data
    if (actorData.type == 'NPC') await this._prepareNPCData(context);

    // Add roll data for Prose Mirror editors
    context.rollData = actorData.getRollData();
    
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      // Summmary tab
      case 'summary':
        context.tab = context.tabs[partId];
      break;
      
      // Details tab
      case 'details':
        context.tab = context.tabs[partId];
      break;
      
      // Equipment tab
      case 'equipment':
        context.tab = context.tabs[partId];
      break;
      
      // Talents tab
      case 'talents':
        context.tab = context.tabs[partId];
      break;
      
      // Spells tab
      case 'spells':
        context.tab = context.tabs[partId];
      break;
      
      // Description tab
      case 'description':
        context.tab = context.tabs[partId];
        context.system.description.enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description.value, { secrets: this.actor.isOwner });
      break;
      
      // Effects tab
      case 'effects':
        context.tab = context.tabs[partId];

        // Prepare all applied active effects
        context.appliedEffects = await prepareActiveEffectCategories(await this.actor.appliedEffects);
        
        for (const c in context.appliedEffects) {
          context.appliedEffects[c].effects = context.appliedEffects[c].effects.toSorted((a, b) => a.sort - b.sort)
        }

        // Prepare all embedded active effects
        context.effects = await prepareActiveEffectCategories(await this.actor.effects);

        for (const c in context.effects) {
          context.effects[c].effects = context.effects[c].effects.toSorted((a, b) => a.sort - b.sort)
        };
        
      break;
    }

    return context;
  }

  /**
   * Organize and classify Items for actor sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {Promise<void>}
  */
  async _prepareItems(context) {

    // Initialize item lists
    const equipment = [];
    const weapons = [];
    const allTalents = [];
    const talents = [];
    const actions = [];
    const reactions = [];
    const end = [];
    const spells = [];
    const legacy = []; // Delete when char options legacy support is removed

    // Iterate through items, then allocate it to lists
    for (const i of context.items) {

      //i.img = i.img || DEFAULT_TOKEN; - not needed anymore?

      // Assign attributeLabel for template use
      if (i.system.attribute == 'luck') {
        i.system.attributeLabel = `${i18n('WW.Attributes.Luck')} (+0)`;
      } else if (i.system.attribute) {
        const attribute = context.system.attributes[i.system.attribute];
        const name = i18n(CONFIG.WW.ATTRIBUTES[i.system.attribute]);
        i.system.attributeLabel = `${name} (${plusify(attribute.mod)})`
      }

      // Check if item has passive effects
      i.hasPassiveEffects = i.effects.some((ef => ef.system.trigger === 'passive'));

      // Pass down whether the item need targets or not
      //i.needTargets = this.actor.items.get(i._id).needTargets; - no longer needed?

      // Prepare html fields for the tooltip and chat message
      const isOwner = this.actor.isOwner;
      const TextEditor = foundry.applications.ux.TextEditor.implementation;
      i.system.description.enriched = await TextEditor.enrichHTML(i.system.description.value, { secrets: isOwner });
      if (i.system.attackRider) i.system.attackRider.enriched = await TextEditor.enrichHTML(i.system.attackRider.value, { secrets: isOwner });

      // Prepare tooltip context
      const tooltipContext = {
        label: i.name,
        system: i.system,
        img: i.img,
        type: i.type,
        inSheet: true,

        subtitle: i.type,
        text: i.system.description.enriched ?? null,
        attackRider: i.system.attackRider?.enriched ?? null
      }

      // Prepare tooltip subtitle
      if (i.type === 'Spell') {
        tooltipContext.subtitle += ` • ${i18n(CONFIG.WW.TIERS[i.system.tier])}`
        if (i.system.tradition) tooltipContext.subtitle += ` • ${i.system.tradition}`;

      } else if (i.type === 'Equipment') {
        tooltipContext.subtitle = i18n(CONFIG.WW.EQUIPMENT_SUBTYPES[i.system.subtype]);

        if (i.system.subtype === 'weapon') tooltipContext.subtitle += ` • ${i.system.traits.range ? i18n("WW.Weapon.Ranged") : i18n("WW.Weapon.Melee")}`;

      } else if (i.type === 'Trait or Talent') {
        tooltipContext.subtitle = i18n(CONFIG.WW.TALENT_SUBTYPES[i.system.subtype]);
        tooltipContext.subtitle += ` • ${i18n(CONFIG.WW.TALENT_SOURCES[i.system.source])}`;
      }

      i.tooltip = await foundry.applications.handlebars.renderTemplate(sysPath(`templates/apps/tooltips/item.hbs`), tooltipContext);

      // Append to equipment.
      if (i.type === 'Equipment') {
        // Prepare traits list for weapons
        if (i.system.subtype == 'weapon') {

          // Prepare traits list
          let list = '';

          Object.entries(i.system.traits).map((x) => {

            if (x[1]) {
              let string = i18n('WW.Weapon.Traits.' + capitalize(x[0]) + '.Label');

              if ((x[0] == 'range') || (x[0] == 'reach' && i.system.range) || (x[0] == 'thrown')) string += ' ' + i.system.range;

              list = list.concat(list ? ', ' + string : string);
            }

          })

          i.system.traitsList = list;

          // Prepare name label
          if (context.actor.type == 'Character') {
            i.label = `${i.name} (${i18n(CONFIG.WW.WEAPON_GRIPS_SHORT[i.system.grip])})${(i.system.traitsList ? ' ● ' + i.system.traitsList : '')}`;
          } else i.label = (i.system.traits.range ? i18n('WW.Attack.Ranged') : i18n('WW.Attack.Melee')) + '—' + i.name + (i.system.traitsList ? ' ● ' + i.system.traitsList : '');

        }

        // Prepare filled capacity for containers
        else if (i.system.subtype == 'container') {
          if (i.system.heldBy) i.system.heldBy = null;
          // Prepare variables
          let list = '';
          const held = [];
          i.filled = 0;

          // Prepare held items list and count weight of items
          this.actor.items.filter(x => x.system.heldBy === i._id).map((x) => {
            // Check if item has passive effects
            x.hasPassiveEffects = false;
            const effects = this.actor.items.get(x._id).effects;

            for (let e of effects) {
              if (e.system.trigger === 'passive') x.hasPassiveEffects = true;
            }

            // Calculate weight and push to held array
            const weight = x.system.quantity * x.system.weightUnit;
            x.system.weight = weight;
            held.push(x);

            // Increase filled count
            i.filled += weight;

            // Append to list
            list = list.concat(list ? ', ' + x.name : x.name);
          })
          
          i.heldItems = held.sort((a, b) => a.sort > b.sort ? 1 : -1);
          i.heldList = list;
          
          // Prepare tooltip
          i.containerTooltip = i18n('WW.Container.FilledHint', { filled: i.filled, capacity: i.system.capacity });
        }

        if (!i.system.heldBy) {

          if (i.system.subtype === 'weapon') {
            weapons.push(i);

            // If Character or if item has a Permanent effect, also append to Equipment
            if (this.actor.type === 'Character' || i.effects.some(e => e.changes.some(c => c.key === "defense.bonus"))) equipment.push(i);

          } else {
            equipment.push(i);
          }

        } else {

          if (!this.actor.items.get(i.system.heldBy)) {
            i.system.heldBy = null;
            equipment.push(i);
          }

        }

      }

      // Append to talents.
      else if (i.type === 'Trait or Talent') {

        if (context.actor.type == 'NPC') {
          switch (i.system.subtype) {
            case 'trait': {
              talents.push(i);
              break;
            }
            case 'action': {
              actions.push(i);
              break;
            }
            case 'reaction': {
              reactions.push(i);
              break;
            }
            case 'end': {
              end.push(i);
              break;
            }
          }
        } else {
          allTalents.push(i);
          switch (i.system.subtype) {
            case 'action': {
              actions.push(i);
              break;
            }
            case 'reaction': {
              reactions.push(i);
              break;
            }
            default: {
              talents.push(i);
            }
          }
        }

      }

      // Append to spells.
      else if (i.type === 'Spell') spells.push(i);

      // Appegend to legacy items array.
      else {
        legacy.push(i);
      }

      // Calculate total Equipment weight.
      function calcWeight(item, id) {
        item.system.weight = item.system.quantity * item.system.weightUnit;
      }

      equipment.forEach(calcWeight);

      context.totalWeight = sum(equipment.map(i => i.system.weight));

    }

    // Prepare uses pips for talents and spells
    function updateUses(item, id) {
      let spent = item.system.uses.value ? item.system.uses.value : 0;
      let max = item.system.uses.max;

      // Read the current amount of charges from the set max, or to be relative to the actor's level depending on the setting.
      // Only do this if it's a player character, as NPCs and non-characters do not have a level value to be relative to.
      if (context.actor.type === 'Character') {
        const level = context.actor.system.stats.level;
        const half = Math.floor(level / 2) > 0 ? Math.floor(level / 2) : 1;
        let third = 2; 
          
        if ( level < 3 ) {
          third = 1;
        } else if ( level > 6 ) {
          third = 3;
        }
        
        switch (item.system.uses.levelRelative) {
          case 'full': max = level; break;
          case 'half': max = half; break;
          case 'third': max = third; break;
        }
      }

      let arr = [];

      let i = 0; // fill the Buttons with available traditions

      for (i = 1; i <= max; i++) { // statement 1 = beginning of the block, statement 2 = condition, statement 3 = executed at the end of each loop
        if (i <= spent) { arr.push('fa-solid fa-circle-x') } else { arr.push('fa-regular fa-circle') };
      };

      item.uses = arr;
    }

    talents.forEach(updateUses);
    actions.forEach(updateUses);
    reactions.forEach(updateUses);
    equipment.forEach(updateUses);
    spells.forEach(updateUses);
    end.forEach(updateUses);
    
    // Assign and return
    context.equipment = equipment;
    context.weapons = weapons;
    context.allTalents = allTalents;
    context.talents = talents;
    context.actions = actions;
    context.reactions = reactions;
    context.end = end;
    context.spells = spells;
    context.legacy = legacy;
  }

  /**
   * Prepare data for Character sheets.
   *
   * @param {Object} context The actor's prepared context.
   *
   * @return {Promise<void>}
  */
  async _prepareCharacterData(context) {

    // Prepare dropdown lists
    context.levels = CONFIG.WW.LEVELS;
    context.level = CONFIG.WW.LEVELS[context.system.stats.level];
    const isOwner = this.actor.isOwner;
    const TextEditor = foundry.applications.ux.TextEditor.implementation;

    // Prepare enriched details to use in text editors
    context.enrichedDetails = {
      appearance: await TextEditor.enrichHTML(context.system.details.appearance.value, { secrets: isOwner }),
      background: await TextEditor.enrichHTML(context.system.details.background.value, { secrets: isOwner }),
      beliefs: await TextEditor.enrichHTML(context.system.details.beliefs.value, { secrets: isOwner }),
      notes: await TextEditor.enrichHTML(context.system.details.notes.value, { secrets: isOwner }),
      personality: await TextEditor.enrichHTML(context.system.details.personality.value, { secrets: isOwner })
    };
    
  }

  /**
   * Prepare data for NPC sheets.
   *
   * @param {Object} context The actor's prepared context.
   *
   * @return {Promise<void>}
  */

  async _prepareNPCData(context) {

    // Prepare dropdown lists
    context.difficulties = CONFIG.WW.BESTIARY_DIFFICULTIES;

    // Prepare editable Natural Defense check
    if (this.actor._source.system.stats.defense.natural !== this.actor.system.stats.defense.natural) context.defenseDisabled = true;

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
    const actor = this.actor;
    const window = this.element;

    window.classList.toggle('edit-mode', this.editMode); // Toggle edit mode
    window.classList.toggle('master', actor.system.stats.level >= 7); // Toggle Tier classes
    window.classList.toggle('expert', actor.system.stats.level >= 3);
    window.classList.toggle('injured', actor.injured); // Add Health status classes
    window.classList.toggle('incapacitated', actor.incapacitated && !actor.dead);
    window.classList.toggle('dead', actor.dead);
    window.classList.toggle('ally', (this.actor?.token ? this.actor.token.disposition : this.actor.prototypeToken.disposition) === 1);

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

    // Drag events for macros.
    /*if (this.actor.isOwner) {
      
      const handler = ev => this._onDragStart(ev)

      html.find('.dropitem').each((i, li) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }*/

  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // Initialize context menus
    this._createContextMenu(this._getProfileImageContextEntries, '.profile-img', {fixed: true});
    this._createContextMenu(this._getItemContextEntries, '.item-button', {fixed: true});

    // Force re-render to fix ancestry not loading up properly on new Characters
    this.render();
  }

  /* -------------------------------------------- */
  /*  Context Menus                               */
  /* -------------------------------------------- */

  /**
   * Get the profile image context options
   * @returns {object[]}   The Item context options
   * @private
   */
  _getProfileImageContextEntries() {
    
    return [
      {
        name: "WW.Actor.ShowPortrait",
        icon: '<i class="fa-solid fa-image-portrait"></i>',
        callback: li => {
          // From #onShowPortraitArtwork
          const {img, name, uuid} = this.actor;
          return new ImagePopout({src: img, uuid, window: {title: name}}).render({force: true});
        },
        condition: li => {
          return true;
        }
      },
      {
        name: "WW.Actor.ShowToken",
        icon: '<i class="fa-solid fa-circle-user"></i>',
        callback: li => {
          // From #onShowTokenArtwork
          const {prototypeToken, name, uuid} = this.actor;
          return new ImagePopout({src: prototypeToken.texture.src, uuid, window: {title: name}}).render({force: true});
        },
        condition: li => {
          return this.token ? true : false;
        }
      }
    ]

  }

  /* -------------------------------------------- */

  /**
   * Get right click context menu entries for Items.
   * @returns {ContextMenuEntry[]}
   */
  _getItemContextEntries() {
    
    return [
      {
        name: "WW.Item.Perform.Attack",
        icon: '<i class="fa-solid fa-bolt"></i>',
        callback: li => {
          return this._onItemUse(li.dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return item.type === 'Equipment' && item.system.subtype === 'weapon';
        }
      }, {
        name: "WW.Item.Perform.AttackTarget",
        icon: '<i class="fa-solid fa-bullseye"></i>',
        callback: li => {
          return this._onItemUse(li.dataset, 'targeted-use');
        },
        condition: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return item.type === 'Equipment' && item.system.subtype === 'weapon';
        }
      }, {
        name: "WW.Item.Perform.Equipment",
        icon: '<i class="fa-solid fa-bolt"></i>',
        callback: li => {
          return this._onItemUse(li.dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return item.type === 'Equipment' && item.system.subtype !== 'weapon';
        }
      }, {
        name: "WW.Item.Perform.EquipmentTarget",
        icon: '<i class="fa-solid fa-bullseye"></i>',
        callback: li => {
          return this._onItemUse(li.dataset, 'targeted-use');
        },
        condition: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return item.type === 'Equipment' && item.system.subtype !== 'weapon';
        }
      }, {
        name: "WW.Item.Perform.Spell",
        icon: '<i class="fa-solid fa-bolt"></i>',
        callback: li => {
          return this._onItemUse(li.dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return item.type === 'Spell';
        }
      }, {
        name: "WW.Item.Perform.SpellTarget",
        icon: '<i class="fa-solid fa-bullseye"></i>',
        callback: li => {
          return this._onItemUse(li.dataset, 'targeted-use');
        },
        condition: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return item.type === 'Spell';
        }
      }, {
        name: "WW.Item.Perform.Talent",
        icon: '<i class="fa-solid fa-bolt"></i>',
        callback: li => {
          return this._onItemUse(li.dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return item.type === 'Trait or Talent';
        }
      }, {
        name: "WW.Item.Perform.TalentTarget",
        icon: '<i class="fa-solid fa-bullseye"></i>',
        callback: li => {
          return this._onItemUse(li.dataset, 'targeted-use');
        },
        condition: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return item.type === 'Trait or Talent';
        }
      }, {
        name: "WW.Item.Send",
        icon: '<i class="fa-solid fa-scroll"></i>',
        callback: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return this._onItemScroll(item);
        }
      }, {
        name: "WW.Item.Edit.Activity",
        icon: '<i class="fa-solid fa-edit"></i>',
        callback: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return this._onItemEdit(item);
        }
      }, {
        name: "WW.Item.Remove.Activity",
        icon: '<i class="fa-solid fa-trash"></i>',
        callback: li => {
          const item = this.actor.items.get(li.dataset.itemId);
          return this._onItemRemove(item, li);
        }
      }
    ]

  }

  /* -------------------------------------------- */
  /*  General Event Listeners and Handlers        */
  /* -------------------------------------------- */

  static async #embedInChat(_event, target) {
    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
      content: `@Embed[${this.actor.uuid}]`
    })
  }

  static async #linkInChat(_event, target) {
    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
      content: `@Embed[${this.actor.uuid} inline]`
    })
  }

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
    const current = foundry.utils.getProperty(this.actor._source, attr);
    const defaultArtwork = this.actor.constructor.getDefaultArtwork?.(this.actor._source) ?? {};
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

  /* -------------------------------------------- */

  static #onAttributeRoll(event, button) {
    const dataset = Object.assign({}, button.dataset);

    // Define variables to be used
    const system = this.actor.system,
      origin = this.actor.uuid,
      attKey = dataset.key,
      label = i18n(CONFIG.WW.ATTRIBUTE_ROLLS[attKey]);

    let content = '';

    const obj = {
      origin: origin,
      label: label,
      icon: CONFIG.WW.ATTRIBUTE_ICONS[attKey],
      content: content,
      attKey: attKey
    }

    // Check for Automatic Failure
    if (system.autoFail[obj.attKey]) {

      const messageData = {
        type: 'd20-roll',
        speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
        flavor: label,
        content: content,
        sound: CONFIG.sounds.dice,
        'flags.weirdwizard': {
          icon: CONFIG.WW.ATTRIBUTE_ICONS[attKey],
          item: item.uuid,
          rollHtml: '<div class="dice-outcome chat-failure">' + i18n('WW.Roll.AutoFail') + '!</div>',
          emptyContent: !content ?? true
        }
      };
      
      ChatMessage.create(messageData);
    } else {
      new RollAttribute(obj).render(true);
    }
    
  }

  /* -------------------------------------------- */

  /* A function called to roll Luck while incapacitated */
  static async #onIncapacitatedRoll() {
    if (!this.actor.incapacitated || await this.actor.dead) return;

    // Prepare roll
    const r = await new WWRoll('1d6', this.actor.getRollData).evaluate();
    const rollArray= [r];
    const rollHtml = await diceTotalHtml(r);
  
    // Prepare message data
    const messageData = {
      type: 'd6-roll',
      rolls: rollArray,
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
      flavor: `<span>${i18n('WW.Health.IncapacitatedLost')}</span>`,
      content: '<div></div>',
      sound: CONFIG.sounds.dice,
      'flags.weirdwizard': {
        rollHtml: rollHtml,
        emptyContent: true
      }
    };
    
    await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    
    // Send to chat
    const msg = await ChatMessage.create(messageData);

    // Apply Health Loss (delay if DSN is installed)
    if (game.dice3d) {
      game.dice3d.waitFor3DAnimationByMessageID(await msg.id).then(()=> {
        this.actor.applyHealthLoss(r.total);
      });  
    } else {
      this.actor.applyHealthLoss(r.total);
    }
    
  
  }

  /**
    * Handle opening of a context menu from a chat button.
    * @param {HTMLElement} element     The element the menu opens on.
  */
  static #onAfflictionsMenuOpen(event, button) {
    const user = game.user;
    const afflictions = [];
    
    // Convert ContextMenu data to MultiChoice data
    CONFIG.statusEffects.forEach(a => {
      if (a.id in CONFIG.WW.AFFLICTIONS) afflictions.push({
        id: a.id,
        label: a.name,
        img: a.img,
        tip: a.description,
        group: 'afflictions',
        value: this.appliedAfflictions.find(x => x.id === a.id) ? true : false
      })
    }, {})
  
    // Create MultiChoice instance
    const rect = button.getBoundingClientRect();
    
    new MultiChoice({
      purpose: 'updateAfflictions',
      document: this.actor,
      dataset: button.dataset,
      position: {
        left: rect.right,
        top: rect.top
      },
      sections: [
        {
          choices: afflictions,
          noCollapse: true,
          cols: 'auto auto'
        }
      ]
    }).render(true);
  
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
      path = 'system.listEntries.' + listKey,
      baseObj = foundry.utils.getProperty(this.actor.token?.baseActor, path),
      obj = foundry.utils.getProperty(this.actor, path),
      entryKey = defaultListEntryKey(obj, listKey),
      entryName = defaultListEntryName(obj, listKey),
    entry = { name: entryName };
    
    obj[entryKey] = entry;

    // Update document
    await this.actor.update({[path]: obj});

    const context = {
      entry: entry,
      key: entryKey,
      showKey: true,
      grantedBy: await fromUuid(entry.grantedBy) ?
        await foundry.applications.ux.TextEditor.implementation.enrichHTML(`@Embed[${entry.grantedBy} inline]`, { secrets: this.actor.isOwner }) : null
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
    if (baseObj?.hasOwnProperty(entryKey) && entryKey !== dialogInput.key) {
      obj[entryKey] = null; // If the key exists in the Base Actor, null it
    } else {
      obj['-=' + entryKey] = null; // Delete key otherwise
    }

    await this.actor.update({[path]: obj});
    
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
      path = 'system.listEntries.' + dataset.listKey,
      baseObj = foundry.utils.getProperty(this.actor.token?.baseActor, path),
      obj = foundry.utils.getProperty(this.actor, path),
      entryKey = dataset.entryKey,
    entry = obj[entryKey];
    
    const context = {
      entry: await entry,
      key: entryKey,
      showKey: true,
      grantedBy: await fromUuid(entry.grantedBy) ?
        await foundry.applications.ux.TextEditor.implementation.enrichHTML(`@Embed[${entry.grantedBy} inline]`, { secrets: this.actor.isOwner }) : null
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
    if (baseObj?.hasOwnProperty(entryKey) && entryKey !== dialogInput.key) {
      obj[entryKey] = null; // If the key exists in the Base Actor, null it
    } else {
      obj['-=' + entryKey] = null; // Delete key otherwise
    }
    
    await this.actor.update({ [path]: obj });
  }

  /**
   * Handle removing an entry from a list
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  static async #onEntryRemove(event, button) {
    const dataset = Object.assign({}, button.dataset),
      path = 'system.listEntries.' + dataset.listKey,
      baseObj = foundry.utils.getProperty(this.actor.token?.baseActor, path),
    key = dataset.entryKey;
    
    // Update document
    if (baseObj?.hasOwnProperty(key)) {
      await this.actor.update({ [`${path}.${key}`]: null }); // If the key exists in the Base Actor, null it
    } else {
      await this.actor.update({ [`${path}.-=${key}`]: null }); // Delete key otherwise
    }
    
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
  /*  Journal page (Char Options) handling        */
  /* -------------------------------------------- */

  static async #onJournalView(event, button) {
    const page = await fromUuid(button.dataset.pageUuid);
    await new WWPageView({ document: page }).render(true);
  }

  /* -------------------------------------------- */

  static async #onJournalRemove(event, button) {
    const page = await fromUuid(button.dataset.pageUuid);
    const type = button.dataset.optionType;
    
    const charOptions = this.actor.system.charOptions;

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
    
    // Remove the UUID from the benefit's pages
    const str = 'system.charOptions.' + type;

    if (type === 'professions' || type === 'traditions') {
      const arr = charOptions[type].filter(v => { return v !== button.dataset.pageUuid; });

      if (page) await this.actor.update({ [str]: arr });
    } else if (type) {
      
      await this.actor.update({ [str]: null });
    }

    if (page) await this.actor.clearCharOptionBenefits(page.uuid);
    
    this.render();
  }

  /* -------------------------------------------- */

  static async #onJournalHelp(event, button) {
    const entry = await fromUuid('Compendium.weirdwizard.documentation.JournalEntry.R3pFihgoMAB2Uab5');
    entry.sheet.render(true);
  }

  /* -------------------------------------------- */

  static #onJournalInvalid(event, button) {
    const dataset = Object.assign({}, button.dataset);
    const type = dataset.charoptionType;
    
    // Update document
    this.actor.update({['system.charOptions.' + type]: ''});
    
  }

  /* -------------------------------------------- */
  /*  Item handling actions                       */
  /* -------------------------------------------- */

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  static async #onItemCreate(event, button) {
    const dataset = Object.assign({}, button.dataset);

    const type = dataset.type; // Get the type of item to create.

    const system = {
      subtype: dataset.subtype ?? '',
      tier: dataset.tier ?? '',
      grip: dataset.grip ?? 'Off',
      source: type === 'Trait or Talent' ? dataset.source : '', // If Character's Talent, set source,
      attribute: '',
      damage: '',
      against: ''
    };

    // If weapon, set default automated roll
    if (system.subtype == 'weapon') {
      system.attribute = 'str';
      system.against = 'def';
      system.damage = '1d6';
    }

    // Prepare the item object.
    const itemData = {
      name: i18n('WW.Item.New', { itemType: (system.subtype ? system.subtype.capitalize() : type.capitalize()) }),
      type: type,
      system: system
    };

    // Create the item
    const items = Array.from(await this.actor.items);
    items.push(itemData);
    const createdItem = await Item.create(itemData, { parent: this.actor });

    // Render the created item's template
    createdItem.sheet.render(true);

    return;
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  static #onItemEdit(event, button) {
    const item = this.actor.items.get(button.dataset.itemId);
    
    item.sheet.render(true);
  }

  _onItemEdit(item) {
    item.sheet.render(true);
  }

  /**
   * Handle delete of an Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  static #onItemRemove(event, button) {
    const item = this.actor.items.get(button.dataset.itemId);

    this._onItemRemove(item, button);
  }

  async _onItemRemove(item, button) {
    
    // Confirm Dialog
    const confirm = await WWDialog.confirm({
      window: {
        title: 'WW.Item.Remove.Dialog.Title',
        icon: 'fa-solid fa-trash'
      },
      content: `
        <div>${i18n('WW.Item.Remove.Dialog.Msg', {name: '<b>' + item.name + '</b>'})}</div>
        <div class="dialog-sure">${i18n('WW.Item.Remove.Dialog.Confirm', {name: item.name})}</div>
      `
    });

    if (!confirm) return;

    // Delete item
    //await $(button).slideUp(200, () => this.render(false));
    item.delete();
    
  }

  /* -------------------------------------------- */
  /*  Active Effect handling actions              */
  /* -------------------------------------------- */

  static #onEffectCreate(event, button) {
    const dataset = Object.assign({}, button.dataset);

    createActiveEffect(dataset, this.actor)
  }

  static #onEffectEdit(event, button) {
    const effect = this.actor.effects.get(button.dataset.effectId);

    editActiveEffect(effect, this.actor);
  }

  static #onEffectToggle(event, button) {
    const effect = this.actor.effects.get(button.dataset.effectId);

    effect.update({ disabled: effect.disabled ? false : true });
  }

  static #onEffectRemove(event, button) {
    const effect = this.actor.effects.get(button.dataset.effectId);

    deleteActiveEffect(effect, this.actor);
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
    
    formData.object['system.stats.damage.value'] = formData.object.damage;
    
    const submitData = this._prepareSubmitData(event, form, formData);
    await this._processSubmitData(event, form, submitData);
  }

  /* -------------------------------------------- */
  /*  Item button actions                         */
  /* -------------------------------------------- */
  
  /**
   * Handle clicked sheet buttons
   * @param {Event} event   The originating click event
   * @private
  */
  static #onItemLabelClick(event, button) {
    event.preventDefault();
    event.stopPropagation();

    const dataset = Object.assign({}, button.dataset);
    const item = this.actor.items.get(dataset.itemId);

    // Determine operation with modifier keys
    dataset.operation = 'untargeted-use';
    if (event.shiftKey) dataset.operation = 'targeted-use';
    if (event.ctrlKey) dataset.operation = 'item-scroll';
    if (event.altKey) dataset.operation = 'item-edit';
    
    // Evaluate action if no keys were clicked
    switch (dataset.operation) {
      case 'targeted-use': this._onItemUse(dataset); break;
      case 'untargeted-use': this._onItemUse(dataset); break;
      case 'item-scroll': this._onItemScroll(item); break;
      case 'item-edit': this._onItemEdit(item); break;
    }
    
  }

  /* -------------------------------------------- */

  _onItemUse(dataset, operation='untargeted-use') {
    
    // Define variables to be used
    const system = this.actor.system,
      item = this.actor.items.get(dataset.itemId),
      label = _secretLabel(item.name),
      content = _secretContent(item.system.description.value),
      instEffs = item.system.instant,
      effects = item.effects,
      origin = item.uuid ? item.uuid : this.actor.uuid;

    const attKey = CONFIG.WW.ATTRIBUTE_ROLLS[item.system.attribute] ? item.system.attribute : '';
    
    if (!attKey) { // If an attribute key is not defined, do not roll
      
      const obj = {
        origin: origin,
        label: label,
        content: content,
        attKey: attKey,
        operation: operation,
        dontRoll: true,
        instEffs: instEffs,
        actEffs: effects
      }

      // If targeted-use button was clicked
      if (operation === 'targeted-use') {
        // If item is a weapon, throw a warning if an against attribute was not selected
        if (item?.system?.subtype === 'weapon' && !item.system.against) ui.notifications.warn(i18n("WW.Roll.AgainstWrn"));

        // If the item uses a template, draw it
        else if (item.system.targeting == 'template') {
          this.drawTemplate(obj);
        }

        // If the item uses manual targets, prompt selection
        else if (item.system.targeting == 'manual') {
          this.selectTargets(obj);
        }
      } 

      // If untargeted-use was clicked
      else if (operation === 'untargeted-use') {

        function actEffs() {
          const effs = {
            onUse: [],
            onSuccess: [],
            onCritical: [],
            onFailure: []
          }
          
          item.effects?.forEach(effect => {
            const e = {...effect};
            e.uuid = effect.uuid;

            switch (e.system.trigger) {
              case 'onUse': {
                effs.onUse.push(e);
                effs.onSuccess.push(e);
                effs.onCritical.push(e);
                effs.onFailure.push(e);
              }; break;
              case 'onSuccess': effs.onSuccess.push(e); effs.onCritical.push(e); break;
              case 'onCritical': effs.onCritical.push(e); break;
              case 'onFailure': effs.onFailure.push(e); break;
            }
      
          })
          
          return effs;
        }
      
        function instEffs() {
          const effs = {
            onUse: [],
            onSuccess: [],
            onCritical: [],
            onFailure: []
          }
      
          // Add Weapon Damage
          const itemSystem = item.system;
          const weaponDamage = (itemSystem.subtype == 'weapon' && itemSystem.damage) ? itemSystem.damage : 0;
          
          if (weaponDamage) {
            const eff = {
              label: 'damage',
              originUuid: item.uuid,
              value: weaponDamage
            };
      
            effs.onSuccess.push(eff);
            effs.onCritical.push(eff);
          }
          
          // Add Instant Effects
          item.system?.instant?.forEach(e => {

            if (!e.trigger) e.trigger = 'onUse';
            
            switch (e.trigger) {
              case 'onUse': {
                effs.onUse.push(e);
                effs.onSuccess.push(e);
                effs.onCritical.push(e);
                effs.onFailure.push(e);
              }; break;
              case 'onSuccess': effs.onSuccess.push(e); effs.onCritical.push(e); break;
              case 'onCritical': effs.onCritical.push(e); break;
              case 'onFailure': effs.onFailure.push(e); break;
            }
      
          })
          
          return effs;
        }
        
        // Create message data to chat
        const messageData = {
          type: 'unrolled-use',
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
          flavor: label,
          content: content,
          sound: CONFIG.sounds.dice,
          'flags.weirdwizard': {
            icon: item.img,
            item: item.uuid,
            emptyContent: !content ?? true,
            instEffs: instEffs(),
            actEffs: actEffs()
          }
        }
        
        ChatMessage.create(messageData);
      }
      
    } else { // Attempt to use RollAttribute app

      const obj = {
        origin: origin,
        label: label,
        content: content,
        attKey: attKey,
        operation: operation
      }
  
      // Check for Automatic Failure
      if (system.autoFail[obj.attKey]) {
        
        const messageData = {
          type: 'd20-roll',
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
          flavor: label,
          content: content,
          sound: CONFIG.sounds.dice,
          'flags.weirdwizard': {
            item: item.uuid,
            rollHtml: '<div class="dice-outcome chat-failure">' + i18n('WW.Roll.AutoFail') + '!</div>',
            emptyContent: !content ?? true
          }
        };
  
        ChatMessage.create(messageData);
      } else { // Roll
        
        // If targeted-use button was clicked
        if (operation === 'targeted-use') {

          // If item is a weapon, throw a warning if an against attribute was not selected
          if (item?.system?.subtype === 'weapon' && !item.system.against) ui.notifications.warn(i18n("WW.Roll.AgainstWrn"));

          // If the item uses a template, draw it
          else if (item.system.targeting == 'template') {
            this.drawTemplate(obj);
          }

          // If the item uses manual targets, prompt selection
          else if (item.system.targeting == 'manual') {
            this.selectTargets(obj);
          }
        } 

        // If untargeted-use was clicked
        else if (operation === 'untargeted-use') new RollAttribute(obj).render(true);
        
      }
    }
    
  }

  // Item Scroll: Send item description to chat when clicked
  static #onItemScroll(event, button) {
    event.preventDefault();
    event.stopPropagation();

    const dataset = Object.assign({}, button.dataset);
    const item = this.actor.items.get(dataset.itemId);

    this._onItemScroll(item)
  }
  
  _onItemScroll(item) {
    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
      flavor: _secretLabel(item.name),
      content: item.system.description.value,
      'flags.weirdwizard': {
        icon: item.img,
        item: item.uuid
      }
    })
  }

  // Set uses pips to update the value when clicked
  static #onItemUpdateUses(event, button) {
    event.preventDefault();
    event.stopPropagation();
    
    const item = this.actor.items.get(button.dataset.itemId);
      
    if ($(event.target).hasClass('fa-regular')) { // If the pip is regular (unchecked)
      item.update({'system.uses.value': item.system.uses.value + 1}) // Add 1 to the current value.
    } else {
      item.system.uses.value >= 0 ? item.update({'system.uses.value': item.system.uses.value - 1}) : item.update({'system.uses.value': 0}) // Subtract 1 from current value.
    }
  }

  static #onItemToggleEffects(event, button) {
    event.preventDefault();
    event.stopPropagation();

    const dataset = Object.assign({}, button.dataset),
    item = this.actor.items.get(dataset.itemId);

    item.update({ "system.active": !item.system.active });
  }

  static #onItemToggleReloaded(event, button) {
    event.preventDefault();
    event.stopPropagation();

    const dataset = Object.assign({}, button.dataset),
    item = this.actor.items.get(dataset.itemId);
    item.update({ "system.reloaded": !item.system.reloaded });
  }

  // Collapses description - not used anymore
  /*static #onItemCollapse(button) {
    let li = $(button).parents('.item');
    
    if (!li.length) { // If parent does not have .item class, set li to current target.
      li = $(button);
    }

    const desc = li.find('.item-desc'),
      icon = li.find('.item-button[data-action=item-collapse]').find('i');
    
    // Flip states
    if (icon.hasClass('fa-square-chevron-down')) {
      $(button).attr('data-tooltip', 'WW.Item.HideDesc')
      icon.removeClass('fa-square-chevron-down').addClass('fa-square-chevron-up');
      desc.slideDown(500);
    } else {
      $(button).attr('data-tooltip', 'WW.Item.ShowDesc')
      icon.removeClass('fa-square-chevron-up').addClass('fa-square-chevron-down');
      desc.slideUp(500);
    }
    
  }*/

  // Collapses Container content
  static #onContainerCollapse(event, button) {
    event.preventDefault();
    event.stopPropagation();
    
    const dataset = Object.assign({}, button.dataset);

    let li = $(button).parents('.item');
    
    if (!li.length) { // If parent does not have .item class, set li to current target.
      li = $(button);
    }

    const content = li.parent().find(`[data-container-id=${dataset.itemId}]`);
    const collapseButton = li.parent().find(`.item-collapse[data-item-id=${dataset.itemId}]`)[0];
    
    // Fetch collapsed elements
    const collapsed = li.hasClass('collapsed');
    const icon = collapseButton.querySelector('i');

    // Toggle collapsed states
    icon.classList.toggle('fa-square-caret-up', collapsed);
    icon.classList.toggle('fa-square-caret-down', !collapsed);
    li[0].classList.toggle('collapsed');

    if (collapsed) {
      collapseButton.setAttribute('data-tooltip', 'WW.Container.Collapse');      
      content.slideDown(300);
    } else {
      collapseButton.setAttribute('data-tooltip', 'WW.Container.Expand');
      content.slideUp(300);
    }
    
  }

  /* -------------------------------------------- */
  /*  Miscellaneous actions                       */
  /* -------------------------------------------- */

  static #onToggleEditMode() {
    this.editMode = !this.editMode;
    
    this.render(true);
  }

  static async #onRest() {
    
    const confirm = await WWDialog.confirm({
      window: {
        title: 'WW.Rest.Label',
        icon: 'fa-solid fa-campground'
      },
      content: `
        <div>${i18n('WW.Rest.Msg')}</div>
        <div class="dialog-sure">${i18n('WW.Rest.Confirm')}</div>
      `
    });

    if (!confirm) return;

    // Calculate lost Health regained
    const health = this.actor.system.stats.health;
    let newCurrent = health.current + Math.floor(health.normal / 10);
    if (newCurrent > health.normal) newCurrent = health.normal;

    // Recover uses/tokens/castings for Talents and Spells
    this.actor.updateEmbeddedDocuments('Item', this.actor.items.filter(i => i.system.uses?.onRest === true).map(i => ({ _id: i.id, 'system.uses.value': 0 })));

    // Create message content
    const content = `
      <p style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this.actor })}</b> ${i18n('WW.Rest.Finished')}.</p>
      <p>${i18n('WW.InstantEffect.Apply.CurrentHealth')}: ${health.current} <i class="fa-solid fa-arrow-right"></i> ${newCurrent}</p>
    `;

    // Create and send message to chat
    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

    // Heal all Damage and regain lost Health
    this.actor.update({
      "system.stats.damage.value": 0,
      "system.stats.health.current": newCurrent
    });

  }

  static async #onSheetReset() {
    
    const confirm = await WWDialog.confirm({
      window: {
        title: 'WW.Reset.Label',
        icon: 'fa-solid fa-rotate-left'
      },
      title: i18n('WW.Reset.Label'),
      content: `
        <div>${i18n('WW.Reset.Msg')}</div>
        <p class="dialog-sure">${i18n('WW.Reset.Confirm')}</div>
      `
    });

    if (!confirm) return;

    // Reset Damage and current Health
    const health = this.actor.system.stats.health;
    
    this.actor.update({
      "system.stats.damage.value": 0,
      "system.stats.health.current": health.normal
    });

    // Recover uses/tokens/castings for Talents and Spells
    this.actor.updateEmbeddedDocuments('Item', this.actor.items.map(i => ({ _id: i.id, 'system.uses.value': 0 })));

  }

  static async #onDispositionToggle() {
    // Toggle disposition between friendly and hostile, updating all linked tokens.
    const dispo = this.actor?.token ? this.actor.token.disposition : this.actor.prototypeToken.disposition;
    const linkedTokens = this.actor.getActiveTokens();

    let newDispo = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
    if (dispo === CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
      newDispo = CONST.TOKEN_DISPOSITIONS.HOSTILE;
    }
    
    await this.actor.update({
      'prototypeToken.disposition': newDispo,
      'token.disposition': newDispo
    })

    for await (const t of linkedTokens) {
      await t.document.update({'disposition': newDispo});
    }

    this.render();
  }

  static #onFolderEdit() {
    this.actor.folder.sheet.render(true);
  }

  /* -------------------------------------------- */
  /*  Utility methods                             */
  /* -------------------------------------------- */

  /**
   * Draw template from an item
   * @param {Object} obj
   */
  async drawTemplate(obj) {
    const initialLayer = canvas.activeLayer;

    new TargetingHUD(obj, initialLayer, 'template').render(true);
  }

  /**
   * Select targets for an item roll
   * @param {Object} obj
   */
  async selectTargets(obj) {
    // Switch to the controls layer, activate target tool then switch to tokens layer
    const initialLayer = canvas.activeLayer;
    canvas.controls.activate({tool: 'target'});
    canvas.tokens.activate();

    // Hide the sheet that originated the preview
    this.minimize();

    // Activate TargetingHUD app
    new TargetingHUD(obj, initialLayer, 'manual').render(true);
  }
  
  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  // Prepare applied afflictions list
  get appliedAfflictions() {
    const arr = [...this.actor.effects].map(x => Array.from(x.statuses)[0]).filter(x => x);
    
    const appliedAffs = CONFIG.statusEffects.filter(s => arr.includes(s.id));
    
    return appliedAffs;
  }

  get targets() {
    let targets = [];
    
    if (game.user.targets.size) { // Get targets if they exist

      game.user.targets.forEach(t => {
        
        targets.push({
          id: t.id,
          name: game.weirdwizard.utils.getAlias({ token: t.document }),
          attributes: t.document.actor.system.attributes,
          defense: t.document.actor.system.stats.defense.total,
          boonsAgainst: t.document.actor.system.boons.against
        })
      });

    } else { // Get self as a target if none is selected

      targets.push({
        id: this.token?.id,
        name: game.weirdwizard.utils.getAlias({ token: this.token }),
        attributes: this.actor.system.attributes,
        defense: this.actor.system.stats.defense.total,
        boonsAgainst: this.actor.system.boons.against
      })

    }

    return targets
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
    const li = event.currentTarget;
    if ( "link" in event.target.dataset ) return;
    let dragData;

    // Owned Items
    if ( li.dataset.itemId ) {
      const item = this.actor.items.get(li.dataset.itemId);
      dragData = item.toDragData();
    }

    // Active Effect
    if ( li.dataset.effectId ) {
      const effect = this.actor.effects.get(li.dataset.effectId);
      //const effect = await this.actor.appliedEffects.find(e => e.id === li.dataset.effectId);
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
  _onDragOver(event) {} // Delete in v13; core behavior

  /* -------------------------------------------- */

  /**
   * @override
   * An event that occurs when data is dropped into a drop target.
   * @param {DragEvent} event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDrop(event) { // Delete in v13; core behavior
    if ( !this.isEditable ) return;
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
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

  /**
   * Handle a dropped document on the ActorSheet
   * @param {DragEvent} event         The initiating drop event
   * @param {Document} document       The resolved Document class
   * @returns {Promise<void>}
   * @protected
   */
  async _onDropDocument(event, document) {
    switch ( document.documentName ) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, /** @type ActiveEffect */ document);
      case "Actor":
        return this._onDropActor(event, /** @type Actor */ document);
      case "Item":
        return this._onDropItem(event, /** @type Item */ document);
      case "Folder":
        return this._onDropFolder(event, /** @type Folder */ document);
      case "JournalEntry":
        return ui.notifications.warn(i18n("WW.CharOptions.JournalEntryWarning"));
      case "JournalEntryPage":
        return this._onDropJournalEntryPage(event, /** @type JournalEntryPage */ document);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle a dropped Active Effect on the Actor Sheet.
   * The default implementation creates an Active Effect embedded document on the Actor.
   * @param {DragEvent} event       The initiating drop event
   * @param {ActiveEffect} effect   The dropped ActiveEffect document
   * @returns {Promise<void>}
   * @protected
   */
  async _onDropActiveEffect(event, effect) { // Delete in v13; core behavior
    if ( !this.actor.isOwner ) return;
    if ( !effect || (effect.target === this.actor) ) return;
    
    const effectData = effect.toObject();
    
    // Get target effect details
    const target = event.target.closest('.item');
    const targetId = target ? target.dataset.effectId : '';
    //const targetData = (targetId) ? this.actor.effects.get(targetId).toObject() : {};
    
    // If within the same Actor
    if ( effect.parent?.uuid?.includes(this.actor.uuid) ) {
      // Handle sorting
      return this._onSortEffect(event, effectData);
    }

    // Create owned effect
    const keepId = !this.actor.effects.has(effect.id);
    await ActiveEffect.create(effect.toObject(), {parent: this.actor, keepId});
  }

  /* -------------------------------------------- */

  /**
   * Handle a dropped Actor on the Actor Sheet.
   * @param {DragEvent} event     The initiating drop event
   * @param {Actor} actor         The dropped Actor document
   * @returns {Promise<void>}
   * @protected
   */
  async _onDropActor(event, actor) {}

  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {Item} item                  The dropped Item document
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   * @override
   */
  async _onDropItem(event, item) {
    if ( !this.actor.isOwner ) return;
    
    const itemData = item.toObject();
    
    // Get target item details
    const target = event.target.closest('.item');
    const targetId = target ? target.dataset.itemId : '';
    const targetData = (targetId) ? this.actor.items.get(targetId).toObject() : {};
    
    // If within the same Actor
    if ( this.actor.uuid === item.parent?.uuid ) {

      if ((targetData.system?.subtype === 'container') && (item.system.subtype !== 'container')) { // Dropped on a container, but not a container
        return item.update({'system.heldBy': targetData._id});
      } else if (item.system.heldBy && (item.system.heldBy !== targetData.system.heldBy)) { // Item is held by a container dropped elsewhere
        return item.update({'system.heldBy': ''});
      } else {
        // Fix containers
        if (item.system.subtype === 'container' && item.system.heldBy) item.update({'system.heldBy': null});

        // Handle sorting
        return this._onSortItem(event, itemData);
      }

    }
    
    // Create the owned item
    return this._onDropItemCreate(itemData, event);
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDropItemCreate(itemData, event) {
    
    const isAllowed = await this.checkDroppedItem(itemData);

    if (isAllowed) {
      const keepId = !this.actor.items.has(itemData.id);
      return await Item.create(itemData, {parent: this.actor, keepId});
    }
    
    console.warn('Wrong item type dragged', this.actor, itemData);
  }

  /**
   * Handle dropping of a journal entry page reference or journal entry page data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {JournalPageEntry} page                  The dropped Journal Entry Page document
   * @returns {Promise<JournalEntryPage[]|boolean>}  The created or updated JournalEntryPage instances, or false if the drop was not permitted.
   * @protected
   * @override
   */
  async _onDropJournalEntryPage(event, page) {
    const actor = this.actor;
    
    const allowedTypes = ['ancestry', 'path', 'profession', 'tradition'];

    // Return if not from an apropriate type
    if (!allowedTypes.includes(page.type)) return;

    // Record Character Option's UUID in the correct field
    if (page.type === 'profession' || page.type === 'tradition') {
      const str = page.type + 's';

      const arr = [...new Set([...actor.system.charOptions[str], await page.uuid])];
        
      await actor.update({ ['system.charOptions.' + str]: arr });

      await actor.updateCharOptionBenefits(page.uuid, 'dragDrop');
    
    } else {
      let str = 'system.charOptions.';
      
      if (page.type === 'path') str += page.system.tier;
      else str += page.type;
      
      // Store UUID reference and update benefits
      const oldUuid = foundry.utils.getProperty(actor, str);
      const oldPage = await fromUuid(oldUuid);
      
      const oldName = oldPage ? oldPage.name : 'Unknown';

      if (oldUuid) {
        const confirm = await WWDialog.confirm({
          window: {
            title: 'WW.CharOption.Reference.ReplaceDialog.Title',
            icon: 'fa-solid fa-right-left'
          },
          content: `<div>${i18n('WW.CharOption.Reference.ReplaceDialog.Msg', { old: oldName, new: page.name, type: page.type })}</div>`
        });

        if (!confirm) return;
        
        if (oldPage) await actor.clearCharOptionBenefits(oldPage.uuid);
        await actor.update({ [str]: page.uuid });
        await actor.updateCharOptionBenefits(page.uuid, 'dragDrop');

      } else {
        await actor.update({ [str]: page.uuid });
        await actor.updateCharOptionBenefits(page.uuid, 'dragDrop');
      }
      
    }

    this.render(); // Force re-rendering because it's not being triggered
  }

  /* -------------------------------------------- */
  
  /** @override */
  async checkDroppedItem(itemData) {
    const type = itemData.type;
    if (['specialaction', 'endoftheround'].includes(type)) return false;

    if (type === 'ancestry') {
      const currentAncestriesIds = this.actor.items.filter(i => i.type === 'ancestry').map(i => i._id)
      if (currentAncestriesIds?.length > 0) await this.actor.deleteEmbeddedDocuments('Item', currentAncestriesIds)
      return true
    } else if (type === 'path' && this.actor.system.paths?.length >= 3) return false
    
    return true;
  }

  /* -------------------------------------------- */

  /**
   * Handle a dropped Folder on the Actor Sheet.
   * @param {DragEvent} event     The initiating drop event
   * @param {object} data         Extracted drag transfer data
   * @returns {Promise<void>}
   * @protected
   */
  async _onDropFolder(event, data) {}

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

  /**
   * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings.
   * @param {DragEvent} event     The initiating drop event
   * @param {Item} item           The dropped Item document
   * @protected
   */
  _onSortItem(event, item) {
    const items = this.actor.items;
    const source = items.get(item._id); // is `id` in v13

    // Confirm the drop target
    const dropTarget = event.target.closest("[data-item-id]");
    if ( !dropTarget ) return;
    const target = items.get(dropTarget.dataset.itemId);
    if ( source.id === target.id ) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for ( const element of dropTarget.parentElement.children ) {
      const siblingId = element.dataset.itemId;
      if ( siblingId && (siblingId !== source.id) ) siblings.push(items.get(element.dataset.itemId));
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

  /**
   * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings.
   * @param {DragEvent} event     The initiating drop event
   * @param {Item} item           The dropped Item document
   * @protected
   */
  _onSortEffect(event, effect) {
    const effects = this.actor.appliedEffects;
    const source = effects.find(e => e._id === effect._id); // is `id` in v13

    // Confirm the drop target
    const dropTarget = event.target.closest("[data-effect-id]");
    if ( !dropTarget ) return;
    const target = effects.find(e => e._id === dropTarget.dataset.effectId);
    if ( source.id === target.id ) return;
    
    if (source.parent !== target.parent) return;

    // Identify sibling effects based on adjacent HTML elements
    const siblings = [];
    for ( const element of dropTarget.parentElement.children ) {
      const siblingId = element.dataset.effectId;
      if ( siblingId && (siblingId !== source.id) ) siblings.push(effects.find(e => e._id === element.dataset.effectId));
    }

    // Perform the sort only if 
    const sortUpdates = SortingHelpers.performIntegerSort(source, {target, siblings});
    
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });
    
    // Perform the update
    return target.parent.updateEmbeddedDocuments("ActiveEffect", updateData);
  }
  
}

/* -------------------------------------------- */
/*  Misc Functions                              */
/* -------------------------------------------- */

// Make secret message content
function _secretContent(content) {
  if (content) return '<span class="owner-only chat-description">' + content + '</span>';
  else return ''
}

// Make secret message label
function _secretLabel(label) {
  return '<span class="owner-only">' + label + '</span><span class="non-owner-only">? ? ?</span>'
}

