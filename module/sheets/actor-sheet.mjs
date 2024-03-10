import { i18n, plusify, capitalize, sum } from '../helpers/utils.mjs';
import { chatMessageButton, targetHeader, addInstEffs, actionFromLabel } from '../chat/chat-html-templates.mjs';
import RollAttribute from '../dice/roll-attribute.mjs';
import TargetingHUD from '../apps/targeting-hud.mjs';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { WWAfflictions } from '../helpers/afflictions.mjs';
import ListEntryConfig from '../apps/list-entry-config.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
*/

export default class WWActorSheet extends ActorSheet {
  
  /** @override */
  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'actor'],
      width: 860, // 600 for small sheet, 860 for new sheet
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
      v.label = i18n(CONFIG.WW.ATTRIBUTES[k] ?? k);
    }

    // Prepare common data
    context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true })
    context.injured = context.actor.injured;
    context.incapacitated = context.actor.incapacitated;
    context.dead = context.actor.dead;

    // Prepare Sizes
    context.sizes = Object.entries(CONFIG.WW.SIZES).map(([k, v]) => ({key: k, label: v})).sort((a,b) => a.key - b.key);
    context.size = CONFIG.WW.SIZES[context.system.stats.size];

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
      this._prepareNPCData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(await this.actor.appliedEffects);
    context.actorEffects = prepareActiveEffectCategories(await this.actor.effects);

    // Prepare effect change labels to display
    context.effectChangeLabels = CONFIG.WW.EFFECT_CHANGE_LABELS;

    // Prepare html fields
    for (let i of context.items) {
      i.system.description.enriched = await TextEditor.enrichHTML(i.system.description.value, { async: true })
      if (i.system.attackRider) i.system.attackRider.enriched = await TextEditor.enrichHTML(i.system.attackRider?.value, { async: true })
    }

    // Prepare Disposition
    context.disposition = await this.actor?.token ? await this.actor.token.disposition : await this.actor.prototypeToken.disposition;
    
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
    const actions = [];
    const reactions = [];
    const end = [];
    const spells = [];

    // Initialize charOptions
    const charOptions = {
      ancestry: null,
      professions: [],
      novice: null,
      expert: null,
      master: null,
    }

    // Iterate through items, allocating to containers
    for (let i of context.items) {

      const itemDoc = this.document.items.get(i._id);

      if (!itemDoc.charOption) { // Item is a regular item
        
        i.img = i.img || DEFAULT_TOKEN;
        
        // Assign attributeLabel for template use
        if (i.system.attribute == 'luck') {
          i.system.attributeLabel = i18n('WW.Attributes.Luck') + ' (+0)';
        } else if (i.system.attribute) {
          const attribute = context.system.attributes[i.system.attribute];
          const name = i18n(CONFIG.WW.ATTRIBUTES[i.system.attribute]);
          i.system.attributeLabel = name + ' (' + plusify(attribute.mod) + ')'
        }

        // Is the item an activity?
        i.isActivity = i.system.attribute || i.effects.length || i.system.instant.length;

        // Check if item has passive effects
        i.hasPassiveEffects = false;
        const effects = this.document.items.get(i._id).effects;
        
        for (let e of effects) {
          if (e.trigger === 'passive') i.hasPassiveEffects = true;
        }

        // Pass down whether the item need targets or not
        i.needTargets = this.document.items.get(i._id).needTargets;
        
        // Append to equipment.
        if (i.type === 'Equipment') {

          // Prepare traits list for weapons
          if (i.system.subtype == 'weapon') {

            // Prepare traits list
            let list = '';

            Object.entries(i.system.traits).map((x) => {
              
              if (x[1]) {
                let string = i18n('WW.Weapon.Traits.' + capitalize(x[0]) + '.Label');
                
                if ((x[0] == 'range') || (x[0] == 'thrown')) {string += ' ' + i.system.range;}

                list = list.concat(list ? ', ' + string : string);
              }
              
            })

            i.system.traitsList = list;

            // Prepare name label
            i.label = (i.system.traits.range ? i18n('WW.Attack.Ranged') : i18n('WW.Attack.Melee')) + '—' + i.name + (i.system.traitsList ? ' ● ' + i.system.traitsList : '');
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

      } else { // Item is a Char Option
        
        switch(i.type) {

          case 'Ancestry': charOptions.ancestry = i; break;

          case 'Profession': charOptions.professions.push(i); break;

          case 'Path': {
            if (i.system.tier === 'master') charOptions.master = i;
            else if (i.system.tier === 'expert') charOptions.expert = i;
            else charOptions.novice = i;
            break;
          };

        }

        // Prepare Profession Category Localization
        if (i.type === 'Profession') {
          i.system.categoryLoc = CONFIG.WW.PROFESSION_CATEGORIES[i.system.category];
        }
        
      }

    }

    // Assign charOption
    context.charOptions = charOptions;
    
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
    reactions.forEach(updateUses)
    equipment.forEach(updateUses)
    spells.forEach(updateUses)

    // Assign and return
    context.equipment = equipment;
    context.weapons = weapons;
    context.allTalents = allTalents;
    context.talents = talents;
    context.actions = actions;
    context.reactions = reactions;
    context.end = end;
    context.spells = spells;

  }

  /**
   * Prepare data for Character sheets.
   *
   * @param {Object} context The actor's prepared context.
   *
   * @return {undefined}
  */

  async _prepareCharacterData(context) {

    // Prepare dropdown lists
    context.levels = CONFIG.WW.LEVELS;
    context.level = CONFIG.WW.LEVELS[context.system.stats.level];

    // Prepare enriched variables for editor.
    context.system.details.appearance.enriched = await TextEditor.enrichHTML(context.system.details.appearance.value, { async: true })
    context.system.details.features.enriched = await TextEditor.enrichHTML(context.system.details.features.value, { async: true }) // Deleted

    context.system.details.background.enriched = await TextEditor.enrichHTML(context.system.details.background.value, { async: true });
    context.system.details.bg_ancestry.enriched = await TextEditor.enrichHTML(context.system.details.bg_ancestry.value, { async: true }) // Deleted
    
    context.system.details.personality.enriched = await TextEditor.enrichHTML(context.system.details.personality.value, { async: true })
    context.system.details.beliefs.enriched = await TextEditor.enrichHTML(context.system.details.beliefs.value, { async: true })
    context.system.details.belief.enriched = await TextEditor.enrichHTML(context.system.details.belief.value, { async: true }) // Deleted
    
    context.system.details.notes.enriched = await TextEditor.enrichHTML(context.system.details.notes.value, { async: true });
    context.system.details.information.enriched = await TextEditor.enrichHTML(context.system.details.information.value, { async: true }) // Deleted
    context.system.details.deeds.enriched = await TextEditor.enrichHTML(context.system.details.deeds.value, { async: true }) // Deleted
  }

  /**
   * Prepare data for NPC sheets.
   *
   * @param {Object} context The actor's prepared context.
   *
   * @return {undefined}
  */

  async _prepareNPCData(context) {

    // Prepare dropdown lists
    context.difficulties = CONFIG.WW.BESTIARY_DIFFICULTIES;

  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    let actor = this.actor;

    // Toggle portrait menu on right mouse button
    let profileImg = html.find(".profile-img");
    let profileImgMenu = html.find(".profile-menu");
    let profileImgButton = html.find(".profile-show");
    profileImg.mousedown(async (e) => {
      if (e.which === 3) profileImgMenu.toggleClass("hidden");
    });
    profileImgButton.mousedown(async (e) => {
      if (e.which === 3) profileImgMenu.toggleClass("hidden");
    });

    // Handle portrait menu sharing buttons
    profileImgButton.click(function (e) {
      e.preventDefault();
      profileImgMenu.addClass("hidden");
      let id = $(this).attr("id");
      let img = actor.img;
      if (id == "showToken") {
        img = actor.prototypeToken.texture.src;
      }
      new ImagePopout(img, {
        title: game.weirdwizard.utils.getAlias({actor: actor}),
        shareable: true,
        uuid: actor.uuid,
      }).render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Input resize
    //resizeInput(html);
    
    // Rest button dialog + function
    html.find('.rest-button').click(this._onRest.bind(this));

    // Change Token Disposition
    html.find('.change-disposition').click(this._onDispositionChange.bind(this));

    // Handle list entries
    html.find('.array-button').click(this._onListEntryButtonClicked.bind(this));

    /////////////////////// ITEMS ////////////////////////

    // Handle item buttons
    html.find('.item-button').click(this._onItemButtonClicked.bind(this))

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Set uses pips to update the value when clicked
    html.find('.item-pip').click(ev => {
      const button = ev.currentTarget,
        item = this.actor.items.get(button.dataset.itemId);
      
      if ($(ev.target).hasClass('far')) { // If the pip is regular (unchecked)
        item.update({'system.uses.value': item.system.uses.value + 1}) // Add 1 to the current value.
      } else {
        item.system.uses.value >= 0 ? item.update({'system.uses.value': item.system.uses.value - 1}) : item.update({'system.uses.value': 0}) // Subtract 1 from current value.
      }
    });

    ////////////////// EFFECTS ////////////////////

    // Active Effect management
    html.find('.effect-control').click(ev => onManageActiveEffect(ev, this.actor));

    // Disable Afflictions
    html.find('.remove-afflictions').click(async () => { await WWAfflictions.clearAfflictions(this.actor) });

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
  /*  Item button actions                         */
  /* -------------------------------------------- */
  
  /**
   * Handle clicked sheet buttons
   * @param {Event} ev   The originating click event
   * @private
  */

  _onItemButtonClicked(ev) {
    const button = ev.currentTarget,
      dataset = Object.assign({}, button.dataset),
      item = this.actor.items.get(dataset.itemId);

    switch (dataset.action) {
      case 'attribute-roll': this._onAttributeRoll(dataset); break;
      case 'targeted-use': this._onItemUse(dataset); break;
      case 'untargeted-use': this._onItemUse(dataset); break;
      case 'item-scroll': this._onItemScroll(item); break;
      case 'item-toggle-effects': this._onItemToggleEffects(item); break;
      case 'item-toggle-reloaded': this._onItemToggleReloaded(item); break;
      case 'item-edit': this._onItemEdit(item); break;
      case 'item-delete': this._onItemDelete(item, button); break;
      case 'item-collapse': this._onItemCollapse(button); break;
    }
    
  }

  /* -------------------------------------------- */

  _onAttributeRoll(dataset) {
    
    // Define variables to be used
    const system = this.actor.system,
      origin = this.actor.uuid,
      attKey = dataset.key,
      label = i18n(CONFIG.WW.ROLL_ATTRIBUTES[attKey]) + ' Roll';

    let content = '';

    const obj = {
      origin: origin,
      label: label,
      content: content,
      attKey: attKey
    }

    // Check for Automatic Failure
    if (system.autoFail[obj.attKey]) {

      let messageData = {
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
    } else {
      new RollAttribute(obj).render(true);
    }
    
  }

  _onItemUse(dataset) {
    
    // Define variables to be used
    const system = this.actor.system,
      item = this.actor.items.get(dataset.itemId),
      label = _secretLabel(item.name),
      content = _secretContent(item.system.description.value),
      instEffs = item.system.instant,
      origin = item.uuid ? item.uuid : this.actor.uuid,
      action = dataset.action

    const attKey = system.attributes[item.system.attribute] ? item.system.attribute : '';

    if (!attKey) { // If an attribute key is not defined, do not roll
      
      const obj = {
        origin: origin,
        label: label,
        content: content,
        attKey: attKey,
        action: action,
        dontRoll: true
      }

      // If targeted-use button was clicked
      if (action === 'targeted-use') {

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
      else if (action === 'untargeted-use') {
  
        let messageData = {
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
          flavor: label,
          content: content,
          sound: CONFIG.sounds.dice,
          'flags.weirdwizard': {
            item: item.uuid,
            rollHtml: addInstEffs(instEffs, origin, ''),
            emptyContent: !content ?? true
          }
        };
        
        ChatMessage.create(messageData);
      }
      
    } else { // Attempt to Roll

      const obj = {
        origin: origin,
        label: label,
        content: content,
        attKey: attKey,
        action: action
      }
  
      // Check for Automatic Failure
      if (system.autoFail[obj.attKey]) {
        
        const messageData = {
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
        if (action === 'targeted-use') {

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
        else if (action === 'untargeted-use') new RollAttribute(obj).render(true);
        
      }
    }
    
  }

  // Item Scroll: Send item description to chat when clicked
  _onItemScroll(item) {
    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
      flavor: item.name,
      content: item.system.description.value,
      'flags.weirdwizard': {
        item: item.uuid
      }
    })
  }

  _onItemToggleEffects(item) {
    item.update({ "system.active": !item.system.active });
  }

  _onItemToggleReloaded(item) {
    item.update({ "system.reloaded": !item.system.reloaded });
  }

  // Render the item sheet for viewing/editing prior to the editable check.
  _onItemEdit(item) {
    item.sheet.render(true);
  }

  async _onItemDelete(item, button) {
    const confirm = await Dialog.confirm({
      title: i18n('WW.Item.Delete.Dialog.Title'),
      content: i18n('WW.Item.Delete.Dialog.Msg', {name: '<b>' + item.name + '</b>'}) + '<p class="dialog-sure">' + i18n('WW.Item.Delete.Dialog.Confirm', {name: item.name}) + '</p>'
    });

    if (!confirm) return;

    item.delete();
    $(button).slideUp(200, () => this.render(false));
  }

  // Collapses description
  _onItemCollapse(button) {
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
    
    let name = i18n('WW.Item.New', { itemType: type.capitalize() }) // Initialize a default name.

    const system = {
      subtype: '',
      source: type === 'Trait or Talent' ? header.dataset.source : '', // If Character's Talent, set source,
      attribute: '',
      damage: '',
      against: '',
      tier: type === 'Path' ? header.dataset.tier : '' // If a path, set tier
    };
    
    // If Talent or Equipment, set subtype and name to the subtype
    if ((type === 'Trait or Talent') || (type === 'Equipment')) {
      system.subtype = header.dataset.subtype;
      name = i18n('WW.Item.New', { itemType: system.subtype.capitalize() });
    }

    // If weapon, set default automated roll
    if (system.subtype == 'weapon') {
      system.attribute = 'str';
      system.against = 'def';
      system.damage = '1d6';
    }

    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: system
    };

    // Create the item
    const [createdItem] = await this.actor.createEmbeddedDocuments('Item', [itemData]);

    // Render the created item's template
    createdItem.sheet.render(true);

    return;
  }

  /* -------------------------------------------- */
  /*  Array button actions                        */
  /* -------------------------------------------- */

  /**
   * Handle clicked array buttons
   * @param {Event} ev   The originating click event
   * @private
  */

  _onListEntryButtonClicked(ev) {
    const button = ev.currentTarget,
      dataset = Object.assign({}, button.dataset);

    switch (dataset.action) {
      case 'add': this._onListEntryButtonAdd(dataset); break;
      case 'edit': this._onListEntryButtonEdit(dataset); break;
      case 'remove': this._onListEntryButtonRemove(dataset); break;
    }
    
  }

  /**
   * Handle adding an array entry
   * @param dataset   The dataset
   * @private
  */
  async _onListEntryButtonAdd(dataset) {

    const arrPath = 'system.' + dataset.array,
      oldArray = foundry.utils.getProperty(this.document, arrPath),
      defaultName = (arrPath.includes('languages') && !oldArray.length) ? i18n('WW.Detail.Language.Common') : i18n('WW.Detail.' + dataset.loc + '.New'),
      arr = [...oldArray, { name: defaultName }];
    
    // Update document
    await this.document.update({[arrPath]: arr});
    
    // Add entryId to dataset and render the config window
    dataset.entryId = arr.length-1;
    new ListEntryConfig(this.document, dataset).render(true);
    
  }

  /**
   * Handle edditing a list entry
   * @param {Event} ev   The originating click event
   * @private
  */

  _onListEntryButtonEdit(dataset) {
    
    // Render ListEntryConfig
    new ListEntryConfig(this.document, dataset).render(true);
    
  }

  /**
   * Handle removing an element from an array
   * @param {Event} ev   The originating click event
   * @private
  */

  _onListEntryButtonRemove(dataset) {
    
    const arrPath = 'system.' + dataset.array,
      arr = [...foundry.utils.getProperty(this.document, arrPath)];
    
    // Delete array element
    arr.splice(dataset.entryId, 1);
    
    // Update document
    this.document.update({[arrPath]: arr});
    
  }

  async _onRest() {
    const confirm = await Dialog.confirm({
      title: i18n('WW.Rest.Label'),
      content: i18n('WW.Rest.Msg') + '<p class="dialog-sure">' + i18n('WW.Rest.Confirm') + '</p>'
    });

    if (!confirm) return;

    // Heal all Damage and recover lost Health
    const health = this.actor.system.stats.health;
    
    this.actor.update({
      "system.stats.damage.value": 0,
      "system.stats.health.lost": health.lost - Math.floor(health.normal / 10)
    });

    // Recover uses/tokens/castings for Talents and Spells
    this.actor.updateEmbeddedDocuments('Item', this.actor.items.filter(i => i.system.uses?.onRest === true).map(i => ({ _id: i.id, 'system.uses.value': 0 })));

    // Send message to chat
    let messageData = {
      content: '<span style="display: inline"><span style="font-weight: bold">' + game.weirdwizard.utils.getAlias({ actor: this.actor }) + '</span> ' + i18n('WW.Rest.Finished') + '.</span>',
      sound: CONFIG.sounds.notification
    };

    ChatMessage.create(messageData);
  }

  async _onDispositionChange() {
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

  /* -------------------------------------------- */
  /*  Drop item events                            */
  /* -------------------------------------------- */

   /** @override */
   async _onDropItemCreate(itemData) {

    // Check if item must be unique
    if (itemData.type === 'Ancestry' || itemData.type === 'Path') {

      const hasOption = this.actor.items.find(i => {
      
        if (itemData.type === 'Path') return i.system.tier === itemData.system.tier;
        else return i.type === itemData.type;
  
      })
      
      // If actor already has this character option, return a warning
      if (hasOption) return ui.notifications.warn(i18n("WW.CharOption.AlreadyWarning"));
    }
    
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