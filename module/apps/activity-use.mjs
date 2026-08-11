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
    
    const { actor, item, roll, msg, args } = config;

    // Documents
    this.actor = actor;
    this.item = item ?? null;
    this.token = actor.token;

    // Config
    this.roll = roll;
    this.msg = msg;
    this.targeting = item?.system?.targeting ?? null;

    // Arguments
    this.args = {
      noTargeting: options.noTargeting ?? (this.targeting ? false : true),
      noRoll: options.noRoll ?? (roll.attribute.key ? false: true),
      skipApp: options.skipApp ?? false
    }

    // Item Properties
    this.itemProperties = {
      isWeapon: item?.system?.subtype === 'weapon' ?? false,
      isAttack: (item?.system?.subtype === 'weapon' || roll?.against?.key === 'def') ?? false,
      isMagical: item?.system?.magical,
      isSpell: item?.type === 'spell' ?? false
    };

    // Default Form Data Values
    this.formData = {
      applyAttackBoons: this.itemProperties.isWeapon ?? false,
      applySpellBoons: this.itemProperties.isSpell ?? false,
      situationalBoons: 0
    }

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
    form: {
      handler: this.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 425,
      height: "auto"
    }
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
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async _prepareContext(options = {}) {
    const context = {
      ...await super._prepareContext(options),

      args: this.args,
      roll: this.roll,
      msg: this.msg,
      itemProperties: this.itemProperties,
    };
    
    const item = this.item;
    const sys = this.actor.system;

    // Get and prepare form input variables
    const { applyAttackBoons, applySpellBoons, customTn, flatMod, situationalBoons } = this.formData;
    context.inputs = this.formData ?? { applyAttackBoons, applySpellBoons, situationalBoons };

    // Attribute variables
    const attKey = this.roll.attribute.key;
    const attMod = sys.attributes[attKey]?.mod ? plusify(sys.attributes[attKey].mod) : '+0';
    const attLabel = _loc(CONFIG.WW.ROLL_ATTRIBUTES[attKey]);

    // Prepare attribute display
    const attDisplay = (attLabel ? `${attLabel} (${attMod})` : '1d20 + 0') + (flatMod ? ` + ${flatMod}` : '');

    // Boons
    const boons = {
      actor: sys.boons,
      fixed: this.roll?.boons?.fixed ?? (item?.system?.boons ? item.system.boons : 0),
      fromEffects: sys.boons.selfRoll[attKey] ? sys.boons.selfRoll[attKey] : 0, // Conditional boons should be added here later
      forAttacks: sys.boons.selfRoll.attacks,
      forSpells: sys.boons.selfRoll.spells
    };

    // Calculate and display final boons
    let boonsFinal = 0;

    if (situationalBoons) boonsFinal += situationalBoons; // Add situational boons input value
    if (boons.fromEffects) boonsFinal += boons.fromEffects; // If there are boons or banes applied by Active Effects, add it
    if (applyAttackBoons && boons.forAttacks) boonsFinal += boons.forAttacks;
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
    this.roll.boons = {
      ...this.roll.boons,
      ...boons,
      final: boonsFinal,
      abs: Math.abs(boonsFinal),
      display: plusify(boonsFinal)
    };

    // Prepare against display
    const against = item?.system?.against ?? null;
    let againstDisplay = ` ${_loc('WW.Roll.Against').toLowerCase()} `;
    
    if (customTn) againstDisplay += customTn;
    else if (against) {
      switch (against) {
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
    foundry.utils.mergeObject(this.roll, {
      expression: attDisplay + boonsDisplay + againstDisplay,
      flatMod: flatMod,
      flatModAbs: Math.abs(flatMod),
      attribute: {
        mod: attMod,
        icon: CONFIG.WW.ATTRIBUTE_ICONS[attKey] ?? null,  
        label: attLabel
      },
      against: {
        key: against,
        tn: customTn ?? 10,
        icon: CONFIG.WW.ATTRIBUTE_ICONS[against] ?? 'systems/weirdwizard/assets/ui/badges/cross-grey.svg',
        label: CONFIG.WW.ROLL_AGAINST[against]
      }
    });

    // Targets display
    if (this.targets.length) {
      const targets = [];
      
      this.targets.forEach(tar => {
        // Boons against count
        let boonsAgainst = 0;
        if (tar.boonsAgainst) boonsAgainst += tar.boonsAgainst[against];
        if (this.itemProperties.isAttack) boonsAgainst += tar.boonsAgainst.fromAttacks;
        if (this.itemProperties.isSpell) boonsAgainst += tar.boonsAgainst.fromSpells;
        if (this.itemProperties.isMagical) boonsAgainst += tar.boonsAgainst.fromMagical + tar.boons.resistMagical;
        
        // Boons display
        const boonsNo = boonsAgainst;
        const boonsTip = boonsNo > 0 ? _loc('WW.Boons.ExtraBoons') : _loc('WW.Boons.ExtraBanes');
        const boonsIcon = boonsNo > 0 ? 'boons-colored' : 'banes-colored';
        
        const againstIcon = CONFIG.WW.ATTRIBUTE_ICONS[against];
        const againstLabel = CONFIG.WW.ROLL_AGAINST[against];
        
        const autoSuccess = against ? !!tar.autoSuccessAgainst?.[against] : false;

        targets.push({
          img: tar.img,
          name: tar.name,
          boonsNo,
          boonsIcon: 'systems/weirdwizard/assets/icons/' + boonsIcon + '.svg',
          boonsTip,
          againstNo: tar.againstNo,
          againstLabel,
          againstIcon,
          autoSuccess
        })

      });

      context.targets = targets;
    }

    // Targeting Modes
    if (this.targeting) {
      const targetingRestriction = this.targeting.restriction ?? 'any';
      context.targetingRestrictions = Object.entries(CONFIG.WW.TARGETING_RESTRICTIONS).map(([action, label]) => {
        return {label, action, active: action === targetingRestriction};
      });
    }
    
    // Message Modes
    const messageMode = game.settings.get("core", "messageMode");
    context.messageModes = Object.entries(CONFIG.ChatMessage.modes).map(([action, {label, icon}]) => {
      return {icon, label, action, active: action === messageMode};
    });
    
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
    
    this.args.rollDetailsOpen = !open;
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
      this.formData.situationalBoons++;
    } else {
      this.formData.situationalBoons--;
    }
    
    this.render();
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static async #confirm(event, target) {
    const { attMod, attKey } = this.roll;
    const { against } = this.roll.against.key;
    const boonsFinal = this.roll.boons.final,
      targeted = game.user.targets?.size ? true : false,
      flatMod = this.formData.flatMod,
      rollData = this.actor.getRollData(),
      rollsArray = [];
    const rollOptions = {
      template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
      actor: this.actor,
      item: this.item,
      originUuid: this.item ? this.item.uuid : this.actor.uuid, // TODO: Replace with item/actor
      attribute: attKey,
      against: against,
      instEffs: this.instEffs,
      actEffs: this.actEffs
    };
    
    let rollHtml = '', boons = "0";
    
    if (targeted && against) { // If Action is Targeted and Against is filled: perform one separate roll for each target
      
      for (const tar of this.targets) {
        
        // Set boons text
        let boonsAgainst = 0;
        if (tar.boonsAgainst) boonsAgainst += tar.boonsAgainst[against];
        if (this.itemProperties.isAttack) boonsAgainst += tar.boonsAgainst.fromAttacks;
        if (this.itemProperties.isSpell) boonsAgainst += tar.boonsAgainst.fromSpells;
        if (this.itemProperties.isMagical) boonsAgainst += tar.boonsAgainst.fromMagical;

        const boonsNo = parseInt(boonsFinal) + boonsAgainst;

        if (boonsNo != 0) { boons = (boonsNo < 0 ? "" : "+") + boonsNo + "d6kh" } else { boons = ""; };

        // Determine the rollFormula
        const rollFormula = [
          "1d20",
          (attKey && attKey !== 'luck') ? `${attMod}[${_loc(CONFIG.WW.ATTRIBUTES_SHORT[attKey])}]` : null,
          flatMod ? flatMod + `[${_loc("WW.Roll.Flat")}]` : null,
          boons ? boons + `[${_loc(boonsFinal < 0 ? "WW.Roll.Banes" : "WW.Roll.Boons")}]` : null
        ].filterJoin(" + ");

        // Determine target number
        const targetNo = against === 'def' ? tar.defense : tar.attributes[against].value;

        const autoSuccess = against ? !!tar.autoSuccessAgainst?.[against] : false;
        
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
      if (boonsFinal != 0) { boons = boonsFinal + "d6kh" } else { boons = ""; };
      
      // Determine the rollFormula
      const rollFormula = [
        "1d20",
        (attKey && attKey !== 'luck') ? `${attMod}[${_loc(CONFIG.WW.ATTRIBUTES_SHORT[attKey])}]` : null,
        flatMod ? flatMod + `[${_loc("WW.Roll.Flat")}]` : null,
        boons ? boons + `[${_loc(boonsFinal < 0 ? "WW.Roll.Banes" : "WW.Roll.Boons")}]` : null
      ].filterJoin(" + ");

      // Set targetNo to the custom; 10 is used otherwise
      const targetNo = this.formData.customTn ?? 10;

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
    const messageData = {
      ...this.msg,
      icon: this.msg.icon ?? (this.item.img ?? null),
      type: 'd20-roll',
      rolls: rollsArray,
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
      sound: CONFIG.sounds.dice,
      'flags.weirdwizard': {
        icon: this.msg.icon,
        item: this.item?.uuid,
        rollHtml: rollHtml,
        emptyContent: !this.msg.content ?? true
      }
    }
    
    // Apply roll mode and send to chat
    await ChatMessage.applyMode(messageData, game.settings.get('core', 'messageMode'));
    await ChatMessage.create(messageData);

    // Submit, close app and turn off target token hook
    this.close({ submit: true });
    Hooks.off('targetToken');
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
  /*  Targeting actions                           */
  /* -------------------------------------------- */

  /**
   * Prompt target selection.
   */
  static #selectTargets() {
    const context = {
      activityApp: this,
      actor: this.actor
    }

    // Activate TargetingHUD app
    new TargetingHUD(context).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Scene region selection.
   */
  static #placeTemplate() {
    this.item.placeTemplate({ origin: this });
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
    this.formData = formData.object;
    
    return this.render();
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /** @override */
  get title() {
    const { constructor: id, name, type } = this.item ?? this.actor;
    return `${_loc("WW.Activity.Label")}: ${name ?? id}`;
  }
  
  /* -------------------------------------------- */

  get targets() {
    const targets = [];

    game.user.targets.forEach(tar => {
      const tokenDoc = tar.document;
      const actor = tokenDoc.actor;
      const sys = actor?.system;

      // Allow only Characters and NPCs
      if (actor.type === 'character' || actor.type === 'npc') {
        let against = this.roll.against ? sys.attributes[this.roll.against]?.value : null;
        if (this.roll.against === 'def') against = sys.stats.defense.total;
        
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
    
    this.item?.effects?.forEach(effect => {
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
    if (!this.item) return effs;

    // Add Weapon Damage
    const itemSystem = this.item.system;
    const weaponDamage = (itemSystem.subtype == 'weapon' && itemSystem.damage) ? itemSystem.damage : 0;
    
    if (weaponDamage) {
      const eff = {
        label: 'damage',
        item: this.item,
        value: weaponDamage
      };
      
      effs.onSuccess.push(eff);
      effs.onCritical.push(eff);
    }
    
    // Add Instant Effects
    this.item.system.instant.forEach(e => {
      
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