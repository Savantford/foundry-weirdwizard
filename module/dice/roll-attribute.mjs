import { i18n, plusify } from '../helpers/utils.mjs';
import WWRoll from './roll.mjs';

/**
 * Extend FormApplication to make a prompt shown by attribute and luck rolls
 * @extends {FormApplication}
*/

export default class RollAttribute extends FormApplication {

  constructor(obj) {
    super(); // This is required for the constructor to work
    this.data = obj;
    
    this.token = this.actor.token;
    this.baseHtml = obj.baseHtml;
    this.action = obj.action;
    this.system = this.actor.system; // Assign actor data
    const attKey = obj.attKey;

    // Assign label, name, etc
    this.label = obj.label;
    this.content = obj.content;
    this.icon = obj.icon ? obj.icon : (this.item ? this.item.img : null);
    this.name = attKey == 'luck' ? i18n('WW.Attributes.Luck') : this.system.attributes[attKey].label;
    this.effectBoons = this.system.boons.selfRoll[attKey] ?
      this.system.boons.selfRoll[attKey] : 0;
    this.actorBoons = this.system.boons;

    // Get fixed boons
    if (obj.fixedBoons) this.fixedBoons = obj.fixedBoons;
    else if (this.item?.system?.boons) this.fixedBoons = this.item.system.boons;
    else this.fixedBoons = 0;
    
    // Assign mod
    this.mod = this.system.attributes[attKey]?.mod ?
      plusify(this.system.attributes[attKey].mod) : '+0'; // If undefined, set it to +0

    this.attribute = attKey;
    this.against = this.item?.system?.against;
    this.boonsFinal = 0;

    // Tags
    this.tags = {
      isWeapon: this.item?.system?.subtype === 'weapon' ?? false,
      isAttack: (this.item?.system?.subtype === 'weapon' || this.against === 'def') ?? false,
      isMagical: this.item?.system?.magical,
      isSpell: this.item?.type === 'spell' ?? false
    }

  }

