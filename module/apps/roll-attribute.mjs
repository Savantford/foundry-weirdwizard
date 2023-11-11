/**
 * Extend FormApplication to make a prompt shown by attribute and luck rolls
 * @extends {FormApplication}
*/

import { i18n, plusify } from '../helpers/utils.mjs';
import WWRoll from '../dice/roll.mjs';

export default class rollAttribute extends FormApplication {
  constructor(obj) {
    super(); // This is required for the constructor to work
    this.component = obj.target; // Assign HTML component
    this.token = obj.token;
    this.actor = obj.token ? this.token.actor : obj.actor;
    this.baseHtml = obj.baseHtml;
    this.system = this.actor.system; // Assign actor data
    const attKey = obj.attKey;

    // Assign label, name and fixed boons/banes
    this.label = obj.label;
    this.content = obj.content;
    this.name = attKey == 'luck' ? 'Luck' : this.system.attributes[attKey].name;
    this.effectBoonsGlobal = this.system.boons.attributes[attKey].global ?
      this.system.boons.attributes[attKey].global : 0;
    this.attackBoons = this.system.boons.attacks.global;

    // Get item data
    this.item = obj.item;
    
    // Assign mod
    this.mod = this.system.attributes[attKey]?.mod ?
      plusify(this.system.attributes[attKey].mod) : '+0'; // If undefined, set it to +0

    this.against = this.item.system?.against;
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
    context.needTargets = this.item?.system?.against;

    if (this.item?.effects) {
      for (const e of this.item.effects) {
        if (e.target == 'tokens') context.needTargets = true;
      }
    }

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
    html.find('#boons-submit').click(this._onFormSubmit.bind(this));

  }

