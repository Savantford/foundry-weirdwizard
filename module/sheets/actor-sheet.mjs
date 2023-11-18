import { i18n, plusify, capitalize, resizeInput, sum } from '../helpers/utils.mjs';
import { chatMessageButton } from '../chat/chat-html-templates.mjs';
import { healthDetails } from '../apps/health-details.mjs';
import RollAttribute from '../apps/roll-attribute.mjs';
//import { RollDamage } from '../apps/roll-damage.mjs';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { WWAfflictions } from '../helpers/afflictions.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
*/

export default class WWActorSheet extends ActorSheet {
  
  /** @override */
  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'actor'],
      width: 860, // 600 for small sheet, 870 for new sheet
      height: 500,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'features' }]
    });
  }

  /** @override */
  get template() {
    const path = 'systems/weirdwizard/templates/actors';
    
    let permission = this.document.getUserLevel(game.user);
    if ((permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED) | (permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) return `${path}/${this.actor.type}-limited.hbs`;
    if (permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) return `${path}/${this.actor.type}-sheet.hbs`;
    
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
    //context.incapacitated = (context.system.stats.damage.value >= context.system.stats.health.current) ? true : false;
    //context.injured = (context.system.stats.damage.value >= Math.floor(context.system.stats.health.current / 2)) ? true : false;
    context.injured = context.actor.injured;
    context.incapacitated = context.actor.incapacitated;
    context.dead = context.actor.dead;

    // Prepare numbersArr, Level and Size
    context.numbersArr = Object.entries(CONFIG.WW.dropdownNumbers).map(([k, v]) => ({key: k, label: v})).sort((a,b) => a.key - b.key);
    context.level = CONFIG.WW.dropdownNumbers[context.system.stats.level];
    context.size = CONFIG.WW.dropdownNumbers[context.system.stats.size];

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
    context.effects = prepareActiveEffectCategories(await this.actor.appliedEffects);
    context.actorEffects = prepareActiveEffectCategories(await this.actor.effects);

    // Prepare effect change labels to display
    context.effectChangeLabels = CONFIG.WW.effectChangeLabels;

    // Prepare html fields
    for (let i of context.items) {
      i.system.description.enriched = await TextEditor.enrichHTML(i.system.description.value, { async: true })
      if (i.system.attackRider) i.system.attackRider.enriched = await TextEditor.enrichHTML(i.system.attackRider?.value, { async: true })
    }
    
    return context;
  }

  /**
   * Organize and classify Items for actor sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
  */

  _prepareItems(context) {
    // Initialize containers.
    const equipment = [];
    const weapons = [];
    const allTalents = [];
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
        const name = i18n(CONFIG.WW.attributes[i.system.attribute]);
        i.system.attributeLabel = name + ' (' + plusify(attribute.mod) + ')'
      }

      // Is the item an activity?
      i.isActivity = false;

      if (i.system.attribute || i.effects || i.system.instant) i.isActivity = true;
      
      // Append to equipment.
      if (i.type === 'Equipment') {

        // Prepare properties list for weapons
        if (i.system.subtype == 'weapon') {

          // Prepare traits list
          let traits = i.system.traits;
          let list = '';
          let propertiesList = '';

          Object.entries(traits).map((x) => {
            
            if (x[1]) {
              let string = i18n('WW.Weapon.Traits.' + capitalize(x[0]) + '.Label');
              
              if ((x[0] == 'range') || (x[0] == 'thrown')) {string += ' ' + i.system.range;}

              list = list.concat(list ? ', ' + string : string);
            }
            
          })

          if (list) propertiesList += list;

          // Prepare advantages list
          let advantages = i.system.advantages;
          list = '';

          Object.entries(advantages).map((x) => {
            
            if (x[1]) {
              let string = i18n('WW.Weapon.Advantages.' + capitalize(x[0]) + '.Label');

              list = list.concat(list ? ', ' + string : string);
            }
            
          })

          if (list) { propertiesList ? propertiesList += ' | ' + list : propertiesList = list; }

          // Prepare disadvantages list
          let disadvantages = i.system.disadvantages;
          list = '';

          Object.entries(disadvantages).map((x) => {
            
            if (x[1]) {
              let string = i18n('WW.Weapon.Disadvantages.' + capitalize(x[0]) + '.Label');

              list = list.concat(list ? ', ' + string : string);
            }
            
          })
          
          if (list) { propertiesList ? propertiesList += ' | ' + list : propertiesList = list; }

          i.system.propertiesList = propertiesList;
        }

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

      // Check if item has passive effects
      context.hasPassiveEffects = false;
      const effects = this.document.items.get(i._id).effects;
      
      for (let e of effects) {
        if (e.trigger == 'passive') context.hasPassiveEffects = true;
      }

    }
    
    // Calculate total Equipment weight.
    function calcWeight(item, id) {
      item.system.weight = item.system.quantity * item.system.weightUnit;
    }

    equipment.forEach(calcWeight)

    context.totalWeight = sum(equipment.map(i => i.system.weight))

    // Prepare uses pips for talents and spells
    function updateUses(item, id) {
      let spent = item.system.uses.value ? item.system.uses.value : 0;
      let max = item.system.uses.max;
      let arr = [];

      let i = 0; // fill the Buttons with available traditions

      for (i = 1; i <= max; i++) { // statement 1 = beginning of the block, statement 2 = condition, statement 3 = executed at the end of each loop
        if (i <= spent) { arr.push('fas fa-circle-x') } else { arr.push('far fa-circle') };
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
    context.allTalents = allTalents;
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

    // Input resize
    resizeInput(html);

    // Edit Health button
    html.find('.health-edit').click(ev => {
      new healthDetails(this.actor).render(true)
    });
    
    // Rest button dialog + function
    html.find('.rest-btn').click(this._onRest.bind(this));

    /////////// ITEMS: ROLL BUTTONS /////////////

    // Rollable attributes.
    html.find('.rollable').click(this._onAttributeRoll.bind(this))

    // Damage Roll
    /*html.find('.damage-roll').click(ev => { //this._onDamageRoll.bind(this)
      // Define variables to be used
      let li = $(ev.currentTarget).parents('.item');

      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      const item = this.actor.items.get(li.data('itemId'));
      
      let obj = {
        actor: this.actor,
        target: ev,
        label: _secretLabel(item.name),
        name: item.name,
        baseDamage: item.system.damage,
        properties: item.system.properties ? item.system.properties : {},
        bonusDamage: this.actor.system.stats.bonusdamage
      }

      new rollDamage(obj).render(true);
    });*/

    // Healing Roll
    /*html.find('.healing-roll').click(ev => { //this._onRoll.bind(this)
      // Define variables to be used
      let li = $(ev.currentTarget).parents('.item');

      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      const item = this.actor.items.get(li.data('itemId'));
      
      let roll = new Roll(item.system.healing, this.actor.system);
      let label = i18n('WW.HealingOf') + ' ' + _secretLabel(item.name);

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode')
      });
      
    });*/

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
        content: item.system.description.value,
        'flags.weirdwizard': {
          item: item.uuid
        }
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
      
      // Flip states
      if (icon.hasClass('fa-square-chevron-down')) {
        $(ev.currentTarget).attr("title", i18n('WW.Item.HideDesc'))
        icon.removeClass('fa-square-chevron-down').addClass('fa-square-chevron-up');
        desc.slideDown(500);
      } else {
        $(ev.currentTarget).attr("title", i18n('WW.Item.ShowDesc'))
        icon.removeClass('fa-square-chevron-up').addClass('fa-square-chevron-down');
        desc.slideUp(500);
      }
      
    });

    // Toggle Item Effects
    html.find('.item-toggle-effects').click(this._onToggleItemEffects.bind(this));

    // Reloaded Checkbox
    html.find('.item-toggle-reloaded').click(this._onToggleItemReloaded.bind(this));
    /*html[0].querySelectorAll(".checkbox-reloaded").forEach(n => {
      n.addEventListener("change", this._onChangeItemReloaded.bind(this));
    });*/

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

  _onAttributeRoll(ev) {

    // Define variables to be used
    const system = this.actor.system;
    let content = '';
    let attKey = ev.currentTarget.dataset.key ? ev.currentTarget.dataset.key : '';
    let label = attKey ? i18n(CONFIG.WW.rollAttributes[attKey]) : '';
    let item = {};
    let baseHtml = {};
    let instEffs = [];
    
    // If it is a roll from an item, assign data
    if ($(ev.currentTarget).hasClass('item-roll')) {
      let li = $(ev.currentTarget).parents('.item');
      if (!li.length) { // If parent does not have .item class, set li to current target.
        li = $(ev.currentTarget);
      }

      item = this.actor.items.get(li.data('itemId'));
      label = _secretLabel(item.name);
      content = _secretContent(item.system.description.value);
      instEffs = item.system.instant;
      
      if (system.attributes[item.system.attribute]) {
        attKey = item.system.attribute;
      }

    }

    const origin = item.uuid ? item.uuid : this.actor.uuid;

    if (instEffs) {
    
      for (const t of this.targets) {
        baseHtml[t.uuid] = this._addInstEffs(instEffs, origin, t.uuid);
      }
      
    }

    // If an attribute key is not defined, do not roll
    if (!attKey) {
      let html = '';
      
      for (const t of this.targets) {
        html += baseHtml[t.uuid];
      }

      let messageData = {
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        content: content + html,
        sound: CONFIG.sounds.dice,
        'flags.weirdwizard': {
          item: item.uuid
        }
      };
      
      ChatMessage.create(messageData);
    } else {

      let obj = {
        origin: origin,
        target: ev,
        label: label,
        content: content,
        attKey: attKey,
        baseHtml: baseHtml
      }
  
      // Check for Automatic Failure
      if (system.autoFail[obj.attKey]) {
        
        let messageData = {
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
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
      } else {
        if (item?.system?.subtype === 'weapon' && !item.system.against) ui.notifications.warn(i18n("WW.Roll.AgainstWrn"));
        else if (needTargets(item) && !game.user.targets.size) {
          ui.notifications.warn(i18n("WW.Roll.TargetWrn"));
          canvas.controls.activate({tool: 'target'});
          canvas.tokens.activate({tool:'target'})
          this.minimize();
        }
        else new RollAttribute(obj).render(true);
      }
    }
    
  }

  async _onRest() {
    const confirm = await Dialog.confirm({
      title: i18n('WW.Rest.Label'),
      content: i18n('WW.Rest.Msg') + '<p class="dialog-sure">' + i18n('WW.Rest.Confirm') + '</p>'
    });

    if (!confirm) return;

    // Recover all damage
    this.actor.update({ "system.stats.damage.value": 0 });

    // Recover 1/10 of the Health, rounded down
    const health = this.actor.system.stats.health;
    this.actor.update({ "system.stats.health.lost": health.lost - Math.floor(health.normal / 10) });

    // Recover uses/tokens/castings for Talents and Spells
    this.actor.updateEmbeddedDocuments('Item', this.actor.items.filter(i => i.system.uses.onRest === true).map(i => ({ _id: i.id, 'system.uses.value': 0 })
    ));

    // Send message to chat
    let messageData = {
      content: '<span style="display: inline"><span style="font-weight: bold">' + this.actor.name + '</span> ' + i18n('WW.Rest.Finished') + '.</span>',
      sound: CONFIG.sounds.notification
    };

    ChatMessage.create(messageData);
  }

  async _onToggleItemEffects(event) {
    const target = event.currentTarget;
    const item = this.actor.items.get(target.dataset.itemId);
    return item.update({ "system.active": !item.system.active });
  }

  async _onToggleItemReloaded(event) {
    const target = event.currentTarget;
    const item = this.actor.items.get(target.dataset.itemId);
    return item.update({ "system.reloaded": !item.system.reloaded });
  }

  /* -------------------------------------------- */
  /*  Drop item events                            */
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
    let name = i18n('WW.NewItem', { itemType: type.capitalize() }) // Initialize a default name.

    let subtype = '';
    let source = '';
    let attribute = '';
    let damage = '';
    let against = '';
    
    // If Talent or Equipment, set subtype and name to the subtype
    if ((type == 'Trait or Talent') || (type == 'Equipment')) {
      subtype = event.currentTarget.dataset.subtype;
      name = i18n('WW.NewItem', { itemType: subtype.capitalize() });
    }

    // If weapon, set default automated roll
    if (subtype == 'weapon') {
      attribute = 'str';
      against = 'def';
      damage = '1d6';
    }

    // If Character's Talent, set source
    if ((this.actor.type) && (type == 'Trait or Talent')) source = event.currentTarget.dataset.source;

    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: { subtype, source, attribute, against, damage }
    };

    // Create the item
    const [createdItem] = await this.actor.createEmbeddedDocuments('Item', [itemData]);

    // Render the created item's template
    createdItem.sheet.render(true);

    return 
  }

  // Add intant effects to chat message html
  _addInstEffs(effects, origin, target) {
    
    if (!target) target = '';
    
    let finalHtml = '';
    effects = effects.filter(e => e.trigger === 'onUse');
    
    effects.forEach(e => {
      let html = '';
        
      if (e.label === 'affliction') html = chatMessageButton({
        origin: origin,
        target: target,
        label: e.label,
        value: e.affliction
      });

      else html = chatMessageButton({
        origin: origin,
        target: target,
        label: e.label,
        value: e.value,
      });
      
      finalHtml += html;
    })
    
    return finalHtml;
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */
  
  get targets() {
    let targets = [];
    
    if (game.user.targets.size) { // Get targets if they exist

      game.user.targets.forEach(t => {
        
        targets.push({
          id: t.id,
          name: t.document.name,
          attributes: t.document.actor.system.attributes,
          defense: t.document.actor.system.stats.defense.total,
          boonsAgainst: t.document.actor.system.boons.against
        })
      });

    } else { // Get self as a target if none is selected

      targets.push({
        id: this.token?.id,
        name: this.token?.name,
        attributes: this.actor.system.attributes,
        defense: this.actor.system.stats.defense.total,
        boonsAgainst: this.actor.system.boons.against
      })

    }

    return targets
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

// Check if targets are needed
function needTargets(item) {
  let need = false;//item?.system?.rollForEach;

  if (item?.system?.against) need = true;

  if (item?.effects) {
    for (const e of item.effects) {
      if (e.target == 'tokens') need = true;
    }
  }

  if (item?.system?.instant) {
    for (const e of item.system.instant) {
      if (e.target == 'tokens') need = true;
    }
  }

  return need;
}