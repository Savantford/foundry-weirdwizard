/**
 * Extend FormApplication to make a prompt shown by attribute and luck rolls
 * @extends {FormApplication}
*/

import { i18n, plusify } from '../helpers/utils.mjs';
import WWRoll from '../dice/roll.mjs';
import { diceTotalHtml, chatMessageButton } from '../chat/chat-html-templates.mjs';

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

    // Assign label, name and fixed boons/banes
    this.label = obj.label;
    this.content = obj.content;
    this.name = attKey == 'luck' ? 'Luck' : this.system.attributes[attKey].name;
    this.effectBoonsGlobal = this.system.boons.attributes[attKey].global ?
      this.system.boons.attributes[attKey].global : 0;
    this.attackBoons = this.system.boons.attacks.global;
    
    // Assign mod
    this.mod = this.system.attributes[attKey]?.mod ?
      plusify(this.system.attributes[attKey].mod) : '+0'; // If undefined, set it to +0

    this.against = this.item?.system?.against;
    this.boonsFinal = 0;

  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "roll-attribute";
    options.template = "systems/weirdwizard/templates/apps/roll-attribute.hbs";
    options.height = "auto";
    options.width = 400;
    options.title = "Roll Details";

    return options;
  }

  getData(options = {}) {
    let context = super.getData()

    // Pass data to application template.
    context.system = this.system;
    context.mod = this.mod;
    context.fixedBoons = this.item?.system?.boons;
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
    html.find('#boons-cancel').click(() => this.close({ submit: false }))

    // Update forms fields dynamically
    const el = html.find('input'); // html.find('input[type=number]')
    el.change((ev) => this._updateFields(ev, this));
    el.change();

    // Roll dice when the Roll button is clicked
    //html.find('#boons-submit').click(this._onFormSubmit.bind(this));

  }

  async _updateObject(event, formData) { // Update actor data.
    const against = this.against,
      boonsFinal = this.boonsFinal,
      originUuid = this.origin.uuid,
      targeted = this.action === 'targeted-use' ? true : false;
    ;

    let rollHtml = '',
      boons = "0",
      rollArray = []
    ;
    
    if (targeted && against) { // If Action is Targeted and Against is filled; perform one separate roll for each target
      for (const t of this.targets) {

        // Set boons text
        const boonsNo = parseInt(boonsFinal) + t.boonsAgainst[against];
        if (boonsNo != 0) { boons = (boonsNo < 0 ? "" : "+") + boonsNo + "d6kh" } else { boons = ""; };

        // Determine the rollFormula
        const rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + boons;

        // Get and set target number
        const targetNo = against == 'def' ? t.defense : t.attributes[against].value;

        // Construct the Roll instance and evaluate the roll
        let r = await new WWRoll(rollFormula, { targetNo: targetNo }).evaluate({async:true});

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
          targetHtml += this._addInstEffs(this.instEffs.onCritical, originUuid, t.id);
          this._applyEffects(this.effects.onCritical, t.id);

        } else if (success) {
          targetHtml += this._addWeaponDamage(t);
          targetHtml += this._addInstEffs(this.instEffs.onSuccess, originUuid, t.id);
          this._applyEffects(this.effects.onSuccess, t.id);

        } else {
          targetHtml += this._addInstEffs(this.instEffs.onFailure, originUuid, t.id);
          this._applyEffects(this.effects.onFailure, t.id);
        }

        // Add targetHtml to rollHtml
        rollHtml += this._targetHtml(t, targetHtml);

      };

    } else { // against is false; perform a single roll for all targets
      
      // Set boons text
      if (boonsFinal != 0) { boons = boonsFinal + "d6kh" } else { boons = ""; };

      // Determine the rollFormula
      const rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + boons;

      // Set targetNo to 10
      const targetNo = 10;

      // Construct the Roll instance and evaluate the roll
      let r = await new WWRoll(rollFormula, { targetNo: targetNo }).evaluate({async:true});

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
          for (const t of this.targets) {
            let targetHtml = this._addInstEffs(this.instEffs.onCritical, originUuid, t.id);
            this._applyEffects(this.effects.onCritical, t.id);
            rollHtml += this._targetHtml(t, targetHtml);
          }
  
        } else if (success) {
          for (const t of this.targets) {
            let targetHtml = this._addInstEffs(this.instEffs.onSuccess, originUuid, t.id);
            this._applyEffects(this.effects.onSuccess, t.id);
            rollHtml += this._targetHtml(t, targetHtml);
          }
  
        } else {
          for (const t of this.targets) {
            let targetHtml = this._addInstEffs(this.instEffs.onFailure, originUuid, t.id);
            this._applyEffects(this.effects.onFailure, t.id);
            rollHtml += this._targetHtml(t, targetHtml);
          }
        }

      } else { // Roll is untargeted

        if (critical) {
          rollHtml += this._addInstEffs(this.instEffs.onCritical, originUuid);
  
        } else if (success) {
          rollHtml += this._addInstEffs(this.instEffs.onSuccess, originUuid);
  
        } else {
          rollHtml += this._addInstEffs(this.instEffs.onFailure, originUuid);
        }

      }

    }
    
    // Create message data
    const messageData = {
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls: rollArray,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: this.label,
      content: this.content,
      sound: CONFIG.sounds.dice,
      'flags.weirdwizard': {
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
    const parent = ev.target.closest('.boons-details');
    let boonsFinal = context.boonsFinal;
    const against = context.against;
    const fixedBoons = context.item?.system?.boons ? context.item.system.boons : 0;
    const applyAttackBoons = parent.querySelector('input[name=attack]:checked');
    const attackBoons = context.attackBoons;
    const effectBoons = context.effectBoonsGlobal; // Conditional boons should be added here later

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
        againstDisplay += i18n('WW.Strength');
        break;
      }
      case 'agi': {
        againstDisplay += i18n('WW.Agility');
        break;
      }
      case 'int': {
        againstDisplay += i18n('WW.Intellect');
        break;
      }
      case 'wil': {
        againstDisplay += i18n('WW.Will');
        break;
      }
    }

    parent.querySelector('.boons-expression').innerHTML = attDisplay + boonsDisplay + (against ? againstDisplay : '');

    // Targets display
    if (this.action === 'targeted-use') {
      let targetsDisplay = '';

      context.targets.forEach(t => {
        const boonsNo = t.boonsAgainst[against];

        targetsDisplay += '<p>' + t.name;

        if (boonsNo > 1) targetsDisplay += ': ' + boonsNo + ' ' + i18n('WW.Boons.ExtraBoons')
        else if (boonsNo == 1) targetsDisplay += ': ' + boonsNo + ' ' + i18n('WW.Boons.ExtraBoon');

        targetsDisplay += '</p>';
      });

      parent.querySelector('.boons-targets').innerHTML = targetsDisplay;
    }

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
        targetId: target.id,
        value: weaponDamage
      });
    }

    return finalHtml;
  }

  _addInstEffs(effects, origin, target) {
    
    if (!target) target = '';

    let finalHtml = '';
    
    effects.forEach(e => {
      let html = '';
        
      if (e.target === 'self') target = this.token.uuid;
        
      if (e.label === 'affliction') html = chatMessageButton({
        action: this.actionFromLabel(e.label),
        value: e.affliction,
        originUuid: origin,
        targetId: target
      });

      else html = chatMessageButton({
        action: this.actionFromLabel(e.label),
        value: e.value,
        originUuid: origin,
        targetId: target
      });
      
      finalHtml += html;
    })
    
    return finalHtml;
  }

  async _applyEffects(effects, target) {
    
    effects.forEach(e => {

      if (e.target == 'tokens') {
        let obj = e.toObject()
        obj.flags.weirdwizard.trigger = 'passive';
        
        const actor = canvas.tokens.get(target).actor;
        
        actor.createEmbeddedDocuments("ActiveEffect", [obj]);
      }

    })

  }

  /* Prepare action string from label string */
  actionFromLabel(label) {
    let action = '';

    switch (label) {
      case ('damage'): action = 'roll-damage'; break;
      case ('heal'): action = 'roll-healing'; break;
      case ('healthLose'): action = 'roll-health-loss'; break;
      case ('healthRecover'): action = 'roll-health-recovery'; break;
      case ('affliction'): action = 'apply-affliction'; break;
    }
    
    return action;
  }

  // Prepare html for the target
  _targetHtml(target, html) {
    if ((target.id === undefined) || !this.item) return (html ? html : '');

    else return '<p class="owner-only chat-target">' + i18n('WW.Target') + ': ' + target.name + '</p><p class="non-owner-only chat-target">' + i18n('WW.Target') +
      ': ???</p><div class="chat-target-content">' + html + '</div>';
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */
  
  get targets() {
    const targets = [];
    
    //if (game.user.targets.size) { // Get targets if they exist

      game.user.targets.forEach(t => {
        targets.push({
          id: t.id,
          name: t.document.name,
          attributes: t.document.actor.system.attributes,
          defense: t.document.actor.system.stats.defense.total,
          boonsAgainst: t.document.actor.system.boons.against
        })
      });

    /*} else { // Get self as a target if none is selected

      targets.push({
        id: this.token?.id,
        name: this.token?.name,
        attributes: this.actor.system.attributes,
        defense: this.actor.system.stats.defense.total,
        boonsAgainst: this.actor.system.boons.against
      })

    }*/

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
}

function _secretLabel(label) {
  return '<span class="owner-only">' + label + '</span><span class="non-owner-only">? ? ?</span>'
}