  async _updateObject(event, formData) { // Update actor data.
    //
    /*this.object.update({
        'system.stats.health': {
        'starting': formData.starting,
        'novice': formData.novice,
        'expert': formData.expert,
        'master': formData.master,
        'bonus': formData.bonus,
        'lost': formData.lost
        }
    })*/
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
    if (this.needTargets) {
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

  async _onFormSubmit() {
    let rollHtml = '';
    const successHtml = '<div class="chat-success">' + game.i18n.format('WW.Roll.Success') + '</div>';
    const criticalHtml = '<div class="chat-success">' + game.i18n.format('WW.Roll.CriticalSuccess') + '!</div>';
    const failureHtml = '<div class="chat-failure">' + game.i18n.format('WW.Roll.Failure') + '</div>';

    const against = this.against;
    const boonsFinal = this.boonsFinal;
    let boons = "0";
    let rollArray = [];

    if (against) { // Against is filled; perform one separate roll for each target
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
        rollHtml += this._targetHtml(t.name);
        rollHtml += await this._diceTotalHtml(r);
        
        // Evaluate target number
        const success = await r.total >= targetNo;
        const critical = await r.total >= 20 && await r.total >= targetNo + 5;
        
        if (critical) {
          rollHtml += criticalHtml;
          rollHtml += this.baseHtml[t.id];
          rollHtml += this._addWeaponDamage(t);
          rollHtml += this._addInstEffs(this.instEffs.onCritical, t);
          this._applyEffects(this.effects.onCritical, t);

        } else if (success) {
          rollHtml += successHtml;
          rollHtml += this.baseHtml[t.id];
          rollHtml += this._addWeaponDamage(t);
          rollHtml += this._addInstEffs(this.instEffs.onSuccess, t);
          this._applyEffects(this.effects.onSuccess, t);

        } else {
          rollHtml += failureHtml;
          rollHtml += this.baseHtml[t.id];
          rollHtml += this._addInstEffs(this.instEffs.onFailure, t);
          this._applyEffects(this.effects.onFailure, t);
        }

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

      // Add roll result to the chat message
      rollHtml += await this._diceTotalHtml(r);

      // Evaluate target number
      const success = await r.total >= targetNo;
      const critical = await r.total >= 20 && await r.total >= targetNo + 5;

      if (critical) {
        rollHtml += criticalHtml;

        for (const t of this.targets) {
          rollHtml += this._targetHtml(t.name);
          rollHtml += this.baseHtml[t.id];
          rollHtml += this._addInstEffs(this.instEffs.onCritical, t);
          this._applyEffects(this.effects.onCritical, t);
        }

      } else if (success) {
        rollHtml += successHtml;
        
        for (const t of this.targets) {
          rollHtml += this._targetHtml(t.name);
          rollHtml += this.baseHtml[t.id];
          rollHtml += this._addInstEffs(this.instEffs.onSuccess, t);
          this._applyEffects(this.effects.onSuccess, t);
        }

      } else {
        rollHtml += failureHtml;
        
        for (const t of this.targets) {
          rollHtml += this._targetHtml(t.name);
          rollHtml += this.baseHtml[t.id];
          rollHtml += this._addInstEffs(this.instEffs.onFailure, t);
          this._applyEffects(this.effects.onFailure, t);
        }
      }

    }

    // Create message data
    console.log(rollArray)
    
    const messageData = {
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls: rollArray,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: this.label,
      content: this.content + rollHtml,
      sound: CONFIG.sounds.dice
    };
    
    await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    
    // Send to chat
    await ChatMessage.create(messageData);
  }

  _addWeaponDamage(t) {
    let finalHtml = '';

    // Get Variables
    const itemSystem = this.item.system;
    const weaponDamage = (itemSystem.subtype == 'weapon' && itemSystem.damage) ? itemSystem.damage : 0;
    const target = canvas.tokens.get(t.id);

    if (weaponDamage) {
      finalHtml = this.prepareHtmlButton(target, weaponDamage, 'damage');
    }

    return finalHtml;
  }

  _addInstEffs(effects, t) {
    let finalHtml = '';
    effects.forEach(e => {
      let html = '';
        
        let target = canvas.tokens.get(t.id);
        
        if (e.target === 'self') target = canvas.tokens.get(this.token.id);
        
        if (e.label === 'affliction') html = this.prepareHtmlButton(target, e.affliction, e.label);
        else html = this.prepareHtmlButton(target, e.value, e.label);
      
      finalHtml += html;
    })
    
    return finalHtml;
  }

  async _applyEffects(effects, t) {

    effects.forEach(e => {

      if (e.target == 'tokens') {
        let obj = e.toObject()
        obj.flags.weirdwizard.trigger = 'passive';
        
        const target = canvas.tokens.get(t.id).actor;
        target.createEmbeddedDocuments("ActiveEffect", [obj]);
      }

    })

  }

  prepareHtmlButton(target, value, label) {
    let icon = '';
    let loc = '';
    let cls = '';

    switch (label) {
      case 'damage': {
        icon = 'burst';
        loc = 'WW.InstantEffect.Roll.Damage';
        cls = 'damage-roll';
        break;
      }
      case 'heal': {
        icon = 'sparkles';
        label = 'healing';
        loc = 'WW.InstantEffect.Roll.Heal';
        cls = 'healing-roll';
        break;
      }
      case 'healthLose': {
        icon = 'droplet';
        loc = 'WW.InstantEffect.Roll.HealthLose';
        cls = 'health-loss-roll';
        break;
      }
      case 'healthRecover': {
        icon = 'suitcase-medical';
        loc = 'WW.InstantEffect.Roll.HealthRecover';
        cls = 'health-recovery-roll';
        break;
      }
      case 'affliction': {
        icon = 'skull-crossbones';
        loc = 'WW.InstantEffect.Affliction';
        cls = 'bestow-affliction';
        break;
      }
    }

    const html = '<div class="'+ cls + ' chat-button" data-item-id="' + this.item._id +
    '"  data-actor-id="' + this.actor._id +
    '" data-target-id="' + target.id +
    '" data-' + label + '="' + value +
    '"><i class="fas fa-' + icon + '"></i>' + i18n(loc) + ': ' + value + '</div>';
    return html;
  }

  // Prepare html for the target
  _targetHtml(name) {
    return '<p class="owner-only chat-target">' + i18n('WW.Target') + ': ' + name + '</p><p class="non-owner-only chat-target">' + i18n('WW.Target') + ': ???</p>';
  }

  // Prepare html for Dice Total
  async _diceTotalHtml(r) {
    
    return '<span class="owner-only">' + await r.render() + '</span><h4 class="secret-dice-total non-owner-only">' + await r.total + '</h4>';
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

  get effects() {
    let effs = {
      onUse: [],
      onSuccess: [],
      onCritical: [],
      onFailure: []
    }

    this.item?.effects?.forEach(e => {

      switch (e.trigger) {
        case 'onUse': effs.onUse.push(e); break;
        case 'onSuccess': effs.onSuccess.push(e); break;
        case 'onCritical': effs.onSuccess.push(e); effs.onCritical.push(e); break;
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
        case 'onUse': effs.onUse.push(e); break;
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