  static get defaultOptions() {
    
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "roll-attribute",
      title: this.title,
      classes: ['weirdwizard'],
      width: 400,
      height: "auto",
      template: "systems/weirdwizard/templates/apps/roll-attribute.hbs"
    });

  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  getData(options = {}) {
    const context = super.getData()
    
    // General data
    context.system = this.system;
    context.mod = this.mod;
    context.targeted = this.action === 'targeted-use' ?? false;
    context.targets = this.targets;
    context.tags = this.tags;

    // Boons
    context.fixedBoons = this.fixedBoons;
    context.effectBoons = this.effectBoons; // Conditional boons should be added here later
    context.attackBoons = this.actorBoons.selfRoll.attacks;
    context.spellBoons = this.actorBoons.selfRoll.spells;
    
    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  activateListeners(html) {
    super.activateListeners(html);

    // Handle closing the window without saving
    html.find('#boons-cancel').click(() => this.close({ submit: false }));

    // Handle closing the window without saving
    html.find('.adjustment-widget > a').click((ev) => this._onSituationalBoons(ev));

    // Update forms fields dynamically
    const el = html.find('input');
    el.change((ev) => this._updateFields(ev));
    el.change();

  }

  /* -------------------------------------------- */

  _onSituationalBoons(ev) {
    const a = ev.currentTarget;
    const parent = a.closest('.adjustment-widget');
    const action = a.dataset.action;

    let value = parseInt(parent.querySelector('input[type=number].situational').value);
    
    if (action === 'up') {
      value++;
    } else {
      value--;
    }
    
    parent.querySelector('input[type=number].situational').value = value;
    
    this._updateFields(ev);
  }

  /* -------------------------------------------- */

  async _updateObject(event, formData) { // Update actor data.
    const against = this.against,
      boonsFinal = this.boonsFinal,
      targeted = (this.action === 'targeted-use' || game.user.targets?.size) ? true : false,
      flat = formData.flat ? `+${formData.flat}` : '',
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
        const rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + flat + boons;

        // Get and set target number
        const targetNo = against == 'def' ? t.defense : t.attributes[against].value;
        
        // Construct the Roll instance and evaluate the roll
        const r = await new WWRoll(rollFormula, rollData, {
          template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
          originUuid: this.origin.uuid,
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
      const rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + flat + boons;

      // Set targetNo to the custom; 10 is used otherwise
      const targetNo = formData.targetno ? formData.targetno : 10;

      // Construct the Roll instance and evaluate the roll
      
      const r = await new WWRoll(rollFormula, rollData, {
        template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
        originUuid: this.origin.uuid,
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

  _updateFields(ev) { // Update html fields
    
    const parent = ev.target.closest('.roll-details'),
      against = this.against,
      fixedBoons = this.fixedBoons,
      applyAttackBoons = parent.querySelector('input[name=apply-attack-boons]:checked'),
      attackBoons = this.actorBoons.selfRoll.attacks,
      //applySpellBoons = parent.querySelector('input[name=apply-spell-boons]:checked'),
      spellBoons = this.actorBoons.selfRoll.spells,
      effectBoons = this.effectBoons, // Conditional boons should be added here later,
      flat = parent.querySelector('input[name=flat]').value ?? null;

    let boonsFinal = this.boonsFinal;

    // Set attribute display
    const attDisplay = (this.name ? `${this.name} (${this.mod})` : '1d20 + 0') + (flat ? ` + ${flat}` : '');

    // Calculate and display final boons
    boonsFinal = parseInt(parent.querySelector('input[type=number].situational').value); // Set boonsFinal to the situational input value
    if (effectBoons) boonsFinal += effectBoons; // If there are boons or banes applied by Active Effects, add it
    if (applyAttackBoons && attackBoons) boonsFinal += attackBoons;
    if (fixedBoons) boonsFinal += fixedBoons; // If there are fixed boons or banes, add it
    
    boonsFinal = (boonsFinal < 0 ? "" : "+") + boonsFinal; // Add a + sign if positive

    parent.querySelector('.boons-display.total').innerHTML = boonsFinal;
    this.boonsFinal = boonsFinal;

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

    // Set against display
    let againstDisplay = ' ' + i18n('WW.Roll.Against').toLowerCase() + ' ';

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

    parent.querySelector('.boons-expression').innerHTML = attDisplay + boonsDisplay + (against ? againstDisplay : '');

    // Targets display
    if (this.targets.length) {
      let targetsDisplay = '';
      
      this.targets.forEach(t => {
        // Boons against count
        let boonsAgainst = 0;
        if (t.boonsAgainst) boonsAgainst += t.boonsAgainst[against];
        if (this.tags.isAttack) boonsAgainst += t.boonsAgainst.fromAttacks;
        if (this.tags.isSpell) boonsAgainst += t.boonsAgainst.fromSpells;
        if (this.tags.isMagical) boonsAgainst += t.boonsAgainst.fromMagical + t.boons.resistMagical;
        
        // Boons display
        const boonsNo = boonsAgainst;
        const boonsTip = boonsNo > 0 ? i18n('WW.Boons.ExtraBoons') : i18n('WW.Boons.ExtraBanes');
        const boonsIcon = boonsNo > 0 ? 'boons-colored' : 'banes-colored';
        
        const againstIcon = CONFIG.WW.ATTRIBUTE_ICONS[against];
        const againstLabel = CONFIG.WW.ROLL_AGAINST[against];
        
        targetsDisplay += `<li><label><img class="target-icon" src="${t.img}" /> ${t.name}</label>`

        if (boonsNo != 0) targetsDisplay += `<div class="target-boons">(${boonsNo} <img src="/systems/weirdwizard/assets/icons/${boonsIcon}.svg" data-tooltip="${boonsTip}"/>)</div>`;

        targetsDisplay += `<div class="target-against" data-tooltip="${againstLabel}">${t.againstNo} <img src="${againstIcon}" /></div></li>`;
      });

      parent.querySelector('.boons-targets').innerHTML = targetsDisplay;
    }

    // Update app position/scaling
    this.setPosition();

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
  /*  Getters                                     */
  /* -------------------------------------------- */

  /** @override */
  get title() {
    const { constructor: id, name, type } = this.item ?? this.actor;
    return `${i18n('WW.Roll.Details')}: ${name ?? id}`;
  }

  get origin() {
    return fromUuidSync(this.data.origin);
  }

  get item() {
    return this.origin.documentName === 'Item' ? this.origin : null;
  }

  get actor() {
    return this.origin.documentName === 'Item' ? this.origin.parent : this.origin;
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
        againstNo: sys ? (this.against === 'def' ? sys.stats.defense.total : sys.attributes[this.against]?.value) : "—",
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
        originUuid: this.item?.uuid,
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
