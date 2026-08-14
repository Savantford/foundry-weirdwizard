import WWRoll from '../dice/roll.mjs';
import { plusify } from '../helpers/utils.mjs';
import TargetingHUD from './targeting-hud.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * A powerful general app to handle general activity use and dice rolling.
 * @extends {ApplicationV2}
*/
export default class ActivityUse extends HandlebarsApplicationMixin(ApplicationV2) {
  debounceRender = foundry.utils.debounce(this.render, 50);
  
  constructor(options={}, config = {}) {
    super(options); // Required for "this." to work

    // Minimize related Actor sheet
    if (options.actor) options.actor.sheet.minimize();

    // Enable token targeting listener
    Hooks.on("targetToken", () => this.debounceRender() );
  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['weirdwizard', 'activity-use'],
    window: {
      title: this.title,
      icon: 'fa-regular fa-dice-d20',
      resizable: true
    },
    actions: {
      // Roll actions
      toggleRollDetails: ActivityUse.#onToggleRollDetails,
      situationalUp: ActivityUse.#changeSituationalBoons,
      situationalDown: ActivityUse.#changeSituationalBoons,
      confirm: ActivityUse.#confirm,

      // Targeting actions
      selectTargets: ActivityUse.#selectTargets,
      placeTemplate: ActivityUse.#placeTemplate,
      targetingRestriction: ActivityUse.#onChangeTargetingRestriction,

      // Other actions
      messageMode: ActivityUse.#onChangeMessageMode
    },
    position: {
      width: 425,
      height: "auto"
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    const { args = {}, actor, item, roll = {}, message = {} } = options;
    const targeting = item?.system?.targeting ?? null;

    // Arguments
    args.noTargeting ??= targeting ? false : true;
    args.noRoll ??= roll.attribute.key ? false : true;
    args.skipApp ??= false;

    // Item Properties
    const itemProperties = {
      isWeapon: item?.system?.subtype === 'weapon' ?? false,
      isAttack: (item?.system?.subtype === 'weapon' || roll?.against?.key === 'def') ?? false,
      isMagical: item?.system?.magical,
      isSpell: item?.type === 'spell' ?? false
    }

    // Roll
    roll.attribute ??= {};
    roll.attribute.key ??= item?.system?.attribute ?? null;

    roll.boons ??= {};
    roll.boons.applyAttack ??= itemProperties.isAttack;
    roll.boons.applySpell ??= itemProperties.isSpell;
    roll.boons.situational ??= 0;

    roll.against ??= {};
    roll.against?.key ?? item?.system?.against ?? null;

    // Additional options
    this.config = {
      args, actor, item, roll, message, itemProperties,
      token: actor.token
    }

    return options = super._initializeApplicationOptions(options);
  }

  /* -------------------------------------------- */

  static PARTS = {
    /*header: {
      template: 'systems/weirdwizard/templates/apps/activity/header.hbs'
    },*/
    body: {
      template: 'systems/weirdwizard/templates/apps/activity/body.hbs',
      scrollable: ['.standard-form'],
      templates: [
        'systems/weirdwizard/templates/apps/activity/roll.hbs',
        'systems/weirdwizard/templates/apps/activity/roll-details.hbs',
        'systems/weirdwizard/templates/apps/activity/targeting.hbs'
      ]
    },
    footer: {
      template: 'systems/weirdwizard/templates/apps/activity/footer.hbs'
    }
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    const { constructor: id, name, type } = this.config.item ?? this.config.actor;
    return `${_loc("WW.Activity.Label")}: ${name ?? id}`;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async _prepareContext(options = {}) {
    const context = {
      ...await super._prepareContext(options),
      ...this.config
    };
    
    const item = context.item;
    const sys = context.actor.system;

    // Attribute variables
    const attKey = context.roll.attribute.key;
    const attMod = sys.attributes[attKey]?.mod ? plusify(sys.attributes[attKey].mod) : '+0';
    const attLabel = _loc(CONFIG.WW.ROLL_ATTRIBUTES[attKey]);
    const flatMod = context.roll.flatMod;

    // Prepare attribute display
    const attDisplay = (attLabel ? `${attLabel} (${attMod})` : '1d20 + 0') + (flatMod ? ` + ${flatMod}` : '');

    // Boons
    const boons = {
      actor: sys.boons,
      fixed: context.roll?.boons?.fixed ?? (item?.system?.boons ? item.system.boons : 0),
      fromEffects: sys.boons.selfRoll[attKey] ? sys.boons.selfRoll[attKey] : 0, // Conditional boons should be added here later
      forAttacks: sys.boons.selfRoll.attacks,
      forSpells: sys.boons.selfRoll.spells,
      situational: context.roll.boons.situational,
      applyAttack: context.roll.boons.applyAttack,
      applySpell: context.roll.boons.applySpell
    };

    // Calculate and display final boons
    let boonsFinal = 0;

    if (boons.situational) boonsFinal += boons.situational; // Add situational boons input value
    if (boons.fromEffects) boonsFinal += boons.fromEffects; // If there are boons or banes applied by Active Effects, add it
    if (boons.applyAttack && boons.forAttacks) boonsFinal += boons.forAttacks;
    if (boons.applySpell && boons.forAttacks) boonsFinal += boons.forSpells;
    if (boons.fixed) boonsFinal += boons.fixed; // If there are fixed boons or banes, add it

    // Prepare boons display
    let boonsDisplay = '';

    if (boonsFinal > 1) {
      boonsDisplay = " " + _loc("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + _loc("WW.Boons.Boons");
    } else if (boonsFinal > 0) {
      boonsDisplay = " " + _loc("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + _loc("WW.Boons.Boon");
    } else if (boonsFinal < -1) {
      boonsDisplay = " " + _loc("WW.Boons.With") + " " + boonsFinal * -1 + " " + _loc("WW.Boons.Banes");
    } else if (boonsFinal < 0) {
      boonsDisplay = " " + _loc("WW.Boons.With") + " " + boonsFinal * -1 + " " + _loc("WW.Boons.Bane");
    }

    // Merge boons
    context.roll.boons = {
      ...context.roll.boons,
      ...boons,
      final: boonsFinal,
      abs: Math.abs(boonsFinal),
      display: plusify(boonsFinal)
    };

    // Prepare against display
    const against = context.roll.against;
    const customTn = context.roll.against.customTn;
    let againstDisplay = ` ${_loc('WW.Roll.Against.Label').toLowerCase()} `;
    
    if (customTn) againstDisplay += customTn;
    else if (against.key) {
      switch (against.key) {
        case 'def': {
          againstDisplay += _loc('WW.Defense.Label');
          break;
        }
        case 'str': {
          againstDisplay += _loc('WW.Attributes.Strength');
          break;
        }
        case 'agi': {
          againstDisplay += _loc('WW.Attributes.Agility');
          break;
        }
        case 'int': {
          againstDisplay += _loc('WW.Attributes.Intellect');
          break;
        }
        case 'wil': {
          againstDisplay += _loc('WW.Attributes.Will');
          break;
        }
      }
    } else againstDisplay = '';

    // Merge roll context
    foundry.utils.mergeObject(context.roll, {
      expression: attDisplay + boonsDisplay + againstDisplay,
      flatModAbs: Math.abs(context.roll.flatMod),
      attribute: {
        mod: attMod,
        icon: CONFIG.WW.ATTRIBUTE_ICONS[attKey] ?? null,  
        label: attLabel
      },
      against: {
        tn: context.roll.against.customTn ?? 10,
        icon: CONFIG.WW.ATTRIBUTE_ICONS[against.key] ?? 'systems/weirdwizard/assets/ui/badges/octagonal.svg',
        label: CONFIG.WW.ROLL_AGAINST[against.key]
      }
    });

    // Prepare targets
    if (this.targets.length) {
      const targets = [];
      
      this.targets.forEach(tar => {
        // Boons against count
        let boonsAgainst = 0;
        if (tar.boonsAgainst) boonsAgainst += tar.boonsAgainst[against.key];
        if (context.itemProperties.isAttack) boonsAgainst += tar.boonsAgainst.fromAttacks;
        if (context.itemProperties.isSpell) boonsAgainst += tar.boonsAgainst.fromSpells;
        if (context.itemProperties.isMagical) boonsAgainst += tar.boonsAgainst.fromMagical + tar.boons.resistMagical;

        targets.push({
          img: tar.img,
          name: tar.name,
          boonsNo: boonsAgainst,
          boonsIcon: `systems/weirdwizard/assets/icons/rolling-${boonsAgainst > 0 ? 'boons' : 'banes'}-colored.svg`,
          boonsTip: boonsAgainst > 0 ? _loc('WW.Boons.ExtraBoons') : _loc('WW.Boons.ExtraBanes'),
          againstNo: tar.againstNo,
          autoSuccess: against.key ? !!tar.autoSuccessAgainst?.[against.key] : false
        })

      });

      context.targets = targets;
    }
    context.needTargets = item?.needTargets;

    // Targeting Modes
    if (context.targeting) {
      const targetingRestriction = context.targeting.restriction ?? 'any';
      context.targetingRestrictions = Object.entries(CONFIG.WW.TARGETING_RESTRICTIONS).map(([action, label]) => {
        return {label, action, active: action === targetingRestriction};
      });
    }
    
    // Message Modes
    const messageMode = game.settings.get("core", "messageMode");
    context.messageModes = Object.entries(CONFIG.ChatMessage.modes).map(([action, {label, icon}]) => {
      return {icon, label, action, active: action === messageMode};
    });

    // Dropdown select options
    context.attributeMods = Object.fromEntries(Object.entries(CONFIG.WW.ROLL_ATTRIBUTES).map(([key, loc]) => {
      const attributes = context.actor.system.attributes;
      const label = `${_loc(loc)} (${plusify(attributes[key]?.mod) ?? '+0'})`;

      return [key, key ? label : _loc(loc)];
    }));

    context.againstKeys = CONFIG.WW.ROLL_AGAINST;
    
    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static #onToggleRollDetails(event, target) {
    const open = target.parentNode.open;
    
    this.config.args.rollDetailsOpen = !open;
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static #changeSituationalBoons(event, target) {
    const parent = target.closest('.adjustment-widget');
    const action = target.dataset.action;

    if (action === 'situationalUp') {
      this.config.roll.boons.situational++;
    } else {
      this.config.roll.boons.situational--;
    }
    
    this.render();
  }

  /* -------------------------------------------- */
  /*  Targeting actions                           */
  /* -------------------------------------------- */

  /**
   * Prompt target selection.
   */
  static #selectTargets() {
    const context = {
      activityApp: this,
      actor: this.config.actor
    }

    // Activate TargetingHUD app
    new TargetingHUD(context).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Scene region selection.
   */
  static #placeTemplate() {
    this.config.item.placeTemplate({ origin: this });
  }

  /* -------------------------------------------- */

  /**
   * Handle changing the targeting restriction.
   * @type {ApplicationClickAction}
   */
  static #onChangeTargetingRestriction(event, target) {
    const restriction = target.dataset.restriction;
    
    this.targeting.restriction = restriction;
    this.render();
  }

  /* -------------------------------------------- */
  /*  Other actions                               */
  /* -------------------------------------------- */

  /**
   * Handle changing the message mode.
   * @type {ApplicationClickAction}
   */
  static #onChangeMessageMode(event, target) {
    const mode = target.dataset.mode;
    game.settings.set("core", "messageMode", mode);
    this.render();
  }

  /* -------------------------------------------- */
  /*  Lifecycle & Form handling                   */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    
    const formData = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.element).object);

    this._refreshInputs(formData);

    // Ensures the next input can be selected before re-rendering, maintaining focus while transitioning inputs.
    setTimeout(() => this.render(), 20);
  }

  /* -------------------------------------------- */

  /**
   * Refresh all inputs based on changed values.
   * @param {Record<string, unknown>} formData
   */
  _refreshInputs(formData) {
    for (const [key1, value1] of Object.entries(formData)) {
      for (const [key2, value2] of Object.entries(value1)) {
        this.config[key1][key2] = value2;
      }
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    formData = super._processFormData(event, form, formData);
    console.log('form submitted')
    /*const config = {
      rolls: [this.config.roll],
      skill: null,
      messageMode: this.config.message.mode,
    };

    if (formData.skill) config.skill = formData.skill;*/

    //return config;
  }
  
  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static async #confirm(event, target) {
    const { attribute, boons, against, flatMod } = this.config.roll;
    const rollData = this.config.actor.getRollData();
    const rollOptions = {
      template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
      actor: this.config.actor,
      item: this.config.item,
      originUuid: this.config.item ? this.config.item.uuid : this.config.actor.uuid, // TODO: Replace with item/actor
      attribute: attribute.key,
      against: against.key,
      instEffs: this.instEffs,
      actEffs: this.actEffs
    };
    const rollsArray = [];
    let rollHtml = '', boonsDisplay = "0";

    // Check if targeted
    const targeted = game.user.targets?.size ? true : false;

    if (targeted && against.key) { // If Action is Targeted and Against is filled: perform one separate roll for each target
      
      for (const tar of this.targets) {
        // Set boons text
        let boonsAgainst = 0;
        if (tar.boonsAgainst) boonsAgainst += tar.boonsAgainst[against.key];
        if (this.config.itemProperties.isAttack) boonsAgainst += tar.boonsAgainst.fromAttacks;
        if (this.config.itemProperties.isSpell) boonsAgainst += tar.boonsAgainst.fromSpells;
        if (this.config.itemProperties.isMagical) boonsAgainst += tar.boonsAgainst.fromMagical;

        const boonsNo = parseInt(boons.final) + boonsAgainst;

        if (boonsNo != 0) {
          boonsDisplay = (boonsNo < 0 ? "" : "+") + boonsNo + "d6kh"
        } else {
          boonsDisplay = "";
        };

        // Determine the rollFormula
        const rollFormula = [
          "1d20",
          (attribute.key && attribute.key !== 'luck') ? `${attribute.mod}[${_loc(CONFIG.WW.ATTRIBUTES_SHORT[attribute.key])}]` : null,
          flatMod ? flatMod + `[${_loc("WW.Roll.Flat")}]` : null,
          boonsDisplay ? boonsDisplay + `[${_loc(boons.final < 0 ? "WW.Roll.Banes" : "WW.Roll.Boons")}]` : null
        ].filterJoin(" + ");

        // Determine target number
        const targetNo = against.key === 'def' ? tar.defense : tar.attributes[against.key].value;

        const autoSuccess = against.key ? !!tar.autoSuccessAgainst?.[against.key] : false;
        
        // Construct the Roll instance and evaluate the roll
        const roll = await new WWRoll(rollFormula, rollData, {
          ... rollOptions,
          target: tar,
          targetNo,
          autoSuccess
        }).evaluate();
        
        // Prepare DSN data
        const index = this.targets.findIndex(obj => { return obj.id === tar.id; });
        this.prepareDSN(roll, index);

        // Push roll to roll array
        rollsArray.push(roll);
      }

    } else { // Not targeted and Against is false: perform a SINGLE ROLL for all targets
      // Set boons text
      if (boons.final != 0) { boonsDisplay = boons.final + "d6kh" } else { boonsDisplay = ""; };
      
      // Determine the rollFormula
      const rollFormula = [
        "1d20",
        (attribute.key && attribute.key !== 'luck') ? `${attribute.mod}[${_loc(CONFIG.WW.ATTRIBUTES_SHORT[attribute.key])}]` : null,
        flatMod ? flatMod + `[${_loc("WW.Roll.Flat")}]` : null,
        boonsDisplay ? boonsDisplay + `[${_loc(boons.final < 0 ? "WW.Roll.Banes" : "WW.Roll.Boons")}]` : null
      ].filterJoin(" + ");

      // Set targetNo to the custom; 10 is used otherwise
      const targetNo = against.customTn ?? 10;

      // Construct the Roll instance and evaluate the roll
      const roll = await new WWRoll(rollFormula, rollData, {
        ... rollOptions,
        targetNo
      }).evaluate();

      // Prepare DSN data
      this.prepareDSN(roll, 0);

      // Push roll to roll array
      rollsArray.push(roll);
    }
    
    // Create message data
    const msg = this.config.message;
    const messageData = {
      ...msg,
      type: 'd20-roll',
      rolls: rollsArray,
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.config.actor }),
      sound: CONFIG.sounds.dice,
      'flags.weirdwizard': {
        icon: msg.icon ?? (this.config.item.img ?? null),
        item: this.config.item?.uuid,
        rollHtml: rollHtml,
        emptyContent: !msg.content ?? true
      }
    }
    
    // Apply roll mode and send to chat
    await ChatMessage.applyMode(messageData, game.settings.get('core', 'messageMode'));
    await ChatMessage.create(messageData);

    // Submit, close app and turn off target token hook
    this.close({ submit: true });
  }

  /* -------------------------------------------- */

  prepareDSN(roll, index) {
    for (let i = 0; i < roll.dice.length; i++) {
      roll.dice[i].options.rollOrder = index;

      const exp = roll.dice[i].expression;
      if (exp.includes('d20')) {
        roll.dice[i].options.appearance = {
          colorset: 'wwd20',
          texture: 'stars',
          material: 'metal',
          font: 'Amiri',
          foreground: '#FFAE00', // Label Color
          background: "#AE00FF", // Dice Color
          outline: '#FF7B00',
          edge: '#FFAE00',
          material: 'metal',
          font: 'Amiri',
          default: true
        };
      }

      if (exp.includes('d6')) {
        const sub = roll.formula.substring(0, roll.formula.indexOf(exp)).trim();
        const sign = sub.slice(-1);

        if (sign === '+') { // Boon dice
          roll.dice[i].options.appearance = {
            colorset: 'wwboon',
            texture: 'stars',
            material: 'metal',
            font: 'Amiri',
            foreground: '#FFAE00', // Label Color
            background: "#4394FE", // Dice Color
            outline: '#FF7B00',
            edge: '#FFAE00',
            material: 'metal',
            font: 'Amiri'
          };

        } else if (sign === '-') { // Bane dice
          roll.dice[i].options.appearance = {
            colorset: 'wwbane',
            texture: 'stars',
            material: 'metal',
            font: 'Amiri',
            foreground: '#FFAE00', // Label Color
            background: "#C70000", // Dice Color
            outline: '#FF7B00',
            edge: '#FFAE00',
            material: 'metal',
            font: 'Amiri'
          };
        }
      }
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _onClose(options) {
    super._onClose(options);
    
    // Turn off targeting hook
    Hooks.off('targetToken');

    // Maximize related Actor sheet
    if (this.config.actor) this.config.actor.sheet.maximize();
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  get targets() {
    const targets = [];

    game.user.targets.forEach(tar => {
      const tokenDoc = tar.document;
      const actor = tokenDoc.actor;
      const sys = actor?.system;

      // Allow only Characters and NPCs
      if (actor.type === 'character' || actor.type === 'npc') {
        let against = this.config.roll.against.key ? sys.attributes[this.config.roll.against.key]?.value : null;
        if (this.config.roll.against.key === 'def') against = sys.stats.defense.total;
        
        targets.push({
          id: tar.id,
          uuid: tokenDoc.uuid,
          img: tokenDoc.texture.src,
          name: game.weirdwizard.utils.getAlias({ token: tokenDoc, actor: actor }),
          attributes: sys.attributes,
          defense: sys.stats.defense.total,
          againstNo: against,
          boons: sys.boons.selfRoll,
          boonsAgainst: sys.boons.against,
          autoSuccessAgainst: sys.autoSuccess.against
        });
      }

    });

    return targets;
  }

  /* -------------------------------------------- */

  get actEffs() {
    const effs = {
      onUse: [],
      onSuccess: [],
      onCritical: [],
      onFailure: []
    }
    
    this.config.item?.effects?.forEach(effect => {
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

  /* -------------------------------------------- */

  get instEffs() {
    const effs = {
      onUse: [],
      onSuccess: [],
      onCritical: [],
      onFailure: []
    }

    // Return earlier if there is no item
    if (!this.config.item) return effs;

    // Add Weapon Damage
    const itemSystem = this.config.item.system;
    const weaponDamage = (itemSystem.subtype == 'weapon' && itemSystem.damage) ? itemSystem.damage : 0;
    
    if (weaponDamage) {
      const eff = {
        label: 'damage',
        item: this.config.item,
        value: weaponDamage
      };
      
      effs.onSuccess.push(eff);
      effs.onCritical.push(eff);
    }
    
    // Add Instant Effects
    this.config.item.system.instant.forEach(e => {
      
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

  /* -------------------------------------------- */

  _getTargetIds(targets, effTarget) {
    let targetIds = '';

    function compareDispo(effTarget, compared) {
      const dispo = canvas.tokens.get(compared)?.document?.disposition;
      
      if ((effTarget === 'allies') && (dispo === 1)) return true;
      else if ((effTarget === 'enemies') && (dispo === -1)) return true;
      else if (effTarget === 'tokens') return true;
      else return false;
    }

    targets.forEach(tar => {
      if (compareDispo(effTarget, tar.id)) {
        if (targetIds) targetIds += ',';

        targetIds += tar.id;
      }
    })

    return targetIds;
  }

}