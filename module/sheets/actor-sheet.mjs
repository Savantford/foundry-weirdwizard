import { i18n, plusify, sum } from '../helpers/utils.mjs'
import { healthDetails } from '../apps/health-details.mjs'
import { rollAttribute } from '../apps/roll-attribute.mjs'
import { rollDamage } from '../apps/roll-damage.mjs'
import { onManageActiveEffect, prepareActiveEffectCategories } from '../active-effects/effects.mjs';
import { WWAfflictions } from '../active-effects/afflictions.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
*/

export class WeirdWizardActorSheet extends ActorSheet {
  
  /** @override */
  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'actor'],
      width: 600,
      height: 600,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'features' }]
    });
  }

  /** @override */
  get template() {
    const path = 'systems/weirdwizard/templates/actors';
    
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
    context.dtypes = ['String', 'Number', 'Boolean'];

    for (let attr of Object.values(context.system.attributes)) {
      attr.isCheckbox = attr.dtype === 'Boolean';
    }

    // Localize attribute names
    for (let [k, v] of Object.entries(context.system.attributes)) {
      v.label = i18n(CONFIG.WW.attributes[k] ?? k);
    }

    // Prepare common data
    context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true })
    context.numbersObj = CONFIG.WW.dropdownNumbers;
    context.incapacitated = (context.system.stats.damage.value >= context.system.stats.health.total) ? true : false;
    context.injured = (context.system.stats.damage.value >= Math.floor(context.system.stats.health.total / 2)) ? true : false;

    // Prepare hasEffect for use in templates
    context.hasEffect = {};

    CONFIG.statusEffects.forEach(function (e) {
      context.hasEffect[e.id] = actorData.statuses.has(e.id);
    })

    // Prepare character data and items.
    if (actorData.type == 'Character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);  
    }

    // Prepare NPC data and items.
    if (actorData.type == 'NPC') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    // Prepare effect change key-labels
    context.effectChangeKeys = CONFIG.WW.effectChangeKeys;

    // Prepare enriched variables for editor
    for (let i of context.items) {
      i.system.description.enriched = await TextEditor.enrichHTML(i.system.description.value, { async: true })
    }

    for (let i of context.items) {
      if (i.system.attackRider) i.system.attackRider.enriched = await TextEditor.enrichHTML(i.system.attackRider?.value, { async: true })
    }

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
    const weapons = [];
    const talents = [];
    const auras = [];
    const actions = [];
    const reactions = [];
    const end = [];
    const fury = [];
    const spells = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {

      //let item = i;
      i.img = i.img || DEFAULT_TOKEN;
      
      // Assign attributeLabel for template use
      if (i.system.attribute == 'luck') {
        i.system.attributeLabel = i18n('WW.Luck') + ' (+0)';
      } else if (i.system.attribute) {
        const attribute = context.system.attributes[i.system.attribute];
        i.system.attributeLabel = attribute.name + ' (' + plusify(attribute.mod) + ')'
      }
      
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
            case 'fury': {
              fury.push(i);
              break;
            }
          }
        } else {
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

    context.totalWeight = sum(equipment.map(i => i.system.weight))

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
    fury.forEach(updateUses)
    equipment.forEach(updateUses)
    spells.forEach(updateUses)

    // Assign and return
    context.equipment = equipment;
    context.weapons = weapons;
    context.talents = talents;
    context.auras = auras;
    context.actions = actions;
    context.reactions = reactions;
    context.end = end;
    context.fury = fury;
    context.spells = spells;

  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} system The actor to prepare.
   *
   * @return {undefined}
  */

  async _prepareCharacterData(context) {

    // Prepare enriched variables for editor.
    context.system.details.features.enriched = await TextEditor.enrichHTML(context.system.details.features.value, { async: true })
    context.system.details.personality.enriched = await TextEditor.enrichHTML(context.system.details.personality.value, { async: true })
    context.system.details.belief.enriched = await TextEditor.enrichHTML(context.system.details.belief.value, { async: true })
    context.system.details.information.enriched = await TextEditor.enrichHTML(context.system.details.information.value, { async: true })
    context.system.details.bg_ancestry.enriched = await TextEditor.enrichHTML(context.system.details.bg_ancestry.value, { async: true })
    context.system.details.deeds.enriched = await TextEditor.enrichHTML(context.system.details.deeds.value, { async: true })
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Edit Health button
    html.find('.health-edit').click(ev => {
      new healthDetails(this.actor).render(true)
    });

    /////////// ITEMS: ROLL BUTTONS /////////////

    // Rollable attributes.
    html.find('.rollable').click(ev => { //this._onRoll.bind(this)
      // Define variables to be used
      let system = this.object.system;
      let label = '';
      let content = '';
      let attKey = '';
      let fixedBoons = 0;
      
      if ($(ev.currentTarget).hasClass('item-roll')) { // If it is a roll from an item.
        let li = $(ev.currentTarget).parents('.item');
        if (!li.length) { // If parent does not have .item class, set li to current target.
          li = $(ev.currentTarget);
        }

        const item = this.actor.items.get(li.data('itemId'));

        label = item.name;
        fixedBoons = item.system.boons;
        
        if (this.actor.type == 'Character') content = item.system.description.value;
        
        if (this.actor.system.attributes[item.system.attribute]) {
          attKey = item.system.attribute;
        }

      }
      
      // If the clicked element has a data-label, use it to determine the mod and label
      switch (ev.target.getAttribute('data-label')) {
        case 'Strength': {
          label = i18n('WW.Strength');
          attKey = 'str';
          break;
        }
        case 'Agility': {
          label = i18n('WW.Agility');
          attKey = 'agi';
          break;
        }
        case 'Intellect': {
          label = i18n('WW.Intellect');
          attKey = 'int';
          break;
        }
        case 'Will': {
          label = i18n('WW.Will');
          attKey = 'wil';
          break;
        }
        case 'Luck': {
          label = i18n('WW.Luck');
          attKey = 'luck';
          break;
        }
      }

      let obj = {
        actor: this.actor,
        target: ev,
        label: label,
        content: content,
        attKey: attKey,
        fixedBoons: fixedBoons
      }

      // Check for Automatic Failure
      console.log(system)
      if (system.autoFail[obj.attKey]) {

        let messageData = {
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
          content: '<div class="dice-formula auto-fail">' + i18n('WW.AutoFail') + '!</div>' + content,
          sound: CONFIG.sounds.dice
        };

        ChatMessage.create(messageData);
      } else {
        new rollAttribute(obj).render(true)
      }
    });

    // Damage Roll
    html.find('.damage-roll').click(ev => { //this._onRoll.bind(this)
      // Define variables to be used
      let li = $(ev.currentTarget).parents('.item');

      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      const item = this.actor.items.get(li.data('itemId'));
      
      let obj = {
        actor: this.actor,
        target: ev,
        label: item.name,
        baseDamage: item.system.damage,
        properties: item.system.properties ? item.system.properties : {},
        bonusDamage: this.actor.system.stats.bonusdamage
      }

      new rollDamage(obj).render(true)
    });

    // Healing Roll
    html.find('.healing-roll').click(ev => { //this._onRoll.bind(this)
      // Define variables to be used
      let li = $(ev.currentTarget).parents('.item');

      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      const item = this.actor.items.get(li.data('itemId'));
      
      let roll = new Roll(item.system.healing, this.actor.system);
      let label = i18n('WW.HealingOf') + ' ' + item.name;

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode')
      });
      
    });

    //////////////// ITEMS: HANDLING ///////////////////

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });
    
    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {

      let li = $(ev.currentTarget).parents('.item');
      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      const item = this.actor.items.get(li.data('itemId'));
      
      item.sheet.render(true);
    });

    //////////////// ITEMS: MISC ///////////////////

    // Set uses pips to update the value when clicked
    html.find('.item-pip').click(ev => {
      let li = $(ev.currentTarget).parents('.item');

      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      const item = this.actor.items.get(li.data('itemId'));
      
      if ($(ev.target).hasClass('far')) { // If the pip is regular (unchecked)
        item.update({'system.uses.value': item.system.uses.value + 1}) // Add 1 to the current value.
      } else {
        item.system.uses.value >= 0 ? item.update({'system.uses.value': item.system.uses.value - 1}) : item.update({'system.uses.value': 0}) // Subtract 1 from current value.
      }
    });

    // Item Scroll: Send item description to chat when clicked
    html.find('.item-scroll').click(ev => {

      let li = $(ev.currentTarget).parents('.item');
      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      const item = this.actor.items.get(li.data('itemId'));
      
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: item.name,
        content: item.system.description.value
      })
    });

    // Item Collapse button
    html.find('.item-collapse').click(ev => {
      let li = $(ev.currentTarget).parents('.item');
      
      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }
      let desc = li.find('.item-desc');
      let icon = li.find('.item-collapse').find('i');
      let test = li.find('.expand-contract');
      
      // Flip states
      if (icon.hasClass('fa-square-chevron-down')) {
        $(ev.currentTarget).attr("title", i18n('WW.Item.HideDesc'))
        icon.removeClass('fa-square-chevron-down').addClass('fa-square-chevron-up');
        desc.slideDown(500);
        //this._collapsedIds.add()
      } else {
        $(ev.currentTarget).attr("title", i18n('WW.Item.ShowDesc'))
        icon.removeClass('fa-square-chevron-up').addClass('fa-square-chevron-down');
        desc.slideUp(500);
        //this._collapsedIds.remove()
      }
      
    });

    ////////////////// EFFECTS ////////////////////

    // Active Effect management
    html.find('.effect-control').click(ev => onManageActiveEffect(ev, this.actor));

    // Disable Afflictions
    html.find('.remove-afflictions').click(async () => {
      await WWAfflictions.clearAfflictions(this.actor);
    });

    // Afflictions tab checkboxes
    html.find('.afflictions input').click(async ev => {
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

    // Drag events for macros.
    if (this.actor.isOwner) {
      const handler = ev => this._onDragStart(ev)
      html.find('.dropitem').each((i, li) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }
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
      let label = dataset.label ? `Rolling ${dataset.label}` : '';

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode')
      });
    }
  }

  /* -------------------------------------------- */
  /*  Drop item events                             */
  /* -------------------------------------------- */

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

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
  */

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type; // Get the type of item to create.
    const name = i18n('WW.NewItem', { itemType: type.capitalize() }) // Initialize a default name.

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
    const [createdItem] = await this.actor.createEmbeddedDocuments('Item', [itemData]);

    // Render the created item's template
    createdItem.sheet.render(true);

    return 
  }

}