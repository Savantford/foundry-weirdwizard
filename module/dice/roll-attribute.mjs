import { actionFromLabel, buttonsHeader, chatMessageButton, diceTotalHtml, targetHeader } from '../chat/chat-html-templates.mjs';
import { i18n, plusify } from '../helpers/utils.mjs';
import WWRoll from '../dice/roll.mjs';

/**
 * Extend FormApplication to make a prompt shown by attribute and luck rolls
 * @extends {FormApplication}
*/

export default class RollAttribute extends FormApplication {
  constructor(obj) {
    super(); // This is required for the constructor to work
    
    this.origin = fromUuidSync(obj.origin);
    
    if (this.origin.documentName === 'Item') {
      this.item = this.origin;
      this.actor = this.origin.parent;
    } else {
      this.actor = this.origin;
    }
    
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
    this.effectBoonsGlobal = this.system.boons.attributes[attKey].global ?
      this.system.boons.attributes[attKey].global : 0;
    this.attackBoons = this.system.boons.attacks.global;

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

  }

  static get defaultOptions() {
    //const options = super.defaultOptions;
    return mergeObject(super.defaultOptions, {
      id: "roll-attribute",
      title: "Roll Details",
      classes: ['weirdwizard'],
      width: 400,
      height: "auto",
      template: "systems/weirdwizard/templates/apps/roll-attribute.hbs"
    });

    //return options;
  }

  getData(options = {}) {
    let context = super.getData()

    // Pass data to application template.
    context.system = this.system;
    context.mod = this.mod;
    context.fixedBoons = this.fixedBoons;
    context.effectBoons = this.effectBoonsGlobal; // Conditional boons should be added here later
    context.attackBoons = this.attackBoons;
    context.targeted = this.action === 'targeted-use' ? true : false;

    /*if (this.item?.effects) {
      for (const e of this.item.effects) {
        if (e.target == 'tokens') context.needTargets = true;
      }
    }*/

    return context
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Handle closing the window without saving
    html.find('#boons-cancel').click(() => this.close({ submit: false }));

    // Handle closing the window without saving
    html.find('.boons-situational > a').click((ev) => this._onSituationalBoons(ev));

    // Update forms fields dynamically
    const el = html.find('input'); // html.find('input[type=number]')
    el.change((ev) => this._updateFields(ev, this));
    el.change();

  }

  _onSituationalBoons(ev) {
    const a = ev.currentTarget;
    const parent = a.closest('.boons-situational');
    const action = a.dataset.action;

    let value = parseInt(parent.querySelector('input[type=number].situational').value);
    
    if (action === 'up') {
      value++;
    } else {
      value--;
    }
    
    parent.querySelector('input[type=number].situational').value = value;

    this._updateFields(ev, this);
  }

