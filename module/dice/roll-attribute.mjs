import { i18n, plusify } from '../helpers/utils.mjs';
import WWRoll from './roll.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * An attribute and luck roll app
 * @extends {ApplicationV2}
*/
export default class RollAttribute extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(config) {
    super(); // Required for "this." to work

    const { action, actor, attKey, baseHtml, content, fixedBoons, icon, item, label } = config;
    const sys = actor.system;
    console.log(actor)

    // Documents
    this.actor = actor;
    this.item = item ?? null;
    this.token = actor.token;

    // Roll Configuration
    this.rollConfig = {
      baseHtml, action, label, content,
      icon: icon ?? (item ? item.img : null),
      attKey: attKey,
      attLabel: i18n(CONFIG.WW.ROLL_ATTRIBUTES[attKey]),
      attMod: sys.attributes[attKey]?.mod ? plusify(sys.attributes[attKey].mod) : '+0',
      against: item?.system?.against ?? null
    };

    // Roll Parameters
    this.boonsConfig = {
      actor: sys.boons,
      fixed: fixedBoons ?? (item?.system?.boons ? item.system.boons : 0),
      fromEffects: sys.boons.selfRoll[attKey] ? sys.boons.selfRoll[attKey] : 0, // Conditional boons should be added here later
      forAttacks: sys.boons.selfRoll.attacks,
      forSpells: sys.boons.selfRoll.spells,
      final: 0
    };
    
    // Tags
    this.tags = {
      isWeapon: this.item?.system?.subtype === 'weapon' ?? false,
      isAttack: (this.item?.system?.subtype === 'weapon' || this.rollConfig.against === 'def') ?? false,
      isMagical: this.item?.system?.magical,
      isSpell: this.item?.type === 'spell' ?? false
    };

