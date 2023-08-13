import { defenseDetails } from './apps/defense-details.mjs'
import { healthDetails } from './apps/health-details.mjs'
import { rollPrompt } from './apps/roll-prompt.mjs'
import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
*/

export class WeirdWizardActorSheet extends ActorSheet {
  
  /** @override */
  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ["weirdwizard", "sheet", "actor"],
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/weirdwizard/templates/actors";
    
    let permission = this.document.getUserLevel(game.user);
    if ((permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED) | (permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) return `${path}/actor-${this.actor.type}-limited.hbs`;
    if (permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) return `${path}/actor-${this.actor.type}-sheet.hbs`;
    
    // Return a single sheet for all item types.
    // return `${path}/actor-sheet.html`;
    // Alternatively, you could use the following return statement to do a
    // unique actor sheet by type, like `actor-Character-sheet.hbs`
  }
  
  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor;

    // Add the actor's data to context.system for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    context.dtypes = ["String", "Number", "Boolean"];

    for (let attr of Object.values(context.system.attributes)) {
      attr.isCheckbox = attr.dtype === "Boolean";
    }

    // Localize attribute names
    /*for (let [key, attr] of Object.entries(context.system.attributes)){
        attr.label = game.i18n.localize(WW.attributes[key])
    }*/
    // Handle attribute scores.
    for (let [k, v] of Object.entries(context.system.attributes)) {
      v.label = game.i18n.localize(CONFIG.WW.attributes[k]) ?? k;
    }

