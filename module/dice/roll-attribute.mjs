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

    // Documents
    this.actor = actor;
    this.item = item ?? null;
    this.token = actor.token;

    // Roll Configuration
    console.log(attKey)
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
      fixed: fixedBoons ?? (item.system?.boons ? item.system.boons : 0),
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
      resizable: true,
      controls: [
        /*{
          action: "resyncDocuments",
          icon: "fa-solid fa-rotate",
          label: "WW.Index.ResyncDocuments",
          ownership: "VIEWER"
        }, {
          action: "createRollTable",
          icon: "fa-solid fa-dice",
          label: "WW.Index.RollTable.Text",
          ownership: "VIEWER"
        }*/
      ]
    },
    actions: {
      situationalUp: RollAttribute.#changeSituationalBoons,
      situationalDown: RollAttribute.#changeSituationalBoons,
      //roll: RollAttribute.#roll,
      //cancel: RollAttribute.#cancel
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
      targeted: this.action === 'targeted-use' ?? false,
    };

    // Destructure variables
    const { against, attLabel, attMod } = this.rollConfig;
    const { fixed, forAttacks, forSpells, fromEffects } = this.boonsConfig;
    const { applyAttackBoons, applySpellBoons, customTn, flatBonus, situationalBoons } = this.formData;
    
    // Prepare input context
    context.inputs = this.formData ?? { applyAttackBoons, applySpellBoons, situationalBoons };

    // Prepare attribute display
    const attDisplay = (attLabel ? `${attLabel} (${attMod})` : '1d20 + 0') + (flatBonus ? ` + ${flatBonus}` : '');

    // Calculate and display final boons
    let boonsFinal = this.boonsConfig.final;
    if (situationalBoons) boonsFinal += situationalBoons; // Add situational boons input value
    if (fromEffects) boonsFinal += fromEffects; // If there are boons or banes applied by Active Effects, add it
    if (applyAttackBoons && forAttacks) boonsFinal += forAttacks;
    if (fixed) boonsFinal += fixed; // If there are fixed boons or banes, add it
    
    boonsFinal = plusify(boonsFinal); // Add a + sign if positive

    context.boonsFinal = boonsFinal;

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
      
      this.targets.forEach(t => {
        // Boons against count
        let boonsAgainst = 0;
        if (t.boonsAgainst) boonsAgainst += t.boonsAgainst[against];
        if (this.tags.isAttack) boonsAgainst += t.boonsAgainst.fromAttacks;
        if (this.tags.isSpell) boonsAgainst += t.boonsAgainst.fromSpells;
        if (this.tags.isMagical) boonsAgainst += t.boonsAgainst.fromMagical + t.boons.resistMagical;
        console.log(t)
        
        // Boons display
        const boonsNo = boonsAgainst;
        const boonsTip = boonsNo > 0 ? i18n('WW.Boons.ExtraBoons') : i18n('WW.Boons.ExtraBanes');
        const boonsIcon = boonsNo > 0 ? 'boons-colored' : 'banes-colored';
        
        const againstIcon = CONFIG.WW.ATTRIBUTE_ICONS[against];
        const againstLabel = CONFIG.WW.ROLL_AGAINST[against];
        
        targets.push({
          img: t.img,
          name: t.name,
          boonsNo,
          boonsIcon: '/systems/weirdwizard/assets/icons/' + boonsIcon + '.svg',
          boonsTip,
          againstNo: t.againstNo,
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

  activateListeners(html) {
    super.activateListeners(html);

    // Handle closing the window without saving
    html.find('#boons-cancel').click(() => this.close({ submit: false }));

    // Update forms fields dynamically
    const el = html.find('input');
    el.change((ev) => this._updateFields(ev));
    el.change();

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

  async _updateObject(event, formData) { // Update actor data.
    const against = this.rollConfig.against,
      boonsFinal = this.boonsFinal,
      targeted = (this.action === 'targeted-use' || game.user.targets?.size) ? true : false,
      flatBonus = formData.flatBonus ? `+${formData.flatBonus}` : '',
      rollData = this.origin.getRollData();
    ;
    
    let rollHtml = '',
      boons = "0",
      rollsArray = []
    ;
    
    if (targeted && against) { // If Action is Targeted and Against is filled; perform one separate roll for each target
      
      for (const t of this.targets) {
        
        // Set boons text
        let boonsAgainst = 0;
        if (t.boonsAgainst) boonsAgainst += t.boonsAgainst[against];
        if (this.tags.isAttack) boonsAgainst += t.boonsAgainst.fromAttacks;
        if (this.tags.isSpell) boonsAgainst += t.boonsAgainst.fromSpells;
        if (this.tags.isMagical) boonsAgainst += t.boonsAgainst.fromMagical;

        const boonsNo = parseInt(boonsFinal) + boonsAgainst;

        if (boonsNo != 0) { boons = (boonsNo < 0 ? "" : "+") + boonsNo + "d6kh" } else { boons = ""; };

        // Determine the rollFormula
        const rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + flatBonus + boons;

        // Get and set target number
        const targetNo = against == 'def' ? t.defense : t.attributes[against].value;
        
        // Construct the Roll instance and evaluate the roll
        const r = await new WWRoll(rollFormula, rollData, {
          template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
          actor: this.actor,
          actor: this.item,
          target: t,
          attribute: this.attribute,
          against: against,
          targetNo: targetNo,
          instEffs: this.instEffs,
          actEffs: this.actEffs
        }).evaluate();
        
        // Save the roll order
        const index = this.targets.findIndex(obj => { return obj.id === t.id; });

        // Set the roll order and color dice for DSN
        for (let i = 0; i < r.dice.length; i++) {
          r.dice[i].options.rollOrder = index;

          const exp = r.dice[i].expression;
          if (exp.includes('d20')) {
            r.dice[i].options.appearance = {
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
            const sub = r.formula.substring(0, r.formula.indexOf(exp)).trim();
            const sign = sub.slice(-1);
            
            if (sign === '+') { // If a boon
              r.dice[i].options.appearance = {
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
            
            } else if (sign === '-') { // If a bane
              r.dice[i].options.appearance = {
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

        // Push roll to roll array
        rollsArray.push(r);

      }

    } else { // against is false; perform a SINGLE ROLL for all targets
      
      // Set boons text
      if (boonsFinal != 0) { boons = boonsFinal + "d6kh" } else { boons = ""; };

      // Determine the rollFormula
      const rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + flatBonus + boons;

      // Set targetNo to the custom; 10 is used otherwise
      const targetNo = formData.customTn ?? 10;

      // Construct the Roll instance and evaluate the roll
      
      const r = await new WWRoll(rollFormula, rollData, {
        template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
        actor: this.actor,
        item: this.item,
        attribute: this.attribute,
        against: against,
        targetNo: targetNo,
        instEffs: this.instEffs,
        actEffs: this.actEffs
      }).evaluate();

      // Set the roll order and color dice for DSN
      for (let i = 0; i < r.dice.length; i++) {
        r.dice[i].options.rollOrder = 0;

        const exp = r.dice[i].expression;
        if (exp.includes('d20')) {
          r.dice[i].options.appearance = {
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
          const sub = r.formula.substring(0, r.formula.indexOf(exp)).trim();
          const sign = sub.slice(-1);
          
          if (sign === '+') { // If a boon
            r.dice[i].options.appearance = {
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
          
          } else if (sign === '-') { // If a bane
            r.dice[i].options.appearance = {
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

      // Push roll to roll array
      rollsArray.push(r);
    }
    
    // Create message data
    const messageData = {
      type: 'd20-roll',
      rolls: rollsArray,
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
      flavor: this.label,
      content: this.content,
      sound: CONFIG.sounds.dice,
      'flags.weirdwizard': {
        icon: this.icon,
        item: this.item?.uuid,
        rollHtml: rollHtml,
        emptyContent: !this.content ?? true
      }
    }
    
    await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    
    // Send to chat
    await ChatMessage.create(messageData);
  }

  /* -------------------------------------------- */

  _compareDispo(effTarget, compared) {
    const dispo = canvas.tokens.get(compared)?.document?.disposition;
    
    if ((effTarget === 'allies') && (dispo === 1)) return true;
    else if ((effTarget === 'enemies') && (dispo === -1)) return true;
    else if (effTarget === 'tokens') return true;
    else return false;
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

    game.user.targets.forEach(t => {
      const tDoc = t.document;
      const actor = tDoc?.actor;
      const sys = actor?.system;
      
      targets.push({
        id: t.id,
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

    // Add Weapon Damage
    const itemSystem = this.origin.system;
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
    this.item?.system?.instant?.forEach(e => {
      
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

    targets.forEach(t => {

      if (this._compareDispo(effTarget, t.id)) {
        if (targetIds) targetIds += ',';

        targetIds += t.id;
      }

    })

    return targetIds;
  }

}
