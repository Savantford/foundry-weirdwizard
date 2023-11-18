import { i18n } from '../helpers/utils.mjs'
import { chatMessageButtonArray, diceTotalHtml } from '../chat/chat-html-templates.mjs';
import WWRoll from '../dice/roll.mjs';

/**
 * Extend FormApplication to make a prompt shown by damage rolls
 * @extends {FormApplication}
*/

export class RollDamage extends FormApplication {
  constructor(obj) {
    super(); // This is required for the constructor to work

    // Assign variables
    //this.component = obj.target; // Assign HTML component
    this.origin = fromUuidSync(obj.originUuid);
    
    if (this.origin.documentName === 'Item') {
      this.item = this.origin;
      this.actor = this.origin.parent;
    } else {
      this.actor = this.origin;
    }

    this.baseDamage = obj.value;
    this.target = canvas.tokens.get(obj.targetId);
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
    context.label = this.item.name;
    context.system = this.item.system;
    context.baseDamage = this.baseDamage;
    context.bonusDamage = this.actor.system.stats.bonusDamage;
    context.shattering = this.item.system.traits?.shattering;
    context.versatile = this.item.system.traits?.versatile;
    context.attackDice = this.actor.system.extraDamage.attacks.dice;
    context.attackMod = this.actor.system.extraDamage.attacks.mod;

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
    const parent = ev.target.closest('.damage-details'),
      bonusDamage = this.actor.system.stats.bonusDamage;

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
    if (applyAttackDice) diceCount += this.actor.system.extraDamage.attacks.dice;
    if (otherDice) diceCount += otherDice;
    
    // Count extra damage modifier
    let modCount = 0;

    if (applyAttackMod) modCount += this.actor.system.extraDamage.attacks.mod;
    if (otherMod) modCount += otherMod;

    // Add all dice and mods to finalExp
    this.finalExp = '';
    if (applyBase && this.baseDamage) this.finalExp += this._addDice(this.baseDamage);
    if (diceCount) this.finalExp += this._addDice(diceCount);
    if (applyBonus && bonusDamage) this.finalExp += this._addDice(bonusDamage);
    if (modCount) this.finalExp += ' + ' + modCount;

    // Display final expression
    parent.querySelector('.damage-expression').innerHTML = this.finalExp;
    
  }

  // On submit
  async _onButtonSubmit(event) {
    //const finalExp = event.target.querySelector('.damage-expression').innerHTML;

    // Prepare apply button.
    const labelHtml = i18n('WW.Damage.Of') + ' ' + '<span class="owner-only">' + this.item.name + '</span><span class="non-owner-only">? ? ?</span>';

    const dataset = {
      action: 'apply-damage',
      value: '',
      originUuid: this.origin.uuid,
      targetId: this.target.id
    }

    /*content += '<div class="apply-damage chat-button" data-token-id="' + await tid + '" data-damage="' + await r.total +
      '"><i class="fas fa-burst"></i>' + i18n('WW.Roll.DamageApply') + ' ' + tname + '</div>';*/
    
    // Prepare roll
    const r = await new WWRoll(this.finalExp).evaluate({async:true});
    dataset.value = await r.total;
    const rollArray= [r];
    const rollHtml = await diceTotalHtml(r);

    const messageData = {
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls: rollArray,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: labelHtml,
      content: '',
      sound: CONFIG.sounds.dice,
      'flags.weirdwizard': {
        item: this.item?.uuid,
        rollHtml: rollHtml + chatMessageButtonArray(dataset),
        emptyContent: true
      }
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
    const brutal = this.item.system.traits?.brutal;
    
    let exp = '';
    if (this.finalExp) exp += ' + ';
    diceExp.includes('d6') ? exp += diceExp + (brutal ? 'r1' : '') : exp += diceExp + (brutal ? 'd6r1' : 'd6');

    return exp;
  }
}