    // Prepare character data and items.
    if (actorData.type == 'Character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);

      // Prepare enriched variables for editor.
      context.system.details.information.enriched = await TextEditor.enrichHTML(context.system.details.information.value, { async: true })
      context.system.details.bg_ancestry.enriched = await TextEditor.enrichHTML(context.system.details.bg_ancestry.value, { async: true })
      context.system.details.deeds.enriched = await TextEditor.enrichHTML(context.system.details.deeds.value, { async: true })
    } else {
      context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true })
    }

    // Prepare NPC data and items.
    if (actorData.type == 'NPC') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
       * Organize and classify Items for Character sheets.
       *
       * @param {Object} actorData The actor to prepare.
       *
       * @return {undefined}
  */

  _prepareItems(context) {
    // Initialize containers.
    const equipment = [];
    const talents = [];
    const auras = [];
    const actions = [];
    const reactions = [];
    const end = [];
    const spells = [];
    const weapons = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      //let item = i;
      i.img = i.img || DEFAULT_TOKEN;

      // Append to equipment.
      if (i.type === 'Equipment') {
        equipment.push(i);

        // If an weapon or NPC sheet, also append to weapons.
        if ((i.system.subtype == 'weapon') || (context.actor.type == 'NPC')) {
          weapons.push(i);
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
            case 'aura': {
              auras.push(i);
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
          talents.push(i);
        }

      }

      // Append to spells.
      else if (i.type === 'Spell') {
        /*if (i.tier != undefined) {
            spells[i.tier].push(i);
        }*/
        spells.push(i);
      }
    }

    // Calculate total Equipment weight.
    function calcWeight(item, id) {
      item.system.weight = item.system.quantity * item.system.weightUnit;
    }

    equipment.forEach(calcWeight)

    context.totalWeight = CONFIG.Global.sum(equipment.map(i => i.system.weight))

    // Prepare uses display for talents and spells
    function updateUses(item, id) {
      let spent = item.system.uses.value ? item.system.uses.value : 0;
      let max = item.system.uses.max;
      let arr = [];

      let i = 0; // fill the Buttons with available traditions

      for (i = 1; i <= max; i++) { // statement 1 = beginning of the block, statement 2 = condition, statement 3 = executed at the end of each loop
        if (i <= spent) { arr.push('fas') } else { arr.push('far') }; // fas (solid) = unspent, far (regular) = spent
      };

      item.uses = arr;
    }

    talents.forEach(updateUses)
    actions.forEach(updateUses)
    equipment.forEach(updateUses)
    spells.forEach(updateUses)

    // Assign and return
    context.equipment = equipment;
    context.weapons = weapons;
    context.talents = talents;
    context.spells = spells;
    context.auras = auras;
    context.actions = actions;
    context.reactions = reactions;
    context.end = end;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} system The actor to prepare.
   *
   * @return {undefined}
  */

  _prepareCharacterData(context) {
    // Handle details data.
    for (let [k, v] of Object.entries(context.system.details)) {
      v.label = game.i18n.localize(CONFIG.WW.details[k]) ?? k;
      v.datapath = `system.details.${k}.value`
    }

    // Create Details arrays and add text editor support.
    const details = context.actor.system.details
    context.profile = [details.features, details.personality, details.belief].map(o => ({ ...o, enriched: TextEditor.enrichHTML(o.value, { async: false }) }))

    ///////// HEALTH ///////////

    // Calculate and update Path Levels contribution to Health
    let health = context.actor.system.stats.health // Get actor's stats
    let level = context.actor.system.stats.level.value

    function count(levels) { // Count how many of provided levels the Character has
      let newValue = 0;

      levels.forEach(function count(v) {
        if (level >= v) { newValue += 1 }
      })

      return newValue
    }

    // Novice Path calculation
    const noviceLv = count([2, 5, 8])
    const noviceBonus = noviceLv * health.novice;

    // Expert Path calculation
    const expertLv = count([3, 4, 6, 9]);
    const expertBonus = expertLv * health.expert;

    // Master Path calculation
    const masterLv = count([7, 8, 10])
    const masterBonus = masterLv * health.master;

    // Total Health calculation
    const totalHealth = health.starting + noviceBonus + expertBonus + masterBonus + health.bonus - health.lost;

    context.system.stats.health.total = totalHealth

    ///////// DEFENSE ///////////

    // Calculate total Defense
    const defense = context.actor.system.stats.defense
    const equipped = CONFIG.WW.armor[defense.armor]
    let armorTotal = defense.unarmored;

    // Select the higher Defense value from Armor flat Defense or Armor Bonus and assign to armorTotal.
    if (equipped.def) {
      if ((defense.unarmored + equipped.bonus) > equipped.def) {
        armorTotal = defense.unarmored + equipped.bonus;
      } else {
        armorTotal = equipped.def;
      };
    };

    // Add Defense bonuses to armorTotal to get defense total.
    const defBonuses = CONFIG.Global.sum(defense.bonuses.map(i => i.bonus));

    if (defBonuses > 0) {
      context.system.stats.defense.total = armorTotal + defBonuses;
    } else {
      context.system.stats.defense.total = armorTotal;
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    /////////// ATTRIBUTES & STATS /////////////

    // Rollable attributes.
    html.find('.rollable').click(ev => { //this._onRoll.bind(this)
      // Define variables to be used
      let system = this.object.system;
      let label = '';
      let mod = 0;
      let name = '';
      let fixed = 0;
      let damage = '';
      let healing = '';
      
      if ($(ev.currentTarget).hasClass('item-roll')) { // If it is a roll from an item.
        let li = $(ev.currentTarget).parents(".item");
        if (!li.length) { // If parent does not have .item class, set li to current target.
          li = $(ev.currentTarget);
        }

        const item = this.actor.items.get(li.data("itemId"));
        const attribute = item.system.attribute;
        label = item.name;
        fixed = item.system.boons;
        damage = item.system.damage;
        healing = item.system.healing;
        
        if (this.actor.system.attributes[attribute]) {
          mod = this.actor.system.attributes[attribute].mod;
          name = this.actor.system.attributes[attribute].name;
        }
      }
      
      //console.log(ev.target.getAttribute('data-label'))
      console.log(ev.target)
      // If the clicked element has a data-label, use it to determine the mod and label
      switch (ev.target.getAttribute('data-label')) {
        case 'Strength': {
          mod = system.attributes.str.mod;
          label = system.attributes.str.name;
          name = system.attributes.str.name;
          break;
        }
        case 'Agility': {
          mod = system.attributes.agi.mod;
          label = system.attributes.agi.name;
          name = system.attributes.agi.name;
          break;
        }
        case 'Intellect': {
          mod = system.attributes.int.mod;
          label = system.attributes.int.name;
          name = system.attributes.int.name;
          break;
        }
        case 'Will': {
          mod = system.attributes.wil.mod;
          label = system.attributes.wil.name;
          name = system.attributes.wil.name;
          break;
        }
        case 'Luck': {
          label = game.i18n.format("WW.Luck");
          console.log('test')
          break;
        }
      }

      let obj = {
        actor: this.actor,
        target: ev,
        label: label,
        mod: mod,
        name: name,
        fixed: fixed,
        damage: damage,
        healing: healing
      }

      new rollPrompt(obj).render(true)
    });

    // Edit Health button
    html.find('.health-edit').click(ev => {
      new healthDetails(this.actor).render(true)
    });

    // Edit Defense button
    html.find('.defense-edit').click(ev => {
      new defenseDetails(this.actor).render(true)
    }); 

    

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    //////////////// ITEMS ///////////////////

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });
    
    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {

      let li = $(ev.currentTarget).parents(".item");
      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      const item = this.actor.items.get(li.data("itemId"));
      
      item.sheet.render(true);
    });

    // Set uses pips to update the value when clicked
    html.find('.item-pip').click(ev => {
      let li = $(ev.currentTarget).parents(".item");

      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      const item = this.actor.items.get(li.data("itemId"));
      
      if ($(ev.target).hasClass('far')) { // If the pip is regular (unchecked)
        item.update({'system.uses.value': item.system.uses.value + 1}) // Add 1 to the current value.
      } else {
        item.system.uses.value >= 0 ? item.update({'system.uses.value': item.system.uses.value - 1}) : item.update({'system.uses.value': 0}) // Subtract 1 from current value.
      }
    });

    

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Afflictions checkboxes
    html.find('[data-tab="afflictions"] input').click(async ev => {
      const input = ev.currentTarget;
      const checked = input.checked;
      const afflictionId = $(ev.currentTarget).data('name');

      if (checked) {
        const affliction = CONFIG.statusEffects.find(a => a.id === afflictionId);
        if (!affliction) return false
        affliction['statuses'] = [affliction.id];
        await ActiveEffect.create(affliction, {parent: this.actor});

      } else {
        const affliction = this.actor.effects.find(e => e?.statuses?.has(afflictionId));
        if (!affliction) return false
        await affliction.delete();
      }
      return true
    });
  }
  /* -------------------------------------------- */

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
  */

  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle _onRoll events that has a defined rollType.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {       // Handle item rolls.
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula
    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.system);
      console.log(dataset)
      let label = dataset.label ? `Rolling ${dataset.label}` : '';

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode')
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
  */

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type; // Get the type of item to create.
    const name = game.i18n.format("WW.NewItem", { itemType: type.capitalize() }) // Initialize a default name.

    let subtype = '';
    let source = '';
    let attribute = '';
    
    // If Talent or Equipment, set subtype
    if ((type == 'Trait or Talent') || (type == 'Equipment')) subtype = event.currentTarget.dataset.subtype;

    // If Character's Talent, set source
    if ((this.actor.type) && (type == 'Trait or Talent')) source = event.currentTarget.dataset.source;

    if (subtype == 'weapon') attribute = 'str';

    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: { subtype, source, attribute }
    };

    // Create the item
    const [createdItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);

    // Render the created item's template
    createdItem.sheet.render(true);

    return 
  }

}