    // Default Form Data Values
    this.formData = {
      applyAttackBoons: this.tags.isWeapon ?? false,
      applySpellBoons: this.tags.isSpell ?? false,
      situationalBoons: 0
    }

  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['weirdwizard', 'roll-attribute'],
    window: {
      title: this.title,
      icon: 'fa-solid fa-dice-d20',
      resizable: true
    },
    actions: {
      situationalUp: RollAttribute.#changeSituationalBoons,
      situationalDown: RollAttribute.#changeSituationalBoons,
      submitRoll: RollAttribute.#submitRoll,
      cancelRoll: RollAttribute.#cancelRoll
    },
    form: {
      handler: this.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 400,
      height: "auto"
    }
  }

  /* -------------------------------------------- */

  static PARTS = {
    main: {
      template: 'systems/weirdwizard/templates/apps/roll-attribute.hbs',
      scrollable: []
    }
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async _prepareContext(options = {}) {
    const context = {
      ...await super._prepareContext(options),

      rollConfig: this.rollConfig,
      boonsConfig: this.boonsConfig,
      tags: this.tags,
      targeted: this.rollConfig.action === 'targeted-use' ?? false,
    };

    // Destructure variables
    const { against, attLabel, attMod } = this.rollConfig;
    const { fixed, forAttacks, forSpells, fromEffects } = this.boonsConfig;
    const { applyAttackBoons, applySpellBoons, customTn, flatMod, situationalBoons } = this.formData;
    
    // Prepare input context
    context.inputs = this.formData ?? { applyAttackBoons, applySpellBoons, situationalBoons };

    // Prepare attribute display
    const attDisplay = (attLabel ? `${attLabel} (${attMod})` : '1d20 + 0') + (flatMod ? ` + ${flatMod}` : '');

    // Calculate and display final boons
    let boonsFinal = 0;

    if (situationalBoons) boonsFinal += situationalBoons; // Add situational boons input value
    if (fromEffects) boonsFinal += fromEffects; // If there are boons or banes applied by Active Effects, add it
    if (applyAttackBoons && forAttacks) boonsFinal += forAttacks;
    if (fixed) boonsFinal += fixed; // If there are fixed boons or banes, add it

    this.boonsConfig.final = boonsFinal;
    context.boonsFinal = plusify(boonsFinal);

    // Prepare boons display
    let boonsDisplay = '';

    if (boonsFinal > 1) {
      boonsDisplay = " " + i18n("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + i18n("WW.Boons.Boons");
    } else if (boonsFinal > 0) {
      boonsDisplay = " " + i18n("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + i18n("WW.Boons.Boon");
    } else if (boonsFinal < -1) {
      boonsDisplay = " " + i18n("WW.Boons.With") + " " + boonsFinal * -1 + " " + i18n("WW.Boons.Banes");
    } else if (boonsFinal < 0) {
      boonsDisplay = " " + i18n("WW.Boons.With") + " " + boonsFinal * -1 + " " + i18n("WW.Boons.Bane");
    }

    // Prepare against display
    let againstDisplay = ` ${i18n('WW.Roll.Against').toLowerCase()} `;
    
    if (customTn) againstDisplay += customTn;
    else if (against) {
      switch (against) {
        case 'def': {
          againstDisplay += i18n('WW.Defense.Label');
          break;
        }
        case 'str': {
          againstDisplay += i18n('WW.Attributes.Strength');
          break;
        }
        case 'agi': {
          againstDisplay += i18n('WW.Attributes.Agility');
          break;
        }
        case 'int': {
          againstDisplay += i18n('WW.Attributes.Intellect');
          break;
        }
        case 'wil': {
          againstDisplay += i18n('WW.Attributes.Will');
          break;
        }
      }
    } else againstDisplay = '';

    // Prepare the final boons expression
    context.boonsExpression = attDisplay + boonsDisplay + againstDisplay;

    // Targets display
    if (this.targets.length) {
      const targets = [];
      
      this.targets.forEach(tar => {
        // Boons against count
        let boonsAgainst = 0;
        if (tar.boonsAgainst) boonsAgainst += tar.boonsAgainst[against];
        if (this.tags.isAttack) boonsAgainst += tar.boonsAgainst.fromAttacks;
        if (this.tags.isSpell) boonsAgainst += tar.boonsAgainst.fromSpells;
        if (this.tags.isMagical) boonsAgainst += tar.boonsAgainst.fromMagical + tar.boons.resistMagical;
        
        // Boons display
        const boonsNo = boonsAgainst;
        const boonsTip = boonsNo > 0 ? i18n('WW.Boons.ExtraBoons') : i18n('WW.Boons.ExtraBanes');
        const boonsIcon = boonsNo > 0 ? 'boons-colored' : 'banes-colored';
        
        const againstIcon = CONFIG.WW.ATTRIBUTE_ICONS[against];
        const againstLabel = CONFIG.WW.ROLL_AGAINST[against];
        
        targets.push({
          img: tar.img,
          name: tar.name,
          boonsNo,
          boonsIcon: '/systems/weirdwizard/assets/icons/' + boonsIcon + '.svg',
          boonsTip,
          againstNo: tar.againstNo,
          againstLabel,
          againstIcon
        })

      });

      context.targets = targets;
    }
    
    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
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
  static #cancelRoll(event, target) {
    this.close({ submit: false });
  }

  /* -------------------------------------------- */

  
  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static async #submitRoll(event, target) {
    const { against, attKey, attMod } = this.rollConfig;
    
    const boonsFinal = this.boonsConfig.final,
      targeted = (this.rollConfig.action === 'targeted-use' || game.user.targets?.size) ? true : false,
      flatMod = this.formData.flatMod,
      rollData = this.actor.getRollData(),
      rollsArray = [],
      rollOptions = {
        template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
        actor: this.actor,
        item: this.item,
        attribute: this.rollConfig.attKey,
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
        if (this.tags.isAttack) boonsAgainst += tar.boonsAgainst.fromAttacks;
        if (this.tags.isSpell) boonsAgainst += tar.boonsAgainst.fromSpells;
        if (this.tags.isMagical) boonsAgainst += tar.boonsAgainst.fromMagical;

        const boonsNo = parseInt(boonsFinal) + boonsAgainst;

        if (boonsNo != 0) { boons = (boonsNo < 0 ? "" : "+") + boonsNo + "d6kh" } else { boons = ""; };

        // Determine the rollFormula
        const rollFormula = [
          "1d20",
          (attKey && attKey !== 'luck') ? `${attMod}[${i18n(CONFIG.WW.ATTRIBUTES_SHORT[attKey])}]` : null,
          flatMod ? flatMod + `[${i18n("WW.Roll.Flat")}]` : null,
          boons ? boons + `[${i18n(boonsFinal < 0 ? "WW.Roll.Banes" : "WW.Roll.Boons")}]` : null
        ].filterJoin(" + ");

        // Determine target number
        const targetNo = against === 'def' ? tar.defense : tar.attributes[against].value;
        
        // Construct the Roll instance and evaluate the roll
        const roll = await new WWRoll(rollFormula, rollData, {
          ... rollOptions,
          target: t,
          targetNo
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
        (attKey && attKey !== 'luck') ? `${attMod}[${i18n(CONFIG.WW.ATTRIBUTES_SHORT[attKey])}]` : null,
        flatMod ? flatMod + `[${i18n("WW.Roll.Flat")}]` : null,
        boons ? boons + `[${i18n(boonsFinal < 0 ? "WW.Roll.Banes" : "WW.Roll.Boons")}]` : null
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
      type: 'd20-roll',
      rolls: rollsArray,
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
      flavor: this.rollConfig.label,
      content: this.rollConfig.content,
      sound: CONFIG.sounds.dice,
      'flags.weirdwizard': {
        icon: this.rollConfig.icon,
        item: this.item?.uuid,
        rollHtml: rollHtml,
        emptyContent: !this.rollConfig.content ?? true
      }
    }
    
    // Apply roll mode and send to chat
    await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    await ChatMessage.create(messageData);

    // Submit and close app
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
    return `${i18n('WW.Roll.Details')}: ${name ?? id}`;
  }
  
  /* -------------------------------------------- */

  get targets() {
    const targets = [];

    game.user.targets.forEach(tar => {
      const tDoc = tar.document;
      const actor = tDoc?.actor;
      const sys = actor?.system;
      
      targets.push({
        id: tar.id,
        uuid: tDoc.uuid,
        img: tDoc?.texture?.src,
        name: game.weirdwizard.utils.getAlias({ token: tDoc, actor: actor }),
        attributes: actor ? sys.attributes : null,
        defense: actor ? sys.stats.defense.total : null,
        againstNo: sys ? (this.rollConfig.against === 'def' ? sys.stats.defense.total : sys.attributes[this.rollConfig.against]?.value) : "—",
        boons: actor ? sys.boons.selfRoll : null,
        boonsAgainst: actor ? sys.boons.against : null
      })

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

  /* -------------------------------------------- */

  

}