  async _updateObject(event, formData) { // Update actor data.
    console.log(game.user.targets?.size)
    const against = this.against,
      boonsFinal = this.boonsFinal,
      originUuid = this.origin.uuid,
      targeted = (this.action === 'targeted-use' || game.user.targets?.size) ? true : false;
    ;

    let rollHtml = '',
      boons = "0",
      rollArray = []
    ;
    
    if (targeted && against) { // If Action is Targeted and Against is filled; perform one separate roll for each target

      for (const t of this.targets) {

        // Set boons text
        const boonsNo = parseInt(boonsFinal) + (t.boonsAgainst ? t.boonsAgainst[against] : 0);
        if (boonsNo != 0) { boons = (boonsNo < 0 ? "" : "+") + boonsNo + "d6kh" } else { boons = ""; };

        // Determine the rollFormula
        const rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + boons;

        // Get and set target number
        const targetNo = against == 'def' ? t.defense : t.attributes[against].value;

        // Construct the Roll instance and evaluate the roll
        let r = await new WWRoll(rollFormula, { targetNo: targetNo, attribute: this.attribute, against: against }, { template: "systems/weirdwizard/templates/chat/roll.hbs" }).evaluate({async:true});

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
        rollArray.push(r);

        // Add the target name, the roll result and the onUse instant effects to the chat message
        let targetHtml = await diceTotalHtml(r);
        
        // Evaluate target number
        const success = await r.total >= targetNo;
        const critical = await r.total >= 20 && await r.total >= targetNo + 5;
        
        if (critical) {
          targetHtml += this._addWeaponDamage(t);
          targetHtml += this._addEffectButtons('onCritical', { target: t.id });

        } else if (success) {
          targetHtml += this._addWeaponDamage(t);
          targetHtml += this._addEffectButtons('onSuccess', { target: t.id });

        } else {
          targetHtml += this._addEffectButtons('onFailure', { target: t.id });
        }

        // Add targetHtml to rollHtml
        rollHtml += targetHeader(t, targetHtml, !this.item);

      };

    } else { // against is false; perform a SINGLE ROLL for all targets
      
      // Set boons text
      if (boonsFinal != 0) { boons = boonsFinal + "d6kh" } else { boons = ""; };

      // Determine the rollFormula
      const rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + boons;

      // Set targetNo to the custom
      const targetNo = formData.targetno ? formData.targetno : '';

      // Construct the Roll instance and evaluate the roll
      let r = await new WWRoll(rollFormula, { targetNo: targetNo, attribute: this.attribute, against: against }, { template: "systems/weirdwizard/templates/chat/roll.hbs" }).evaluate({async:true});

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
      rollArray.push(r);

      // Add the target name, the roll result and the onUse instant effects to the chat message
      rollHtml += await diceTotalHtml(r);

      // Evaluate target number
      const success = await r.total >= targetNo;
      const critical = await r.total >= 20 && await r.total >= targetNo + 5;
      
      if (targeted) { // Roll is targeted

        if (critical) {
          rollHtml += this._addWeaponDamage();
          rollHtml += this._addEffectButtons('onCritical', { singleRoll: true });
  
        } else if (success) {
          rollHtml += this._addWeaponDamage();
          rollHtml += this._addEffectButtons('onSuccess', { singleRoll: true });
  
        } else {
          rollHtml += this._addEffectButtons('onFailure', { singleRoll: true });
        }

      } else { // Roll is untargeted

        if (critical) {
          rollHtml += this._addWeaponDamage();
          rollHtml += this._addEffectButtons('onCritical');
  
        } else if (success) {
          rollHtml += this._addWeaponDamage();
          rollHtml += this._addEffectButtons('onSuccess');
  
        } else {
          rollHtml += this._addEffectButtons('onFailure');
        }

      }

    }
    
    // Create message data
    const messageData = {
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls: rollArray,
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
    };
    
    await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    
    // Send to chat
    await ChatMessage.create(messageData);
  }

  _updateFields(ev, context) { // Update html fields
    
    const parent = ev.target.closest('.roll-details'),
      against = context.against,
      fixedBoons = context.fixedBoons,
      applyAttackBoons = parent.querySelector('input[name=attack]:checked'),
      attackBoons = context.attackBoons,
      effectBoons = context.effectBoonsGlobal; // Conditional boons should be added here later

    let boonsFinal = context.boonsFinal;

    // Set attribute display
    const attDisplay = context.name ? context.name + " (" + context.mod + ")" : '1d20 + 0';

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
    if (this.action === 'targeted-use') {
      let targetsDisplay = '';
      
      context.targets.forEach(t => {
        const boonsNo = t.boonsAgainst ? t.boonsAgainst[against] : 0;
        const extraBoons = boonsNo > 1 ? i18n('WW.Boons.ExtraBoons') : i18n('WW.Boons.ExtraBoon');
        const againstIcon = CONFIG.WW.ATTRIBUTE_ICONS[against];
        
        targetsDisplay += `<li><label><img class="target-icon" src="${t.icon}" /> ${t.name}</label>`

        if (boonsNo >= 1) targetsDisplay += `<div class="target-boons">(${boonsNo} <img src="/systems/weirdwizard/assets/icons/boons-colored.svg" data-tooltip="${extraBoons}"/>)</div>`;

        targetsDisplay += `<div class="target-against">${t.againstNo} <img src="${againstIcon}"/></div></li>`;
      });

      parent.querySelector('.boons-targets').innerHTML = targetsDisplay;
    }

    // Update app position/scaling
    this.setPosition();

  }

