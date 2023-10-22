/**
 * Extend FormApplication to make a prompt shown by damage rolls
 * @extends {FormApplication}
*/

import { i18n } from '../helpers/utils.mjs'

export class rollDamage extends FormApplication {
  constructor(obj) {
    super(); // This is required for the constructor to work

    // Assign variables
    this.component = obj.target; // Assign HTML component
    this.actor = obj.actor;
    this.system = obj.actor.system; // Assign actor data
    this.name = obj.name;
    this.label = obj.label;
    this.baseDamage = obj.baseDamage;
    this.bonusDamage = obj.bonusDamage;
    this.properties = obj.properties;
    this.brutal = obj.properties.brutal;
    this.attackDice = obj.actor.system.extraDamage.attacks.dice;
    this.attackMod = obj.actor.system.extraDamage.attacks.mod;
    this.target = obj.target.dataset.targetId;
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = 'roll-damage';
    options.template = 'systems/weirdwizard/templates/apps/roll-damage.hbs';
    options.height = 'auto';
    options.width = 400;
    options.title = 'Damage Dice';

    return options;
  }

  getData(options = {}) {
    let context = super.getData()

    // Pass data to application template.
    context.label = this.name;
    context.system = this.system;
    context.baseDamage = this.baseDamage;
    context.bonusDamage = this.bonusDamage;
    context.shattering = this.properties.shattering;
    context.versatile = this.properties.versatile;
    context.attackDice = this.attackDice;
    context.attackMod = this.attackMod;

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    // Handle closing the window without saving
    html.find('#damage-cancel').click(() => this.close({ submit: false }))

    // Handle updated fields
    const el = html.find('input');
    el.change((ev) => this._updateFields(ev));
    el.change();

  }

  async _updateObject(event, formData) { // Triggers on submit
    
    this._onButtonSubmit(event);
    
  }

  // Update html fields
  _updateFields(ev) {
    const parent = ev.target.closest('.damage-details');

    // Get checkbox values
    let applyBase = parent.querySelector('input[name=applyBase]:checked');
    let applyBothHands = parent.querySelector('input[name=bothHands]:checked');
    let applyShattering = parent.querySelector('input[name=shattering]:checked');
    let applyAttackDice = parent.querySelector('input[name=attackDice]:checked');
    let applyAttackMod = parent.querySelector('input[name=attackMod]:checked');
    let applyBonus = parent.querySelector('input[name=applyBonus]:checked');

    // Get other field variables
    let otherDice = parseInt(parent.querySelector('input[name=otherdice]').value);
    let otherMod = parseInt(parent.querySelector('input[name=othermod]').value);
    
    // Count extra damage dice
    let diceCount = 0;

    if (applyBothHands) diceCount += 1;
    if (applyShattering) diceCount += 1;
    if (applyAttackDice) diceCount += this.attackDice;
    if (otherDice) diceCount += otherDice;
    
    // Count extra damage modifier
    let modCount = 0;

    if (applyAttackMod) modCount += this.attackMod;
    if (otherMod) modCount += otherMod;

    // Add all dice and mods to finalExp
    this.finalExp = '';
    if (applyBase && this.baseDamage) this.finalExp += this._addDice(this.baseDamage);
    if (diceCount) this.finalExp += this._addDice(diceCount);
    if (applyBonus && this.bonusDamage) this.finalExp += this._addDice(this.bonusDamage);
    if (modCount) this.finalExp += ' + ' + modCount;

    // Display final expression
    parent.querySelector('.damage-expression').innerHTML = this.finalExp;
    
  }

  // On submit
  async _onButtonSubmit(event) {
    const finalExp = event.target.querySelector('.damage-expression').innerHTML;

    // Construct the Roll instance
    let r = new Roll(finalExp);

    // Execute the roll
    await r.evaluate();

    // Prepare result to display.
    let content = '<h4 class="dice-result">' + await r.render() + '</h4>';

    // Prepare apply button.
    const tid = await canvas.tokens.get(this.target).id;
    const tname = await canvas.tokens.get(this.target).name;
    content += '<div class="damage-apply chat-button" data-token-id="' + await tid + '" data-damage="' + await r.total +
      '"><i class="fas fa-burst"></i>' + i18n('WW.Roll.DamageApply') + ' ' + tname + '</div>';

    // Create message data
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: i18n('WW.Damage.Of') + ' ' + this.label,
      content: content,
      sound: CONFIG.sounds.dice
    };

    await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));

    // Send to chat
    await ChatMessage.create(messageData);

    // The resulting equation after it was rolled
    console.log('Formula = ' + r.formula + '\nResult = ' + r.result + '\nTotal = ' + r.total);   // 16 + 2 + 4; 22

  }

  _addDice(diceExp) {
    if (!diceExp) return '';
    diceExp = '' + diceExp; // Make sure diceExp is a string
    
    let exp = '';
    if (this.finalExp) exp += ' + ';
    diceExp.includes('d6') ? exp += diceExp + (this.brutal ? 'r1' : '') : exp += diceExp + (this.brutal ? 'd6r1' : 'd6')

    return exp;
  }
}

