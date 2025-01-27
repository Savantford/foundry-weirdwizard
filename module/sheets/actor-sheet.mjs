import { capitalize, escape, i18n, plusify, sum } from '../helpers/utils.mjs';
import { addActEffs, addInstEffs, diceTotalHtml } from '../sidebar/chat-html-templates.mjs';
import ListEntryConfig from '../sheets/list-entry-config.mjs';
import { mapRange } from '../canvas/canvas-functions.mjs';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import RollAttribute from '../dice/roll-attribute.mjs';
import TargetingHUD from '../apps/targeting-hud.mjs';
import { WWAfflictions } from '../helpers/afflictions.mjs';
import WWRoll from '../dice/roll.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
*/

export default class WWActorSheet extends ActorSheet {
  
  /** @override */
  static get defaultOptions() {
    
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'actor'],
      width: 860, // 600 for small sheet, 860 for new sheet
      height: 500,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'features' }]
    });
  }

  /** @override */
  get template() {
    const perms = CONST.DOCUMENT_OWNERSHIP_LEVELS,
    path = 'systems/weirdwizard/templates/actors';
    
    let permission = this.document.getUserLevel(game.user);
    if (game.user.isGM) permission = perms.OWNER;

    if ((permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED) | (permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) return `${path}/${this.actor.type}-limited.hbs`;
    if (permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) return `${path}/${this.actor.type}-sheet.hbs`;
    
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
    context.folder = await actorData.folder;
    context.flags = actorData.flags;
    context.dtypes = ['String', 'Number', 'Boolean'];

    // Pass editMode state
    context.editMode = this.editMode ?? false;

    for (let attr of Object.values(context.system.attributes)) {
      attr.isCheckbox = attr.dtype === 'Boolean';
    }

    // Localize attribute names
    for (let [k, v] of Object.entries(context.system.attributes)) {
      v.label = i18n(CONFIG.WW.ATTRIBUTES[k] ?? k);
    }

    // Prepare common data
    context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true })
    context.injured = actorData.injured;
    context.incapacitated = actorData.incapacitated;
    context.dead = actorData.dead;

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

    // Prepare Items
    this._prepareItems(context);

    // Prepare character data
    if (actorData.type == 'Character') this._prepareCharacterData(context);

    // Prepare NPC data
    if (actorData.type == 'NPC') this._prepareNPCData(context);

    // Add roll data for TinyMCE editors.
    context.rollData = actorData.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(await this.actor.appliedEffects);
    context.actorEffects = prepareActiveEffectCategories(await this.actor.effects);

    // Prepare effect change labels to display
    context.effectChangeLabels = CONFIG.WW.EFFECT_CHANGE_LABELS;

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

    // Setup usage help text for tooltips (so we can reuse it)
    const usagehelp = escape(`
      <p>${i18n("WW.Item.Perform.Left")}</p>
      <p>${i18n("WW.Item.Perform.Shift")}</p>
      <p>${i18n("WW.Item.Perform.Ctrl")}</p>
      <p>${i18n("WW.Item.Perform.Alt")}</p>
      <p>${i18n("WW.Item.Perform.Right")}</p>
    `);

    // Prepare item tooltip
    for (let i of context.items) {
      // Prepare html fields for the tooltip and chat message
      i.system.description.enriched = await TextEditor.enrichHTML(i.system.description.value, { async: true });
      if (i.system.attackRider) i.system.attackRider.enriched = await TextEditor.enrichHTML(i.system.attackRider.value, { async: true });

      // Tooltip title
      const title = await escape(`<div class="tooltip-title">${i.name}</div>`);

      // Empty description, so we can fill it with type specific content
      let description = '';

      // Form description based on item type
      switch (i.type) {
        case 'Spell':
          const casting = i.system.casting ? `<b>${i18n("WW.Spell.Castings")}:</b> ${i.system.uses.max}, ${i.system.casting}` : `<b>${i18n("WW.Spell.Castings")}:</b> ${i.system.uses.max}`;
          const target = i.system.target ? `<br/><b>${i18n("WW.Spell.Target")}:</b> ${i.system.target}` : '';
          const duration = i.system.duration ? `<br/><b>${i18n("WW.Spell.Duration")}:</b> ${i.system.duration}` : '';

          description = await escape(`
            <p>${casting}
            ${target}
            ${duration}</p>
            ${i.system.description.enriched}
          `);
          break;

        case 'Equipment':
          const rider = i.system.attackRider.enriched ? i.system.attackRider.enriched : '';
          
          description = await escape(`
            ${i.system.description.enriched}
            ${rider}
          `);
          break;
        
        default:
          description = await escape(`
            ${i.system.description.enriched}
          `);
      }

      // Create tooltip from concat of description and usage help text
      i.tooltip = await escape('<div class="item-tooltip">') + title + description + await escape('</div>') + usagehelp;
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
    // Initialize item lists
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

    // Iterate through items, allocating to lists
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
                
                if ((x[0] == 'range') || (x[0] == 'reach' && i.system.range) || (x[0] == 'thrown') ) {string += ' ' + i.system.range;}

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
          if (i.system.subtype == 'container') {
            // Prepare variables
            let list = '';
            const held = [];
            i.filled = 0;
            
            // Prepare held items list and count weight of items
            this.actor.items.filter(x => x.system.heldBy === i._id).map((x) => {

              // Check if item has passive effects
              x.hasPassiveEffects = false;
              const effects = this.document.items.get(x._id).effects;
              
              for (let e of effects) {
                if (e.trigger === 'passive') x.hasPassiveEffects = true;
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

        // Calculate total Equipment weight.
        function calcWeight(item, id) {
          item.system.weight = item.system.quantity * item.system.weightUnit;
        }

        equipment.forEach(calcWeight);

        context.totalWeight = sum(equipment.map(i => i.system.weight));

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

    // Prepare uses pips for talents and spells
    function updateUses(item, id) {
      let spent = item.system.uses.value ? item.system.uses.value : 0;
      let max = item.system.uses.max;

      // Read the current amount of charges from the set max, or to be relative to the actor's level depending on the setting.
      // Only do this if it's a player character, as NPCs and non-characters do not have a level value to be relative to.
      if (context.actor.type === 'Character') {
        const level = context.actor.system.stats.level;
        const half = Math.floor(level / 2) > 0 ? Math.floor(level / 2) : 1;
        
        switch (item.system.uses.levelRelative) {
          case 'full': max = level; break;
          case 'half': max = half; break;
        }
      }

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
    end.forEach(updateUses)

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

    // Prepare editable Natural Defense check
    if (this.actor._source.system.stats.defense.natural !== this.actor.system.stats.defense.natural) context.defenseDisabled = true;

  }

  /* EVENTS */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const actor = this.actor;

    // Add dead or incapacitated class to main window
    const window = this.element[0];
    window.classList.toggle('injured', actor.injured);
    window.classList.toggle('incapacitated', actor.incapacitated && !actor.dead);
    window.classList.toggle('dead', actor.dead);

    // Handle portrait menu sharing buttons
    html.find('.profile-show').click(ev => this._showProfileImg(ev));

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Change Token Disposition
    html.find('.change-disposition').click(this._onDispositionChange.bind(this));

    // Change Token Disposition
    html.find('.edit-folder').click(this._onFolderEdit.bind(this));

    // Handle list entries
    html.find('.array-button').click(this._onListEntryButtonClicked.bind(this));

    // Initialize Sheet Menu
    ContextMenu.create(this, html, '.sheet-menu', this._getSheetMenuOptions());
    ContextMenu.create(this, html, '.sheet-menu', this._getSheetMenuOptions(), { eventName:'click' });

    // Incapacitated Health Loss
    if (this.actor.type === 'Character') html.find('.health-indicator').click(this._onIncapacitatedRoll.bind(this));

    /////////////////////// ITEMS ////////////////////////

    // Initialize Item Context Menu
    this._itemContextMenu(html);

    // Handle item buttons
    html.find('.item-button').click(this._onItemButtonClicked.bind(this))

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreateButtonClicked.bind(this));

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

    // Handle container collapsing
    html.find('.container').click(this._onContainerCollapse.bind(this));

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

  /* A function called to roll Luck while incapacitated */
  async _onIncapacitatedRoll() {
    if (!this.actor.incapacitated || await this.actor.dead) return;

    // Prepare roll
    const r = await new WWRoll('1d6', this.actor.getRollData).evaluate();
    const rollArray= [r];
    const rollHtml = await diceTotalHtml(r);
  
    // Prepare message data
    const messageData = {
      /*type: CONST.CHAT_MESSAGE_TYPES.ROLL,*/
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

  /* -------------------------------------------- */
  /*  Context Menus                               */
  /* -------------------------------------------- */

  /**
   * Get the Item context options
   * @returns {object[]}   The Item context options
   * @private
   */
  _getSheetMenuOptions() {
    
    return [
      {
        name: "WW.System.Sheet.EditMode",
        icon: '<i class="fas fa-edit"></i>',
        callback: li => {
          return this._onToggleEditMode();
        }
      },
      {
        name: "WW.Rest.Label",
        icon: '<i class="fas fa-campground"></i>',
        callback: li => {
          return this._onRest();
        },
        condition: li => {
          return this.actor.type === 'Character';
        }
      },
      {
        name: "WW.Actor.Reset",
        icon: '<i class="fas fa-rotate-left"></i>',
        callback: li => {
          return this._onSheetReset();
        }
      }
    ]

  }

  _showProfileImg(ev) {
    ev.preventDefault();
    const a = ev.currentTarget;
    const action = $(a).data('action');
    
    let img = this.actor.img;
    if (action == "show-token") {
      img = this.actor.prototypeToken.texture.src;
    }
    
    new ImagePopout(img, {
      title: game.weirdwizard.utils.getAlias({actor: this.actor}),
      shareable: true,
      uuid: this.actor.uuid,
    }).render(true);
  }

  /* -------------------------------------------- */
  /*  Item button actions                         */
  /* -------------------------------------------- */

  /** @inheritdoc */
  _itemContextMenu(html) {
    ContextMenu.create(this, html, ".item-button", this._getItemContextOptions());
  }

  /* -------------------------------------------- */

  /**
   * Get the Item context options
   * @returns {object[]}   The Item context options
   * @private
   */
  _getItemContextOptions() {
    
    return [
      {
        name: "WW.Item.Perform.Attack",
        icon: '<i class="fas fa-bolt"></i>',
        callback: li => {
          const dataset = Object.assign({}, li[0].dataset);
          return this._onItemUse(dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return item.type === 'Equipment' && item.system.subtype === 'weapon';
        }
      },
      {
        name: "WW.Item.Perform.AttackTarget",
        icon: '<i class="fas fa-bullseye"></i>',
        callback: li => {
          const dataset = Object.assign({}, li[0].dataset);
          dataset.action = 'targeted-use';
          return this._onItemUse(dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return item.type === 'Equipment' && item.system.subtype === 'weapon';
        }
      },
      {
        name: "WW.Item.Perform.Equipment",
        icon: '<i class="fas fa-bolt"></i>',
        callback: li => {
          const dataset = Object.assign({}, li[0].dataset);
          return this._onItemUse(dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return item.type === 'Equipment' && item.system.subtype !== 'weapon';
        }
      },
      {
        name: "WW.Item.Perform.EquipmentTarget",
        icon: '<i class="fas fa-bullseye"></i>',
        callback: li => {
          const dataset = Object.assign({}, li[0].dataset);
          dataset.action = 'targeted-use';
          return this._onItemUse(dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return item.type === 'Equipment' && item.system.subtype !== 'weapon';
        }
      },
      {
        name: "WW.Item.Perform.Spell",
        icon: '<i class="fas fa-bolt"></i>',
        callback: li => {
          const dataset = Object.assign({}, li[0].dataset);
          return this._onItemUse(dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return item.type === 'Spell';
        }
      },
      {
        name: "WW.Item.Perform.SpellTarget",
        icon: '<i class="fas fa-bullseye"></i>',
        callback: li => {
          const dataset = Object.assign({}, li[0].dataset);
          dataset.action = 'targeted-use';
          return this._onItemUse(dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return item.type === 'Spell';
        }
      },
      {
        name: "WW.Item.Perform.Talent",
        icon: '<i class="fas fa-bolt"></i>',
        callback: li => {
          const dataset = Object.assign({}, li[0].dataset);
          return this._onItemUse(dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return item.type === 'Trait or Talent';
        }
      },
      {
        name: "WW.Item.Perform.TalentTarget",
        icon: '<i class="fas fa-bullseye"></i>',
        callback: li => {
          const dataset = Object.assign({}, li[0].dataset);
          dataset.action = 'targeted-use';
          return this._onItemUse(dataset);
        },
        condition: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return item.type === 'Trait or Talent';
        }
      },
      {
        name: "WW.Item.Send",
        icon: '<i class="fas fa-scroll"></i>',
        callback: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return this._onItemScroll(item);
        }
      },
      {
        name: "WW.Item.Edit.Activity",
        icon: '<i class="fas fa-edit"></i>',
        callback: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return this._onItemEdit(item);
        }
      },
      {
        name: "WW.Item.Delete.Activity",
        icon: '<i class="fas fa-trash"></i>',
        callback: li => {
          const item = this.actor.items.get(li.data('item-id'));
          return this._onItemDelete(item, li);
        }
      }
    ]

  }

  /* -------------------------------------------- */
  
  /**
   * Handle clicked sheet buttons
   * @param {Event} ev   The originating click event
   * @private
  */

  _onItemButtonClicked(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    const button = ev.currentTarget,
      dataset = Object.assign({}, button.dataset),
      item = this.actor.items.get(dataset.itemId);
    
    // Determine action with modifier keys
    if (ev.shiftKey) dataset.action = 'targeted-use';
    if (ev.ctrlKey) dataset.action = 'item-scroll';
    if (ev.altKey) dataset.action = 'item-edit';
    
    // Evaluate action if no keys were clicked
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

      let messageData = {
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

  _onItemUse(dataset) {
    
    // Define variables to be used
    const system = this.actor.system,
      item = this.actor.items.get(dataset.itemId),
      label = _secretLabel(item.name),
      content = _secretContent(item.system.description.value),
      instEffs = item.system.instant,
      effects = item.effects,
      origin = item.uuid ? item.uuid : this.actor.uuid,
      action = dataset.action

    const attKey = CONFIG.WW.ATTRIBUTE_ROLLS[item.system.attribute] ? item.system.attribute : '';
    
    if (!attKey) { // If an attribute key is not defined, do not roll
      
      const obj = {
        origin: origin,
        label: label,
        content: content,
        attKey: attKey,
        action: action,
        dontRoll: true,
        instEffs: instEffs,
        actEffs: effects
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

        function actEffs() {
          const effs = {
            onUse: [],
            onSuccess: [],
            onCritical: [],
            onFailure: []
          }
          
          item.effects?.forEach(e => {
            
            if (!e.flags.weirdwizard.uuid) e.setFlag('weirdwizard', 'uuid', e.uuid);
            if (!e.trigger) e.trigger = e.flags.weirdwizard.trigger;
            
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

            if (!e.trigger) e.trigger = e.flags.weirdwizard.trigger;
            
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
      flavor: _secretLabel(item.name),
      content: item.system.description.value,
      'flags.weirdwizard': {
        icon: item.img,
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

  // Collapses Container content
  _onContainerCollapse(ev) {
    const button = ev.currentTarget,
    dataset = Object.assign({}, button.dataset);

    let li = $(button).parents('.item');
    
    if (!li.length) { // If parent does not have .item class, set li to current target.
      li = $(button);
    }
    
    const content = li.parent().find(`.container-content[data-container-id=${dataset.itemId}]`);
    
    // Flip states
    if (li.hasClass('collapsed')) {
      li.removeClass('collapsed');
      $(button).attr('data-tooltip', 'WW.Container.Collapse');
      content.slideDown(300);
    } else {
      li.addClass('collapsed');
      $(button).attr('data-tooltip', 'WW.Container.Expand');
      content.slideUp(300);
    }
    
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
  */
  async _onItemCreateButtonClicked(event) {
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

  _onToggleEditMode() {
    this.editMode = !this.editMode;
    
    this.render(true);
  }

  async _onRest() {
    
    const confirm = await Dialog.confirm({
      title: i18n('WW.Rest.Label'),
      content: i18n('WW.Rest.Msg') + '<p class="dialog-sure">' + i18n('WW.Rest.Confirm') + '</p>'
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
      <p style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this.document })}</b> ${i18n('WW.Rest.Finished')}.</p>
      <p>${i18n('WW.InstantEffect.Apply.CurrentHealth')}: ${health.current} <i class="fas fa-arrow-right"></i> ${newCurrent}</p>
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

  async _onSheetReset() {
    
    const confirm = await Dialog.confirm({
      title: i18n('WW.Reset.Label'),
      content: i18n('WW.Reset.Msg') + '<p class="dialog-sure">' + i18n('WW.Reset.Confirm') + '</p>'
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

  _onFolderEdit() {
    this.actor.folder.sheet.render(true);
  }

  /* -------------------------------------------- */
  /*  Drop item events                            */
  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   * @override
   */
  async _onDropItem(event, data) {
    if ( !this.actor.isOwner ) return false;
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();
    
    // Get target item details
    const target = event.target.closest('.item');
    const targetId = target ? target.dataset.itemId : '';
    const targetData = (targetId) ? this.actor.items.get(targetId).toObject() : {};
    
    // If within the same Actor
    if ( this.actor.uuid === item.parent?.uuid ) {

      if (targetData.system?.subtype === 'container') { // Dropped on a container
        return item.update({'system.heldBy': targetData._id});
      } else if (item.system.heldBy && (item.system.heldBy !== targetData.system.heldBy)) { // Item is held by a container dropped elsewhere
        return item.update({'system.heldBy': ''});
      } else {
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