import { i18n } from '../helpers/utils.mjs'
//import { chatMessageButtonArray, diceTotalHtml } from '../sidebar/chat-html-templates.mjs';
import WWRoll from './roll.mjs';

/**
 * Extend FormApplication to make a prompt shown by damage rolls
 * @extends {FormApplication}
*/

export default class RollDamage extends FormApplication {

  constructor(obj) {
    super(); // This is required for the constructor to work
    
    // Assign variables
    this.origin = fromUuidSync(obj.originUuid);
    
    if (this.origin?.documentName === 'Item') {
      this.item = this.origin;
      this.isAttack = this.item.system.subtype == 'weapon' ? true : false;
      this.actor = this.origin.parent;
    } else {
      this.actor = this.origin;
    }

    this.targetIds = obj.targetIds ? obj.targetIds : '';
    this.baseDamage = obj.value;

    // Bonus Damage Variables
    this.bonusDamage = this.actor ? this.actor.system.stats.bonusdamage : '';
    this.usedBonusDamage = this.bonusDamage;

  }

  static get defaultOptions() {
    
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'roll-damage',
      title: 'WW.Damage.Details',
      classes: ['weirdwizard'],
      width: 400,
      height: 'auto',
      template: 'systems/weirdwizard/templates/apps/roll-damage.hbs'
    });

  }

  getData(options = {}) {
    let context = super.getData()
    
    // Pass data to application template.
    context.baseDamage = this.baseDamage;
    context.isAttack = this.isAttack;
    context.usedBonusDamage = this.usedBonusDamage;

    if (this.item) {
      context.label = this.item.name;
      context.system = this.item.system;
      context.brutal = this.item.system.traits?.brutal;
      context.versatile = this.item.system.traits?.versatile;
    }
    
    if (this.actor) {
      context.bonusDamage = this.actor.system.stats.bonusdamage;
      context.attackDice = this.actor.system.extraDamage?.attacks?.dice;
      context.attackMod = this.actor.system.extraDamage?.attacks?.mod;
    }
    
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    // Handle closing the window without saving
    html.find('#damage-cancel').click(() => this.close({ submit: false }))

    // Handle closing the window without saving
    html.find('.adjustment-widget > a').click((ev) => this._onBonusDamageAdjusted(ev));

    // Handle updated fields
    const el = html.find('input');
    el.change((ev) => this._updateFields(ev));
    el.change();

  }

  _onBonusDamageAdjusted(ev) {
    const a = ev.currentTarget;
    const parent = a.closest('.adjustment-widget');
    const action = a.dataset.action;
    
    this.usedBonusDamage = parseInt(parent.querySelector('input[type=number].bonus-damage').value);

    switch (action) {
      case 'up': {
        if (ev.shiftKey) {
          this.usedBonusDamage = this.bonusDamage; break;
        } else {
          this.usedBonusDamage++; break;
        }
      }

      case 'down': {
        if (ev.shiftKey) {
          this.usedBonusDamage = 0; break;
        } else {
          this.usedBonusDamage--; break;
        }
      }
    }
    
    this._updateFields(ev, this);
  }

  async _updateObject(event, formData) { // Triggers on submit
    
    this._onButtonSubmit(event);
    
  }

  // Update html fields
  _updateFields(ev) {
    const parent = ev.target.closest('#roll-damage');

    // Get checkbox values
    const applyBase = parent.querySelector('input[name=applyBase]:checked'),
      applyBothHands = parent.querySelector('input[name=bothHands]:checked'),
      applyAttackDice = parent.querySelector('input[name=attackDice]:checked'),
      applyAttackMod = parent.querySelector('input[name=attackMod]:checked'),

    // Get other field variables
      otherDice = parseInt(parent.querySelector('input[name=otherdice]').value),
      otherMod = parseInt(parent.querySelector('input[name=othermod]').value);

    // Update Bonus Damage
    this.usedBonusDamage = Math.min(Math.max(0, this.usedBonusDamage), this.bonusDamage)
    if (this.isAttack && this.bonusDamage) parent.querySelector('input[type=number].bonus-damage').value = this.usedBonusDamage;
    
    // Count extra damage dice
    let diceCount = 0;

    if (applyBothHands) diceCount += 1;
    if (applyAttackDice) diceCount += this.actor ? this.actor.system.extraDamage.attacks.dice : 0;
    if (otherDice) diceCount += otherDice;
    
    // Count extra damage modifier
    let modCount = 0;

    if (applyAttackMod) modCount += this.actor ? this.actor.system.extraDamage.attacks.mod : 0;
    if (otherMod) modCount += otherMod;

    // Create final dice expression

    const addDice = function(value, exp) {
      const prefix = exp ? ' + ' : '';
      return prefix + value + 'd6';
    }

    let exp = ''
    if (applyBase && this.baseDamage) exp += this.baseDamage;
    if (this.isAttack && this.usedBonusDamage) exp += addDice(this.usedBonusDamage, exp);
    if (diceCount) exp += addDice(diceCount, exp);
    if (modCount) exp += (exp ? ' + ' : '') + modCount;
    if (this.item?.system?.traits?.brutal) exp = exp.replace('d6', 'd6r1');
    
    // Display final expression
    this.finalExp = exp;
    parent.querySelector('.damage-expression').innerHTML = this.finalExp;
    
  }

  // On submit
  async _onButtonSubmit(event) {
    // Prepare apply button.
    const labelHtml = this.item ? i18n('WW.Damage.Of', { name: '<span class="owner-only">' + this.item.name + '</span><span class="non-owner-only">? ? ?</span>' }) : '';

    const dataset = {
      action: 'apply-damage',
      value: '',
      originUuid: this.origin?.uuid,
      targetIds: this.targetIds
    }

    // Prepare roll
    const rollData = this.actor ? this.actor.getRollData() : null;

    const r = await new WWRoll(this.finalExp, rollData, {
      template: "systems/weirdwizard/templates/chat/roll.hbs",
      dataset: dataset
    }).evaluate();
    
    dataset.value = await r.total;
    const rollArray= [r];
    
    const messageData = {
      type: 'd6-roll',
      rolls: rollArray,
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
      flavor: labelHtml,
      content: '',
      sound: CONFIG.sounds.dice,
      'flags.weirdwizard': {
        icon: this.item?.img,
        item: this.item?.uuid,
        emptyContent: true
      }
    };

    await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));

    // Send to chat
    await ChatMessage.create(messageData);

  }

}