  _addWeaponDamage(target) {
    let finalHtml = '';

    // Get Variables
    const itemSystem = this.origin.system;
    const weaponDamage = (itemSystem.subtype == 'weapon' && itemSystem.damage) ? itemSystem.damage : 0;

    if (weaponDamage) {
      finalHtml = chatMessageButton({
        action: 'roll-damage',
        originUuid: this.item?.uuid,
        targetId: target ? target.id : "",
        value: weaponDamage
      });
    }

    return finalHtml;
  }

  _addEffectButtons(trigger, options = { target: null, singleRoll: false }) {
    const origin = this.origin.uuid,
      instEffs = this.instEffs[trigger],
      actEffs = this.effects[trigger],
      target = options.target,
      targets = target ? this.targets.filter(t => t.id === target) : this.targets;
    
    let finalHtml = '',
      anyHtml = '',
      enemiesHtml = '',
      alliesHtml = ''
    ;
    
    // Handle instant effects
    instEffs.forEach(e => {
      let html = '';
      
      if (e.target === 'self') targets = this.token.uuid;

      // Get target ids string
      const targetIds = this._getTargetIds(targets, e.target);

      // Create the chat button
      if (e.label === 'affliction') html = chatMessageButton({
        action: actionFromLabel(e.label),
        value: e.affliction,
        originUuid: origin,
        targetIds: targetIds
      });

      else html = chatMessageButton({
        action: actionFromLabel(e.label),
        value: e.value,
        originUuid: origin,
        targetIds: targetIds
      });
      
      // Assign to group html
      switch (e.target) {
        case 'tokens': anyHtml += html; break;
        case 'enemies': enemiesHtml += html; break;
        case 'allies': alliesHtml += html; break;
      }
      
    })

    // Handle active effects
    actEffs.forEach(e => {

      let html = '';
      
      if (e.target === 'self') targets = this.token.uuid;

      // Get target ids string
      const targetIds = this._getTargetIds(targets, e.target);

      // Create the chat button
      html = chatMessageButton({
        action: 'apply-effect',
        originUuid: origin,
        targetIds: targetIds,
        value: '',
        effectUuid: e.uuid
      });
      
      // Assign to group html
      switch (e.target) {
        case 'tokens': anyHtml += html; break;
        case 'enemies': enemiesHtml += html; break;
        case 'allies': alliesHtml += html; break;
      }

    })
    
    // Add htmls to finalHtml
    if (options.singleRoll) {
      if (anyHtml) finalHtml += buttonsHeader(anyHtml, 'Any', !this.item);
      if (enemiesHtml) finalHtml += buttonsHeader(enemiesHtml, 'Enemies', !this.item);
      if (alliesHtml) finalHtml += buttonsHeader(alliesHtml, 'Allies', !this.item);
      
    } else {
      finalHtml += '<div class="chat-buttons">';
      if (anyHtml) finalHtml += anyHtml;
      if (enemiesHtml) finalHtml += enemiesHtml;
      if (alliesHtml) finalHtml += alliesHtml;
      finalHtml += '</div>';
    }
    
    return finalHtml;
  }

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
  
  get targets() {
    const targets = [];

    game.user.targets.forEach(t => {
      const tDoc = t.document;
      const actor = tDoc?.actor;
      const sys = actor?.system;
      
      targets.push({
        id: t.id,
        icon: tDoc?.texture?.src,
        name: game.weirdwizard.utils.getAlias({ token: tDoc, actor: actor }),
        attributes: actor ? sys.attributes : null,
        defense: actor ? sys.stats.defense.total : null,
        againstNo: sys ? (this.against === 'def' ? sys.stats.defense.total : sys.attributes[this.against]?.value) : "—",
        boonsAgainst: actor ? sys.boons.against : null
      })

    });

    return targets
  }

  get effects() {
    let effs = {
      onUse: [],
      onSuccess: [],
      onCritical: [],
      onFailure: []
    }
    
    this.item?.effects?.forEach(e => {
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

  get instEffs() {
    let effs = {
      onUse: [],
      onSuccess: [],
      onCritical: [],
      onFailure: []
    }
    
    this.item?.system?.instant?.forEach(e => {
      
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

function _secretLabel(label) {
  return '<span class="owner-only">' + label + '</span><span class="non-owner-only">? ? ?</span>'
}
