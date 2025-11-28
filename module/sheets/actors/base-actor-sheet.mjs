import {
  capitalize,
  defaultListEntryKey,
  defaultListEntryName,
  i18n,
  plusify,
  sum,
  sysPath
} from '../../helpers/utils.mjs';
import WWDialog from '../../apps/dialog.mjs';
import { EntrySettingsDisplay } from '../../apps/entry-settings-display.mjs';
import WWSheetMixin from '../ww-sheet.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ActorSheetV2 = foundry.applications?.sheets?.ActorSheetV2 ?? (class {});

/**
 * Extend the basic ActorSheetV2 with modifications tailored for SotWW
 * @extends {ActorSheetV2}
 */
export default class WWActorSheet extends WWSheetMixin(ActorSheetV2) {

  constructor(options = {}) {
    super(options); // Required for the constructor to work 
  }
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'actor'],
    tag: 'form',
    window: {
      resizable: true,
      contentClasses: [],
      controls: []
    },
    actions: {
      editImage: this.#onEditImage, // delete in V13; core functionality

      entryCreate: this.#onEntryCreate,
      entryEdit: this.#onEntryEdit,
      entryRemove: this.#onEntryRemove,
      entrySettings: this.#onEntrySettingsDisplay,

      itemCreate: this.#onItemCreate,
      itemEdit: this.#onItemEdit,
      itemRemove: this.#onItemRemove
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 860,
      height: 500
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
    const actorData = await this.actor;
    
    context.actor = actorData; // Use a safe clone of the actor data for further operations.
    context.system = actorData.system; // Add the actor's data to context.system for easier access, as well as flags.
    context.flags = actorData.flags;
    context.dtypes = ['String', 'Number', 'Boolean'];
    context.itemSources = CONFIG.WW.TALENT_SOURCES;
    context.tiers = CONFIG.WW.TIERS;

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

    // Add roll data for Prose Mirror editors
    context.rollData = actorData.getRollData();
    
    return context;
  }

  /* -------------------------------------------- */

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
      // Assign attributeLabel for template use
      if (context.system.attributes) {
        if (i.system.attribute == 'luck') {
          i.system.attributeLabel = `${i18n('WW.Attributes.Luck')} (+0)`;
        } else if (i.system.attribute) {
          const attribute = context.system.attributes[i.system.attribute];
          const name = i18n(CONFIG.WW.ATTRIBUTES[i.system.attribute]);
          i.system.attributeLabel = `${name} (${plusify(attribute.mod)})`
        }
      }
      
      // Check if item has passive effects
      i.hasPassiveEffects = i.effects.some((ef => ef.system.trigger === 'passive'));

      // Prepare html fields and labels for the tooltip and chat messages
      const isOwner = this.actor.isOwner;
      const TextEditor = foundry.applications.ux.TextEditor.implementation;
      i.system.descriptionEnriched = await TextEditor.enrichHTML(i.system.description, { secrets: isOwner });
      if (i.system.attackRider) i.system.attackRiderEnriched = await TextEditor.enrichHTML(i.system.attackRider.value, { secrets: isOwner });
      i.subtypeLabel = CONFIG.WW.EQUIPMENT_SUBTYPES[i.system.subtype];

      // Prepare tooltip context
      const tooltipContext = {
        label: i.name,
        system: i.system,
        img: i.img,
        type: i.type,
        inSheet: true,

        subtitle: i.type,
        text: i.system.descriptionEnriched ?? null,
        attackRider: i.system.attackRiderEnriched ?? null
      }

      // Prepare tooltip subtitle
      if (i.type === 'spell') {
        tooltipContext.subtitle += ` • ${i18n(CONFIG.WW.TIERS[i.system.tier])}`
        if (i.system.tradition) tooltipContext.subtitle += ` • ${i.system.tradition}`;

      } else if (i.type === 'equipment') {
        tooltipContext.subtitle = i18n(CONFIG.WW.EQUIPMENT_SUBTYPES[i.system.subtype]);

        if (i.system.subtype === 'weapon') tooltipContext.subtitle += ` • ${i.system.traits.range ? i18n("WW.Weapon.Ranged") : i18n("WW.Weapon.Melee")}`;

      } else if (i.type === 'talent') {
        tooltipContext.subtitle = i18n(CONFIG.WW.TALENT_SUBTYPES[i.system.subtype]);
        tooltipContext.subtitle += ` • ${i18n(CONFIG.WW.TALENT_SOURCES[i.system.source])}`;
      }

      i.tooltip = await foundry.applications.handlebars.renderTemplate(sysPath(`templates/apps/tooltips/item.hbs`), tooltipContext);

      // Append to equipment.
      if (i.type === 'equipment') {
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

          // Prepare name and grip label
          if (context.actor.type == 'character') {
            i.system.gripLabel = CONFIG.WW.WEAPON_GRIPS_SHORT[i.system.grip] ? i18n(CONFIG.WW.WEAPON_GRIPS_SHORT[i.system.grip]) : i.system.grip;
            
            i.label = `${i.name} (${i.system.gripLabel})${(i.system.traitsList ? ' ● ' + i.system.traitsList : '')}`;
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

            // If not an NPC or if item has a Permanent effect, also append to Equipment
            if (this.actor.type !== 'npc' || (this.actor.type === 'npc' && i.effects.some(e => e.changes.some(c => c.key === "defense.bonus")))) equipment.push(i);

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
      else if (i.type === 'talent') {

        if (context.actor.type == 'npc') {
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
      else if (i.type === 'spell') spells.push(i);

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
      if (context.actor.type === 'character') {
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
  /*  List entry handling actions                 */
  /* -------------------------------------------- */

  /**
   * Handle adding an array entry
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  static async #onEntryCreate(event, button) {
    const dataset = Object.assign({}, button.dataset);
    
    // Update entry
    await this._updateEntry(dataset);
  }

  /* -------------------------------------------- */

  /**
   * Handle editing a list entry
   * @param {Event} event          The originating click event
   * @param {HTMLElement} button   The button element originating the click event
   * @private
  */
  static async #onEntryEdit(event, button) {
    const dataset = Object.assign({}, button.dataset);

    // Update entry
    await this._updateEntry(dataset, dataset.entryKey);
  }

  /* -------------------------------------------- */

  async _updateEntry(dataset, entryKey) {
    const path = 'system.listEntries.' + dataset.listKey;
    const baseObj = {... foundry.utils.getProperty(this.actor.token?.baseActor, path)};
    const obj = {... foundry.utils.getProperty(this.actor, path)};

    // Get or set entry key and data
    let entryData = null;

    if (entryKey) {
      entryData = obj[entryKey];
    } else {
      entryKey = defaultListEntryKey(obj, dataset.listKey);
      const entryName = defaultListEntryName(obj, dataset.listKey);
      entryData = { name: entryName };
    }

    console.log(await entryData)

    // Prepare context
    const context = {
      entry: await entryData,
      key: entryKey,
      showKey: true,
      grantedBy: await fromUuid(entryData.grantedBy) ?
        await foundry.applications.ux.TextEditor.implementation.enrichHTML(`@UUID[${entryData.grantedBy}]`, { secrets: this.actor.isOwner }) : null
    };

    console.log(await context)

    // Show a dialog 
    const dialogInput = await WWDialog.input({
      window: {
        icon: "fa-solid fa-edit",
        title: 'WW.Settings.Entry.Edit',
      },
      content: await foundry.applications.handlebars.renderTemplate('systems/weirdwizard/templates/configs/list-entry-dialog.hbs', context),
      ok: {
        label: 'WW.System.Dialog.Save',
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

    // Update key and value with dialogInput
    obj[dialogInput.key] = dialogInput;

    delete await obj[dialogInput.key].key;

    // Delete old entry if key changed
    console.log(await dialogInput.key)
    console.log(await entryKey)
    if (dialogInput.key !== entryKey) {
      // If the key exists in the Base Actor, null it
      if (baseObj?.hasOwnProperty(entryKey) && entryKey !== dialogInput.key) obj[entryKey] = null;
      // Delete key otherwise
      else obj['-=' + entryKey] = null;
    }
    
    await this.actor.update({ [path]: obj });
  }

  /* -------------------------------------------- */

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

  /* -------------------------------------------- */

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
      source: type === 'talent' ? dataset.source : '', // If Talent, set source
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

    // Prepare the item data
    let defaultName = `TYPES.Item.${type}`;
    if (system.subtype && type === 'equipment') defaultName = CONFIG.WW.EQUIPMENT_SUBTYPES[system.subtype];
    if (system.subtype && type === 'talent') defaultName = CONFIG.WW.TALENT_SUBTYPES[system.subtype];

    const itemData = {
      name: i18n(defaultName),
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

  /* -------------------------------------------- */

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

  /* -------------------------------------------- */

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
  
}